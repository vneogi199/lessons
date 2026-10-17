# Six-week agent syllabus audit — 2026-10-17

Scope: the latest six-week syllabus, not a new audit of every historical request
or all 665 lessons. The audit found broad coverage but fragmented build guidance.
Incremental publication and end-to-end acceptance criteria needed clearer treatment.

All 30 requested items now have explanations and exercises in the
[six-week build path](reference/production-agent-six-week-path.html).
Each section links the relevant existing reference or lab. **Written coverage is
not runtime verification, learner mastery or production certification.**

| Item | Detailed coverage | Evidence to produce |
| --- | --- | --- |
| Single/multi-agent systems | [1](reference/production-agent-six-week-path.html#w1-systems) | Baseline comparison, stop conditions |
| Context engineering | [2](reference/production-agent-six-week-path.html#w1-context) | Token allocation, summary-loss case |
| Short/long-term memory | [3](reference/production-agent-six-week-path.html#w1-memory) | Revocation and checkpoint-resume cases |
| Basic agent evals | [4](reference/production-agent-six-week-path.html#w1-basic-evals) | Six-case baseline and denominators |
| Scalable/performance-minded agent build | [5](reference/production-agent-six-week-path.html#w1-build) | Bounded concurrency and fake effects |
| Incremental vector-index updates | [6](reference/production-agent-six-week-path.html#w2-updates) | Publication/fencing/deletion fixture |
| Background ingestion/access control | [7](reference/production-agent-six-week-path.html#w2-ingestion) | Durable job and revocation boundaries |
| Scalable search | [8](reference/production-agent-six-week-path.html#w2-search) | Filtered recall, precision and latency |
| Scalable input/output guardrails | [9](reference/production-agent-six-week-path.html#w2-guardrails) | Timeout, outage and streaming choices |
| Scalable RAG build | [10](reference/production-agent-six-week-path.html#w2-build) | Versioned answers and adapter plan |
| Action/tool evaluation datasets | [11](reference/production-agent-six-week-path.html#w3-datasets) | Initial state, trajectories, effects |
| LLM judge versus human evals | [12](reference/production-agent-six-week-path.html#w3-judges) | Calibration and false-pass slices |
| Deployment regression tests | [13](reference/production-agent-six-week-path.html#w3-regression) | Version-bound report and gate |
| Injection/unauthorized tools | [14](reference/production-agent-six-week-path.html#w3-attacks) | Direct boundary attacks, benign controls |
| Automated eval suite build | [15](reference/production-agent-six-week-path.html#w3-build) | Deliberate failure detected by suite |
| Secure APIs/packaging | [16](reference/production-agent-six-week-path.html#w4-api) | Auth contracts, limits and image plan |
| Database/background workers | [17](reference/production-agent-six-week-path.html#w4-workers) | Redelivery and unknown-effect recovery |
| Automated testing/deployment | [18](reference/production-agent-six-week-path.html#w4-ci) | Immutable artifact, migration/rollback plan |
| Cloud container management | [19](reference/production-agent-six-week-path.html#w4-cloud) | Roles, network, scaling and shutdown |
| Secure cloud deployment build | [20](reference/production-agent-six-week-path.html#w4-build) | Actual auth smoke/rollback evidence |
| Trace agent actions and MCP | [21](reference/production-agent-six-week-path.html#w5-tracing) | Cross-boundary, redacted trace |
| Errors/tokens/user feedback | [22](reference/production-agent-six-week-path.html#w5-monitoring) | Outcome/stage dashboard with counts |
| Caching/rate limits/async | [23](reference/production-agent-six-week-path.html#w5-performance) | Correct cache scope, shared budgets |
| Outage alerts | [24](reference/production-agent-six-week-path.html#w5-alerts) | Owner, trigger, runbook and recovery |
| Monitoring/optimization build | [25](reference/production-agent-six-week-path.html#w5-build) | Controlled before/after experiment |
| Architecture/design review | [26](reference/production-agent-six-week-path.html#w6-architecture) | Two paths and three decisions |
| Security/reliability/readiness | [27](reference/production-agent-six-week-path.html#w6-readiness) | Evidence ledger, restore/rollback tests |
| Failures/cost/performance | [28](reference/production-agent-six-week-path.html#w6-tradeoffs) | Failure table and bounded cost model |
| Real-world use-case evaluation | [29](reference/production-agent-six-week-path.html#w6-usecases) | Representative UAT scenarios |
| Production capstone/live workflow | [30](reference/production-agent-six-week-path.html#w6-build) | Honest live demo and limitations |

## Verification scope

New executable material: the standard-library
[incremental publication exercise](practice/incremental-publication/README.md).
Its tests cover local state transitions and SQLite persistence with fake vectors.
It is not an external vector-index adapter or distributed service.

Existing labs reused: bounded workflows, evaluated RAG, release evaluation,
permission checks, Office ingestion, attack evaluation, API release, tracing,
gateway controls, observability stack, client delivery and AuditMesh. Their own
READMEs retain integration limits. This change does not assert their SDK tests,
provider calls or deployment recipes have run. Cloud deployment and representative
load tests remain practical work, not missing written syllabus topics.

Checks run for this change: nine offline publication tests; all 30 coverage
anchors; six linked lesson revisions; root and nested-deployment link checks;
study-guide, interview-bank, learning-home, static mobile/frame and production
reference checks. Static checks do not establish visual browser behavior. No
packages were installed and no provider or cloud service was called by the labs.
