"""Small ordered-data and version models, not a B+ tree or an LSM engine."""
from bisect import bisect_left, bisect_right
import unittest


def ordered_range(keys, low, high):
    # shortcut: sorted in-memory list replaces tree pages; this models results,
    # not fan-out, splits, disk I/O, locking or asymptotic insertion cost.
    if low > high:
        raise ValueError("invalid range")
    return keys[bisect_left(keys, low):bisect_right(keys, high)]


def read_latest(runs_newest_first, key):
    for run in runs_newest_first:
        if key in run:
            return run[key]  # None is a tombstone, not permission to read older data.
    return None


def compact_all_without_snapshots(runs_newest_first):
    """All older versions must be supplied; no active snapshot may need them."""
    merged = {}
    for run in reversed(runs_newest_first):
        merged.update(run)
    return {key: value for key, value in sorted(merged.items()) if value is not None}


class StorageTests(unittest.TestCase):
    def test_range_and_boundaries(self):
        self.assertEqual(ordered_range([10, 20, 30, 40, 50, 60], 25, 50), [30, 40, 50])
        self.assertEqual(ordered_range([10, 20], 21, 30), [])
        self.assertEqual(ordered_range([10, 20, 20], 20, 20), [20, 20])

    def test_invalid_range(self):
        with self.assertRaises(ValueError):
            ordered_range([10], 20, 10)

    def test_newest_version_wins(self):
        self.assertEqual(read_latest([{"k": 20}, {"k": 10}], "k"), 20)

    def test_tombstone_stops_lookup(self):
        self.assertIsNone(read_latest([{"k": None}, {"k": 10}], "k"))

    def test_premature_removal_resurrects_value(self):
        older = {"k": 10}
        incorrectly_cleaned_new_run = {}  # Dropped tombstone while older data survives.
        self.assertEqual(read_latest([incorrectly_cleaned_new_run, older], "k"), 10)

    def test_full_merge_preserves_visible_results(self):
        runs = [{"k": None, "a": 3}, {"k": 10, "a": 2, "b": 0}]
        merged = compact_all_without_snapshots(runs)
        self.assertEqual(merged, {"a": 3, "b": 0})
        for key in ("k", "a", "b", "missing"):
            self.assertEqual(read_latest(runs, key), read_latest([merged], key))


if __name__ == "__main__":
    unittest.main()
