# From PDF bytes to cited pages

The supplied path is `ingest` → isolated rendering/OCR → lexical or visual page
retrieval → required header pages → the existing typed image-answer adapter.
No PDF was rendered, no OCR/model inference ran and no answer was requested.

`ocr.extract` accepts at most 10 MB and eight pages in a provisioned Linux
environment. It launches a separate Python process with CPU, memory, file-size
and file-descriptor limits. A wall-clock timeout kills its process group, including
Tesseract. The worker renders at 1.5 pixels per PDF point with at most four million
pixels per page, then runs the approved local English Tesseract engine in TSV
mode. No package, language data or model download is attempted.

Supply an administrator-approved absolute Tesseract executable path. PyMuPDF and
English trained data must already exist. Process limits are not an OS sandbox:
run untrusted PDFs in a non-root, no-network worker container with only its
temporary directory mounted. This adapter does not itself configure seccomp,
filesystem namespaces or container networking. Do not parse hostile documents
on a privileged host merely because a subprocess is used.

Color is the default. Grayscale is an explicit option for comparison, not an
automatic improvement. No thresholding or deskew is silently applied. Output
contains words, line identifiers, normalized rendered-image boxes, confidence,
page dimensions, rotation and SHA-256 of the original PDF. Empty/low-confidence
OCR is marked `review_required`, not a blank page. Mean confidence 60 is a teaching
threshold, not a calibrated accuracy guarantee. TSV order may still misread
columns, tables or marginal notes.

`synthetic_pdf.fixture()` builds an in-memory two-page document after authorization.
Its second page has the value 125.00; page one carries the USD header. Supply
`header_links={2: (1,)}` to preserve that dependency. This link is a reviewed
layout fact, not something the model invents. Missing pages, mixed versions,
forward/cyclic dependencies and more than four selected context pages fail.

`colpali.Index` loads an existing local Hugging Face-format ColPali checkpoint
using safetensors and local-only model/processor loading. It computes actual
multi-vector embeddings and calls the processor's late-interaction scorer.
It keeps at most eight pages in memory and filters tenant, readers and current
version before scoring. It runs on CPU by default and can require many GB of
memory. Use a separately resource-limited inference worker in a real service.
No inference performance or semantic retrieval quality is claimed. The existing
synthetic MaxSim arithmetic exercise is not evidence that this model ran.

To connect the pieces in an approved environment, call `document_rag.ingest`
with the PDF bytes, server-owned source/tenant/reader metadata and header links.
For visual retrieval, add each returned page to `Index`, then pass it as
`visual_index` to `document_rag.ask`. Otherwise the small OCR-word overlap ranker
is used. Supply a server-side `current(source)` lookup for current version and
permissions, plus the [approved model transport](../model-boundaries/README.md).
Do not take tenant grants or engine/model paths from a public request.

The answer adapter estimates image tokens before generation and reserves output
capacity. A budget failure returns no answer. Its one-MB image limit is stricter
than the OCR worker's four-MB limit; oversized renderings must be reviewed and
reprocessed under an explicit image policy, not truncated. Permission/version
changes before release deny the answer. Cited boxes cover the whole selected
rendered page. They are deliberately coarse; they do not locate a particular
number or prove entailment. OCR word boxes are available for a later verified
alignment step. Do not treat rotated raster coordinates as unrotated PDF points.

Tests are authored but unexecuted. After approval, the deterministic tests cover
TSV bounds, missing pages, header context, stale versions, revocation and token
budgets. `test_local_engines.py` only opts into actual OCR with `LESSON_TESSERACT`
or actual ColPali with `LESSON_COLPALI_MODEL`. Record exact engine, processor,
model and weight versions; skipped tests are not integration passes. Raster/box
overlay inspection remains open in VISION-09.

Question: why retrieve the header page if the value page already matches the
question? The header supplies meaning, such as currency or period. A correct
number with the wrong unit is still a wrong answer. Ask your teacher to review
the two-page fixture and its provenance before trying a complex enterprise PDF.

Sources: [PyMuPDF rendering](https://pymupdf.readthedocs.io/en/latest/recipes-images.html),
[Tesseract TSV](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html),
[ColPali processor/model interface](https://huggingface.co/docs/transformers/model_doc/colpali).
