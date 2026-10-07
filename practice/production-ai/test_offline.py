from copy import deepcopy
import unittest
from replay import Replay, FIXTURE, digest
from evals import CASE, grade, percentile


class OfflineTests(unittest.TestCase):
    def test_replay_and_decision(self):
        replay = Replay(FIXTURE, digest(FIXTURE))
        limit = replay.call("read_limit", {"account": "A"})["limit"]
        exposure = replay.call("read_exposure", {"account": "A"})["exposure"]
        self.assertGreater(exposure + 3, limit)
        replay.finish()
        with self.assertRaises(ValueError):
            replay.call("submit_trade", {})

    def test_changed_arguments_and_unused_calls(self):
        replay = Replay(FIXTURE, digest(FIXTURE))
        with self.assertRaises(ValueError):
            replay.call("read_limit", {"account": "B"})
        with self.assertRaises(ValueError):
            replay.finish()

    def test_digest_and_defensive_copy(self):
        fixture = deepcopy(FIXTURE)
        expected = digest(fixture)
        replay = Replay(fixture, expected)
        fixture["calls"][0]["response"]["limit"] = 999
        self.assertEqual(replay.call("read_limit", {"account": "A"}), {"limit": 10})
        with self.assertRaises(ValueError):
            Replay(fixture, expected)

    def test_correct_multiturn_review(self):
        self.assertTrue(grade(CASE, [{"turn": 3, "tool": "read_limit"}], CASE["expected"])["passed"])

    def test_stale_correction(self):
        result = grade(CASE, [], {**CASE["expected"], "quantity": 2})
        self.assertFalse(result["fields_ok"])
        self.assertFalse(result["passed"])

    def test_unsafe_trajectory_despite_correct_answer(self):
        result = grade(CASE, [{"turn": 2, "tool": "submit_trade"}], CASE["expected"])
        self.assertTrue(result["fields_ok"])
        self.assertEqual(result["unsafe_proposals"], 1)
        self.assertFalse(result["passed"])

    def test_malformed_event(self):
        with self.assertRaises(ValueError):
            grade(CASE, [{"turn": True, "tool": "read_limit"}], CASE["expected"])

    def test_percentiles(self):
        data = list(range(1, 10)) + [100]
        self.assertEqual([percentile(data, q) for q in (.5, .95, .99)], [5, 100, 100])
        for invalid in ([], [float("nan")], [-1], [True]):
            with self.assertRaises(ValueError):
                percentile(invalid, .95)

    def test_stage_quantiles_are_not_additive(self):
        a, b = [10] + [0] * 99, [0, 10] + [0] * 98
        self.assertEqual(percentile(a, .99) + percentile(b, .99), 0)
        self.assertEqual(percentile([x + y for x, y in zip(a, b)], .99), 10)


if __name__ == "__main__":
    unittest.main()
