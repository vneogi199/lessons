"""Synthetic word-budget exercise. Counts are NOT model tokens."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Turn:
    id: str
    messages: tuple[str, ...]
    call_ids: tuple[str, ...] = ()
    result_ids: tuple[str, ...] = ()

    def __post_init__(self):
        if len(set(self.call_ids)) != len(self.call_ids) or sorted(self.call_ids) != sorted(self.result_ids):
            raise ValueError("unpaired_tool_turn")
        if not self.messages:
            raise ValueError("empty_turn")


@dataclass(frozen=True)
class Fact:
    key: str
    revision: int
    value: str
    source: str


def latest_facts(facts):
    latest = {}
    for fact in facts:
        if fact.revision < 1 or not fact.source:
            raise ValueError("invalid_fact")
        old = latest.get(fact.key)
        if old and old.revision == fact.revision and old != fact:
            raise ValueError("conflicting_revision")
        if not old or fact.revision > old.revision:
            latest[fact.key] = fact
    return latest


def build_context(instructions, question, turns, facts, budget, mode, summary=()):
    if type(budget) is not int or budget <= 0:
        raise ValueError("invalid_budget")
    if mode not in {"full", "recent", "summary"}:
        raise ValueError("invalid_mode")
    if len({turn.id for turn in turns}) != len(turns):
        raise ValueError("duplicate_turn_id")
    current = latest_facts(facts)
    lines = [instructions, question]
    lines += [f"Fact {fact.key}={fact.value}; rev={fact.revision}; source={fact.source}"
              for _, fact in sorted(current.items())]
    if mode == "summary":
        # Summaries carry references to exact facts, not authority to invent new facts.
        for fact in summary:
            if current.get(fact.key) != fact:
                raise ValueError("unverified_or_stale_summary")
        lines += [f"Summary reference: {fact.key}@{fact.revision} from {fact.source}"
                  for fact in summary]
    cost = lambda values: sum(len(value.split()) for value in values)
    used = cost(lines)
    if used > budget:
        raise ValueError("required_context_exceeds_budget")
    selected = []
    candidates = turns if mode == "full" else reversed(turns)
    for turn in candidates:
        size = cost(turn.messages)
        if used + size > budget:
            if mode == "full":
                raise ValueError("full_history_exceeds_budget")
            break
        selected.append(turn)
        used += size
    if mode != "full":
        selected.reverse()
    return {"required": lines, "turns": selected, "word_cost": used,
            "omitted": [turn.id for turn in turns if turn not in selected]}
