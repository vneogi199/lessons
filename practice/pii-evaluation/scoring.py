"""Exact typed-span metrics and character-level redaction costs. No detector."""
from dataclasses import dataclass
from collections import defaultdict


@dataclass(frozen=True)
class Span:
    start: int
    end: int
    kind: str


@dataclass(frozen=True)
class Case:
    case_id: str
    language: str
    text: str
    gold: tuple[Span, ...]
    predicted: tuple[Span, ...]
    useful: tuple[Span, ...] = ()


def ratio(numerator, denominator):
    return numerator / denominator if denominator else None


def validate(case):
    if not case.case_id or not case.language or len(case.text) > 100_000:
        raise ValueError("invalid case metadata or text bound")
    for spans in (case.gold, case.predicted, case.useful):
        if len(spans) > 1000 or len(set(spans)) != len(spans):
            raise ValueError("duplicate or excessive spans")
        for span in spans:
            if (type(span.start) is not int or type(span.end) is not int
                    or not 0 <= span.start < span.end <= len(case.text)
                    or not isinstance(span.kind, str) or not span.kind):
                raise ValueError("invalid half-open Python character span")


def positions(spans):
    return {i for span in spans for i in range(span.start, span.end)}


def counts(cases, kind=None):
    tp = fp = fn = 0
    for case in cases:
        gold = {s for s in case.gold if kind is None or s.kind == kind}
        predicted = {s for s in case.predicted if kind is None or s.kind == kind}
        tp += len(gold & predicted)
        fp += len(predicted - gold)
        fn += len(gold - predicted)
    return {"tp": tp, "fp": fp, "fn": fn,
            "precision": ratio(tp, tp + fp), "recall": ratio(tp, tp + fn),
            "f1": ratio(2 * tp, 2 * tp + fp + fn)}


def score(cases):
    cases = list(cases)
    if len(cases) > 10_000 or len({c.case_id for c in cases}) != len(cases):
        raise ValueError("duplicate case IDs or excessive cases")
    languages = defaultdict(list)
    kinds = set()
    negative_chars = false_chars = missed_chars = sensitive_chars = 0
    useful_chars = removed_useful = 0
    for case in cases:
        validate(case)
        languages[case.language].append(case)
        kinds.update(s.kind for s in case.gold + case.predicted)
        gold, predicted, useful = map(positions, (case.gold, case.predicted, case.useful))
        negative_chars += len(case.text) - len(gold)
        false_chars += len(predicted - gold)
        sensitive_chars += len(gold)
        missed_chars += len(gold - predicted)
        useful_chars += len(useful)
        removed_useful += len(useful & predicted)
    return {
        "matching": "exact start/end/type; half-open Python Unicode offsets",
        "cases": len(cases), "entities": counts(cases),
        "by_type": {kind: counts(cases, kind) for kind in sorted(kinds)},
        "by_language": {lang: counts(rows) for lang, rows in sorted(languages.items())},
        "by_language_type": {
            lang: {kind: counts(rows, kind) for kind in sorted(kinds)}
            for lang, rows in sorted(languages.items())},
        "characters": {
            "false_redacted": false_chars, "non_sensitive": negative_chars,
            "false_positive_rate": ratio(false_chars, negative_chars),
            "missed_sensitive": missed_chars, "sensitive": sensitive_chars,
            "miss_rate": ratio(missed_chars, sensitive_chars),
            "useful_removed": removed_useful, "useful": useful_chars,
            "utility_loss": ratio(removed_useful, useful_chars)},
    }
