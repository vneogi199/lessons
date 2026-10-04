# Trace the failed step, not the private text

One request retrieves documents, reranks them, tries a model, reads tools and requests approval. It then publishes a trusted operation ID. The worker executes that operation under the same trace. `tracing.py` supplies this tree with injected async adapters and an OTLP exporter configuration. It has no real model, broker or external tool configured.

`test_tracing.py` uses an in-memory exporter. Its first model call times out and its second succeeds. It checks two attempt spans, the worker's parent span and the absence of raw content in span fields. Tests and collector startup are unexecuted. Use already approved matching OpenTelemetry API/SDK/HTTP-exporter packages; no installation is authorized by this lesson.

Construct `provider()`, get its tracer with `get_tracer("lesson.workflow")`, then call `request` with authorized adapters. The two parallel tools must be independent read operations. `approve` must use the durable exact-intent ledger, not a model's boolean. `publish` acknowledges durable queue storage. The worker's `execute` must look up the operation, recheck permissions and apply idempotency. A trace ID is never an authorization token or an idempotency key.

The root starts with an empty context. Public trace headers cannot force sampling or join another user's trace. W3C context is injected only into the trusted queue envelope. The consumer extracts only trace context, not arbitrary baggage. Secure the broker and authenticate producers; tracing alone cannot prove a message's origin. For batched consumption use span links to each message context instead of choosing a misleading single parent.

Names and attributes use a fixed allowlist. Do not add prompts, documents, tool arguments, tokens, user IDs or raw exception messages. Automatic exception recording is disabled; the adapter emits only a bounded outcome and sanitized status. Application logging and auto-instrumentation need separate review, because this wrapper cannot redact another library's logs. Use the existing private-telemetry export policy for human-reviewed failure fixtures.

The SDK samples 10% of new roots and respects the parent's choice for children. This reduces cost but misses some failures. It is not an audit trail. A production audit record needs its own durable store. For tail-based error sampling, first budget collector storage and traffic; head-dropped spans cannot be recovered downstream. Metrics must count every request independently of trace sampling.

`collector.yaml` listens on loopback and forwards through TLS with client credentials from protected files. Set the backend URL and certificate file paths only in an authorized environment. An app and collector in separate containers cannot reach each other through loopback; use a reviewed private network and receiver authentication before changing the binding. Do not expose an unauthenticated receiver publicly. Rotate certificate files through the deployment system and verify rejection of expired credentials.

Bounded exporter queues can drop telemetry during outages. Monitor queue/export errors, flush with a timeout at shutdown, then shut down the provider. Never block a business transaction indefinitely to export a span. The collector configuration is supplied, not deployment-tested.

Interview: why does a successful request contain an error span? An earlier attempt failed before a later retry succeeded. Reading only the root hides that cost and latency. Ask the teacher to trace the queue boundary and identify which checks still protect the external effect.

Sources: [Python instrumentation](https://opentelemetry.io/docs/languages/python/instrumentation/), [context propagation](https://opentelemetry.io/docs/languages/python/propagation/), [collector configuration](https://opentelemetry.io/docs/collector/configuration/).
