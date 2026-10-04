import unittest
from unittest.mock import Mock
from guardrail import apply, create_draft, snapshot


class GuardrailTests(unittest.TestCase):
    def test_input_output_and_transformed_block(self):
        client = Mock()
        client.apply_guardrail.return_value = {"action": "NONE", "outputs": []}
        for direction in ("INPUT", "OUTPUT"):
            self.assertTrue(apply(client, "test", "1", direction, "hello", deadline=10, clock=lambda: 0).allowed)
            self.assertEqual(client.apply_guardrail.call_args.kwargs["source"], direction)
        client.apply_guardrail.return_value = {"action": "GUARDRAIL_INTERVENED", "outputs": [{"text": "<EMAIL>"}]}
        decision = apply(client, "test", "1", "OUTPUT", "a@example.test", deadline=10, clock=lambda: 0)
        self.assertFalse(decision.allowed)
        self.assertIsNone(decision.text)
        self.assertEqual(decision.transformed, ("<EMAIL>",))

    def test_outage_deadline_and_bad_response_deny(self):
        client = Mock()
        client.apply_guardrail.side_effect = TimeoutError("must not leak")
        self.assertEqual(apply(client, "test", "1", "INPUT", "hello", deadline=10, clock=lambda: 0).reason, "unavailable")
        client.reset_mock(side_effect=True)
        self.assertEqual(apply(client, "test", "1", "INPUT", "hello", deadline=0, clock=lambda: 0).reason, "deadline")
        client.apply_guardrail.assert_not_called()
        client.apply_guardrail.return_value = {"action": "UNKNOWN"}
        self.assertFalse(apply(client, "test", "1", "INPUT", "hello", deadline=10, clock=lambda: 0).allowed)

    def test_admin_calls_and_readiness(self):
        control = Mock()
        create_draft(control, "lesson", "operation-001")
        self.assertEqual(control.create_guardrail.call_args.kwargs["clientRequestToken"], "operation-001")
        control.get_guardrail.return_value = {"status": "CREATING"}
        with self.assertRaises(RuntimeError):
            snapshot(control, "test", "snapshot-001")
        control.create_guardrail_version.assert_not_called()
        control.get_guardrail.return_value = {"status": "READY"}
        control.create_guardrail_version.return_value = {"version": "1"}
        self.assertEqual(snapshot(control, "test", "snapshot-001"), "1")


if __name__ == "__main__":
    unittest.main()
