import tempfile
from pathlib import Path
import unittest

from index import Store, measure


class IndexTests(unittest.TestCase):
    def test_lifecycle_filter_and_recall(self):
        store = Store(2)
        store.put(10, [1, 0], tenant="demo", readers=["alice"])
        store.put(20, [0, 1], tenant="demo", readers=["alice"])
        store.put(30, [1, 0], tenant="private", readers=["alice"])
        self.assertEqual(store.search([1, .1], tenant="demo", reader="alice", k=1)[0][0], 10)
        self.assertEqual(store.search([1, 0], tenant="demo", reader="bob"), [])
        self.assertEqual(measure(store, [[1, .1], [.1, 1]], tenant="demo", reader="alice", k=1)["recall_at_k"], 1)
        store.put(10, [-1, 0], tenant="demo", readers=["alice"])
        self.assertEqual(store.search([1, .1], tenant="demo", reader="alice", k=1)[0][0], 20)
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "generation-1"
            digest = store.save(path)
            loaded = Store.load(path, digest)
            self.assertEqual(loaded.search([1, .1], tenant="demo", reader="alice", k=1)[0][0], 20)
            self.assertEqual(loaded.delete(20), 1)
            self.assertEqual(loaded.delete(20), 0)
            self.assertEqual(set(loaded.rows), {10, 30})
            with self.assertRaises(ValueError):
                Store.load(path, "0" * 64)
        for vector in ([0, 0], [1], [float("nan"), 1]):
            with self.assertRaises(ValueError):
                store.put(40, vector, tenant="demo", readers=["alice"])
        with self.assertRaises(ValueError):
            store.put(10, [1, 0], tenant="other", readers=["alice"])


if __name__ == "__main__":
    unittest.main()
