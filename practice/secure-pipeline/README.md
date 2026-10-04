# Buffer an answer until all release checks finish

The pipeline follows input validation, authorization, question redaction, scoped retrieval, document authorization, source redaction, generation, schema/citation checks, output scanning and final permission checks. Every external stage is an injected asynchronous adapter under one total deadline. No model, detector or network client is configured by default.

Use identity from a verified session. The retriever must enforce access at its data source, before returning records; a later check cannot undo disclosure inside a remote retrieval service. `allowed` must check current document version, deletion status and object permissions. The pipeline calls it before generation and again before release. For strict revocation guarantees, bind release to an authorization revision or transaction; a check-then-send race still exists across independent services.

Example: “PRIVATE question” and “PRIVATE policy” become redacted inputs in the synthetic test adapter. The model cannot see those original strings through this pipeline. This simple replacement is a fixture, not PII detection. A real redactor must use approved local assets and validated offsets. Redaction can remove information needed to answer; the application should abstain or review when evidence becomes insufficient.

The generator returns a typed answer and document/version citations. The schema checker verifies citation membership, not whether each claim follows from the cited text. `scan_output` must combine the actual PII and content-release policy. Semantic grounding needs an additional validator or reviewer within that adapter. Any missing/outage result fails closed. Exception messages stay out of the public response.

No generated answer bytes stream before validation. A UI may stream fixed progress labels such as “Checking access,” but must not forward raw model deltas. If streaming is required later, define chunk-level policy and cross-chunk PII handling; checking after transmission cannot retract a leak. Reversible restoration, when authorized, needs the separate scoped pseudonym store and a final scan of restored text.

The deadline uses cooperative cancellation. A blocking SDK or native extension can defeat it; isolate such work in a supervised worker with an external deadline. Returned stage names are safe progress markers, not full tracing. The caller still owns admission limits, authenticated transport, retention and audit storage.

Tests cover redacted model input, cross-tenant denial before generation, revocation before release, bad citations, PII rejection and scanner outage. Tests are unexecuted. After approval, run `python3 -m unittest -v` in this directory. Acceptance: no answer is returned for any denied/review case, and no unauthorized source reaches the generator.

Interview: why can citations pass while grounding fails? A citation can identify a real permitted document without supporting the attached claim. Ask your teacher to add a misleading but valid citation and design the semantic check.
