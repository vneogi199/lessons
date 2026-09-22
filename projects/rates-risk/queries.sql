-- 1. LEFT JOIN retains limits for desks without positions. Aggregate before joining.
WITH exposure AS (
  SELECT desk,currency,SUM(notional) AS gross_notional,SUM(dv01) AS gross_dv01
  FROM positions GROUP BY desk,currency
)
SELECT l.desk,l.currency,COALESCE(e.gross_notional,0) AS gross_notional,
       COALESCE(e.gross_dv01,0) AS gross_dv01,l.notional_limit,l.dv01_limit
FROM limits l LEFT JOIN exposure e ON l.desk=e.desk AND l.currency=e.currency
ORDER BY l.desk,l.currency;

-- 2. GROUP BY/HAVING: active desk-currency pairs. No cross-currency totals.
SELECT desk,currency,COUNT(*) AS requests,SUM(notional) AS requested_notional
FROM rfqs WHERE status='parsed'
GROUP BY desk,currency HAVING COUNT(*) >= 2
ORDER BY requested_notional DESC,desk,currency;

-- 3. Latest rate per group at a cutoff; filter future data BEFORE ranking.
WITH ranked AS (
  SELECT *,ROW_NUMBER() OVER (
    PARTITION BY currency,tenor_months ORDER BY observed_at DESC
  ) AS rn FROM rate_ticks WHERE observed_at <= :as_of
)
SELECT currency,tenor_months,observed_at,rate FROM ranked WHERE rn=1
ORDER BY currency,tenor_months;

-- 4. Running RFQ volume: explicit ROWS frame and stable tie-breaker.
SELECT id,desk,currency,received_at,notional,
       SUM(notional) OVER (PARTITION BY desk,currency
         ORDER BY received_at,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_notional,
       ROW_NUMBER() OVER (PARTITION BY desk,currency ORDER BY received_at DESC,id DESC) AS newest_rank
FROM rfqs WHERE status='parsed' ORDER BY desk,currency,received_at,id;

-- 5. Previous observation. Parse decimal strings and calculate bps in Python.
SELECT currency,tenor_months,observed_at,rate,
       LAG(rate) OVER (PARTITION BY currency,tenor_months ORDER BY observed_at) AS previous_rate
FROM rate_ticks ORDER BY currency,tenor_months,observed_at;

-- 6. Find missing limits instead of treating them as unlimited.
SELECT DISTINCT p.desk,p.currency FROM positions p
LEFT JOIN limits l ON p.desk=l.desk AND p.currency=l.currency
WHERE l.desk IS NULL;
