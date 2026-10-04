"""Synthetic retrieval regression suite; no model calls, downloads or permanent DB."""
import json
from contextlib import closing
from pathlib import Path
import tempfile
import time
from app import Error, Store


def grade(store, case, result):
    """Check provenance independently of model narration; not semantic entailment."""
    citations = result.get("citations", [])
    ids = {c["document_id"] for c in citations}
    expected = set(case["expected_documents"])
    provenance = True
    keys = []
    with closing(store.connect()) as db:
        for citation in citations:
            keys.append(citation["key"])
            row = db.execute("""SELECT c.content,c.page,d.version,d.title FROM chunks c
                JOIN documents d ON c.tenant=d.tenant AND c.id=d.id
                WHERE c.tenant=? AND c.id=? AND c.ordinal=?""",
                (case["tenant"], citation["document_id"], citation["chunk"])).fetchone()
            provenance &= bool(row and tuple(row) == (citation["quote"], citation["page"],
                                                       citation["version"], citation["title"]))
    answer = result.get("answer", "").casefold()
    checks = {
        "status": result.get("status") == case["expected_status"],
        "required_documents": expected <= ids,
        "forbidden_documents": not ids.intersection(case["forbidden_documents"]),
        "citation_provenance": provenance and len(keys) == len(set(keys)),
        "abstention_has_no_citations": result.get("status") != "insufficient_evidence" or not citations,
        "answer_has_citations": result.get("status") not in {"evidence", "generated"} or bool(citations),
        "required_answer_terms": all(t.casefold() in answer for t in case.get("answer_contains", [])),
        "forbidden_answer_terms": all(t.casefold() not in answer for t in case.get("answer_excludes", [])),
        "expected_versions": all(c["version"] == case.get("expected_versions", {}).get(c["document_id"], c["version"])
                                 for c in citations),
    }
    return {"passed": all(checks.values()), "checks": checks,
            "document_recall_at_3": len(expected & ids) / len(expected) if expected else None}


def run_case(directory, fixtures, case, *, include_result=False):
    # Every case starts from the same baseline; mutations cannot leak between cases.
    store = Store(Path(directory) / (case["id"] + ".sqlite3"))
    for item in fixtures["documents"]:
        store.ingest(item["tenant"], item["document"])
    for operation in case.get("operations", []):
        if operation["action"] == "ingest":
            store.ingest(operation["tenant"], operation["document"])
        elif operation["action"] == "delete":
            store.delete(operation["tenant"], operation["id"])
        else:
            raise ValueError("unknown fixture operation")
    start = time.perf_counter()
    result = None
    try:
        result = store.ask(case["tenant"], case["question"])
        outcome = grade(store, case, result)
    except Error as exc:
        outcome = {"passed": False, "error": exc.code, "document_recall_at_3": None}
    return {"case": case["id"], "slice": case["slice"], **outcome,
            **({"result": result} if include_result else {}),
            "known_gap": case.get("known_gap"),
            "latency_ms": round((time.perf_counter() - start) * 1000, 3)}


def evaluate():
    fixtures = json.loads(Path(__file__).with_name("eval_cases.json").read_text())
    with tempfile.TemporaryDirectory() as directory:
        outcomes = [run_case(directory, fixtures, case) for case in fixtures["cases"]]
        slices = {}
        for outcome in outcomes:
            tally = slices.setdefault(outcome["slice"], {"passed": 0, "total": 0})
            tally["passed"] += outcome["passed"]
            tally["total"] += 1
        report = {"dataset_version": fixtures["version"], "mode": "lexical_extractive",
                  "cases": outcomes, "slices": slices,
                  "passed": sum(r["passed"] for r in outcomes), "total": len(outcomes),
                  "limits": "Synthetic regression and challenge cases, not held-out quality evidence. Known gaps still fail. Citation provenance is not claim entailment. No live generation or injection-robustness measurement."}
        print(json.dumps(report, indent=2))
        return all(r["passed"] for r in outcomes)


if __name__ == "__main__":
    raise SystemExit(0 if evaluate() else 1)
