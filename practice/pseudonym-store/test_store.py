import unittest
from cryptography.fernet import Fernet
from store import Vault


class VaultTests(unittest.TestCase):
    def setUp(self):
        self.now = 100
        self.vault = Vault(":memory:", Fernet.generate_key(), clock=lambda: self.now)
        self.scope = ("tenant", "user", "run")

    def tearDown(self):
        self.vault.close()

    def restore(self, token, scope=None, rescan=lambda text, scope: True):
        return self.vault.restore(scope or self.scope, token, authorized=lambda scope: True, rescan=rescan)

    def test_encrypt_restore_and_replay(self):
        token = self.vault.put(self.scope, "synthetic@example.invalid")
        sealed = self.vault.db.execute("SELECT sealed FROM mappings").fetchone()[0]
        self.assertNotIn(b"synthetic@example.invalid", sealed)
        self.assertEqual(self.restore(token), "synthetic@example.invalid")
        with self.assertRaises(PermissionError):
            self.restore(token)

    def test_scope_expiry_unknown_and_duplicate(self):
        token = self.vault.put(self.scope, "synthetic", ttl=5)
        with self.assertRaises(PermissionError):
            self.restore(token, ("other", "user", "run"))
        with self.assertRaises(ValueError):
            self.restore(token + token)
        with self.assertRaises(PermissionError):
            self.restore("[[PII:" + "0" * 32 + "]]")
        self.now = 105
        with self.assertRaises(PermissionError):
            self.restore(token)
        self.assertEqual(self.vault.purge_expired(), 1)

    def test_rescan_failure_consumes(self):
        token = self.vault.put(self.scope, "synthetic")
        with self.assertRaises(PermissionError):
            self.restore(token, rescan=lambda text, scope: False)
        with self.assertRaises(PermissionError):
            self.restore(token)


if __name__ == "__main__":
    unittest.main()
