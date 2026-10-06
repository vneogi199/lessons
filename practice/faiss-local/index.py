"""Small, single-process cosine index. Trusted local artifacts only."""
import hashlib
import json
from pathlib import Path
from time import perf_counter

import faiss
import numpy as np


def unit(values, dimension):
    array = np.asarray(values, dtype="float32")
    if array.shape != (dimension,) or not np.isfinite(array).all():
        raise ValueError("invalid vector")
    norm = float(np.linalg.norm(array.astype("float64")))
    if not norm:
        raise ValueError("zero vector")
    return np.ascontiguousarray(array / norm, dtype="float32")


class Store:
    def __init__(self, dimension):
        if type(dimension) is not int or not 1 <= dimension <= 4096:
            raise ValueError("invalid dimension")
        self.dimension = dimension
        self.index = faiss.index_factory(dimension, "IDMap2,Flat", faiss.METRIC_INNER_PRODUCT)
        self.rows = {}

    def put(self, identifier, vector, *, tenant, readers):
        if type(identifier) is not int or not 0 <= identifier < 2**63:
            raise ValueError("invalid ID")
        if not isinstance(tenant, str) or not tenant or len(tenant) > 100:
            raise ValueError("invalid tenant")
        if not isinstance(readers, (list, tuple, set, frozenset)) or not 1 <= len(readers) <= 100:
            raise ValueError("invalid readers")
        if any(not isinstance(reader, str) or not reader or len(reader) > 100 for reader in readers):
            raise ValueError("invalid reader")
        value = unit(vector, self.dimension)
        if identifier not in self.rows and len(self.rows) >= 10000:
            raise ValueError("fixture capacity exceeded")
        if identifier in self.rows and self.rows[identifier]["tenant"] != tenant:
            raise ValueError("ID belongs to another tenant")
        # Publish a replacement only after every native operation succeeds.
        replacement = faiss.clone_index(self.index)
        replacement.remove_ids(np.array([identifier], dtype="int64"))
        replacement.add_with_ids(value[None, :], np.array([identifier], dtype="int64"))
        self.index = replacement
        self.rows[identifier] = {"tenant": tenant, "readers": sorted(set(readers))}

    def delete(self, identifier):
        removed = self.index.remove_ids(np.array([identifier], dtype="int64"))
        self.rows.pop(identifier, None)
        return int(removed)

    def search(self, query, *, tenant, reader, k=3):
        if type(k) is not int or not 1 <= k <= 100:
            raise ValueError("invalid k")
        query = unit(query, self.dimension)
        allowed = [key for key, row in self.rows.items()
                   if row["tenant"] == tenant and reader in row["readers"]]
        if not allowed:
            return []
        # ponytail: rebuild an authorized flat subset per query; partition/index
        # allowed IDs when this O(n*d) allocation becomes too expensive.
        subset = faiss.index_factory(self.dimension, "IDMap2,Flat", faiss.METRIC_INNER_PRODUCT)
        values = np.stack([self.index.reconstruct(key) for key in allowed])
        subset.add_with_ids(values, np.asarray(allowed, dtype="int64"))
        scores, identifiers = subset.search(query[None, :], min(k, len(allowed)))
        return [(int(key), float(score)) for key, score in zip(identifiers[0], scores[0])]

    def save(self, directory):
        """Create an immutable generation; caller publishes its path after success."""
        directory = Path(directory)
        directory.mkdir(mode=0o700, parents=False, exist_ok=False)
        payload = bytes(faiss.serialize_index(self.index))
        metadata = json.dumps({"dimension": self.dimension, "rows": self.rows}, sort_keys=True).encode()
        (directory / "index.faiss").write_bytes(payload)
        (directory / "rows.json").write_bytes(metadata)
        return hashlib.sha256(payload + metadata).hexdigest()

    @classmethod
    def load(cls, directory, expected_digest):
        """Digest must come from trusted storage, never from an uploaded sibling file."""
        directory = Path(directory)
        paths = [directory / "index.faiss", directory / "rows.json"]
        if any(path.stat().st_size > 200_000_000 for path in paths):
            raise ValueError("artifact too large")
        payload, metadata = [path.read_bytes() for path in paths]
        if hashlib.sha256(payload + metadata).hexdigest() != expected_digest:
            raise ValueError("artifact mismatch")
        record = json.loads(metadata)
        result = cls(record["dimension"])
        index = faiss.deserialize_index(np.frombuffer(payload, dtype="uint8").copy())
        rows = {int(key): value for key, value in record["rows"].items()}
        if index.d != result.dimension or index.ntotal != len(rows):
            raise ValueError("metadata mismatch")
        if set(faiss.vector_to_array(index.id_map).tolist()) != set(rows):
            raise ValueError("ID mismatch")
        result.index, result.rows = index, rows
        return result


def measure(store, queries, *, tenant, reader, k=3):
    """Exact ID recall, not semantic relevance. Inputs must have no boundary ties."""
    eligible = [key for key, row in store.rows.items()
                if row["tenant"] == tenant and reader in row["readers"]]
    if not eligible or not queries:
        raise ValueError("need eligible rows and queries")
    vectors = np.stack([store.index.reconstruct(key) for key in eligible])
    recalls, durations = [], []
    for query in queries:
        scores = vectors @ unit(query, store.dimension)
        expected = {eligible[int(position)] for position in np.argsort(-scores)[:k]}
        start = perf_counter()
        observed = {key for key, _ in store.search(query, tenant=tenant, reader=reader, k=k)}
        durations.append((perf_counter() - start) * 1000)
        recalls.append(len(expected & observed) / len(expected))
    return {"recall_at_k": float(np.mean(recalls)),
            "p95_ms": float(np.percentile(durations, 95)), "queries": len(queries)}
