# Curriculum gaps and practical lesson backlog

Recorded: 2026-10-04. Audience: a developer with about 10 years of experience preparing for senior full-stack AI/FDE interviews, studying 6–8 hours per week.

This consolidates the recent topic-by-topic coverage checks and preserves older open items from [pending.txt](pending.txt). Existing explanations, examples and build briefs are not missing topics by default. The tasks below close specific gaps in depth, implementation or verification. Extend an existing lesson or linked lab when appropriate; create a new lesson only when the scope warrants it.

## Completion rules

- Keep explanations plain and technically precise. Include a small worked example, expected results, a failure case and relevant interview questions with answers.
- For implementation tasks, supply the referenced files and adapters. Clearly label mocks, placeholders and optional external integrations.
- Include tests and explicit acceptance criteria. Record separately whether checks are static, offline, integration or deployment checks. Do not claim unperformed verification.
- Preserve the existing no-install instruction. Do not provision services, download models, send messages or incur costs without separate authorization. Prepare examples and tests without running them when execution is not authorized.
- Use synthetic data. Keep secrets, private documents and customer information out of source, screenshots and traces.
- Completed bespoke examples across all 665 catalog pages do not close the implementation gaps below.

## 1. Python and Linux foundations

All 15 requested topics were found in lessons 0260–0302, 0001, 0508 and 0510, with the thread-pool and user-management extensions in [data preparation and terminal practice](reference/data-preparation-and-terminal.html).

No new content gap was identified in that check. Runtime verification of optional integrations remains separate; do not duplicate these lessons merely to expand the catalog.

## 2. Modern API development

Existing: lessons 0303–0345, 0408, 0413 and [API/cloud delivery labs](reference/api-cloud-delivery-labs.html).

- [x] API-01 — Supply a connected FastAPI CRUD example. Include request/response models, dependency injection, database sessions, transaction ownership, pagination, authorization, stable errors and bounded resource use. Test create/read/update/delete, duplicate requests, missing records and concurrent updates.
  - Authored 2026-10-04: [worked RFQ lesson](reference/rfq-crud-practice.html) and [project](practice/rfq-api/README.md) supply SQLite CRUD, tenant authorization, replay storage, version checks, body/admission bounds and seven test functions. Tests are supplied but not executed; runtime verification remains open under VERIFY-01. Production identity integration belongs to IAM. SQLite, per-process admission and retention limitations are explicit.
- [x] API-02 — Complete the Strawberry integration with repository adapters and schema-execution tests. Verify queries, mutations, request-scoped loaders, result ordering, missing children, tenant isolation and mutation cache invalidation. Measure SQL counts for N+1 prevention. Graphene currently has a comparison only; a second implementation is optional, not required to satisfy the original “Strawberry or Graphene” request.
  - Authored 2026-10-04: [GraphQL project](practice/graphql-orders/README.md), SQLite trace-count assertions and [worked lesson](reference/api-query-practice.html#graphql). Actual execution and SQL counts remain unverified under VERIFY-01.
- [x] API-03 — Turn the version-selection and developer-workflow recipes into a small reproducible project: URL/header version routing, cache-isolation tests, pytest fixtures/mocks, branch-coverage interpretation and a project-matched debugger configuration. Supply configuration rather than installing extensions. Keep coverage percentage separate from assertion quality.
  - Authored 2026-10-04: [versioned API](practice/versioned-api/README.md), warmed-cache fixture, pytest/debugger configurations and [worked feedback](reference/api-query-practice.html#versioning). No framework tests, coverage collection or debugger session executed.

## 3. Cloud fundamentals and networking

Existing: lessons 0479–0494, 0504 and the provisioning/billing sections of [API/cloud delivery labs](reference/api-cloud-delivery-labs.html). All 13 requested subjects have explanations or walkthroughs; deployed behavior was not verified.

- [x] CLOUD-01 — Provide a cohesive provisioning recipe with explicit prerequisites, inputs, resource ownership and teardown: EC2, private RDS, S3 lifecycle rules, event-driven Lambda, VPC/subnets, NAT or endpoints and narrowly scoped security groups. Include allow/deny, duplicate-event and restore checks. Separate resource creation instructions from permission to run them.
  - `practice/cloud-foundation/` supplies private-network Terraform resources, receipt-only Lambda, mock checks and an explicit allow/deny/restore/cleanup recipe. No provider initialization, validation, plan or cloud execution performed.
- [x] CLOUD-02 — Add a concrete cross-account trust/caller-permission/target-permission example with permitted and denied assumption cases. Include scoped session behavior and third-party external-ID considerations where applicable.
  - [Three JSON policy files and validation recipe](practice/cloud-controls/README.md). Synthetic accounts/resources; no AWS calls or permissions changed.
- [x] CLOUD-03 — Extend budget walkthroughs with a reproducible notification-validation exercise and an optional reviewed budget-action design. Distinguish alerts from enforced workload limits; do not supply an unreviewed destructive spending response.
  - [Budget exercise](practice/cloud-controls/README.md) separates topic tests from actual budget-trigger evidence; non-destructive admission-pause design and cleanup ownership included. Unexecuted.

## 4. Containerization and CI/CD

Existing: lessons 0342, 0487, 0491, 0512–0518, 0530–0545 and the ECS delivery lab.

- [ ] DELIVERY-01 — Supply the files omitted by the release recipe: FastAPI Dockerfile, Compose setup, task definition, CI test/smoke scripts and GitHub Actions workflow. Connect build, registry publication and ECS deployment around one verified immutable artifact. Document required pre-existing infrastructure and failure/rollback behavior.
- [x] DELIVERY-02 — Add complete ECS Application Auto Scaling target/policy examples: minimum/maximum tasks, chosen metric, cooldowns, scale-in draining and downstream database/provider limits. Include a controlled validation plan, not invented load results.
  - [Scaling JSON inputs and recipe](practice/cloud-controls/SCALING.md) include rollout surge capacity, draining and rollback/ownership checks. No AWS calls or load tests performed.
- [x] DELIVERY-03 — Add GitHub Secrets administration practice: repository versus environment scope, creating/referencing/rotating a synthetic secret, unavailable-secret behavior, fork/runner restrictions and log-leak prevention. Keep AWS deployment authentication on OIDC rather than introducing long-lived AWS keys.
  - [Secrets lab](practice/cloud-controls/GITHUB-SECRETS.md), with inactive YAML example and acceptance cases. No active workflow, secret or external account changed.

## 5. LLM fundamentals and prompting

Existing: lessons 0581, 0587–0590 and [context/typed-output/tool labs](reference/retrieval-document-labs.html).

- [x] LLM-01 — Add an actual model-specific token-counting example alongside the supplied-count arithmetic. Account for messages, tools, evidence and reserved output; compare estimates with recorded usage when an authorized provider run is available.
  - Authored 2026-10-04: Claude count endpoint, output reservation and response-usage comparison in [model boundaries](practice/model-boundaries/README.md). Mock HTTP tests supplied. Live recorded usage remains VERIFY-01; no provider count fabricated.
- [x] LLM-02 — Implement a context-window/compression comparison fixture. Preserve complete tool-call/result pairs, early constraints, updated facts and provenance. Compare full history, recent-window history and summary-plus-history without treating a summary as authoritative.
  - Authored 2026-10-04: [context fixture and tests](practice/model-boundaries/README.md). Word-budget comparison and exact summary references are explicit teaching limits; no generated-summary quality claim.
- [x] LLM-03 — Implement a tested bounded parsing/repair wrapper. Separate malformed JSON, schema failure, refusal, truncation, transport failure and business/authorization rejection. Bound attempts and total time; never retry an external effect because its narration failed validation.
  - Authored 2026-10-04: [structured parser, retry owner and fake-provider tests](practice/model-boundaries/README.md). Tests are supplied, not executed; VERIFY-01 retains runtime verification. Real provider adapter remains LLM-04.
- [x] LLM-04 — Supply a complete provider/tool continuation loop with precise schemas, validated arguments, unknown-tool rejection, independent parallel reads, per-call results and correct call-ID correlation. Include deadlines, partial failure, repeated IDs, side-effect safeguards and deterministic fake-provider tests.
  - Authored 2026-10-04: Claude continuation loop, fixed-endpoint HTTP adapter and fake-provider/HTTP tests in [model boundaries](practice/model-boundaries/README.md). Explicitly read-only; live provider/runtime verification remains open.

## 6. Vector search and core RAG

Existing: lessons 0577, 0594–0602, [retrieval labs](reference/retrieval-document-labs.html), [Pinecone recipe](reference/enterprise-ai-practice.html) and [reranking practice](reference/cross-encoder-reranking.html).

- [x] RAG-01 — Implement fixed-size and semantic-boundary chunkers with bounded fallback sizes, source spans and deterministic identities. Add the overlap sweep with measured duplication, boundary-answer recall, index size and context coverage.
  - Authored 2026-10-04: chunking.py and tests in [RAG project](projects/evaluated-rag/README.md); report computes duplication, bytes, gold-span containment and context coverage. Containment is explicitly distinct from end-to-end retrieval recall. Measurements remain unexecuted.
- [x] RAG-02 — Add a worked embedding-dimension comparison with controlled model/metric contracts, memory arithmetic and quality/cost tradeoffs. Do not mix incompatible embedding spaces or invent benchmark results.
  - [Worked raw-storage arithmetic and experiment contract](reference/retrieval-index-practice.html); no quality/performance numbers invented.
- [x] RAG-03 — Extend the BM25 mechanics example with a concrete sparse document–term/postings representation and keyword-query trace. Explain that the current Counter-based example is not a production search engine.
  - hybrid.py supplies Postings, BM25-style scoring and RRF; tests assert postings and missing candidates. [Worked trace](reference/retrieval-index-practice.html).
- [x] RAG-04 — Supply explicit cloud-vector-index creation/configuration and cleanup recipes. Cover region, dimensions, metric, scoped credentials, readiness, filtered query, update/delete and visibility checks. The existing Pinecone example assumes an index already exists.
  - [Pinecone recipe](practice/pinecone-index/README.md), with approval boundaries and acceptance checks. No cloud execution or credential setup performed.
- [x] RAG-05 — Connect ingestion → embeddings → index → keyword/vector retrieval → RRF → bounded context into one small testable retrieval project. Preserve permissions and provenance; test updates, deletions, empty results and missing relevant candidates.
  - HybridStore extends the existing [versioned RAG project](projects/evaluated-rag/README.md), with ephemeral exact index, optional approved local encoder and explicit synthetic-test scope. Rebuilding per query and tenant-wide authorization are documented limits. Tests unexecuted.
- [x] RAG-06 — Complete the hosted-reranker adapter with bounded timeout/retry/fallback behavior and tests for out-of-order indexes, duplicates, malformed responses and unavailable service. Retain source identity and distinguish reranked results from fallback results.
  - [Cohere adapter and MockTransport tests](practice/model-boundaries/README.md) reuse the retry owner. Separate from baseline server; live provider verification remains VERIFY-01.

## 7. Multimodal RAG and vision AI

Existing: visual-retrieval/document-layout sections in [retrieval labs](reference/retrieval-document-labs.html) and the brief PDF adapter in [data preparation](reference/data-preparation-and-terminal.html).

- [x] VISION-01 — Build a document/page classification fixture for native text, scans, mixed content, forms, tables and charts. Preserve immutable source/version/page identity and reading-order evidence.
  - [Six synthetic page fixtures](practice/document-pages/README.md), immutable identity, multi-label classifier and validation tests supplied. No PDF parsing or classification accuracy claimed; tests unexecuted.
- [ ] VISION-02 — Implement a bounded OCR pipeline adapter with isolated rendering, preprocessing decisions, text/layout output, error handling and quality checks. Use approved synthetic fixtures; no automatic engine/model downloads.
- [ ] VISION-03 — Add actual ColPali processor/model integration for an already provisioned environment, including page rendering, multi-vector indexing and late-interaction retrieval. Keep the existing synthetic MaxSim exercise distinct from inference evidence.
- [x] VISION-04 — Add a small vision-language bridge walkthrough showing patch representations, projection/attention and language-model input shapes. Contrast retrieval encoders with generative VLMs without claiming one universal architecture.
  - [Shape walkthrough](reference/vision-bridge-practice.html) uses an explicitly synthetic architecture, worked dimensions, counterexamples and answer keys. No inference performed.
- [x] VISION-05 — Provide a complete image-prompting API adapter with page/crop IDs, bounded image inputs, typed answers, refusals, timeouts and citation checks. Include a fake transport for offline contract tests.
  - `practice/model-boundaries/vision.py`, `test_vision.py` and `VISION.md` reuse the Claude transport and add image/page provenance, count-before-generation, permissions, abstention and citation checks. Tests and model behavior remain unexecuted.
- [x] VISION-06 — Implement an image-to-image search example with an approved local CLIP-style encoder, index contract and labelled results. Contrast image identity, similarity and task relevance.
  - [Local CLIP adapter and exact image index](practice/visual-search/README.md) include local-only loading, contract checks, labelled results, tenant filtering and revocation tests. Fake-vector tests and real inference remain unexecuted.
- [ ] VISION-07 — Implement nested-table extraction and XML/JSON-style structural validation as appropriate to the chosen document provider. Preserve hierarchical headers, merged cells, units, footnotes and per-field source boxes; test totals and missing cells.
- [x] VISION-08 — Add chart/infographic practice fixtures with answer keys: linear/log/dual axes, truncated scales, legend ambiguity and approximate versus exact values. Measure evidence support separately from fluency.
  - [Six synthetic chart fixtures](reference/chart-evidence-practice.html) include answer keys and separate evidence, precision and readability scoring. No learner/model scores or browser verification claimed.
- [ ] VISION-09 — Complete chunk-to-box alignment and overlay verification, including rotation/scale transforms, multi-box chunks and mismatched-coordinate failure tests. Normalization alone is not alignment.
  - Authored [offset alignment, transforms, SVG overlay and tests](practice/document-pages/README.md). Real rendered-page overlay verification remains pending; no visual result claimed.
- [ ] VISION-10 — Connect legacy PDF ingestion → OCR/layout or visual embeddings → retrieval → multi-page answer with page/box citations. Test missing pages, split table headers, conflicting versions, permissions and image-token budgets.

## 8. Agentic frameworks and LangGraph

Existing: lessons 0603–0611 and [advanced graph lab](reference/agent-operations-capstones.html).

- [x] GRAPH-01 — Implement a bounded Plan & Execute workflow with typed plans, executor results, replanning criteria and stop/failure rules. Compare it with a fixed workflow and ReAct on the same deterministic cases.
  - [Workflow project](practice/agent-workflows/README.md) supplies typed steps, bounded replan, same-case strategy comparison and tests. Deterministic planner fixtures, no model-performance claim.
- [x] GRAPH-02 — Implement an actual supervisor coordinating specialist workers. Define authority, routing, disagreement resolution, partial results, deadlines and evidence ownership; do not treat worker agreement as correctness proof.
  - Actual LangGraph supervisor/worker subgraph with read-only adapters, scope checks, incomplete/conflict outcomes and human-review terminal state. Tests authored, not executed.
- [x] GRAPH-03 — Extend the static parallel child graph into dynamic map-reduce with stable work-item IDs, bounded fan-out, deterministic merging and conflict/duplicate handling. Test varied completion order and one failed worker.
  - Dynamic Send dispatch, bounded concurrency, stable result slots, merge-order and duplicate/conflict tests; failed worker retained explicitly. See [worked lesson](reference/agent-workflow-practice.html).
- [x] GRAPH-04 — Add an integration test suite for state schemas, nodes/edges, conditional routing, compile/invoke, async branches and nested parent-child graphs. Separate already-written recipe coverage from runtime-verified behavior.
  - test_graphs.py supplies the framework integration suite. Execution remains VERIFY-01; no runtime signoff inferred.

## 9. Advanced agent orchestration

Existing: lessons 0604, 0606–0609, 0611 and managed-memory/enterprise AI extensions.

- [x] AGENT-01 — Add persistent checkpoint storage and process-restart recovery. Test interrupted nodes, replay before/after external effects, tenant-scoped run identity and checkpoint compatibility. InMemorySaver is not durable storage.
  - SQLite checkpoint and separate-process tests in [agent project](practice/agent-workflows/README.md). Effect fixture is local/idempotent; remote-effect reconciliation is explicitly not claimed. Tests unexecuted.
- [x] AGENT-02 — Implement semantic long-term memory retrieval with source/version metadata, consent, tenant/owner filters, expiry, deletion and stale-fact handling. Keep semantic facts distinct from episodic history.
  - memory.py and storage tests: scoped vector retrieval, immutable revisions, consent, source filters, expiry and tombstones. Synthetic encoder; release-time revalidation and backup limits documented.
- [x] AGENT-03 — Complete authenticated manual-approval storage and resume handling. Bind actor, tenant, exact payload/version/hash and expiry; serialize conflicting decisions and reject stale approvals.
  - approval.py supplies hashed opaque sessions, payload-bound decisions and checked graph resume. Session issuance requires verified server identity; HTTP/SSO and distributed lease integration remain separate. Crash-after-claim recovery is explicitly operator-mediated, not exactly-once remote execution.
- [x] AGENT-04 — Implement explicit repeated-action/cycle/no-progress detection alongside step, time and spend limits. Test legitimate repeated reads, changed arguments and blocked external calls.
  - Guard and tests cover bounded polling, evidence changes, cycles, no progress and admission budgets. Cost units are synthetic reservations, not billed-dollar telemetry.
- [x] AGENT-05 — Implement a bounded self-correction loop driven by validation or evidence failures. Compare correction against baseline; prevent endless critique and distinguish prompted self-critique from trained Self-RAG.
  - Correction controller/tests compare a failing baseline with one correction and a stalled loop. Citation-marker fixture does not establish entailment. All tests remain unexecuted.
- [ ] AGENT-06 — Add complete managed-agent provisioning/version/alias and knowledge-base integration recipes, with scoped roles, readiness checks, allowed/denied documents and teardown. Current Bedrock coverage is a walkthrough, not an executable provisioning package.

## 10. Legacy systems and integrations

Existing: [enterprise connectors and security labs](reference/enterprise-security-labs.html).

- [x] CONNECT-01 — Complete Slack event/webhook and interactive-action handlers around the signature fixture: bounded raw input, replay storage, durable acknowledgment, scoped bot permissions and payload-bound approvals.
  - `practice/slack-inbox/` supplies the signed FastAPI route, bounded durable SQLite inbox, exact-intent approval adapter and offline tests. Single-host/worker and timeout limits are explicit. No tests or Slack setup executed.
- [ ] CONNECT-02 — Add a separate supported Teams bot/Workflow integration recipe and deterministic callback tests. Do not reuse Slack authentication assumptions; include token/secret lifecycle and Adaptive Card action validation.
- [ ] CONNECT-03 — Implement an authorized Jira issue reader and ticket-creation adapter with field/project allowlists, rich-text handling and operation-ledger reconciliation after lost responses. Explain and separately scope Confluence page access.
- [x] CONNECT-04 — Supply a local synthetic WSDL/XSD bundle and success/fault XML fixtures. Generate envelopes with Zeep, inspect namespaces/types and test safe parsing, imports, malformed XML and transport limits.
  - [Legacy project](practice/legacy-integrations/README.md) supplies local-only Zeep transport, fixtures and rejection tests. No network transport or execution claimed.
- [x] CONNECT-05 — Add a typed SOAP fault/legacy-code mapping and retry policy. Preserve safe diagnostic categories and reconcile uncertain mutations before retrying.
  - Typed FaultDecision maps read-retry versus uncertain-write reconciliation; tests cover BUSY/AUTH/INVALID. Raw private diagnostics stay out of output.
- [x] CONNECT-06 — Implement a domain-specific SOAP/XML-to-JSON converter preserving namespaces, repeated elements, attributes, decimal/date types and absent-versus-null semantics. Validate the output against fixtures.
  - Strict RFQ converter and expected fixtures in [legacy project](practice/legacy-integrations/README.md). Domain-specific, not a generic lossless converter; tests unexecuted.
- [x] CONNECT-07 — Add explicit secure pyodbc, python-oracledb and SQLAlchemy connection-factory recipes with certificate verification, external credentials, pools, timeouts and cleanup. Existing query examples assume connections are supplied.
  - databases.py supplies factories/context managers and shutdown guidance. Drivers/wallets/accounts are prerequisites; no connections opened.
- [x] CONNECT-08 — Connect curated schema context → typed intent → approved parameterized SQL → bounded result/fallback. Include read-only-role denial tests and ambiguous requests. If free-form SQL is included, implement a dialect-specific AST allowlist rather than a SELECT-prefix check.
  - Curated SQL Server templates, typed compiler/executor, mocks and explicitly opt-in principal-denial integration test. No arbitrary SQL; ambiguous input needs clarification. DB permission/TLS/runtime evidence remains VERIFY-01.

## 11. Identity and access management

Existing: lessons 0326–0327, 0416, 0480 and the Entra/SAML extensions.

- [x] IAM-01 — Add a comprehensive grant-selection lesson: authorization code + PKCE, client credentials, refresh tokens and relevant device-flow use cases. Explain legacy/unsuitable flows and distinguish OAuth from OIDC.
  - [Grant-selection practice](reference/oauth-grant-practice.html) supplies caller cases, login sequence, refresh concurrency and interview answers. Runtime integrations remain separate.
- [x] IAM-02 — Implement an end-to-end OIDC login recipe with a fake issuer/test transport, callback/session handling and wrong-state/issuer/audience/expiry cases. Provide an optional approved-IdP integration path.
  - `practice/oidc-login/` supplies the fixed-issuer code/PKCE flow, PyJWT validation, opaque sessions, CSRF logout and signed fake-issuer tests. No tests, browser login or IdP integration executed.
- [ ] IAM-03 — Complete SAML integration using a maintained implementation and synthetic assertions. Test audience, request correlation, replay, expiry, key rollover and session creation; do not write a custom XML-signature verifier.
- [x] IAM-04 — Connect verified Entra identity → group-overage resolution → local RBAC → object permissions. Test membership revocation and cache/session propagation, not only the existing post-verification mapping function.
  - `practice/entra-access/` supplies fixed-endpoint Graph lookup, bounded cache, fresh approval lookup, local revocation epochs, role/object checks and fake-verifier/HTTP tests. Login/signature verification remains IAM-02; tests and directory integration are unexecuted.
- [x] IAM-05 — Implement and test data-level authorization across lexical/vector/graph retrieval, parent expansion, model/reranker exposure and answer caches. Include revoked/deleted documents and cross-tenant negative cases.
  - [Retrieval permission fixture](practice/retrieval-permissions/README.md) implements all three paths, parent/edge checks, reranker/model boundaries and revisioned cache invalidation. Tests supplied but unexecuted; production identity/database integration remains separate.

## 12. Production AI security and guardrails

Existing: [enterprise security labs](reference/enterprise-security-labs.html), lessons 0615–0617.

- [x] SECURITY-01 — Complete Presidio analyzer configuration for already-approved local assets and synthetic SSN/card/email/domain-ID fixtures. Test recognizers, thresholds, invalid/checksum negatives and unsupported inputs.
  - `practice/pii-evaluation/presidio_adapter.py`, local-asset test cases and `PRESIDIO.md` connect actual detection to the scorer. Explicit registry and local-only model loading. No tests or assets executed; verification remains open.
- [x] SECURITY-02 — Implement an encrypted, short-lived reversible-pseudonymization store. Bind mappings to tenant/user/run, deny unknown or replayed tokens and re-scan restored outputs. The existing dictionary example tests policy only.
  - [Encrypted one-use store](practice/pseudonym-store/README.md) binds envelope/scope/expiry, consumes tokens atomically and requires authorization plus output re-scan. Key management and scanning are explicit deployment inputs. Tests supplied, unexecuted.
- [x] SECURITY-03 — Build a PII scoring harness with span/entity precision and recall, explicitly defined false-positive denominator, per-type/language slices and utility-loss reporting.
  - [Scorer and tests](practice/pii-evaluation/README.md) use exact typed spans, character FPR, Unicode offsets, language/type intersections and task-labeled utility spans. No detector quality claimed; tests unexecuted.
- [ ] SECURITY-04 — Complete the pinned Colang/NeMo configuration: actual scope-check action, model adapter, self-check prompt, input/output rails and topical-boundary tests. Keep semantic topicality separate from authorization.
- [x] SECURITY-05 — Implement the native Python input → authorization → redaction → retrieval → generation → output validation/PII → release pipeline. Define fail-closed/review behavior and safe streaming release.
  - [Buffered pipeline](practice/secure-pipeline/README.md) connects injected boundary adapters, scoped/redacted model inputs, typed citation checks, output policy and pre-release reauthorization. Tests supplied but unexecuted; real identity/detector/model adapters remain explicit inputs.
- [x] SECURITY-06 — Complete Bedrock guardrail clients, creation/version promotion, INPUT and OUTPUT application, action/transformed-output handling, deadlines and failure tests. Use mocked SDK responses before any approved cloud run.
  - `practice/bedrock-guardrail/` supplies the SDK adapter, administrative creation/snapshot functions, promotion recipe and mock checks. Interventions deny even when transformed text exists. Transport versus wall-clock limits are explicit. Tests and cloud behavior remain unexecuted.
- [x] SECURITY-07 — Integrate an approved jailbreak-testing library or reproducible synthetic attack harness. Cover direct/indirect injection, tool-output attacks, exfiltration, benign lookalikes and guardrail outages; report unsafe pass rate, benign block rate, utility and latency. Never promise total prevention.
  - [Synthetic harness](practice/attack-evaluation/README.md) supplies seven cases, injected application contract, outcome metrics and failure-reporting tests. No model or test executed; live adapter evidence remains unverified.

## 13. AI observability and gateway management

Existing: lessons 0589–0590, 0609, 0612–0616 and [gateway/evaluation/tracing labs](reference/agent-operations-capstones.html).

- [ ] OPS-01 — Supply a deployable LiteLLM or Portkey example for an authorized environment: scoped virtual credentials, provider-key management, aliases, rate limits, compatible fallback routes and rotation/revocation. Choose one working implementation and explain the other.
- [x] OPS-02 — Implement bounded exponential backoff with jitter, Retry-After handling and a total deadline in the shared gateway/tool adapter. Test layered retry amplification and uncertain side effects; reuse LLM-03/LLM-04 rather than duplicating retry code.
  - Authored 2026-10-04: shared retry.py integrated into the Claude transport, with call-count, Retry-After and uncertain-effect tests. No retries of tool writes. Tests not executed; cancellation and billing limits documented.
- [x] OPS-03 — Connect deterministic checks and calibrated LLM judges into an evaluation runner and CI release artifact. Include missing scores, grader disagreement, critical slices and declared release gates.
  - [Release runner](projects/evaluated-rag/RELEASE-EVAL.md) connects existing deterministic cases to bounded injected judges, calibration and JSON release artifacts. No provider configured or tests executed; CI activation remains explicit.
- [x] OPS-04 — Extend the Ragas recipe to calculate answer relevance and context precision as well as its existing faithfulness/correctness/context-recall metrics. Pin metric variants and adapters; include required references, missing-label behavior and controlled test cases.
  - [Ragas 0.2.15 recipe](projects/evaluated-rag/RAGAS.md) supplies five explicit metric variants, adapter contracts, missing/error statuses and controlled cases. Fake-metric tests supplied; SDK/model execution remains unverified.
- [x] OPS-05 — Implement source-grounded synthetic evaluation-data generation with document-family splits, provenance, human review and answerability checks. Include unanswerable, contradictory, stale and forbidden-source cases.
  - [Source-bound candidate builder](projects/evaluated-rag/DATASET-BUILDING.md) supplies five slices, family splits, provenance hashes and review-required export. Templates propose cases; human answerability review remains mandatory. Tests unexecuted.
- [x] OPS-06 — Persist evaluation runs with dataset/model/prompt/index/guardrail versions and paired per-case results. Provide comparison reports across deployments, including failures, counts, costs and uncertainty.
  - [Immutable SQLite run history and paired comparison](projects/evaluated-rag/RELEASE-EVAL.md) include version checks, regressions, missing-cost counts and seeded bootstrap intervals with limitations. Tests supplied, unexecuted.
- [x] OPS-07 — Instrument the full request tree: retrieval, reranking, model attempts, tools, approvals and queued work. Configure an exporter/collector, context propagation, redaction, sampling and error statuses; the current example supplies only one retrieval span.
  - `practice/ai-tracing/` supplies the async request/queue tree, OTLP exporter/collector configuration, privacy allowlist and in-memory-exporter tests. Business adapters are injected; no tests, collector or live export executed.
- [x] OPS-08 — Supply token-cost and latency metric collection plus dashboard definitions. Include billed retries/failures, cached-token distinctions, time to first token, endpoint percentiles and cost per successful task.
  - Authored `practice/ai-metrics/`: bounded Prometheus collectors, fake billing checks and Grafana dashboard JSON. Distinguishes unknown cost, disjoint cache categories and first released token. Tests and dashboard import remain unexecuted under VERIFY-01/02.
- [x] OPS-09 — Add a multi-step debugging exercise using observable tool inputs/results, policy decisions and state transitions. Do not expose or collect hidden chain-of-thought.
  - [Trace exercise](reference/agent-debugging-practice.html) includes a synthetic JSON event sequence and five answer keys. No live instrumentation or model reasoning collected.
- [x] OPS-10 — Implement privacy-aware session outcome tracking with pseudonymous IDs in protected traces, bounded retention and low-cardinality aggregate metrics.
  - [Private telemetry project](practice/private-telemetry/README.md) supplies tenant-bound HMAC session IDs, bounded retention and fixed-label aggregates. Storage/key access are deployment prerequisites. Tests unexecuted.
- [x] OPS-11 — Build a redacted trace-export → reviewed failure-case → versioned evaluation-data workflow with consent, lineage and access controls. Do not automatically train on unreviewed private traces.
  - [Consent-bound export workflow](practice/private-telemetry/README.md) exports allowlisted failure metadata tied to reviewed synthetic fixture IDs, dataset versions and lineage. Includes revocation/expiry tests and explicit downstream deletion duties; no export or training performed.

## 14. AuditMesh: connected capstone

Existing: [AuditMesh build brief and Streamlit form](reference/agent-operations-capstones.html). Reuse GRAPH, AGENT, CONNECT, IAM and OPS work rather than creating separate inconsistent versions.

- [x] AUDIT-01 — Supply a worked five-step process map and bottleneck analysis with clearly synthetic handling/waiting times, owners and approval queues.
  - [Delivery pack](practice/client-delivery/DELIVERY-PACK.md): worked 39-minute handling/202-minute waiting case and approval bottleneck experiment. Figures explicitly synthetic.
- [x] AUDIT-02 — Draft a complete latency/cost service-level template: machine time versus human waiting, workload assumptions, budgets, measurement windows, escalation and breach response. Keep targets distinct from measured results and contractual promises.
  - [Delivery pack](practice/client-delivery/DELIVERY-PACK.md): workload, budgets, measurement definitions, escalation and breach response. No measured SLA claim.
- [ ] AUDIT-03 — Assemble the supervisor, evidence/policy workers, deterministic join, persistent state and authenticated approval into one runnable application with fake model/Jira adapters by default.
- [ ] AUDIT-04 — Implement the narrow Jira MCP server and deployment recipe: protocol/session handling, token audience/scopes, project/field allowlists, durable operation IDs, exact-intent approval and uncertain-create reconciliation.
- [ ] AUDIT-05 — Complete the Streamlit approval UI and backend: authenticated sessions, appropriate CSRF protection, approve/reject, stale/changed payload handling, duplicate submissions and separate execution status. A separate Gradio implementation is optional because the requested UI can use either.
- [ ] AUDIT-06 — Ship trace/token-cost dashboard definitions and end-to-end tests for denial, timeout, partial worker failure, restart recovery, duplicate ticket attempts and kill-switch activation.
- [x] AUDIT-07 — Write the operations/training handoff pack: setup, ownership, on-call escalation, revocation, retention, replay, rollback/restore, incident drills and UAT evidence templates. Do not claim live deployment or compliance certification from a passing mock demo.
  - [Handoff/UAT pack](practice/client-delivery/DELIVERY-PACK.md), with named-role placeholders to resolve privately and Not run evidence rows. Deployment/certification not claimed.

## 15. Older open items retained from pending.txt

These predate the latest coverage checks. They remain candidates for audit and implementation, not new claims that the recent lesson-example pass omitted them.

- [x] FDE-01 — Dedicated AI coding-assistant workflow: choose one tool, cover Skills/CLAUDE.md/context management, spec-first planning, diff review, hallucinated APIs, secrets and regression tests.
  - [Claude Code review exercise](reference/ai-coding-review-practice.html) supplies an RFQ contract and review defects with answers. Guidance is inactive; no tool installed or code executed.
- [x] FDE-02 — Aikido security-integration walkthrough with scoped permissions, findings review and false-positive/exception handling; no account connection implied.
  - [Scoped scan walkthrough](reference/ai-coding-review-practice.html) includes approval, triage, exception expiry and removal. No account connected or scan performed.
- [x] FDE-03 — Word SOP and Excel-export ingestion practice with provenance, structure, schemas, malformed files and permission propagation.
  - [Constrained Office adapters](practice/office-ingestion/README.md) supply package bounds, ordered SOP blocks, typed RFQ rows, cell/source provenance and inherited ACL metadata. Unsupported features are explicit; synthetic tests supplied but unexecuted.
- [x] FDE-04 — Complete the shopping-agent assignment with bounded tools, fake external effects, approvals and evaluations.
  - [Shopping project](practice/shopping-agent/README.md) supplies an allowlisted proposal boundary, synthetic SQLite purchases, approval hashes, budgets, replay handling, kill switch and negative tests. Identity is a trusted caller prerequisite; no model or tests executed.
- [x] FDE-05 — Azure ACR and Key Vault delivery/secrets recipes with identity, rotation and failure checks.
  - [Azure recipe](practice/cloud-controls/AZURE.md) covers registry permission modes, separate identities, digest promotion, managed-identity secret access, rotation/revocation and denial drills. No Azure operations performed.
- [x] FDE-06 — Complete Terraform lab with supplied resources, reviewed plan, restricted state, drift checks and exact cleanup; coordinate with CLOUD-01.
  - Reuses `practice/cloud-foundation/`: isolated remote state/locking, saved-plan review procedure, drift experiment and protected teardown. Plan review is an unexecuted learner exercise, not claimed approval or deployment evidence.
- [x] FDE-07 — On-premises operations lessons/labs: kubeadm, Rancher, air-gapped registries and Ollama hosting, including artifact transfer, patching, recovery and network boundaries.
  - [Isolated operations lab](practice/cloud-controls/ON-PREM.md) supplies ownership, artifact inventory, cold-start/denial checks, patching and restore drills. Tabletop recipe only; no installation or cluster operation performed.
- [ ] FDE-08 — Runnable Prometheus/Grafana/Locust and LangSmith/Langfuse/MLflow labs. Reuse OPS instrumentation, add existing-environment prerequisites and separate offline fixtures from live integration results.
- [x] FDE-09 — Complete client-facing architecture/template pack: discovery, requirements, HLD/LLD, API/data contracts, failure sequences, ADRs, SOW, ROI assumptions, UAT and handoff.
  - [Worked delivery pack](practice/client-delivery/DELIVERY-PACK.md) supplies every named artifact using one synthetic case. Unresolved real-client decisions remain explicit.
- [ ] FDE-10 — Build the OmniGuard capstone beyond its brief, reusing the secure API, retrieval, constrained SQL, identity, guardrails and delivery components. Supply mocks, negative tests and a clear optional deployment path.
- [ ] VERIFY-01 — When execution is separately authorized, verify pending NumPy/Pandas/Polars library examples and SDK/database/model integrations in a provisioned environment. Record exact versions, observed results and failures; do not mark them executed based on static checks.
- [ ] VERIFY-02 — When a browser is available, perform the outstanding real-browser/mobile check of catalog diagrams and prediction controls. This is presentation verification, not a missing content lesson.

## Suggested implementation order

1. Connected API/test foundation: API-01 through API-03.
2. Model/tool and retrieval boundaries: LLM, RAG and IAM tasks.
3. Agent state, recovery and enterprise connectors: GRAPH, AGENT and CONNECT tasks.
4. Security, gateway and evaluation/tracing: SECURITY and OPS tasks.
5. Connected AuditMesh, then cloud delivery and remaining FDE extensions. Multimodal work can be a separate project after the core retrieval path.

This file records work only. Creating it does not authorize installation, runtime tests, external provisioning, deployment, commits or pushes.
