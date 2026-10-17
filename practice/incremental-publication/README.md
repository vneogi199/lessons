# Incremental document publication — offline exercise

Read [Week 2](../../reference/production-agent-six-week-path.html#w2-updates) first.
This standard-library Python exercise stores a document's active content and fake
vectors in SQLite. It illustrates publication rules, not a vector search engine.
No packages, services, credentials or network calls are needed.

## Follow one update

1. `stage()` reads the active revision and prepares new vectors without changing it.
2. `publish()` compares that revision inside a database transaction. If another
   worker changed it, publication fails. Reload and restage only if the source
   event is still current.
3. A duplicate or older event does no embedding work. Identical content at a newer
   revision reuses its vectors. Other documents remain untouched.
4. A deletion retains its revision as a tombstone. Older events cannot revive it.
5. Permission changes use a separate increasing revision and do not embed content.
   Missing permission records deny access.

Before running, predict the final version when workers stage revisions 2 and 3,
but worker 3 publishes first. Then run from the repository root:

```sh
python3 -B -m unittest discover -s practice/incremental-publication -p 'test_*.py' -v
```

Expected: nine passing tests. Worker 2 must lose. Tests also cover retry, unchanged
content, changed-document isolation, deletion, ACL revocation, denied reads,
failed embeddings, invalid events and persistence after reopening. SQLite files
are created in a temporary test directory and removed afterwards.

## What this does not prove

- Inputs represent **trusted source events** with strictly increasing document
  revisions. `Staged` is an internal value, not an untrusted request contract.
  Same-revision conflicting payloads require an upstream integrity check.
- Embeddings are fake; there is no semantic search, ANN index or relevance claim.
- Nonempty lines are chunks. Changed documents re-embed all their lines; a real
  adapter can reuse unchanged chunk hashes under the same embedding contract.
- The embedding contract is fixed. Migrating models or dimensions needs a new
  versioned index and evaluation, not reuse of old vectors.
- Content and vectors share one local transaction. An external vector database
  requires staged writes, visibility checks and an authoritative publication
  manifest; a database commit cannot make two services atomic.
- Permission checks produce a read snapshot. They do not guarantee revocation
  cannot race with later network delivery. Define and test that service boundary.
- It is not a durable queue, outbox dispatcher, authentication service, cloud
  deployment or performance benchmark. The worker race is simulated sequentially;
  no multiprocess crash or network-partition experiment is claimed.

Next-day recall: why do duplicate handling, revision ordering and permission
checking need separate rules? Explain the difference before rereading the code.
