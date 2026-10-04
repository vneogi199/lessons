"""Buffered release pipeline with injected, asynchronous boundary adapters."""
import asyncio
from dataclasses import dataclass
from time import monotonic


@dataclass(frozen=True)
class Identity:
    tenant: str
    user: str


@dataclass(frozen=True)
class Document:
    document_id: str
    version: str
    tenant: str
    text: str


@dataclass(frozen=True)
class Answer:
    text: str
    citations: tuple[tuple[str, str], ...]


async def respond(identity, question, *, authorize, redact, retrieve, allowed,
                  generate, scan_output, total_seconds=10, clock=monotonic):
    """No partial model bytes leave this function. No irreversible tools."""
    if (not isinstance(identity, Identity) or not identity.tenant or not identity.user
            or not isinstance(question, str) or not 1 <= len(question) <= 4000
            or not 0 < total_seconds <= 30):
        return {"status": "invalid_input", "answer": None, "stages": []}
    deadline = clock() + total_seconds
    stages = []

    async def stage(name, operation, *args):
        remaining = deadline - clock()
        if remaining <= 0:
            raise TimeoutError("deadline")
        result = await asyncio.wait_for(operation(*args), timeout=remaining)
        stages.append(name)
        return result

    try:
        if await stage("authorize", authorize, identity) is not True:
            return {"status": "denied", "answer": None, "stages": stages}
        safe_question = await stage("redact", redact, question, identity)
        if not isinstance(safe_question, str) or not 1 <= len(safe_question) <= 4000:
            raise ValueError("redaction contract")
        docs = await stage("retrieve", retrieve, identity, safe_question)
        if (not isinstance(docs, tuple) or len(docs) > 8
                or any(not isinstance(d, Document) or not d.document_id or not d.version
                       or not isinstance(d.text, str) for d in docs)
                or sum(len(d.text) for d in docs) > 20_000
                or len({d.document_id for d in docs}) != len(docs)):
            raise ValueError("retrieval contract")
        for doc in docs:
            if doc.tenant != identity.tenant or await stage("source_permission", allowed, identity, doc) is not True:
                return {"status": "denied", "answer": None, "stages": stages}
        if not docs:
            return {"status": "insufficient_evidence", "answer": None, "stages": stages}
        # Redact source text before exposing it to a generator or remote model.
        safe_docs = []
        for doc in docs:
            safe_text = await stage("source_redact", redact, doc.text, identity)
            if not isinstance(safe_text, str) or len(safe_text) > 20_000:
                raise ValueError("source redaction contract")
            safe_docs.append(Document(doc.document_id, doc.version, doc.tenant, safe_text))
        if sum(len(doc.text) for doc in safe_docs) > 20_000:
            raise ValueError("redacted context budget")
        answer = await stage("generate", generate, safe_question, tuple(safe_docs))
        if (not isinstance(answer, Answer) or not isinstance(answer.text, str)
                or not 1 <= len(answer.text) <= 8000 or not isinstance(answer.citations, tuple)
                or not answer.citations or len(answer.citations) > 8
                or any(not isinstance(c, tuple) or len(c) != 2
                       or any(not isinstance(v, str) for v in c) for c in answer.citations)):
            raise ValueError("answer contract")
        references = {(d.document_id, d.version) for d in docs}
        if len(set(answer.citations)) != len(answer.citations) or not set(answer.citations) <= references:
            raise ValueError("citation contract")
        if await stage("output_scan", scan_output, identity, answer) is not True:
            return {"status": "review_required", "answer": None, "stages": stages}
        if await stage("reauthorize", authorize, identity) is not True:
            return {"status": "denied", "answer": None, "stages": stages}
        for doc in docs:
            if await stage("source_recheck", allowed, identity, doc) is not True:
                return {"status": "denied", "answer": None, "stages": stages}
        if clock() >= deadline:
            raise TimeoutError("deadline")
        return {"status": "released", "answer": answer, "stages": stages}
    except asyncio.CancelledError:
        raise
    except Exception:
        # Never put exception text, source text or credentials in public status.
        return {"status": "review_required", "answer": None, "stages": stages}
