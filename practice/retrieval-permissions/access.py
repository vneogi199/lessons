"""Small retrieval fixture with authorization before every content boundary."""
from dataclasses import dataclass
from hashlib import sha256
from copy import deepcopy
import math


@dataclass(frozen=True)
class Document:
    id: str
    tenant: str
    version: str
    text: str
    readers: frozenset[str]
    vector: tuple[float, ...]
    parent: str | None = None
    neighbors: tuple[str, ...] = ()
    deleted: bool = False


class Retrieval:
    def __init__(self, documents):
        rows = list(documents)
        if len(rows) > 100 or len({d.id for d in rows}) != len(rows):
            raise ValueError("bounded unique fixture documents required")
        self.documents = {d.id: d for d in rows}
        self.revision = 1
        self.cache = {}

    def replace(self, document):
        if document.id not in self.documents:
            raise ValueError("unknown document")
        self.documents[document.id] = document
        self.revision += 1
        self.cache.clear()

    def permitted(self, document, tenant, user):
        current = self.documents.get(document.id)
        return (current == document and not document.deleted and document.tenant == tenant
                and user in document.readers)

    def ask(self, tenant, user, question, *, mode, vector=(), rerank, generate):
        if (mode not in {"lexical", "vector", "graph"} or not isinstance(question, str)
                or not 1 <= len(question) <= 2000):
            raise ValueError("query contract")
        revision = self.revision
        key = (tenant, user, revision, mode, tuple(vector), sha256(question.encode()).hexdigest())
        if key in self.cache:
            answer, dependencies = self.cache[key]
            if all(self.permitted(d, tenant, user) for d in dependencies):
                return deepcopy(answer)
            del self.cache[key]
        permitted = [d for d in self.documents.values() if self.permitted(d, tenant, user)]
        words = set(question.casefold().split())
        lexical = lambda d: len(words & set(d.text.casefold().split()))
        if mode == "vector":
            if not vector or any(not math.isfinite(x) for x in vector):
                raise ValueError("query vector")
            def similarity(doc):
                if len(doc.vector) != len(vector) or any(not math.isfinite(x) for x in doc.vector):
                    raise ValueError("index vector contract")
                norm = math.sqrt(sum(x*x for x in vector) * sum(x*x for x in doc.vector))
                return sum(a*b for a, b in zip(vector, doc.vector)) / norm if norm else 0
            ranked = sorted(permitted, key=lambda d: (-similarity(d), d.id))[:3]
        else:
            ranked = sorted((d for d in permitted if lexical(d)), key=lambda d: (-lexical(d), d.id))[:3]
        if mode == "graph":
            # One hop only. Edges do not confer permission to read their targets.
            for doc in tuple(ranked):
                for neighbor in doc.neighbors[:8]:
                    candidate = self.documents.get(neighbor)
                    if candidate and self.permitted(candidate, tenant, user) and candidate not in ranked:
                        ranked.append(candidate)
        for doc in tuple(ranked):
            if doc.parent:
                parent = self.documents.get(doc.parent)
                if parent and self.permitted(parent, tenant, user) and parent not in ranked:
                    ranked.append(parent)
        ranked = ranked[:8]
        if not ranked:
            return {"status": "insufficient_evidence", "answer": None}
        if sum(len(d.text) for d in ranked) > 20_000:
            raise ValueError("context bound")
        if self.revision != revision or not all(self.permitted(d, tenant, user) for d in ranked):
            raise PermissionError("permissions changed before reranking")
        order = rerank(question, tuple(ranked))
        by_id = {d.id: d for d in ranked}
        if (not isinstance(order, tuple) or len(order) > len(ranked)
                or any(not isinstance(i, str) for i in order)
                or len(set(order)) != len(order) or not set(order) <= set(by_id)):
            raise ValueError("reranker contract")
        selected = tuple(by_id[i] for i in order)
        if self.revision != revision or not all(self.permitted(d, tenant, user) for d in selected):
            raise PermissionError("permissions changed before generation")
        if not selected:
            return {"status": "insufficient_evidence", "answer": None}
        text = generate(question, selected)
        if not isinstance(text, str) or len(text) > 8000:
            raise ValueError("generator contract")
        if self.revision != revision or not all(self.permitted(d, tenant, user) for d in ranked):
            raise PermissionError("permissions changed before release")
        answer = {"status": "answer", "answer": text,
                  "sources": tuple((d.id, d.version) for d in selected)}
        if len(self.cache) >= 100:
            self.cache.clear()  # ponytail: bounded fixture cache; use a measured eviction policy at scale.
        self.cache[key] = (deepcopy(answer), tuple(ranked))
        return answer
