import unittest
from tracking import Tracker


class TrackingTests(unittest.TestCase):
    def setUp(self):
        self.now = 100
        self.tracker = Tracker(":memory:", b"synthetic-test-key-only-32-bytes!!", key_version="test", clock=lambda: self.now)

    def tearDown(self):
        self.tracker.close()

    def test_pseudonyms_scope_and_metrics(self):
        self.tracker.record("a", "raw-session", "error", "tool", 10)
        self.tracker.record("b", "raw-session", "error", "tool", 20)
        values = [r[0] for r in self.tracker.db.execute("SELECT session FROM outcomes")]
        self.assertNotEqual(values[0], values[1])
        self.assertNotIn("raw-session", values)
        self.assertEqual(self.tracker.aggregate(), [{"outcome": "error", "stage": "tool", "count": 2, "duration_ms_sum": 30}])

    def test_export_consent_scope_revocation(self):
        event = self.tracker.record("a", "s", "denied", "release", 1, consent=True, ttl=5)
        kwargs = dict(authorized=lambda tenant, reviewer: True, reviewer="reviewer", fixture_id="synthetic-1", dataset_version="v1")
        with self.assertRaises(PermissionError):
            self.tracker.export_failure(event, "b", **kwargs)
        _, payload = self.tracker.export_failure(event, "a", **kwargs)
        self.assertNotIn("session", payload)
        self.tracker.revoke("a", event)
        self.assertEqual(self.tracker.db.execute("SELECT count(*) FROM exports").fetchone()[0], 0)
        with self.assertRaises(PermissionError):
            self.tracker.export_failure(event, "a", **kwargs)

    def test_no_consent_and_expiry(self):
        event = self.tracker.record("a", "s", "error", "model", 1, ttl=1)
        with self.assertRaises(PermissionError):
            self.tracker.export_failure(event, "a", authorized=lambda *args: True,
                reviewer="r", fixture_id="f", dataset_version="v1")
        self.now = 101
        self.assertEqual(self.tracker.aggregate(), [])
        self.tracker.purge()
        self.assertEqual(self.tracker.db.execute("SELECT count(*) FROM outcomes").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
