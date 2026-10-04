# Order/customer GraphQL practice

Read the [worked lesson](../../reference/api-query-practice.html#graphql).

Requires an existing Python 3.10+ environment with Strawberry GraphQL and pytest.
The source follows the documented Strawberry DataLoader and schema.execute APIs.
No package versions are runtime-verified here. No packages were installed.

When execution is authorized, run `python -m pytest -q` from this directory.
The four tests create synthetic SQLite data under pytest's temporary directory.
Expected: all pass. Actual result: not run.

`orders.py` supplies the schema and every repository operation. The tests execute
GraphQL through `schema.execute`; they do not mount an HTTP endpoint. Actors are
trusted fixture identities. Do not accept a tenant or write flag from a client.
Missing children are deliberate fixtures; no foreign key is declared for that case.

The trace callback counts actual SELECT statements, without saving their text.
The first test expects two SELECTs for four orders. This is a test assertion,
not a measured result. The customer SQL deliberately sorts in reverse key order;
the batch adapter must restore requested order and preserve missing positions.

Each call offloads its SQLite connection to a worker thread and closes it there.
Cancelling the await does not stop an already running database write. Production
needs database deadlines, admission limits and an outcome-reconciliation policy.
The schema limits page and batch sizes, but repeated aliases can still multiply
work. Add query cost/depth, operation, body and time limits before exposing HTTP.
This lab does not supply production authentication, error masking or HTTP serving.
