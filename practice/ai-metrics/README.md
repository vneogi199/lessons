# Measure the whole task

A request tries a model twice. The first call fails after it uses tokens. The second succeeds. Record two attempts and one task. Both bills belong in the cost numerator. Only the successful task belongs in the success denominator.

`metrics.py` uses an already approved `prometheus_client` environment. Nothing installs, starts a server or calls a provider. Tests are supplied but were not run. `dashboard.json` is an importable Grafana definition; it has not been opened in Grafana.

Call `attempt` once when each provider attempt finishes, including failures and retries. Pass `None` when billing usage is unknown. Zero means known zero usage. Keep provider request IDs in a restricted reconciliation ledger, never in metric labels. Reconcile missing usage against billing records; these counters are operational estimates, not an accounting ledger.

Normalize each provider's usage into disjoint input, cache-read, cache-write and output categories. If the provider reports total input including cached input, subtract the cached portions first. If its counters exclude cached input, do not subtract them again. Split cache-write prices by retention tier upstream or reject an unsupported pricing mode. Load Decimal prices from a reviewed versioned table; the test uses fictional prices.

Use `time.monotonic()` at request admission. Call `finish` once in the request's finalization path. Measure the first answer token that the client can receive, after safety buffering. A provider's first byte, a heartbeat and the first internal token are different events. Leave TTFT absent for a denied response or a request that never emits a token. Record total duration for those requests anyway.

Expose `exposition()` on a private metrics route with content type `text/plain; version=0.0.4; charset=utf-8`. Allow only the monitoring network to scrape it. Use one registry per process; scrape every worker separately or configure the client library's supported multiprocess mode. Do not silently scrape just one of several workers. This lesson does not implement the multiprocess setup.

Import the dashboard into an authorized Grafana instance and select a Prometheus data source. Scope that source to this service or add an exact job selector to every query. Otherwise unrelated services with the same metric names will be combined. Quantiles are bucket estimates; never average instance p95s. These classic buckets permit aggregation across workers. Requests above the largest finite bucket reduce tail resolution. Tune buckets against your latency target.

The cost panel includes failed attempts. Unknown cost makes the displayed number incomplete. It excludes retrieval infrastructure, GPU idle time, network charges and labor. Zero successful tasks produces a gap, not a claim that success was free. Five-minute endpoint windows and one-hour cost windows are explicit choices. Short windows with sparse traffic can mislead.

Practice: with two known attempts costing $0.00032 each and one success, what is the known model cost per success? $0.00064. Add a third attempt with missing usage. The known subtotal stays $0.00064, but the true total is unknown. Explain why a budget alert cannot safely treat this subtotal as the final bill.

Ask the teacher to review your provider usage mapping before connecting real billing data.

Sources: [Prometheus histograms](https://prometheus.io/docs/practices/histograms/), [Python client multiprocess mode](https://prometheus.github.io/client_python/multiprocess/), [Grafana dashboard JSON](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/view-dashboard-json-model/).
## Stage latency extension

Read [p50/p95/p99 by stage](../../reference/stage-latency-percentiles.html).
Call `metrics.stage(stage, outcome, elapsed_seconds)` once for each attempt,
including failed retries. Stage names are queue, validation, retrieval, model,
tool and response. Use a monotonic timer. Do not record zero for skipped stages.
The dashboard includes three per-stage percentile panels and a count panel.
They aggregate all outcomes; group by outcome as well for failure comparisons.
Only merge matching service/environment series with identical bucket boundaries.
The supplied dashboard assumes a dedicated data source for this teaching app.
Stage percentiles cannot be added or averaged into request percentiles.
The extra Prometheus test is supplied; runtime and dashboard import require
existing packages/services and are not claimed here.
