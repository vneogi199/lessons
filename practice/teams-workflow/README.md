# A Teams Workflow has its own trust boundary

Use Teams Workflows for this recipe. Do not copy the Slack HMAC verifier into a Teams endpoint. The two platforms have different authentication and callback contracts. The supplied callback accepts a normalized message from one trusted flow, not a raw anonymous Adaptive Card submission.

This is an authored integration recipe with unexecuted deterministic callback tests. It requires an approved Microsoft tenant, Teams/Power Automate access and any licenses needed by the chosen HTTP connection. No flow, app registration, secret or message was created.

1. In Workflows, create an owned flow using “When a Teams webhook request is received”. Choose tenant-specific or specific-user authentication, not Anyone. Review the trigger's documented token requirements. Add a second authorized owner so a departing employee does not orphan the flow.
2. Validate the incoming operation ID against your backend's proposal record. Fetch the exact summary and payload hash from that record. Never display an incoming summary as if it were the stored approved intent.
3. Use the current Teams connector action “Post adaptive card and wait for a response”. Avoid actions marked deprecated. Insert the supplied `card.json`, substituting the ledger ID/hash and a reviewed proposal summary. Scope its destination to the intended chat/channel.
4. Read responder identity from the connector's authenticated response metadata. Never copy `responder_oid`, tenant or flow identity from the card's user-controlled data. Normalize connector fields into the contract below. Field paths depend on the chosen action; inspect its documented output and capture a synthetic run before activating the callback.
5. Have the reviewed flow connection obtain an application token for your callback API. Define the `Workflow.Callback` application role and assign only the approved service principal. Use the tenant's supported authenticated HTTP/custom connection; confirm license and admin-consent requirements. Do not treat the webhook trigger token as a callback token.
6. Call `/teams/decision` with the normalized body. Display decision status separately from execution. Retry a lost callback response with the same operation/hash/choice. The existing approval ledger makes an identical same-reviewer decision idempotent and rejects stale/conflicting choices.

```json
{
  "flow_id": "owned-flow",
  "tenant": "configured-tenant-id",
  "responder_oid": "11111111-1111-1111-1111-111111111111",
  "operation": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "hash": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "choice": "approve"
}
```

Create the app with `create_app(verify_service_token, tenant=..., client_id=..., flow_id=..., approvals=..., session_for=...)`. The verifier must validate signature, algorithm, issuer, exact API audience and expiry using the approved Entra library/configuration. It returns verified access-token claims, not an ID token. The policy then checks tenant, calling application and role. `session_for` maps the connector's responder to current local approval permission. The flow service is trusted to assert responder identity; control who can edit it and audit changes.

This callback delegates proposal/expiry/replay checks to `practice/agent-workflows/approval.py`. It does not execute tools. Restrict ingress, body/header sizes and concurrent requests. Denied or unavailable identity lookup must fail closed. Bind the flow client to this use only; granting a broad shared automation account this role widens the impersonation boundary.

Keep webhook URLs, connection credentials and bot tokens out of source and logs. Prefer approved certificate/workload credentials where the connector supports them. Reauthorize or rotate the connection in staging, confirm the new credential, revoke the old one, then verify rejection. Disabling the owned flow and revoking its callback role are separate kill switches. Neither retroactively reverses a completed business action.

Practice: alter the card's hash, use a different tenant, remove the responder's local permission, then replay an approved callback. Expect denial, denial, denial and the same recorded decision respectively. Tests cover policy fields with mocks, not Teams authentication or an actual flow. Ask the teacher which party is trusted to assert the responder's identity.

Sources: [Teams connector trigger/action contracts](https://learn.microsoft.com/en-us/connectors/teams/), [Workflows setup and ownership](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook).
