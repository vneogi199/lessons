import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock
import httpx
from jira import Jira, adf, plain


class JiraTests(unittest.IsolatedAsyncioTestCase):
    async def test_lost_response_never_reposts_and_reconciles(self):
        creates = []
        def handle(request):
            body = json.loads(request.content)
            if request.url.path == "/rest/api/3/issue":
                creates.append(body["fields"])
                raise httpx.ReadTimeout("lost response", request=request)
            fields = {**creates[0], "creator": {"accountId": "bot"}}
            return httpx.Response(200, json={"isLast": True, "issues": [{"key": "LAB-1", "fields": fields}]})
        with tempfile.TemporaryDirectory() as tmp:
            async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as http:
                jira = Jira(str(Path(tmp) / "ops.db"), http, "https://synthetic.atlassian.net", "LAB", "10001",
                            "bot", AsyncMock(return_value=True), AsyncMock(return_value=True))
                for _ in range(2):
                    result = await jira.create("tenant", "actor", "a" * 32, "Synthetic issue", "Synthetic detail")
                    self.assertEqual(result["state"], "unknown")
                self.assertEqual(len(creates), 1)
                result = await jira.reconcile("tenant", "actor", "a" * 32)
                self.assertEqual(result, {"state": "done", "issue": "LAB-1"})
                with self.assertRaises(ValueError):
                    await jira.create("tenant", "actor", "a" * 32, "Changed intent", "Synthetic detail")

    def test_rich_text_is_bounded_plain_text(self):
        self.assertEqual(plain(adf("<script>not HTML</script>")), "<script>not HTML</script>")
        with self.assertRaises(ValueError):
            plain({"type": "doc", "version": 1, "content": [{"type": "media"}]})


if __name__ == "__main__":
    unittest.main()
