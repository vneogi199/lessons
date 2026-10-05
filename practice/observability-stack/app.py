"""Synthetic work endpoint for a loopback load experiment."""
import asyncio
import time
from fastapi import FastAPI, Response
from metrics import Metrics

app = FastAPI()
metrics = Metrics()
active = 0


@app.get('/work')
async def work():
    global active
    start = time.monotonic()
    if active >= 8:
        metrics.finish('denied', time.monotonic()-start)
        return Response(status_code=503)
    active += 1
    outcome = 'cancelled'
    try:
        await asyncio.sleep(.05)  # Explicit simulated I/O, no model or database.
        outcome = 'success'
        return {'fixture': True}
    finally:
        active -= 1
        metrics.finish(outcome, time.monotonic()-start)


@app.get('/metrics')
def scrape():
    return Response(metrics.exposition(), media_type='text/plain; version=0.0.4')
