import tempfile
import unittest
from pathlib import Path

from lab import Crash, OutboxLab, SagaLab


class Workflows(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)
        self.outbox = OutboxLab(self.path)
        self.saga = SagaLab(self.path)
        self.addCleanup(lambda: self.outbox.close())
        self.addCleanup(lambda: self.saga.close())

    def restart(self):
        self.outbox.close()
        self.saga.close()
        self.outbox = OutboxLab(self.path)
        self.saga = SagaLab(self.path)

    def test_producer_rollback(self):
        with self.assertRaises(Crash):
            self.outbox.create("o1", 10, fail_before_commit=True)
        self.restart()
        self.assertEqual(self.outbox.source.execute("SELECT COUNT(*) FROM orders").fetchone()[0], 0)
        self.assertFalse(self.outbox.relay_one())

    def test_committed_pending_event_survives_restart(self):
        self.outbox.create("o1", 10)
        self.restart()
        self.assertTrue(self.outbox.relay_one())
        self.assertTrue(self.outbox.consume_one())
        self.assertFalse(self.outbox.consume_one())

    def test_relay_duplicate_has_one_effect(self):
        self.outbox.create("o1", 10)
        with self.assertRaises(Crash):
            self.outbox.relay_one(crash_after_publish=True)
        self.restart()
        self.outbox.relay_one()
        self.assertEqual(self.outbox.broker.execute("SELECT COUNT(*) FROM messages").fetchone()[0], 2)
        self.outbox.consume_one()
        self.outbox.consume_one()
        self.assertEqual(self.outbox.consumer.execute("SELECT COUNT(*) FROM effects").fetchone()[0], 1)

    def test_ack_gap_after_consumer_commit(self):
        self.outbox.create("o1", 10)
        self.outbox.relay_one()
        with self.assertRaises(Crash):
            self.outbox.consume_one(crash_after_effect=True)
        self.restart()
        self.outbox.consume_one()
        self.assertEqual(self.outbox.consumer.execute("SELECT SUM(amount) FROM effects").fetchone()[0], 10)

    def test_consumer_transaction_rollback(self):
        self.outbox.create("o1", 10)
        self.outbox.relay_one()
        with self.assertRaises(Crash):
            self.outbox.consume_one(fail_before_commit=True)
        self.assertEqual(self.outbox.consumer.execute("SELECT COUNT(*) FROM inbox").fetchone()[0], 0)
        self.outbox.consume_one()

    def test_conflicting_order_rejected(self):
        self.outbox.create("o1", 10)
        self.assertFalse(self.outbox.create("o1", 10))
        with self.assertRaises(ValueError):
            self.outbox.create("o1", 11)

    def test_conflicting_event_is_not_acknowledged(self):
        self.outbox.create("o1", 10)
        self.outbox.relay_one()
        self.outbox.consume_one()
        with self.outbox.broker:
            self.outbox.broker.execute("INSERT INTO messages(event,amount) VALUES ('o1',11)")
        with self.assertRaises(ValueError):
            self.outbox.consume_one()
        self.assertEqual(self.outbox.broker.execute("SELECT COUNT(*) FROM messages WHERE acked=0").fetchone()[0], 1)

    def test_saga_success(self):
        self.saga.start("s1")
        self.assertEqual(self.saga.advance("s1"), "charge")
        self.assertEqual(self.saga.advance("s1"), "completed")
        self.assertEqual(self.saga.advance("s1"), "completed")

    def test_effect_before_checkpoint_reconciled(self):
        self.saga.start("s1")
        self.saga.advance("s1")
        with self.assertRaises(Crash):
            self.saga.advance("s1", crash_after_effect=True)
        self.restart()
        self.assertEqual(self.saga.state("s1"), "charge")
        self.assertEqual(self.saga.advance("s1"), "completed")
        self.assertEqual(self.saga.services.db.execute("SELECT COUNT(*) FROM charges").fetchone()[0], 1)

    def test_compensation_survives_restart(self):
        self.saga.start("s1")
        self.saga.advance("s1")
        self.assertEqual(self.saga.advance("s1", decline=True), "release")
        self.restart()
        with self.assertRaises(Crash):
            self.saga.advance("s1", crash_after_effect=True)
        self.restart()
        self.assertEqual(self.saga.advance("s1"), "compensated")
        self.assertEqual(self.saga.services.db.execute("SELECT active FROM reservations").fetchone()[0], 0)

    def test_failed_compensation_is_bounded_and_visible(self):
        self.saga.start("s1")
        self.saga.advance("s1")
        self.saga.advance("s1", decline=True)
        for _ in range(3):
            with self.assertRaises(ConnectionError):
                self.saga.advance("s1", unavailable=True)
            self.restart()
        self.assertEqual(self.saga.advance("s1"), "manual_review")
        self.assertEqual(self.saga.services.db.execute("SELECT active FROM reservations").fetchone()[0], 1)

    def test_validation_and_unknown_saga(self):
        with self.assertRaises(ValueError):
            self.outbox.create("o1", True)
        with self.assertRaises(ValueError):
            self.saga.start("")
        with self.assertRaises(ValueError):
            self.saga.advance("missing")


if __name__ == "__main__":
    unittest.main()
