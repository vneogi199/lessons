"""Read-only agent mechanics; planners and workers are injected async adapters."""
import asyncio
import json
import time
from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Step(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    id: str = Field(pattern=r"^[a-z0-9_-]{1,32}$")
    tool: Literal["read_evidence", "read_policy"]
    source: str = Field(min_length=1, max_length=64)


class Plan(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    steps: list[Step] = Field(min_length=1, max_length=6)


@dataclass
class Guard:
    seconds: float = 10
    max_steps: int = 8
    max_cost_units: int = 20
    clock: object = time.monotonic
    seen: dict = field(default_factory=dict)
    steps: int = 0
    reserved: int = 0
    no_progress: int = 0
    progress_versions: set = field(default_factory=set)

    def __post_init__(self):
        if self.seconds <= 0 or self.max_steps < 1 or self.max_cost_units < 1:
            raise ValueError("invalid_budget")
        self.deadline = self.clock() + self.seconds

    def admit(self, tool, args, evidence_version, units=1, allow_poll=False):
        if tool not in {"read_evidence", "read_policy"}:
            raise ValueError("write_or_unknown_tool_blocked")
        if self.clock() >= self.deadline or self.steps >= self.max_steps:
            raise ValueError("time_or_step_budget")
        if type(units) is not int or units < 1 or self.reserved + units > self.max_cost_units:
            raise ValueError("cost_budget")
        key = json.dumps([tool, args, evidence_version], sort_keys=True, allow_nan=False)
        count = self.seen.get(key, 0)
        if count >= (2 if allow_poll else 1):
            raise ValueError("repeated_action_or_cycle")
        if self.no_progress >= 3:
            raise ValueError("no_progress")
        self.seen[key] = count + 1
        self.steps += 1
        self.reserved += units

    def observe(self, authoritative_version):
        if authoritative_version and authoritative_version not in self.progress_versions:
            self.progress_versions.add(authoritative_version)
            self.no_progress = 0
        else:
            self.no_progress += 1


async def plan_execute(planner, execute, allowed_sources, *, seconds=10):
    """At most one replan, only after missing/stale read evidence."""
    async def run():
        results, feedback, executed = {}, [], set()
        for revision in range(2):
            plan = Plan.model_validate(await planner(feedback))
            ids = [step.id for step in plan.steps]
            if len(ids) != len(set(ids)):
                raise ValueError("duplicate_step_id")
            for step in plan.steps:
                if step.source not in allowed_sources:
                    raise ValueError("source_forbidden")
                identity = (step.tool, step.source)
                if identity in executed:
                    raise ValueError("replan_repeated_completed_read")
                outcome = await execute(step)
                if not isinstance(outcome, dict) or outcome.get("status") not in {"ok", "missing", "stale"}:
                    raise ValueError("invalid_executor_result")
                if outcome["status"] == "ok":
                    executed.add(identity)
                results[f"{revision}:{step.id}"] = outcome
            feedback = [result["status"] for result in results.values() if result["status"] != "ok"]
            if not feedback:
                return {"status": "complete", "results": results, "plans": revision + 1}
            # One new plan may use another source. Previous failure evidence stays visible.
            if revision == 1:
                return {"status": "review", "results": results, "plans": 2}
        raise AssertionError("unreachable")
    return await asyncio.wait_for(run(), seconds)


async def correct(generate, validate, question, max_attempts=3, seconds=10):
    if type(max_attempts) is not int or not 1 <= max_attempts <= 5:
        raise ValueError("invalid_attempt_budget")

    async def run():
        seen, feedback = set(), []
        for attempt in range(1, max_attempts + 1):
            draft = await generate(question, feedback)
            if not isinstance(draft, str) or len(draft) > 4000:
                raise ValueError("invalid_draft")
            if draft in seen:
                return {"status": "stalled", "attempts": attempt, "answer": None}
            seen.add(draft)
            feedback = validate(draft)
            if not feedback:
                return {"status": "accepted", "attempts": attempt, "answer": draft}
        return {"status": "review", "attempts": max_attempts, "answer": None}
    return await asyncio.wait_for(run(), seconds)


async def compare_read_strategies(execute):
    """Same fixed synthetic source choices; no model-performance claim."""
    fixed_steps = [Step(id="e", tool="read_evidence", source="evidence"),
                   Step(id="p", tool="read_policy", source="primary")]
    fixed = [await execute(step) for step in fixed_steps]

    async def planner(feedback):
        if feedback:
            return {"steps": [{"id": "fallback", "tool": "read_policy", "source": "fallback"}]}
        return {"steps": [step.model_dump() for step in fixed_steps]}
    planned = await plan_execute(planner, execute, {"evidence", "primary", "fallback"})
    guard, observations = Guard(), []
    # Deterministic ReAct policy: observe primary before choosing fallback.
    for source in ("evidence", "primary", "fallback"):
        if source == "fallback" and observations[-1]["status"] == "ok":
            break
        tool = "read_evidence" if source == "evidence" else "read_policy"
        guard.admit(tool, {"source": source}, "fixture-v1")
        result = await execute(Step(id=source, tool=tool, source=source))
        observations.append(result)
        guard.observe(source if result["status"] == "ok" else None)
    return {"fixed": fixed, "planned": planned, "react": observations}
