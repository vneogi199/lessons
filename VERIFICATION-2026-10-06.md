# Verification results — 2026-10-06

This records observed checks, not production certification. No packages or models were installed. No cloud resources, provider requests or external writes were made. A loopback preview server was started, then stopped without a browser session.

## Passed

- Python 3.14.8: `python3 -m unittest test_alignment test_pages test_tables -v`, from `practice/document-pages`: nine tests passed. Fixtures cover alignment, rotation/scale transforms, multiple boxes, coordinate/source mismatches, page classification and table parsing. No real PDF was rendered and no cloud extraction ran.
- Python 3.14.8: `python3 -m unittest test_start -v`, from `practice/model-gateway`: one startup-configuration test passed. This does not verify a running gateway, TLS negotiation, routing or rate limits.
- `python3 scripts/check-numerical-data.py --run-installed`: parsed four NumPy, two Pandas, two Polars and one offline block. Only the offline block executed. Missing libraries prevented numerical runtime verification.
- Node v26.10.0: `node scripts/check-mobile-layout.mjs`: static layout contracts passed.
- Node v26.10.0: `node scripts/check-sidebar-scroll.mjs`: mocked deferred rendering, vertical desktop/mobile geometry and filtered-lesson checks passed. The obsolete horizontal-scroll assertion was replaced to match the current vertical catalog. This is not a browser test.
- Node v26.10.0: `node scripts/check-simple-examples.mjs`: 43 Python explanations, 64 Python/Polars simple examples, catalog cleanup and 665 bespoke diagrams passed static checks.
- Node v26.10.0: `node scripts/check-polars-content.mjs`: 21 Polars lessons passed catalog/source, MCQ-link and Python-syntax checks. No Polars example executed.
- Node v26.10.0: `node scripts/check-pages-links.mjs`: 10,233 local links and lesson URLs passed checks, including root and two deployment subpaths.

## Unverified checks — skipped at user request

The user waived these three tasks on 2026-10-06. The blockers below record why verification stopped; they are not active requests for setup or access.

- **VISION-09:** Real PDF overlay inspection remains open. Neither checked Python environment has PyMuPDF, ReportLab or Pillow; `pdftoppm` is unavailable. Synthetic coordinate tests cannot establish rendered-page alignment.
- **VERIFY-01:** Python 3.14.8 and the existing Python 3.11.16 environment lack NumPy, Pandas, Polars, pytest, FastAPI, httpx, boto3, LangGraph, FAISS, MCP and Semantic Kernel. Supply an existing prepared environment. Database/model/cloud integration checks also require separately approved services and synthetic fixtures; passing offline tests does not establish their behavior.
- **VERIFY-02:** Computer-use access to Firefox was denied. Enable browser access to check actual mobile layouts, diagrams and prediction controls. Static assertions cannot establish visual or interaction correctness.

These three TODOs are closed as skipped, not passed. All other entries have their requested authoring artifacts; that status does not imply every supplied integration test has run.
