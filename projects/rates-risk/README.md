# Rates risk, RFQ parsing and market monitoring

A focused **synthetic interview-preparation implementation**, combining Python, SQL, Pandas/NumPy, FastAPI, pytest and financial-domain reasoning. No live market feed, pricing engine, trade execution or investment advice. All new code/tests are **unrun**, as requested. Nothing was installed.

Practice: [28 interview MCQs with revealable answers and explanations](../../reference/rfq-interview-mcqs.html). Covers Python, SQL/PostgreSQL, Pandas/NumPy, FastAPI/pytest and RFQ/rates-risk judgment. Follow each quiz session with a coding or query-writing attempt.

## Scope and financial conventions

- RFQ means request for quote, not an executed trade. `PAY`/`RECEIVE` explicitly refers to the **fixed leg** of a simplified interest-rate swap. `BUY`/`SELL`, ambiguous `M` notionals and arbitrary prose are rejected, not guessed. An optional `AT` rate is a requested/indicative rate, not a market quote.
- Grammar: `RFQ PAY USD 5MM 5Y IRS AT 4.25%`; `K` = thousand, `MM` = million, tenor `M` = months and `Y` = years. USD/EUR/GBP only. This is not a complete market confirmation: calendars, floating index, settlement/effective dates, payment schedule, collateral and day-count conventions are deliberately absent.
- Rates are decimal fractions: 4.25% = 0.0425. Movement in basis points = `(new_rate - old_rate) × 10,000`. From 0.0400 to 0.0407 is **+7 bp**, not 0.07 bp.
- DV01/BPV measures sensitivity to a one-basis-point move. This implementation takes a **nonnegative gross sensitivity magnitude supplied by a trusted upstream pricing process**, in the position currency per bp. It does not price swaps or derive DV01 from notional/tenor. For non-USD currencies, “currency-value per bp” is the more precise description.
- Limits apply per desk and currency to gross notional and gross DV01. Existing positions plus the proposal must be **less than or equal to** each limit. No netting benefit or FX aggregation. These are teaching rules, not a firm's actual risk policy.
- The endpoint returns a **nonbinding snapshot check**. It does not reserve headroom: two simultaneously approved proposals could collectively breach a limit. Production requires atomic reservations/booking, trusted risk recalculation, valuation timestamps, limit governance and authorization.
- Scenario P&L uses explicitly signed **P&L per +1 bp**, multiplied by a shock in bp. This avoids silently assuming a DV01 sign convention. It is a first-order approximation, not full revaluation, convexity, VaR or stress certification.

Sources: [CME basis-point value](https://www.cmegroup.com/education/courses/introduction-to-sofr/understanding-the-importance-of-basis-point-value), [CME DV01](https://www.cmegroup.com/trading/interest-rates/calculating-the-dollar-value-of-a-basis-point.html).

## Files and preparation priorities

| Priority | Implementation | What to practise |
| --- | --- | --- |
| Python — very high | `core.py` | dictionaries, grouping, deterministic sorting, comprehensions, decimal validation and timezone-aware datetime |
| SQL — very high | `schema.sql`, `queries.sql`, `fixtures.sql` | joins, GROUP BY, HAVING, CTEs, ROW_NUMBER, LAG and latest-per-group |
| Pandas/NumPy — very high | `analytics.py` | group/aggregate, validated merge, missing limits, broadcasting, axes and scenario aggregation |
| FastAPI — high | `api.py` | request models, dependency-based auth, route definitions and sanitized errors |
| pytest — high | `test_core.py`, `test_sql_api.py`, `test_analytics.py` | parametrization, temporary DB fixtures, negative tests, TestClient and monkeypatch |
| Finance — high | conventions above | rates versus percentages/bps, gross exposure, headroom, sensitivity units and stale data |
| System design — high | walkthrough below | explain the actual scope, data flow, failure cases and what is not implemented |

## Existing environment only

Core parsing, monitoring, SQLite and seed code use the standard library. The API expects an existing compatible FastAPI/Pydantic v2/Uvicorn environment; tests additionally need pytest and HTTPX; analytics needs Pandas and NumPy. No requirements lock is claimed because versions were not installed or tested. Do not install anything merely to read the project.

The following commands are **instructions for later**, not commands already executed. Run from this directory only after choosing to test:

```sh
python3 seed.py rates.sqlite3
python3 -m pytest -q
```

Seed refuses an existing destination. If seeding fails, inspect the partial synthetic file rather than rerunning against an unknown database. To practise core tests independently of FastAPI and data libraries: `python3 -m pytest test_core.py -q`.

For a local API, configure `RATES_DB`, `RATES_DESK=RATES` and a random `RATES_API_TOKEN` of at least 32 characters through an approved local secret mechanism. Never commit the token or reuse the deterministic test token. Then:

```sh
python3 -m uvicorn api:create_app --factory --host 127.0.0.1 --port 8001
```

No server has been started. This is a loopback-only teaching application: do not expose it publicly. The single server credential fixes the desk scope; the request cannot choose another desk. Rate data is common synthetic market data. Production requires real identity/roles, TLS, body/rate limits, redacted audit events and secret rotation. API database access is read-only.

## API requests

All endpoints require `Authorization: Bearer <your-private-token>`. Use a private HTTP client credential store; don't place literal tokens in shell history.

- `POST /rfqs/parse`: `{"text":"RFQ PAY USD 5MM 5Y IRS AT 4.25%"}`.
- `POST /risk/check`: `{"text":"RFQ PAY USD 5MM 5Y IRS","proposed_dv01":"2000"}`. Synthetic RATES/USD exposure is 3,000,000 notional and 1,500/bp. The proposal projects 8,000,000 and 3,500/bp against limits of 10,000,000 and 5,000/bp. It passes the snapshot check.
- `POST /rates/monitor`: `{"previous_as_of":"2026-01-05T10:00:00Z","current_as_of":"2026-01-05T10:05:00Z","threshold_bps":"5","max_age_seconds":300}`. USD 2Y moves +7 bp and breaches; USD 5Y moves -4 bp and does not; EUR 2Y is stale and must not be described as a normal market move.

Missing desk/currency limits return 409, not unlimited headroom. Invalid schema/domain inputs return 422, unauthorized requests 401 and database failure 503. Decimal quantities are strings at the API boundary. The caller-supplied proposed DV01 is for exercises only and is not trustworthy enough for production trading authorization.

## Python assessment practice

Attempt these from a blank file, then compare against `core.py`. Suggested time boxes are practice targets, not claims about the interview.

1. **15 minutes — parsing:** normalize whitespace/case, parse canonical RFQs into dictionaries, convert units, reject ambiguous input. Add a new currency only after defining its allowed conventions.
2. **20 minutes — transformations:** group valid RFQs by `(desk, currency)`, calculate counts and total notionals, sort descending by total with deterministic tie-breaking. Do not combine different currencies. Use a comprehension to select groups above a threshold.
3. **20 minutes — datetime:** select the latest observation per `(currency, tenor)` at a supplied cutoff. Reject naive timestamps and conflicting same-time values. Exclude future observations before choosing the latest. Compare UTC-equivalent offsets.
4. **20 minutes — monitoring:** distinguish stale data, missing baseline, missing current tenor, normal move and threshold breach. Check exact threshold equality and an out-of-order snapshot.
5. **15 minutes — risk:** add a proposed gross exposure, calculate headroom, and explain why a read-then-check does not reserve capacity.

Stretch cases: empty input, duplicate delivery, malformed Decimal, negative interest rates, equal timestamps, missing currency keys, and an event received after its observation time. Event-time filtering alone does not reproduce what was actually known historically; add `received_at` when simulating that requirement.

## SQL assessment practice

Write each query before opening `queries.sql`. The fixtures are deliberately small enough to calculate expected answers manually.

1. Join limits to aggregated positions, retaining desks with no positions. `EMPTY/USD` must show zero exposure. Explain why joining two unaggregated one-to-many tables can inflate totals.
2. Group parsed RFQs by desk/currency, keeping only groups with two or more requests using HAVING. Expected: `RATES/USD`, count 2, requested notional 3,000,000.
3. Find the latest rate per currency/tenor at 10:00 UTC using a CTE and ROW_NUMBER. USD 2Y must be 0.0400, not the future 10:05 value.
4. Calculate running request notional with a window function. Same-time `r1`/`r2` rows require an ID tie-breaker and an explicit ROWS frame. Expected RATES totals: 1,000,000 then 3,000,000.
5. Use LAG to pair each rate with its previous observation. Calculate the exact decimal bp move in Python; SQLite REAL conversion is not a precision-preserving financial calculation.
6. Find positions with no configured limit through a LEFT JOIN/NULL condition. Expected: OTHER/EUR. Explain WHERE versus HAVING and COUNT(*) versus COUNT(nullable_column).

Database timestamps use fixed-precision canonical UTC text. Mixed offsets/string formats would break lexical ordering; production PostgreSQL should use suitable timestamp types. Schema uniqueness rejects duplicate ticks; a real multi-source feed also needs source priority/correction rules. The small dataset uses integer monetary units; production precision and overflow limits need a reviewed decimal schema.

## Pandas and NumPy assessment practice

Reproduce query 2 using a DataFrame, then join the result to limits with `validate="many_to_one"`. Keep missing-limit rows visible via the merge indicator; do not silently fill them with unlimited capacity. The requested-notional report is request activity, **not booked exposure or limit utilization**. Validate nulls, integer types and duplicate limit keys before interpreting totals.

For NumPy, predict the shape of sensitivities `[-100,50]` against shocks `[-10,0,10]`. Broadcasting produces a 2×3 position/scenario matrix; summing axis 0 yields portfolio P&L `[500,0,-500]`. Explain why `*` with two same-length 1-D vectors is not the scenario grid. Reject NaN/infinite values and estimate memory before building a large positions×scenarios matrix. Float64 is an analytical approximation; limit accounting remains Decimal/integer.

## An honest system-design story

```text
Authenticated desk → strict RFQ parser → consistent SQLite exposure/limit snapshot
                                      → nonbinding risk decision + headroom
Stored rate ticks → as-of grouping → freshness checks → bp-change classification
Synthetic SQL rows → query/Pandas reports → NumPy scenario approximation
```

Explain why the parser rejects ambiguity instead of asking an LLM to invent missing terms; why token-to-desk scope is server-controlled; why missing/stale data needs an explicit outcome; and why gross DV01 is not net portfolio risk. A consistent snapshot prevents mixed reads but not concurrent approvals consuming the same headroom.

For a production extension, separate ingestion, risk analytics, policy configuration and execution. Add atomic reservations with idempotency and expiry, durable audit events, trusted valuation identity/time, controlled limit changes, source-feed health, replay/backfill and alert deduplication. Define operational SLOs and failure/restore tests before claiming reliability. No Kafka, Kubernetes or agent framework is needed to demonstrate the current exercise.

Say **“I implemented and reviewed this synthetic project; tests are authored but unrun”**, not “I shipped a production risk system.” Discuss the tests you would run and the evidence still missing.

Primary implementation references: [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/), [pytest parametrization](https://docs.pytest.org/en/stable/how-to/parametrize.html). This project is tailored to your stated preparation priorities; actual employer conventions and assignment inputs can differ.
