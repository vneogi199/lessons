# Evaluated RAG: runnable local baseline

Python 3.9+ standard library only. No installation, account, key or model is needed for tests/evaluation. This is a real local HTTP/SQLite implementation, not a deployed production service.

## Run the checks

From this directory:

```sh
python3 -m unittest -v
python3 evaluate.py
```

The tests exercise persistence, tenant isolation, editor permissions, immutable versions, stale retries, deletion, invalid model citations, provider failure and actual loopback HTTP requests. Evaluation now has 12 versioned synthetic cases, including challenge cases; passing them would not establish production answer quality. The expanded tests and evaluation have **not been run**, per the user's instruction.

### What the expanded evaluation measures

- Paraphrases with no matching keywords; overlapping words without the requested facts.
- Replacement with a new version, deletion, and two conflicting policies.
- Untrusted instructions inside a retrieved document, without access to another tenant's corpus.
- Citation document/version/page/chunk/title/quote against the current tenant-scoped database.
- Expected abstention, required answer terms and forbidden answer terms, with per-slice results.

Each case gets its own baseline database before applying its mutations. Known gaps still count as failures and produce a nonzero evaluation exit code: synonym retrieval, answerability and conflict handling are not implemented by the lexical baseline. These are product targets, not assertions that current behavior is correct. An `evidence` response does not claim an answer, but it still falls short of the abstention target for the challenge cases.

The injection document can appear as an explicitly labeled excerpt; that is not the same as obeying it. A separate mock-model test deliberately returns an unsafe answer with a valid citation and verifies that the fixture-specific answer rule rejects it. This exposes the lack of semantic grounding enforcement; it is **not** a live model jailbreak test. Human entailment labels and real-provider evaluations remain outstanding. Substring rules are narrow regression checks, not general safety classifiers.

## Start locally

Create a private `accounts.local.json` outside Git using your editor. Generate separate random tokens with `python3 -c 'import secrets; print(secrets.token_urlsafe(32))'`. Do not paste secrets into chat or commit them.

```json
[
  {"token": "REPLACE_WITH_RANDOM_EDITOR_TOKEN", "tenant": "A", "role": "editor"},
  {"token": "REPLACE_WITH_RANDOM_READER_TOKEN", "tenant": "A", "role": "reader"}
]
```

Restrict the file permissions to its owner. The placeholders above are not credentials. Add tenant B with different tokens to test isolation. Tokens map to tenant/role on the server; requests cannot select their own tenant.

```sh
python3 app.py --accounts accounts.local.json --db rag.sqlite3
```

The server binds only to `127.0.0.1:8080`. It uses a serial standard-library HTTP server: do not expose it through a public proxy, tunnel or port forward. Rotate/revoke tokens by updating the private file and restarting. Existing files must already have appropriate permissions; startup's restrictive umask applies only to new files.

## API contract

All routes except `/health` require `Authorization: Bearer <token>`. POST requests require `Content-Type: application/json` and Content-Length. Responses are JSON, no-store, with a request ID. Unknown fields and duplicate JSON keys are rejected. No browser CORS access is enabled.

| Method | Route | Role | Body/result |
| --- | --- | --- | --- |
| GET | `/health` | None | Liveness only, not model readiness |
| POST | `/documents` | Editor | `{ "id":"refund", "version":"v1", "title":"Policy", "pages":["Refunds are accepted within thirty days."] }` |
| POST | `/ask` | Reader/editor | `{ "question":"What is the refund policy?" }` |
| DELETE | `/documents/refund` | Editor | Remove the tenant's current document/chunks |

Use an HTTP client with a private credential store. Do not place literal tokens in command history. The ingestion format is already-extracted text pages, not arbitrary PDFs or remote URLs. Input caps: 150 KB request, 100,000 characters/document, 50 pages, 250 chunks/document, 100 active documents/tenant. Chunking uses 120 whitespace words with a 100-word step, preserving page numbers; these are not model token counts.

Documents publish atomically in SQLite. Reusing a version with different content is a conflict; a delayed old-version retry cannot roll back current publication. Deletion retains digest-only revision tombstones so an old retry cannot resurrect content. Explicitly publishing a new version after deletion is allowed. Tombstones grow with versions and need a retention policy at scale. Disk backups, WAL/journals and filesystem recovery are outside logical deletion guarantees.

## Hybrid extension and chunk experiments

The [worked lesson](../../reference/retrieval-index-practice.html) adds chunking.py,
hybrid.py and test_hybrid.py. The HTTP server still defaults to lexical Store.
To assemble the hybrid path in an approved session, construct
`HybridStore(database_path, encoder, dimension)` and pass it to the existing
`server(store, accounts)`. Authentication and versioned ingestion are reused.

An encoder takes texts and returns same-length, same-dimension vectors.
`LocalEncoder(existing_model_directory)` requires an already-installed
SentenceTransformer library and approved local model files; it disables downloads
and remote code. Model identity, revision and dimension are deployment inputs.
Tests use hand-authored concepts, not learned embeddings. They check filtering
before encoding, updates, deletion, context bounds and provenance. The temporary
exact index rebuilds on each query and caps input at 500 chunks. Object ACLs remain
pending; tenant authorization is inherited.

chunking.py is a separate span experiment; it does not change the baseline's
120-word ingestion splitter. `overlap_report` computes duplication, serialized
bytes, gold-span containment and context coverage. Semantic boundaries take an
adjacent-sentence similarity callback; long sections fall back to bounded spans.
Character limits are not embedding-token limits. Source/version changes alter IDs.

When authorized, `python3 -m unittest -v test_hybrid` runs the new stdlib fixtures.
None has been run. Existing challenge evaluations still have known quality gaps.

## Retrieval and generation

The default is tenant-filtered BM25-style lexical retrieval with up to three chunks and verbatim cited excerpts. It returns `status: evidence`, not a claim of synthesized answering. No lexical match returns `insufficient_evidence`. Lexical overlap is not an answerability classifier; synonyms and conflicting evidence need richer evaluation.

If Ollama and a model are **already available**, explicitly opt in:

```sh
python3 app.py --accounts accounts.local.json --ollama-model YOUR_EXISTING_MODEL
```

This calls only the local `127.0.0.1:11434/api/chat` endpoint. It does not install, pull or start a model. It sends the question and authorized retrieved excerpts to that service, requests bounded structured output, and validates cited evidence IDs. Provider failures return 502; changed evidence returns 409 rather than releasing a stale response. No automatic retry or silent fallback occurs.

Generated responses are marked `generated`. Valid citation IDs do **not** prove factual entailment or defeat prompt injection. Retrieved text is untrusted; the generator has no tools or write capabilities. Review the [Ollama chat contract](https://docs.ollama.com/api/chat) and [structured outputs](https://docs.ollama.com/capabilities/structured-outputs). Live model behavior is not verified by mock tests. The socket timeout is not a strict end-to-end cancellation guarantee.

## Operations and honest limits

- Request logs contain only request ID, status and latency—not tokens, queries or documents. No cost or token-usage dashboard is implemented yet.
- Stop with Ctrl-C; restart against the same DB to retain documents. Back up a stopped database using an approved process, test restore separately, and protect backups like source data.
- The optional hybrid extension supplies an exact in-memory vector index and postings search. No external vector database, reranker, UI, OCR, ingestion worker, OAuth/SSO, production rate limiter, container deployment or cloud CI is claimed here.
- Authorization is tenant-wide with reader/editor roles, not per-document ACLs. The direct Python Store API assumes trusted caller-supplied tenant context; HTTP derives it from the token.
- Do not interpret the synthetic cases as a representative held-out benchmark. Add independently labeled real task cases and human-groundedness labels before comparing retrieval/model variants. The hybrid extension is unexecuted; reranking is not wired into this baseline.
- Before production: hardened serving, TLS/identity, capacity/rate limits, secret rotation, document ACLs, deletion/backup retention, real load/fault tests, and a reviewed deployment/rollback plan.

The curriculum's [project guide](../../reference/ai-engineer-practice.html#rag-project) describes the broader target. This baseline implements the local vertical slice and leaves the above gaps explicit.
