"""Encrypted one-use mappings. Identity, authorization and scanning are injected."""
import json
import re
import secrets
import sqlite3
import time
from cryptography.fernet import Fernet


TOKEN = re.compile(r"\[\[PII:([0-9a-f]{32})\]\]")


class Vault:
    def __init__(self, path, key, *, clock=time.time):
        self.cipher = Fernet(key)
        self.clock = clock
        self.db = sqlite3.connect(path, isolation_level=None)
        self.db.execute("PRAGMA busy_timeout=2000")
        self.db.execute("""CREATE TABLE IF NOT EXISTS mappings (
            token TEXT PRIMARY KEY, tenant TEXT, user TEXT, run TEXT,
            expires REAL, sealed BLOB NOT NULL)""")

    def close(self):
        self.db.close()

    @staticmethod
    def check_scope(scope):
        if (not isinstance(scope, tuple) or len(scope) != 3
                or any(not isinstance(x, str) or not 1 <= len(x) <= 100 for x in scope)):
            raise ValueError("tenant/user/run scope required")

    def put(self, scope, value, *, ttl=300):
        self.check_scope(scope)
        if (not isinstance(value, str) or not 1 <= len(value) <= 2000
                or "[[PII:" in value or type(ttl) is not int or not 1 <= ttl <= 900):
            raise ValueError("invalid value or TTL")
        token = secrets.token_hex(16)
        expires = self.clock() + ttl
        payload = {"token": token, "scope": scope, "value": value, "expires": expires}
        sealed = self.cipher.encrypt(json.dumps(payload).encode())
        self.db.execute("INSERT INTO mappings VALUES (?, ?, ?, ?, ?, ?)",
                        (token, *scope, expires, sealed))
        return f"[[PII:{token}]]"

    def restore(self, scope, text, *, authorized, rescan):
        self.check_scope(scope)
        if authorized(scope) is not True:
            raise PermissionError("recipient denied")
        if not isinstance(text, str) or len(text) > 20_000:
            raise ValueError("output too large")
        tokens = TOKEN.findall(text)
        if (len(tokens) > 50 or len(set(tokens)) != len(tokens)
                or "[[PII:" in TOKEN.sub("", text)):
            raise ValueError("duplicate, malformed or excessive tokens")
        restored = {}
        self.db.execute("BEGIN IMMEDIATE")
        try:
            now = self.clock()
            for token in tokens:
                row = self.db.execute("""SELECT expires, sealed FROM mappings
                    WHERE token=? AND tenant=? AND user=? AND run=?""", (token, *scope)).fetchone()
                if row is None or row[0] <= now:
                    raise PermissionError("unknown, expired or consumed token")
                payload = json.loads(self.cipher.decrypt(row[1]))
                if (payload["token"] != token or tuple(payload["scope"]) != scope
                        or payload["expires"] != row[0]):
                    raise PermissionError("mapping envelope mismatch")
                restored[token] = payload["value"]
            self.db.executemany("DELETE FROM mappings WHERE token=?", [(t,) for t in tokens])
            self.db.execute("COMMIT")
        except Exception:
            self.db.execute("ROLLBACK")
            raise
        # Consume before scanning/release. A crash needs a new reviewed run,
        # rather than making an old token reusable.
        output = TOKEN.sub(lambda match: restored[match.group(1)], text)
        if len(output) > 100_000 or rescan(output, scope) is not True:
            raise PermissionError("output requires review")
        if authorized(scope) is not True:
            raise PermissionError("recipient revoked before release")
        return output

    def purge_expired(self):
        return self.db.execute("DELETE FROM mappings WHERE expires<=?", (self.clock(),)).rowcount
