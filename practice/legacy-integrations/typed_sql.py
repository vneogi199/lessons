"""Typed intent to fixed SQL template; no model-generated SQL accepted."""
from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Intent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: Literal["latest_rfq", "exposure_by_desk"]
    desk: str = Field(pattern=r"^[A-Z0-9_-]{1,24}$")
    as_of: date


CONTEXT = {"views": {
    "reporting.RFQ": "tenant_id, desk, rfq_id, received_at, instrument; latest by received_at and rfq_id",
    "reporting.Exposure": "tenant_id, desk, snapshot_date, amount; same approved currency per view"},
    "allowed_intents": ["latest_rfq", "exposure_by_desk"],
    "ambiguity_policy": "Ask for desk and as_of date; never infer tenant or currency conversion."}


def compile_intent(raw, trusted_tenant, allowed_desks):
    intent = Intent.model_validate(raw)
    if intent.desk not in allowed_desks:
        raise PermissionError("desk_forbidden")
    if intent.query == "latest_rfq":
        return ("SELECT TOP (1) rfq_id, instrument, received_at FROM reporting.RFQ "
                "WHERE tenant_id=? AND desk=? AND received_at < DATEADD(day,1,CAST(? AS date)) "
                "ORDER BY received_at DESC, rfq_id DESC",
                (trusted_tenant, intent.desk, intent.as_of))
    return ("SELECT desk, SUM(amount) AS exposure FROM reporting.Exposure "
            "WHERE tenant_id=? AND desk=? AND snapshot_date=? GROUP BY desk",
            (trusted_tenant, intent.desk, intent.as_of))


def execute_intent(connection, raw, trusted_tenant, allowed_desks):
    sql, params = compile_intent(raw, trusted_tenant, allowed_desks)
    cursor = connection.cursor()
    try:
        cursor.execute(sql, *params)
        rows = cursor.fetchmany(2)
        if len(rows) > 1:
            raise ValueError("unexpected_result_cardinality")
        return {"status": "ok" if rows else "no_data", "rows": [tuple(row) for row in rows]}
    finally:
        cursor.close()
