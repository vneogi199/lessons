# Groups do not grant access by themselves

A verified user belongs to the support group. The local policy maps that group to `reader`. The requested document must also list that user as a reader. Both conditions must hold. A reader role does not grant every document in the tenant.

`access.py` connects a trusted token/session verifier, Microsoft Graph membership lookup, local group-to-role mapping and an object ACL. It does not implement login or verify JWT signatures itself; that remains IAM-02. Pass a verifier that validates signature, allowed algorithm, issuer, audience, expiry, tenant and required delegated scopes with a maintained library. Never pass decoded-but-unverified claims. The verifier must attach the server-stored `local_epoch`, not accept it from a request field or an arbitrary JWT claim.

Use immutable tenant and object IDs. Reject application-only tokens on this user endpoint. Keep role maps and document ACLs in trusted storage. The `document` argument must come from that storage, not the request body. Ignore display names and email addresses for authorization.

Group overage replaces a full groups list with an indicator. The adapter always asks the fixed Graph endpoint on a cache miss, so it also handles overage. It never follows `_claim_sources` URLs or treats `hasgroups` as a permission. This costs a lookup even when the token contains a short group list, but gives the application one explicit freshness policy.

The credential callback acquires a Graph-audience token for the allowlisted tenant using the server's approved identity. Review the endpoint's permission table and grant only the selected delegated/application permissions. Do not forward the application's incoming access token to Graph unless its intended audience is actually Graph. Redirects, partial membership responses and failed lookups cannot grant access.

Reads cache groups for 30 seconds in one process. Approval requests always refresh. Membership removal can remain visible during the cache interval and Graph's own propagation delay. Do not claim instant revocation from the directory. For immediate local suspension, update the trusted epoch or enabled flag; every request rechecks it before and after lookup. Existing sessions then fail until login issues a current epoch. A fleet needs shared state and reliable invalidation, not one independent dictionary per worker.

Fetch current object permissions again before releasing retrieved content or executing an approved effect. This function checks a supplied snapshot; it cannot atomically prevent a later ACL change. Bind approval to the exact payload/version and use the existing durable approval gate. Authentication, role membership and exact-intent approval solve different problems.

Tests cover overage with an attacker-controlled claim-source URL, membership removal, forced approval refresh, object denial, epoch revocation and the fixed HTTP endpoint. They use fake verification and mocked HTTP; no directory or test execution occurred. Failures must become a denial/unavailable response, never fallback access.

Interview: why can a logged-in user receive 403 after group removal? Authentication still identifies the person, while current authorization no longer permits the operation. Ask the teacher to review the difference between the cache delay and your promised revocation SLA.

Sources: [Entra claims](https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference), [Graph membership endpoint and permission table](https://learn.microsoft.com/en-us/graph/api/directoryobject-getmemberobjects?view=graph-rest-1.0).
