import unittest

from model import Application, RefreshFamily, Session, VerifiedLogout


class RefreshTests(unittest.TestCase):
    def test_rotation(self):
        family = RefreshFamily(100)
        self.assertEqual(family.exchange("R0", 10), ("rotated", "R1"))
        self.assertEqual(family.exchange("R1", 20), ("rotated", "R2"))

    def test_reuse_revokes_new_token_too(self):
        family = RefreshFamily(100)
        family.exchange("R0", 10)
        self.assertEqual(family.exchange("R0", 11)[0], "reuse_detected")
        self.assertEqual(family.exchange("R1", 12)[0], "denied")

    def test_unknown_token_does_not_revoke_other_family(self):
        family = RefreshFamily(100)
        self.assertEqual(family.exchange("unknown", 10)[0], "denied")
        self.assertFalse(family.revoked)

    def test_expiry_and_explicit_revocation(self):
        family = RefreshFamily(100)
        self.assertEqual(family.exchange("R0", 100)[0], "denied")
        family = RefreshFamily(100)
        family.revoke()
        self.assertEqual(family.exchange("R0", 10)[0], "denied")

    def test_lost_response_cannot_be_safely_retried_in_this_policy(self):
        family = RefreshFamily(100)
        family.exchange("R0", 10)  # Server committed; pretend response was lost.
        self.assertEqual(family.exchange("R0", 11)[0], "reuse_detected")


class LogoutTests(unittest.TestCase):
    def setUp(self):
        self.sessions = [Session("idp", "trading", "alice", "device1"),
                         Session("idp", "trading", "alice", "device2"),
                         Session("other-idp", "trading", "alice", "device1")]
        self.app = Application("idp", "trading", self.sessions)

    def test_sid_scopes_session_and_issuer(self):
        event = VerifiedLogout("idp", "trading", "event1", sid="device1")
        self.assertEqual(self.app.deliver_verified(event), 1)
        self.assertEqual([s.active for s in self.sessions], [False, True, True])

    def test_subject_ends_multiple_sessions_for_this_issuer_and_client(self):
        event = VerifiedLogout("idp", "trading", "event2", subject="alice")
        self.assertEqual(self.app.deliver_verified(event), 2)
        self.assertTrue(self.sessions[2].active)

    def test_duplicate_delivery_is_noop(self):
        event = VerifiedLogout("idp", "trading", "event1", sid="device1")
        self.app.deliver_verified(event)
        self.assertEqual(self.app.deliver_verified(event), 0)

    def test_wrong_scope_and_missing_selector_rejected(self):
        for event in [VerifiedLogout("bad", "trading", "e", sid="device1"),
                      VerifiedLogout("idp", "reporting", "e", sid="device1"),
                      VerifiedLogout("idp", "trading", "e")]:
            with self.assertRaises(ValueError):
                self.app.deliver_verified(event)
        self.assertTrue(all(s.active for s in self.sessions))

    def test_partial_delivery_leaves_other_app_active(self):
        reporting_session = Session("idp", "reporting", "alice", "device1")
        reporting = Application("idp", "reporting", [reporting_session])
        self.app.deliver_verified(VerifiedLogout("idp", "trading", "a", sid="device1"))
        self.assertTrue(reporting_session.active)  # Reporting was unavailable.
        reporting.deliver_verified(VerifiedLogout("idp", "reporting", "b", sid="device1"))
        self.assertFalse(reporting_session.active)


if __name__ == "__main__":
    unittest.main()
