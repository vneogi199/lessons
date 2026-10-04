"""Cohere reranker: candidates must already be authorized for this request."""
import math
import httpx
from retry import Failure, Retryable, RetryPolicy, retry_read
from structured import decode


async def rerank(client, key, model, query, candidates, allowed_ids, *,
                 policy=RetryPolicy(), **retry_options):
    if not isinstance(query, str) or not 1 <= len(query) <= 2000 or len(candidates) > 50:
        raise Failure("invalid_rerank_input")
    ids = [candidate["id"] for candidate in candidates]
    if len(set(ids)) != len(ids) or not set(ids) <= set(allowed_ids):
        raise Failure("candidate_scope")
    if any(not isinstance(c.get("text"), str) or not 1 <= len(c["text"]) <= 4000 for c in candidates):
        raise Failure("invalid_candidate_text")
    if sum(len(c["text"]) for c in candidates) > 50_000:
        raise Failure("candidate_budget")
    if not candidates:
        return {"mode": "empty", "items": [], "reason": None}
    top_n = min(5, len(candidates))

    async def operation(attempt, previous):
        try:
            async with client.stream("POST", "https://api.cohere.com/v2/rerank",
                    headers={"Authorization": "Bearer " + key},
                    json={"model": model, "query": query,
                          "documents": [c["text"] for c in candidates],
                          "top_n": top_n, "max_tokens_per_doc": 4096},
                    timeout=httpx.Timeout(4, connect=2), follow_redirects=False) as response:
                if response.status_code in {429, 500, 502, 503, 504}:
                    raise Retryable("reranker_transient", response.headers.get("Retry-After"))
                if response.status_code != 200:
                    raise Failure("reranker_rejected")
                raw = bytearray()
                async for block in response.aiter_bytes(chunk_size=4096):
                    if len(raw) + len(block) > 50_000:
                        raise Failure("reranker_body_limit")
                    raw.extend(block)
                try:
                    results = decode(raw)["results"]
                    if not isinstance(results, list) or len(results) != top_n:
                        raise ValueError("count")
                    seen, output = set(), []
                    for hit in results:
                        index, score = hit["index"], hit["relevance_score"]
                        if (type(index) is not int or not 0 <= index < len(candidates)
                                or index in seen or type(score) not in (int, float)
                                or not math.isfinite(score) or not 0 <= score <= 1):
                            raise ValueError("invalid_hit")
                        seen.add(index)
                        output.append({**candidates[index], "rerank_score": score})
                    return output
                except (KeyError, TypeError, ValueError, RecursionError) as exc:
                    raise Failure("malformed_reranker_result") from exc
        except httpx.TransportError as exc:
            raise Retryable("reranker_transport") from exc
    try:
        items = await retry_read(operation, policy, **retry_options)
        return {"mode": "reranked", "items": items, "reason": None}
    except Failure as exc:
        return {"mode": "fallback", "items": candidates[:top_n], "reason": exc.code}
