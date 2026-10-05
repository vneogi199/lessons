# Classify a page before choosing extraction

## Keep table structure

`tables.py` extracts a validated table representation from saved Azure Document
Intelligence `prebuilt-layout` JSON, API version `2024-11-30`. It does not submit a
document to Azure. `test_tables.py` uses synthetic response-shaped data, not a
recorded extraction result. No cloud calls or tests were run.

Think of a merged heading as one label across two drawers. Both grid positions
point to the same cell object. The extractor preserves each cell's row/column
span, text, polygon, page, unit and immutable source version. A body cell under
`Amounts (USD)` and `Exposure` has both headings in its ordered header path.
Units stay in their original text; the adapter does not guess unit conversions.

Captions and footnotes remain separate source-bearing annotations. Azure's table
regions do not necessarily enclose them. A note without its own region fails
this strict adapter instead of receiving an invented box. Multi-page source
references are retained, but the adapter does not infer that separate tables
continue one another. Review that relationship before joining them.

For an approved saved response, call
`extract(raw_bytes, source='approved-document-id', version=sha256_of_pdf)`.
The caller must bind the response to those exact bytes and enforce access before
extraction and retrieval. A supplied hash alone does not prove provenance.
The adapter rejects overlapping spans, missing source pages, invalid coordinates,
duplicate JSON keys and oversized inputs. Missing grid positions remain `None`.
Empty strings remain empty strings. Neither becomes a numeric zero.

`check_total` accepts reviewed cell IDs and uses Decimal arithmetic. In the small
fixture, exposure `12.50` equals total `12.50`; changing the total to `13` fails.
The caller must establish matching units and choose the correct component cells.
Comma-separated numbers, percentages and footnote markers require an explicit
domain parser. A matching total does not prove OCR accuracy: two errors can cancel.

After execution approval, run `python -m unittest test_tables -v`. Also inspect
one approved provider result against its source page before claiming extraction
accuracy. Actual nested tables embedded inside cells are unsupported; the example
handles hierarchical headers and merged cells, not recursive table inference.

Interview question: why not repeat a merged numeric value in each column?
Answer: a later sum could count it twice. Preserve its single identity and apply
a domain-specific allocation rule only when the source supports that rule.
The provider contract is documented in
[Azure Layout](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout?view=doc-intel-4.0.0).

## Align chunks with their source words

`alignment.py` maps a chunk's character interval to word boxes through exact source offsets. It rejects changed text, versions, missing non-whitespace coverage and mismatched coordinate conventions. A chunk spanning two lines keeps multiple boxes. A partial word uses its full word box, a conservative bound rather than invented character geometry.

The display transform supports clockwise 0/90/180/270-degree rotation and scale. On a 100-by-200 point page, box `(10,20,30,40)` rotated 90 degrees becomes `(160,10,180,30)`; scale two produces `(320,20,360,60)`. Rotate all corners before finding bounds. Normalizing coordinates alone cannot establish which words a chunk came from.

`overlay` returns a diagnostic SVG with source word boxes in gray and selected boxes in blue. Tests assert known output geometry. They are supplied but unexecuted, and no browser overlay inspection is claimed. In an approved real-PDF check, render the same immutable page beneath the boxes and inspect corner landmarks, both lines and a rotated page. Record page hash, dimensions, rotation, scale and screenshot. A boxes-only overlay cannot prove the parser's original boxes match the raster.

This adapter expects unrotated, top-left point coordinates with page origin zero. Reject cropped/translated input until its adapter explicitly converts the origin. PyMuPDF distinguishes unrotated extraction coordinates from rotated display coordinates; use its documented transformation/rotation matrices when adapting actual pages. See [page coordinate contracts](https://pymupdf.readthedocs.io/en/latest/page.html). No PDF library is required for these synthetic geometry tests.

`pages.py` supplies six synthetic page observations and expected classifications. It does not parse PDFs or infer layout from pixels. No parser/model download is needed. The fixture's source digest hashes an explicitly labeled synthetic descriptor. For a real approved file, hash its immutable bytes and retain the original in controlled storage.

Page identity is `(source, version, one-based page number)`. A new file version changes identity even when a page number stays the same. Each block keeps its type, ID, text and normalized top-left box. Reading order is explicit and includes its evidence. Never assume that sorting boxes from top to bottom correctly reads two columns.

The labels overlap. A scanned page can contain a chart. A page with native text can also contain a table. “Mixed” means both native text and scanned content were observed, not that OCR has already succeeded.

| Page | Observations | Expected labels | Extraction decision to review |
|---|---|---|---|
| 1 | Native text | native | Extract text and inspect order |
| 2 | Scanned content | scanned | OCR or visual retrieval; inspect quality |
| 3 | Text and scan | mixed | Preserve native text, inspect image regions |
| 4 | Text and form fields | native, form | Preserve field labels and values |
| 5 | Text and table | native, table | Preserve cells, headers and units |
| 6 | Scan and chart | scanned, chart | Read axes and legend; preserve visual evidence |

An empty extraction is not proof of a blank page. A parser may fail or the page may contain only images. Send uncertain classification for review rather than silently deleting a page. The classifier trusts supplied observations; a real adapter must establish them. OCR quality, encryption, malformed files and permission checks belong to the ingestion boundary.

Practice: a table continues on page 5, but its header is on page 4. Can you merge them under page 5's identity? No. Keep both page identities and explicit header provenance. A combined chunk needs multiple source references.

Practice: a revised PDF has the same filename. Can you reuse old boxes? No. The content version may have changed. Re-extract and bind boxes to the new immutable version.

Tests are supplied but unexecuted. After execution approval, use `python3 -m unittest -v` from this directory. Expected checks cover multi-label classifications, version/page identity, missing reading order and invalid boxes. No real-document classification accuracy is claimed. Ask your teacher to review a two-column reading-order example before adding a parser adapter.
