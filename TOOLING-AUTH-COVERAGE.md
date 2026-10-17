# Follow-up coverage — 2026-10-17

Scope: pending items from the recent uv/Ruff/pytest, JavaScript Proxy/Reflect and
authentication coverage questions. No changes to the website's login system.

| Topic | Coverage after this change |
| --- | --- |
| uv | New environment/metadata/lock/sync/run explanation; dependency groups, no-install precautions, CI recipe and limitations |
| Ruff | New lint versus format, rules/configuration, reviewed fixes, suppressions and check-only CI |
| pytest | Existing 0295 plus new small project, parametrization, fixtures, tmp_path, monkeypatch, failure expectations, coverage limits and CI sequence |
| Proxy / Reflect | Already covered in 0102: traps, receiver forwarding, invariants, revocation and private/internal-slot limitations; no new gap identified in the recent discussion |
| Session tokens, JWT, headers, bearer tokens | Existing 0326/0328/0308 plus new credential-role comparison and browser/backend trace |
| OAuth / OIDC | Existing grant and login material plus refresh races, lost-response recovery and issuer/audience-bound logout |
| CSRF / XSS | Existing 0055/0328 plus explicit cookie/header and HttpOnly limitations in the lifecycle guide |
| Refresh tokens | New rotating-family state exercise: consumption, reuse, expiry, revocation, client serialization and unknown outcomes |
| SSO / SAML | New local versus global logout, OIDC RP-initiated/back-channel flow, partial delivery, SAML SLO contract and acceptance plan |

Start at [Python tooling](reference/python-tooling-workflow.html) or
[token/session lifecycle](reference/token-session-lifecycle.html).

Verification is separate from authored coverage. The standard-library checks
execute 12 quantity cases and 10 lifecycle tests. The real pytest suite has 14
cases but needs a prepared pytest environment. Ruff/pytest are not installed by
this change, no dependency lock is invented, and no active CI deployment is added.
Live IdP, signed back-channel/SAML logout, browser and distributed-store checks
remain unrun. The lifecycle model accepts trusted synthetic events; it is not a
JWT verifier, token endpoint or deployable authentication implementation.
