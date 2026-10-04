"""Versioned, scoped semantic-memory exercise with an injected encoder."""
from contextlib import closing
import json
import math
import sqlite3
import time


class Memory:
    def __init__(self, path, encoder, contract, dimension, clock=time.time):
        if not contract or type(dimension) is not int or dimension < 1:
            raise ValueError("invalid_embedding_contract")
        self.path, self.encoder, self.contract = path, encoder, contract
        self.dimension, self.clock = dimension, clock
        with closing(sqlite3.connect(path)) as db, db:
            db.execute("""CREATE TABLE IF NOT EXISTS memory (
                tenant TEXT, owner TEXT, topic TEXT, revision INTEGER, source TEXT,
                source_version TEXT, text TEXT, vector TEXT, contract TEXT,
                expires REAL, consent INTEGER, deleted INTEGER,
                PRIMARY KEY(tenant, owner, topic))""")

    def vector(self, text):
        vector = self.encoder(text)
        if len(vector) != self.dimension or any(not math.isfinite(x) for x in vector):
            raise ValueError("invalid_vector")
        norm = math.sqrt(sum(x*x for x in vector))
        if norm == 0:
            raise ValueError("zero_vector")
        return [x/norm for x in vector]

    def put(self, tenant, owner, topic, revision, source, source_version, text, ttl, consent):
        if (consent is not True or type(revision) is not int or revision < 1
                or not 0 < ttl <= 86400 or not 1 <= len(text) <= 2000):
            raise ValueError("invalid_memory_or_consent")
        vector = self.vector(text)
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute("BEGIN IMMEDIATE")
            old = db.execute("SELECT revision FROM memory WHERE tenant=? AND owner=? AND topic=?",
                             (tenant, owner, topic)).fetchone()
            if old and revision <= old[0]:
                raise ValueError("stale_memory_revision")
            db.execute("INSERT OR REPLACE INTO memory VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                       (tenant, owner, topic, revision, source, source_version, text,
                        json.dumps(vector), self.contract, self.clock()+ttl, 1, 0))

    def forget(self, tenant, owner, topic):
        # Retain a revision tombstone, erase the payload and vector.
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute("UPDATE memory SET text='',vector='[]',consent=0,deleted=1 "
                       "WHERE tenant=? AND owner=? AND topic=?", (tenant, owner, topic))

    def search(self, tenant, owner, query, authoritative_sources, limit=3):
        if type(limit) is not int or not 1 <= limit <= 10:
            raise ValueError("invalid_limit")
        with closing(sqlite3.connect(self.path)) as db:
            db.row_factory = sqlite3.Row
            rows = db.execute("SELECT * FROM memory WHERE tenant=? AND owner=? AND consent=1 "
                              "AND deleted=0 AND expires>? AND contract=? LIMIT 501",
                              (tenant, owner, self.clock(), self.contract)).fetchall()
        if len(rows) > 500:
            raise ValueError("memory_fixture_capacity")
        # Filter stale sources before comparing vectors or exposing text.
        rows = [r for r in rows if authoritative_sources.get(r["source"]) == r["source_version"]]
        needle = self.vector(query)
        ranked = [(sum(a*b for a, b in zip(needle, json.loads(row["vector"]))), dict(row))
                  for row in rows]
        ranked.sort(key=lambda pair: (-pair[0], pair[1]["topic"]))
        return [{k: row[k] for k in ("topic", "revision", "source", "source_version", "text")}
                for score, row in ranked[:limit] if score > 0]
