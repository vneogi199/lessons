# Database failover drill

Status: designed, not executed. Use an owner-approved disposable environment.
Do not stop processes, change firewall rules, promote nodes or alter replication
on a shared system from this document alone. Follow a reviewed runbook for the
selected engine, version and failover-manager distribution.

## Prepare

1. Record exact host/cluster identities, engine and manager versions, topology,
   client/proxy routes, durability settings, replication mode and backup location.
2. Name the test owner, abort authority, fencing mechanism and cleanup owner.
   Verify restoration in isolation before fault injection.
3. Agree on service recovery criteria, RPO/RTO targets, workload, observation
   window and maximum test duration. Example targets: no lost acknowledged writes
   and application recovery within 60 seconds. These are illustrative, not promises.
4. Use synthetic records. Send uniquely keyed operations with sequence, timestamp,
   payload checksum and business invariant. Save acknowledgements in an independent
   client journal. Keep unknown outcomes separate. Preserve evidence outside the
   failed node. Define timestamp synchronization or uncertainty bounds.
5. Establish normal read/write latency and error rate. Capture source and replica
   progress, apply errors, manager view and routing. Verify a read-your-write marker
   on each candidate rather than relying only on a seconds-lag gauge.

## Run one fault per fresh test

| Fault | Prediction to write first | Required evidence |
|---|---|---|
| Writer process failure | Which candidate is eligible? | Detection, fencing, promotion, routing and client timeline |
| Lagging replica | Does promotion wait, refuse or accept declared loss? | Received/executed history and missing acknowledged IDs |
| Writer isolated from manager but reachable by a test client | Can two writers accept conflicting changes? | Controlled old-writer write attempts and enforcement result |
| Manager loses required voting majority | Does it refuse unauthorized recovery? | Manager logs and unchanged/blocked writer selection |
| Replica apply error | Is the stalled candidate excluded? | Error state, executed history and recovery decision |
| Stale proxy/DNS/client connection | Does the app keep reaching the old writer? | Destination identity for each attempt; stale writer blocked |
| Lost response around commit | Can retry duplicate business effects? | Stable operation ID, reconciliation and final row/effect count |
| Former writer returns | Is divergent history contained? | No automatic conflicting writes; validated rejoin/reseed record |

For a planned switchover, stop admission or quiesce the intended workload, catch up
the candidate and transfer ownership under the reviewed protocol. Compare its
evidence with an unplanned failover; do not generalize one result to the other.

## Observe the entire recovery

Record failure start, detection, fencing confirmation, candidate selection,
promotion, route update, first valid application success and sustained recovery.
The RTO clock does not stop when the management dashboard turns green.

Continue synthetic client traffic through the approved paths. Include a held
connection to the old writer in the partition test. Do not treat “old writer was
unreachable from the manager” as proof that it was unable to accept writes.

Compare the recovered dataset with the independent journal:

- Every acknowledged ID has the expected payload or is explicitly reported lost.
- Unknown writes are reconciled rather than blindly replayed as new operations.
- No duplicate business effect or cross-record invariant violation exists.
- Replicas converge to the accepted history; divergent changes are investigated.
- Application errors, tail latency and recovery time meet the agreed limits.

## Acceptance and abort

Pass only when data, single-writer enforcement and application recovery satisfy
the declared criteria. Record loss count, recovery-point gap and uncertainty.
Stop on conflicting writers, unexpected target identity, uncontrolled load,
missing evidence or inability to restore the test safely. Preserve logs first.

If zero-loss was the target but async replication lost an acknowledged write,
the drill failed that target even if promotion worked perfectly.

## Restore and report

Remove only test-created faults/resources. Reconcile histories before rejoining
the former writer. Verify replication health, permissions, routing, backups and
application invariants. Schedule failback separately; do not reverse roles merely
to restore the original diagram.

Report template:

| Field | Result |
|---|---|
| Build/configuration/topology | Not run |
| Fault and exact target | Not run |
| Acknowledged / unknown / lost / duplicate operations | Not run |
| Fencing proof, including stale client path | Not run |
| Observed recovery-point gap and clock uncertainty | Not run |
| Application recovery duration and sustained window | Not run |
| Target met? Evidence links? | Not run |
| Rejoin, cleanup and remediation owner | Not run |

Interview exercise: promotion takes 8 seconds but clients fail for 70 seconds
because connections are not refreshed. Which metric is the service recovery time?
Answer: 70 seconds under that measurement boundary, not the 8-second promotion.
Investigate client/proxy behavior without weakening old-writer fencing.
