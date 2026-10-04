import os
import unittest
from unittest.mock import Mock
from presidio_adapter import Detector, build


class InputTests(unittest.TestCase):
    def test_unsupported_inputs_fail_before_analysis(self):
        analyzer = Mock()
        detector = Detector(analyzer, Mock())
        for kwargs in ({"language": "fr"}, {"threshold": float("nan")}, {"threshold": True}):
            with self.assertRaises(ValueError):
                detector.redact("hello", **kwargs)
        with self.assertRaises(ValueError):
            detector.redact("x" * 8001)
        analyzer.analyze.assert_not_called()


@unittest.skipUnless(os.environ.get("LESSON_SPACY_MODEL"), "approved local model path required")
class LocalAssetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.detector = build(os.environ["LESSON_SPACY_MODEL"])

    def test_synthetic_entities_and_invalid_numbers(self):
        cases = [
            ("Contact a@example.test", "EMAIL_ADDRESS", True),
            ("Card 4111 1111 1111 1111", "CREDIT_CARD", True),
            ("Card 4111 1111 1111 1112", "CREDIT_CARD", False),
            ("SSN 123-45-6789", "US_SSN", True),
            ("SSN 000-00-0000", "US_SSN", False),
            ("Client CLI-123456", "CLIENT_ID", True),
            ("Client CLI-12345", "CLIENT_ID", False),
        ]
        for text, kind, expected in cases:
            with self.subTest(text=text):
                redacted, spans = self.detector.redact(text)
                self.assertEqual(any(s.kind == kind for s in spans), expected)
                if expected:
                    self.assertIn("[REDACTED]", redacted)

    def test_threshold_excludes_uncorroborated_domain_pattern(self):
        _, spans = self.detector.redact("CLI-123456", threshold=.7)
        self.assertFalse(any(s.kind == "CLIENT_ID" for s in spans))


if __name__ == "__main__":
    unittest.main()
