# A narrow Jira MCP server

An agent can request execution of an existing approved review ticket. It cannot choose a Jira site, change the project, add fields or approve its own request. `mcp_server.py` exposes only read, approved-create and reconcile tools. The existing Jira adapter owns the external operation ledger.

The MCP SDK handles protocol negotiation, JSON-RPC validation and Streamable HTTP. This server uses stateless HTTP with JSON responses. It does not allocate a durable MCP session; each request needs a valid bearer token. Business operation IDs remain in SQLite across requests and restarts. A protocol session ID would not replace them.

The verifier accepts an explicit RS256 access-token profile: `typ=at+jwt`, fixed issuer, one exact audience, known key ID, expiration, not-before, issue time, subject, client ID and scopes. Maximum token lifetime is 15 minutes. Operator-owned public keys and membership mappings determine permitted tenant, actor and project. No token URL is fetched. ID tokens and tokens intended for Jira or another API are rejected. An authorization server must issue this profile; this package does not implement OAuth login, token issuance or discovery endpoints for that server.

Each tool rechecks the current membership and required `jira:read`, `jira:create` or `jira:reconcile` scope. The common MCP scope alone cannot create a ticket. Remove membership to revoke local access, rotate pinned keys with overlap for still-valid tokens, and restart with reviewed configuration. For immediate distributed revocation, use an authorization service and introspection; this single-process fixture has no fleet-wide revocation channel.

## Approval and uncertain delivery

The trusted review application calls `Boundary.propose` after authenticating the initiator. It displays destination, summary, description and operation ID. The shared approval ledger issues an immutable payload hash. A separately authenticated reviewer calls `Approvals.decide` with that hash. Neither method is an MCP tool. Use the existing OIDC/approval UI integration, TLS and CSRF controls before exposing a browser review surface.

`create_approved_ticket` accepts only the operation ID. It loads the stored owner and payload, checks approval expiry, and recomputes the exact Jira field digest. The adapter records `unknown` durably before sending. Repeating the same operation returns its recorded state without another POST. A changed payload fails.

After a timeout, reconciliation searches only the approved project and operation label. It requires one exact field match from the expected bot creator. Empty or ambiguous results remain unknown. It never treats an empty search as permission to create again. Reconciliation can inspect an expired approval's existing operation under current permissions; expiration cannot authorize a new effect.

## Deployment recipe, not a deployed service

Baseline: Python 3.11+, `mcp==2.3.0`, PyJWT with an approved cryptography backend, HTTPX, Uvicorn and Starlette in an already-prepared environment. No package was installed, server started, signature checked or Jira request sent. Review dependency advisories and record exact versions before execution.

An operator creates a private config file with `issuer`, `resource` ending in `/mcp`, `public_key_files` mapping key IDs to reviewed PEM paths, `ledger_path`, `site`, `project`, `issue_type`, `bot_account`, `bot_email`, and `members`. Each member contains `subject`, `client_id`, `tenant`, `actor`, `project` and `scopes`. Keep this out of the public lesson repository. Store the Jira API token in a secret-manager-mounted file, readable only by the service identity. Restrict the bot to the selected project and required issue permissions. This fixture assumes project-wide read access; do not map a principal whose issue-level rights are narrower than the bot's without adding an issue authorization resolver.

After explicit approval, set `APPROVED_JIRA_MCP=yes`, `JIRA_MCP_CONFIG` and `JIRA_TOKEN_FILE` to reviewed local paths, then run:

```sh
python serve_mcp.py
```

The process binds loopback port 8010. Put it behind an approved TLS reverse proxy that preserves the configured external Host, rejects other hosts/origins, caps the body at 16 KiB, limits requests per identity and times out slow request bodies. The SDK also enforces the body bound and exact Host/Origin allowlists. Keep one worker with this SQLite ledger on a private durable volume. Back up the ledger and test recovery; losing it can lose replay protection. Never delete it to resolve an uncertain ticket.

Restrict egress to the configured Jira site. Disable body/token logging. Record operation IDs, outcome and latency without descriptions or credentials. Stop new requests before shutdown, reconcile unknown operations and retain evidence according to the approved retention policy. Revoke the bot credential and client access before removing a deployment.

With separate permission, run `python -m pytest -q test_mcp_server.py test_jira.py`. The fixtures generate signing keys in memory, use a mock Jira transport and exercise the real MCP HTTP stack. Expected checks cover missing auth, audience/expiry/key rotation, tool listing, approval denial, replay, exact fields, wrong owner and lost-response reconciliation. No test has run. Add a real authorized client handshake and disposable Jira project acceptance run before deployment signoff.

Interview question: Why does an MCP server still need an operation ledger? A timeout can happen after Jira creates the issue. The protocol cannot tell whether that external write committed. The ledger prevents blind retries while reconciliation checks the result. Ask your teacher to review a crash-between-POST-and-response trace.

Sources: [SDK authorization](https://py.sdk.modelcontextprotocol.io/run/authorization/), [ASGI deployment](https://py.sdk.modelcontextprotocol.io/run/asgi/), [published SDK baseline](https://pypi.org/project/mcp/2.3.0/), [Jira adapter](README.md), [shared approval ledger](../agent-workflows/README.md).
