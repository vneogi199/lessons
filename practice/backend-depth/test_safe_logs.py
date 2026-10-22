import json
import logging
import unittest
from safe_logs import SafeFormatter


class SafeLogTests(unittest.TestCase):
    def record(self, message):
        return logging.LogRecord("lab", logging.INFO, "file", 1, message, (), None)

    def test_allowed_event_and_ids(self):
        record = self.record("request_complete")
        setattr(record, "dd.trace_id", "123")
        setattr(record, "dd.span_id", "456")
        output = json.loads(SafeFormatter().format(record))
        self.assertEqual(output["event"], "request_complete")
        self.assertEqual(output["dd.trace_id"], "123")

    def test_unknown_message_and_extra_fields_excluded(self):
        record = self.record("Authorization: secret-canary")
        record.customer_email = "private@example.test"
        output = SafeFormatter().format(record)
        self.assertNotIn("secret-canary", output)
        self.assertNotIn("private@example.test", output)
        self.assertIn("unclassified_event", output)

    def test_invalid_correlation_excluded(self):
        record = self.record("job_failed")
        setattr(record, "dd.trace_id", "token=secret")
        self.assertNotIn("dd.trace_id", json.loads(SafeFormatter().format(record)))

    def test_exception_text_excluded(self):
        record = self.record("job_failed")
        record.exc_text = "customer-secret"
        self.assertNotIn("customer-secret", SafeFormatter().format(record))

    def test_hex_id_preserved(self):
        record = self.record("request_complete")
        setattr(record, "dd.trace_id", "a" * 32)
        self.assertEqual(json.loads(SafeFormatter().format(record))["dd.trace_id"], "a" * 32)


if __name__ == "__main__":
    unittest.main()
