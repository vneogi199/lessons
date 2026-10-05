"""Explicit loopback-only synthetic launcher; never import in a deployed service."""
import argparse
import os
from pathlib import Path
import uvicorn
from service import create_app


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('database', type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    application = create_app(str(args.database))
    # Display only in the operator's private terminal. Never enable shared logging here.
    session = application.state.service.ledger.issue_session('synthetic-reviewer', 'tenant-a', True)
    print('Private five-minute synthetic session (do not share):', session)
    uvicorn.run(application, host='127.0.0.1', port=8000, access_log=False)
