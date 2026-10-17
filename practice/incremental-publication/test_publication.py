import tempfile
import unittest
from pathlib import Path

from publication import PublicationStore


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "publication.sqlite"
        self.calls = []

        def embed(text):
            self.calls.append(text)
            return [float(len(text)), 1.0]  # Fake vectors, not semantic embeddings.

        self.store = PublicationStore(self.path, embed)
        self.store.set_readers("a", "policy", 1, ["alice"])

    def tearDown(self):
        self.store.close()
        self.directory.cleanup()

    def apply(self, revision, text="policy one", **kwargs):
        return self.store.publish(self.store.stage("a", "policy", revision, text, **kwargs))

    def test_retry_and_unchanged_content_do_not_embed(self):
        self.assertTrue(self.apply(1))
        self.assertFalse(self.apply(1))
        self.assertTrue(self.apply(2))
        self.assertEqual(self.calls, ["policy one"])
        self.assertEqual(self.store.read("a", "policy", "alice")["revision"], 2)

    def test_only_changed_document_is_embedded(self):
        self.apply(1)
        self.store.publish(self.store.stage("a", "other", 1, "other text"))
        self.apply(2, "policy two")
        self.assertEqual(self.calls, ["policy one", "other text", "policy two"])

    def test_staged_old_worker_cannot_overwrite_newer_version(self):
        self.apply(1)
        old = self.store.stage("a", "policy", 2, "old worker")
        self.apply(3, "new worker")
        self.assertFalse(self.store.publish(old))
        self.assertEqual(self.store.read("a", "policy", "alice")["text"], "new worker")

    def test_deletion_survives_delayed_event(self):
        self.apply(1)
        delayed = self.store.stage("a", "policy", 2, "delayed")
        self.assertTrue(self.apply(3, "", deleted=True))
        self.assertFalse(self.store.publish(delayed))
        self.assertFalse(self.apply(2, "delayed"))
        self.assertIsNone(self.store.read("a", "policy", "alice"))

    def test_permission_change_does_not_embed_and_stale_acl_loses(self):
        self.apply(1)
        self.assertTrue(self.store.set_readers("a", "policy", 2, []))
        self.assertFalse(self.store.set_readers("a", "policy", 1, ["alice"]))
        self.assertEqual(self.calls, ["policy one"])
        self.assertIsNone(self.store.read("a", "policy", "alice"))

    def test_denies_other_actor_tenant_and_missing_acl(self):
        self.apply(1)
        self.assertIsNone(self.store.read("a", "policy", "bob"))
        self.assertIsNone(self.store.read("b", "policy", "alice"))
        self.store.publish(self.store.stage("b", "policy", 1, "private"))
        self.assertIsNone(self.store.read("b", "policy", "alice"))

    def test_failed_embedding_does_not_publish(self):
        self.apply(1)
        self.store.embed = lambda text: [float("nan")]
        with self.assertRaises(ValueError):
            self.apply(2, "bad update")
        self.assertEqual(self.store.read("a", "policy", "alice")["revision"], 1)

    def test_persistence_after_reopen(self):
        self.apply(1)
        self.store.close()
        self.store = PublicationStore(self.path, lambda text: [1.0])
        self.assertEqual(self.store.read("a", "policy", "alice")["text"], "policy one")

    def test_invalid_event_rejected(self):
        for revision in (True, 0, -1, "2", 2**63):
            with self.assertRaises(ValueError):
                self.store.stage("a", "policy", revision, "text")
        with self.assertRaises(ValueError):
            self.store.stage("a", "policy", 1, "secret", deleted=True)


if __name__ == "__main__":
    unittest.main()
