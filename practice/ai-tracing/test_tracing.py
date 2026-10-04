import unittest
from unittest.mock import AsyncMock
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from tracing import request, consume


class TraceTests(unittest.IsolatedAsyncioTestCase):
    async def test_retry_tree_queue_parent_and_no_content(self):
        exporter = InMemorySpanExporter()
        provider = TracerProvider()
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        tracer = provider.get_tracer("test")
        publish = AsyncMock()
        try:
            await request(tracer, retrieve=AsyncMock(return_value=["private-document"]),
                rerank=AsyncMock(return_value=["private-document"]),
                model=AsyncMock(side_effect=[TimeoutError("SECRET"), "private-proposal"]),
                tools=[AsyncMock(return_value="private-tool")], approve=AsyncMock(return_value=True),
                publish=publish, operation="op-1")
            await consume(tracer, publish.call_args.args[0], AsyncMock())
            spans = exporter.get_finished_spans()
            self.assertEqual(len([s for s in spans if s.name == "model.attempt"]), 2)
            producer = next(s for s in spans if s.name == "queue.publish")
            consumer = next(s for s in spans if s.name == "queue.consume")
            self.assertEqual(consumer.parent.span_id, producer.context.span_id)
            self.assertEqual(len({s.context.trace_id for s in spans}), 1)
            for s in spans:
                self.assertLessEqual(set(s.attributes), {"attempt", "outcome"})
                self.assertEqual(len(s.events), 0)
                self.assertNotIn("SECRET", s.status.description or "")
        finally:
            provider.shutdown()


if __name__ == "__main__":
    unittest.main()
