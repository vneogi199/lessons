# Field-service delivery pack

Version 1.0. All people, records, targets and figures here are fictional.
This is a worked design and assignment, not a supplied deployed application.
Start with [the explanation](../../reference/fde-discovery-to-adoption.html).
Existing [AuditMesh pack](DELIVERY-PACK.md) provides another case for comparison.

## 1. Executive summary and discovery

Example problem: dispatchers manually reconcile equipment identities before
assigning maintenance. The proposal reads authorized equipment data, retrieves
approved manuals and drafts assignments. A dispatcher approves every assignment.
No autonomous purchasing, safety certification or emergency-control action.

Evidence to collect: representative cases, task volume, hands-on time, waiting
time, rework, identity mismatches and access failures. Interview the dispatcher,
technician, process owner and IT owner. Observe one ordinary case and one failed
case. Confirm the problem statement before choosing a model.

Exercise: ask ten open questions from the discovery lesson. Record each answer
as observed, reported or unverified. A good answer cites an example; a hypothetical
promise is not evidence of demand.

## 2. Scope, AS-IS and TO-BE

AS-IS: reporter sends fault → dispatcher reads it → looks up equipment → checks
skills and parts → contacts technician → records assignment.

TO-BE: validate intake → read authorized equipment/manuals → draft proposal →
dispatcher checks evidence → approved command enters durable queue → ERP adapter
submits it → reconcile result → notify dispatcher.

Missing identity routes to manual lookup. Uncertain remote writes enter
`reconciliation_required`, not automatic resubmission with a new key.
Draw lanes for reporter, dispatcher and technician, with the ERP as a separate
participant. Include timeout and rejected-assignment paths.

## 3. Functional requirements and acceptance criteria

These are example requirements, not measured achievements.

| ID | Requirement | Acceptance evidence |
|---|---|---|
| F01 | Create an authenticated work order | Missing identity is denied; authorized creation returns its ID |
| F02 | Read only permitted orders | Another tenant's ID returns no record |
| F03 | Validate intake | Missing equipment ID or invalid priority returns a field error |
| F04 | Deduplicate requests | Same key and payload returns original result; changed payload conflicts |
| F05 | Show source freshness | Missing/stale equipment data is marked and blocks assignment |
| F06 | Cite manual evidence | Each displayed source resolves to an authorized document/page |
| F07 | Require dispatch approval | No execution before approval of the exact proposal version |
| F08 | Check technician suitability | Expired skill or unavailable slot rejects the proposed assignment |
| F09 | Recover remote uncertainty | Lost ERP response enters reconciliation with preserved operation ID |
| F10 | Escalate SLA risk | Warning at 80%, breach at 100%, each recorded once per policy window |
| F11 | Audit decisions | Actor, proposal hash, policy version and result are recorded without secrets |
| F12 | Degrade safely | Model outage leaves manual triage available and visibly labels the fallback |

## 4. Integration and data contract

| Source | Allowed operation | Fields and contract | Freshness / failure |
|---|---|---|---|
| Equipment ERP | Read equipment | Source ID, location, plant; verify actual metadata | Example maximum age 5 minutes; stale blocks dispatch |
| Scheduling service | Read availability, approved reservation | Technician ID, skill validity, slot version | Recheck at assignment; conflict returns for review |
| Approved manuals | Retrieve permission-filtered pages | Document ID, version, page, ACL, extracted text | Removal revokes access and invalidates cached evidence |
| ERP command adapter | Submit approved assignment | Operation ID, order ID, version, approved payload | Unknown outcome reconciled; bounded retry only when safe |

Auth method, destination, credential owner, scopes and rate limits must be filled
from the client's API catalogue. Do not assume equipment metadata includes a
technician or maintenance history. Track field provenance and null meaning.

## 5. HLD and deployment decision

Browser → authenticated FastAPI → PostgreSQL orders/proposals/outbox.
A worker reads the outbox, calls fixed tools and stores outcomes.
Retrieval uses authorized document chunks. The model proposes; deterministic
validation and approval gate execution. Telemetry records sanitized spans.

Illustrative ADR: use an approved hosted model for synthetic prototype data.
Reconsider private hosting when residency, contractual controls or measured
workload costs require it. Rejected alternative: public model endpoint receiving
unclassified client records. Accepted cost: provider dependency and call latency.
Private hosting adds patching, capacity and recovery duties; it is not free.

Route extraction to the smallest model that passes a held-out evaluation.
Use synthesis only when retrieval and a template cannot solve the task.
Version routes and prompts. Bound tokens, tools, iterations, retries and total
duration. Memory stores approved facts with provenance and expiry; feedback does
not automatically become trusted knowledge.

## 6. TDD: endpoints, entities and rules

Proposed endpoints, not an implemented API:

| Method/path | Input → output | Key boundary |
|---|---|---|
| POST /work-orders | equipment_id, description, priority → ID/status | Auth, schema, idempotency |
| GET /work-orders | cursor, bounded limit → items/next cursor | Tenant-scoped stable ordering |
| GET /work-orders/{id} | ID → permitted order | Object authorization |
| PATCH /work-orders/{id}/status | status, expected_version → new version | Allowed transitions |
| POST /work-orders/{id}/summarize | expected_version → summary/evidence | Source snapshot, timeout, no writes |
| GET /equipment/{id} | ID → normalized equipment/provenance | Fixed upstream, ACL, freshness |
| POST /work-orders/{id}/proposals | expected_version → proposal/hash | Tools bounded and read-only |
| POST /proposals/{id}/approve | hash, expected_version → approval ID | Approver role, expiry, exact payload |
| POST /proposals/{id}/execute | approval ID → operation ID/status | Idempotent durable command |
| GET /operations/{id} | ID → result/uncertainty | No inferred success |

Entities: Equipment(source, tenant, source_id, observed_at);
WorkOrder(id, tenant, equipment_key, description, priority, status, version);
Technician(id, tenant, skill_records);
SLAPolicy(id, version, response_window, resolution_window, calendar);
Proposal(id, order_id, hash, evidence, expires_at);
Approval(id, proposal_id, hash, actor);
Operation(id, approval_id, payload_hash, state).
Use foreign keys and tenant-aware access. Audit history is separate from mutable
current state. A technician calendar needs concurrency control, not a boolean
`available` copied into an old prompt.

Validation example: description is required and length-bounded; priority is one
of P1–P4; timestamps carry offsets; IDs remain strings. Revalidate state at action
time. Do not expose internal stack traces in structured errors.

Rule example: for an illustrative 60-minute continuously running response window,
warn at elapsed minute 48 and breach at minute 60. Response acknowledgement stops
the response timer; it does not prove repair completion. For business calendars
or paused intervals, compute eligible elapsed time with a versioned policy.
Repeated timer events must not create repeated notifications.

Traceability: F07 → approval rule → approve endpoint → UAT07.
F09 → uncertain-operation state → worker reconciliation → UAT11.
Every changed requirement needs an updated rule, test and release note.

Happy path: submit → validate → propose → approve exact version → enqueue →
ERP acknowledges → persist receipt → show assigned.

Failure path: submit command → ERP applies it → response lost → persist unknown →
query ERP by operation/business key → record existing assignment, or send to
operator if the result cannot be established. Do not claim rollback undoes ERP.

## 7. Risks, NFRs and document control

Illustrative target: machine-only proposal p95 ≤8 seconds for 10 concurrent users,
documents ≤20 pages, measured over a 30-minute fixed workload. Measure human wait
and queue delay separately. This is a design target, not a benchmark result.

Risks: stale masters, permission drift, unsupported APIs, model error, network
partitions and incomplete operator coverage. Assign owners before release.
Change log: version, requirement IDs, reason, alternatives, impact, approver, date.
Baseline approval does not authorize later scope changes.

## 8. UAT script

Shared preconditions: isolated test tenant, approved synthetic equipment and
technicians, versioned build, fixed policy, named business tester, clean test
operations. For every row record actual result, pass/fail, build, fixture and
redacted evidence. All actual results currently **Not run**.

| Test | Steps / condition | Expected business result |
|---|---|---|
| UAT01 | Create valid order | One visible order with correct equipment |
| UAT02 | Submit missing equipment ID | Clear correction request; no creation |
| UAT03 | Read another tenant's order | No data disclosed |
| UAT04 | Repeat identical create key | One order |
| UAT05 | Reuse key with changed description | Conflict; original unchanged |
| UAT06 | Submit P1 emergency | Immediate human review; no autonomous dispatch |
| UAT07 | Execute without approval | No ERP write |
| UAT08 | Edit proposal after approval | Old approval cannot execute changed payload |
| UAT09 | Assign technician lacking required skill | Assignment blocked with reason |
| UAT10 | Required part unavailable | Manual alternatives; no false reservation |
| UAT11 | Lose response after ERP write | Reconciliation; no duplicate assignment |
| UAT12 | Cross warning/breach times twice | Correct once-per-window alerts |
| UAT13 | Supply stale equipment snapshot | Visible stale state; dispatch blocked |
| UAT14 | Remove manual permission | Previously cached content not disclosed |
| UAT15 | Stop model service | Manual triage remains usable |

Entry: access, fixtures, build, test training and defect list are ready.
Exit: agreed scenarios passed; no open critical/high defects under this example's
policy; business and security owners sign off residual risks.
Severity reflects impact. Priority reflects urgency. Re-test each repaired defect
and related regression cases; do not overwrite the original failed evidence.

## 9. Go-live, hypercare and handover

Before release: verify counts and sampled migrated records; test permissions;
rehearse backups/restoration; record approved image/config revisions; verify
alerts and named support contacts. Start with a limited user group.

Rollback triggers for this example: any cross-tenant leak, duplicate ERP action or
unrecoverable command uncertainty. Disable writes, preserve the operation ledger,
restore an approved compatible application version and reconcile remote effects.
Schema rollback and data restoration require their own reviewed procedures.

Hypercare: daily triage with business and technical owners, staffed escalation
rota, tracked defects and visible known issues. Example exit: five working days
without a critical incident, an approved remaining-defect plan and a successful
support-team recovery drill. This is a proposed policy, not a universal duration.

Handover pack: architecture, API contracts, runbook, dashboard meanings, restore
procedure, contact/escalation matrix, access/rotation owners, known issues and
training materials. Never place credentials in the pack.
Dispatcher training: create, review, correct, escalate. Operator training:
diagnose, stop writes, reconcile, restore. Ask each learner to perform a task
without prompts; watching a video is not evidence of ability.

## 10. Adoption and KPI exercise

Define first-time fix rate as eligible repairs resolved on the first visit /
eligible completed repairs. Define SLA compliance as eligible cases meeting the
specified SLA / eligible assessed cases. Report response and resolution separately.
Define technician utilization as productive assigned hours / available working
hours; document travel, leave and training treatment.
For MTTR, explicitly state whether R means repair, recovery or resolution.
Use the same population and time boundaries when comparing periods.

Synthetic arithmetic: 200 eligible monthly orders × 6 minutes saved = 20 hours.
At an assumed 30 currency units/hour, gross capacity value is 600. If recurring
cost is 250, potential net value is 350 before setup and other costs. Freed hours
are not necessarily cash savings. With one-time cost 2100 and stable net value
350/month, simple payback is six months; it ignores discounting and uncertainty.
Check low adoption and higher support-cost scenarios before presenting a case.

ADKAR exercise: identify whether the dispatcher lacks awareness, desire, knowledge,
ability or reinforcement. Choose evidence and an intervention for that barrier.
Track successful tasks, rework and feedback, not just logins.

## 11. Three capstone variants and completion evidence

- Field-service command center: use this pack; add an approved parts lookup and
  skill-based proposal. Deliver contracts, approval tests, failure traces and UAT.
- Predictive maintenance: ingest synthetic sensor events with units and event
  times; test missing data, duplicate events and sustained thresholds. Create a
  review proposal, not an automatic safety decision. Measure false alarms and
  detection delay on labelled cases. Do not claim predictive power from a demo.
- Contract assistant: extract clauses with page provenance and uncertainty;
  retrieve only permitted contracts; track renewal dates deterministically.
  Test conflicting clauses, missing dates and access revocation. Require expert
  review for contractual interpretation.

For the original roadmap assignments, record separately: real-PDF ingestion and
citation checks; chosen provider integration; connected work-order tools; fifty
sanitized traces; a controlled fifty-user load test; cloud release evidence; and
the recorded demo. No rows are pre-marked complete. Use existing approved
environments only. Publish only synthetic or explicitly approved material.

Interview rehearsal: explain one scope cut, one failure sequence and one metric
that changed your decision. Use actual experience when describing past work.
Ask a colleague to challenge the plan as an IT owner and capture the decision log.
