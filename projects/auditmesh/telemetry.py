"""Optional local telemetry wiring. No exporter is configured by importing this file."""
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'practice/ai-metrics'))
sys.path.insert(0, str(ROOT / 'practice/ai-tracing'))
from metrics import Metrics
from opentelemetry.context import Context
from opentelemetry.trace import Status, StatusCode


class Telemetry:
    def __init__(self, app, tracer, metrics):
        self.app, self.tracer, self.metrics = app, tracer, metrics

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or scope['path'] == '/metrics':
            return await self.app(scope, receive, send)
        started, status = time.monotonic(), 500
        async def sent(message):
            nonlocal status
            if message['type'] == 'http.response.start':
                status = message['status']
            await send(message)
        outcome = 'error'
        try:
            # No request headers, bodies, paths, sessions or exception messages exported.
            with self.tracer.start_as_current_span('request', context=Context(),
                    record_exception=False, set_status_on_exception=False) as current:
                try:
                    await self.app(scope, receive, sent)
                    outcome = 'success' if status < 400 else 'denied' if status in {401, 403} else 'error'
                finally:
                    current.set_attribute('outcome', outcome)
                    current.set_status(Status(StatusCode.OK if outcome == 'success' else StatusCode.ERROR))
        finally:
            self.metrics.finish(outcome, min(time.monotonic()-started, 3600))


def instrument(app, tracer):
    from fastapi import Response
    metrics = Metrics()
    app.add_middleware(Telemetry, tracer=tracer, metrics=metrics)
    # Loopback demonstration only. Production needs a private authenticated scrape path.
    @app.get('/metrics', include_in_schema=False)
    def expose():
        return Response(metrics.exposition(), media_type='text/plain; version=0.0.4')
    app.state.metrics = metrics
    return metrics
