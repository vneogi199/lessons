import json
from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from retry import Failure, Retryable, RetryPolicy, retry_read


class ParsedRFQ(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    instrument: str = Field(pattern=r"^[A-Z0-9-]{1,24}$")
    quantity: int = Field(ge=1, le=1_000_000)


@dataclass(frozen=True)
class Reply:
    status: str  # complete, refusal, truncated: mapped by the provider adapter
    text: str = ""


def decode(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate_key")
            result[key] = value
        return result

    def invalid(_):
        raise ValueError("nonfinite_number")
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)


async def parse_rfq(provider, source, allowed_instruments, policy=RetryPolicy(), **retry_options):
    """provider is an async, read-only generation adapter; never an agent with tools."""
    if not isinstance(source, str) or not 1 <= len(source) <= 8000:
        raise Failure("invalid_source")

    async def attempt(number, previous_code):
        reply = await provider({"source": source, "schema": ParsedRFQ.model_json_schema(),
                                "repair_code": previous_code})
        if not isinstance(reply, Reply):
            raise Failure("invalid_provider_contract")
        if reply.status == "refusal":
            raise Failure("refusal")
        if reply.status == "truncated":
            raise Failure("truncated")
        if reply.status != "complete":
            raise Failure("invalid_provider_status")
        if not isinstance(reply.text, str) or len(reply.text) > 4096:
            raise Failure("output_too_large")
        try:
            data = decode(reply.text)
        except (ValueError, RecursionError) as exc:
            raise Retryable("malformed_json") from exc
        try:
            return ParsedRFQ.model_validate(data)
        except ValidationError as exc:
            raise Retryable("schema_failure") from exc

    parsed = await retry_read(attempt, policy, **retry_options)
    # Authorization/business rejection is outside the repair/retry loop.
    if parsed.instrument not in allowed_instruments:
        raise Failure("instrument_forbidden")
    return parsed
