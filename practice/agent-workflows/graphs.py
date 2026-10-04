"""LangGraph supervisor and bounded dynamic worker subgraph."""
import asyncio
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from pydantic import BaseModel, ConfigDict, Field


def merge(left, right):
    result = dict(left)
    for key, value in right.items():
        if key in result and result[key] != value:
            raise ValueError("conflicting_work_result")
        result[key] = value
    return result


class Work(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    id: str = Field(pattern=r"^[a-z0-9_-]{1,32}$")
    kind: str
    source: str = Field(min_length=1, max_length=64)


class State(TypedDict, total=False):
    allowed: bool
    items: list[dict]
    results: Annotated[dict, merge]
    decision: str


def build_graph(workers, allowed_sources):
    # Fixed adapter registry is supplied by trusted application code.
    def supervisor(state):
        if state.get("allowed") is not True:
            return {"decision": "denied"}
        raw = state.get("items")
        if not isinstance(raw, list) or not 1 <= len(raw) <= 8:
            raise ValueError("invalid_fanout")
        items = [Work.model_validate(item) for item in raw]
        if len({item.id for item in items}) != len(items):
            raise ValueError("duplicate_work_id")
        if any(item.kind not in {"evidence", "policy"} or item.kind not in workers
               or item.source not in allowed_sources for item in items):
            raise ValueError("work_forbidden")
        return {"decision": "running"}

    async def work(state):
        item = Work.model_validate(state["item"])
        # Recheck at the worker boundary, not only at dispatch.
        if item.source not in allowed_sources or item.kind not in {"evidence", "policy"}:
            raise ValueError("work_forbidden")
        try:
            value = await asyncio.wait_for(workers[item.kind](item.source), 2)
            if (not isinstance(value, dict) or set(value) != {"claim", "value", "source_version"}
                    or any(not isinstance(v, str) or not 1 <= len(v) <= 300 for v in value.values())):
                raise ValueError("invalid_worker_result")
            result = {"status": "ok", "source": item.source, "kind": item.kind, **value}
        except asyncio.TimeoutError:
            result = {"status": "timeout", "source": item.source, "kind": item.kind}
        except Exception:
            result = {"status": "failed", "source": item.source, "kind": item.kind}
        return {"results": {item.id: result}}

    def joined(state):
        results = state["results"]
        expected = {item["id"] for item in state["items"]}
        if set(results) != expected or any(result["status"] != "ok" for result in results.values()):
            return {"decision": "incomplete_review"}
        claims = {}
        for result in results.values():
            key = result["claim"]
            if key in claims and claims[key] != result["value"]:
                return {"decision": "conflicting_evidence"}
            claims[key] = result["value"]
        return {"decision": "ready_for_human"}

    child = StateGraph(State)
    child.add_node("worker", work)
    child.add_node("join", joined)
    child.add_conditional_edges(START, lambda state: [Send("worker", {"item": item})
                                                     for item in state["items"]], ["worker"])
    child.add_edge("worker", "join")
    child.add_edge("join", END)
    parent = StateGraph(State)
    parent.add_node("supervisor", supervisor)
    parent.add_node("review", child.compile())
    parent.add_edge(START, "supervisor")
    parent.add_conditional_edges("supervisor", lambda state: (
        "review" if state["decision"] == "running" else END), ["review", END])
    parent.add_edge("review", END)
    return parent.compile()


async def run_review(workers, allowed_sources, items, allowed):
    graph = build_graph(workers, allowed_sources)
    return await asyncio.wait_for(graph.ainvoke(
        {"allowed": allowed, "items": items, "results": {}},
        config={"recursion_limit": 12, "max_concurrency": 2}), 10)
