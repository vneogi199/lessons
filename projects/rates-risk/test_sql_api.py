from contextlib import closing
from pathlib import Path
import sqlite3
import pytest
from fastapi.testclient import TestClient
from api import create_app
from seed import seed


@pytest.fixture
def database(tmp_path):
    path = tmp_path / "synthetic.sqlite3"
    seed(path)
    return path


@pytest.fixture
def client(database):
    with TestClient(create_app(database, token="x" * 40, desk="RATES")) as value:
        yield value


def test_queries(database):
    sql = Path(__file__).with_name("queries.sql").read_text()
    # Six controlled statements, no semicolons inside literals/comments in this file.
    with closing(sqlite3.connect(database)) as db:
        results = [db.execute(query, {"as_of": "2026-01-05T10:00:00+00:00"}).fetchall()
                   for query in sql.split(";") if query.strip()]
    assert results[0][0][:4] == ("EMPTY", "USD", 0, 0)
    assert results[1] == [("RATES", "USD", 2, 3000000)]
    assert next(r for r in results[2] if r[:2] == ("USD", 24))[3] == "0.0400"
    assert [r[5] for r in results[3] if r[1] == "RATES"] == [1000000, 3000000]
    assert results[5] == [("OTHER", "EUR")]


def test_auth_schema_and_risk(client):
    headers = {"Authorization": "Bearer " + "x" * 40}
    body = {"text": "RFQ PAY USD 5MM 5Y IRS", "proposed_dv01": "2000"}
    assert client.post("/risk/check", json=body).status_code == 401
    result = client.post("/risk/check", json=body, headers=headers)
    assert result.status_code == 200 and result.json()["allowed"]
    assert result.json()["projected_notional"] == "8000000"
    assert client.post("/risk/check", json={**body, "desk": "OTHER"}, headers=headers).status_code == 422
    assert client.post("/risk/check", json={**body, "text": "RFQ PAY EUR 5MM 5Y IRS"}, headers=headers).status_code == 409


def test_rate_api(client):
    result = client.post("/rates/monitor", headers={"Authorization": "Bearer " + "x" * 40}, json={
        "previous_as_of": "2026-01-05T10:00:00Z", "current_as_of": "2026-01-05T10:05:00Z"})
    assert result.status_code == 200
    alerts = {(r["currency"], r["tenor_months"]): r for r in result.json()["alerts"]}
    assert alerts[("USD", 24)]["status"] == "threshold_breach"
    assert alerts[("EUR", 24)]["status"] == "stale"


def test_dependency_failure_is_safe(client, monkeypatch):
    def fail(*args, **kwargs):
        raise sqlite3.OperationalError("sensitive internal path")
    monkeypatch.setattr("api.sqlite3.connect", fail)
    result = client.post("/risk/check", headers={"Authorization": "Bearer " + "x" * 40},
                         json={"text": "RFQ PAY USD 5MM 5Y IRS", "proposed_dv01": "1"})
    assert result.status_code == 503 and "sensitive" not in result.text
