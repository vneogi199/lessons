-- MySQL 8.4/InnoDB worksheet, not executed here.
-- Use an approved empty practice schema. No destructive cleanup or installation.
SELECT VERSION(), @@transaction_isolation, @@autocommit, @@session.time_zone;
CREATE TABLE lesson_customers (
 id BIGINT PRIMARY KEY,
 name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE lesson_orders (
 id BIGINT PRIMARY KEY,
 customer_id BIGINT NOT NULL,
 amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
 created_at DATETIME(6) NOT NULL,
 FOREIGN KEY (customer_id) REFERENCES lesson_customers(id),
 INDEX customer_created (customer_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO lesson_customers VALUES (1, 'Example customer'), (2, 'Other customer');
INSERT INTO lesson_orders VALUES
 (1,1,1000,'2026-01-01 10:00:00'),
 (2,1,2000,'2026-01-02 10:00:00'),
 (3,1,1000,'2026-01-02 10:00:00'),
 (4,2,500,'2026-01-03 10:00:00');
SELECT c.id, SUM(o.amount_cents) AS total_cents
FROM lesson_customers c JOIN lesson_orders o ON o.customer_id=c.id
GROUP BY c.id HAVING SUM(o.amount_cents) >= 1000;
-- Expected: customer 1, 4000 cents.
WITH ranked AS (
 SELECT id, customer_id, created_at,
 ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC,id DESC) AS rn
 FROM lesson_orders
)
SELECT id, customer_id FROM ranked WHERE rn=1 ORDER BY customer_id;
-- Expected: (3,1), (4,2).
EXPLAIN SELECT id, created_at FROM lesson_orders
WHERE customer_id=1 AND (created_at > '2026-01-01 10:00:00'
 OR (created_at='2026-01-01 10:00:00' AND id>1))
ORDER BY created_at,id LIMIT 2;
-- Actual page is IDs 2 and 3. EXPLAIN itself returns a plan.
-- EXPLAIN ANALYZE would execute the SELECT; only use on approved workloads.

-- Two-session exercise; do NOT run this whole file as one session:
-- A: START TRANSACTION;
-- A: SELECT * FROM lesson_orders WHERE id=1 FOR UPDATE;
-- B: SET SESSION innodb_lock_wait_timeout=5;
-- B: START TRANSACTION;
-- B: UPDATE lesson_orders SET amount_cents=1100 WHERE id=1;
-- A: ROLLBACK; -- before B's timeout, to observe B proceeding
-- B: ROLLBACK; -- leave the fixture unchanged
-- If B times out, explicitly roll back its transaction and rerun deliberately.
