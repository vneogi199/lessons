# One uv + Ruff + pytest workflow

Start with [the lesson](../../reference/python-tooling-workflow.html). Inspect
`quantity.py`, then `test_quantity.py`, then the tool configuration.

No installation is required for this smoke check from the repository root:

```sh
python3 -B practice/python-tooling/check_stdlib.py
```

This checks 12 function cases. It does not execute pytest parametrization,
fixtures, monkeypatch behavior or Ruff rules. The pytest suite has 14 cases,
including file and environment inputs. Run it only in an already prepared
environment using the commands in the lesson.

`pyproject.toml` is an isolated teaching configuration, not a change to the site's
dependencies. No `uv.lock` is supplied: generating a resolved lock and preparing
the environment are separately authorized work. Do not invent a lockfile or
claim reproducible CI before those steps are verified. Commands such as `uv add`,
`uv sync`, plain `uv run`, and `uvx` can install packages; do not run them under a
no-install constraint. No active GitHub workflow is added by this exercise.
