# Keep permissions across every retrieval expansion

This exact, in-memory fixture implements lexical overlap, cosine vector ranking and one-hop graph expansion over the same protected records. It is a boundary exercise, not a scalable database adapter. The corpus is capped at 100 documents; context is capped at eight documents and 20,000 characters. Fake vectors test access paths, not embedding quality.

A record has tenant, reader IDs, content version, deletion flag, optional parent and graph neighbors. Authentication happens before calling `ask`: never take tenant/user from model arguments. All retrieval modes start with permitted records. A readable child does not make its parent readable. An edge to another tenant does not authorize reading its target.

The reranker receives only permitted content and can return only IDs from that set. Permissions are checked again before generation and release. `replace` changes the corpus/permission revision and clears the answer cache. Cache keys include tenant, user, revision, mode and query. Cached dependencies are rechecked before return. The example assumes all updates pass through this method and one synchronous owner controls state; a distributed service needs authoritative revisions and invalidation, not a per-process dictionary.

Worked case: user u in tenant a may read `child`, but not `parent`. The child's graph points to a different tenant's record and a deleted record. Every retrieval mode exposes only `child` to the reranker and generator. Revoking u empties the result even if an answer was previously cached. Deletion during generation prevents release of the already-generated text.

In a real lexical/vector/graph service, push the authorization filter into its query. A filter after a hosted reranker or model has already seen the text is too late. Apply the same rule to candidate logs, snippets, parent expansion and caches. Avoid leaking hidden-node names in client-visible graph explanations. A callback that always returns True is not an authorization implementation.

Tests include all three paths, cross-tenant neighbors, forbidden parents, deleted records, cache revocation, changes during generation and invented reranker IDs. They are supplied but unexecuted. After approval, run `python3 -m unittest -v` from this directory. Production login and database-policy verification remain separate integration work.

Interview: why recheck a cached answer's dependencies? The cache can outlive the user's permission or a source version. A cache hit saves computation; it does not preserve old authority. Ask your teacher to add a permission change between reranking and generation.
