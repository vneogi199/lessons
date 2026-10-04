# GitHub Actions secret administration

Unexecuted exercise. Use a repository and environment you are authorized to manage.
Do not connect accounts, enable workflows or create real credentials for this lesson.
[Primary documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

Choose repository scope for a CI-only value and environment scope for deployment
credentials requiring environment approval. Organization secrets require an explicit
repository access policy. Keep environment-specific values out of broad scopes.

In repository Settings, open Secrets and variables → Actions. Create
LESSON_SYNTHETIC_TOKEN with a non-sensitive random test value using the UI. For the
environment variant, create it under the dedicated lesson environment, configure
its reviewers/branch restrictions as supported by the repository plan, and target
that environment from the job. No real provider secret is needed.

Place the following in an inactive reviewed workflow only when execution is approved:

```yaml
name: Check synthetic secret presence
on: workflow_dispatch
permissions: {}
jobs:
  check:
    runs-on: ubuntu-latest
    environment: lesson
    steps:
      - name: Require configured value without printing it
        env:
          LESSON_TOKEN: ${{ secrets.LESSON_SYNTHETIC_TOKEN }}
        shell: bash
        run: |
          if [ -z "$LESSON_TOKEN" ]; then
            echo "Required configuration is missing"
            exit 1
          fi
```

This uses a process environment only for the job step. A secret manager is the
source of truth in production; runtime environment injection is not automatically
forbidden, but it can leak through diagnostics, child processes or dumps. Never
hardcode keys in images, workflow YAML or committed .env files.

Run the presence check in the approved environment, then remove the synthetic value
and expect failure. Secret expressions can be empty when unavailable. Forked PRs
normally do not receive repository secrets; do not use pull_request_target to run
untrusted checked-out code with privileged secrets. Self-hosted runners need their
own isolation and cleanup policy. Masking is not proof that every transformed value
will be redacted; never print it, hash it into logs or enable shell tracing.

Rotation exercise: set synthetic generation B, confirm the next authorized run uses
the new configuration, and invalidate generation A at the external service if one
exists. Updating GitHub's copy alone does not revoke a provider credential. Record
owner, timestamp and safe key ID, never the value. Remove the test secret after
approval. For actual AWS deployment, use scoped OIDC role assumption; this exercise
does not introduce long-lived AWS keys.

Acceptance: intended job has access; missing-secret path fails; untrusted jobs do
not receive the value; environment approval is enforced; logs contain no value;
old credential revoked at its issuer where applicable. Actual results: not run.

Interview: why can a masked secret still leak? A process can send it to the network,
encode it, or write it into an artifact. Restrict code, dependencies, permissions
and egress as well as log output. Ask your teacher to review a workflow's trust
boundary before giving it real credentials.
