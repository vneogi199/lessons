import asyncio
import json
import time

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from starlette.testclient import TestClient

from mcp_server import Boundary, Verifier, build


@pytest.fixture
def identity():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    resource, issuer = "https://mcp.example.test/mcp", "https://auth.example.test"
    member = {"tenant": "demo", "actor": "alice", "project": "LAB",
              "scopes": ["mcp:access", "jira:read", "jira:create", "jira:reconcile"]}
    verifier = Verifier(issuer, resource, {"fixture": key.public_key()}, {("alice", "client"): member})
    def token(**changes):
        now = int(time.time())
        claims = {"iss": issuer, "aud": resource, "sub": "alice", "client_id": "client",
                  "iat": now, "nbf": now, "exp": now+300, "scope": " ".join(member["scopes"])}
        return jwt.encode({**claims, **changes}, key, algorithm="RS256",
                          headers={"kid": "fixture", "typ": "at+jwt"})
    return verifier, token


def test_token_audience_expiry_scope_and_rotation(identity):
    verifier, token = identity
    assert asyncio.run(verifier.verify_token(token())) is not None
    for invalid in (token(aud="https://other.example.test/mcp"), token(exp=1), token(scope="jira:create")):
        assert asyncio.run(verifier.verify_token(invalid)) is None
    verifier.keys.clear()
    assert asyncio.run(verifier.verify_token(token())) is None


def test_real_protocol_and_no_unauthorized_create(tmp_path, identity):
    verifier, token = identity
    sent = []
    def handle(request):
        sent.append(request)
        return httpx.Response(201, json={"key": "LAB-1"})
    http = httpx.AsyncClient(transport=httpx.MockTransport(handle))
    config = {"site": "https://synthetic.atlassian.net", "project": "LAB",
              "issue_type": "10001", "bot_account": "bot"}
    boundary = Boundary(tmp_path / "ledger.sqlite", http, config, verifier)
    app = build(boundary, verifier)
    headers = {"Authorization": "Bearer " + token(), "Accept": "application/json, text/event-stream",
               "MCP-Protocol-Version": "2025-06-18"}
    with TestClient(app, base_url="https://mcp.example.test") as client:
        request = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
            "protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "fixture", "version": "1"}}}
        assert client.post("/mcp", json=request).status_code == 401
        assert "result" in client.post("/mcp", json=request, headers=headers).json()
        listed = client.post("/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"}).json()
        assert {tool["name"] for tool in listed["result"]["tools"]} == {
            "read_ticket", "create_approved_ticket", "reconcile_ticket"}
        proposal = boundary.propose("demo", "alice", "Synthetic review", "Review risk 125 USD")
        call = {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {
            "name": "create_approved_ticket", "arguments": {"operation": proposal["operation"]}}}
        denied = client.post("/mcp", json=call, headers=headers).json()
        assert "error" in denied or denied.get("result", {}).get("isError") is True
        assert not sent
        reviewer = boundary.approvals.issue_session("reviewer", "demo", True)
        boundary.approvals.decide(reviewer, proposal["id"], proposal["hash"], True)
        for _ in range(2):
            response = client.post("/mcp", json=call, headers=headers).json()
            assert "error" not in response and not response["result"].get("isError", False)
        assert len(sent) == 1
        assert set(json.loads(sent[0].content)["fields"]) == {"project", "issuetype", "summary", "description", "labels"}
    asyncio.run(http.aclose())


def test_changed_digest_and_wrong_owner(tmp_path, identity):
    verifier, token = identity
    http = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(500)))
    boundary = Boundary(tmp_path / "ledger.sqlite", http, {"site": "https://synthetic.atlassian.net",
        "project": "LAB", "issue_type": "10001", "bot_account": "bot"}, verifier)
    proposal = boundary.propose("demo", "alice", "Synthetic", "Detail")
    reviewer = boundary.approvals.issue_session("reviewer", "demo", True)
    boundary.approvals.decide(reviewer, proposal["id"], proposal["hash"], True)
    assert asyncio.run(boundary.approved("demo", "alice", proposal["operation"], "wrong")) is False
    with pytest.raises(PermissionError):
        boundary.lookup(proposal["operation"], "demo", "bob", require_approval=True)
    asyncio.run(http.aclose())
