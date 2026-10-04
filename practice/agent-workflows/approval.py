"""Opaque-session approval ledger. Session issuance is a trusted server operation."""
from contextlib import closing
import hashlib
import json
import secrets
import sqlite3
import time


def payload_hash(payload):
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), allow_nan=False)
    if len(encoded) > 8000:
        raise ValueError("payload_too_large")
    return hashlib.sha256(encoded.encode()).hexdigest(), encoded


class Approvals:
    def __init__(self, path, clock=time.time):
        self.path, self.clock = path, clock
        with closing(self.connect()) as db, db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY, actor TEXT, tenant TEXT,
                    can_approve INTEGER, expires REAL);
                CREATE TABLE IF NOT EXISTS approvals (
                    id TEXT PRIMARY KEY, tenant TEXT, payload TEXT, hash TEXT,
                    expires REAL, status TEXT, reviewer TEXT);
            """)

    def connect(self):
        db = sqlite3.connect(self.path, timeout=1)
        db.row_factory = sqlite3.Row
        return db

    def issue_session(self, verified_actor, tenant, can_approve, ttl=300):
        # Call only after identity verification. This is not a public login route.
        if type(can_approve) is not bool or not 0 < ttl <= 3600:
            raise ValueError("invalid_session")
        token = secrets.token_urlsafe(32)
        with closing(self.connect()) as db, db:
            db.execute("INSERT INTO sessions VALUES (?,?,?,?,?)",
                       (hashlib.sha256(token.encode()).hexdigest(), verified_actor, tenant,
                        can_approve, self.clock() + ttl))
        return token

    def revoke(self, token):
        with closing(self.connect()) as db, db:
            db.execute("DELETE FROM sessions WHERE token_hash=?",
                       (hashlib.sha256(token.encode()).hexdigest(),))

    def propose(self, tenant, payload, ttl=300):
        if not 0 < ttl <= 3600:
            raise ValueError("invalid_expiry")
        digest, encoded = payload_hash(payload)
        operation = secrets.token_hex(16)
        with closing(self.connect()) as db, db:
            db.execute("INSERT INTO approvals VALUES (?,?,?,?,?,?,NULL)",
                       (operation, tenant, encoded, digest, self.clock()+ttl, "pending"))
        return {"id": operation, "hash": digest}

    def invalidate(self, operation):
        # Internal operation when source versions, destination or intent change.
        with closing(self.connect()) as db, db:
            db.execute("UPDATE approvals SET status='invalidated' WHERE id=? "
                       "AND status IN ('pending','approved')", (operation,))

    def checked(self, db, token, operation, digest):
        if not isinstance(token, str) or not 20 <= len(token) <= 256:
            raise PermissionError("invalid_session")
        actor = db.execute("SELECT * FROM sessions WHERE token_hash=?",
                           (hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
        if not actor or actor["expires"] <= self.clock() or not actor["can_approve"]:
            raise PermissionError("approval_forbidden")
        item = db.execute("SELECT * FROM approvals WHERE id=? AND tenant=?",
                          (operation, actor["tenant"])).fetchone()
        if not item or item["hash"] != digest or item["expires"] <= self.clock():
            raise PermissionError("stale_or_unknown_approval")
        return actor, item

    def decide(self, token, operation, digest, approved):
        if type(approved) is not bool:
            raise ValueError("explicit_boolean_required")
        target = "approved" if approved else "rejected"
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            actor, item = self.checked(db, token, operation, digest)
            if item["status"] == target and item["reviewer"] == actor["actor"]:
                return target
            if item["status"] != "pending":
                raise ValueError("decision_conflict")
            db.execute("UPDATE approvals SET status=?,reviewer=? WHERE id=?",
                       (target, actor["actor"], operation))
        return target

    def claim_resume(self, token, operation, current_payload):
        digest, _ = payload_hash(current_payload)
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            actor, item = self.checked(db, token, operation, digest)
            if item["status"] != "approved":
                raise ValueError("not_resumable")
            db.execute("UPDATE approvals SET status='resume_claimed' WHERE id=?", (operation,))
            return {"operation_id": operation, "reviewer": item["reviewer"],
                    "tenant": item["tenant"], "payload": json.loads(item["payload"])}

    def resume_checked(self, token, operation, current_payload, graph, trusted_config):
        """trusted_config is looked up by the server, never copied from the request."""
        from langgraph.types import Command
        snapshot = graph.get_state(trusted_config)
        if snapshot.values.get("operation") != operation or not snapshot.interrupts:
            raise ValueError("run_not_waiting_for_this_operation")
        # Check tenant before consuming. checked() performs current session validation.
        digest, _ = payload_hash(current_payload)
        with closing(self.connect()) as db:
            _, item = self.checked(db, token, operation, digest)
            if snapshot.values.get("tenant") != item["tenant"]:
                raise PermissionError("run_tenant_mismatch")
        approved = self.claim_resume(token, operation, current_payload)
        # On a crash here, resume_claimed is durable evidence for operator recovery.
        # Never automatically clear it or issue another external effect.
        return graph.invoke(Command(resume=True), trusted_config), approved
