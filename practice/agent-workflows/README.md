# Bounded agent workflow practice

Read the [worked lesson](../../reference/agent-workflow-practice.html).
Python 3.10+, Pydantic v2 and pytest are required; graph tests additionally require
an already-installed compatible LangGraph. No libraries were installed and no
tests were executed. Exact runtime versions remain to be recorded under VERIFY-01.

When authorized, run `python -m pytest -q` from this directory. Deterministic
worker/planner adapters never call a model, send a ticket, or access real documents.

workflows.py supplies typed Plan & Execute with at most one replan. A missing or
stale result remains in the result history, so a fallback does not silently erase
uncertainty. Any unresolved failure makes the outcome review. A fixed successful
plan can finish complete; that means its reads finished, not a business approval.

Guard blocks writes/unknown tools, repeated same-version actions, cycles, too many
steps, no progress and reserved-cost overflow. Bounded polling is explicit. The
caller must derive evidence versions from authoritative state, not model claims.
Cost units are synthetic admission reservations, not measured dollars or provider
billing. Use one guard per run and an application-owned clock. Check it before
each call; it cannot interrupt work already admitted.

correct uses deterministic validation feedback and stops on repeated drafts. The
example checks a required citation marker, not entailment. Passing it does not
prove truth. This is prompted correction, not a trained Self-RAG model.

graphs.py builds an actual LangGraph parent supervisor and dynamic worker subgraph.
Stable IDs own result slots. Duplicate IDs and disallowed sources fail at dispatch;
worker scope is rechecked. Failed/timeout workers remain explicit. Conflicting
claims require review, even if several other workers agree. Ready_for_human never
authorizes an external effect. Input allowed/allowed_sources are trusted fixtures;
an HTTP application must derive them from verified identity.

The parent uses an outer ten-second timeout, two-second cooperative worker timeouts,
max_concurrency=2, at most eight work items, and a recursion limit. Async adapters
must cooperate with cancellation. The pure reducer tests compare merge order and
duplicate/conflict behavior. Graph tests cover schema construction, compilation,
conditional denial, async invocation, nested graphs, partial failure and disagreement.
Runtime behavior remains unverified. Persistence/approval adapters are separate tasks.

## Persistent checkpoints

checkpoints.py and test_checkpoints.py use the separately supplied
langgraph-checkpoint-sqlite package, if already installed. The tests cover close/reopen,
an actual second Python process, interruption before the local effect, and a crash
after effect commit but before the completed checkpoint. A unique tenant/operation
key makes the local ledger idempotent on replay. Tests are written, not executed.

Tenant/run IDs must be derived and authorized by the server. Hashing them separates
keys; it is not authentication. State schema_version is checked before work and
before resumption. Unsupported versions fail instead of silently misinterpreting
old checkpoints. Migrations need a separately reviewed adapter and backup.

The approval boolean is a trusted test input. It is not an authenticated approval
endpoint. Do not expose raw Command(resume=...) to clients. Real approval binding
is AGENT-03. The effect table models a local atomic effect; a remote Jira call needs
a durable operation ledger plus provider reconciliation. A checkpoint alone does
not provide exactly-once external delivery. Protect the database and backups,
enforce retention, and allow only one authorized writer per run.

## Approval and semantic memory storage

approval.py supplies opaque sessions stored as token hashes and an immutable
payload-hash approval ledger. Only a trusted identity service can call issue_session;
it is not a password/SSO login implementation. Decide verifies current session,
reviewer capability, tenant, payload hash and expiry inside a write transaction.
Repeated identical decisions by the same reviewer return the existing outcome;
conflicting decisions fail. Source/intent changes must invalidate the old proposal
and create a new one. Reviewer session revocation prevents later decisions/resume.

resume_checked checks a server-selected graph's pending operation and tenant before
claiming approval, then issues Command(resume=True). Keep one server-side lock per
run across snapshot, claim and invoke; a multi-process service needs a distributed
lease. Never accept thread config, roles or tenant directly from a browser. A crash
after claim leaves resume_claimed for reconciliation. It deliberately fails closed
instead of promising atomicity across the approval DB, checkpoint and remote API.
Cookie-based HTTP wrappers additionally need CSRF protection, TLS and secure cookies.

memory.py keeps semantic facts under tenant/owner/topic with monotonically increasing
revisions, source versions, embedding contract, expiry and explicit consent. Search
filters scope/consent/expiry and current source versions before ranking. Forget erases
text/vectors and keeps a revision tombstone so an old write cannot resurrect them.
Backups need their own retention/deletion policy. A newer revision requires renewed
explicit consent. It does not automatically recreate forgotten records.

The injected encoder is a simple synthetic two-axis encoder in tests. Production
must use one approved semantic model contract and treat returned facts as evidence,
not entitlements. Episodic events belong to a separately dated history; this table
does not turn past outcomes into current policy. Revalidate permissions and source
versions at final answer release because retrieval is a snapshot, not a lock on
future revocation. No caches are implemented. Tests cover scope, stale versions,
consent, expiry, deletion, decision conflicts and session revocation; none ran.
