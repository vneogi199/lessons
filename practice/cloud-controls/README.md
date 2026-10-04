# Cloud permission and budget exercises

For task-count control, use the [ECS scaling inputs and validation plan](SCALING.md).
For Azure delivery, use the [ACR and Key Vault identity/rotation recipe](AZURE.md).

These are unexecuted recipes. Account IDs, role names, bucket and external ID are
synthetic. Replace them in a reviewed private configuration before any authorized
deployment. Creating files does not authorize AWS calls or spending.

## Cross-account read

Use target-trust.json on the destination role; caller-permission.json on the exact
source role; target-permission.json on the destination role. The destination can
read approved objects only. This sample deliberately grants no ListBucket or write.
KMS-encrypted objects would also need reviewed key permissions; they are outside
this synthetic S3-only setup.

In an approved test environment, assume the target role with the expected external
ID and a short session duration. Use the resulting temporary credential provider,
never copy credentials into source or logs. Verify get-caller-identity, then read
one synthetic approved object. Record only safe identity/resource IDs and outcomes.

Negative cases: wrong external ID; different source role; no caller permission;
attempted S3 write; read outside approved prefix; expired session. Each must fail
under the selected account policies. An explicit deny in an SCP, boundary or
resource policy may block even the positive case. Do not remove such controls
merely to make a lesson pass.

Repeat assumption with a session policy that permits one exact approved object.
That session should lose access to its siblings; it cannot gain new actions beyond
the role's grants. Revoking future AssumeRole access is not proof that existing
sessions instantly stop. Use the organization's active-session revocation procedure.

External IDs address a third-party confused-deputy risk. Have the service provider
assign a unique customer binding; treat it as a condition, not as a secret replacing
identity. A vendor-wide shared value weakens that customer binding.

Sources: [cross-account roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html),
[third-party external IDs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html).

## Budget notification exercise

Prerequisites: approved account/budget owner, Billing access, notification address
or an approved SNS topic, and authority to create a disposable budget. Record the
billing scope, currency, period, cost categories and forecast setting. A budget
with the wrong linked-account/tag filter can miss the workload it is meant to watch.

1. Create a monthly cost budget using the approved amount. Add actual-cost
   thresholds at 50%, 80% and 100%, plus an agreed forecast threshold.
2. For SNS, apply the documented AWS Budgets publish permission with SourceAccount
   and SourceArn restrictions. Confirm the subscriber through its controlled inbox.
   Check encryption/key requirements if the topic uses a customer-managed key.
3. Send a clearly labeled synthetic SNS test message through an authorized operator.
   Verify receipt, escalation owner and timestamp. This tests topic delivery only.
4. Verify the saved budget's actual notification configuration and scope. For an
   approved low-cost test budget, choose a threshold already below reported cost,
   wait for the documented budget evaluation, and record an actual budget alert.
   Do not manufacture spending to trigger it. If no alert arrives, keep this check
   unverified and investigate evaluation timing, scope and publish permissions.
5. Restore the agreed configuration and remove only the disposable budget/topic
   owned by this exercise after approval. Keep sanitized evidence and check billing.

Acceptance record: account/scope correct; subscriber confirmed; SNS test received;
actual budget alert received or explicitly pending; responder acknowledged;
threshold/filter restored. Nothing is marked passed here.

Source: [AWS Budgets SNS setup](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-sns-policy.html).
Budget alerts depend on cost-data/evaluation timing. They are not synchronous
per-request spending limits.

Optional budget action design: require human review; stop admitting new optional
batch jobs through an application flag; preserve recovery/admin access and running
transactions; set an owner and expiry; rehearse restoration. Evaluate affected
services and permission boundaries before automating an AWS budget action. No
blanket deny, instance deletion or production shutdown policy is supplied.

Interview: costs exceed the alert threshold before email arrives. Was the budget a
hard cap? No. Admission reservations and workload quotas enforce limits; notification
is a separate operational signal. Tomorrow, identify one remaining cost even after
an application stops accepting requests.
