from types import SimpleNamespace
import unittest
from ragas_metrics import score


class FakeMetric:
    def __init__(self, result):
        self.result = result
        self.calls = 0

    async def single_turn_ascore(self, sample):
        self.calls += 1
        return self.result


class MetricTests(unittest.IsolatedAsyncioTestCase):
    async def test_unbounded_reference_and_unknown_metric(self):
        with self.assertRaises(ValueError):
            await score(self.sample(reference="x" * 8001), {"correctness": FakeMetric(1)})
        with self.assertRaises(ValueError):
            await score(self.sample(), {"unknown": FakeMetric(1)})

    def sample(self, **changes):
        values = dict(user_input="When?", response="Seven days.",
                      retrieved_contexts=["Returns expire after seven days."], reference="Seven days.")
        values.update(changes)
        return SimpleNamespace(**values)

    async def test_missing_reference_does_not_call_reference_metric(self):
        precision, relevance = FakeMetric(1), FakeMetric(.8)
        result = await score(self.sample(reference=None),
                             {"context_precision": precision, "answer_relevance": relevance})
        self.assertEqual(precision.calls, 0)
        self.assertEqual(result["context_precision"]["status"], "missing_reference")
        self.assertEqual(result["answer_relevance"]["value"], .8)

    async def test_nan_empty_and_negative_cosine(self):
        result = await score(self.sample(), {"faithfulness": FakeMetric(float("nan")),
                                             "answer_relevance": FakeMetric(-.1)})
        self.assertIsNone(result["faithfulness"]["value"])
        self.assertEqual(result["answer_relevance"]["value"], -.1)
        result = await score(self.sample(retrieved_contexts=[]), {"context_recall": FakeMetric(1)})
        self.assertEqual(result["context_recall"]["status"], "empty_context")


if __name__ == "__main__":
    unittest.main()
