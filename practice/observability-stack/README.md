# Observe a small, bounded workload

This lab connects a synthetic FastAPI endpoint, Prometheus, Grafana and Locust.
It reuses the existing metric definitions. The endpoint waits 50 ms to simulate
I/O and admits at most eight active requests per process. It does not call an
LLM, so it emits no model-token or cost samples.

Nothing was installed, started or exported. Use existing reviewed container
images, Python packages and approved accounts. Supply digest-pinned images as
`FIXTURE_IMAGE`, `PROMETHEUS_IMAGE` and `GRAFANA_IMAGE`. The fixture image needs
FastAPI, Uvicorn and prometheus-client already present. Compose never pulls images.
Keep the Grafana admin password in a private external file named by
`GRAFANA_ADMIN_FILE`; do not commit it. Ports bind only to loopback.

After execution approval, from this directory start `docker compose up`.
Check Prometheus target `synthetic-lesson` is UP, then import
[`../ai-metrics/dashboard.json`](../ai-metrics/dashboard.json) into Grafana and
select Lesson Prometheus. Begin with an already-provisioned Locust environment:
`locust -f locustfile.py --headless -u 5 -r 1 -t 30s`.
Then repeat with 50 users. This file rejects a non-loopback target and disables
redirect following. Do not extend it to another host without load-test approval.

Expected: request counts grow; the higher load may cause 503 admission failures.
Compare Locust latency/error counts with Prometheus p95 and outcome counts.
The five-second scrape and histogram buckets mean the two views need not match
exactly. Token/cost panels must remain without samples, not invented cost values.
No measurements or throughput claims are recorded here. Stop with
`docker compose down`; the lab uses disposable container storage.

`export_fixture.py` supplies separate opt-in LangSmith, Langfuse and MLflow SDK
exercises. Use an existing approved HTTPS endpoint and project-scoped credentials.
The command refuses export unless `--approve-synthetic-export` is supplied.
Its application payload contains fixed, clearly labeled fixture values. It never reads application
traces or real customer data. For example, after separate approval:
`python export_fixture.py mlflow --endpoint https://approved.example --approve-synthetic-export`.
Replace the example URL with your approved backend. No backend was contacted here.

Use the named SDK's supported credential mechanism: LangSmith API key, Langfuse
public/secret key pair, or MLflow's configured tracking authentication. Inject
credentials through the approved runtime secret mechanism; never put them in
arguments or source. Record exact installed SDK/backend versions before the run.
The source targets the documented APIs, but no compatibility matrix was executed.
Verify the run appears, check both fixture counts and delete the synthetic project
under your retention policy. A completed SDK call alone does not prove ingestion.

Question: does a trace viewer replace a metrics dashboard? No. A trace explains
one sampled request; metrics summarize the workload. Neither establishes answer
correctness without evaluation data. Ask your teacher to review a request where
latency stays low because the service rejects work early.

Sources: [LangSmith create/update API](https://reference.langchain.com/python/langsmith/client/Client),
[Langfuse instrumentation](https://langfuse.com/docs/observability/sdk/instrumentation),
[MLflow tracking](https://mlflow.org/docs/latest/ml/tracking/tracking-api/).
