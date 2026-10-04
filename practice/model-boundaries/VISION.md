# Ask about a page without losing its source

`vision.py` reuses `ClaudeTransport`. Supply an approved vision-capable model, authorized local page images and a current permission callback. It sends at most four PNG/JPEG images, each at most one megabyte and four million pixels. It never fetches image URLs. Tests use a one-pixel synthetic image and fake transport; no inference or test execution occurred.

Each `Page` carries a stable evidence ID, original document hash, one-based page number and normalized crop coordinates `(left, top, right, bottom)`. The caller must obtain these from the trusted renderer. The adapter validates their shape but cannot prove that the supplied image actually came from that document. It also records the image hash. Full-page images use `(0, 0, 1, 1)`. Crops retain their position on the original page rather than resetting provenance to an anonymous picture.

Before sending images, check tenant and current document-version permissions. The count endpoint receives the same images, so it needs the same permission and data-residency approval as generation. The adapter reserves 1,024 output tokens and rejects an over-budget request. It uses a shared 25-second deadline around counting and generation. The existing transport bounds individual attempts and response bodies; repeated generation can still incur repeated charges. No hidden repair loop exists here.

The output uses a tool schema as a typed return envelope. It does not execute a business tool. Unknown tool names, missing citations, unseen IDs, duplicates, refusal and truncation fail. An `unknown` answer contains no asserted answer or citations. Provider text outside the expected envelope also fails instead of being shown unchecked. Client validation is required even when the model follows a schema.

Simple example: send page 2 and a crop of page 3. A response citing `page-9` is rejected because that evidence was not sent. A response citing the crop retains the original document hash and page 3 coordinates. A valid ID does not prove the answer is true. Evaluate text/number support and inspect difficult charts before claiming grounding.

Exercise: revoke permission after counting, before generation. The next authorization check must stop generation. Repeat after generation, before release; no answer may be released. Then send an unreadable chart and expect abstention rather than fabricated exact numbers. The fake image tests verify contracts only, not these model-quality outcomes. Treat image instructions as untrusted content and keep irreversible actions outside this adapter.

Use an isolated parser worker for untrusted image decoding; byte/pixel checks are not a native-decoder sandbox. Reject errors rather than sending the unvalidated original. Ask the teacher to review crop provenance and the distinction between valid citations and supported claims.

Sources: [Claude vision input contract](https://platform.claude.com/docs/en/build-with-claude/vision), [tool definitions](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools).
