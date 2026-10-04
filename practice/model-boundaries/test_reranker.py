import asyncio
import httpx
import pytest
from reranker import rerank
from retry import Failure, RetryPolicy

CANDIDATES = [{"id": "a", "text": "same text", "source": "page-1"},
              {"id": "b", "text": "same text", "source": "page-2"}]


def run_response(response):
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: response)) as client:
            return await rerank(client, "synthetic-key", "approved-model", "question",
                                CANDIDATES, {"a", "b"}, policy=RetryPolicy(attempts=1))
    return asyncio.run(run())


def test_out_of_order_indexes_keep_source_identity():
    result = run_response(httpx.Response(200, json={"results": [
        {"index": 1, "relevance_score": 0.9}, {"index": 0, "relevance_score": 0.8}]}))
    assert result["mode"] == "reranked"
    assert [item["source"] for item in result["items"]] == ["page-2", "page-1"]


@pytest.mark.parametrize("results", [
    [{"index": 0, "relevance_score": 0.9}, {"index": 0, "relevance_score": 0.8}],
    [{"index": 2, "relevance_score": 0.9}, {"index": 0, "relevance_score": 0.8}],
    [{"index": True, "relevance_score": 0.9}, {"index": 0, "relevance_score": 0.8}], []])
def test_bad_results_fall_back(results):
    result = run_response(httpx.Response(200, json={"results": results}))
    assert result == {"mode": "fallback", "items": CANDIDATES,
                      "reason": "malformed_reranker_result"}


def test_unavailable_and_denied_candidates():
    assert run_response(httpx.Response(503))["mode"] == "fallback"
    async def run():
        def handler(request):
            raise AssertionError("denied candidates must not leave the process")
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(Failure, match="candidate_scope"):
                await rerank(client, "synthetic", "model", "q", CANDIDATES, {"a"})
    asyncio.run(run())


def test_timeout_retry_is_bounded():
    calls = []
    async def run():
        def handler(request):
            calls.append(1)
            raise httpx.ReadTimeout("synthetic", request=request)
        async def no_sleep(delay):
            pass
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await rerank(client, "synthetic", "model", "q", CANDIDATES, {"a", "b"},
                                policy=RetryPolicy(attempts=2), sleep=no_sleep)
    result = asyncio.run(run())
    assert result["mode"] == "fallback" and len(calls) == 2
