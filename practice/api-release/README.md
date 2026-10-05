# Build once, then deploy the tested image

This release exercise packages the existing RFQ API. Authentication still fails
closed. The deployed demonstration accepts no RFQ business operations and stores
no customer data. `/healthz` checks that the application started; it does not
certify production readiness. SQLite lives in temporary container storage.

The Dockerfile, Compose file, ECS task definition, smoke check and inactive
GitHub Actions example are supplied. Nothing was built, installed, pushed or
deployed. No tests were run. Runtime and cloud verification remain separate.

Before opting in, provision and review these prerequisites:

- An isolated, ephemeral Linux x86-64 runner with Python, Docker and AWS CLI.
  Its short-lived AWS role permits this demo's ECR uploads, ECS service updates,
  task registration and passing only the approved execution role. Do not give
  this runner untrusted pull-request jobs or a general administrator role.
- An approved base image pinned by digest, with compatible Python 3.11+, FastAPI,
  Pydantic v2, Uvicorn, pytest and HTTPX already present. Record its package
  versions, SBOM and vulnerability review. This lab intentionally installs no
  dependencies. Its image retains test tools so the exact final artifact can
  run the tests; a production dependency policy may require a separate approach.
- An immutable ECR repository named `lesson-rfq-demo`, a pre-existing Fargate
  rolling-update service of that name in a `lesson-*` cluster, and a completed
  previous deployment. Enable circuit-breaker rollback. Prepare the execution
  role for ECR pull and the existing `/lessons/rfq-demo` CloudWatch log group.
- Private task subnets with the required ECR, S3 and logs access; an ALB target
  group with `/healthz`; task ingress on 8000 only from the ALB security group.
  Review desired count, capacity and cost before deployment. This package does
  not create or change the network, ALB or scaling policy.
- A protected GitHub `lesson-demo` environment with required approval and
  main-branch restrictions. Set the workflow's non-secret repository variables.
  No long-lived AWS key belongs in YAML. The example uses the isolated runner's
  short-lived role; a hosted runner needs a separately reviewed OIDC role setup.

From the repository root, the script validates its inputs and AWS account,
builds one image and records its local image ID. It runs the RFQ tests with no
network, starts that image and checks readiness plus a denied RFQ request. Only
then does it push. The ECR digest must match the local image's repository digest.
The task definition receives `repository@sha256:...`, never `latest`.

`workflow.yaml` remains outside `.github/workflows`, so committing it cannot
deploy anything. After separate authorization, copy it into that directory and
configure the reviewed prerequisites. The manual dispatch runs
`python3 practice/api-release/release.py` from the root. The default approval
flag is absent outside the workflow; the script refuses to deploy without it.

For an authorized local-only demonstration, build with the same Dockerfile and
approved `RUNTIME_IMAGE`, then supply the tested image ID as `TESTED_IMAGE` to
`docker compose -f practice/api-release/compose.yaml up`. Compose pulls nothing.
Its writable tmpfs holds disposable SQLite files. Fargate does not use this
Compose tmpfs; the task uses its writable ephemeral filesystem. Neither setup
is a durable database deployment. Tests override identity only inside pytest.

A failed build, test or smoke check stops before publication. A failed push or
digest check stops before ECS changes. A failed rollout can trigger ECS rollback
to the previous completed deployment. The script checks the active revision
after the waiter: a stable rolled-back service is not a successful candidate.
If the waiter times out, inspect ECS events and active revision before acting.
Do not deploy repeatedly to hide a failing revision. The script prints previous
and candidate task ARNs for the reviewed rollback procedure.

Acceptance after authorized execution: record image ID, registry digest, test
output, deployed revision, ALB readiness and denied RFQ request. Then deliberately
use a failing health check in the isolated environment and record rollback.
Do not claim rollback succeeded just because its setting is enabled. Retain the
previous image until rollback is no longer needed. Runner disposal removes local
Docker credentials; use a private temporary Docker config if running manually.

Interview question: why is the commit SHA not enough to identify a release?
Answer: rebuilding the same source can produce different dependencies or bytes.
Test and promote one artifact, then record its digest. Ask your teacher to review
the point where publishing ends and deployment starts.

See [ECS circuit-breaker behavior](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html)
and [GitHub AWS OIDC setup](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
