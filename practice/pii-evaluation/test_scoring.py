import unittest
from scoring import Case, Span, score


class ScoringTests(unittest.TestCase):
    def test_exact_partial_and_utility(self):
        # Gold email chars 0..2; prediction misses one and removes two useful chars.
        report = score([Case("a", "en", "abc DEF", (Span(0, 3, "EMAIL"),),
                             (Span(0, 2, "EMAIL"), Span(4, 6, "PERSON")),
                             (Span(4, 7, "BUSINESS"),))])
        self.assertEqual(report["entities"]["tp"], 0)
        self.assertEqual(report["entities"]["fp"], 2)
        self.assertEqual(report["entities"]["fn"], 1)
        self.assertEqual(report["characters"]["false_positive_rate"], 2 / 4)
        self.assertEqual(report["characters"]["miss_rate"], 1 / 3)
        self.assertEqual(report["characters"]["utility_loss"], 2 / 3)

    def test_unicode_and_slices(self):
        span = Span(0, 2, "PERSON")
        report = score([Case("a", "ja", "山田 x", (span,), (span,)),
                        Case("b", "en", "plain", (), ())])
        self.assertEqual(report["by_language"]["ja"]["recall"], 1)
        self.assertIsNone(report["by_language"]["en"]["recall"])
        self.assertEqual(report["entities"]["precision"], 1)
        self.assertIsNone(score([])["characters"]["utility_loss"])

    def test_type_mismatch_and_overlapping_predictions(self):
        report = score([Case("a", "en", "abcd", (Span(0, 2, "EMAIL"),),
                             (Span(0, 2, "PERSON"), Span(0, 3, "EMAIL")))])
        self.assertEqual(report["entities"]["tp"], 0)
        self.assertEqual(report["characters"]["false_redacted"], 1)

    def test_bad_offsets_duplicates(self):
        bad = Case("a", "en", "abc", (Span(0, 4, "EMAIL"),), ())
        with self.assertRaises(ValueError):
            score([bad])
        good = Case("a", "en", "abc", (), ())
        with self.assertRaises(ValueError):
            score([good, good])
        with self.assertRaises(ValueError):
            score([Case("b", "en", "abc", (), (Span(0, 1, "X"),) * 2)])


if __name__ == "__main__":
    unittest.main()
