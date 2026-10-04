from pathlib import Path
import pytest
from soap import RFQ, convert, fault_policy, fixture_client

FIXTURES = Path(__file__).parent / "fixtures"


def test_envelope_uses_local_schema_and_namespace():
    client = fixture_client()
    envelope = client.create_message(client.service, "GetRFQ", id="synthetic-one")
    assert envelope.find(f".//{{{RFQ}}}id").text == "synthetic-one"
    with pytest.raises(ValueError, match="external_schema"):
        client.transport.load("https://example.invalid/evil.xsd")
    with pytest.raises(RuntimeError, match="network_disabled"):
        client.service.GetRFQ(id="synthetic-one")


def test_repeated_records_decimal_date_absent_and_null():
    output = convert((FIXTURES / "success.xml").read_bytes())
    assert output["namespace"] == RFQ
    first, second = output["records"]
    assert first == {"id": "one", "amount": "12.50", "currency": "USD",
                     "date": "2026-10-04", "note": None}
    assert second["amount"] == "3.00" and "note" not in second


def test_faults_and_uncertain_writes():
    raw = (FIXTURES / "fault.xml").read_bytes()
    assert convert(raw).retry_read
    assert convert(raw, read_only=False).reconcile_write
    assert not fault_policy("AUTH", True).retry_read
    assert not fault_policy("INVALID", False).reconcile_write


@pytest.mark.parametrize("raw", [b"<broken", b"x" * 16385,
    b'<!DOCTYPE x [<!ENTITY y SYSTEM "file:///etc/passwd">]><x>&y;</x>',
    b'<Envelope xmlns="urn:wrong"/>'])
def test_malformed_and_external_entities_are_rejected(raw):
    with pytest.raises(Exception):
        convert(raw)
