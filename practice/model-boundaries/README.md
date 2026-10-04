# Model output and history boundaries

Read the [worked lesson](../../reference/model-boundary-practice.html).
This project supplies provider-neutral boundaries, a Claude HTTP adapter and
deterministic fake-provider/HTTP tests. It has not made model calls.
Existing Python 3.10+, Pydantic v2, HTTPX and pytest are required for the whole suite.
No package was installed and no test was run.

When separately authorized, use `python -m pytest -q` in this directory.
Expected: all supplied cases pass. A compatible dependency lock is still unverified.

`retry.py` owns attempts, delay and cooperative deadlines. Integrating code must
disable SDK retries; otherwise three outer attempts can become nine transport
calls. Retry-After is a lower bound, including HTTP-date values. If it does not fit
the remaining budget, fail without retrying early. Only explicit Retryable errors
and timeouts retry. Unknown exceptions, cancellation, refusal, policy denial and
uncertain writes are terminal. Keep tools with external effects outside this API.

`structured.py` accepts only complete, bounded output, rejects duplicate JSON keys,
and validates types before checking the instrument allowlist. Repair sends an error
category and the original source, not the rejected output or private validation
details. Source text is still untrusted data; the provider adapter must preserve
that boundary. Model-generated facts can satisfy a schema and still be false.

`context.py` compares full history, a recent suffix, and summary references plus a
recent suffix. Required instructions, question and latest versioned facts are
retained in all modes. Summary references must match current facts exactly.
This deterministic extractive summary exercise does not evaluate an LLM summarizer.
Fact records are assumed to come from trusted application state, never raw model
output. Old historical messages remain history, not current policy.

Limits: word counts are a transparent synthetic budget, not model tokens. Tool
turns are atomic bundles with matching call/result IDs; the surrounding adapter
must correctly construct those bundles from real provider messages. No semantic
truth, prompt-injection immunity, billed token savings or improved model quality
is claimed. Cancellation-aware async adapters are required: wait_for may exceed
its timeout while waiting for cancellation, and cannot undo a remote operation.
HTTP body caps must apply before buffering provider replies, not only afterward.

## Provider counting and tool continuation

`claude_transport.py` supplies the two fixed HTTPS endpoints for messages and model-
specific input counting. The count request includes system text, messages (including
evidence) and tool schemas. `tool_loop.py` reserves output before each generation,
then compares counted input with returned input/cache usage. Output usage stays
separate. No dollar prices are assumed. Retries may incur charges even when their
usage is unavailable; the successful-response report is not a complete invoice.

For an approved provider run, obtain the API key through the approved secret store,
select an approved model ID and its documented context limit, and construct an
`httpx.AsyncClient(trust_env=False, follow_redirects=False)` in an async context
manager. Pass that client, key and model to `ClaudeTransport`. Do not paste keys
into code or transcripts. No CLI auto-calls the provider. The transport uses the
shared retry owner; default HTTPX transport has no automatic retry configured.

`run_tools` only supports the read_limit tool. Pass an async read adapter that uses
trusted tenant scope and a server-derived instrument allowlist. At most four calls
per turn and two active reads are allowed. Results keep their call IDs, including
errors. Repeated IDs abort before another read. Calls with invalid arguments,
unknown tools or denied instruments never reach the adapter. No write tools,
server-side tools, extended thinking, streaming or hidden reasoning are enabled.

Contract tests use HTTPX MockTransport, not the internet. Provider compatibility,
live counts, response quality, observed latency and cost remain VERIFY-01 work.
The provider schema is specific to Claude; it must not be sent to other providers
unchanged. Context limits and model IDs are deliberate deployment inputs because
they vary. Protocol errors and unsupported stop reasons fail closed.

Acceptance: repairs recover without exceeding attempt limits; terminal failures
make one call; retry delays respect the total budget; a denied instrument is never
sent back for repair; context truncation never keeps half a tool exchange.
