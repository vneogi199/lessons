import unittest
from dataclasses import replace
from alignment import TextPage, Word, align, display_box, overlay


class AlignmentTests(unittest.TestCase):
    def setUp(self):
        self.page = TextPage(("doc", "v1", 1), "red blue", 100, 200,
            (Word(0, 3, "red", (10, 20, 30, 40)), Word(4, 8, "blue", (10, 50, 40, 70))))

    def test_multibox_and_partial_word(self):
        self.assertEqual(len(align(self.page, self.page.identity, 0, 8)), 2)
        self.assertEqual(align(self.page, self.page.identity, 1, 2), ((10, 20, 30, 40),))

    def test_rotation_and_scale(self):
        box = (10, 20, 30, 40)
        self.assertEqual(display_box(box, 100, 200, rotation=90, scale=2), (320, 20, 360, 60))
        self.assertEqual(display_box(box, 100, 200, rotation=180), (70, 160, 90, 180))
        self.assertEqual(display_box(box, 100, 200, rotation=270), (20, 70, 40, 90))
        svg = overlay(self.page, self.page.identity, 0, 3, rotation=90, scale=2)
        self.assertIn('viewBox="0 0 400 200"', svg)
        self.assertIn('x="320" y="20" width="40" height="40"', svg)

    def test_mismatch_and_missing_alignment(self):
        for page, identity in ((self.page, ("doc", "v2", 1)),
                               (replace(self.page, coordinates="bottom-left"), self.page.identity),
                               (replace(self.page, words=self.page.words[:1]), self.page.identity)):
            with self.assertRaises(ValueError):
                align(page, identity, 0, 8)


if __name__ == "__main__":
    unittest.main()
