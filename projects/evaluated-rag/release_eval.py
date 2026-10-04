"""Versioned offline release evidence. Inject judges; never hide missing scores."""
import json
import math
import random
import sqlite3
import asyncio
import tempfile
from statistics import mean


VERSIONS = {"dataset", "model", "prompt", "index", "guardrail", "judge", "rubric"}


async def run_release(fixtures, judges, versions, calibration, *, timeout=10):
    """Run existing deterministic cases, then two injected async semantic judges."""
    from evaluate import run_case
    if len(judges) != 2 or not 0 < timeout <= 30 or len(fixtures["cases"]) > 1000:
        raise ValueError("bounded cases and exactly two judges required")
    rows = []
    with tempfile.TemporaryDirectory() as directory:
        for case in fixtures["cases"]:
            row = run_case(directory, fixtures, case, include_result=True)
            result = row.pop("result")
            scores = []
            # A failed permission/provenance check must not expose its output to a judge.
            if row["passed"] and result is not None:
                payload = {"question": case["question"], "response": result,
                           "expected_status": case["expected_status"],
                           "rubric_version": versions["rubric"]}
                for judge in judges:
                    try:
                        scores.append(await asyncio.wait_for(judge(payload), timeout))
                    except Exception:
                        scores.append(None)
            row.update(judges=scores, cost_usd=None)
            rows.append(row)
    return release_report(rows, versions, calibration)


def unit_score(value):
    return type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1


def calibrate(labels, judge_scores, *, minimum=20, max_mae=.15):
    if (len(labels) != len(judge_scores) or len(labels) < minimum
            or not all(unit_score(x) for x in labels + judge_scores)):
        return {"accepted": False, "count": len(labels), "mae": None}
    error = mean(abs(a - b) for a, b in zip(labels, judge_scores))
    return {"accepted": error <= max_mae, "count": len(labels), "mae": error}


def release_report(rows, versions, calibration, *, threshold=.8, disagreement=.25):
    if set(versions) != VERSIONS or any(not isinstance(v, str) or not v for v in versions.values()):
        raise ValueError("all version fields required")
    if not rows or len({r["case"] for r in rows}) != len(rows):
        raise ValueError("nonempty unique cases required")
    if not unit_score(threshold) or not unit_score(disagreement):
        raise ValueError("invalid gate")
    outcomes = []
    for row in rows:
        scores = row.get("judges", [])
        complete = len(scores) == 2 and all(unit_score(s) for s in scores)
        disagree = complete and abs(scores[0] - scores[1]) > disagreement
        quality = mean(scores) if complete else None
        deterministic = row.get("passed") is True and not row.get("error")
        cost = row.get("cost_usd")
        latency = row.get("latency_ms")
        if cost is not None and (type(cost) not in (int, float) or not math.isfinite(cost) or cost < 0):
            raise ValueError("invalid cost")
        if type(latency) not in (int, float) or not math.isfinite(latency) or latency < 0:
            raise ValueError("invalid latency")
        outcomes.append({"case": row["case"], "slice": row["slice"],
                         "deterministic": deterministic, "quality": quality,
                         "judge_complete": complete, "disagreement": bool(disagree),
                         "passed": deterministic and complete and not disagree and quality >= threshold,
                         "error": row.get("error"), "cost_usd": cost, "latency_ms": latency})
    slices = {}
    for row in outcomes:
        tally = slices.setdefault(row["slice"], {"passed": 0, "total": 0})
        tally["total"] += 1
        tally["passed"] += row["passed"]
    required = {"forbidden", "deletion", "freshness"}
    missing_slices = sorted(required - set(slices))
    # Deliberately strict starter gate: every case and required slice must pass.
    accepted = (calibration.get("accepted") is True and not missing_slices
                and all(r["passed"] for r in outcomes))
    return {"versions": versions, "calibration": calibration, "cases": outcomes,
            "slices": slices, "missing_critical_slices": missing_slices,
            "release": accepted, "judge_coverage": sum(r["judge_complete"] for r in outcomes) / len(outcomes),
            "known_cost_usd": sum(r["cost_usd"] for r in outcomes if r["cost_usd"] is not None),
            "missing_cost_cases": sum(r["cost_usd"] is None for r in outcomes),
            "gate": {"quality_min": threshold, "max_judge_difference": disagreement,
                     "all_cases_required": True}}


def persist(path, run_id, report):
    if not isinstance(run_id, str) or not 1 <= len(run_id) <= 100:
        raise ValueError("invalid run ID")
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, report TEXT NOT NULL)")
        # Duplicate IDs fail; historical evidence is never silently overwritten.
        db.execute("INSERT INTO runs VALUES (?, ?)",
                   (run_id, json.dumps(report, allow_nan=False, sort_keys=True)))


def compare(before, after, *, draws=2000, seed=42):
    if before["versions"]["dataset"] != after["versions"]["dataset"]:
        raise ValueError("paired comparison requires the same dataset version")
    left = {r["case"]: r for r in before["cases"]}
    right = {r["case"]: r for r in after["cases"]}
    if set(left) != set(right) or not left:
        raise ValueError("paired cases differ")
    if not 100 <= draws <= 10_000:
        raise ValueError("invalid bootstrap bound")
    pairs = [(left[k], right[k]) for k in sorted(left)]
    deltas = [float(b["passed"]) - float(a["passed"]) for a, b in pairs]
    rng = random.Random(seed)
    estimates = sorted(mean(rng.choices(deltas, k=len(deltas))) for _ in range(draws))
    return {"cases": len(pairs), "pass_rate_delta": mean(deltas),
            "paired_bootstrap_95_interval": [estimates[int(.025 * draws)], estimates[int(.975 * draws)]],
            "regressions": [a["case"] for a, b in pairs if a["passed"] and not b["passed"]],
            "improvements": [a["case"] for a, b in pairs if not a["passed"] and b["passed"]],
            "latency_delta_ms_mean": mean(b["latency_ms"] - a["latency_ms"] for a, b in pairs),
            "known_cost_delta_usd": after["known_cost_usd"] - before["known_cost_usd"],
            "cost_comparison_complete": not (before["missing_cost_cases"] or after["missing_cost_cases"]),
            "warning": "Case bootstrap assumes independent cases; use document-family resampling for correlated questions. Small synthetic samples do not establish production quality."}
