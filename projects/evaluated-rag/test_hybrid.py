import tempfile
from pathlib import Path
import unittest

from app import Error
from chunking import chunks, fixed_spans, overlap_report, semantic_spans
from hybrid import HybridStore, Postings, cosine, rrf


def synthetic_encoder(texts):
    # Hand-authored concepts for mechanics tests, not learned embeddings.
    return [[float(any(word in text.lower() for word in ("refund", "reimbursement"))),
             float("payroll" in text.lower())] for text in texts]


class HybridTests(unittest.TestCase):
    def test_postings_and_rank_fusion(self):
        index = Postings(["refund refund", "payroll", "refund"])
        self.assertEqual(index.postings["refund"], {0: 2, 2: 1})
        self.assertEqual(index.rank("absent"), [])
        self.assertEqual(set(index.rank("refund")), {0, 2})
        self.assertEqual(rrf([[0, 1], [1, 2]])[0], 1)
        self.assertNotIn(3, rrf([[0, 1], [1, 2]]))
        with self.assertRaises(ValueError):
            cosine([1, 2], [1])

    def test_chunk_provenance_and_overlap(self):
        text = "0123456789abcdefghij"
        self.assertEqual(fixed_spans(text, 10, 0), [(0, 10), (10, 20)])
        first = chunks("doc", "v1", text, fixed_spans(text, 10, 2))
        self.assertEqual(first, chunks("doc", "v1", text, fixed_spans(text, 10, 2)))
        self.assertNotEqual(first[0]["id"], chunks("doc", "v2", text, [(0, 10)])[0]["id"])
        report = overlap_report(text, [(8, 12)], 10, [0, 2])
        self.assertEqual(report[0]["gold_span_containment"], 0)
        self.assertEqual(report[1]["gold_span_containment"], 1)
        self.assertEqual(report[1]["duplicated_characters"], 4)
        source = "One. Two. " + "x" * 40
        spans = semantic_spans(source, lambda a, b: 0, size=10)
        self.assertTrue(all(b-a <= 10 for a, b in spans))
        self.assertEqual("".join(source[a:b] for a, b in spans), source)

    def test_connected_ingestion_hybrid_updates_deletes_and_scope(self):
        with tempfile.TemporaryDirectory() as directory:
            observed = []

            def encoder(texts):
                observed.extend(texts)
                return synthetic_encoder(texts)
            store = HybridStore(Path(directory) / "rag.sqlite", encoder, 2)
            document = {"id": "refund", "version": "v1", "title": "Policy",
                        "pages": ["Refunds take seven days."]}
            store.ingest("A", document)
            store.ingest("B", {**document, "pages": ["Private payroll secret."]})
            answer = store.ask("A", "reimbursement")
            self.assertEqual(answer["citations"][0]["document_id"], "refund")
            self.assertFalse(any("Private" in text for text in observed))
            store.ingest("A", {**document, "version": "v2", "pages": ["Refunds take two days."]})
            self.assertEqual(store.ask("A", "reimbursement")["citations"][0]["version"], "v2")
            store.delete("A", "refund")
            self.assertEqual(store.ask("A", "reimbursement")["citations"], [])
            with self.assertRaises(Error):
                store.ingest("A", document)

    def test_small_context_and_empty_candidates(self):
        with tempfile.TemporaryDirectory() as directory:
            store = HybridStore(Path(directory) / "rag.sqlite", synthetic_encoder, 2, context_chars=5)
            store.ingest("A", {"id": "x", "version": "v1", "title": "p", "pages": ["Refund policy"]})
            self.assertEqual(store.retrieve("A", "refund"), [])
            self.assertEqual(store.retrieve("B", "refund"), [])


if __name__ == "__main__":
    unittest.main()
