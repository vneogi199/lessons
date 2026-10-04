"""Text-only fail-closed adapter. No clients or resources at import."""
from dataclasses import dataclass
import math
import re
import time


@dataclass(frozen=True)
class Decision:
    allowed: bool
    text: str | None
    reason: str
    transformed: tuple[str, ...] = ()  # Restricted inspection, never automatic release.


def clients(session, region):
    from botocore.config import Config
    config = Config(connect_timeout=2, read_timeout=3,
                    retries={"total_max_attempts": 1, "mode": "standard"})
    return (session.client("bedrock", region_name=region, config=config),
            session.client("bedrock-runtime", region_name=region, config=config))


def apply(client, identifier, version, source, text, *, deadline, clock=time.monotonic):
    if source not in {"INPUT", "OUTPUT"} or not isinstance(text, str) or not 1 <= len(text) <= 8000:
        raise ValueError("bounded text and explicit direction required")
    if not isinstance(version, str) or not re.fullmatch(r"[1-9][0-9]{0,7}", version):
        raise ValueError("immutable numbered version required")
    if not identifier or not math.isfinite(deadline):
        raise ValueError("identifier and monotonic deadline required")
    if clock() >= deadline:
        return Decision(False, None, "deadline")
    try:
        result = client.apply_guardrail(guardrailIdentifier=identifier, guardrailVersion=version,
            source=source, content=[{"text": {"text": text}}])
        if clock() >= deadline:
            return Decision(False, None, "deadline")
        action = result.get("action")
        outputs = result.get("outputs", [])
        if (not isinstance(outputs, list) or len(outputs) > 8
                or any(not isinstance(o, dict) or not isinstance(o.get("text"), str) for o in outputs)):
            return Decision(False, None, "invalid_response")
        transformed = tuple(o["text"] for o in outputs)
        if sum(map(len, transformed)) > 16000:
            return Decision(False, None, "invalid_response")
        if action == "GUARDRAIL_INTERVENED":
            # Both block messages and anonymized content can appear here. Deny both.
            return Decision(False, None, "intervened", transformed)
        if action == "NONE" and not transformed:
            return Decision(True, text, "allowed")
        return Decision(False, None, "invalid_response")
    except Exception:
        return Decision(False, None, "unavailable")


def create_draft(control, name, operation_id):
    """Administrative call; persist the operation ID before calling."""
    if not re.fullmatch(r"[A-Za-z0-9-]{1,50}", name) or not re.fullmatch(r"[A-Za-z0-9-]{8,64}", operation_id):
        raise ValueError("bounded name and stable operation ID required")
    return control.create_guardrail(name=name, clientRequestToken=operation_id,
        blockedInputMessaging="This request needs review.",
        blockedOutputsMessaging="This answer needs review.",
        sensitiveInformationPolicyConfig={"piiEntitiesConfig": [
            {"type": "EMAIL", "action": "ANONYMIZE"},
            {"type": "US_SOCIAL_SECURITY_NUMBER", "action": "BLOCK"}]})


def snapshot(control, identifier, operation_id):
    if not re.fullmatch(r"[A-Za-z0-9-]{8,64}", operation_id):
        raise ValueError("stable operation ID required")
    if control.get_guardrail(guardrailIdentifier=identifier, guardrailVersion="DRAFT").get("status") != "READY":
        raise RuntimeError("draft not ready")
    result = control.create_guardrail_version(guardrailIdentifier=identifier,
        description="Synthetic PII boundary lab", clientRequestToken=operation_id)
    version = result.get("version", "")
    if not isinstance(version, str) or not re.fullmatch(r"[1-9][0-9]{0,7}", version):
        raise RuntimeError("numbered version missing; reconcile before retrying")
    return version
