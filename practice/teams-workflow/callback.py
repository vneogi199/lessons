"""Normalized callback from one authenticated, reviewed Teams Workflow."""
import re
from uuid import UUID


def decision(claims, body, *, tenant, client_id, flow_id, approvals, session_for):
    # claims must come from a maintained JWT verifier for THIS callback API audience.
    # The calling flow is a privileged identity assertion boundary, not an arbitrary user.
    if (claims.get("tid") != tenant or claims.get("azp", claims.get("appid")) != client_id
            or "Workflow.Callback" not in claims.get("roles", []) or "scp" in claims):
        raise PermissionError("workflow identity denied")
    if not isinstance(body, dict) or set(body) != {"flow_id", "tenant", "responder_oid", "operation", "hash", "choice"}:
        raise ValueError("callback contract")
    if body["flow_id"] != flow_id or body["tenant"] != tenant:
        raise PermissionError("flow or tenant denied")
    if (not all(isinstance(v, str) for v in body.values())
            or str(UUID(body["responder_oid"])) != body["responder_oid"]
            or not re.fullmatch(r"[0-9a-f]{32}", body["operation"])
            or not re.fullmatch(r"[0-9a-f]{64}", body["hash"])
            or body["choice"] not in {"approve", "reject"}):
        raise ValueError("invalid approval payload")
    # Server-owned mapping: current local permission, never automatic enrollment.
    token = session_for(tenant, body["responder_oid"])
    return approvals.decide(token, body["operation"], body["hash"], body["choice"] == "approve")


def create_app(verify_service_token, **policy):
    import asyncio
    import json
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    app = FastAPI()

    @app.post("/teams/decision")
    async def callback(request: Request):
        try:
            async with asyncio.timeout(5):
                headers = request.headers.getlist("authorization")
                if len(headers) != 1 or not headers[0].startswith("Bearer ") or len(headers[0]) > 16000:
                    raise PermissionError("bearer token required")
                claims = await verify_service_token(headers[0][7:])
                data = bytearray()
                async for part in request.stream():
                    data.extend(part)
                    if len(data) > 4096:
                        raise ValueError("body bound")
                result = decision(claims, json.loads(data), **policy)
                return {"decision": result, "execution": "not_started"}
        except PermissionError:
            return JSONResponse({"error": "denied"}, status_code=403)
        except (ValueError, TypeError, KeyError):
            return JSONResponse({"error": "invalid_or_conflicting_decision"}, status_code=400)
        except TimeoutError:
            return JSONResponse({"error": "unavailable"}, status_code=503)
    return app
