"""Validate saved Azure Layout JSON; no OCR, network call or table hallucination."""
from decimal import Decimal
import json
import math
import re


def integer(value, minimum, maximum):
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError('invalid_integer')
    return value


def text(value):
    if not isinstance(value, str) or len(value) > 4000:
        raise ValueError('invalid_text')
    return value


def regions(values, pages, source, version):
    if not isinstance(values, list) or not 1 <= len(values) <= 8:
        raise ValueError('source_regions_required')
    result = []
    for region in values:
        page = integer(region['pageNumber'], 1, 10000)
        if page not in pages:
            raise ValueError('missing_source_page')
        width, height, unit = pages[page]
        polygon = region['polygon']
        if not isinstance(polygon, list) or len(polygon) != 8:
            raise ValueError('quadrilateral_required')
        if any(type(v) not in (int, float) or not math.isfinite(v) for v in polygon):
            raise ValueError('invalid_coordinate')
        xs, ys = polygon[::2], polygon[1::2]
        if not (0 <= min(xs) < max(xs) <= width and 0 <= min(ys) < max(ys) <= height):
            raise ValueError('out_of_page_box')
        result.append({'source': source, 'version': version, 'page': page,
                       'unit': unit, 'polygon': polygon,
                       'box': [min(xs), min(ys), max(xs), max(ys)]})
    return result


def extract(raw, *, source, version):
    """Return cell objects and a grid of references; merged cells keep one identity."""
    if not isinstance(raw, bytes) or len(raw) > 2_000_000:
        raise ValueError('bounded_json_bytes_required')
    if not isinstance(source, str) or not 1 <= len(source) <= 200 or not re.fullmatch('[0-9a-f]{64}', version):
        raise ValueError('immutable_source_required')
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('duplicate_json_key')
            result[key] = value
        return result
    document = json.loads(raw, object_pairs_hook=unique,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite')))
    data = document.get('analyzeResult', document)
    if data.get('apiVersion') != '2024-11-30' or data.get('modelId') != 'prebuilt-layout':
        raise ValueError('unsupported_provider_contract')
    if not isinstance(data.get('pages'), list) or not 1 <= len(data['pages']) <= 100:
        raise ValueError('bounded_pages_required')
    pages = {}
    for page in data['pages']:
        number = integer(page['pageNumber'], 1, 10000)
        width, height = page['width'], page['height']
        if number in pages or page['unit'] not in {'inch', 'pixel'}:
            raise ValueError('invalid_page')
        if any(type(n) not in (int, float) or not math.isfinite(n) or not 0 < n <= 20000
               for n in (width, height)):
            raise ValueError('invalid_page_size')
        pages[number] = width, height, page['unit']
    tables = data.get('tables', [])
    if not isinstance(tables, list) or len(tables) > 20:
        raise ValueError('too_many_tables')
    output = []
    for table in tables:
        rows, cols = integer(table['rowCount'], 1, 200), integer(table['columnCount'], 1, 50)
        raw_cells = table['cells']
        if not isinstance(raw_cells, list) or len(raw_cells) > 2000 or rows * cols > 4000:
            raise ValueError('table_too_large')
        cells, grid = [], [[None] * cols for _ in range(rows)]
        for cell in raw_cells:
            row, col = integer(cell['rowIndex'], 0, rows-1), integer(cell['columnIndex'], 0, cols-1)
            rs, cs = integer(cell.get('rowSpan', 1), 1, rows-row), integer(cell.get('columnSpan', 1), 1, cols-col)
            kind = cell.get('kind', 'content')
            if kind not in {'content', 'columnHeader', 'rowHeader', 'stubHead', 'description'}:
                raise ValueError('unsupported_cell_kind')
            index = len(cells)
            for r in range(row, row+rs):
                for c in range(col, col+cs):
                    if grid[r][c] is not None:
                        raise ValueError('overlapping_cells')
                    grid[r][c] = index
            cells.append({'text': text(cell['content']), 'row': row, 'column': col,
                          'row_span': rs, 'column_span': cs, 'kind': kind,
                          'sources': regions(cell.get('boundingRegions'), pages, source, version)})
        # Preserve captions/footnotes separately: their boxes need not be inside the table.
        annotations = []
        notes = table.get('footnotes', [])
        if not isinstance(notes, list) or len(notes) > 20:
            raise ValueError('invalid_footnotes')
        for kind, note in ([('caption', table['caption'])] if 'caption' in table else []) + [
                ('footnote', note) for note in notes]:
            annotations.append({'kind': kind, 'text': text(note['content']),
                'sources': regions(note.get('boundingRegions'), pages, source, version)})
        output.append({'cells': cells, 'grid': grid, 'annotations': annotations,
                       'missing': [(r, c) for r in range(rows) for c in range(cols) if grid[r][c] is None]})
    return output


def headers(table, row, column):
    """Ordered column-header path for a body cell; merged parents appear once."""
    grid, cells = table['grid'], table['cells']
    integer(row, 0, len(grid)-1)
    integer(column, 0, len(grid[0])-1)
    found = []
    for r in range(row):
        index = grid[r][column]
        if index is not None and index not in found and cells[index]['kind'] == 'columnHeader':
            found.append(index)
    return [cells[index] for index in found]


def check_total(table, parts, total):
    """Caller supplies reviewed cell IDs with matching units; never guesses arithmetic."""
    if not isinstance(parts, list) or not parts or len(parts) != len(set(parts)) or total in parts:
        raise ValueError('distinct_part_cells_required')
    def number(index):
        integer(index, 0, len(table['cells'])-1)
        value = table['cells'][index]['text']
        if not re.fullmatch(r'-?\d{1,15}(?:\.\d{1,6})?', value):
            raise ValueError('ambiguous_or_missing_number')
        return Decimal(value)
    return {'matches': sum((number(i) for i in parts), Decimal(0)) == number(total),
            'parts': parts, 'total': total}
