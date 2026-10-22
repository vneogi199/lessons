"""Offline arithmetic fixtures, not database or authorization integration tests."""
import unittest


def fuse(branches, allowed, limit=10, constant=60):
    scores = {}
    for branch in branches:
        visible = list(dict.fromkeys(x for x in branch if x in allowed))[:limit]
        for rank, item in enumerate(visible, 1):
            scores[item] = scores.get(item, 0) + 1 / (constant + rank)
    return sorted(scores.items(), key=lambda pair: (-pair[1], pair[0]))


class FusionTests(unittest.TestCase):
    def test_example(self):
        result = fuse([["A", "B"], ["B", "C"]], {"A", "B", "C"})
        self.assertEqual([x for x, _ in result], ["B", "A", "C"])
        self.assertAlmostEqual(result[0][1], 1 / 62 + 1 / 61)

    def test_empty_branch(self):
        self.assertEqual(fuse([[], ["A"]], {"A"}), [("A", 1 / 61)])

    def test_empty_results(self):
        self.assertEqual(fuse([[], []], set()), [])

    def test_filter_before_limit(self):
        self.assertEqual(fuse([["secret", "A"]], {"A"}, limit=1), [("A", 1 / 61)])

    def test_duplicates(self):
        self.assertEqual(fuse([["A", "A"]], {"A"}), [("A", 1 / 61)])

    def test_tie(self):
        self.assertEqual([x for x, _ in fuse([["B"], ["A"]], {"A", "B"})], ["A", "B"])

    def test_missing_candidate(self):
        self.assertNotIn("C", dict(fuse([["A"], ["B"]], {"A", "B", "C"})))


if __name__ == "__main__":
    unittest.main()
