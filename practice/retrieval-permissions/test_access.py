import unittest
from dataclasses import replace
from access import Document, Retrieval


class AccessTests(unittest.TestCase):
    def setUp(self):
        self.child = Document("child", "a", "v1", "policy child", frozenset({"u"}), (1, 0),
                              parent="parent", neighbors=("private", "deleted"))
        self.store = Retrieval([self.child,
            Document("parent", "a", "v1", "secret parent", frozenset({"admin"}), (1, 0)),
            Document("private", "b", "v1", "policy private", frozenset({"u"}), (1, 0)),
            Document("deleted", "a", "v1", "policy deleted", frozenset({"u"}), (1, 0), deleted=True)])

    def ask(self, mode, rerank=None, generate=None):
        return self.store.ask("a", "u", "policy", mode=mode, vector=(1, 0),
            rerank=rerank or (lambda q, docs: tuple(d.id for d in docs)),
            generate=generate or (lambda q, docs: ";".join(d.text for d in docs)))

    def test_all_paths_hide_parent_neighbor_and_other_tenant(self):
        for mode in ("lexical", "vector", "graph"):
            observed = []
            def rerank(q, docs):
                observed.extend(d.id for d in docs)
                return tuple(d.id for d in docs)
            result = self.ask(mode, rerank=rerank)
            self.assertEqual(observed, ["child"])
            self.assertEqual(result["sources"], (("child", "v1"),))

    def test_revocation_invalidates_cache(self):
        self.ask("lexical")
        self.store.replace(replace(self.child, readers=frozenset()))
        self.assertEqual(self.ask("lexical")["status"], "insufficient_evidence")

    def test_change_during_external_stage_blocks_release(self):
        def generate(q, docs):
            self.store.replace(replace(self.child, deleted=True))
            return "stale answer"
        with self.assertRaises(PermissionError):
            self.ask("graph", generate=generate)
        self.assertEqual(self.store.cache, {})

    def test_reranker_cannot_add_document(self):
        with self.assertRaises(ValueError):
            self.ask("lexical", rerank=lambda q, docs: ("private",))


if __name__ == "__main__":
    unittest.main()
