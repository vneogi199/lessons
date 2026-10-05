"""Explicit loopback-only synthetic launcher; never import in a deployed service."""
import argparse
import os
from pathlib import Path
import uvicorn
from service import create_app


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('database', type=Path)
    parser.add_argument('--telemetry', action='store_true', help='Send traces to a pre-existing loopback collector')
    args = parser.parse_args()
    os.umask(0o077)
    application = create_app(str(args.database))
    trace_provider = None
    if args.telemetry:
        from telemetry import instrument
        from tracing import provider
        trace_provider = provider()
        instrument(application, trace_provider.get_tracer('auditmesh'))
    # Display only in the operator's private terminal. Never enable shared logging here.
    session = application.state.service.ledger.issue_session('synthetic-reviewer', 'tenant-a', True)
    print('Private five-minute synthetic session (do not share):', session)
    try:
        uvicorn.run(application, host='127.0.0.1', port=8000, access_log=False)
    finally:
        if trace_provider:
            trace_provider.shutdown()
