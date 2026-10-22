"""Source-side allowlist example. It does not configure a Datadog exporter."""
import json
import logging
import re

EVENTS = {"request_complete", "dependency_timeout", "job_failed"}


class SafeFormatter(logging.Formatter):
    def format(self, record):
        event = record.msg if isinstance(record.msg, str) and record.msg in EVENTS else "unclassified_event"
        output = {"event": event, "level": record.levelname,
                  "dd.service": "rfq-api", "dd.env": "staging", "dd.version": "example"}
        for key in ("dd.trace_id", "dd.span_id"):
            value = getattr(record, key, None)
            # Preserve the SDK's string format. Accept decimal or 32-digit hex IDs.
            if isinstance(value, str) and (re.fullmatch(r"[0-9]{1,39}", value)
                                          or re.fullmatch(r"[0-9a-f]{32}", value)):
                output[key] = value
        return json.dumps(output)
