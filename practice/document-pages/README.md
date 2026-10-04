# Classify a page before choosing extraction

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
