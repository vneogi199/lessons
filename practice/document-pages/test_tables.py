import copy
import json
import unittest
from tables import extract, headers, check_total


def fixture():
    region = [{'pageNumber': 1, 'polygon': [0, 0, 1, 0, 1, 1, 0, 1]}]
    def cell(r, c, value, **extra):
        return dict(rowIndex=r, columnIndex=c, content=value, boundingRegions=region, **extra)
    return {'apiVersion': '2024-11-30', 'modelId': 'prebuilt-layout',
            'pages': [{'pageNumber': 1, 'width': 8, 'height': 11, 'unit': 'inch'}],
            'tables': [{'rowCount': 4, 'columnCount': 2, 'cells': [
                cell(0, 0, 'Amounts (USD)', kind='columnHeader', columnSpan=2),
                cell(1, 0, 'Desk', kind='columnHeader'),
                cell(1, 1, 'Exposure', kind='columnHeader'),
                cell(2, 0, 'Rates'), cell(2, 1, '12.50'),
                cell(3, 0, 'Total'), cell(3, 1, '12.50')],
                'footnotes': [{'content': 'Synthetic data only', 'boundingRegions': region}]}]}


def parse(value):
    return extract(json.dumps(value).encode(), source='synthetic', version='a'*64)[0]


class TablesTest(unittest.TestCase):
    def test_merged_headers_and_totals(self):
        table = parse(fixture())
        self.assertEqual(table['grid'][0], [0, 0])
        self.assertEqual([h['text'] for h in headers(table, 2, 1)], ['Amounts (USD)', 'Exposure'])
        self.assertTrue(check_total(table, [4], 6)['matches'])
        self.assertEqual(table['annotations'][0]['sources'][0]['version'], 'a'*64)

    def test_missing_is_not_zero(self):
        raw = fixture()
        raw['tables'][0]['cells'].pop()
        self.assertEqual(parse(raw)['missing'], [(3, 1)])
        raw = fixture()
        raw['tables'][0]['cells'][4]['content'] = ''
        with self.assertRaises(ValueError):
            check_total(parse(raw), [4], 6)

    def test_overlap_and_missing_page(self):
        raw = fixture()
        raw['tables'][0]['cells'].append(copy.deepcopy(raw['tables'][0]['cells'][0]))
        with self.assertRaises(ValueError):
            parse(raw)
        raw = fixture()
        raw['pages'][0]['pageNumber'] = 2
        with self.assertRaises(ValueError):
            parse(raw)

    def test_bad_total_and_fractional_index(self):
        raw = fixture()
        raw['tables'][0]['cells'][6]['content'] = '13'
        self.assertFalse(check_total(parse(raw), [4], 6)['matches'])
        raw['tables'][0]['cells'][0]['rowIndex'] = 0.0
        with self.assertRaises(ValueError):
            parse(raw)
