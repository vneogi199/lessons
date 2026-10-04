# Turn a failure into a reviewed fixture without exporting private text

The tracker stores only allowlisted outcome fields. Session IDs are HMAC pseudonyms scoped by tenant. A secret key prevents trivial guessing from a public hash; it does not make data anonymous. The protected database still contains tenant, event linkage and timing. Keep the key outside the database and rotate it with a recorded key version. Rotation starts a new correlation space; do not quietly join old identities back together.

Record one event from a trusted service after a request ends. Consent defaults to false and must come from the applicable consent/policy record, not a model or request checkbox alone. TTL defaults to one day and is capped at seven days in this lab. Metrics aggregate only fixed outcome and stage labels. Never add session IDs, user IDs, document IDs, arbitrary error messages or prompts as metric labels.

## Review a failure

1. An authorized reviewer selects a consented, unexpired failure within their tenant. The exporter checks access and refuses successful, expired, cross-tenant and unconsented events.
2. The reviewer reproduces the failure with synthetic text in a separately reviewed fixture. Assign a fixture ID and expected outcome. Do not copy private source text into the fixture.
3. Call `export_failure` with the approved fixture ID and dataset version. The output contains sanitized outcome metadata and lineage to the event, without session or content fields.
4. Add the synthetic fixture to a versioned evaluation dataset through code review. Preserve its independent source/answerability review. This module records that handoff; it cannot verify the contents of an external fixture repository.
5. Run the evaluation only when execution is authorized. Never train automatically on a failure export.

`revoke` removes the local event and linked export. It is an administrative method and requires authorization in the service endpoint. `purge` removes expired rows. Schedule it under a controlled maintenance job. Propagate revocation to any downstream artifact store by source-event lineage. Deletion here does not erase prior exports, backups, logs or storage snapshots; their owners need retention and deletion procedures too.

Example: two tenants each use session label “s”. Their stored HMAC values differ. Metrics combine their tool-error counts without exposing either label. A consented tool failure can refer to synthetic fixture “lost-response-1”. An unconsented failure cannot be exported, even by an otherwise authorized reviewer.

Tests cover tenant-bound pseudonyms, low-cardinality metrics, export scope, consent, revocation and expiry. They are supplied but unexecuted. After approval run `python3 -m unittest -v` in this directory. The embedded key in tests is synthetic and must never be used for real records.

Interview: why is a redacted trace still sensitive? Stable IDs, timing and rare outcomes can identify activity. Minimize fields, restrict access and retain only as long as justified. Ask your teacher to review the downstream deletion path before enabling exports.
