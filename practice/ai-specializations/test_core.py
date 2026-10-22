import json
from pathlib import Path
import tempfile
import unittest
from core import completion_example, load_rows, overlapping_frames, prompt, score


class Checks(unittest.TestCase):
    def setUp(self):
        self.rows = load_rows(Path(__file__).with_name("cases.jsonl"))

    def check_bad_rows(self, rows):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "cases.jsonl"
            path.write_text("\n".join(json.dumps(r) for r in rows))
            with self.assertRaises(ValueError):
                load_rows(path)

    def test_group_leakage(self):
        self.rows[-1]["group"] = self.rows[0]["group"]
        self.check_bad_rows(self.rows)

    def test_duplicate_text(self):
        self.rows[-1]["text"] = self.rows[0]["text"].upper()
        self.check_bad_rows(self.rows)

    def test_duplicate_id(self):
        self.rows[-1]["id"] = self.rows[0]["id"]
        self.check_bad_rows(self.rows)

    def test_invalid_label(self):
        self.rows[-1]["label"] = "approve"
        self.check_bad_rows(self.rows)

    def test_loss_mask(self):
        result = completion_example([1, 2], [3], 4, 4, 6)
        self.assertEqual(result["labels"], [-100, -100, 3, 4, -100, -100])
        self.assertEqual(result["attention_mask"], [1, 1, 1, 1, 0, 0])

    def test_no_silent_truncation(self):
        with self.assertRaises(ValueError):
            completion_example([1, 2], [3], 4, 4, 3)

    def test_metrics(self):
        rows = [r for r in self.rows if r["split"] == "validation"]
        result = score(rows, {"v1": "urgent", "v2": "routine", "v3": "review please"})
        self.assertAlmostEqual(result["accuracy"], 2 / 3)
        self.assertEqual(result["invalid_outputs"], 1)
        self.assertEqual(result["recall"]["review"], 0)

    def test_missing_prediction(self):
        with self.assertRaises(ValueError):
            score(self.rows, {})

    def test_prompt_uses_training_only(self):
        training = [r for r in self.rows if r["split"] == "train"]
        rendered = prompt("new request", training)
        self.assertIn(training[0]["text"], rendered)
        self.assertNotIn(self.rows[-1]["text"], rendered)

    def test_frame_overlap(self):
        self.assertEqual(overlapping_frames(12000, 15000, [14000, 20000, 15000]), [14000])

    def test_invalid_timestamp(self):
        for values in [(20, 10, []), (0, 10, [float("nan")]), (0, 10, [-1])]:
            with self.assertRaises(ValueError):
                overlapping_frames(*values)


if __name__ == "__main__":
    unittest.main()
