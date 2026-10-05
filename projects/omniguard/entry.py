"""Fail-closed container entry point; no public session minting endpoint."""
from service import create_app

app = create_app('/tmp/omniguard-demo.db')
