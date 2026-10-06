-- Approval required; existing isolated server over TLS. Fresh database only.
CREATE DATABASE lesson_risk;
CREATE TABLE lesson_risk.events (
  id UInt64, desk LowCardinality(String), amount Decimal(12,2),
  event_time DateTime('UTC')
) ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (desk,event_time,id)
TTL event_time + INTERVAL 30 DAY DELETE;
CREATE TABLE lesson_risk.daily (
  desk LowCardinality(String), day Date, amount Decimal(18,2)
) ENGINE = SummingMergeTree ORDER BY (desk,day);
CREATE MATERIALIZED VIEW lesson_risk.daily_mv TO lesson_risk.daily AS
SELECT desk, toDate(event_time) AS day, sum(amount) AS amount
FROM lesson_risk.events GROUP BY desk,day;
-- One insert batch, using today's time to avoid immediately expired fixture data.
INSERT INTO lesson_risk.events VALUES
  (1,'RATES',100.00,now()),(2,'RATES',25.00,now()),(3,'CREDIT',80.00,now());
SELECT desk,sum(amount) AS amount FROM lesson_risk.daily GROUP BY desk ORDER BY desk;
-- Expected CREDIT=80.00, RATES=125.00 even before background parts merge.
SELECT throwIf(count()!=3, 'wrong event count') FROM lesson_risk.events;
SELECT throwIf(sum(amount)!=205.00, 'wrong total') FROM lesson_risk.daily;
EXPLAIN indexes=1 SELECT sum(amount) FROM lesson_risk.events WHERE desk='RATES';

CREATE ROLE lesson_risk_reader;
GRANT SELECT ON lesson_risk.* TO lesson_risk_reader;
CREATE QUOTA lesson_risk_quota FOR INTERVAL 1 MINUTE
  MAX queries=60, read_rows=1000000, execution_time=30 TO lesson_risk_reader;
-- Admin assigns the role to an approved lab identity, without inherited writes.
-- Its client should additionally set max_execution_time=5 and max_result_rows=1000.
-- A quota covers an interval; per-query settings cap individual requests.
-- Storage tier extension requires an existing policy with a cold volume:
-- ALTER TABLE lesson_risk.events MODIFY TTL
--   event_time + INTERVAL 7 DAY TO VOLUME 'cold',
--   event_time + INTERVAL 30 DAY DELETE;
-- Do not run this until the operator supplies and tests that storage policy.

-- Cleanup after stopping writers and recording role assignments:
-- DROP VIEW lesson_risk.daily_mv;
-- DROP TABLE lesson_risk.daily;
-- DROP TABLE lesson_risk.events;
-- DROP DATABASE lesson_risk;
-- DROP QUOTA lesson_risk_quota;
-- DROP ROLE lesson_risk_reader;
