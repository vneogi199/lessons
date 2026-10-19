"""Single-worker offline recovery lab. Fake transport/services use separate files."""
import sqlite3


class Crash(RuntimeError):
    """Injected interruption at a named committed boundary."""


def connect(path, schema):
    db = sqlite3.connect(path)
    db.executescript(schema)
    return db


def identifier(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 100:
        raise ValueError("a bounded nonempty ID is required")


class OutboxLab:
    def __init__(self, directory):
        self.source = connect(directory / "source.sqlite", """
            CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, amount INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS outbox(
                seq INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT UNIQUE NOT NULL,
                amount INTEGER NOT NULL, sent INTEGER NOT NULL DEFAULT 0);
        """)
        self.broker = connect(directory / "broker.sqlite", """
            CREATE TABLE IF NOT EXISTS messages(
                seq INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL,
                amount INTEGER NOT NULL, acked INTEGER NOT NULL DEFAULT 0);
        """)
        self.consumer = connect(directory / "consumer.sqlite", """
            CREATE TABLE IF NOT EXISTS inbox(event TEXT PRIMARY KEY, amount INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS effects(event TEXT PRIMARY KEY, amount INTEGER NOT NULL);
        """)

    def close(self):
        for db in (self.source, self.broker, self.consumer):
            db.close()

    def create(self, order, amount, fail_before_commit=False):
        identifier(order)
        if type(amount) is not int or not 0 < amount < 2**63:
            raise ValueError("amount must be a positive SQLite integer")
        with self.source:
            inserted = self.source.execute(
                "INSERT INTO orders VALUES (?, ?) ON CONFLICT(id) DO NOTHING", (order, amount)
            ).rowcount
            if not inserted:
                saved = self.source.execute("SELECT amount FROM orders WHERE id=?", (order,)).fetchone()[0]
                if saved != amount:
                    raise ValueError("order ID has conflicting intent")
                return False
            self.source.execute("INSERT INTO outbox(event, amount) VALUES (?, ?)", (order, amount))
            if fail_before_commit:
                raise Crash("before producer commit")
        return True

    def relay_one(self, crash_after_publish=False):
        # shortcut: one relay, no lease/concurrent claim; use fenced claims and
        # per-aggregate ordering before deploying multiple relay workers.
        row = self.source.execute(
            "SELECT seq, event, amount FROM outbox WHERE sent=0 ORDER BY seq LIMIT 1"
        ).fetchone()
        if row is None:
            return False
        seq, event, amount = row
        with self.broker:
            self.broker.execute("INSERT INTO messages(event, amount) VALUES (?, ?)", (event, amount))
        if crash_after_publish:
            raise Crash("broker committed; source has not recorded confirmation")
        with self.source:
            self.source.execute("UPDATE outbox SET sent=1 WHERE seq=?", (seq,))
        return True

    def consume_one(self, crash_after_effect=False, fail_before_commit=False):
        row = self.broker.execute(
            "SELECT seq, event, amount FROM messages WHERE acked=0 ORDER BY seq LIMIT 1"
        ).fetchone()
        if row is None:
            return False
        seq, event, amount = row
        with self.consumer:
            inserted = self.consumer.execute(
                "INSERT INTO inbox VALUES (?, ?) ON CONFLICT(event) DO NOTHING", (event, amount)
            ).rowcount
            saved = self.consumer.execute("SELECT amount FROM inbox WHERE event=?", (event,)).fetchone()[0]
            if saved != amount:
                raise ValueError("event ID has conflicting payload; leave for investigation")
            if inserted:
                self.consumer.execute("INSERT INTO effects VALUES (?, ?)", (event, amount))
            if fail_before_commit:
                raise Crash("before consumer commit")
        if crash_after_effect:
            raise Crash("effect committed; broker acknowledgement missing")
        with self.broker:
            self.broker.execute("UPDATE messages SET acked=1 WHERE seq=?", (seq,))
        return True


class FakeServices:
    """Trusted synthetic services: receipt lookup is authoritative, not eventually consistent."""
    def __init__(self, directory):
        self.db = connect(directory / "services.sqlite", """
            CREATE TABLE IF NOT EXISTS receipts(
                saga TEXT, action TEXT, result TEXT NOT NULL, PRIMARY KEY(saga, action));
            CREATE TABLE IF NOT EXISTS reservations(saga TEXT PRIMARY KEY, active INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS charges(saga TEXT PRIMARY KEY);
        """)

    def close(self):
        self.db.close()

    def receipt(self, saga, action):
        row = self.db.execute("SELECT result FROM receipts WHERE saga=? AND action=?", (saga, action)).fetchone()
        return row[0] if row else None

    def execute(self, saga, action, decline=False, unavailable=False):
        if action not in ("reserve", "charge", "release"):
            raise ValueError("unknown action")
        if unavailable:
            raise ConnectionError("synthetic dependency unavailable before effect")
        with self.db:
            # First write establishes the transaction before any effect lookup.
            added = self.db.execute(
                "INSERT INTO receipts VALUES (?, ?, 'ok') ON CONFLICT(saga, action) DO NOTHING",
                (saga, action)
            ).rowcount
            if not added:
                return self.receipt(saga, action)
            result = "declined" if action == "charge" and decline else "ok"
            if action == "reserve":
                self.db.execute("INSERT INTO reservations VALUES (?, 1)", (saga,))
            elif action == "charge" and not decline:
                self.db.execute("INSERT INTO charges VALUES (?)", (saga,))
            elif action == "release":
                if self.db.execute("UPDATE reservations SET active=0 WHERE saga=?", (saga,)).rowcount != 1:
                    raise ValueError("no reservation to release")
            self.db.execute("UPDATE receipts SET result=? WHERE saga=? AND action=?", (result, saga, action))
        return result


class SagaLab:
    def __init__(self, directory):
        self.db = connect(directory / "sagas.sqlite", """
            CREATE TABLE IF NOT EXISTS sagas(
                id TEXT PRIMARY KEY, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
            CREATE TABLE IF NOT EXISTS history(
                seq INTEGER PRIMARY KEY AUTOINCREMENT, saga TEXT NOT NULL,
                action TEXT NOT NULL, result TEXT NOT NULL);
        """)
        self.services = FakeServices(directory)

    def close(self):
        self.db.close()
        self.services.close()

    def start(self, saga):
        identifier(saga)
        with self.db:
            self.db.execute("INSERT INTO sagas(id, state) VALUES (?, 'reserve') ON CONFLICT(id) DO NOTHING", (saga,))

    def state(self, saga):
        row = self.db.execute("SELECT state FROM sagas WHERE id=?", (saga,)).fetchone()
        if row is None:
            raise ValueError("unknown saga")
        return row[0]

    def advance(self, saga, decline=False, unavailable=False, crash_after_effect=False):
        # shortcut: one orchestrator worker per saga, no scheduler or lease.
        # Caller retries explicitly; production needs due times and fenced ownership.
        action = self.state(saga)
        if action in ("completed", "compensated", "manual_review"):
            return action
        result = self.services.receipt(saga, action)
        if result is None:
            attempts = self.db.execute("SELECT attempts FROM sagas WHERE id=?", (saga,)).fetchone()[0]
            if attempts >= 3:
                with self.db:
                    self.db.execute("UPDATE sagas SET state='manual_review' WHERE id=?", (saga,))
                    self.db.execute("INSERT INTO history(saga, action, result) VALUES (?, ?, 'budget_exhausted')", (saga, action))
                return "manual_review"
            with self.db:
                self.db.execute("UPDATE sagas SET attempts=attempts+1 WHERE id=?", (saga,))
            result = self.services.execute(saga, action, decline, unavailable)
            if crash_after_effect:
                raise Crash("service committed; saga checkpoint missing")
        next_state = {"reserve": "charge", "charge": "completed", "release": "compensated"}[action]
        if action == "charge" and result == "declined":
            next_state = "release"
        with self.db:
            self.db.execute("INSERT INTO history(saga, action, result) VALUES (?, ?, ?)", (saga, action, result))
            self.db.execute("UPDATE sagas SET state=?, attempts=0 WHERE id=?", (next_state, saga))
        return next_state
