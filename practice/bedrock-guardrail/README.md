# Check the question and the answer

Imagine a two-door room. Check the question at the entrance. Check the answer at the exit. A safe question does not prove that the generated answer is safe.

The supplied adapter uses Boto3. Tests use mocks and have not run. No account, resource or model was contacted. The draft demonstrates email anonymization and SSN blocking. It is not a complete security policy or a detector-quality claim.

In an approved environment, use an existing SDK session with short-lived workload credentials. Call `clients(session, region)`. The deployment role manages this lab's guardrail; the application role has only `bedrock:ApplyGuardrail` on its exact ARN. Review quotas, region support and data residency first.

1. Persist an administrative operation ID and the requested configuration. Call `create_draft` once. Retain its ID/ARN. Reconcile a lost response with the same operation ID.
2. Check draft readiness with a bounded operator retry window. Diagnose failed states. Inspect the draft configuration. The application adapter deliberately rejects DRAFT.
3. Call `snapshot` with its own operation ID. Check the numbered version's readiness. Run permitted, blocked, malformed and outage fixtures against that version in staging.
4. Promotion is a reviewed application configuration change to the ID/version pair. Keep the previous pair for rollback and record evaluation evidence. Nothing promotes automatically.
5. Apply INPUT before generation. Denial means no model call. Apply OUTPUT to the complete buffered answer before release. Share a monotonic request deadline. Authentication, retrieval permissions and tool authorization remain separate.

An intervention can include replacement text. This adapter preserves it only for restricted inspection and denies release. A separate policy would be needed to accept anonymized output. A block message is not an answer. Never log original text, assessments or transformed strings by default.

SDK connect/read timeouts and one total attempt bound transport behavior. Checks before and after the call prevent late release. Socket timeouts are not a strict wall-clock bound; this synchronous function cannot interrupt a call. Use a supervised worker process when strict termination is required. Reserve time for OUTPUT checking before generation. Outages return denial, never unchecked text.

Acceptance: allowed INPUT reaches the model; blocked INPUT does not. Blocked OUTPUT never reaches the user. Unknown actions and malformed transformed items deny. Add a fake clock that crosses the deadline during the SDK call; expect no release. Ask the teacher why topical filtering cannot replace document authorization.

Cleanup needs separate approval: remove application references, retain the change record, then delete only owned versions/resources. Never delete a shared guardrail.

Sources: [runtime contract](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock-runtime/client/apply_guardrail.html), [creation](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock/client/create_guardrail.html), [versioning](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock/client/create_guardrail_version.html).
