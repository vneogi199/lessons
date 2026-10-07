# Production AI practice

Read the [seven-part sequence](../../reference/production-ai-depth.html).

## Offline exercise

Python 3.10+ standard library only. From this directory:

```sh
python3 -m unittest test_offline -v
```

The nine tests use synthetic fixtures, no files, credentials, network or live
tools. `replay.py` checks sequential call contracts and fixture digests.
`evals.py` grades an observable tool-proposal list and exact final fields for
one reviewed three-turn conversation. Three outcomes demonstrate correct
behavior, a forgotten correction and an unsafe proposal with a correct answer.
This is a grader fixture, not a tested LLM, conversation simulator or semantic
quality benchmark. Hidden reasoning is neither collected nor needed.

`percentile` uses nearest rank. Prometheus histogram estimates can differ.
No production latency claim follows from synthetic sample arrays.

Observed verification on 2026-10-07: all nine offline tests passed with
Python 3.14.8. All seven new/updated Python files passed AST syntax checks.
Catalog links, search metadata, local links and the three dashboard query
definitions passed static checks. FastAPI, Logfire, Claude Agent SDK and
prometheus_client are absent from this interpreter; their integrations were
not executed. No packages were installed, live calls made or dashboards opened.

## Optional existing-environment exercises

- `logfire_app.py`: FastAPI/Pydantic v2/Logfire integration factory. It disables
  remote sending and console output. It has no authentication and must remain
  loopback-only with synthetic data. A local test exporter, privacy inspection,
  framework tests and lifecycle behavior still need runtime verification.
- `claude_options.py`: source-checked Claude Agent SDK configuration. No query is
  executed. Wildcard tool denial and strict MCP configuration must be verified
  against the installed SDK/CLI release before an approved live run. Record
  those exact versions; no tested dependency lock is claimed.
- [RFQ API](../rfq-api/README.md): CRUD, tenancy, request limits and transaction
  practice. Use the [operations lesson](../../reference/fastapi-production-operations.html)
  for shutdown, pool exhaustion, overload and rollout exercises.
- [AI metrics](../ai-metrics/README.md): Prometheus stage histogram and Grafana
  p50/p95/p99 panels. These require existing dependencies and infrastructure.

Do not install packages or enable provider calls as part of the offline lab.
No cloud resources, real RFQs or trading actions are needed.

## Evidence to produce

Record code revision, Python/package versions, command, observed outcome and
unexecuted checks. For a real service drill, add approved environment, load shape,
trace ID, before/after metrics and rollback result. Label synthetic outcomes.
Never convert completion of these pages into a claim of production experience.
