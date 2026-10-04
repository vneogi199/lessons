from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import unquote, urlparse

from defusedxml.ElementTree import fromstring

SOAP = "http://schemas.xmlsoap.org/soap/envelope/"
RFQ = "urn:lesson:rfq"
NIL = "{http://www.w3.org/2001/XMLSchema-instance}nil"


@dataclass(frozen=True)
class FaultDecision:
    category: str
    retry_read: bool
    reconcile_write: bool


def fault_policy(code, read_only):
    category = {"BUSY": "unavailable", "AUTH": "forbidden", "MISSING": "not_found",
                "INVALID": "invalid_request"}.get(code, "unknown_fault")
    return FaultDecision(category, category == "unavailable" and read_only,
                         not read_only and category in {"unavailable", "unknown_fault"})


def convert(raw, read_only=True):
    if not isinstance(raw, bytes) or len(raw) > 16384:
        raise ValueError("xml_size_limit")
    root = fromstring(raw, forbid_dtd=True, forbid_entities=True, forbid_external=True)
    if root.tag != f"{{{SOAP}}}Envelope":
        raise ValueError("wrong_envelope_namespace")
    bodies = root.findall(f"{{{SOAP}}}Body")
    if len(bodies) != 1 or len(bodies[0]) != 1:
        raise ValueError("ambiguous_body")
    body = bodies[0]
    fault = body.find(f"{{{SOAP}}}Fault")
    if fault is not None:
        return fault_policy(fault.findtext(f"detail/{{{RFQ}}}code", "UNKNOWN"), read_only)
    records = body.find(f"{{{RFQ}}}Records")
    if records is None or len(records) > 100:
        raise ValueError("invalid_record_list")
    output, ids = [], set()
    for record in records:
        if record.tag != f"{{{RFQ}}}Record" or set(record.attrib) != {"id"}:
            raise ValueError("invalid_record")
        key = record.attrib["id"]
        if not key or len(key) > 64 or key in ids:
            raise ValueError("invalid_record_id")
        ids.add(key)
        tags = [child.tag for child in record]
        expected = {f"{{{RFQ}}}{name}" for name in ("Amount", "Date", "Note")}
        if len(tags) != len(set(tags)) or not set(tags) <= expected:
            raise ValueError("duplicate_or_unknown_field")
        amount, day = record.find(f"{{{RFQ}}}Amount"), record.find(f"{{{RFQ}}}Date")
        if amount is None or day is None or len(amount) or len(day):
            raise ValueError("missing_or_nested_field")
        currency = amount.attrib.get("currency")
        if currency not in {"USD", "GBP"} or set(amount.attrib) != {"currency"}:
            raise ValueError("invalid_currency")
        try:
            value = Decimal(amount.text or "")
            if not value.is_finite() or abs(value) > Decimal("1000000000"):
                raise ValueError("amount_bounds")
            stamp = date.fromisoformat(day.text or "").isoformat()
        except (ValueError, InvalidOperation) as exc:
            raise ValueError("invalid_value") from exc
        item = {"id": key, "amount": str(value), "currency": currency, "date": stamp}
        note = record.find(f"{{{RFQ}}}Note")
        if note is not None:
            if len(note) or set(note.attrib) - {NIL}:
                raise ValueError("invalid_note")
            nil = note.attrib.get(NIL)
            if nil not in {None, "true", "1", "false", "0"}:
                raise ValueError("invalid_nil")
            if nil in {"true", "1"}:
                if (note.text or "").strip():
                    raise ValueError("nil_with_value")
                item["note"] = None
            else:
                item["note"] = note.text or ""
        output.append(item)
    return {"namespace": RFQ, "records": output}


def fixture_client():
    from zeep import Client, Settings
    from zeep.transports import Transport
    base = Path(__file__).parent / "fixtures"

    class LocalOnly(Transport):
        def load(self, url):
            parsed = urlparse(url)
            if parsed.scheme not in {"", "file"} or parsed.netloc:
                raise ValueError("external_schema_forbidden")
            path = Path(unquote(parsed.path)).resolve()
            if path not in {(base / "rfq.wsdl").resolve(), (base / "rfq.xsd").resolve()}:
                raise ValueError("unapproved_schema")
            return path.read_bytes()

        def post_xml(self, *args, **kwargs):
            raise RuntimeError("network_disabled_in_fixture")

    return Client(str((base / "rfq.wsdl").resolve()),
                  settings=Settings(strict=True, forbid_dtd=True, forbid_entities=True,
                                    forbid_external=True, xml_huge_tree=False),
                  transport=LocalOnly(timeout=5, operation_timeout=5))
