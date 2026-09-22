"""Synthetic interview domain: no pricing, order execution or investment advice."""
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import re


def decimal(value):
    if not isinstance(value, (str, Decimal)) or len(str(value)) > 40:
        raise ValueError("supply a bounded decimal string, not float")
    try:
        number = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError("invalid decimal") from exc
    if not number.is_finite() or abs(number) > Decimal("1e15"):
        raise ValueError("finite bounded decimal required")
    return number


def timestamp(value):
    if not isinstance(value, str) or len(value) > 40:
        raise ValueError("ISO timestamp required")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include timezone")
    return parsed.astimezone(timezone.utc)


def parse_rfq(raw):
    """Deliberately narrow grammar; ambiguous text is rejected, never guessed."""
    if not isinstance(raw, str) or len(raw) > 250:
        raise ValueError("RFQ text required, maximum 250 characters")
    match = re.fullmatch(
        r"RFQ (PAY|RECEIVE) (USD|EUR|GBP) ([0-9]+(?:\.[0-9]{1,2})?)(K|MM) "
        r"([1-9][0-9]?)(M|Y) IRS(?: AT (-?[0-9]+(?:\.[0-9]{1,4})?)%)?",
        " ".join(raw.upper().split()))
    if not match:
        raise ValueError("expected RFQ PAY|RECEIVE USD|EUR|GBP 5MM 5Y IRS [AT 4.25%]")
    side, currency, amount, unit, tenor, period, rate = match.groups()
    notional = decimal(amount) * {"K": Decimal(1000), "MM": Decimal(1000000)}[unit]
    months = int(tenor) * (12 if period == "Y" else 1)
    if not 0 < notional <= Decimal("1e12") or months > 600:
        raise ValueError("notional or tenor outside teaching bounds")
    fixed = decimal(rate) / 100 if rate is not None else None
    if fixed is not None and not Decimal("-.1") <= fixed <= Decimal("1"):
        raise ValueError("rate outside teaching bounds")
    return {"side": side, "currency": currency, "notional": str(notional),
            "tenor_months": months, "product": "IRS",
            "fixed_rate": str(fixed) if fixed is not None else None}


def risk_check(rfq, gross_notional, gross_dv01, proposed_dv01, notional_limit, dv01_limit):
    """Gross limits, no offsets; DV01 supplied by a trusted pricing process."""
    values = [decimal(v) for v in (gross_notional, gross_dv01, proposed_dv01, notional_limit, dv01_limit)]
    if any(v < 0 for v in values):
        raise ValueError("gross exposures and limits must be nonnegative")
    used_n, used_d, added_d, cap_n, cap_d = values
    added_n = decimal(rfq["notional"])
    if added_n <= 0:
        raise ValueError("positive proposed notional required")
    after_n, after_d = used_n + added_n, used_d + added_d
    breaches = [name for name, used, cap in [("gross_notional", after_n, cap_n),
                                            ("gross_dv01", after_d, cap_d)] if used > cap]
    return {"allowed": not breaches, "breaches": breaches,
            "projected_notional": str(after_n), "projected_dv01": str(after_d),
            "notional_headroom": str(cap_n - after_n), "dv01_headroom": str(cap_d - after_d),
            "binding": False}


def latest_rates(rows, as_of, max_age_seconds=300):
    """Group by currency+tenor; ignore future observations, reject ambiguous ties."""
    cutoff = timestamp(as_of)
    if type(max_age_seconds) is not int or max_age_seconds < 0:
        raise ValueError("nonnegative integer age required")
    latest = {}
    seen = {}
    for row in rows:
        key = (row["currency"], row["tenor_months"])
        if key[0] not in {"USD", "EUR", "GBP"} or type(key[1]) is not int or not 1 <= key[1] <= 600:
            raise ValueError("invalid curve key")
        observed = timestamp(row["observed_at"])
        rate = decimal(row["rate"])
        if not Decimal("-.1") <= rate <= Decimal("1"):
            raise ValueError("rate outside teaching bounds")
        identity = key + (observed,)
        if identity in seen and seen[identity] != rate:
            raise ValueError("conflicting rate at same timestamp")
        seen[identity] = rate
        if observed <= cutoff and (key not in latest or observed > latest[key][0]):
            latest[key] = (observed, rate)
    return [{"currency": currency, "tenor_months": tenor, "rate": str(rate),
             "observed_at": observed.isoformat(), "age_seconds": (cutoff - observed).total_seconds(),
             "stale": (cutoff - observed).total_seconds() > max_age_seconds}
            for (currency, tenor), (observed, rate) in sorted(latest.items())]


def monitor_rates(previous, current, threshold_bps="5"):
    threshold = decimal(threshold_bps)
    if threshold <= 0:
        raise ValueError("positive threshold required")
    old = {(r["currency"], r["tenor_months"]): r for r in previous}
    if len(old) != len(previous) or len({(r["currency"], r["tenor_months"]) for r in current}) != len(current):
        raise ValueError("snapshots must have unique curve keys")
    alerts = []
    for row in current:
        key = (row["currency"], row["tenor_months"])
        baseline = old.get(key)
        if row["stale"]:
            status, move = "stale", None
        elif baseline is None or baseline["stale"]:
            status, move = "missing_fresh_baseline", None
        elif timestamp(row["observed_at"]) < timestamp(baseline["observed_at"]):
            raise ValueError("current observation predates baseline")
        else:
            move = (decimal(row["rate"]) - decimal(baseline["rate"])) * 10000
            status = "threshold_breach" if abs(move) >= threshold else "normal"
        alerts.append({"currency": key[0], "tenor_months": key[1], "status": status,
                       "move_bps": str(move) if move is not None else None})
    present = {(r["currency"], r["tenor_months"]) for r in current}
    alerts.extend({"currency": c, "tenor_months": t, "status": "missing_current", "move_bps": None}
                  for c, t in old.keys() - present)
    return sorted(alerts, key=lambda r: (r["currency"], r["tenor_months"]))


def summarize_rfqs(rows):
    """Dictionaries, grouping, comprehensions and deterministic sorting."""
    groups = defaultdict(lambda: {"count": 0, "notional": Decimal(0)})
    for row in rows:
        group = groups[(row["desk"], row["currency"])]
        value = decimal(row["notional"])
        if value <= 0:
            raise ValueError("positive notional required")
        group["count"] += 1
        group["notional"] += value
    return [{"desk": desk, "currency": currency, "count": g["count"], "notional": str(g["notional"])}
            for (desk, currency), g in sorted(groups.items(), key=lambda item: (-item[1]["notional"], item[0]))]
