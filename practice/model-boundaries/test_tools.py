import asyncio
import copy
import json

import httpx
import pytest

from claude_transport import ClaudeTransport, usage_comparison
from retry import Failure
from tool_loop import run_tools


def call(id, name="read_limit", instrument="BOND-A"):
    return {"type": "tool_use", "id": id, "name": name, "input": {"instrument": instrument}}


def reply(content, stop="tool_use"):
    return {"content": content, "stop_reason": stop,
            "usage": {"input_tokens": 20, "output_tokens": 5}}


class FakeProvider:
    def __init__(self, *replies):
        self.replies = iter(replies)
        self.messages = []

    async def count(self, system, messages, tools):
        assert tools and system
        return 20

    async def generate(self, system, messages, tools, max_tokens):
        self.messages.append(copy.deepcopy(messages))
        return next(self.replies)


def test_parallel_results_unknown_tools_and_partial_failure():
    provider = FakeProvider(reply([call("a"), call("b", instrument="BOND-B"),
                                   call("c", name="place_trade")]),
                            reply([{"type": "text", "text": "A is 10; B unavailable."}], "end_turn"))

    async def read(instrument):
        if instrument == "BOND-B":
            raise RuntimeError("private diagnostic must not reach model")
        return 10

    result = asyncio.run(run_tools(provider, "limits?", read, {"BOND-A", "BOND-B"}, context_limit=1000))
    assert result["turns"] == 2
    results = provider.messages[1][-1]["content"]
    assert [block["tool_use_id"] for block in results] == ["a", "b", "c"]
    assert json.loads(results[0]["content"])["limit"] == 10
    assert results[1]["content"] == "tool_unavailable"
    assert results[2]["content"] == "unknown_tool"
    assert results[1]["is_error"] and results[2]["is_error"]


def test_repeat_ids_fail_before_second_read():
    provider = FakeProvider(reply([call("a")]), reply([call("a")]))
    reads = []

    async def read(instrument):
        reads.append(instrument)
        return 10
    with pytest.raises(Failure, match="duplicate_or_invalid"):
        asyncio.run(run_tools(provider, "q", read, {"BOND-A"}, context_limit=1000))
    assert reads == ["BOND-A"]


def test_input_scope_and_context_limit():
    async def read(instrument):
        raise AssertionError("unauthorized tool must never execute")
    provider = FakeProvider(reply([call("a", instrument="SECRET")]),
                            reply([{"type": "text", "text": "Unavailable."}], "end_turn"))
    asyncio.run(run_tools(provider, "q", read, set(), context_limit=1000))
    assert provider.messages[1][-1]["content"][0]["content"] == "instrument_forbidden"
    with pytest.raises(Failure, match="context_budget"):
        asyncio.run(run_tools(FakeProvider(), "q", read, set(), context_limit=520))


def test_real_transport_contract_with_mock_http():
    seen = []

    async def handler(request):
        payload = json.loads(request.content)
        seen.append((request.url.path, payload))
        assert request.headers["anthropic-version"] == "2023-06-01"
        if request.url.path.endswith("count_tokens"):
            return httpx.Response(200, json={"input_tokens": 25})
        return httpx.Response(200, json=reply([{"type": "text", "text": "Done"}], "end_turn"))

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), trust_env=False) as client:
            provider = ClaudeTransport(client, "synthetic-test-key", "model-from-config")
            count = await provider.count("system", [{"role": "user", "content": "Evidence: example"}], [])
            assert count == 25
            await provider.generate("system", [{"role": "user", "content": "question"}], [], 64)
    asyncio.run(run())
    assert "max_tokens" not in seen[0][1]
    assert seen[1][1]["max_tokens"] == 64
    report = usage_comparison(25, {"input_tokens": 20, "cache_read_input_tokens": 5, "output_tokens": 3})
    assert report["input_delta"] == 0
