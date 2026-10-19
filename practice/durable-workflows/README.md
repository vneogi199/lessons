# Durable outbox and saga lab

Start with [the walkthrough](../../reference/durable-outbox-saga.html). Uses only
Python's standard library and five separate SQLite files in a temporary test/demo
directory. No packages, brokers, cloud resources or real payments are involved.

From the repository root:

```sh
python3 -B practice/durable-workflows/demo.py
python3 -B -m unittest discover -s practice/durable-workflows -p 'test_*.py' -v
```

Expected demo: two broker deliveries, one consumer effect; saga states `charge`,
`release`, then `compensated` after reopening its stored state. Twelve tests check
producer/consumer rollback, relay/acknowledgement gaps, duplicate/conflicting IDs,
restart recovery, successful saga completion, service-effect reconciliation,
compensation replay and a persistent retry budget ending in manual review.

## Files and boundaries

- `source.sqlite`: order and outbox commit together.
- `broker.sqlite`: a deliberately small fake durable transport; accepts duplicates.
- `consumer.sqlite`: inbox and local effect commit together.
- `sagas.sqlite`: action state, attempt count and history.
- `services.sqlite`: synthetic reservations/charges and idempotent operation receipts.

Closing and reopening connections discards Python object state. Exceptions
simulate interruptions at named boundaries. Tests do **not** kill an OS process,
cut power or validate filesystem/hardware durability. Temporary files are removed
after each test/demo; they contain synthetic data only.

## Intentional limits

Single trusted tenant, one consumer, one relay and one saga worker per instance.
No authorization boundary, network protocol, scheduler, CDC, dead-letter handler,
leases, concurrent ownership or global ordering guarantee is implemented. A bad
event remains unacknowledged and blocks this sequential consumer for investigation.
Production needs bounded quarantine/replay, retention rules and protected storage.

The fake service offers authoritative receipt lookup by `(saga, action)` and
idempotent execution. A real provider with delayed or missing reconciliation must
not be treated as this fake: preserve unknown outcomes and request review rather
than assuming a missing receipt means no effect. No real payment semantics are
claimed. Compensation releases a synthetic reservation, not a general rollback.

Retries are caller-driven with a persisted three-dispatch budget per action.
There is no sleep, backoff clock or background worker. Restarting cannot reset the
budget. A saved receipt is reconciled before applying the budget, so a completed
last attempt can still be recovered. Manual review never automatically releases
resources or charges again. Store an audited operator decision in a real system.
