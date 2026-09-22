"""FastAPI/Pydantic v2 adapter. Requires an existing environment; no auto-install."""
from contextlib import closing
import hmac
import os
from pathlib import Path
import sqlite3

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from core import latest_rates, monitor_rates, parse_rfq, risk_check


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class ParseInput(Input):
    text: str = Field(min_length=1, max_length=250)


class RiskInput(ParseInput):
    proposed_dv01: str = Field(min_length=1, max_length=40)


class MonitorInput(Input):
    previous_as_of: str = Field(max_length=40)
    current_as_of: str = Field(max_length=40)
    max_age_seconds: int = Field(default=300, ge=0, le=86400)
    threshold_bps: str = Field(default="5", max_length=40)


def create_app(db_path=None, token=None, desk=None):
    path = str(db_path or os.environ.get("RATES_DB", "rates.sqlite3"))
    secret = token or os.environ.get("RATES_API_TOKEN", "")
    scope = desk or os.environ.get("RATES_DESK", "")
    if len(secret) < 32 or not secret.isascii() or not scope:
        raise ValueError("configure a random token (32+ ASCII chars) and RATES_DESK")
    app = FastAPI(title="Synthetic rates risk preparation", docs_url=None, redoc_url=None, openapi_url=None)

    def authorize(authorization: str = Header(default="")):
        expected = "Bearer " + secret
        if not authorization.isascii() or not hmac.compare_digest(authorization, expected):
            raise HTTPException(401, "unauthorized")
        return scope

    def connect():
        # Read-only API: seed/configure the local database separately.
        connection = sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True, timeout=2)
        connection.row_factory = sqlite3.Row
        return connection

    @app.exception_handler(ValueError)
    async def invalid(request: Request, exc: ValueError):
        return JSONResponse(status_code=422, content={"error": "invalid_domain_input"})

    @app.exception_handler(RequestValidationError)
    async def invalid_schema(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"error": "invalid_request_schema"})

    @app.exception_handler(sqlite3.Error)
    async def unavailable(request: Request, exc: sqlite3.Error):
        return JSONResponse(status_code=503, content={"error": "risk_data_unavailable"})

    @app.post("/rfqs/parse", dependencies=[Depends(authorize)])
    def parse(body: ParseInput):
        return parse_rfq(body.text)

    @app.post("/risk/check")
    def check(body: RiskInput, current_desk: str = Depends(authorize)):
        rfq = parse_rfq(body.text)
        with closing(connect()) as db:
            db.execute("BEGIN")  # One consistent snapshot for limits and exposures.
            limit = db.execute("SELECT * FROM limits WHERE desk=? AND currency=?",
                               (current_desk, rfq["currency"])).fetchone()
            if limit is None:
                raise HTTPException(409, "missing_limit")
            exposure = db.execute("SELECT COALESCE(SUM(notional),0),COALESCE(SUM(dv01),0) "
                                  "FROM positions WHERE desk=? AND currency=?",
                                  (current_desk, rfq["currency"])).fetchone()
        result = risk_check(rfq, str(exposure[0]), str(exposure[1]), body.proposed_dv01,
                            str(limit["notional_limit"]), str(limit["dv01_limit"]))
        return {"desk": current_desk, "currency": rfq["currency"], **result}

    @app.post("/rates/monitor", dependencies=[Depends(authorize)])
    def monitor(body: MonitorInput):
        from core import timestamp
        if timestamp(body.current_as_of) <= timestamp(body.previous_as_of):
            raise ValueError("current cutoff must follow previous cutoff")
        with closing(connect()) as db:
            rows = [dict(row) for row in db.execute("SELECT * FROM rate_ticks LIMIT 10001")]
        if len(rows) > 10000:
            raise HTTPException(503, "teaching_dataset_limit")
        previous = latest_rates(rows, body.previous_as_of, body.max_age_seconds)
        current = latest_rates(rows, body.current_as_of, body.max_age_seconds)
        return {"alerts": monitor_rates(previous, current, body.threshold_bps), "current": current}

    return app
