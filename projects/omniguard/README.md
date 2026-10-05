# OmniGuard: read-only policy and data answers

`service.py` connects FastAPI, opaque sessions, permission-filtered retrieval,
typed SQL intents and the existing buffered security pipeline. Its defaults use
two synthetic documents, fixed vectors, a fixed answer generator and fake SQL
rows. These make the control flow inspectable without a provider or database.
They do not measure embedding quality, PII detection or database connectivity.

Use an existing Python 3.11+/FastAPI/Pydantic v2/pytest/HTTPX environment. No
packages were installed and no tests or services were run. After execution
approval, `python -m pytest -q` from this directory exercises both HTTP paths
and rejection cases.

For a local demo, create the app with a private SQLite path. In trusted Python
startup code, obtain a short-lived token through
`app.state.service.sessions.issue_session('reader', 'demo', False)`.
Pass it as `Authorization: Bearer ...`. There is no public issuance route.
Production must map a verified OIDC subject to local identity and permissions;
the [OIDC lab](../../practice/oidc-login/README.md) supplies that separate flow.
Do not accept a user-provided tenant or treat a model's identity claim as login.

POST `/ask` with `{"question":"Explain policy"}`. The expected answer cites
`policy`, version `v1`. The other tenant's document must never reach generation.
Lexical and vector rankings each filter permissions before retrieval, then merge
with reciprocal-rank fusion. The small index scans at most 100 documents and
uses synthetic vectors. Before release, the pipeline rechecks permission and
document version. A changed ACL, invented citation, scanner failure or private
output produces no answer. Citation membership alone does not prove entailment.

POST `/query` with
`{"query":"exposure_by_desk","desk":"RATES","as_of":"2026-01-01"}`.
The default returns a clearly labeled fixture total `125.00`. A different desk
is denied. An extra `sql` field is rejected. With an explicitly supplied approved
connection, `Service.query` delegates to the existing parameterized SQL Server
adapter. Only two fixed templates are available; no generated SQL is executed.
The HTTP demo does not open a real connection. For an authorized real adapter,
use [TLS, driver timeouts and read-only roles](../../practice/legacy-integrations/README.md).

The default redactor only replaces the word PRIVATE. This is deliberately a
fixture, not a PII detector. `enable_local_guards(approved_spacy_directory)` wires
the existing local-only Presidio implementation and pinned NeMo fixture rails.
It requires their already-provisioned dependencies and model files. Presidio
redacts before generation and scans before release. The NeMo model still returns
fixed decisions; replace and evaluate that adapter before claiming semantic
safety or topicality. The tiny keyword topic check is also a fixture. The local
CPU detector can block the event loop; production needs bounded worker isolation.

`Dockerfile` uses an approved pre-provisioned digest-pinned base and installs
nothing. Build from the repository root only after permission. It preserves the
repository paths used by the shared adapters. The container entry point creates
no sessions, so it remains closed to business requests. SQLite state is temporary.
Do not deploy it as a live client system. First integrate real identity, durable
state, a real model/guardrail policy and private SQL access, then use the
[single-artifact release pattern](../../practice/api-release/README.md). That
release script targets its RFQ demo; it must not be repointed without a reviewed
OmniGuard task definition and acceptance checks.

UAT: request a cited policy answer, repeat as an unlisted user, revoke a document
during generation, inject an output canary, and request a forbidden SQL desk.
The supplied tests assert these outcomes but were not executed. Retain expected
and observed results separately. The [delivery pack](../../practice/client-delivery/DELIVERY-PACK.md)
supplies discovery, scope, risk, UAT and handoff examples for adaptation.

Interview question: why return financial totals outside a free-form model answer?
Answer: the fixed query and database compute the total. The model does not need
to reconstruct it from text or invent a query. Ask your teacher to review the
authorization recheck and the SQL view's currency contract.
