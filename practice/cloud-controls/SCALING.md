# Scale an ECS service within a capacity budget

These complete AWS CLI input examples target a synthetic existing service, `service/lesson-cluster/lesson-api`. They are not applied. Resource creation, workload generation and cloud costs need separate approval. Review account, region, ownership and existing policies before replacing the names.

Prerequisites: an existing healthy ECS replica service, load balancer and target group, working health checks, approved task CPU/memory, metrics, and an operator allowed to manage this exact scalable target. The service-linked role must exist or its creation must be separately allowed. This recipe does not create a cluster, service, network or role.

The example uses CPU target tracking at 60%, with two to six tasks. Scale-out cooldown is 60 seconds; scale-in cooldown is 180 seconds. These are initial lab settings, not measured capacity recommendations. CPU is appropriate only when CPU tracks the bottleneck. An API waiting on an LLM may need concurrency or queue-based controls instead.

After authorization, from this directory with an explicitly selected test profile and region:

```sh
aws application-autoscaling register-scalable-target --cli-input-json file://scalable-target.json
aws application-autoscaling put-scaling-policy --cli-input-json file://scaling-policy.json
aws application-autoscaling describe-scalable-targets --service-namespace ecs --resource-ids service/lesson-cluster/lesson-api
aws application-autoscaling describe-scaling-policies --service-namespace ecs --resource-id service/lesson-cluster/lesson-api --scalable-dimension ecs:service:DesiredCount
```

Registration can adjust a service already outside the configured range. Save the prior target, policy and desired-count settings first. Do not edit the CloudWatch alarms managed by target tracking. Missing metric data does not mean zero utilization. See [target tracking behavior](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-autoscaling-targettracking.html) and the [target registration contract](https://docs.aws.amazon.com/cli/latest/reference/application-autoscaling/register-scalable-target.html).

## Count downstream capacity

Synthetic budget: six steady tasks, two application processes per task, five connections per process = 60 database connections. With a 200% rolling-deployment maximum, twelve tasks could require 120 connections. Reserve administrative and other service capacity separately. Do not multiply only by the steady-state task count.

Likewise, a per-process provider limiter multiplies across processes and tasks. Use a shared quota/admission mechanism if the provider quota is global. Reject or queue within a bounded deadline when exhausted. Scaling tasks cannot increase a provider's contracted token limit.

## Drain before stopping

Choose a request deadline shorter than the service's shutdown allowance. On termination, stop accepting new work, finish or cancel in-flight work, close database sessions and flush bounded telemetry. Set the target group's deregistration delay and the ECS container stop timeout to accommodate that design within supported platform limits. Validate long requests and streaming separately. Cooldowns do not configure request draining.

For a lab with a 20-second request deadline, review a 30-second deregistration delay and 60-second container stop timeout with the platform owner. These values are illustrative and need a controlled termination check. Durable background jobs need queue leases and idempotency; holding a process open is not recovery.

## Controlled validation record

1. Record the image digest, task definition, account/region, metric settings and baseline healthy count. All results start as Not run.
2. Against synthetic data, raise approved CPU-bound traffic gradually. Record CPU, desired/running/healthy tasks, errors, p95, database connections and provider rejections. Stop at the agreed time/cost/load cap.
3. Confirm that capacity stays within two to six tasks. Verify service quotas and placement capacity before attributing failed scale-out to the policy.
4. Reduce traffic. Observe scale-in and complete a long-request drain test. Check for dropped work and duplicate effects.
5. Separately rehearse a metric outage and a provider bottleneck. Do not expect CPU scaling to solve either.
6. Restore captured settings. For a disposable target owned only by this lab, remove the named policy and deregister that exact target after approval. Deregistration is not a plan to reduce the service's running task count; restore that explicitly under the service owner's procedure.

Acceptance requires observed scale-out, scale-in, bounded downstream use and clean draining. No load results are claimed. Interview: why did doubling tasks worsen latency? Each task added database connections or provider requests to an already saturated dependency. Explain the actual bottleneck before increasing the maximum.
