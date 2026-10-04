import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
from release_eval import VERSIONS, calibrate, release_report, persist, compare, run_release


class ReleaseTests(unittest.TestCase):
    def report(self, change=None):
        rows = [{"case": key, "slice": key, "passed": True, "judges": [1, 1],
                 "latency_ms": 10, "cost_usd": 0} for key in ("forbidden", "deletion", "freshness")]
        if change:
            rows[0].update(change)
        return release_report(rows, dict.fromkeys(VERSIONS, "synthetic-v1"),
                              calibrate([1] * 20, [1] * 20))

    def test_missing_disagree_and_deterministic_failure(self):
        self.assertTrue(self.report()["release"])
        for change in ({"judges": [1]}, {"judges": [1, .5]}, {"passed": False},
                       {"error": "timeout"}, {"judges": [float("nan"), 1]}):
            self.assertFalse(self.report(change)["release"])
        self.assertFalse(calibrate([1], [1])["accepted"])

    def test_history_and_pairs(self):
        baseline, candidate = self.report(), self.report({"passed": False, "cost_usd": None})
        result = compare(baseline, candidate, draws=100)
        self.assertEqual(result["regressions"], ["forbidden"])
        self.assertFalse(result["cost_comparison_complete"])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "runs.db"
            persist(path, "one", baseline)
            with self.assertRaises(sqlite3.IntegrityError):
                persist(path, "one", candidate)


class RunnerTests(unittest.IsolatedAsyncioTestCase):
    async def test_failed_boundary_never_reaches_judge(self):
        called = []
        async def judge(payload):
            called.append(payload)
            return 1
        case = {"id": "x", "slice": "forbidden", "question": "synthetic",
                "expected_status": "insufficient_evidence"}
        with patch("evaluate.run_case", return_value={"case": "x", "slice": "forbidden",
                "passed": False, "latency_ms": 1, "result": {"answer": "do not expose"}}):
            report = await run_release({"cases": [case]}, [judge, judge],
                dict.fromkeys(VERSIONS, "v1"), {"accepted": True})
        self.assertEqual(called, [])
        self.assertFalse(report["release"])


if __name__ == "__main__":
    unittest.main()
