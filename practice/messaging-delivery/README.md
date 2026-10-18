# Messaging delivery boundaries — no broker required

Read [RabbitMQ versus Kafka](../../reference/rabbitmq-kafka.html) first.
Run from the repository root with standard-library Python:

```sh
python3 -B practice/messaging-delivery/exercise.py -v
```

Six tests check direct/fanout routing, duplicate routing bindings, unknown keys,
redelivery after commit, conflicting event content, transactional rollback and
bounded retry decisions. The database is in memory. No services or packages are
installed, and nothing is sent to a broker.

The SQLite transaction couples the inbox row and local balance update. The
lost-ack case simply invokes the same event twice; it does not simulate a socket,
broker, process crash, concurrent database access or replication failure. The
retry helper chooses a policy result but supplies no scheduler or durable attempt
store. Routing covers direct/fanout only, not an AMQP protocol implementation.

Production work needs trusted tenant/consumer-scoped identities, payload/schema
validation, durable stores, SDK-specific acknowledgement handling, access controls,
bounded retries and tested recovery. External writes need their own idempotency
or reconciliation contract. Passing these local checks proves none of the live
broker guarantees. Use the reference page's integration checklist separately.
