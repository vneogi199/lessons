import unittest
from clip_search import ImageIndex


class ImageTests(unittest.TestCase):
    def setUp(self):
        # Fake semantic vectors test ranking and permissions, not CLIP inference.
        vectors = {b"query": (1, 0), b"invoice": (1, .1), b"cat": (0, 1)}
        self.index = ImageIndex(lambda value: vectors[value], "fake-v1")
        self.index.upsert("invoice", "a", "v1", "synthetic invoice", b"invoice")
        self.index.upsert("cat", "a", "v1", "synthetic cat", b"cat")
        self.index.upsert("private", "b", "v1", "other tenant", b"invoice")

    def test_labels_rank_scope_and_delete(self):
        result = self.index.search("a", b"query", allowed=lambda r: True, contract="fake-v1")
        self.assertEqual([r["image_id"] for r in result], ["invoice", "cat"])
        self.assertEqual(result[0]["label"], "synthetic invoice")
        self.index.delete("a", "invoice")
        result = self.index.search("a", b"query", allowed=lambda r: False, contract="fake-v1")
        self.assertEqual(result, [])

    def test_contract_and_revocation(self):
        with self.assertRaises(ValueError):
            self.index.search("a", b"query", allowed=lambda r: True, contract="changed")
        calls = {}
        def allowed(record):
            calls[record.image_id] = calls.get(record.image_id, 0) + 1
            return calls[record.image_id] == 1
        self.assertEqual(self.index.search("a", b"query", allowed=allowed, contract="fake-v1"), [])


if __name__ == "__main__":
    unittest.main()
