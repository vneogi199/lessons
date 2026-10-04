"""Bounded Prometheus metrics. Provider adapters normalize usage before calling us."""
from decimal import Decimal
import math
from prometheus_client import CollectorRegistry, Counter, Histogram, generate_latest


OUTCOMES = {"success", "error", "denied", "cancelled"}
BUCKETS = (.05, .1, .25, .5, 1, 2, 5, 10, 30, 60, 120)


class Metrics:
    def __init__(self):
        self.registry = CollectorRegistry()
        args = {"registry": self.registry}
        self.tasks = Counter("ai_tasks", "Completed logical tasks", ["outcome"], **args)
        self.duration = Histogram("ai_endpoint_seconds", "Entire request including retries",
                                  buckets=BUCKETS, **args)
        self.ttft = Histogram("ai_ttft_seconds", "Request start to first released answer token",
                              buckets=BUCKETS, **args)
        self.no_token = Counter("ai_no_token", "Tasks without a released answer token", **args)
        self.attempts = Counter("ai_attempts", "All model attempts including failed retries",
                                ["model", "outcome"], **args)
        self.tokens = Counter("ai_tokens", "Known normalized token usage",
                              ["model", "kind"], **args)
        self.cost = Counter("ai_cost_usd", "Known estimated model charges, not invoice totals",
                            ["model"], **args)
        self.unknown = Counter("ai_unknown_cost_attempts", "Attempts missing usage or price",
                               ["model"], **args)

    def attempt(self, model, outcome, *, usage=None, prices=None):
        # Prices are USD per million tokens, from a reviewed, versioned price table.
        # Input categories MUST be disjoint: uncached, cache read, cache write.
        if model not in {"small", "large"} or outcome not in OUTCOMES:
            raise ValueError("fixed model alias and outcome required")
        kinds = {"input", "cache_read", "cache_write", "output"}
        if usage is not None and (set(usage) != kinds or any(
                type(n) is not int or not 0 <= n <= 10_000_000 for n in usage.values())):
            raise ValueError("four disjoint nonnegative usage counts required")
        if prices is not None and (set(prices) != kinds or any(
                not isinstance(p, Decimal) or not p.is_finite() or not 0 <= p <= 10000
                for p in prices.values())):
            raise ValueError("four finite Decimal prices required")
        self.attempts.labels(model, outcome).inc()
        if usage is not None:
            for kind, count in usage.items():
                self.tokens.labels(model, kind).inc(count)
        if usage is None or prices is None:
            self.unknown.labels(model).inc()
            return None
        amount = sum((Decimal(usage[k]) * prices[k] for k in kinds), Decimal(0)) / 1_000_000
        self.cost.labels(model).inc(float(amount))
        return amount

    def finish(self, outcome, seconds, *, first_token_seconds=None):
        if (outcome not in OUTCOMES or type(seconds) not in {float, int}
                or not math.isfinite(seconds) or not 0 <= seconds <= 3600):
            raise ValueError("bounded task duration required")
        if first_token_seconds is not None and (
                type(first_token_seconds) not in {float, int}
                or not math.isfinite(first_token_seconds)
                or not 0 <= first_token_seconds <= seconds):
            raise ValueError("first token must occur within the request")
        self.tasks.labels(outcome).inc()
        self.duration.observe(seconds)
        if first_token_seconds is None:
            self.no_token.inc()
        else:
            self.ttft.observe(first_token_seconds)

    def exposition(self):
        return generate_latest(self.registry)
