# Requested syllabus coverage — 2026-09-21

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
