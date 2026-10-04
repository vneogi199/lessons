# Operate an isolated AI service

This lab is a tabletop plan for an already provisioned test environment. It does not install Kubernetes, Rancher, a registry or a model. Do not run cluster initialization, join, upgrade or reset commands on an existing machine without its owner's approval. Record every target by exact host/cluster identity.

## Decide who owns recovery

Use a synthetic inventory: one management cluster, one separate workload cluster, an internal TLS registry and a private inference host. Name the owners of DNS, certificates, identity, backups, storage and GPU drivers. Record the selected Kubernetes, container-runtime, CNI, CSI, Rancher and model-server versions and their compatibility evidence. A diagram without these owners is not a recovery plan.

`kubeadm` bootstraps Kubernetes control-plane components. It does not supply all networking, storage, load balancing, backup or monitoring decisions. Before any approved bootstrap, review host prerequisites and version-specific configuration, choose a non-overlapping pod CIDR, select the CNI and define the control-plane endpoint. Protect bootstrap tokens and kubeconfig files. See [the kubeadm cluster guide](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/).

Exercise: two networks both use the same private range. Explain why successful cluster initialization does not prove pods can reach an enterprise database. Identify the routing owner and correct the address plan before deployment.

## Add Rancher without confusing management with availability

Rancher registration gives its agents authority over a downstream cluster. Review the generated registration manifest and requested privileges before applying it. Verify the Rancher server's TLS chain; do not bypass certificate checks to make registration work. Use a compatible supported downstream version and explicit administrative approval. Follow [registration instructions](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-clusters-in-rancher-setup/register-existing-clusters) for the chosen release.

Practice a management outage on a disposable environment. Record which existing workloads continue, which management actions fail and how authorized operators use protected break-glass access. Losing the dashboard is not identical to losing the workload API. Do not test this by disrupting a shared production management cluster.

## Transfer artifacts across the air gap

Create a reviewed manifest before transfer:

| Artifact | Required record |
|---|---|
| Application and platform images | Registry/repository, digest, architecture, signature/provenance evidence, scan result |
| Model weights and tokenizer | Exact revision, hashes, license, format, compatible server version |
| OS/runtime/GPU packages | Approved repository snapshot, versions, hashes and installation owner |
| Charts/manifests | Immutable revision, values, image references and required secrets |

Use a controlled connected staging zone to acquire and inspect artifacts. Transfer through the approved media/gateway process. Verify hashes and signatures again in the destination zone, then import to its authenticated TLS registry. Preserve the manifest and review record. A checksum proves byte consistency with the recorded value, not that the original publisher is trustworthy.

Rehearse a cold start with outbound internet blocked. Remove only the disposable node's cache through its owner's procedure, then confirm that every required image is present internally. Include CNI, CSI, pause, init-container and monitoring images. A warm cache can conceal missing artifacts. Do not enable insecure registries or public fallback to make the check pass.

## Host Ollama behind the application boundary

Use a preapproved local model artifact. Keep the inference endpoint private and expose it only through an authenticated application or gateway with request-size, concurrency and timeout limits. Do not expose the native service directly to the public internet. Ollama's host binding and model-storage configuration are documented in its [FAQ](https://docs.ollama.com/faq). Review cloud-related settings against the deployment's data-residency policy.

Measure cold-load and warm-request latency separately. Fix the model revision, context cap, concurrency and hardware in the record. If GPU memory is exhausted, reduce admitted work or choose an approved smaller model; repeated immediate retries can worsen the outage. The runtime must not fetch an unreviewed model when a local artifact is missing.

Synthetic acceptance cases: permitted application identity can infer; another subnet cannot connect; oversized request is rejected; missing local model fails clearly; an exhausted queue returns a bounded error; logs contain neither prompts nor credentials. No results are prefilled.

## Patch and recover

For each change, capture the approved artifact manifest, compatibility matrix, current configuration and rollback plan. Back up control-plane state and application data using their owners' documented procedures. An etcd snapshot does not back up persistent-volume contents. Test restoration in a separate isolated cluster before claiming recoverability.

Upgrade a disposable canary node or cluster first. Check network policy, DNS, storage, admission policy and a synthetic inference request. Follow supported component version-skew and upgrade order. Drain nodes under a reviewed disruption budget; forced deletion is not a substitute for handling blocked workloads. Keep known-good images and configuration for the agreed rollback window.

Recovery drill: a registry is unavailable and one node is lost. Restore registry access from its backup, replace only the disposable node, pull the recorded digests and verify application state. Record elapsed recovery time and data loss against declared targets. Do not infer these from a backup job's green status.

Close the lab by removing only its disposable resources, revoking temporary credentials and restoring network rules. Preserve approved evidence under retention policy. Interview: why can an air-gapped system still leak data? Local logs, removable media, privileged users and later exports remain paths. Network isolation reduces paths; it does not replace access control or review.
