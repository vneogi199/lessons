# Provision one read-only Bedrock agent

The synthetic policy says: "A risk total above 100 USD needs a human review." The agent may explain that policy. It has no action group and cannot create a ticket, change a limit or book a trade.

This package supplies executable provisioning functions, policy builders, a durable local run ledger and teardown. None has been executed. No AWS calls, resources, IAM changes or model requests were made. Boto3 must already exist in an approved environment. Local tests are authored, not run.

## Prepare and approve the prerequisites

An AWS owner approves one account, region, spend ceiling, run name and cleanup owner. Copy `config.example.json` to a private reviewed file and replace every synthetic account/resource/model value. Confirm that the region supports the selected agent model and embedding model. This recipe uses regional foundation-model ARNs; cross-region inference profiles need a different reviewed IAM/data-residency design.

Provide an existing private S3 bucket and a dedicated empty OpenSearch Serverless vector index. This package does not create a collection or network infrastructure. The operator creates an index with an `embedding` knn_vector field using the selected embedding model's exact dimension, a `text` text field and a `metadata` non-indexed text field. Select a Bedrock-supported vector engine/configuration. Check the index mapping and collection readiness before provisioning. A name alone does not validate dimension compatibility.

Configure collection encryption and private network access. Permit Bedrock as the approved source service. Its data-access policy grants the KB role only the required index description/read/write operations on this dedicated index, plus required collection description access. IAM `aoss:APIAccessAll` on the collection does not replace the data-access or network policies. A shared index would complicate deletion and permission isolation; do not reuse one here.

Upload exactly one synthetic text file under `<run>/allowed/policy.txt` containing the 100 USD policy. Put a different canary, `DENIED-CANARY-73`, under `<run>/denied/private.txt`. The data-source prefix and KB role both exclude that second path. Uploads need separate authorization; this package never uploads source documents automatically.

## Apply scoped roles, then run two stages

`roles.policies(config)` produces the KB role's policy: one embedding model, the allowed S3 prefix and one collection. The administrator applies it to the dedicated role. `roles.trust` restricts the Bedrock service principal by account and source ARN. During bootstrap the final resource ID is unknown; use only the account/region/type wildcard, then tighten it to the created KB or agent ID. Do not grant an unrestricted service trust. An SSE-KMS source needs an additional exact-key decrypt grant and key-policy review; that grant is intentionally absent for this SSE-S3 fixture.

The provisioning identity needs the listed create/get/ingest/prepare/associate/alias APIs and `iam:PassRole` only for these two roles, conditioned on `iam:PassedToService=bedrock.amazonaws.com`. It does not need account administration. Runtime callers need `bedrock:InvokeAgent` only on the candidate alias ARN; they do not need provisioning permissions. The operator handles policy changes separately.

With explicit permission and short-lived AWS credentials, set `APPROVED_BEDROCK_PROVISION=yes`. Run in a private directory where the SQLite state file is protected:

```sh
python provision.py kb --config /reviewed/config.json --state /private/run.sqlite
```

The program checks the caller's AWS account, creates the KB and S3 data source, and starts ingestion. It waits for readiness with a deadline and rejects an ingestion run with failed documents. A successful job does not prove a document was relevant or even that the intended file was present; inspect ingestion statistics and retrieval results.

Use the returned KB ID with `roles.policies(config, knowledge_base_id)` to generate the agent role policy. It permits one model and retrieval from only that KB. Apply the reviewed policy and wait for IAM propagation. Then run:

```sh
python provision.py agent --config /reviewed/config.json --state /private/run.sqlite
```

The agent links the KB in DRAFT, prepares it, and creates a candidate alias. Bedrock creates a version when creating an alias without explicit routing. The script checks that the resulting alias routes to one numbered version and records it. A draft change does not silently change that candidate. For a later release, create and evaluate a new numbered candidate, record the old routing and update the serving alias only with deployment approval. Rollback routes to the previous tested version; it does not roll back source documents or the vector index.

Create calls use stable per-run idempotency tokens. The SQLite ledger records IDs after each response and rejects changed configuration. Keep it across retries. If an association response is lost, the next run reads the association and fails for operator review if it is absent or disabled. Do not erase the ledger or change the run name to bypass an ambiguous result. Only one process may operate a run at a time; the ledger is not a distributed provisioner lock.

## Acceptance evidence

After separately approving model and retrieval calls, use the AWS runtime API with a fresh bounded session ID. Ask for the human-review threshold. Expected: 100 USD with a citation to `allowed/policy.txt`. Inspect retrieval source locations and the answer. A fluent answer without that evidence fails.

Ask for the denied canary. It must not appear in retrieval results or output. Separately test the KB role's direct S3 read of `denied/private.txt`; it must be denied. Run the same invocation with an IAM caller missing alias permission; it must fail. These checks cover this fixed corpus and account boundary. They do not prove arbitrary per-user document ACLs. For mixed-access corpora, separate KBs or apply a validated retrieval authorization design; instructions alone are insufficient.

Change the query to an unsupported subject and require abstention. Test missing source, failed ingestion, wrong vector dimensions, revoked retrieval permission and readiness timeout. Record API request IDs, exact Boto3/Botocore versions, alias/version, source versions, expected/actual results, latency and billed usage. Disable traces containing source text unless their retention/access has been approved. Reuse the separate guardrail adapter before release if policy requires it; this fixture has no attached guardrail.

With local execution approval, `python -m unittest test_provision.py` exercises the waiter, trust-policy conditions and two-stage flow with a mock client. It checks recorded IDs, a numbered alias version and reuse of the ingestion operation after reopening the ledger. It does not certify Boto3 request schemas or AWS permissions. A prepared environment should also run Botocore Stubber checks and the authorized live acceptance cases before signoff.

## Teardown

Stop callers first. Set `APPROVED_BEDROCK_DELETE_RUN` to the exact reviewed run name, retain the normal provisioning approval, and run:

```sh
python provision.py teardown --config /reviewed/config.json --state /private/run.sqlite
```

The program checks recorded agent/KB names, removes the alias and agent, deletes the data source under its DELETE policy, then removes the KB. It waits for absence and stops on permission or deletion errors. Preserve the ledger and inspect partial failures. A timed-out deletion is not proof of failure or success.

The program deliberately retains prerequisites. An operator must review and remove the dedicated vector index, collection if owned solely by this run, exact S3 object versions and dedicated IAM roles/policies. Remove no shared resource. Confirm charges stop: deleting a KB does not remove the billable collection. Record what remains and why.

Interview question: Does pinning an agent version reproduce yesterday's answer? No. The knowledge base, provider behavior and retrieval inputs can change independently. Version the corpus and evaluation set as well. Ask your teacher to review a rollback plan with a changed source document.

Sources: [KB creation API](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock-agent/client/create_knowledge_base.html), [data sources](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock-agent/client/create_data_source.html), [alias/version creation](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock-agent/client/create_agent_alias.html), [agent service roles](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-permissions.html), [KB service roles](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-permissions.html), [vector-store security](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-create-security.html).
