# A private cloud lab with an event receipt

This package supplies Terraform resources and a small Lambda handler. It has not been initialized, planned, applied or tested. Do not run these steps until cloud spending, provider downloads and execution are separately approved.

The lab creates a VPC with two private subnets, one EC2 instance, private PostgreSQL RDS, S3 versioning/lifecycle rules, a DynamoDB receipt table and an S3-triggered Lambda. SSM endpoints provide management access without inbound SSH. The VM has no public IP. Security groups permit only VM-to-database TCP 5432, VM-to-interface-endpoint TCP 443 and S3 HTTPS through its prefix list. Security groups are stateful, so reply packets do not need a matching outbound database rule.

There is no NAT or default internet route. Interface endpoints cost money even when idle. The Lambda runs outside the VPC and uses its managed service networking for DynamoDB. Putting it inside a private subnet later would require the corresponding network path; attaching a VPC does not create internet access.

## Prepare the inputs

Use a dedicated sandbox account and region, an authorized deployment identity and a resource owner with a cleanup date. Check quotas, service availability and a spending estimate. Have an approved Terraform 1.10+ environment and provider mirror/cache. The constraints select AWS provider 6.x and archive 2.x; review and commit the resolved `.terraform.lock.hcl` when initialization is authorized. The lock file is intentionally not fabricated here.

Supply `region`, `account_id`, a unique `name`, two availability zones, an approved x86-64 `ami_id`, compatible `postgres_version`/`postgres_parameter_family`, and a unique `final_snapshot_id`. Choose a version and instance class supported in that region. The AMI must already contain a current SSM agent, Python/AWS CLI and PostgreSQL client with the current RDS CA bundle. This network cannot download OS packages. Audit the AMI owner and image digest evidence separately.

Use a pre-existing state bucket owned by the platform team. Enable versioning, encryption and access logging according to that team's policy. Restrict state access to this lab's prefix and lock object. Never place the backend bucket in the same stack that it stores. Supply a local ignored `backend.hcl`:

```hcl
bucket       = "REPLACE_WITH_APPROVED_STATE_BUCKET"
key          = "lessons/UNIQUE_LAB/terraform.tfstate"
region       = "REPLACE_WITH_STATE_REGION"
encrypt      = true
use_lockfile = true
```

These are placeholders, not executable account settings. Keep credentials out of backend arguments and variable files. Use approved short-lived authentication. State and saved plans are sensitive even though RDS manages its password in Secrets Manager. The application must never use the master account; an authorized operator creates a restricted database role after provisioning. The VM role cannot read the master secret.

## Review before creation

After separate approval, from this directory:

```sh
terraform init -backend-config=backend.hcl
terraform fmt -check
terraform validate
terraform plan -out=reviewed.tfplan
terraform show reviewed.tfplan
```

These commands can access the network; `init` can download providers. Do not run them under the current no-install restriction. Review account, region, network CIDRs, every IAM statement, storage retention, RDS protection and all planned replacements. Compare the resolved providers against the approved lock file. Have a second reviewer approve the exact plan, then apply that saved plan only. Do not use `-auto-approve`. Treat plan output as restricted material.

The SSM managed policy is broader than the fixture S3 policy because it implements AWS's instance-management contract. Review that managed policy's current contents. The VM can read only this bucket's `fixtures/*`; it cannot upload, delete or read other prefixes. Interface endpoints are network paths, not authorization grants. RDS enforces TLS; clients must use hostname validation, such as `sslmode=verify-full`, with the approved CA file.

## Acceptance evidence

| Experiment | Expected evidence |
| --- | --- |
| Connect through an authorized Session Manager session | VM is managed; no inbound SSH rule exists. |
| Use a provisioned restricted DB role from the VM | TLS query succeeds; write attempt under read-only role fails. |
| Connect to RDS from an unrelated security group | Connection fails; private address and SG rules remain unchanged. |
| Read an owned fixture via VM role | HTTPS read succeeds. A write, another prefix and another bucket fail. |
| Try public internet egress from the VM | No default route; do not “fix” this by adding broad egress. |
| Upload an approved synthetic object to `fixtures/` | One receipt records bucket, decoded key and immutable version. |
| Replay its exact event twice | One DynamoDB item remains; duplicate conditional writes are handled. |
| Upload a second version under the same key | A distinct receipt exists. The handler does not assume arrival order. |
| Repeatedly fail the handler in a reviewed test | The failure destination receives the exhausted event; inspect queue age. |

Use a deployment identity with narrowly scoped upload permission for the upload step; the VM role deliberately lacks it. The handler's only business effect is inserting a receipt. It does not claim that receipt means a PDF was processed. Adding later work requires a transaction/outbox or a resumable work ledger. The supplied mock test checks duplicates and source rejection but is unexecuted.

## Restore and drift

Write synthetic row `probe-1` to a test table under an authorized writer. Record a snapshot or point-in-time recovery target and its completion. Restore to a new, uniquely named private instance with reviewed subnet and security groups. Use TLS to confirm the row and role restrictions. Measure recovery time; do not invent it. Record the temporary instance ID and remove only that restored copy after approval. A configured backup is not evidence of a successful restore.

For drift, obtain approval for one harmless tag change. Run `terraform plan -refresh-only` and inspect the difference, then run a normal plan to see the proposed restoration. Do not apply refresh-only merely to hide unauthorized changes. Investigate network/IAM drift before repairing it. Keep evidence and rollback decisions with the lab record.

## Cleanup

List `owned_resources` and compare IDs against the state and ownership tags. Stop synthetic uploads and review pending failure messages. Export required evidence without credentials or object content. RDS deletion protection is on; a separately reviewed change to `protect_database=false` is required before destruction. Final snapshot creation stays enabled.

Review an exact destroy plan for this isolated state. A non-empty versioned bucket blocks deletion because `force_destroy=false`. List and review all object versions and delete markers for this exact lab bucket; remove them only with explicit approval. Never use a broad recursive cleanup command. Apply the approved destroy plan, then verify the owned resources are gone. Track retained final snapshots and any restore-test copies as separately billable resources. Do not delete the shared state bucket or its audit history.

Interview: why does a subnet without a public IP still sometimes reach the internet? A NAT/default route can provide outbound access. This lab deliberately has neither. Ask the teacher to trace VM-to-RDS and VM-to-S3 traffic before adding any new endpoint.

Sources: [Terraform S3 state and locking](https://developer.hashicorp.com/terraform/language/backend/s3), [SSM endpoint requirements](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html), [S3 event version/ordering fields](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html), [AWS provider resources](https://registry.terraform.io/providers/hashicorp/aws/latest/docs).
