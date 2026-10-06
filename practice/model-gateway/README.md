# A small LiteLLM gateway deployment

An application receives a short-lived virtual key for two approved aliases. The gateway owns the provider credentials. If the primary endpoint fails, it may use the approved backup. The application never receives either provider key.

This package supplies proxy configuration and a container recipe. It has not started or passed integration tests. No dependencies, images or models were installed or downloaded. Use an already-reviewed database-enabled LiteLLM image pinned by digest. The current deployment documentation uses v1.90.2; confirm the selected build supports every configured setting and complete the checks below before signoff.

## Prepare the isolated environment

An operator supplies PostgreSQL, Redis over TLS, and two existing approved chat endpoints. Both endpoints must serve the same reviewed `lesson-chat` model contract through the compatible chat-completions API. The `openai/` prefix selects the protocol adapter; these endpoints need not be OpenAI services. No hosted provider is configured or contacted here. Test context limits, tokenizer, tool schemas, structured output, privacy region and response shape for both routes. Similar API syntax alone does not prove interchangeable behavior.

Create a dedicated PostgreSQL database and credentials. Review proxy schema migrations and backup/restore before first startup. Mount the database CA at `/run/secrets/database-ca.pem`. The URL must request certificate and hostname validation. Confirm that a wrong CA and wrong hostname fail in the selected image. Supply an authenticated Redis TLS URL and verify its certificate validation too.

The secret-manager-mounted JSON file contains only the seven fields checked in `start.py`. Generate a strong unique master key. Protect file permissions and container access. The startup process supplies secrets through the proxy's documented process-environment resolver; no secret appears in the image, repository or command arguments. Process inspection and crash dumps can still expose environment values, so restrict them. Do not use debug logging or print container environments.

Set the three reviewed paths/image variables required by Compose. After explicit deployment approval, set `APPROVED_GATEWAY_START=yes` and run `docker compose up gateway`. The image must already be present; pull policy is never. The host port is loopback only. A production deployment also needs a TLS ingress, egress restrictions, resource sizing, a non-root compatible image, a reviewed writable-directory policy and durable database operations. No public ingress is supplied.

Keep administration on a private network. The application-facing ingress must allow only required inference paths, such as `POST /v1/chat/completions`, and deny key/user/team/configuration management routes. Disable admin UI exposure. Cap request body and input/output tokens at this ingress or the trusted calling application; the configured `max_tokens` default is not a guarantee against every client override.

## Issue, rotate and revoke a virtual key

Use an approved secret-aware HTTP client over the private admin path. Never paste the master key into shell history. Create a dedicated non-admin `internal_user_viewer` identity using `/user/new` with `auto_create_key=false`, then inspect `/user/info` to confirm its role and no inherited administration rights. Add its `user_id` to the supplied `key.json` and submit it to `/key/generate` with the master bearer. Store the returned key directly in the application's secret manager. Do not record the response in a transcript or source file.

The key allows only `lesson-primary` and `lesson-backup`, lasts one hour, and has request/token/concurrency limits. Including the backup is intentional; fallback authorization is enforced. A key allowing only the primary must not reach a disallowed backup. Currency budgets need correct per-model pricing and database spend records. This example has no fabricated price for self-hosted compute; set a reviewed allocation rate before evaluating its currency budget. Track infrastructure cost separately. Limits and delayed usage accounting do not replace admission reservations for strict financial ceilings.

For rotation, issue a second key with the same restrictions and a new alias. Deploy it to the single client and confirm traffic. Submit the old key to `/key/delete` using its `keys` array through the private admin client. Verify that the old key fails on every replica, including warmed caches, before declaring revocation complete. Do not delete the new key on an ambiguous response. Provider-key rotation is separate: rotate at each provider, update the mounted secret, restart the gateway and prove the old credential is no longer usable. Preserve the proxy's configured encryption salt if encrypted database secrets use one; changing it can make stored secrets unreadable.

## Acceptance checks, still pending

First run the authored `test_start.py` only when local execution is authorized. Then, in an approved isolated deployment, record exact image digest and proxy/database/Redis versions. Check each case with synthetic prompts:

- Missing, expired and revoked virtual keys fail. A non-admin key cannot manage keys, users or configuration.
- Allowed aliases work. An unknown model and an unauthorized fallback fail. Client-supplied provider credentials cannot change the route.
- A failed primary uses at most the configured backup path; no application retry silently multiplies attempts. Record which route answered and tell the user when behavior changes.
- The seventh request within the tested rate window is limited, with concurrency and token limits checked separately. Allow for the implementation's actual window semantics when interpreting boundaries.
- PostgreSQL and Redis outages stop budget/rate decisions that cannot be verified. A DB-less run is unacceptable for virtual-key and spend enforcement.
- Correct certificates work; wrong host/CA fails. Neither prompts nor raw credentials appear in logs. Report only route, status, token counts and latency.

Keep caching disabled until tenant, permission, model and prompt versions are part of its key. Stop ingress and revoke virtual keys before teardown. Remove only this lab container and its private secrets after preserving required audit evidence; do not drop a shared database or Redis instance.

Portkey can provide the same gateway role through its own virtual-key, routing and observability configuration. This package implements LiteLLM only. Moving the YAML to Portkey does not preserve semantics; recheck authentication, budget enforcement, fallback authorization and data residency against its API.

Interview question: Why can a gateway with a budget field still overspend? Usage can arrive after concurrent requests are admitted, pricing may be missing, or the database may be unavailable. Explain the tested fail-closed behavior and whether worst-case cost is reserved before admission. Ask your teacher to review that failure sequence.

Sources: [deployment requirements](https://docs.litellm.ai/docs/proxy/deploy), [virtual keys](https://docs.litellm.ai/docs/proxy/virtual_keys), [configuration settings](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/config_settings.md), [production operations](https://docs.litellm.ai/docs/proxy/prod).
