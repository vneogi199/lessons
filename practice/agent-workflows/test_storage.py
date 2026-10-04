from concurrent.futures import ThreadPoolExecutor
import pytest
from approval import Approvals, payload_hash
from memory import Memory


def test_approval_binding_expiry_replay_and_revocation(tmp_path):
    clock = [100]
    store = Approvals(str(tmp_path / "approval.sqlite"), clock=lambda: clock[0])
    token = store.issue_session("reviewer", "a", True)
    other = store.issue_session("other", "b", True)
    viewer = store.issue_session("viewer", "a", False)
    payload = {"project": "SAFE", "source_version": "v1", "summary": "Synthetic gap"}
    item = store.propose("a", payload)
    for invalid in (other, viewer, "invalid-token-value-is-long-enough"):
        with pytest.raises(PermissionError):
            store.decide(invalid, item["id"], item["hash"], True)
    with pytest.raises(PermissionError):
        store.decide(token, item["id"], payload_hash({**payload, "project": "OTHER"})[0], True)
    assert store.decide(token, item["id"], item["hash"], True) == "approved"
    assert store.decide(token, item["id"], item["hash"], True) == "approved"
    with pytest.raises(ValueError):
        store.decide(token, item["id"], item["hash"], False)
    result = store.claim_resume(token, item["id"], payload)
    assert result["payload"] == payload
    with pytest.raises(ValueError):
        store.claim_resume(token, item["id"], payload)
    new = store.propose("a", payload, ttl=1)
    clock[0] += 2
    with pytest.raises(PermissionError):
        store.decide(token, new["id"], new["hash"], True)
    store.revoke(token)
    with pytest.raises(PermissionError):
        store.claim_resume(token, item["id"], payload)


def test_conflicting_decisions_serialize(tmp_path):
    store = Approvals(str(tmp_path / "approval.sqlite"))
    token = store.issue_session("reviewer", "a", True)
    item = store.propose("a", {"version": 1})
    def decide(choice):
        try:
            return store.decide(token, item["id"], item["hash"], choice)
        except ValueError:
            return "conflict"
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(decide, (True, False)))
    assert results.count("conflict") == 1


def test_semantic_memory_scope_versions_consent_expiry_and_delete(tmp_path):
    clock = [100]
    encoder = lambda text: [1.0, 0.0] if "limit" in text else [0.0, 1.0]
    memory = Memory(str(tmp_path / "memory.sqlite"), encoder, "synthetic-v1-cosine", 2,
                    clock=lambda: clock[0])
    memory.put("a", "one", "limit", 1, "policy", "v1", "limit 10", 10, True)
    assert memory.search("a", "one", "limit", {"policy": "v1"})[0]["text"] == "limit 10"
    assert memory.search("b", "one", "limit", {"policy": "v1"}) == []
    assert memory.search("a", "two", "limit", {"policy": "v1"}) == []
    assert memory.search("a", "one", "limit", {"policy": "v2"}) == []
    memory.put("a", "one", "limit", 2, "policy", "v2", "limit 20", 10, True)
    assert memory.search("a", "one", "limit", {"policy": "v2"})[0]["revision"] == 2
    memory.forget("a", "one", "limit")
    assert memory.search("a", "one", "limit", {"policy": "v2"}) == []
    with pytest.raises(ValueError):
        memory.put("a", "one", "limit", 1, "policy", "v1", "limit 10", 10, True)
    with pytest.raises(ValueError):
        memory.put("a", "one", "new", 1, "policy", "v2", "limit 20", 10, False)
    memory.put("a", "one", "expiring", 1, "policy", "v2", "limit 20", 1, True)
    clock[0] += 2
    assert memory.search("a", "one", "limit", {"policy": "v2"}) == []
