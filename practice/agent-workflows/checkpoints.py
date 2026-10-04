"""Durable LangGraph checkpoint and idempotent local-effect exercise."""
import hashlib
import json
import sqlite3
from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt


def thread_config(tenant, run_id):
    # Both values must be selected/authorized by the server.
    key = hashlib.sha256(json.dumps([tenant, run_id]).encode()).hexdigest()
    return {"configurable": {"thread_id": key}}


class ReviewState(TypedDict, total=False):
    schema_version: int
    tenant: str
    operation: str
    approved: bool
    completed: bool


def effect_once(database, tenant, operation):
    """Atomic local effect ledger, not a guarantee for a remote ticket API."""
    db = sqlite3.connect(database, timeout=1)
    try:
        with db:
            db.execute("CREATE TABLE IF NOT EXISTS effects (tenant TEXT, operation TEXT, "
                       "PRIMARY KEY(tenant, operation))")
            db.execute("INSERT OR IGNORE INTO effects VALUES (?,?)", (tenant, operation))
    finally:
        db.close()


def persistent_graph(saver, database, expected_tenant, crash_after_effect=False):
    def check(state):
        if state.get("schema_version") != 1 or state.get("tenant") != expected_tenant:
            raise ValueError("checkpoint_scope_or_version")

    def approval(state):
        check(state)
        # No effects before interrupt: this node can restart from its beginning.
        decision = interrupt({"operation": state["operation"], "schema_version": 1})
        if type(decision) is not bool:
            raise ValueError("explicit_boolean_required")
        return {"approved": decision}

    def apply(state):
        check(state)
        effect_once(database, expected_tenant, state["operation"])
        if crash_after_effect:
            raise RuntimeError("synthetic_crash_after_local_commit")
        return {"completed": True}

    builder = StateGraph(ReviewState)
    builder.add_node("approval", approval)
    builder.add_node("apply", apply)
    builder.add_edge(START, "approval")
    builder.add_conditional_edges("approval", lambda state: "apply" if state["approved"] else END,
                                  ["apply", END])
    builder.add_edge("apply", END)
    return builder.compile(checkpointer=saver)
