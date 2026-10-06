import socket
from unittest.mock import patch

import pytest

from approval import Approvals
from semantic_kernel_lab import approve_local_proposal, build, review


async def fixture_planner(feedback):
    return {"steps": [
        {"id": "risk", "tool": "read_evidence", "source": "risk-v1"},
        {"id": "policy", "tool": "read_policy", "source": "policy-v1"}]}


def test_real_sdk_dispatch_without_network():
    import asyncio
    def denied(*args, **kwargs):
        raise AssertionError("network forbidden in offline fixture")
    with patch.object(socket.socket, "connect", denied), patch.object(socket.socket, "connect_ex", denied):
        permitted = lambda source: source in {"risk-v1", "policy-v1"}
        kernel = build(permitted)
        result = asyncio.run(review(kernel, fixture_planner, permitted))
        assert result["status"] == "complete"
        assert "125.00" in result["results"]["0:risk"]["text"]
        with pytest.raises(PermissionError):
            asyncio.run(review(kernel, fixture_planner, lambda source: False))


def test_exact_approval_cannot_be_changed(tmp_path):
    ledger = Approvals(tmp_path / "approval.sqlite")
    payload = {"kind": "synthetic-risk-review", "source": "risk-v1", "amount": "125.00"}
    item = ledger.propose("demo", payload)
    reviewer = ledger.issue_session("alice", "demo", True)
    with pytest.raises(ValueError):
        approve_local_proposal(ledger, reviewer, item["id"], payload)
    ledger.decide(reviewer, item["id"], item["hash"], True)
    with pytest.raises(PermissionError):
        approve_local_proposal(ledger, reviewer, item["id"], dict(payload, amount="999.00"))
    assert approve_local_proposal(ledger, reviewer, item["id"], payload)["payload"] == payload
    with pytest.raises(ValueError):
        approve_local_proposal(ledger, reviewer, item["id"], payload)
