# Requested syllabus coverage — 2026-09-21

Support Copilot (2026-10-21): [runnable CLI project](projects/support-copilot/README.md)
and [eight-session guide](reference/support-copilot-project.html), linked from
0396, 0596, 0602 and 0612. Connects ACL-filtered chunk retrieval, local hybrid
ranking, reranking, citations, persistent human approval and idempotent local
tickets. Includes split/overfitting exercises, metrics, sanitized spans, optional
Elasticsearch and existing-local-model adapters, and a Docker recipe.
Offline execution and mocked adapter contracts are distinct from live integration.
No semantic model training, public API, cloud deployment or production security
certification is claimed; see the project's explicit production gate.

Database failover follow-up (2026-10-20): lessons 0373, 0390, 0448 and 0503
link to [MySQL positions and manager comparison](reference/database-failover-practice.html)
and the [failover drill](practice/database-failover/DRILL.md).
Covers file/position versus GTID sets, retrieved/executed progress, semisynchronous
limits, Sentinel versus Orchestrator, fencing, eight fault scenarios and
application-level RPO/RTO evidence. Drill execution and browser QA remain unrun.

Support-chatbot follow-up (2026-10-20): lessons 0431, 0460 and 0617 link to
[the support-chatbot case](reference/support-chatbot-design.html).
Adds event-driven conversations, ML fraud decision architecture, refund
idempotency/reconciliation, session replay, scaling and human takeover.
Includes failure acceptance cases and interview feedback. This is an illustrative
design, not verified Swiggy internals, an executed payment integration or a
trained fraud model. Existing circuit-breaker and retry lessons remain intact.

FDE roadmap follow-up (2026-10-20): lessons 0068, 0411, 0618, 0620 and 0638
now link to [discovery through adoption](reference/fde-discovery-to-adoption.html)
and [ERP/SAP integration](reference/erp-sap-integration.html).
The [field-service pack](practice/client-delivery/FIELD-SERVICE-PACK.md)
adds a worked BRD/TDD, 12 requirements, 10 endpoint contracts, 15 UAT scenarios,
failure/reconciliation design, change control, hypercare, training and KPI
arithmetic. Includes BPMN, discovery methods and ADKAR exercises.
SAP specialist content is an orientation and catalogue exercise, not validated
tenant-specific BAPI implementations. Exact roadmap applications, provider calls,
live SAP integration, user research, UAT, load tests and deployment remain
unexecuted learner assignments. No blanket claim of full roadmap completion.

Durable workflow follow-up (2026-10-19): [outbox and saga implementation](reference/durable-outbox-saga.html)
adds a file-backed producer, fake broker, relay, idempotent consumer, saga state,
service receipts, compensation and persisted attempt limits. Twelve local tests
and a demo exercise committed-state recovery across connection reopen. Not a
networked broker, multi-worker runtime or hardware/crash-durability certification.

Index storage follow-up (2026-10-18): [clustered indexes and B+ versus LSM trees](reference/index-storage-design.html)
fills the two identified gaps, linked from 0362 and 0364. Includes engine-specific
row organization, secondary lookups, amplification, compaction/tombstones,
workload trade-offs and six offline tests. Database execution and performance
claims remain unverified; no database or packages were installed.

Messaging follow-up (2026-10-18): [RabbitMQ versus Kafka](reference/rabbitmq-kafka.html)
covers exchanges/bindings/queues, routing, confirms versus acknowledgements,
durability/quorum, ordering, retries/dead letters, Streams/replay, broker selection
and outbox boundaries. Linked from 0438, 0460, 0461 and 0472, with search terms,
interview questions and six standard-library exercises. Live brokers, clients,
replication failure and load tests remain unrun; this closes written coverage,
not deployment verification.

Recent discussion follow-up: [uv/Ruff/pytest and token/session lifecycle](TOOLING-AUTH-COVERAGE.md)
adds the previously missing tooling workflow, refresh-family practice and
multi-application logout guidance. Proxy/Reflect remain in lesson 0102.

Latest scoped audit: [six-week production agent syllabus](AGENT-SYLLABUS-COVERAGE.md)
(2026-10-17). All 30 theory/build items have detailed guidance and acceptance
checks. Includes a new offline incremental publication exercise. Deployment and
live SDK verification remain distinct from authored coverage.

Existing lessons plus 29 extension sections cover the latest syllabus and Python/API follow-up. These are teaching materials and capstone briefs, not deployed applications.

| Requested topics | Material |
| --- | --- |
| Python basics; FastAPI routes, middleware, background tasks; nested Pydantic/custom validation; structured errors; environment/secrets; Python LLM calls | [API foundations](reference/api-cloud-delivery-labs.html#python-api-llm) |
| GraphQL/resolvers/N+1, versioning, tests/fixtures/mocks/coverage, debugging/IDE | [API labs](reference/api-cloud-delivery-labs.html#graphql) |
| EC2, S3 lifecycle, RDS, Lambda, VPC/subnets/NAT, security groups/IAM/cross-account roles, billing/budgets | [AWS labs](reference/api-cloud-delivery-labs.html#aws-provisioning) |
| Docker/Compose, ECS/Fargate tasks, ALB/autoscaling, GitHub Actions/secrets/delivery | [Delivery lab](reference/api-cloud-delivery-labs.html#ecs-delivery) |
| Prompting, tokens/windows/compression, strict/nested schemas/unions, parsing repair, parallel tools/history | [Context and output labs](reference/retrieval-document-labs.html#context-budget) |
| Chunking, overlap, embeddings/metrics/dimensions, indexes/filtering, BM25, hybrid/RRF, precision/recall, reranker API | [Retrieval labs](reference/retrieval-document-labs.html#hybrid-implementation), existing 0594–0600 |
| Ontologies/taxonomies, relational graphs, AuraDB/Cypher, traversal, logistics/user events, Neptune | [Graph lab](reference/retrieval-document-labs.html#graph-modeling) |
| OCR, ColPali, CLIP, vision-language bridges, PDF tables/charts, bounding boxes/multi-page context | [Visual retrieval and layout](reference/retrieval-document-labs.html#visual-retrieval) |
| ReAct/planning/routing, LangGraph async/subgraphs/reducers/map-reduce, checkpoints/approval, memory, managed agents | Existing 0603–0611 and [agent labs](reference/agent-operations-capstones.html#advanced-langgraph) |
| Slack/Teams/Jira, SOAP/WSDL/Zeep/XML, SQL Server/Oracle, binding/read-only roles/Text-to-SQL | [Enterprise integration](reference/enterprise-security-labs.html#collaboration-connectors) |
| JWT/OAuth/SAML, Entra groups, RBAC and retrieval permissions | Existing security lessons, [Entra lab](reference/enterprise-security-labs.html#entra-rbac), [SAML](reference/enterprise-ai-practice.html#saml) |
| Injection/exfiltration, Presidio/PII/regex/reversible masking, redaction metrics, NeMo/Colang/filtering, Bedrock guardrails | [Security labs](reference/enterprise-security-labs.html#presidio) |
| Idempotency/backoff, LiteLLM/Portkey/routing, RAGAS/judges/synthetic datasets/release gates, tracing/sessions/cost/latency/export | [Operations labs](reference/agent-operations-capstones.html#gateway-routing), existing reliability/evaluation lessons |
| Discovery/classification/SOW/ROI/UAT, secure RAG/SQL and delivery | [OmniGuard brief](reference/agent-operations-capstones.html#omniguard) |
| Process mapping/HITL/SLAs, MCP/Jira boundaries, supervisor/dashboard/approval UI and handoff | [AuditMesh brief](reference/agent-operations-capstones.html#auditmesh) |

Prior additions remain in [pandas/PDF/Linux](reference/data-preparation-and-terminal.html), [enterprise AI practice](reference/enterprise-ai-practice.html), [AI/database extensions](reference/ai-data-extensions.html) and [reranking](reference/cross-encoder-reranking.html).

## Verification boundaries

`python3 scripts/check-syllabus-labs.py` checks 29 linked sections, executes 14 standard-library fixtures and parses 11 Python integration recipes plus the JSON configuration. External SDK behavior, cloud setup, YAML/Colang/Cypher/SQL execution and deployment remain unverified. OmniGuard/AuditMesh are build guides with acceptance criteria, not supplied applications. Nothing was installed. Authored coverage is not learner mastery.
## Numerical data expansion — 2026-09-21

[NumPy, Pandas, Polars and SQL](reference/numerical-data-engineering.html) adds six focused sections linked from lesson 0285: array fundamentals; vectorization/broadcasting; numerical performance/memory; advanced Pandas windows/as-of joins; Polars expressions/lazy/streaming; SQL semantic parity and engine choice. Check with `python3 scripts/check-numerical-data.py --run-installed`; missing libraries are skipped, never installed. The existing detailed Pandas and PostgreSQL lessons remain in place.
## AI Engineer pathway — 2026-09-21

[AI Engineer practice](reference/ai-engineer-practice.html) adds a prioritized route through existing lessons, AI-code review/testing, a worked synthetic model comparison, two end-to-end project briefs, and advanced serving/LoRA/release decision exercises. Linked from 0168, 0602, 0606, 0614 and 0620. Three new standard-library fixtures run without installations. Projects, fine-tuning and deployments remain learner implementation work; the model comparison uses fictional outcomes, not provider calls.
