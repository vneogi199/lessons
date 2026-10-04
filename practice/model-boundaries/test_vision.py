import base64
import unittest
from unittest.mock import AsyncMock
from vision import Page, answer_pages
from retry import Failure

PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC")


class VisionTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.page = Page("page-1", "a" * 64, 1, (0, 0, 1, 1), PNG)
        self.transport = AsyncMock()
        self.transport.count.return_value = 100
        self.transport.post.return_value = {"stop_reason": "tool_use", "content": [{
            "type": "tool_use", "name": "answer_pages", "input": {
                "status": "answered", "answer": "Synthetic response.", "citations": ["page-1"]}}]}

    async def test_typed_answer_and_unknown_citation(self):
        result = await answer_pages(self.transport, "What is visible?", [self.page], lambda _: True)
        self.assertEqual(result["evidence"][0]["page"], 1)
        self.transport.post.return_value["content"][0]["input"]["citations"] = ["unseen-page"]
        with self.assertRaises(Failure):
            await answer_pages(self.transport, "What?", [self.page], lambda _: True)

    async def test_budget_refusal_and_revocation(self):
        self.transport.count.return_value = 16000
        with self.assertRaises(Failure):
            await answer_pages(self.transport, "What?", [self.page], lambda _: True)
        self.transport.post.assert_not_called()
        self.transport.count.return_value = 100
        self.transport.post.return_value = {"stop_reason": "refusal"}
        with self.assertRaises(Failure):
            await answer_pages(self.transport, "What?", [self.page], lambda _: True)
        with self.assertRaises(PermissionError):
            await answer_pages(self.transport, "What?", [self.page], lambda _: False)


if __name__ == "__main__":
    unittest.main()
