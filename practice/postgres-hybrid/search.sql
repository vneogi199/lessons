-- Integration recipe, NOT executed here. No installation commands.
-- Requires approved pg_search with documented 0.26+ API and pgvector.
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('pg_search', 'vector');

-- DDL only in an authorized practice schema.
CREATE TABLE hybrid_chunks (
    id bigint PRIMARY KEY,
    tenant_id bigint NOT NULL,
    document_id text NOT NULL,
    document_version integer NOT NULL,
    page integer NOT NULL CHECK (page > 0),
    body text NOT NULL,
    embedding vector(3) NOT NULL, -- toy dimension; real model must match
    active boolean NOT NULL DEFAULT true
);
CREATE INDEX hybrid_words ON hybrid_chunks
USING paradedb (id, body, tenant_id, active);
CREATE INDEX hybrid_tenant ON hybrid_chunks (tenant_id);
-- No ANN index yet: start with exact filtered cosine search.

-- Bind $1 verified tenant, $2 text, $3 nonzero vector,
-- $4 bounded per-branch limit, $5 bounded final limit.
-- Add document grants in BOTH branches for finer-grained authorization.
WITH lexical AS MATERIALIZED (
    SELECT id, pdb.score(id) AS score
    FROM hybrid_chunks
    WHERE tenant_id = $1 AND active AND body ||| $2
    ORDER BY score DESC, id LIMIT $4
), dense AS MATERIALIZED (
    SELECT id, embedding <=> $3::vector(3) AS distance
    FROM hybrid_chunks
    WHERE tenant_id = $1 AND active
    ORDER BY distance, id LIMIT $4
), contributions AS (
    SELECT id, 1.0 / (60 + row_number() OVER (ORDER BY score DESC, id)) AS value
    FROM lexical
    UNION ALL
    SELECT id, 1.0 / (60 + row_number() OVER (ORDER BY distance, id)) AS value
    FROM dense
), fused AS (
    SELECT id, sum(value) AS rrf FROM contributions GROUP BY id
)
SELECT c.id, c.document_id, c.document_version, c.page, c.body, f.rrf
FROM fused f JOIN hybrid_chunks c ON c.id = f.id
WHERE c.tenant_id = $1 AND c.active
ORDER BY f.rrf DESC, c.id LIMIT $5;

-- Later experiment, not the exact baseline:
-- CREATE INDEX hybrid_vectors ON hybrid_chunks USING hnsw (embedding vector_cosine_ops);
-- Check the actual plan: tie-break sorting can change index usage.
