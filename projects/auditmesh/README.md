# AuditMesh: review, approve, then execute

Two workers read synthetic evidence and policy. The LangGraph supervisor joins
their results. A failed worker prevents a proposal. An authenticated reviewer
approves the exact stored payload. A separate action creates a fake ticket.

`service.py` assembles the existing worker graph and opaque-session ledger.
`ui.py` supplies a Streamlit client. No paid model, Jira account or network
integration is needed by the backend. The UI talks only to the loopback backend.
This is a single-host teaching application, not a deployed compliance system.

Use an existing environment with Python 3.11+, LangGraph, FastAPI, Pydantic v2,
Uvicorn, Streamlit, requests and pytest. Versions are not locked or runtime
verified. Nothing was installed and these tests were not run.

After execution approval, run from this directory. Start the backend with a
local launcher: `python local.py /approved/private/path/audit.db`.
It binds to loopback and displays a five-minute synthetic session in your private
terminal. Use a private existing parent directory, not a shared folder. Do not
put the token in source, a URL or a shared log. There is intentionally no public
session-issuance endpoint. A real deployment must obtain the identity from the
[OIDC adapter](../../practice/oidc-login/README.md) and map roles server-side.

Start the UI with `streamlit run ui.py`. Keep its supplied CORS and XSRF settings.
The backend accepts an explicit bearer token, not an ambient browser cookie.
The browser cannot choose the backend destination. TLS, reverse-proxy trust,
request limits and an actual identity-provider integration need deployment review
before either process is exposed beyond loopback.

Enter the token and `review1`. Start the review, then load its status. Inspect
the payload and hash. Approve it and refresh: execution must still say
`not_completed`. Execute it, refresh, and expect `completed`. Duplicate execution
must leave exactly one row in `fake_tickets`. Rejecting a proposal cannot create
a ticket. These are expected results, not recorded observations.

SQLite persists the joined result, approval and execution state. Persistence is
at application-stage boundaries, not at every LangGraph node. After stopping all
old workers, call `recover_reviews()` to mark interrupted reviews. They do not
resume automatically; start a new run after investigating the failure. For
node-level replay, study the separate
[checkpoint lab](../../practice/agent-workflows/README.md).

`stop(True)` is a trusted operator action. It blocks new effect transactions.
It cannot undo an effect already committed. No HTTP caller can switch it off.
An execution crash after its durable claim leaves `unknown`. Reconciliation
checks the fake ledger; absence does not authorize another create. Real Jira
needs its [remote reconciliation adapter](../../practice/jira-boundary/README.md),
not a replacement of the SQLite insert with an unguarded HTTP request.

Run `python -m pytest -q` only after execution approval. Supplied tests cover
denial, stale intent, partial worker failures, timeout classification, restart,
duplicate decisions/execution, interrupted review and kill-switch behavior.
The timeout fixture raises TimeoutError; it does not measure elapsed timeout.
Token expiry, live identity login, browser CSRF and external Jira remain separate
integration checks. SQLite growth/retention, multi-host coordination and live
worker cancellation are not implemented.

Interview question: why is an approval hash insufficient on its own?
Answer: the server must also check the current session, tenant, expiry and
decision state. A copied hash grants no permission. Ask your teacher to review
the crash window before adapting this example to a real write operation.

UI settings follow [Streamlit configuration](https://docs.streamlit.io/develop/api-reference/configuration/config.toml).
Graph persistence concepts follow [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence).
