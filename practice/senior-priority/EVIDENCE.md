# One project: senior engineering evidence

This is a fill-in workbook, not a record of completed work. Use synthetic or
approved data. Keep credentials, raw customer material and sensitive infrastructure
details out of public artifacts. No cloud execution or installation is authorized
by this worksheet.

Read [the guided path](../../reference/senior-priority-build-path.html) first.

## Project contract

- User and existing workflow:
- Problem, measured baseline and success criteria:
- Included use case / exclusions:
- Data owner, access scope and retention:
- API, database, job and document-version contracts:
- Deployment account/region/environment and approved budget:
- Operator, review owner and cleanup date:

## Evidence status

Use `not started`, `authored`, `locally tested`, `integration-tested`, or `deployed`.
Deployment does not imply that every recovery or security test passed.

| Area | Artifact to produce | Failure to demonstrate | Status / observed result |
| --- | --- | --- | --- |
| AWS/Terraform | Plan, network/IAM diagram, environment boundaries | Denied access, secret rotation, restore | Not started |
| PostgreSQL | Schema, transaction invariants, query plans | Concurrent update, duplicate event, stale revision | Not started |
| AI evaluations | Versioned labelled cases, rubric, baseline/candidate report | Missing evidence, denial, unsupported claim | Not started |
| Python | Deadline/admission design, tests, profile | Cancellation, overload, hung dependency | Not started |
| Operations | Probes, resource settings, dashboard, runbook | Bad rollout, resource pressure, recovery | Not started |
| Node/GraphQL | TypeScript API contracts, resolvers and tests | N+1, wrong batch order, tenant leak attempt | Not started |
| Architecture impact | ADR, diagrams, measured outcome | Changed scale or budget constraint | Not started |
| Customer delivery | Discovery, pilot scope, UAT and handover | Unsafe request, uncertain answer, adoption problem | Not started |

## Failure experiment record

- Hypothesis and invariant:
- Approved environment and blast radius:
- Exact code/config/data versions:
- Preconditions and controlled fault:
- Expected durable state:
- Observed state, logs and metrics:
- Recovery action and measured duration:
- Data-loss/duplicate-effect checks:
- Test limitations and follow-up owner:

Required durable-boundary cases: before source commit; after commit before relay;
after broker publish before sent marker; after consumer commit before acknowledgement;
external effect with an uncertain response; version 8 completing after version 9.
Run only where explicitly approved. A local fake broker is not live broker evidence.

## Evaluation release report

- Dataset hash/version and label-review owner:
- Grouped train/development, validation and held-out boundaries:
- Cases per slice and source versions:
- Baseline/candidate model, prompt, retrieval and schema versions:
- Retrieval precision/recall and denominator:
- Correctness, unsupported claims, abstention and permission failures:
- Invalid output, timeout and failed-call counts:
- End-to-end and stage latency with sample sizes:
- Token use, known cost, unknown cost and retries:
- Human/judge agreement and reviewed false passes:
- Critical failure gates and allowed quality/performance regressions:
- Release decision, limitations and rollback artifact:

Do not average percentiles from separate hosts or drop failed calls. Keep a
no-answer/denied slice separate from answerable retrieval recall. Do not present
the bundled Support Copilot synthetic dataset as representative production data.

## Impact statement

Use: “I owned [specific scope]. We chose [decision] over [alternative] because
[constraint]. I tested [failure]. Over [window], [defined metric] changed from
[baseline] to [result], measured by [source]. [Confounders/limitations].”

For the user's reported 17% fewer breaches, 22% lower costs and same-day updates:
record the underlying counts, workload, time windows, cost categories, timestamps
and personal contribution. Leave unknown values blank. These numbers are not
verified by the curriculum and must not be copied into the new project's results.

## Customer pilot record

- Discovery participants and workflow observations:
- Stated request versus validated need:
- Acceptance criteria and explicit exclusions:
- Data/security approvals:
- Demo: success, uncertainty, permission denial:
- UAT scenarios, defects, sign-off and rollback:
- Training, support owner and escalation:
- Adoption, task outcome and quality review date:
- User feedback and next scope decision:

## Ten-minute interview rehearsal

1. Two minutes: user problem, constraints and personal scope.
2. Two minutes: architecture and rejected alternative.
3. Two minutes: one partial failure and recovery.
4. Two minutes: evaluation and measured outcome.
5. Two minutes: changed constraint, tradeoff and remaining risk.

Repeat after two days without notes. Ask a peer to challenge the evidence, not
just the vocabulary. No practice completion or mastery is inferred by creating this file.
