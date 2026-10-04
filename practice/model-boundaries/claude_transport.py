"""Explicit opt-in Claude HTTP adapter. Construct only in an approved environment."""
import json

import httpx

from retry import Failure, Retryable, retry_read
from structured import decode


class ClaudeTransport:
    def __init__(self, client, api_key, model):
        if not api_key or not model:
            raise ValueError("credential_and_model_required")
        self.client, self.api_key, self.model = client, api_key, model

    async def post(self, path, payload):
        if path not in {"/v1/messages", "/v1/messages/count_tokens"}:
            raise Failure("unsupported_endpoint")

        async def operation(attempt, previous):
            try:
                async with self.client.stream(
                    "POST", "https://api.anthropic.com" + path,
                    headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01"},
                    json={**payload, "model": self.model},
                    timeout=httpx.Timeout(4, connect=2), follow_redirects=False) as response:
                    if response.status_code in {429, 500, 502, 503, 504, 529}:
                        raise Retryable("provider_transient", response.headers.get("Retry-After"))
                    if response.status_code != 200:
                        raise Failure("provider_rejected")
                    raw = bytearray()
                    async for chunk in response.aiter_bytes(chunk_size=4096):
                        if len(raw) + len(chunk) > 100_000:
                            raise Failure("provider_body_too_large")
                        raw.extend(chunk)
                    try:
                        result = decode(raw)
                    except (ValueError, RecursionError) as exc:
                        raise Failure("invalid_provider_json") from exc
                    if not isinstance(result, dict):
                        raise Failure("invalid_provider_contract")
                    return result
            except httpx.TransportError as exc:
                # Generation has no client-side tools attached at the provider.
                # Repeating it may still incur a second bill.
                raise Retryable("provider_transport") from exc
        return await retry_read(operation)

    async def count(self, system, messages, tools):
        result = await self.post("/v1/messages/count_tokens", {
            "system": system, "messages": messages, "tools": tools})
        count = result.get("input_tokens")
        if type(count) is not int or count < 0:
            raise Failure("invalid_token_count")
        return count

    async def generate(self, system, messages, tools, max_tokens):
        return await self.post("/v1/messages", {"system": system, "messages": messages,
                               "tools": tools, "max_tokens": max_tokens})


def usage_comparison(counted, usage):
    names = ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens",
             "output_tokens")
    values = {name: usage.get(name, 0) for name in names}
    if any(type(value) is not int or value < 0 for value in values.values()):
        raise Failure("invalid_usage")
    actual_input = sum(values[name] for name in names[:3])
    return {"count_endpoint_input": counted, "response_input_total": actual_input,
            "input_delta": actual_input - counted, "usage": values}
