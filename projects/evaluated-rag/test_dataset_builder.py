import unittest
from copy import deepcopy
from dataset_builder import SourceFact, candidates, reviewed_export


class BuilderTests(unittest.TestCase):
    def setUp(self):
        self.rows = candidates(SourceFact("refund-family", "refund", "v1", "a",
                              "Returns: 30 days.", 9, 16, "What is the return period?"),
                              changed_answer="7 days.", forbidden_tenant="b")

    def test_slices_keep_one_family_split(self):
        self.assertEqual(len({r["split"] for r in self.rows}), 1)
        self.assertEqual({r["slice"] for r in self.rows},
                         {"answerable", "unanswerable", "contradictory", "stale", "forbidden"})
        self.assertEqual(self.rows[0]["reference"], "30 days")
        self.assertIsNone(self.rows[-1]["reference"])

    def test_review_and_mutation(self):
        with self.assertRaises(ValueError):
            reviewed_export(self.rows, {}, dataset_version="v1")
        reviews = {r["id"]: {"approved": True, "reviewer": "synthetic-reviewer",
                    "answerability_checked": True, "permissions_checked": True,
                    "source_checked": True} for r in self.rows}
        self.assertEqual(len(reviewed_export(self.rows, reviews, dataset_version="v1")["cases"]), 5)
        changed = deepcopy(self.rows)
        changed[0]["reference"] = "wrong"
        with self.assertRaises(ValueError):
            reviewed_export(changed, reviews, dataset_version="v1")


if __name__ == "__main__":
    unittest.main()
