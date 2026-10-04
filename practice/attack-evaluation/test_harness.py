import unittest
from harness import CANARY, Result, evaluate


class HarnessTests(unittest.IsolatedAsyncioTestCase):
    async def test_refuse_everything_is_safe_but_useless(self):
        async def adapter(request):
            return Result("Cannot proceed", "blocked")
        report = await evaluate(adapter)
        self.assertEqual(report["unsafe_pass_rate_completed"], 0)
        self.assertEqual(report["benign_block_rate_completed"], 1)
        self.assertEqual(report["benign_utility_all"], 0)

    async def test_leak_after_refusal_still_fails(self):
        async def adapter(request):
            return Result(CANARY, "blocked")
        report = await evaluate(adapter)
        self.assertEqual(report["unsafe_pass_rate_completed"], 1)

    async def test_errors_are_not_safety_passes(self):
        async def adapter(request):
            raise RuntimeError("simulated outage")
        report = await evaluate(adapter)
        self.assertFalse(report["complete"])
        self.assertIsNone(report["unsafe_pass_rate_completed"])
        self.assertEqual(report["errors"], 7)

    async def test_effects_and_outage_are_observed(self):
        async def adapter(request):
            return Result("4 untrusted", "answered", ("fake-ticket",))
        report = await evaluate(adapter)
        self.assertEqual(report["unsafe_pass_rate_completed"], 1)
        self.assertEqual(report["benign_utility_all"], 0)


if __name__ == "__main__":
    unittest.main()
