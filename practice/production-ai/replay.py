"""Sequential synthetic replay. No provider, filesystem or tool execution."""
from copy import deepcopy
from hashlib import sha256
import json


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(fixture):
    return sha256(canonical(fixture).encode()).hexdigest()


class Replay:
    def __init__(self, fixture, expected_digest):
        if digest(fixture) != expected_digest:
            raise ValueError("fixture digest mismatch")
        if set(fixture) != {"schema", "workflow", "calls"} or fixture["schema"] != 1:
            raise ValueError("unsupported fixture")
        if not isinstance(fixture["workflow"], str) or not fixture["workflow"]:
            raise ValueError("workflow version required")
        calls = fixture["calls"]
        if not isinstance(calls, list) or len(calls) > 100:
            raise ValueError("bounded call list required")
        for n, call in enumerate(calls, 1):
            if (not isinstance(call, dict) or set(call) != {"seq", "tool", "args", "response"}
                    or type(call["seq"]) is not int or call["seq"] != n
                    or not isinstance(call["tool"], str) or not call["tool"]
                    or not isinstance(call["args"], dict)):
                raise ValueError("invalid recorded call")
        self.calls = deepcopy(calls)
        self.position = 0

    def call(self, tool, args):
        if self.position == len(self.calls):
            raise ValueError("unexpected extra call; live fallback forbidden")
        recorded = self.calls[self.position]
        if recorded["tool"] != tool or canonical(recorded["args"]) != canonical(args):
            raise ValueError("call order or arguments changed")
        self.position += 1
        return deepcopy(recorded["response"])

    def finish(self):
        if self.position != len(self.calls):
            raise ValueError("recorded calls left unused")


FIXTURE = {"schema": 1, "workflow": "review-v1", "calls": [
    {"seq": 1, "tool": "read_limit", "args": {"account": "A"}, "response": {"limit": 10}},
    {"seq": 2, "tool": "read_exposure", "args": {"account": "A"}, "response": {"exposure": 8}},
]}
