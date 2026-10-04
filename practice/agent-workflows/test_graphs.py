import asyncio
import pytest
from graphs import merge, run_review


ITEMS = [{"id": "one", "kind": "evidence", "source": "doc-a"},
         {"id": "two", "kind": "policy", "source": "policy-a"}]


def test_nested_graph_parallel_join_and_denial():
    async def run():
        active, maximum = 0, 0
        async def read(source):
            nonlocal active, maximum
            active += 1
            maximum = max(maximum, active)
            await asyncio.sleep(0)
            active -= 1
            return {"claim": source, "value": "present", "source_version": "v1"}
        result = await run_review({"evidence": read, "policy": read}, {"doc-a", "policy-a"}, ITEMS, True)
        assert result["decision"] == "ready_for_human"
        assert set(result["results"]) == {"one", "two"}
        assert 1 <= maximum <= 2
        denied = await run_review({"evidence": read, "policy": read}, set(), ITEMS, False)
        assert denied["decision"] == "denied" and denied["results"] == {}
    asyncio.run(run())


def test_partial_failure_conflict_and_duplicate_items():
    async def run():
        async def evidence(source):
            return {"claim": "signed", "value": "yes", "source_version": "v1"}
        async def failed(source):
            raise RuntimeError("private diagnostic")
        workers = {"evidence": evidence, "policy": failed}
        result = await run_review(workers, {"doc-a", "policy-a"}, ITEMS, True)
        assert result["decision"] == "incomplete_review"
        async def disagree(source):
            return {"claim": "signed", "value": "no", "source_version": "v1"}
        workers["policy"] = disagree
        assert (await run_review(workers, {"doc-a", "policy-a"}, ITEMS, True))["decision"] == "conflicting_evidence"
        with pytest.raises(ValueError):
            await run_review(workers, {"doc-a"}, [ITEMS[0], ITEMS[0]], True)
    asyncio.run(run())


def test_merge_is_order_independent_and_rejects_conflict():
    a, b = {"a": {"status": "ok"}}, {"b": {"status": "failed"}}
    assert merge(a, b) == merge(b, a)
    assert merge(a, a) == a
    with pytest.raises(ValueError):
        merge(a, {"a": {"status": "failed"}})
