"""Source-bound synthetic candidates. Human review is mandatory before export."""
from dataclasses import dataclass, asdict
import hashlib
import json


@dataclass(frozen=True)
class SourceFact:
    family: str
    document_id: str
    version: str
    tenant: str
    text: str
    start: int
    end: int
    question: str

    def validate(self):
        if (not all((self.family, self.document_id, self.version, self.tenant, self.question))
                or len(self.text) > 50_000 or len(self.question) > 2000
                or type(self.start) is not int or type(self.end) is not int
                or not 0 <= self.start < self.end <= len(self.text)):
            raise ValueError("invalid source fact")


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(",", ":")).encode()).hexdigest()


def family_split(family, split_version="family-split-v1"):
    bucket = int(hashlib.sha256(f"{split_version}:{family}".encode()).hexdigest()[:8], 16) % 10
    return "train" if bucket < 6 else "development" if bucket < 8 else "holdout"


def candidates(fact, *, changed_answer, forbidden_tenant):
    fact.validate()
    quote = fact.text[fact.start:fact.end]
    if not changed_answer or changed_answer == quote or forbidden_tenant == fact.tenant:
        raise ValueError("distinct counterfactual and forbidden tenant required")
    source = {"document_id": fact.document_id, "version": fact.version,
              "content_sha256": hashlib.sha256(fact.text.encode()).hexdigest(),
              "start": fact.start, "end": fact.end, "quote": quote, "tenant": fact.tenant}
    specs = [
        ("answerable", fact.question, quote, [source], fact.tenant),
        ("unanswerable", fact.question + " What exception applies on a public holiday?",
         None, [source], fact.tenant),
        ("contradictory", fact.question, None, [source, {**source,
            "document_id": fact.document_id + "-counterfactual", "version": "synthetic-conflict",
            "quote": changed_answer, "start": 0, "end": len(changed_answer),
            "content_sha256": hashlib.sha256(changed_answer.encode()).hexdigest()}], fact.tenant),
        ("stale", fact.question, changed_answer, [source, {**source,
            "version": "synthetic-new", "quote": changed_answer, "start": 0,
            "end": len(changed_answer), "content_sha256": hashlib.sha256(changed_answer.encode()).hexdigest()}], fact.tenant),
        ("forbidden", fact.question, None, [source], forbidden_tenant),
    ]
    result = []
    for kind, question, answer, sources, tenant in specs:
        row = {"family": fact.family, "split": family_split(fact.family), "slice": kind,
               "question": question, "reference": answer, "sources": sources,
               "request_tenant": tenant, "synthetic": True,
               "source_fact_hash": digest(asdict(fact)), "builder": "source-candidates-v1"}
        row["id"] = digest(row)
        result.append(row)
    return result


def reviewed_export(rows, reviews, *, dataset_version):
    if not dataset_version or not rows or len({r["id"] for r in rows}) != len(rows):
        raise ValueError("version and unique candidates required")
    accepted = []
    for row in rows:
        if row["id"] != digest({k: v for k, v in row.items() if k != "id"}):
            raise ValueError("candidate changed after generation")
        review = reviews.get(row["id"], {})
        if (review.get("approved") is not True or not review.get("reviewer")
                or not review.get("answerability_checked") or not review.get("permissions_checked")
                or not review.get("source_checked")):
            raise ValueError("human review incomplete")
        accepted.append({**row, "review": review})
    body = {"version": dataset_version, "cases": accepted}
    return {**body, "artifact_sha256": digest(body)}
