"""Offline scoring fixture: validates ranking mechanics, not model quality."""
from math import isfinite


def rerank(ids, scores):
    if len(ids) != len(scores) or len(set(ids)) != len(ids):
        raise ValueError("one score per unique candidate required")
    if any(not isfinite(score) for score in scores):
        raise ValueError("finite scores required")
    return [doc for doc, _ in sorted(zip(ids, scores), key=lambda pair: pair[1], reverse=True)]


def reciprocal_rank(ids, relevant):
    return next((1 / rank for rank, doc in enumerate(ids, 1) if doc in relevant), 0)


def main():
    ids, relevant = ["A", "B", "C"], {"B"}
    ranked = rerank(ids, [0.2, 2.1, -0.7])
    assert ranked == ["B", "A", "C"]
    assert reciprocal_rank(ids, relevant) == 0.5
    assert reciprocal_rank(ranked, relevant) == 1
    assert sum(doc in relevant for doc in ids[:2]) / 2 == 0.5
    assert sum(doc in relevant for doc in ranked[:2]) / 2 == 0.5
    assert reciprocal_rank(rerank(["A", "C"], [9, 8]), relevant) == 0
    assert reciprocal_rank(rerank(ids, [2, -1, 1]), relevant) == 1 / 3
    assert rerank(ids, [1, 1, 1]) == ids
    assert rerank([], []) == []
    for candidates, scores in [(["A"], []), (["A", "A"], [1, 2]), (["A"], [float("nan")]), (["A"], [float("inf")])]:
        try:
            rerank(candidates, scores)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid scoring result accepted")
    print("Reranking fixture passed: rank improvement, regression, missing candidates, ties and invalid scores.")


if __name__ == "__main__":
    main()
