# Local vector search with FAISS

Two arrows can point in similar directions. Here, `[1, 0]` represents one document and `[0, 1]` another. The question `[1, 0.1]` points closer to the first document. These are hand-written vectors. They do not encode language.

Read `index.py`, then predict the assertions in `test_index.py`. The package uses real FAISS APIs. It has not been executed. NumPy and FAISS must already exist in an approved environment; do not install them as part of this exercise.

The factory builds `IDMap2,Flat` with inner product. The wrapper assigns stable integer document IDs. The flat index compares every candidate. Normalizing both query and document vectors makes their dot product equal to cosine similarity. Zero vectors have no direction, so the input validator rejects them.

The service derives tenant and reader from its authenticated identity. A caller must not supply an arbitrary tenant. Search builds a temporary index containing only authorized IDs. Searching all tenants and removing unauthorized top results afterward can leave an incomplete answer. FAISS has no built-in application authorization policy.

Updates clone the current index, remove the old ID, and add the replacement. A failed native operation leaves the published index unchanged. This approach copies memory on each write. It suits a small teaching fixture, capped at 10,000 rows. The class is single-threaded; it does not provide a transaction across concurrent requests. Production code needs a writer lock or immutable generations, current ACL checks, durable metadata and resource limits.

Each save creates a new directory and returns a digest over the index and metadata. Publish the directory and digest only after the save succeeds. An interrupted save leaves an unpublished generation. There is no fsync or crash-durability claim. Load only artifacts you created and protected. FAISS binary loading is unsafe for untrusted files; a digest supplied by the uploader does not make a file trustworthy.

## Practice and acceptance

With separate permission to execute, run from this directory in a prepared environment:

```sh
python -m unittest test_index.py
```

Record Python, FAISS and NumPy versions, CPU and thread count with the result. The expected checks are stable IDs, tenant exclusion, denied readers, changed-vector ranking, delete/reload behavior, invalid inputs and exact recall of 1.0 on the two tie-free fixture queries. This is an expected result, not an observed run.

`measure` compares results with a NumPy exhaustive baseline. Its timer includes permission-subset construction. Collect enough repeated queries after warm-up to make p95 useful; two queries only check the interface. Exact neighbor recall does not measure whether retrieved text answers a question.

As a later extension, compare a separately constructed IVF or HNSW index against this flat baseline. IVF needs representative training vectors. Increase `nprobe` to explore its recall/latency tradeoff. Do not replace the factory string here without adapting update/delete, training and filtering behavior. Index types do not support identical operations.

Interview practice: Why can a faster approximate index return fewer useful results after a permission filter? The approximate candidate set can miss authorized neighbors; filtering cannot recover missing candidates. Compare prefiltered search, allowed-ID selectors supported by the selected index, or overfetch with a documented recall budget.

Which test proves language retrieval quality: A. Exact vector recall. B. Labeled question relevance. **Answer: B.** The first checks neighbor search; the second checks whether documents answer the user's question. Ask your teacher to review your explanation and a changed-permission example.

Primary sources: [factory composition](https://github.com/facebookresearch/faiss/wiki/The-index-factory), [ID removal and reconstruction](https://github.com/facebookresearch/faiss/wiki/Special-operations-on-indexes), [serialization security](https://github.com/facebookresearch/faiss/wiki/Index-IO%2C-cloning-and-hyper-parameter-tuning).
