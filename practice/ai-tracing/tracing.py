"""One bounded traced workflow; adapters own authorization and business validation."""
import asyncio
from contextlib import contextmanager
from opentelemetry.context import Context
from opentelemetry.trace import Status, StatusCode, SpanKind
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

NAMES = {"request", "retrieval", "reranking", "model.attempt", "tools", "tool.lookup",
         "approval", "queue.publish", "queue.consume", "execute"}
PROPAGATOR = TraceContextTextMapPropagator()


def provider(exporter=None):
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    result = TracerProvider(resource=Resource.create({"service.name": "lesson-ai"}),
                            sampler=ParentBased(TraceIdRatioBased(.1)))
    result.add_span_processor(BatchSpanProcessor(exporter or OTLPSpanExporter(
        endpoint="http://127.0.0.1:4318/v1/traces", timeout=2),
        max_queue_size=256, max_export_batch_size=64, schedule_delay_millis=1000))
    return result


@contextmanager
def span(tracer, name, *, context=None, kind=SpanKind.INTERNAL, attempt=None):
    if name not in NAMES or (attempt is not None and attempt not in {1, 2}):
        raise ValueError("fixed span name and attempt bound required")
    with tracer.start_as_current_span(name, context=context, kind=kind,
            record_exception=False, set_status_on_exception=False) as current:
        if attempt is not None:
            current.set_attribute("attempt", attempt)
        try:
            yield current
        except BaseException as exc:
            outcome = "cancelled" if isinstance(exc, asyncio.CancelledError) else (
                "denied" if isinstance(exc, PermissionError) else "error")
            current.set_attribute("outcome", outcome)
            current.set_status(Status(StatusCode.ERROR, outcome))
            raise
        else:
            current.set_attribute("outcome", "success")
            current.set_status(Status(StatusCode.OK))


async def stage(tracer, name, function, *args, attempt=None):
    with span(tracer, name, attempt=attempt):
        async with asyncio.timeout(5):
            return await function(*args)


async def request(tracer, *, retrieve, rerank, model, tools, approve, publish, operation):
    if len(tools) > 2 or not isinstance(operation, str) or not 1 <= len(operation) <= 128:
        raise ValueError("bounded read tools and trusted operation ID required")
    # A public caller cannot force a trace ID or sampled flag. Start a new root.
    with span(tracer, "request", context=Context(), kind=SpanKind.SERVER):
        async with asyncio.timeout(20):
            docs = await stage(tracer, "retrieval", retrieve)
            docs = await stage(tracer, "reranking", rerank, docs)
            for attempt in (1, 2):
                try:
                    proposal = await stage(tracer, "model.attempt", model, docs, attempt=attempt)
                    break
                except TimeoutError:
                    if attempt == 2:
                        raise
            with span(tracer, "tools"):
                # TaskGroup cancels sibling reads on failure and waits for cancellation.
                async with asyncio.TaskGroup() as group:
                    reads = [group.create_task(stage(tracer, "tool.lookup", tool)) for tool in tools]
            if await stage(tracer, "approval", approve, proposal, [task.result() for task in reads]) is not True:
                raise PermissionError("approval denied")
            with span(tracer, "queue.publish", kind=SpanKind.PRODUCER):
                carrier = {}
                PROPAGATOR.inject(carrier)
                async with asyncio.timeout(5):
                    await publish({"operation": operation, "trace": carrier})


async def consume(tracer, message, execute):
    # Only a trusted authenticated queue may invoke this function. A trace is not identity.
    carrier = message["trace"]
    if not isinstance(carrier, dict) or set(carrier) - {"traceparent", "tracestate"} or any(
            not isinstance(v, str) or len(v) > 512 for v in carrier.values()):
        raise ValueError("bounded W3C carrier required")
    context = PROPAGATOR.extract(carrier)
    with span(tracer, "queue.consume", context=context, kind=SpanKind.CONSUMER):
        await stage(tracer, "execute", execute, message["operation"])
