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

## Observe the exercise

The optional `--telemetry` launcher flag uses the existing
[OpenTelemetry provider](../../practice/ai-tracing/README.md). It requires the
already-provisioned OpenTelemetry SDK/OTLP exporter and prometheus-client.
It sends sampled request spans to a pre-existing loopback collector and exposes
`/metrics` for a private Prometheus scraper. This switch makes network calls to
that collector; it has not been enabled here.

Import `dashboard.json` into your existing Grafana instance and select its Tempo
data source. Also import [the cost/latency dashboard](../../practice/ai-metrics/dashboard.json)
and select the Prometheus source that scrapes this application. Request metrics
count all API calls, not completed compliance cases. Short tests can leave rate
panels empty until enough samples exist. Trace sampling can omit failed requests;
SQLite decisions, not sampled traces, are the durable exercise record.

The default workers do not call a model. Token and cost panels therefore have no
model-attempt series; this is not measured zero-dollar production operation.
When adding an authorized real adapter, report each attempt through
`app.state.metrics.attempt` with observed usage and a reviewed price table.
Missing usage/prices must use the unknown-cost path. Never fabricate token counts
from the fixture strings. HTTP spans omit session tokens, payloads and user IDs.
Worker-level spans are demonstrated separately in the tracing lab; this assembly
currently exports request spans only.

`test_api.py` adds actual FastAPI test-client flows for bounded input, denied
sessions, stale hashes, separate approval and duplicate execution. Service tests
cover worker failure, restart and the kill switch. None were executed. Importing
a dashboard is not evidence that the queries match a live backend version.

UI settings follow [Streamlit configuration](https://docs.streamlit.io/develop/api-reference/configuration/config.toml).
Graph persistence concepts follow [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence).
