"""Small exact-search extension of the existing tenant-scoped RAG store."""
from collections import Counter, defaultdict
from contextlib import closing
import math
from pathlib import Path

from app import Error, Store, tokens


def cosine(left, right):
    if not left or len(left) != len(right) or any(
            not math.isfinite(value) for value in (*left, *right)):
        raise ValueError("invalid_vector_contract")
    denominator = math.sqrt(sum(x*x for x in left) * sum(x*x for x in right))
    return sum(a*b for a, b in zip(left, right)) / denominator if denominator else 0.0


class Postings:
    def __init__(self, texts):
        self.lengths, self.postings = [], defaultdict(dict)
        for index, text in enumerate(texts):
            counts = Counter(tokens(text))
            self.lengths.append(sum(counts.values()))
            for term, count in counts.items():
                self.postings[term][index] = count

    def rank(self, question):
        total = len(self.lengths)
        if not total:
            return []
        average = sum(self.lengths) / total or 1
        scores = defaultdict(float)
        for term in set(tokens(question)):
            posting = self.postings.get(term, {})
            idf = math.log(1 + (total - len(posting) + 0.5) / (len(posting) + 0.5))
            for index, tf in posting.items():
                scores[index] += idf * tf * 2.2 / (
                    tf + 1.2 * (0.25 + 0.75 * self.lengths[index] / average))
        return sorted(scores, key=lambda index: (-scores[index], index))


def rrf(rankings, k=60):
    if k < 1:
        raise ValueError("invalid_rrf_constant")
    scores = defaultdict(float)
    for ranking in rankings:
        for rank, index in enumerate(dict.fromkeys(ranking), 1):
            scores[index] += 1 / (k + rank)
    return sorted(scores, key=lambda index: (-scores[index], index))


class LocalEncoder:
    """Opt-in already-provisioned SentenceTransformer. Never fetch a model."""
    def __init__(self, model_directory):
        if not Path(model_directory).is_dir():
            raise ValueError("existing_local_model_directory_required")
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(str(model_directory), local_files_only=True,
                                         trust_remote_code=False)

    def __call__(self, texts):
        return self.model.encode(texts, normalize_embeddings=True,
                                 show_progress_bar=False).tolist()


class HybridStore(Store):
    def __init__(self, path, encoder, dimension, context_chars=2400):
        if type(dimension) is not int or dimension < 1 or context_chars < 1:
            raise ValueError("invalid_index_contract")
        super().__init__(path)
        self.encoder, self.dimension, self.context_chars = encoder, dimension, context_chars

    def retrieve(self, tenant, question):
        with closing(self.connect()) as db:
            rows = db.execute("""SELECT c.*, d.version, d.title, d.digest FROM chunks c
                JOIN documents d ON c.tenant=d.tenant AND c.id=d.id WHERE c.tenant=?
                ORDER BY c.id,c.ordinal LIMIT 501""", (tenant,)).fetchall()
        if len(rows) > 500:
            raise Error(413, "hybrid_fixture_capacity")
        if not rows or not question.strip():
            return []
        texts = [row["content"] for row in rows]
        vectors = self.encoder([question, *texts])
        if len(vectors) != len(rows) + 1 or any(len(v) != self.dimension for v in vectors):
            raise Error(500, "embedding_contract")
        scores = [cosine(vectors[0], vector) for vector in vectors[1:]]
        dense = sorted((i for i, score in enumerate(scores) if score > 0),
                       key=lambda i: (-scores[i], i))[:20]
        lexical = Postings(texts).rank(question)[:20]
        result, used = [], 0
        for index in rrf([lexical, dense]):
            row = rows[index]
            if used + len(row["content"]) > self.context_chars:
                continue
            result.append({**dict(row), "score": scores[index]})
            used += len(row["content"])
            if len(result) == 3:
                break
        return result
