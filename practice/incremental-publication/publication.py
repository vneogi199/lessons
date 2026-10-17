"""Offline publication exercise. Callers supply trusted source events, not API input."""

import json
import math
import sqlite3
from dataclasses import dataclass


@dataclass(frozen=True)
class Staged:
    tenant: str
    document: str
    base_revision: int
    revision: int
    text: str
    vectors: str
    deleted: bool


class PublicationStore:
    # shortcut: one SQLite store and one embedding contract; use a versioned
    # external-index adapter and visibility checks before distributed deployment.
    def __init__(self, path, embed):
        self.embed = embed
        self.db = sqlite3.connect(path, isolation_level=None)
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS documents (
                tenant TEXT, document TEXT, revision INTEGER NOT NULL,
                content TEXT NOT NULL, vectors TEXT NOT NULL, deleted INTEGER NOT NULL,
                PRIMARY KEY (tenant, document)
            );
            CREATE TABLE IF NOT EXISTS permissions (
                tenant TEXT, document TEXT, revision INTEGER NOT NULL,
                readers TEXT NOT NULL, PRIMARY KEY (tenant, document)
            );
        """)

    def close(self):
        self.db.close()

    @staticmethod
    def validate_key(tenant, document, revision):
        if not isinstance(tenant, str) or not tenant.strip():
            raise ValueError("tenant is required")
        if not isinstance(document, str) or not document.strip():
            raise ValueError("document is required")
        if type(revision) is not int or not 0 < revision < 2**63:
            raise ValueError("revision must be a positive SQLite integer")

    def stage(self, tenant, document, revision, text="", deleted=False):
        """Compute changed vectors before publication. Never modify current content."""
        self.validate_key(tenant, document, revision)
        if not isinstance(text, str) or len(text) > 10000 or type(deleted) is not bool:
            raise ValueError("invalid bounded document")
        if deleted and text:
            raise ValueError("a tombstone cannot contain text")
        if not deleted and not text.strip():
            raise ValueError("empty documents need an explicit tombstone")
        current = self.db.execute(
            "SELECT revision, content, vectors, deleted FROM documents "
            "WHERE tenant=? AND document=?", (tenant, document)
        ).fetchone()
        base = current[0] if current else 0
        if revision <= base:
            return None  # Already applied or stale; do not embed again.
        if deleted:
            vectors = "[]"
        elif current and not current[3] and current[1] == text:
            vectors = current[2]
        else:
            # Each nonempty line is a chunk in this deliberately small exercise.
            chunks = [line for line in text.splitlines() if line.strip()]
            if len(chunks) > 100:
                raise ValueError("too many chunks")
            values = [list(self.embed(chunk)) for chunk in chunks]
            if not values or not values[0] or any(
                len(v) != len(values[0]) or any(
                    type(n) not in (int, float) or not math.isfinite(n) for n in v
                ) for v in values
            ):
                raise ValueError("embeddings must be finite, nonempty, equal-size vectors")
            vectors = json.dumps(values, allow_nan=False)
        return Staged(tenant, document, base, revision, text, vectors, deleted)

    def publish(self, staged):
        """Atomically publish only if the source version used for staging still holds."""
        if staged is None:
            return False
        self.db.execute("BEGIN IMMEDIATE")
        try:
            row = self.db.execute(
                "SELECT revision FROM documents WHERE tenant=? AND document=?",
                (staged.tenant, staged.document)
            ).fetchone()
            current = row[0] if row else 0
            if current != staged.base_revision or staged.revision <= current:
                self.db.execute("ROLLBACK")
                return False  # Reload state and restage a still-current source event.
            self.db.execute(
                "INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?) "
                "ON CONFLICT(tenant, document) DO UPDATE SET "
                "revision=excluded.revision, content=excluded.content, "
                "vectors=excluded.vectors, deleted=excluded.deleted",
                (staged.tenant, staged.document, staged.revision, staged.text,
                 staged.vectors, int(staged.deleted))
            )
            self.db.execute("COMMIT")
            return True
        except Exception:
            self.db.execute("ROLLBACK")
            raise

    def set_readers(self, tenant, document, revision, readers):
        """ACL revision is independent of content revision; stale ACL events lose."""
        self.validate_key(tenant, document, revision)
        if not isinstance(readers, (list, tuple)) or len(readers) > 100:
            raise ValueError("provide a bounded reader list")
        if any(not isinstance(r, str) or not r.strip() for r in readers):
            raise ValueError("invalid reader")
        result = self.db.execute(
            "INSERT INTO permissions VALUES (?, ?, ?, ?) "
            "ON CONFLICT(tenant, document) DO UPDATE SET "
            "revision=excluded.revision, readers=excluded.readers "
            "WHERE excluded.revision > permissions.revision",
            (tenant, document, revision, json.dumps(sorted(set(readers))))
        )
        return result.rowcount == 1

    def read(self, tenant, document, actor):
        """Permission-aware snapshot read, not an authorization-to-delivery transaction."""
        row = self.db.execute(
            "SELECT d.revision, d.content, p.readers FROM documents d "
            "JOIN permissions p ON d.tenant=p.tenant AND d.document=p.document "
            "WHERE d.tenant=? AND d.document=? AND d.deleted=0", (tenant, document)
        ).fetchone()
        if row is None or actor not in json.loads(row[2]):
            return None
        return {"revision": row[0], "text": row[1]}
