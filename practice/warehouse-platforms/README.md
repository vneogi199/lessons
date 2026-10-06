# Three analytics stores, one small risk dataset

An incoming record says that position 1 has an amount of 100. A later version changes it to 125. Position 2 adds 80. The latest-position total is 205. Snowflake and Databricks use this snapshot example. ClickHouse uses a different event example: changes of 100, 25 and 80 also total 205. Keep snapshots and changes separate or you will double-count exposure.

These are offline source fixtures and manual run recipes. No database, workspace, warehouse or cluster was created. SQL has not been executed. Comments show optional actions, not successful results.

## Before any cloud run

Get explicit approval for the account, region, owner, budget, duration and exact `lesson_*` resources. Use synthetic data only. Confirm the namespace is empty. Review the SQL one section at a time in an existing approved client; do not paste the whole file into an administrator session. Record platform version/edition, query IDs, expected and actual rows, denied access attempts, costs and cleanup evidence. Stop on an unexpected result.

Use short-lived identity or an approved secret manager. Do not put credentials in these files. A lab administrator creates grants; the application runs with a restricted identity. Cleanup commands are commented out because they delete data. Confirm exact ownership before enabling any of them.

## Snowflake

Read `snowflake.sql` with `risk.csv`. A virtual warehouse supplies compute; the tables remain after compute suspends. The X-Small warehouse starts suspended and pauses after 60 seconds idle. Compare a larger size only with approval and measured query duration. More compute may shorten a query but does not guarantee lower total credits.

An internal stage holds the uploaded CSV. `COPY` validates the file and loads raw records. Its load history helps avoid repeating the same file; business IDs and versions still determine upsert behavior. The append-only stream records inserted rows. A committed task MERGE consumes that stream's offset. A SELECT alone does not consume it. Inspect task history and the two expected target rows before scheduling anything. Tasks start suspended; the one-off `EXECUTE TASK` also needs the owner role's account-level task privilege.

Time Travel reads the table before a recorded update statement. Recover into a new table and compare with the snapshot before considering replacement. Retention limits recovery. A resource monitor can notify and suspend a warehouse, but it is not a universal hard cap on storage, serverless or all account costs. Check those separately.

The optional share grants expose only the synthetic table. Adding a consumer account is a separate approval. Use a secure view for an approved subset in a real system; sharing an entire source table can expose fields added later.

Failure exercise: send two different amounts with the same ID and version. Stop ingestion and quarantine them. Choosing a row by an arbitrary tie-breaker conceals a data-quality failure. Interview question: Why do you need idempotent data handling if the task consumes a stream? Retries, reloads and upstream duplicates can still present the same logical business event.

## Databricks

An operator must provide an existing workspace, Unity Catalog metastore/catalog and approved SQL warehouse. The SQL fixture creates a small managed Delta table. Unity Catalog controls access; Delta's transaction log tracks table versions. `MERGE` applies the latest record and skips older versions. Repeating it leaves the total unchanged.

Record the merge version from `DESCRIBE HISTORY`. After the deliberate update, query that version and restore only this disposable table. Restore creates a new table version; it does not erase the log. Old data files must still exist. Do not disable retention safety checks to make a demonstration work.

For classic compute, `cluster-policy.json` is a policy fragment. Before creating compute, the operator must combine it with approved runtime, node types, access mode and cloud/network rules. It fixes one worker and requires auto-termination. It does not provision a cluster or govern serverless costs. Use a small approved SQL warehouse with auto-stop for this SQL exercise.

Create a disabled job in the existing workspace. Add a SQL task on that warehouse containing only the MERGE statement, followed by the `assert_true` checks. Use a dedicated service principal, a five-minute task timeout, maximum concurrent runs of one and no automatic retry for the first review. Run once with approval, then repeat once to check idempotency. Record the job/run IDs and table version. Keep setup, grants and cleanup out of scheduled tasks. If a run fails, inspect the target version before retrying. Suspend the schedule, delete the lab job, then review schema deletion. Retain policy resources if another workload uses them.

Interview question: Does `USE CATALOG` alone allow a read? No. A reader also needs `USE SCHEMA` and `SELECT` on the table, with compute access controlled separately. Test denial with a principal that does not inherit broader permissions.

## ClickHouse

`clickhouse.sql` stores append-only events in MergeTree. Monthly partitions help manage time ranges. The sorting key groups desk and time values so the engine can skip ranges when a filter matches them. It does not enforce unique IDs. Small inserts create many parts; batch inserts in a real producer.

The materialized view processes newly inserted blocks into a SummingMergeTree target. Always aggregate with `GROUP BY` when reading totals; parts may not have merged yet. Existing source rows are not automatically backfilled by creating this view. Source updates and deletes do not reverse earlier aggregate contributions. This is why the example uses changes instead of latest-position snapshots.

Failure exercise: insert the same event batch again in a disposable run. Plain MergeTree accepts duplicates and the total doubles. Fix the producer's durable event handling, or design and test engine-specific deduplication. Do not claim exactly-once processing from the materialized view alone.

TTL work happens asynchronously during merges. A 30-day rule is not a promise that a row vanishes at an exact instant. The aggregate target has its own retention needs; deleting old source rows does not delete old totals. A cold storage volume needs an operator-configured storage policy. Cloud services may manage storage differently. Review the selected deployment before enabling that optional SQL.

Apply the reader role and quota to an approved user, then prove SELECT allowed and INSERT denied. Check query logs, memory and read bytes as well as elapsed time. Budget alerts do not replace client timeouts, quotas or infrastructure sizing. Stop producers and drop the view before deleting source and target tables.

After each exercise, explain why the same total of 205 can come from snapshots or events. Ask your teacher to review your explanation, especially duplicate and late-arrival behavior.

Primary sources: [Snowflake tasks](https://docs.snowflake.com/en/sql-reference/sql/create-task), [Time Travel](https://docs.snowflake.com/en/user-guide/data-time-travel), [resource monitors](https://docs.snowflake.com/en/user-guide/resource-monitors), [Databricks Delta tutorial](https://docs.databricks.com/aws/en/delta/tutorial), [Unity Catalog privileges](https://docs.databricks.com/aws/en/data-governance/unity-catalog/manage-privileges/privileges), [ClickHouse MergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree), [materialized views](https://clickhouse.com/docs/materialized-view/incremental-materialized-view).
