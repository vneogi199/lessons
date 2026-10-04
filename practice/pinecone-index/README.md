# Create and verify a disposable vector index

Unexecuted cloud recipe for RAG-04. Obtain separate approval for the account,
region, data transfer and cost ceiling. Use an existing Pinecone Python SDK;
record its version and verify the contract before execution. No resource has
been created. [Primary source](https://docs.pinecone.io/guides/index-data/create-an-index).

Use a dedicated project and separate provisioning/data credentials where supported.
Store keys outside Git. Record owner, project, region, budget, unique disposable
name and model/revision/dimension/metric contract. The two-dimensional vectors below
are synthetic mechanics fixtures, not text embeddings. A namespace does not replace
authentication and application authorization.

```python
from pinecone import Pinecone, ServerlessSpec

# Inputs come from reviewed configuration and a secret manager.
pc = Pinecone(api_key=api_key)
assert index_name.startswith("lesson-")
if pc.has_index(index_name):
    raise RuntimeError("Refuse ownership of an existing index")
pc.create_index(
    name=index_name, vector_type="dense", dimension=2, metric="cosine",
    spec=ServerlessSpec(cloud="aws", region=approved_region),
    deletion_protection="enabled", tags={"owner": owner_id, "purpose": "lesson"})
```

Poll `pc.describe_index(index_name)` with a 120-second deadline and two-second
intervals. Require `status.ready`; verify dimensions, metric, region and owner tag.
On timeout investigate the same index; do not create another. Record the host and
target `pc.Index(host=description.host)`. Configure SDK request timeouts for the
selected SDK version. Polling deadlines do not bound a stalled SDK call.

Use this dedicated negative-test fixture, never real documents:

```python
index.upsert(namespace="tenant-a", vectors=[
    {"id": "policy-v1-p1", "values": [1.0, 0.0],
     "metadata": {"tenant": "a", "version": "v1", "source": "synthetic"}},
    {"id": "private-v1-p1", "values": [0.0, 1.0],
     "metadata": {"tenant": "b", "version": "v1", "source": "synthetic"}},
])
result = index.query(namespace="tenant-a", vector=[1.0, 0.0], top_k=2,
                     filter={"tenant": {"$eq": "a"}}, include_metadata=True)
assert all(hit.id == "policy-v1-p1" for hit in result.matches)
```

Poll within a declared visibility deadline until the expected policy ID appears.
An empty result alone does not pass the filter test. Query another empty namespace
and require no results. The mixed metadata is a deliberate denial fixture, not a
production tenancy layout recommendation.

Update only the policy ID with `index.update(id="policy-v1-p1",
namespace="tenant-a", set_metadata={"reviewed": True})`. Poll fetch until reviewed
appears; then repeat the filtered query. Publish changed content as a new version.

Delete only that ID using `index.delete(ids=["policy-v1-p1"], namespace="tenant-a")`.
Poll fetch/query until absent or the deadline expires. Do not use delete_all.
Record observed lag and failures without logging keys. Immediate access revocation
must be enforced by the application while index visibility catches up.

Acceptance: authorized ID appears; denied ID never appears; empty namespace stays
empty; update becomes visible; deleted ID disappears. No outcomes are recorded yet.

## Cleanup needs a separate confirmation

Describe the exact index again. Match project, owner, purpose and recorded name.
Check that nobody else added data. After explicit approval, disable protection with
`pc.configure_index(name=index_name, deletion_protection="disabled")`, then delete
that exact index with `pc.delete_index(index_name)`. Verify absence and later billing.
Deletion is destructive. No cleanup call has been executed.

Interview: matching dimensions but a different model revision? Reject or route
to the correct versioned index; shape compatibility does not establish semantic
compatibility. Tomorrow, explain why an accepted delete is weaker evidence than
a visibility check plus an application revocation check.
