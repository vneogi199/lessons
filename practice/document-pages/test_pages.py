import unittest
from dataclasses import replace
from pages import fixtures, classify


class PageTests(unittest.TestCase):
    def test_expected_multilabel_classes(self):
        self.assertEqual([classify(p) for p in fixtures()], [
            {"native"}, {"scanned"}, {"mixed"}, {"native", "form"},
            {"native", "table"}, {"scanned", "chart"}])

    def test_identity_includes_version_and_page(self):
        page = fixtures()[0]
        self.assertNotEqual(page.identity, replace(page, number=2).identity)
        self.assertNotEqual(page.identity, replace(page, version="0" * 64).identity)
        with self.assertRaises(ValueError):
            replace(page, reading_order=())
        with self.assertRaises(ValueError):
            replace(page, blocks=(replace(page.blocks[0], box=(0, 0, 2, 1)),))


if __name__ == "__main__":
    unittest.main()
