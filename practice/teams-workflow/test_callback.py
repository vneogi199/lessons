import unittest
from unittest.mock import Mock
from callback import decision


class CallbackTests(unittest.TestCase):
    def test_identity_payload_and_decision_boundary(self):
        claims = {"tid": "tenant", "azp": "flow-client", "roles": ["Workflow.Callback"]}
        body = {"flow_id": "owned-flow", "tenant": "tenant",
                "responder_oid": "11111111-1111-1111-1111-111111111111",
                "operation": "a" * 32, "hash": "b" * 64, "choice": "approve"}
        approvals = Mock()
        policy = dict(tenant="tenant", client_id="flow-client", flow_id="owned-flow",
                      approvals=approvals, session_for=Mock(return_value="current-session"))
        decision(claims, body, **policy)
        approvals.decide.assert_called_once_with("current-session", "a" * 32, "b" * 64, True)
        for changed in ({**claims, "azp": "other"}, {**claims, "roles": []},
                        {**claims, "roles": "Workflow.Callback"}, {**claims, "scp": "user-scope"}):
            with self.assertRaises(PermissionError):
                decision(changed, body, **policy)
        with self.assertRaises(ValueError):
            decision(claims, {**body, "choice": "execute-now"}, **policy)
        approvals.decide.side_effect = PermissionError("stale hash")
        with self.assertRaises(PermissionError):
            decision(claims, {**body, "hash": "c" * 64}, **policy)


if __name__ == "__main__":
    unittest.main()
