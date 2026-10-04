"""One retry owner for side-effect-free generation/read adapters."""
import asyncio
import math
import random
import time
from dataclasses import dataclass
from datetime import timezone
from email.utils import parsedate_to_datetime


class Failure(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


class Retryable(Failure):
    def __init__(self, code, retry_after=None):
        super().__init__(code)
        self.retry_after = retry_after


@dataclass(frozen=True)
class RetryPolicy:
    attempts: int = 3
    total_seconds: float = 12
    attempt_seconds: float = 4
    base_seconds: float = 0.25
    cap_seconds: float = 2

    def __post_init__(self):
        if type(self.attempts) is not int or not 1 <= self.attempts <= 10:
            raise ValueError("invalid_attempt_limit")
        for value in (self.total_seconds, self.attempt_seconds,
                      self.base_seconds, self.cap_seconds):
            if not math.isfinite(value) or value <= 0:
                raise ValueError("invalid_time_limit")


def retry_after_seconds(value, now):
    if value is None:
        return 0.0
    if not isinstance(value, str) or len(value) > 128:
        raise Failure("invalid_retry_after")
    if value.isascii() and value.isdigit():
        # Bound before converting an arbitrarily large integer.
        if len(value) > 8:
            raise Failure("retry_after_exceeds_budget")
        return float(value)
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return max(0.0, parsed.timestamp() - now)
    except (ValueError, TypeError, OverflowError) as exc:
        raise Failure("invalid_retry_after") from exc


async def retry_read(operation, policy=RetryPolicy(), *, clock=time.monotonic,
                     wall_clock=time.time, sleep=asyncio.sleep, uniform=random.uniform):
    """operation(attempt, previous_code) must have no external write effects.

    Disable retries inside its SDK/HTTP client. Cancellation must propagate.
    """
    deadline = clock() + policy.total_seconds
    previous = None
    for attempt in range(1, policy.attempts + 1):
        remaining = deadline - clock()
        if remaining <= 0:
            raise Failure("deadline")
        try:
            value = await asyncio.wait_for(operation(attempt, previous),
                                           min(remaining, policy.attempt_seconds))
            if clock() >= deadline:
                raise Failure("deadline")
            return value
        except Retryable as exc:
            previous = exc.code
            minimum = retry_after_seconds(exc.retry_after, wall_clock())
        except asyncio.TimeoutError:
            previous, minimum = "transport_timeout", 0.0
        if attempt == policy.attempts:
            raise Failure("attempts_exhausted:" + previous)
        delay = max(minimum, uniform(0, min(policy.cap_seconds,
                                           policy.base_seconds * 2 ** (attempt - 1))))
        if not math.isfinite(delay) or delay < 0 or delay >= deadline - clock():
            raise Failure("retry_delay_exceeds_budget")
        await sleep(delay)
    raise AssertionError("unreachable")
