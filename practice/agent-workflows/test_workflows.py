import asyncio
import pytest
from workflows import Guard, compare_read_strategies, correct, plan_execute


def test_plans_reject_writes_and_duplicate_steps():
    async def run():
        async def planner(feedback):
            return {"steps": [{"id": "one", "tool": "place_trade", "source": "a"}]}
        async def execute(step):
            raise AssertionError("must reject before execution")
        with pytest.raises(ValueError):
            await plan_execute(planner, execute, {"a"})
    asyncio.run(run())


def test_one_replan_and_failure_visibility():
    async def run():
        plans = []
        async def planner(feedback):
            plans.append(feedback)
            return {"steps": [{"id": "one", "tool": "read_policy",
                               "source": "fallback" if feedback else "primary"}]}
        async def execute(step):
            return {"status": "missing" if step.source == "primary" else "ok"}
        result = await plan_execute(planner, execute, {"primary", "fallback"})
        assert len(plans) == 2 and result["status"] == "review"
        assert len(result["results"]) == 2  # Missing evidence never silently vanishes.
    asyncio.run(run())


def test_cycles_changed_state_polling_and_budgets():
    guard = Guard()
    guard.admit("read_policy", {"id": "a"}, "v1")
    guard.admit("read_policy", {"id": "b"}, "v1")
    with pytest.raises(ValueError, match="cycle"):
        guard.admit("read_policy", {"id": "a"}, "v1")
    guard.admit("read_policy", {"id": "a"}, "v2")
    poll = Guard()
    for _ in range(2):
        poll.admit("read_evidence", {"id": "a"}, "v1", allow_poll=True)
    with pytest.raises(ValueError):
        poll.admit("read_evidence", {"id": "a"}, "v1", allow_poll=True)
    with pytest.raises(ValueError, match="blocked"):
        guard.admit("create_ticket", {}, "v1")
    with pytest.raises(ValueError, match="cost_budget"):
        Guard(max_cost_units=1).admit("read_policy", {}, "v1", units=2)
    stalled = Guard()
    for _ in range(3):
        stalled.observe(None)
    with pytest.raises(ValueError, match="no_progress"):
        stalled.admit("read_policy", {}, "v1")
    stalled.observe("new-authoritative-version")
    stalled.admit("read_policy", {}, "v2")
    clock = [0]
    timed = Guard(seconds=1, clock=lambda: clock[0])
    clock[0] = 2
    with pytest.raises(ValueError, match="time_or_step"):
        timed.admit("read_policy", {}, "v1")


def test_self_correction_against_baseline_and_stall():
    async def run():
        replies = iter(["no source", "answer [policy-v2]"])
        async def generate(question, feedback):
            return next(replies)
        validate = lambda draft: [] if "[policy-v2]" in draft else ["missing_required_citation"]
        assert validate("no source")
        result = await correct(generate, validate, "question")
        assert result["status"] == "accepted" and result["attempts"] == 2
        async def stuck(question, feedback):
            return "no source"
        assert (await correct(stuck, validate, "q"))["status"] == "stalled"
    asyncio.run(run())


def test_strategy_comparison_uses_same_failure_case():
    async def execute(step):
        return {"status": "missing" if step.source == "primary" else "ok"}
    result = asyncio.run(compare_read_strategies(execute))
    assert len(result["fixed"]) == 2
    assert result["planned"]["plans"] == 2
    assert len(result["react"]) == 3
    assert all(result[key][1]["status"] == "missing" for key in ("fixed", "react"))
