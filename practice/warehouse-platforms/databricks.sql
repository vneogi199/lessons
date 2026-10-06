-- Approval required. Existing Unity Catalog catalog lesson_sandbox and SQL
-- warehouse required. Fresh schema only; stop if any object already exists.
CREATE SCHEMA lesson_sandbox.risk_practice;
USE CATALOG lesson_sandbox;
USE SCHEMA risk_practice;
CREATE TABLE incoming (id BIGINT, version BIGINT, desk STRING, amount DECIMAL(12,2)) USING DELTA;
INSERT INTO incoming VALUES (1,1,'RATES',100.00),(1,2,'RATES',125.00),(2,1,'CREDIT',80.00);
CREATE TABLE current_risk (id BIGINT, version BIGINT, desk STRING, amount DECIMAL(12,2)) USING DELTA;
MERGE INTO current_risk t USING (
  SELECT id,version,desk,amount FROM (
    SELECT *, row_number() OVER (PARTITION BY id ORDER BY version DESC) AS rank
    FROM incoming
  ) WHERE rank=1
) s ON t.id=s.id
WHEN MATCHED AND s.version > t.version THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
SELECT assert_true(count(*)=2 AND sum(amount)=205.00, 'wrong risk totals') FROM current_risk;
-- Re-run MERGE alone: same two rows and total. Conflicting equal source versions
-- must be quarantined before this transform, not chosen arbitrarily.
DESCRIBE HISTORY current_risk;
-- Record the version of the completed MERGE before running the following UPDATE.
UPDATE current_risk SET amount=999 WHERE id=1;
-- Substitute the recorded integer version after review:
-- SELECT * FROM current_risk VERSION AS OF <recorded_version>;
-- RESTORE TABLE current_risk TO VERSION AS OF <recorded_version>;
-- SELECT assert_true(sum(amount)=205.00, 'restore mismatch') FROM current_risk;
-- Never lower deleted-file retention or VACUUM away files needed for recovery.

-- Admin-created workspace group, mapped to approved users/service principal:
GRANT USE CATALOG ON CATALOG lesson_sandbox TO `lesson-readers`;
GRANT USE SCHEMA ON SCHEMA lesson_sandbox.risk_practice TO `lesson-readers`;
GRANT SELECT ON TABLE current_risk TO `lesson-readers`;
-- Use a principal with ONLY these privileges: SELECT succeeds; INSERT fails.
-- Schedule only the MERGE transform in a separately reviewed SQL job. Setup and
-- grant statements belong to a human-controlled provisioning step.
-- Cleanup, after stopping jobs and checking owner and namespace:
-- DROP SCHEMA lesson_sandbox.risk_practice CASCADE;
