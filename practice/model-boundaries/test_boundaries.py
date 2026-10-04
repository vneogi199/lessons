import asyncio
from datetime import datetime, timezone

import pytest

from context import Fact, Turn, build_context
from retry import Failure, Retryable, RetryPolicy, retry_after_seconds, retry_read
from structured import Reply, parse_rfq


class Provider:
    def __init__(self, *results):
        self.results = iter(results)
        self.calls = []

    async def __call__(self, request):
        self.calls.append(request)
        result = next(self.results)
        if isinstance(result, Exception):
            raise result
        return result


async def no_sleep(seconds):
    pass


GOOD = Reply("complete", '{"instrument":"BOND-A","quantity":10}')


@pytest.mark.parametrize("bad,code", [
    (Reply("complete", "{"), "malformed_json"),
    (Reply("complete", '{"quantity":true}'), "schema_failure"),
    (Reply("complete", '{"quantity":1,"quantity":2}'), "malformed_json"),
    (Retryable("transport_503", "0"), "transport_503")])
def test_repair_and_transport(bad, code):
    provider = Provider(bad, GOOD)
    result = asyncio.run(parse_rfq(provider, "10 BOND-A", {"BOND-A"}, sleep=no_sleep))
    assert result.quantity == 10
    assert len(provider.calls) == 2
    assert provider.calls[1]["repair_code"] == code


@pytest.mark.parametrize("reply,code", [(Reply("refusal"), "refusal"),
    (Reply("truncated", "{"), "truncated"), (GOOD, "instrument_forbidden"),
    (Reply("complete", "x" * 4097), "output_too_large")])
def test_terminal_failures_do_not_retry(reply, code):
    provider = Provider(reply, GOOD)
    with pytest.raises(Failure) as error:
        asyncio.run(parse_rfq(provider, "source", set(), sleep=no_sleep))
    assert error.value.code == code
    assert len(provider.calls) == 1


def test_attempt_budget_and_uncertain_write():
    async def run():
        calls = []

        async def transient(attempt, previous):
            calls.append(attempt)
            raise Retryable("rate_limit")
        with pytest.raises(Failure, match="attempts_exhausted"):
            await retry_read(transient, sleep=no_sleep)
        assert calls == [1, 2, 3]
        calls.clear()

        async def uncertain(attempt, previous):
            calls.append(attempt)
            raise Failure("uncertain_external_effect")
        with pytest.raises(Failure, match="uncertain_external_effect"):
            await retry_read(uncertain, sleep=no_sleep)
        assert calls == [1]
    asyncio.run(run())


def test_retry_after_and_total_deadline():
    now = datetime(2026, 10, 4, tzinfo=timezone.utc).timestamp()
    assert retry_after_seconds("3", now) == 3
    assert retry_after_seconds("Sun, 04 Oct 2026 00:00:05 GMT", now) == 5
    with pytest.raises(Failure):
        retry_after_seconds("not-a-date", now)

    async def run():
        clock = [0.0]

        async def operation(attempt, previous):
            clock[0] += 1
            raise Retryable("busy", "5")
        with pytest.raises(Failure, match="retry_delay_exceeds_budget"):
            await retry_read(operation, RetryPolicy(total_seconds=3), clock=lambda: clock[0],
                             sleep=no_sleep)
    asyncio.run(run())


def test_one_owner_avoids_retry_multiplication():
    # Three outer attempts times three hidden inner attempts would call nine times.
    async def run():
        calls = []

        async def transport(attempt, previous):
            calls.append(1)
            raise Retryable("busy")
        with pytest.raises(Failure):
            await retry_read(transport, sleep=no_sleep)
        assert len(calls) == 3
    asyncio.run(run())


def test_context_modes_keep_authority_and_tool_pairs():
    old = Fact("limit", 1, "10", "policy-v1")
    current = Fact("limit", 2, "20", "policy-v2")
    turns = [Turn("old", ("old discussion " * 20,)),
             Turn("tool", ("lookup limit", "limit equals twenty"), ("c1",), ("c1",))]
    for mode in ("recent", "summary"):
        result = build_context("Never place orders", "What is the limit?", turns,
                               [old, current], 35, mode, [current])
        assert result["required"][0] == "Never place orders"
        assert any("limit=20" in line for line in result["required"])
        assert not any("limit=10" in line for line in result["required"])
        assert result["turns"] == [turns[1]]
        assert result["omitted"] == ["old"]
    with pytest.raises(ValueError, match="full_history"):
        build_context("Never place orders", "Question", turns, [current], 35, "full")
    with pytest.raises(ValueError, match="stale_summary"):
        build_context("Never place orders", "Question", turns, [current], 35, "summary", [old])
    with pytest.raises(ValueError, match="unpaired_tool_turn"):
        Turn("broken", ("result without call",), (), ("c1",))
