"""Offline application-boundary checks, not a RabbitMQ or Kafka emulator."""

import sqlite3
import unittest


def route(kind, key, bindings):
    if kind not in ("direct", "fanout"):
        raise ValueError("this example supports direct and fanout only")
    return sorted({queue for binding, queue in bindings if kind == "fanout" or binding == key})


def retry_decision(attempt, maximum=3):
    if type(attempt) is not int or type(maximum) is not int or attempt < 1 or maximum < 1:
        raise ValueError("attempt counts start at one")
    return "retry_later" if attempt < maximum else "review"


def apply_event(db, event_id, amount, fail=False):
    # shortcut: one trusted tenant and consumer, one integer payload; a real
    # contract needs scoped identity, canonical payload checks and durable storage.
    if not isinstance(event_id, str) or not event_id or type(amount) is not int or amount <= 0:
        raise ValueError("invalid event")
    with db:
        changed = db.execute(
            "INSERT INTO inbox VALUES (?, ?) ON CONFLICT(id) DO NOTHING", (event_id, amount)
        ).rowcount
        if not changed:
            if db.execute("SELECT amount FROM inbox WHERE id=?", (event_id,)).fetchone()[0] != amount:
                raise ValueError("event ID reused with different content")
            return "duplicate"
        db.execute("UPDATE balance SET amount=amount+?", (amount,))
        if fail:
            raise RuntimeError("simulated failure before commit")
    return "applied"  # A real adapter may acknowledge only after this commit.


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript("""
            CREATE TABLE inbox (id TEXT PRIMARY KEY, amount INTEGER NOT NULL);
            CREATE TABLE balance (amount INTEGER NOT NULL);
            INSERT INTO balance VALUES (0);
        """)
        self.addCleanup(self.db.close)

    def balance(self):
        return self.db.execute("SELECT amount FROM balance").fetchone()[0]

    def test_direct_routing_and_unroutable_key(self):
        bindings = [("food", "kitchen"), ("drink", "bar")]
        self.assertEqual(route("direct", "food", bindings), ["kitchen"])
        self.assertEqual(route("direct", "unknown", bindings), [])

    def test_fanout_and_duplicate_binding(self):
        self.assertEqual(route("fanout", "food", [("x", "audit"), ("y", "billing"),
                                                  ("z", "audit")]), ["audit", "billing"])

    def test_commit_then_lost_ack(self):
        self.assertEqual(apply_event(self.db, "e17", 5), "applied")
        self.assertEqual(apply_event(self.db, "e17", 5), "duplicate")
        self.assertEqual(self.balance(), 5)

    def test_conflicting_payload_rejected(self):
        apply_event(self.db, "e17", 5)
        with self.assertRaises(ValueError):
            apply_event(self.db, "e17", 6)
        self.assertEqual(self.balance(), 5)

    def test_failed_transaction_rolls_back_inbox_and_effect(self):
        with self.assertRaises(RuntimeError):
            apply_event(self.db, "e17", 5, fail=True)
        self.assertEqual(self.balance(), 0)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM inbox").fetchone()[0], 0)
        self.assertEqual(apply_event(self.db, "e17", 5), "applied")
        self.assertEqual(self.balance(), 5)

    def test_retry_budget_and_invalid_input(self):
        self.assertEqual([retry_decision(i) for i in range(1, 13)],
                         ["retry_later", "retry_later"] + ["review"] * 10)
        for invalid in (0, -1, True):
            with self.assertRaises(ValueError):
                retry_decision(invalid)
        with self.assertRaises(ValueError):
            apply_event(self.db, "e17", True)


if __name__ == "__main__":
    unittest.main()
