"""Smoke checks without pytest. These do not execute pytest fixtures/plugins."""

from quantity import parse_quantity

for raw, expected in [(" 12 ", 12), (3, 3), ("001", 1)]:
    assert parse_quantity(raw) == expected
for raw in [None, True, "", "1.5", 0, -1, "-2", "１", 1.0]:
    try:
        parse_quantity(raw)
    except ValueError:
        pass
    else:
        raise AssertionError(f"invalid quantity accepted: {raw!r}")
print("12 quantity smoke cases passed; pytest and Ruff were not run.")
