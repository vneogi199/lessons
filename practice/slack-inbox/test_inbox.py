import hashlib
import hmac
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from inbox import Inbox, decode


class InboxTests(unittest.TestCase):
    def test_signature_tamper_and_old_timestamp(self):
        raw, secret = b'{"type":"url_verification","challenge":"abc"}', b"synthetic-secret-123"
        signature = "v0=" + hmac.new(secret, b"v0:1000:" + raw, hashlib.sha256).hexdigest()
        self.assertEqual(decode(raw, "1000", signature, secret, "application/json", now=1000)["challenge"], "abc")
        for body, now in [(raw + b" ", 1000), (raw, 1301)]:
            with self.assertRaises(PermissionError):
                decode(body, "1000", signature, secret, "application/json", now=now)

    def test_durable_duplicate_and_payload_bound_decision(self):
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Inbox(str(Path(tmp) / "inbox.db"), "T1", "A1")
            payload = {"type": "block_actions", "team": {"id": "T1"}, "api_app_id": "A1",
                "user": {"id": "U1"}, "actions": [{"action_id": "approve", "action_ts": "1000.1",
                "value": json.dumps({"operation": "a" * 32, "hash": "b" * 64})}]}
            inbox.accept(payload)
            inbox.accept(payload)
            with inbox.connect() as db:
                rows = db.execute("SELECT id FROM inbox").fetchall()
            self.assertEqual(len(rows), 1)
            approvals, session = Mock(), Mock(return_value="server-session")
            approvals.decide.return_value = "approved"
            inbox.process_decision(rows[0][0], approvals, session)
            inbox.process_decision(rows[0][0], approvals, session)
            approvals.decide.assert_called_once_with("server-session", "a" * 32, "b" * 64, True)
            with self.assertRaises(PermissionError):
                inbox.accept({**payload, "team": {"id": "T2"}})


if __name__ == "__main__":
    unittest.main()
