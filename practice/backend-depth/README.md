# Backend-depth exercises

Read [MySQL](../../reference/mysql-innodb-practice.html),
[WebRTC](../../reference/webrtc-practice.html) and
[Datadog](../../reference/datadog-practice.html) before the exercises.

`mysql.sql` is a MySQL 8.4 worksheet for a dedicated empty practice schema.
It includes schema, fixture, aggregation, window query, keyset pagination and
two-session lock instructions. It is not executed here and is not rerunnable
unchanged against an existing fixture. No automatic cleanup is supplied.

The WebRTC guide links a working primary-source data-channel example and specifies
the next signaling, relay, identity, backpressure and failure experiments. No
signaling or TURN server is supplied or started; a loopback sample does not prove
internet connectivity. Do not test cameras, microphones or relay services without
appropriate permission.

`safe_logs.py` demonstrates source-side minimization using Python's standard
logging formatter. In an already instrumented application, add it to the selected
stdout handler. Do not attach a second exporter blindly. The service/env/version
constants are teaching values; use reviewed release configuration in an application.
Trace identifiers come from the SDK's active context, never from arbitrary user input.

From the repo root:

```sh
python3 -B -m unittest discover -s practice/backend-depth -v
```

These tests verify only this formatter. They do not verify all application logs,
Datadog parsing, trace correlation, network export, redaction of arbitrary data or
monitor behaviour. Configure and verify those separately in an approved staging
account with synthetic data and a spend limit. No software or paid service is
required for the offline checks.
