"""Allowlisted session outcomes and reviewed failure exports. No raw traces."""
import hashlib
import hmac
import json
import secrets
import sqlite3
import time


OUTCOMES = {"success", "denied", "review", "error"}
STAGES = {"retrieval", "model", "tool", "approval", "release"}


class Tracker:
    def __init__(self, path, key, *, key_version, clock=time.time):
        if not isinstance(key, bytes) or len(key) < 32 or not key_version:
            raise ValueError("protected 32-byte key and version required")
        self.key, self.key_version, self.clock = key, key_version, clock
        self.db = sqlite3.connect(path)
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS outcomes (
                id TEXT PRIMARY KEY, tenant TEXT, session TEXT, key_version TEXT,
                outcome TEXT, stage TEXT, duration_ms INTEGER, consent INTEGER, expires REAL);
            CREATE TABLE IF NOT EXISTS exports (
                id TEXT PRIMARY KEY, source_id TEXT, payload TEXT, expires REAL);
        """)

    def close(self):
        self.db.close()

    def record(self, tenant, session, outcome, stage, duration_ms, *, consent=False, ttl=86400):
        if (not isinstance(tenant, str) or not 1 <= len(tenant) <= 100
                or not isinstance(session, str) or not 1 <= len(session) <= 200
                or outcome not in OUTCOMES or stage not in STAGES
                or type(duration_ms) is not int or not 0 <= duration_ms <= 3_600_000
                or type(consent) is not bool or type(ttl) is not int or not 1 <= ttl <= 604800):
            raise ValueError("invalid outcome")
        pseudonym = hmac.new(self.key, json.dumps([tenant, session]).encode(), hashlib.sha256).hexdigest()
        event_id = secrets.token_hex(16)
        with self.db:
            self.db.execute("INSERT INTO outcomes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (event_id, tenant, pseudonym, self.key_version, outcome, stage,
                 duration_ms, int(consent), self.clock() + ttl))
        return event_id

    def aggregate(self):
        # No tenant/user/session/prompt labels: fixed outcome x stage cardinality.
        return [{"outcome": o, "stage": s, "count": n, "duration_ms_sum": total}
                for o, s, n, total in self.db.execute("""SELECT outcome, stage, count(*), sum(duration_ms)
                    FROM outcomes WHERE expires>? GROUP BY outcome, stage""", (self.clock(),))]

    def export_failure(self, event_id, tenant, *, authorized, reviewer, fixture_id, dataset_version):
        if authorized(tenant, reviewer) is not True:
            raise PermissionError("export denied")
        if (not isinstance(fixture_id, str) or not 1 <= len(fixture_id) <= 100
                or not isinstance(dataset_version, str) or not dataset_version):
            raise ValueError("reviewed fixture and dataset version required")
        row = self.db.execute("""SELECT outcome, stage, consent, expires FROM outcomes
            WHERE id=? AND tenant=?""", (event_id, tenant)).fetchone()
        if not row or row[3] <= self.clock() or row[2] != 1 or row[0] == "success":
            raise PermissionError("no eligible consented failure")
        # Only a reviewed synthetic fixture reference is exported, never prompt/content/session.
        payload = {"dataset_version": dataset_version, "fixture_id": fixture_id,
                   "source_event_id": event_id, "outcome": row[0], "stage": row[1],
                   "reviewer": reviewer, "reviewed_at": self.clock()}
        export_id = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        with self.db:
            self.db.execute("INSERT INTO exports VALUES (?, ?, ?, ?)",
                            (export_id, event_id, json.dumps(payload), row[3]))
        return export_id, payload

    def revoke(self, tenant, event_id):
        # Trusted administrative method; authorize this call at the service boundary.
        with self.db:
            row = self.db.execute("SELECT id FROM outcomes WHERE id=? AND tenant=?", (event_id, tenant)).fetchone()
            if row:
                self.db.execute("DELETE FROM exports WHERE source_id=?", (event_id,))
                self.db.execute("DELETE FROM outcomes WHERE id=?", (event_id,))

    def purge(self):
        with self.db:
            self.db.execute("DELETE FROM exports WHERE expires<=?", (self.clock(),))
            self.db.execute("DELETE FROM outcomes WHERE expires<=?", (self.clock(),))
