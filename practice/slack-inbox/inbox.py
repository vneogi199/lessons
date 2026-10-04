"""Signed Slack ingress and a durable single-host inbox. No external effects."""
import hashlib
import hmac
import json
import re
import sqlite3
import time
from contextlib import closing
from urllib.parse import parse_qs


def decode(raw, timestamp, signature, secret, content_type, *, now):
    if (not isinstance(raw, bytes) or len(raw) > 32768 or not re.fullmatch(r"[0-9]{1,12}", timestamp)
            or abs(now - int(timestamp)) > 300 or not re.fullmatch(r"v0=[0-9a-f]{64}", signature)):
        raise PermissionError("invalid signed envelope")
    expected = "v0=" + hmac.new(secret, b"v0:" + timestamp.encode() + b":" + raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise PermissionError("invalid signature")
    if content_type == "application/json":
        payload = json.loads(raw)
    elif content_type == "application/x-www-form-urlencoded":
        form = parse_qs(raw.decode("utf-8"), strict_parsing=True, max_num_fields=2)
        if set(form) != {"payload"} or len(form["payload"]) != 1:
            raise ValueError("one interaction payload required")
        payload = json.loads(form["payload"][0])
    else:
        raise ValueError("unsupported content type")
    if not isinstance(payload, dict):
        raise ValueError("object payload required")
    return payload


class Inbox:
    def __init__(self, path, team, app, *, clock=time.time):
        self.path, self.team, self.app, self.clock = path, team, app, clock
        with closing(self.connect()) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS inbox (id TEXT PRIMARY KEY, digest TEXT, body TEXT, status TEXT, received REAL)")

    def connect(self):
        return sqlite3.connect(self.path, timeout=.2)

    def accept(self, payload):
        # URL verification has no team/app fields; the dedicated signed endpoint binds this app.
        if payload.get("type") == "url_verification":
            challenge = payload.get("challenge")
            if not isinstance(challenge, str) or not 1 <= len(challenge) <= 200:
                raise ValueError("invalid challenge")
            return {"challenge": challenge}
        team = payload.get("team_id") or payload.get("team", {}).get("id")
        if team != self.team or payload.get("api_app_id") != self.app:
            raise PermissionError("workspace or app denied")
        if payload.get("type") == "event_callback":
            event = payload.get("event", {})
            if event.get("type") != "app_mention" or event.get("bot_id") or event.get("subtype"):
                raise ValueError("unsupported event")
            event_id = payload.get("event_id", "")
            if not isinstance(event_id, str) or not re.fullmatch(r"Ev[A-Za-z0-9]{1,60}", event_id):
                raise ValueError("invalid event ID")
            body = {"kind": "mention", "team": team, "user": event.get("user"),
                    "channel": event.get("channel"), "text": event.get("text"), "ts": event.get("ts")}
        elif payload.get("type") == "block_actions":
            actions = payload.get("actions")
            if not isinstance(actions, list) or len(actions) != 1:
                raise ValueError("one action required")
            action = actions[0]
            if action.get("action_id") not in {"approve", "reject"}:
                raise ValueError("unsupported action")
            intent = json.loads(action["value"])
            if (set(intent) != {"operation", "hash"} or
                    not re.fullmatch(r"[0-9a-f]{32}", intent["operation"]) or
                    not re.fullmatch(r"[0-9a-f]{64}", intent["hash"])):
                raise ValueError("exact proposal ID and hash required")
            body = {"kind": "decision", "team": team, "user": payload.get("user", {}).get("id"),
                    "operation": intent["operation"], "hash": intent["hash"],
                    "choice": action["action_id"], "ts": action.get("action_ts")}
            event_id = "action:" + hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
        else:
            raise ValueError("unsupported payload")
        if any(not isinstance(v, str) or not 1 <= len(v) <= 8000 for v in body.values()):
            raise ValueError("invalid normalized fields")
        encoded = json.dumps(body, sort_keys=True)
        digest = hashlib.sha256(encoded.encode()).hexdigest()
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            old = db.execute("SELECT digest FROM inbox WHERE id=?", (event_id,)).fetchone()
            if old and old[0] != digest:
                raise ValueError("event ID reused with different intent")
            if not old:
                if db.execute("SELECT count(*) FROM inbox").fetchone()[0] >= 10000:
                    raise RuntimeError("inbox capacity reached")
                db.execute("INSERT INTO inbox VALUES (?,?,?,'pending',?)", (event_id, digest, encoded, self.clock()))
        return {}  # Returned only after commit. Duplicate delivery is acknowledged without re-enqueue.

    def process_decision(self, event_id, approvals, session_for):
        with closing(self.connect()) as db:
            row = db.execute("SELECT body,status FROM inbox WHERE id=?", (event_id,)).fetchone()
        if not row or row[1] != "pending":
            return
        body = json.loads(row[0])
        if body["kind"] != "decision":
            raise ValueError("mention needs a separate read-only handler")
        # Map verified Slack workspace/user to a CURRENT local authorized session.
        token = session_for(body["team"], body["user"])
        result = approvals.decide(token, body["operation"], body["hash"], body["choice"] == "approve")
        # Replay after a crash is safe because Approvals.decide is idempotent for this reviewer/choice.
        with closing(self.connect()) as db, db:
            db.execute("UPDATE inbox SET status=? WHERE id=?", (result, event_id))


def create_app(inbox, signing_secret):
    import asyncio
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    if not isinstance(signing_secret, bytes) or len(signing_secret) < 16:
        raise ValueError("injected signing secret required")
    app = FastAPI()

    @app.post("/slack/events")
    async def receive(request: Request):
        try:
            async with asyncio.timeout(2):
                if request.headers.get("content-encoding", "identity") != "identity":
                    raise ValueError("compressed requests unsupported")
                for name in ("x-slack-request-timestamp", "x-slack-signature"):
                    if len(request.headers.getlist(name)) != 1:
                        raise PermissionError("one signature envelope required")
                raw = bytearray()
                async for chunk in request.stream():
                    raw.extend(chunk)
                    if len(raw) > 32768:
                        raise ValueError("body bound")
                payload = decode(bytes(raw), request.headers["x-slack-request-timestamp"],
                    request.headers["x-slack-signature"], signing_secret,
                    request.headers.get("content-type", "").split(";")[0], now=inbox.clock())
                result = await asyncio.to_thread(inbox.accept, payload)
                return JSONResponse(result)
        except PermissionError:
            return JSONResponse({"error": "denied"}, status_code=403)
        except (ValueError, KeyError, TypeError, AttributeError):
            return JSONResponse({"error": "invalid_request"}, status_code=400)
        except (TimeoutError, sqlite3.Error, RuntimeError):
            return JSONResponse({"error": "retry_later"}, status_code=503)
    return app
