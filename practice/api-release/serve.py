"""Deployment exercise only: all RFQ operations still fail authentication."""
from app import create_app

app = create_app('/tmp/release-demo.sqlite')


@app.get('/healthz', include_in_schema=False)
def health():
    return {'status': 'ready', 'mode': 'authentication-disabled-demo'}
