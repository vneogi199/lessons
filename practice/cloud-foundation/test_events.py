import unittest
from unittest.mock import Mock
from event_handler import record


class Duplicate(Exception):
    response = {"Error": {"Code": "ConditionalCheckFailedException"}}


class EventsTests(unittest.TestCase):
    def test_duplicate_receipt_and_wrong_source(self):
        event = {"Records": [{"eventSource": "aws:s3", "eventName": "ObjectCreated:Put",
            "s3": {"bucket": {"name": "synthetic-bucket"},
                   "object": {"key": "fixtures/a+b.txt", "versionId": "v1"}}}]}
        table = Mock()
        self.assertEqual(record(event, table, "synthetic-bucket"), {"accepted": 1, "duplicates": 0})
        self.assertEqual(table.put_item.call_args.kwargs["Item"]["key"], "fixtures/a b.txt")
        table.put_item.side_effect = Duplicate()
        self.assertEqual(record(event, table, "synthetic-bucket")["duplicates"], 1)
        with self.assertRaises(ValueError):
            record(event, table, "different-bucket")


if __name__ == "__main__":
    unittest.main()
