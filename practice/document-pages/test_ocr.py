import unittest
from ocr import words

HEADER = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n'


class OCRTests(unittest.TestCase):
    def test_word_geometry_and_empty_page(self):
        result = words(HEADER+'5\t1\t1\t1\t1\t1\t10\t20\t30\t10\t90\tPolicy\n', 100, 100)
        self.assertEqual(result[0]['box'], [.1, .2, .4, .3])
        self.assertEqual(words(HEADER, 100, 100), [])

    def test_bad_confidence_and_bounds(self):
        for confidence, width in [('nan', '30'), ('101', '30'), ('90', '300')]:
            with self.assertRaises(ValueError):
                words(HEADER+f'5\t1\t1\t1\t1\t1\t10\t20\t{width}\t10\t{confidence}\tPolicy\n', 100, 100)
