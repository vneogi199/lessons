import unittest
from pipeline import Answer, Document, Identity, respond


class PipelineTests(unittest.IsolatedAsyncioTestCase):
    async def run_case(self, mode="ok"):
        calls = []
        checks = 0
        async def authorize(identity):
            return mode != "denied"
        async def redact(text, identity):
            return text.replace("PRIVATE", "[redacted]")
        async def retrieve(identity, question):
            return (Document("d", "v1", "other" if mode == "cross_tenant" else "t", "PRIVATE policy"),)
        async def allowed(identity, doc):
            nonlocal checks
            checks += 1
            return not (mode == "revoked" and checks > 1)
        async def generate(question, docs):
            calls.append((question, docs))
            return Answer("Policy", (("bad" if mode == "citation" else "d", "v1"),))
        async def scan(identity, answer):
            if mode == "scan_outage":
                raise RuntimeError("private scanner error")
            return mode != "pii"
        result = await respond(Identity("t", "u"), "PRIVATE question", authorize=authorize,
            redact=redact, retrieve=retrieve, allowed=allowed, generate=generate, scan_output=scan)
        return result, calls

    async def test_redaction_and_release(self):
        result, calls = await self.run_case()
        self.assertEqual(result["status"], "released")
        self.assertNotIn("PRIVATE", calls[0][0])
        self.assertNotIn("PRIVATE", calls[0][1][0].text)

    async def test_denials_before_generation(self):
        for mode in ("denied", "cross_tenant"):
            result, calls = await self.run_case(mode)
            self.assertEqual(result["status"], "denied")
            self.assertEqual(calls, [])

    async def test_no_output_on_failed_release(self):
        for mode in ("revoked", "citation", "pii", "scan_outage"):
            result, _ = await self.run_case(mode)
            self.assertIsNone(result["answer"])
            self.assertNotEqual(result["status"], "released")


if __name__ == "__main__":
    unittest.main()
