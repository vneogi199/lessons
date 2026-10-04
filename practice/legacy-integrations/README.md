# Legacy XML and database boundaries

Read [the worked lesson](../../reference/legacy-boundary-practice.html).
Source and tests are supplied, not executed. No package, ODBC driver, wallet,
database account or network service was installed/configured. Python 3.10+,
pytest, Pydantic v2, defusedxml and Zeep are needed for the local tests. Database
factories additionally need the appropriate already-installed client libraries.
Verify/pin compatible versions before an approved run.

When authorized, `python -m pytest -q` from this directory runs local fixtures.
test_soap generates an envelope with Zeep using only the two approved local schema
files. LocalOnly rejects remote/unlisted imports and every transport operation.
The success fixture uses the Records response declared by the WSDL/XSD. The
converter enforces a deliberately narrower USD/GBP domain rule than xs:string.

The converter preserves the RFQ namespace, record IDs, repeated records, currency
attributes, decimal strings and ISO dates. Absent Note remains absent; xsi:nil is
JSON null; an empty present Note becomes an empty string. DTDs/entities/external
references are forbidden and input is capped at 16 KiB. It is a domain converter,
not a generic lossless XML converter or a SOAP-signature verifier.

fault_policy maps BUSY/AUTH/MISSING/INVALID to safe categories. Unknown codes do
not become success. Only read-only BUSY may retry through the bounded retry helper
in model-boundaries. An uncertain mutation must reconcile first. Raw faultstrings
can contain private data, so the mapped output does not expose them.

For a separately approved real SOAP service, use a fixed HTTPS endpoint and reviewed
WSDL/XSD bundle; enable certificate verification using an approved CA chain; set
both schema-loading and operation timeouts. Add a streaming transport byte cap
before parsing. The local fixture intentionally has no network adapter. Do not
enable Zeep debug/history logging with real customer XML. Sources:
[Zeep settings](https://docs.python-zeep.org/en/master/settings.html),
[transport](https://docs.python-zeep.org/en/master/transport.html).

## Database connection recipes

databases.py supplies pyodbc, SQLAlchemy and Oracle factories. Supply credentials
from an approved secret manager; they are never constants. Hosts, databases and
wallet paths are trusted deployment configuration, not model/user inputs.
SQL Server requires ODBC Driver 18 and a valid server certificate; encryption is
enabled and TrustServerCertificate is disabled. ODBC values are escaped rather
than concatenated as raw configuration fragments. SQLAlchemy uses URL.create.

Oracle uses TCPS and server-DN checking with an approved wallet. Verify the database
certificate/service-name setup and Thin/Thick mode contract for the installed
driver. Pools have explicit sizes/waits. Acquired sessions set call timeouts;
context managers roll back and close even on failure. Call engine.dispose() or
pool.close() during application shutdown after requests drain. Timeouts do not
prove that a remote mutation did not happen.

Sources: [SQLAlchemy SQL Server](https://docs.sqlalchemy.org/en/20/dialects/mssql.html),
[python-oracledb connections](https://python-oracledb.readthedocs.io/en/latest/user_guide/connection_handling.html).

## Constrained Text-to-SQL

typed_sql.py publishes only two curated views and two typed intents. A model may
produce the intent, but never SQL. Missing desk/date is a clarification case.
The server supplies tenant and allowed desks. The compiler chooses a fixed SQL
template and bound parameters. No SELECT-prefix validator is used or needed.

The latest-RFQ query uses a unique tie-breaker and assumes received_at is stored in
UTC. as_of means through the end of that UTC day. Exposure assumes one agreed
currency and one row grain in the curated view; do not sum mixed currencies or
join a one-to-many table without checking the grain. Empty output is no_data, not
a model-invented number. Unexpected cardinality fails. SQL Server TOP/DATEADD syntax
is not portable Oracle SQL; write and review separate templates before using Oracle.

DBA-approved setup, not automatically executed:

```sql
CREATE ROLE lesson_reader;
GRANT SELECT ON OBJECT::reporting.RFQ TO lesson_reader;
GRANT SELECT ON OBJECT::reporting.Exposure TO lesson_reader;
-- Add only the approved contained user; do not grant broad db_datareader.
-- ALTER ROLE lesson_reader ADD MEMBER [approved_application_user];
```

Use a dedicated user with no other write roles/grants; inspect effective permissions
and inherited memberships. A view grant does not by itself provide per-tenant row
security. Keep tenant predicates and add independently reviewed RLS when required.

Authorized integration acceptance: allowed SELECT succeeds; wrong desk is rejected
before SQL; an UPDATE/DELETE/DDL attempt through that same database principal fails;
an invalid server certificate fails; connect/query/pool timeouts are observed;
shutdown closes pools. Perform denial probes only on an isolated synthetic database,
inside a rollback transaction where applicable. Unit mocks do not prove DB grants.
No read-only-role or TLS integration test has run.

Tomorrow, explain why schema context should contain approved names/grain, not an
unrestricted schema dump. Ask your teacher to trace one ambiguous query and its
clarification response before adding a new SQL template.
