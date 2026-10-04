# Deliver one approved image through ACR and read secrets from Key Vault

This unexecuted recipe assumes an existing approved Azure subscription, registry, vault and application runtime. It creates no resources and grants no permissions. Record the tenant, subscription, region, registry permission mode, vault authorization model, deployment owner and rollback owner before proceeding. Use synthetic data for checks.

## Separate identities

The build identity publishes one application's image. The runtime identity pulls that image and reads only its needed secrets. A separate administrator owns role assignment. Prefer workload federation for CI and managed identity in Azure; do not place long-lived service-principal passwords in repository settings as the default design.

For a registry using RBAC Registry Permissions, review `AcrPush` for the builder and `AcrPull` for the runtime. In RBAC Registry + ABAC Repository Permissions mode, use the appropriate Repository Writer/Reader roles and a condition for the exact repository. Do not assume legacy roles work identically in both modes. Inspect [ACR role behavior](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-rbac-built-in-roles-overview) before assigning access.

With an RBAC-enabled vault, the runtime can use Key Vault Secrets User for secret values. It does not need Secrets Officer or role-administration rights. Use a dedicated application/environment vault where practical. Keep deployment and production identities separate. Network access and data-plane permission are separate checks. See [Key Vault RBAC](https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide).

## Promote the same image

1. In an approved builder, test the source and build the image once. Review base-image and dependency provenance. No secrets may enter build arguments or layers.
2. Authenticate with the approved federated identity. Publish to the permitted repository, using a release tag for discoverability.
3. Resolve and record the registry digest. Deploy `registry/repository@sha256:...`, not a movable `latest` tag. Record the source commit, checks, image digest and deployment configuration together.
4. Let the runtime pull with its own identity. Check health and a synthetic authenticated request before promotion. A healthy process alone does not establish database access or correct authorization.
5. On failure, restore the previously approved digest and compatible configuration. Database migrations must have their own compatibility/rollback plan. Retain the prior artifact until the rollback window ends.

Acceptance: the runtime can pull the approved artifact; its push attempt is denied; the builder cannot read application secrets; an unrelated identity cannot pull the restricted repository. Record actual policy decisions, not just screenshots of assigned roles. Avoid widening permissions to solve an authentication error without finding its cause.

## Retrieve secrets without logging them

Use the installed, approved Azure Identity and Key Vault Secrets SDKs. The following runtime fragment assumes managed identity is available. A user-assigned identity needs its explicit client ID; do not fall back silently to a developer account in production.

```python
from azure.identity import ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient

credential = ManagedIdentityCredential(client_id=approved_identity_client_id)
client = SecretClient(vault_url=approved_vault_url, credential=credential)
secret = client.get_secret("provider-key", version=approved_secret_version)
provider_client = build_provider_client(api_key=secret.value)
```

`approved_*` values are reviewed configuration inputs, and `build_provider_client` is the application's existing provider factory. This is a recipe fragment, not a standalone script. Never print `secret`, put its value into traces, or return it through a health endpoint. Close SDK clients at application shutdown. Apply bounded SDK retries plus an overall startup/refresh deadline; a service without a required credential must not claim readiness.

Use [the Python client contract](https://learn.microsoft.com/en-us/azure/key-vault/secrets/quick-create-python) for the installed version. The official quickstart includes secret-management operations; a production reader should not inherit its write/delete permissions.

## Rotate and prove revocation

Create a new provider credential through an authorized owner. Store it as a new vault version without displaying the value. Validate it on a synthetic request, then update the approved version reference and roll out the application. Confirm that all instances use the new version before revoking the old provider credential. Restore the prior reference only if the prior credential is still valid and policy permits it.

Disabling a vault version does not revoke a provider key already cached in process memory. Revoke at the provider too. Document refresh/cache lifetime and restart behavior. Avoid unbounded stale-secret fallback during a vault outage.

Failure drills: missing secret, denied identity, disabled version, wrong private DNS, expired provider credential, interrupted rollout and partial instance refresh. Expected outcomes are bounded errors, no leaked values, failed readiness where needed and an operator-visible status. All outcomes remain Not run.

Remove only disposable role assignments and artifacts owned by this exercise after approval. Preserve retention/rollback artifacts and do not purge shared vaults or registries. Interview: why can a role be correct while retrieval fails? The token identity, vault mode, DNS/network path or secret version can still be wrong. Diagnose each boundary separately.
