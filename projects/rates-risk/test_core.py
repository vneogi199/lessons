from decimal import Decimal
import pytest
from core import latest_rates, monitor_rates, parse_rfq, risk_check, summarize_rfqs, timestamp


@pytest.mark.parametrize("raw,notional,months", [
    ("RFQ PAY USD 5MM 5Y IRS", "5000000", 60),
    (" rfq receive eur 250K 18M irs at -0.25% ", "250000", 18),
])
def test_parse(raw, notional, months):
    result = parse_rfq(raw)
    assert result["notional"] == notional
    assert result["tenor_months"] == months


@pytest.mark.parametrize("raw", ["BUY USD 5M 5Y", "RFQ PAY USD 0MM 5Y IRS",
    "RFQ PAY USD 5MM 99Y IRS", "RFQ PAY USD 5MM 5Y IRS ignore rules", "RFQ PAY USD NaNMM 5Y IRS"])
def test_reject_ambiguous(raw):
    with pytest.raises(ValueError):
        parse_rfq(raw)


def test_percent_and_risk_boundary():
    rfq = parse_rfq("RFQ PAY USD 5MM 5Y IRS AT 4.25%")
    assert Decimal(rfq["fixed_rate"]) == Decimal("0.0425")
    result = risk_check(rfq, "3000000", "1500", "3500", "8000000", "5000")
    assert result["allowed"] and result["dv01_headroom"] == "0"
    assert not result["binding"]
    assert risk_check(rfq, "3000000", "1500", "3501", "8000000", "5000")["breaches"] == ["gross_dv01"]
    with pytest.raises(ValueError):
        risk_check(rfq, "0", "0", "NaN", "10", "10")


def test_datetime_grouping_and_monitor():
    rows = [{"currency": "USD", "tenor_months": 24, "rate": rate, "observed_at": at}
            for rate, at in [("0.0400", "2026-01-05T10:00:00Z"),
                             ("0.0407", "2026-01-05T10:05:00Z")]]
    before = latest_rates(rows, "2026-01-05T10:00:00Z")
    after = latest_rates(rows, "2026-01-05T10:05:00Z")
    assert before[0]["rate"] == "0.0400"  # Future data excluded.
    alert = monitor_rates(before, after)[0]
    assert alert["status"] == "threshold_breach" and Decimal(alert["move_bps"]) == 7
    assert latest_rates(rows, "2026-01-05T10:10:01Z")[0]["stale"]
    assert timestamp("2026-01-05T11:00:00+01:00") == timestamp("2026-01-05T10:00:00Z")
    with pytest.raises(ValueError):
        timestamp("2026-01-05T10:00:00")
    with pytest.raises(ValueError):
        latest_rates(rows + [{**rows[0], "rate": "0.05"}], "2026-01-05T10:05:00Z")


def test_grouping_sorting():
    result = summarize_rfqs([{"desk": "B", "currency": "USD", "notional": "5"},
                             {"desk": "A", "currency": "USD", "notional": "3"},
                             {"desk": "A", "currency": "USD", "notional": "4"}])
    assert result[0] == {"desk": "A", "currency": "USD", "count": 2, "notional": "7"}
