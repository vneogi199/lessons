"""Bounded shopping workflow. All inventory and purchase effects are synthetic."""
import hashlib
import json
import sqlite3
from dataclasses import dataclass


CATALOG = {"book": {"price_cents": 1200, "stock": 3},
           "pen": {"price_cents": 200, "stock": 5}}


@dataclass(frozen=True)
class Proposal:
    operation: str
    user: str
    sku: str
    quantity: int
    unit_price_cents: int
    catalog_version: int

    @property
    def digest(self):
        return hashlib.sha256(json.dumps(self.__dict__, sort_keys=True,
                                         separators=(",", ":")).encode()).hexdigest()


class Shop:
    def __init__(self, path):
        self.db = sqlite3.connect(path, isolation_level=None)
        self.db.execute("PRAGMA busy_timeout=2000")
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS inventory (
                sku TEXT PRIMARY KEY, cents INTEGER, stock INTEGER, version INTEGER);
            CREATE TABLE IF NOT EXISTS orders (
                operation TEXT PRIMARY KEY, digest TEXT, user TEXT, total INTEGER);
            CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY, enabled INTEGER);
            INSERT OR IGNORE INTO control VALUES (1, 1);
        """)
        self.db.executemany("INSERT OR IGNORE INTO inventory VALUES (?, ?, ?, 1)",
                            [(sku, x["price_cents"], x["stock"]) for sku, x in CATALOG.items()])

    def close(self):
        self.db.close()

    def propose(self, user, operation, sku, quantity):
        if (not isinstance(user, str) or not 1 <= len(user) <= 80
                or not isinstance(operation, str) or not 1 <= len(operation) <= 80
                or not isinstance(sku, str) or len(sku) > 40
                or type(quantity) is not int or not 1 <= quantity <= 3):
            raise ValueError("invalid request")
        row = self.db.execute("SELECT cents, stock, version FROM inventory WHERE sku=?", (sku,)).fetchone()
        if row is None or row[1] < quantity:
            raise ValueError("unavailable")
        return Proposal(operation, user, sku, quantity, row[0], row[2])

    def purchase(self, proposal, *, authenticated_user, approved_digest, budget_cents):
        # Caller supplies identity and approval from a trusted session boundary,
        # never from model output. No real payment/shipping exists in this lab.
        if (authenticated_user != proposal.user or approved_digest != proposal.digest
                or type(budget_cents) is not int or budget_cents < 0
                or type(proposal.quantity) is not int or not 1 <= proposal.quantity <= 3):
            raise PermissionError("approval or request mismatch")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            if not self.db.execute("SELECT enabled FROM control WHERE id=1").fetchone()[0]:
                raise PermissionError("purchases paused")
            existing = self.db.execute("SELECT digest, user, total FROM orders WHERE operation=?",
                                       (proposal.operation,)).fetchone()
            if existing:
                if existing[:2] != (proposal.digest, authenticated_user):
                    raise PermissionError("operation conflict")
                self.db.execute("COMMIT")
                return {"operation": proposal.operation, "total_cents": existing[2], "replay": True}
            row = self.db.execute("SELECT cents, stock, version FROM inventory WHERE sku=?",
                                  (proposal.sku,)).fetchone()
            if (row is None or row[0] != proposal.unit_price_cents
                    or row[2] != proposal.catalog_version or row[1] < proposal.quantity):
                raise ValueError("stale proposal or insufficient stock")
            total = row[0] * proposal.quantity
            if total > budget_cents:
                raise PermissionError("budget exceeded")
            self.db.execute("UPDATE inventory SET stock=stock-?, version=version+1 WHERE sku=?",
                            (proposal.quantity, proposal.sku))
            self.db.execute("INSERT INTO orders VALUES (?, ?, ?, ?)",
                            (proposal.operation, proposal.digest, proposal.user, total))
            self.db.execute("COMMIT")
            return {"operation": proposal.operation, "total_cents": total, "replay": False}
        except Exception:
            self.db.execute("ROLLBACK")
            raise


def plan_from_tools(shop, user, operation, calls):
    """A model may propose one allowlisted tool call. It cannot purchase."""
    if not isinstance(calls, list) or len(calls) != 1:
        raise ValueError("one proposal call required")
    call = calls[0]
    if not isinstance(call, dict) or set(call) != {"name", "arguments"}:
        raise ValueError("invalid tool call")
    args = call["arguments"]
    if (call["name"] != "propose_item" or not isinstance(args, dict)
            or set(args) != {"sku", "quantity"}):
        raise ValueError("tool not allowed or invalid arguments")
    return shop.propose(user, operation, args["sku"], args["quantity"])
