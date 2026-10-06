-- Manual, approval-gated recipe. Fresh isolated account namespace only.
-- Stop on every error. Never use CREATE OR REPLACE on existing lab resources.
USE ROLE SYSADMIN;
CREATE WAREHOUSE LESSON_WH WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 60 AUTO_RESUME = TRUE INITIALLY_SUSPENDED = TRUE
  STATEMENT_TIMEOUT_IN_SECONDS = 60;
CREATE DATABASE LESSON_WAREHOUSE DATA_RETENTION_TIME_IN_DAYS = 1;
CREATE SCHEMA LESSON_WAREHOUSE.LAB;
USE SCHEMA LESSON_WAREHOUSE.LAB;
USE WAREHOUSE LESSON_WH;
ALTER SESSION SET QUERY_TAG = 'synthetic-warehouse-practice';
CREATE TABLE incoming (id INTEGER, version INTEGER, desk VARCHAR, amount NUMBER(12,2));
CREATE TABLE current_risk LIKE incoming;
CREATE FILE FORMAT risk_csv TYPE = CSV SKIP_HEADER = 1 FIELD_OPTIONALLY_ENCLOSED_BY = '"';
CREATE STAGE risk_stage FILE_FORMAT = risk_csv;
CREATE STREAM arrivals ON TABLE incoming APPEND_ONLY = TRUE;
-- In an approved Snowflake CLI session only, upload the supplied synthetic CSV:
-- PUT file:///absolute/reviewed/path/risk.csv @risk_stage AUTO_COMPRESS=TRUE;
-- Then run COPY. FORCE is intentionally omitted; inspect COPY results.
COPY INTO incoming FROM @risk_stage ON_ERROR = 'ABORT_STATEMENT';

-- New tasks start suspended. The owner needs EXECUTE TASK granted by an admin.
CREATE TASK merge_risk WAREHOUSE = LESSON_WH SCHEDULE = '5 MINUTE'
  USER_TASK_TIMEOUT_MS = 60000 SUSPEND_TASK_AFTER_NUM_FAILURES = 1
  WHEN SYSTEM$STREAM_HAS_DATA('LESSON_WAREHOUSE.LAB.ARRIVALS')
AS MERGE INTO current_risk t USING (
  SELECT id, version, desk, amount FROM arrivals
  QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY version DESC) = 1
) s ON t.id = s.id
WHEN MATCHED AND s.version > t.version THEN UPDATE
  SET version=s.version, desk=s.desk, amount=s.amount
WHEN NOT MATCHED THEN INSERT (id,version,desk,amount)
  VALUES (s.id,s.version,s.desk,s.amount);
-- Admin-reviewed one-off execution: GRANT EXECUTE TASK ON ACCOUNT TO ROLE SYSADMIN;
-- EXECUTE TASK merge_risk;
-- Wait for SUCCEEDED in TASK_HISTORY before evaluating results.
SELECT id, version, desk, amount FROM current_risk ORDER BY id;
-- Expected: (1,2,RATES,125.00), (2,1,CREDIT,80.00).
-- Reject conflicting rows with the same (id,version) upstream; ranking cannot
-- resolve business conflicts deterministically without a source sequence.

CREATE TABLE risk_snapshot CLONE current_risk;
UPDATE current_risk SET amount=999 WHERE id=1;
SET change_query = LAST_QUERY_ID();
SELECT * FROM current_risk BEFORE (STATEMENT => $change_query) ORDER BY id;
CREATE TABLE recovered_risk CLONE current_risk BEFORE (STATEMENT => $change_query);
-- Compare recovered_risk with risk_snapshot. Do not overwrite a live table.

USE ROLE SECURITYADMIN;
CREATE ROLE LESSON_READER;
GRANT USAGE ON WAREHOUSE LESSON_WH TO ROLE LESSON_READER;
GRANT USAGE ON DATABASE LESSON_WAREHOUSE TO ROLE LESSON_READER;
GRANT USAGE ON SCHEMA LESSON_WAREHOUSE.LAB TO ROLE LESSON_READER;
GRANT SELECT ON TABLE LESSON_WAREHOUSE.LAB.current_risk TO ROLE LESSON_READER;
-- Assign this role only to a reviewed lab principal. Test SELECT allowed and
-- UPDATE denied in a separate session with no inherited write roles.

-- Optional account-admin controls, reviewed separately before executing:
-- CREATE RESOURCE MONITOR LESSON_MONITOR WITH CREDIT_QUOTA=1
--   FREQUENCY=DAILY START_TIMESTAMP=IMMEDIATELY
--   TRIGGERS ON 80 PERCENT DO NOTIFY ON 100 PERCENT DO SUSPEND_IMMEDIATE;
-- ALTER WAREHOUSE LESSON_WH SET RESOURCE_MONITOR=LESSON_MONITOR;
-- CREATE SHARE LESSON_SHARE;
-- GRANT USAGE ON DATABASE LESSON_WAREHOUSE TO SHARE LESSON_SHARE;
-- GRANT USAGE ON SCHEMA LESSON_WAREHOUSE.LAB TO SHARE LESSON_SHARE;
-- GRANT SELECT ON TABLE LESSON_WAREHOUSE.LAB.current_risk TO SHARE LESSON_SHARE;
-- Do not add consumer accounts without separate data-sharing approval.

-- Cleanup only after checking ownership and recording evidence:
-- ALTER TASK LESSON_WAREHOUSE.LAB.merge_risk SUSPEND;
-- DROP SHARE LESSON_SHARE; -- only if created here
-- DROP DATABASE LESSON_WAREHOUSE;
-- DROP WAREHOUSE LESSON_WH;
-- DROP ROLE LESSON_READER;
-- DROP RESOURCE MONITOR LESSON_MONITOR; -- only if created here
