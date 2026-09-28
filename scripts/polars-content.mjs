// Topic-specific teaching content. Python examples require an existing Polars environment.
export const POLARS_LESSONS = [
  {
    title: "Polars foundations, Series, DataFrames, schemas, and columnar execution",
    model: "A DataFrame stores named typed columns. Expressions describe operations on those columns.",
    foundation: "A Series is one typed column. A DataFrame combines columns of equal length. Its schema maps column names to data types. A row position is not a persistent identity, so keep business keys such as rfq_id as columns.",
    paragraphs: [
      "Start by writing the row grain: one row per RFQ, quote update or account exposure. A schema cannot establish that grain by itself. Two rows can have the same key even when all column types are correct.",
      "Polars executes many operations through native column-oriented kernels. This can avoid a Python callback for every row. It does not mean every query is faster than Pandas or SQL. Reading files, allocating results and converting formats can dominate the work.",
      "Use explicit schemas at input boundaries when IDs, dates or amounts must retain a particular representation. An identifier such as 0012 belongs in a string column if leading zeroes matter. An empty fixture also needs a schema when later operations depend on its types.",
      "Eager DataFrame operations produce results directly. LazyFrame operations build a query for later execution. Both use expressions. Start with an eager fixture to understand the result, then compare lazy execution when the query includes substantial I/O or multiple transformations."
    ],
    code: `import polars as pl

df = pl.DataFrame(
    {"rfq_id": ["0012", "0013"], "qty": [10, 20]},
    schema={"rfq_id": pl.String, "qty": pl.Int64},
)
assert df.shape == (2, 2)
assert df.schema["rfq_id"] == pl.String
assert df["rfq_id"].to_list() == ["0012", "0013"]
assert df.select(pl.col("qty").sum()).item() == 30
empty = pl.DataFrame(schema=df.schema)
assert empty.shape == (0, 2)
print(pl.__version__, df.schema)`,
    expected: "There are two rows and two columns. Quantity sums to 30. The first ID remains 0012. The empty frame retains both declared column types.",
    challenge: "Add a repeated rfq_id. Does the schema reject it? Specify a uniqueness check separately.",
    failure: "Inferring an identifier as an integer discards leading zeroes before later formatting can recover the original input.",
    tradeoff: "Explicit schemas make boundaries predictable but need maintenance when producers change. Inference is convenient for exploration; validate its result before treating it as a contract.",
    terms: { Series: "One typed column of values, possibly containing nulls.", schema: "A mapping from column names to data types; it does not enforce business-key uniqueness." },
    source: "https://docs.pola.rs/user-guide/concepts/data-types-and-structures/",
    question: ["Which representation preserves the identifier 0012?", ["String column", "Integer column", "Float column", "Boolean column"], 0,
      ["A string preserves the leading zeroes.", "An integer represents 12 without the original formatting.", "A float changes the identifier into a numeric quantity.", "A boolean cannot represent this identifier."]]
  },
  {
    title: "Polars expressions, contexts, selectors, aliases, and conditional logic",
    model: "The same expression takes its meaning from select, with_columns, filter or an aggregation context.",
    foundation: "An expression is a description of a computation. pl.col selects input columns, pl.lit creates a literal and alias names a result. select chooses output columns; with_columns retains existing columns while adding or replacing named outputs.",
    paragraphs: [
      "Build expressions before thinking about Python loops. The quantity-times-price expression describes a calculation over columns. The execution engine decides how to perform that calculation.",
      "Expressions within one with_columns call should not depend on aliases created beside them. Use a second call for a dependent column. This makes the dependency visible and avoids a missing-column error.",
      "Use selectors when the intended operation applies to a set of columns, such as numeric fields. Inspect which columns the selector expands to after a schema change. An unexpected new column can silently change a broad selection's meaning.",
      "Use & and | for expression predicates, with parentheses around comparisons. Python and/or attempt to evaluate a Python truth value. In when/then/otherwise, use pl.lit for literal strings. Conditional branches must be independently valid; when does not guarantee Python-style short-circuit evaluation."
    ],
    code: `import polars as pl
import polars.selectors as cs

df = pl.DataFrame({"qty": [2, 5], "price": [10, 20]})
out = df.with_columns((pl.col("qty") * pl.col("price")).alias("gross"))
out = out.with_columns(
    pl.when(pl.col("gross") >= 100)
      .then(pl.lit("review")).otherwise(pl.lit("small")).alias("band")
)
assert out["gross"].to_list() == [20, 100]
assert out["band"].to_list() == ["small", "review"]
assert out.select(cs.numeric()).columns == ["qty", "price", "gross"]
assert out.filter((pl.col("qty") > 2) & (pl.col("price") <= 20)).height == 1`,
    expected: "gross is 20 and 100. The second RFQ requires review. band is excluded by the numeric selector.",
    challenge: "Move the band expression beside gross in the first call. Explain why relying on that new alias is invalid, then restore the explicit dependency.",
    failure: "Writing then('review') can request a column named review instead of creating the intended literal.",
    tradeoff: "Several native expressions can share a query plan. A sequence of Python row callbacks usually hides more information from the engine and adds interpreter overhead.",
    terms: { expression: "A reusable computation description over columns or literals.", context: "The operation that applies an expression, such as selection or grouped aggregation." },
    source: "https://docs.pola.rs/user-guide/concepts/expressions-and-contexts/",
    extraSource: "https://docs.pola.rs/api/python/stable/reference/expressions/api/polars.when.html",
    question: ["How should a second expression use an alias created by with_columns?", ["Use another call", "Assume sibling ordering", "Rename every input", "Collect every row"], 0,
      ["A subsequent call establishes the dependency.", "Sibling expressions do not establish that alias dependency.", "Renaming inputs does not establish the required calculation.", "Row collection is unnecessary and loses the expression approach."]]
  },
  {
    title: "Polars nulls, NaN, casts, validation, and quarantine",
    model: "Preserve invalid input evidence while converting validated values into typed columns.",
    foundation: "Null means a missing value. NaN is a floating-point value with different behavior. A cast changes a column's data type. A failed non-strict cast produces null, so retain the original value to distinguish malformed input from an originally missing value.",
    paragraphs: [
      "The fixture contains one valid integer string, one malformed string and one missing value. After a non-strict cast, the last two become null. The raw column lets the validation rule identify which row failed parsing.",
      "Decide whether to reject a batch, quarantine invalid rows or accept missing data. Record rejected counts and reasons. Silently dropping invalid records can make a financial total appear smaller than the true exposure.",
      "fill_null does not fill NaN. Test both when floating-point data comes from external calculations. Do not replace unknown exposure with zero unless the business contract explicitly defines that meaning.",
      "A filter keeps rows whose predicate is true. Null predicate results are discarded. For a rule where missing status must be retained for investigation, fill the predicate deliberately or split the null rows before filtering. Strict casts are useful when any conversion failure must stop the pipeline."
    ],
    code: `import math
import polars as pl

raw = pl.DataFrame({"raw_qty": ["10", "oops", None]})
parsed = raw.with_columns(pl.col("raw_qty").cast(pl.Int64, strict=False).alias("qty"))
bad = parsed.filter(pl.col("raw_qty").is_not_null() & pl.col("qty").is_null())
assert parsed["qty"].to_list() == [10, None, None]
assert bad["raw_qty"].to_list() == ["oops"]
values = pl.Series("x", [1.0, None, float("nan")])
filled = values.fill_null(0.0)
assert filled[1] == 0.0 and math.isnan(filled[2])
assert values.null_count() == 1`,
    expected: "Only oops is a conversion failure. The missing raw input is a separate case. Filling null leaves NaN unchanged.",
    challenge: "Add an integer larger than Int64 can hold and an empty string. Predict the quarantine rows before running the cast.",
    failure: "A permissive cast without a reject audit converts malformed source data into apparently ordinary missing values.",
    tradeoff: "Strict rejection gives a simple batch boundary. Row quarantine preserves valid work but needs reconciliation, privacy controls and a repair path.",
    terms: { null: "A missing value for a column of any supported type.", quarantine: "A separate output for rejected records with enough evidence to repair or explain them." },
    source: "https://docs.pola.rs/user-guide/expressions/missing-data/",
    extraSource: "https://docs.pola.rs/user-guide/expressions/casting/",
    question: ["A non-strict integer cast returns null. What distinguishes malformed from missing input?", ["Original source value", "Current row position", "Result column name", "Output frame height"], 0,
      ["Retaining the original value exposes whether conversion failed.", "Position alone carries no parsing evidence.", "A column name does not explain a null.", "Row count cannot identify the cause of one null."]]
  },
  {
    title: "Polars strings, regular expressions, and bounded RFQ parsing",
    model: "Normalize text under a documented grammar and separate parsing from business validation.",
    foundation: "A parser converts text into fields. A regular expression can describe a narrow accepted format. Anchors require the whole input to match. A successful match does not prove that an instrument exists or that a requested amount is authorized.",
    paragraphs: [
      "This teaching grammar accepts BUY or SELL, an integer quantity and a three-letter currency, separated by one space after trimming. It intentionally rejects free-form dealer messages. Preserve raw text when normalization changes it.",
      "Extract fields with native string expressions rather than applying a Python regex to each row. Bound source length before expensive processing. The expression engine's regex dialect is not identical to Python re; avoid assuming support for look-around or backreferences.",
      "After parsing, validate quantity limits, permitted currencies and instrument mappings separately. A model or regex can suggest fields, but deterministic rules should protect trading actions. Send ambiguous records for review instead of guessing.",
      "Maintain a versioned grammar and test both accepted and rejected examples. Expanding the grammar can change which records are admitted. Keep the unparsed payload under appropriate access and retention controls."
    ],
    code: `import polars as pl

pattern = r"^(BUY|SELL) ([0-9]+) ([A-Z]{3})$"
df = pl.DataFrame({"raw": [" BUY 100 USD ", "SELL 20 EUR", "BUY lots USD"]})
parsed = df.with_columns(pl.col("raw").str.strip_chars().alias("text"))
parsed = parsed.with_columns(
    pl.col("text").str.extract(pattern, 1).alias("side"),
    pl.col("text").str.extract(pattern, 2).cast(pl.Int64, strict=False).alias("qty"),
    pl.col("text").str.extract(pattern, 3).alias("ccy"),
)
valid = parsed.filter(pl.col("side").is_not_null() & (pl.col("qty") > 0))
assert valid.select("side", "qty", "ccy").rows() == [("BUY", 100, "USD"), ("SELL", 20, "EUR")]
assert parsed.filter(pl.col("side").is_null()).height == 1`,
    expected: "Two rows match the teaching grammar. BUY lots USD is rejected. Parsing does not perform trading authorization or currency-reference validation.",
    challenge: "Add BUY 0 USD, a lowercase side and a very large quantity. Separate grammar rejection, overflow and business-rule rejection.",
    failure: "A partial regex match can accept a valid-looking prefix while ignoring an invalid suffix.",
    tradeoff: "A narrow grammar is predictable and auditable. Free-form inputs need a separate extraction workflow with confidence, review and deterministic validation.",
    terms: { grammar: "The exact input forms a parser accepts.", extraction: "Reading fields from a matched representation without establishing their business validity." },
    source: "https://docs.pola.rs/user-guide/expressions/strings/",
    question: ["What does a successful RFQ regex match establish?", ["Trading action authorized", "Instrument reference valid", "Input grammar matched", "Risk capacity available"], 2,
      ["Authorization is a separate check.", "Reference-data lookup is a separate check.", "The text has the accepted structure.", "A syntax match does not evaluate risk capacity."]]
  },
  {
    title: "Polars timestamps, durations, time zones, and market event time",
    model: "Normalize known instants to a common time zone before ordering or comparing market events.",
    foundation: "An instant identifies a point in time. Local clock text without an offset can be ambiguous. A duration is elapsed time. Event time describes when a source event occurred; arrival time describes when your pipeline received it.",
    paragraphs: [
      "The fixture uses explicit UTC offsets. Two differently written timestamps represent the same instant. Parse them to a timezone-aware column before deduplicating or joining.",
      "convert_time_zone preserves the instant while changing its displayed local time. replace_time_zone assigns or changes the timezone interpretation of wall-clock values and can change the instant. Treat ambiguous and nonexistent daylight-saving times with an explicit policy.",
      "Store event time and ingestion time separately. Late data can arrive after a newer event. Sorting on ingestion time answers a different question from sorting on event time.",
      "Specify timestamp units at interchange boundaries. Converting to a Python datetime or JSON may lose precision that existed in a nanosecond column. A calendar day is not always a fixed 24-hour interval in a timezone with daylight saving."
    ],
    code: `import polars as pl

df = pl.DataFrame({"text": ["2026-01-01T10:00:00+0000", "2026-01-01T11:00:00+0100"]})
out = df.with_columns(
    pl.col("text").str.to_datetime(format="%Y-%m-%dT%H:%M:%S%z", time_zone="UTC").alias("ts")
)
assert out["ts"].n_unique() == 1
local = out.select(pl.col("ts").dt.convert_time_zone("America/New_York"))
assert local["ts"][0] == out["ts"][0]
assert local["ts"].dt.hour().to_list() == [5, 5]`,
    expected: "Both rows represent 10:00 UTC. Their New York display is 05:00 on this winter date. Conversion preserves the instant.",
    challenge: "Describe the policy for a source that sends a repeated local daylight-saving hour without an offset. Do not silently choose an instant.",
    failure: "Relabeling local timestamps as UTC can shift events and cause a backward as-of join to select the wrong quote.",
    tradeoff: "UTC simplifies comparisons. Retaining original zone and text can still be necessary for audits and market-calendar interpretation.",
    terms: { instant: "A particular point in time independent of its displayed timezone.", duration: "An elapsed interval, distinct from a calendar period." },
    source: "https://docs.pola.rs/user-guide/transformations/time-series/timezones/",
    question: ["Which operation changes the displayed zone while preserving an instant?", ["convert_time_zone", "replace_time_zone", "cast_to_string", "drop_timezone"], 0,
      ["Conversion preserves the represented instant.", "Replacement changes the wall-time interpretation.", "String conversion does not define a zone conversion policy.", "Removing zone information loses explicit instant context."]]
  },
  {
    title: "Polars sorting, deduplication, and latest records per group",
    model: "Define a complete ordering before selecting one record for each business key.",
    foundation: "Deduplication selects which repeated records to keep. Latest requires an ordering rule. A timestamp alone is insufficient when two updates share that timestamp; a source sequence can break ties if the producer defines its meaning.",
    paragraphs: [
      "The fixture has two updates for RFQ a at the same event time. Sequence 2 wins under the stated contract. Sort by the business key, event time and sequence, then keep the last row for each key.",
      "Distinguish exact duplicate delivery from conflicting updates. If the same event identity arrives with different content, quarantine the conflict. Arbitrarily selecting one can hide upstream corruption.",
      "Specify null timestamp behavior. Quarantining unknown event time is often clearer than silently treating it as earliest or latest. A stable sort preserves ties but does not invent a business tie-breaker.",
      "Do not rely on incidental group or hash order. Sort the output when a report or test requires deterministic presentation. A pipeline that keeps every version serves a different purpose from a latest-state projection."
    ],
    code: `import polars as pl

df = pl.DataFrame({"id": ["a", "a", "b"], "ts": [10, 10, 9], "seq": [1, 2, 1], "qty": [5, 7, 3]})
latest = (df.sort(["id", "ts", "seq"])
    .unique(subset=["id"], keep="last", maintain_order=True)
    .sort("id"))
assert latest.select("id", "qty").rows() == [("a", 7), ("b", 3)]
assert latest["id"].n_unique() == latest.height
again = latest.sort(["id", "ts", "seq"]).unique(subset=["id"], keep="last", maintain_order=True)
assert again.sort("id").equals(latest)`,
    expected: "RFQ a retains quantity 7 because sequence 2 breaks the timestamp tie. Deduplicating the resulting projection again leaves it unchanged.",
    challenge: "Add a row with the same id, timestamp and sequence but a different quantity. Write the conflict rule before choosing a winner.",
    failure: "keep='any' is unsuitable when a business rule requires the latest event.",
    tradeoff: "Sorting makes the selection contract explicit but costs work and memory. A streaming latest-state system needs retained keyed state and a late-event policy.",
    terms: { deduplication: "Selecting records under a stated identity and winner rule.", tie_breaker: "An additional ordering field used when the primary ordering fields are equal." },
    source: "https://docs.pola.rs/api/python/stable/reference/dataframe/api/polars.DataFrame.unique.html",
    question: ["Two updates have the same timestamp. What establishes a deterministic latest update?", ["Original memory address", "Documented sequence rule", "Arbitrary group order", "Current batch size"], 1,
      ["Memory addresses have no business ordering meaning.", "A documented sequence can resolve the tie.", "Incidental group order is not a contract.", "Batch size does not order the updates."]]
  },
  {
    title: "Polars grouped aggregations, conditional counts, and weighted metrics",
    model: "Group by the reporting grain and make each aggregate's denominator explicit.",
    foundation: "An aggregation reduces several rows to a summary. group_by determines which rows share that summary. A weighted mean divides a weighted sum by the sum of weights; it generally differs from the mean of group means.",
    paragraphs: [
      "The two rates have notionals 1 and 3. Their weighted rate is 175 basis points, while their simple mean is 150. Use the metric definition supplied by the business, not whichever expression is shorter.",
      "pl.len counts rows. A column count counts non-null values. These differ when a field is missing. For acceptance rates, decide whether the denominator includes rejected, cancelled and incomplete RFQs.",
      "Filter rows within an aggregation when different metrics need different subsets. Keep denominators beside numerators in the output so a consumer can identify small or empty samples.",
      "A zero denominator requires an explicit undefined policy. Missing measurements should not disappear from a weighted numerator while their weights remain in its denominator. Filter or flag the pair together. For signed positions, net and gross weights answer different questions."
    ],
    code: `import polars as pl

df = pl.DataFrame({"desk": ["A", "A"], "rate_bp": [100, 200], "notional": [1, 3], "status": ["ok", "reject"]})
out = df.group_by("desk").agg(
    pl.len().alias("rows"),
    (pl.col("status") == "ok").sum().alias("accepted"),
    (pl.col("rate_bp") * pl.col("notional")).sum().alias("weighted_sum"),
    pl.col("notional").sum().alias("weight"),
).with_columns((pl.col("weighted_sum") / pl.col("weight")).alias("weighted_rate_bp"))
assert out["weighted_rate_bp"].item() == 175.0
assert out["accepted"].item() == 1
assert out["rows"].item() == 2`,
    expected: "Desk A has two rows, one accepted row and a notional-weighted rate of 175 bp. This fixture's weights are positive and non-null.",
    challenge: "Add a null rate with nonzero notional. Decide whether to reject the group or exclude that rate-weight pair, then reconcile the denominator.",
    failure: "A mean of means gives each group equal weight even when the underlying populations differ.",
    tradeoff: "Pre-aggregation reduces data volume but must retain enough components to combine metrics correctly. Store sums and counts rather than only a displayed average.",
    terms: { grain: "The business entity or grouping represented by one output row.", denominator: "The population or total weight against which a metric is calculated." },
    source: "https://docs.pola.rs/user-guide/expressions/aggregation/",
    question: ["Rates 100 and 200 have positive weights 1 and 3. What is their weighted mean?", ["125", "150", "175", "300"], 2,
      ["This reverses the relative weighting.", "150 is the unweighted mean.", "(100 + 600) / 4 is 175.", "Adding rates is not averaging them."]]
  },
  {
    title: "Polars window expressions, ranking, shifts, and cumulative features",
    model: "Compute group-relative features while keeping the original row grain.",
    foundation: "A window expression applies a calculation within groups and maps the result to rows. over identifies the groups. A shift reads a prior or later position under the defined ordering; it does not infer event chronology.",
    paragraphs: [
      "A grouped mean produces one row per instrument. A mean with over('instrument') can attach that mean to each existing quote row. Use this for deviations, shares and group-relative checks.",
      "Sort before position-sensitive features. In the example, each instrument's previous rate is the preceding timestamp's rate. If equal timestamps are possible, add a deterministic sequence rule.",
      "Cumulative calculations need the same ordering discipline. Ranking needs a tie method such as dense, ordinal or average. State whether tied quotes should receive equal ranks.",
      "A full-group mean can use future observations when applied to historical prediction. For a backtest, define the information available at each decision time. A window expression is a computational tool, not a guarantee against look-ahead bias."
    ],
    code: `import polars as pl

df = pl.DataFrame({"instrument": ["x", "x", "y"], "ts": [2, 1, 1], "rate": [102, 100, 200]})
out = df.sort(["instrument", "ts"]).with_columns(
    pl.col("rate").shift(1).over("instrument").alias("previous"),
    pl.col("rate").mean().over("instrument").alias("group_mean"),
    pl.col("rate").rank("dense").over("instrument").alias("rank"),
)
assert out["previous"].to_list() == [None, 100, None]
assert out["group_mean"].to_list() == [101.0, 101.0, 200.0]
assert out.height == df.height`,
    expected: "The first row of each instrument has no previous rate. The group mean is repeated without reducing the number of rows.",
    challenge: "Use this feature in a historical trading decision. Which columns use information that was not yet available? Replace them with a trailing calculation.",
    failure: "A global shift can copy instrument x's last value into instrument y's first row.",
    tradeoff: "Window expressions avoid a separate aggregate-and-join, but row order and mapping strategy still need a clear contract.",
    terms: { window: "A calculation over a related set of rows, mapped to the selected output shape.", shift: "A positional displacement whose meaning depends on grouping and ordering." },
    source: "https://docs.pola.rs/user-guide/expressions/window-functions/",
    question: ["How do you prevent the previous rate from crossing instrument boundaries?", ["Shift across frame", "Group the shift", "Remove all nulls", "Rename the rate"], 1,
      ["A whole-frame shift can cross a boundary.", "Applying shift over the instrument isolates each sequence.", "Dropping nulls does not repair cross-instrument values.", "Renaming has no effect on grouping."]]
  },
  {
    title: "Polars joins, cardinality validation, null keys, and reconciliation",
    model: "A join combines matching rows and can multiply them when keys repeat.",
    foundation: "An inner join keeps matches. A left join preserves left rows. A semi join selects left rows with a match, while an anti join selects those without one. Cardinality describes how many rows can match each key on either side.",
    paragraphs: [
      "Reference data should often have one row per instrument. If two reference rows match one trade, the join duplicates that trade and can double its reported exposure. Validate the right side rather than trusting the table name.",
      "Use validate='m:1' for the stated many-trades-to-one-reference contract where the selected engine supports that validation. Precheck uniqueness when execution constraints require it. Do not disable validation merely to make a larger query run.",
      "Null join keys do not match by default in current Polars. If you deliberately enable null matching, decide what a missing business key means. Joining all unknown IDs to one another is rarely safe for financial enrichment.",
      "Use an anti join to report unmapped instruments. A left join with null enrichment can preserve evidence; an inner join can silently discard it. Compare row counts and totals before and after enrichment. Full joins also require a policy for the resulting key columns and coalescing."
    ],
    code: `import polars as pl

trades = pl.DataFrame({"id": [1, 2], "instrument": ["x", "z"], "qty": [5, 7]})
ref = pl.DataFrame({"instrument": ["x", "y"], "desk": ["A", "B"]})
out = trades.join(ref, on="instrument", how="left", validate="m:1").sort("id")
missing = trades.join(ref, on="instrument", how="anti")
assert out.height == trades.height
assert out["qty"].sum() == 12
assert out["desk"].to_list() == ["A", None]
assert missing["instrument"].to_list() == ["z"]`,
    expected: "Both trades survive. Instrument z is reported as unmapped. Quantity remains 12.",
    challenge: "Duplicate reference instrument x. Predict the unvalidated total and explain why the validated join should fail.",
    failure: "A many-to-many join can inflate totals without any parsing or arithmetic error.",
    tradeoff: "Dropping unmatched records simplifies downstream schemas but loses evidence. Preserving them requires an explicit unresolved-data state.",
    terms: { cardinality: "The allowed number of matching rows per join key.", anti_join: "A join that returns left rows with no matching right key." },
    source: "https://docs.pola.rs/user-guide/transformations/joins/",
    question: ["Which join finds trades whose instrument is absent from reference data?", ["Inner join", "Cross join", "Semi join", "Anti join"], 3,
      ["Inner returns matches.", "Cross forms combinations without a matching-key requirement.", "Semi returns left rows with matches.", "Anti returns the unmapped left rows."]]
  },
  {
    title: "Polars as-of joins, quote freshness, and point-in-time correctness",
    model: "A backward as-of join selects a preceding quote within the same instrument and freshness limit.",
    foundation: "An as-of join matches ordered keys by relative position instead of exact equality. Backward selects a right key no later than the left key. A tolerance limits how far away that match may be. Both inputs must meet the sortedness requirements.",
    paragraphs: [
      "For an RFQ at time 12, a backward join can select the quote at time 10. A quote at time 14 is in the future and is unsuitable for a historical decision. Nearest is a different policy and can select future data.",
      "Group the match by instrument. Otherwise, the closest preceding time could belong to a different product. When using by groups, verify sorting within each group rather than relying only on a warning or a metadata flag.",
      "Tolerance makes stale matches explicit. The example uses integer ticks: time 20 has no preceding quote within five ticks. For temporal columns, choose a duration and consistent timezone. Decide whether exact-time matches are allowed.",
      "Event time alone is insufficient when reconstructing what a trader actually knew. A quote timestamped 10 but first received at 13 was unavailable at decision time 12. Preserve arrival time and enforce the information-availability contract before the as-of match. Resolve duplicate quote times with a documented tie rule."
    ],
    code: `import polars as pl

requests = pl.DataFrame({"instrument": ["x", "x"], "ts": [12, 20]})
quotes = pl.DataFrame({"instrument": ["x", "x"], "ts": [10, 14], "rate": [100, 104]})
out = requests.sort("ts").join_asof(
    quotes.sort("ts"), on="ts", by="instrument",
    strategy="backward", tolerance=5,
)
assert out["rate"].to_list() == [100, None]
assert out.height == requests.height`,
    expected: "Time 12 matches rate 100 at time 10. Time 20 has no fresh match because time 14 is six ticks old.",
    challenge: "Mark the time-10 quote as arriving at time 13. Explain why it must be excluded from a decision made at 12 despite passing the event-time comparison.",
    failure: "A nearest or forward match can leak future market information into a backtest.",
    tradeoff: "A tighter freshness tolerance reduces stale marks but increases unresolved RFQs. Report both freshness and missing-match rates.",
    terms: { backward_match: "The latest permitted right-side key at or before the left-side key.", tolerance: "The maximum allowed distance between matched keys." },
    source: "https://docs.pola.rs/api/python/stable/reference/dataframe/api/polars.DataFrame.join_asof.html",
    question: ["RFQ time is 12. Quote times are 10 and 14. Which time can a backward join select?", ["10", "12", "14", "24"], 0,
      ["10 is the latest available preceding time.", "No quote exists at 12.", "14 is later than the request.", "24 is not an input quote."]]
  },
  {
    title: "Polars rolling windows, dynamic groups, resampling, and late events",
    model: "Separate fixed row windows, time-based trailing windows and clock-aligned reporting buckets.",
    foundation: "A row window counts observations. A time window covers a duration. Dynamic grouping assigns rows to interval boundaries. These produce different results when event spacing is irregular.",
    paragraphs: [
      "The first two events fall in the half-open interval [00:00, 00:02). The event exactly at 00:02 belongs to the next interval. Explicit boundary closure prevents double counting or unexplained edge changes.",
      "A trailing two-minute window anchored at each row answers a different question from two-minute reporting buckets. Likewise, a rolling mean of two observations can span seconds or hours. Choose the unit from the business requirement.",
      "Dynamic grouping does not automatically create every empty interval. If a chart requires a continuous grid, construct or upsample that grid and specify whether missing buckets mean zero activity or unknown data.",
      "A LazyFrame streaming engine processes batches of a bounded query; it is not a Kafka event-time processor with watermarks. For late events, define whether to reopen a bucket, publish a correction or quarantine the record. Preserve a version or cutoff for reproducible reports."
    ],
    code: `from datetime import datetime, timedelta
import polars as pl

start = datetime(2026, 1, 1)
df = pl.DataFrame({"ts": [start, start + timedelta(minutes=1), start + timedelta(minutes=2)], "qty": [1, 2, 4]}).sort("ts")
buckets = df.group_by_dynamic("ts", every="2m", period="2m", closed="left").agg(pl.col("qty").sum())
assert buckets["qty"].to_list() == [3, 4]
rolling = df.with_columns(pl.col("qty").rolling_mean(window_size=2).alias("last_two"))
assert rolling["last_two"].to_list() == [None, 1.5, 3.0]`,
    expected: "Bucket sums are 3 and 4. The two-row rolling mean has no full first window, then produces 1.5 and 3.0.",
    challenge: "Move the final event forward by an hour. Explain which row-window result stays the same and which time-bucket assignment changes.",
    failure: "Calling a two-row average a two-minute average hides irregular event spacing.",
    tradeoff: "Reopening late buckets improves completeness but changes previously published values. Immutable cutoffs are easier to reproduce but need a late-data disclosure.",
    terms: { dynamic_group: "An aggregation group defined by intervals on an ordered index.", watermark: "A stream-processing policy about event-time progress; a Polars batch does not supply one automatically." },
    source: "https://docs.pola.rs/user-guide/transformations/time-series/rolling/",
    extraSource: "https://docs.pola.rs/api/python/stable/reference/dataframe/api/polars.DataFrame.group_by_dynamic.html",
    question: ["With left-closed two-minute buckets, where does an event exactly at 00:02 belong?", ["Previous bucket only", "Following bucket only", "Both adjacent buckets", "Neither adjacent bucket"], 1,
      ["The previous half-open bucket excludes its upper boundary.", "00:02 starts the following bucket.", "That would double count this boundary.", "The lower boundary is included."]]
  },
  {
    title: "Polars nested data, lists, structs, arrays, and JSON fields",
    model: "Keep nested values typed and make row expansion explicit when flattening them.",
    foundation: "A List contains a variable number of values per row. An Array has a fixed shape. A Struct contains named typed fields. Explode expands list elements into rows, changing the output grain.",
    paragraphs: [
      "An RFQ can contain several legs. Keeping legs in a list preserves one row per RFQ; exploding creates one row per leg. Repeating an RFQ-level notional on each leg can inflate a later total unless the metric is allocated or grouped correctly.",
      "A struct gives related fields a typed shape. Extract a named field with struct.field and expand all fields with unnest when that output contract is useful. A typed JSON decode needs an explicit or verified schema and a malformed-input policy.",
      "Use list expressions for element-wise transformations inside lists when possible. Distinguish a null list, an empty list and a list containing null. Their meanings and explode behavior should be covered by fixtures on the pinned release.",
      "Arrays are appropriate when fixed width is part of the contract, such as a three-coordinate vector. A List is more natural for variable-length legs. Neither choice validates whether the legs form a permitted instrument."
    ],
    code: `import polars as pl

df = pl.DataFrame({"rfq": ["a", "b"], "legs": [[10, 20], [30]], "desk": ["D1", "D2"]})
out = df.with_columns(
    pl.col("legs").list.sum().alias("leg_total"),
    pl.struct("rfq", "desk").alias("identity"),
)
assert out["leg_total"].to_list() == [30, 30]
assert out.select(pl.col("identity").struct.field("rfq")).to_series().to_list() == ["a", "b"]
expanded = df.explode("legs")
assert expanded.select("rfq", "legs").rows() == [("a", 10), ("a", 20), ("b", 30)]
assert expanded.height == 3`,
    expected: "Each RFQ has leg total 30. Explode changes two RFQ rows into three leg rows.",
    challenge: "Add an empty list, a null list and [None]. Specify which should represent no legs versus unknown legs before aggregating.",
    failure: "Summing an RFQ-level amount after exploding legs can count the same amount repeatedly.",
    tradeoff: "Nested storage preserves natural structure. Flat rows simplify some joins and reports but require a new key and grain contract.",
    terms: { Struct: "A typed value composed of named fields.", explode: "Expanding nested elements into separate rows, potentially changing row count and grain." },
    source: "https://docs.pola.rs/user-guide/expressions/structs/",
    extraSource: "https://docs.pola.rs/user-guide/expressions/lists-and-arrays/",
    question: ["Two RFQs have two legs and one leg. How many rows result from exploding those lists?", ["1", "2", "3", "4"], 2,
      ["The RFQs are not aggregated together.", "Explode does not preserve the RFQ row count here.", "Two plus one gives three leg rows.", "There are only three elements in the fixture."]]
  },
  {
    title: "Polars concatenation, pivots, unpivots, and schema alignment",
    model: "Reshape data only after defining the key and aggregation policy for each output cell.",
    foundation: "Vertical concatenation appends rows. Horizontal concatenation aligns by row position, not a business key. A pivot turns category values into columns. An unpivot turns columns into name-value rows.",
    paragraphs: [
      "Market exports often place bid and ask in separate columns. Unpivot produces one row per RFQ and quote side, which is convenient for shared validation or charting. Keep the original key as an index column.",
      "A pivot requires one value per output cell or a stated aggregation. If duplicate RFQ-side rows exist, choosing first can hide conflicting quotes. Reject the conflict or specify why an aggregate is correct.",
      "Strict vertical concatenation expects compatible schemas. Diagonal concatenation aligns different column sets and fills absent fields with null; relaxed modes may coerce data types. Inspect the resulting schema rather than assuming the input types survived.",
      "Dynamic output columns can make pivot planning different from a fixed-schema lazy transform. Check the installed API's eager/lazy support. Prefer long form when new categories should not continuously change a downstream schema."
    ],
    code: `import polars as pl

wide = pl.DataFrame({"rfq": ["a", "b"], "bid": [99, 101], "ask": [100, 102]})
long = wide.unpivot(on=["bid", "ask"], index="rfq", variable_name="side", value_name="price")
assert long.height == 4
restored = long.pivot(on="side", index="rfq", values="price").sort("rfq")
assert restored.select("rfq", "bid", "ask").equals(wide)
joined_batches = pl.concat([wide.head(1), wide.tail(1)], how="vertical")
assert joined_batches.equals(wide)`,
    expected: "Unpivot creates four quote-side rows. Pivot reconstructs the original values because each RFQ-side pair is unique.",
    challenge: "Insert a second bid for RFQ a. Explain why selecting an arbitrary first value would be a business decision, not a harmless formatting step.",
    failure: "Horizontal concatenation of differently ordered frames attaches values to the wrong business records.",
    tradeoff: "Wide data helps fixed reports. Long data handles changing categories more naturally and keeps a stable column schema.",
    terms: { pivot: "Turning category values into output columns under a cell aggregation policy.", unpivot: "Turning selected columns into variable/value rows while retaining identifier columns." },
    source: "https://docs.pola.rs/user-guide/transformations/pivot/",
    extraSource: "https://docs.pola.rs/user-guide/transformations/concatenation/",
    question: ["Which operation matches independent frames by a business key?", ["Horizontal concat", "Keyed join", "Column rename", "Row slice"], 1,
      ["Horizontal concatenation aligns positions rather than keys.", "A join can express the key relationship.", "Renaming does not match records.", "Slicing only selects positions."]]
  },
  {
    title: "Polars CSV, JSON, Parquet, partitioned datasets, and schema drift",
    model: "Treat file format, schema and source identity as parts of the data contract.",
    foundation: "CSV stores textual fields and usually needs parsing rules. Parquet stores typed columnar data with metadata. NDJSON stores one JSON record per line. A scan creates a lazy source so later filters and projections can influence execution.",
    paragraphs: [
      "The fixture writes a tiny Parquet file in a unique temporary directory, then scans only quantity. This checks a typed round trip without touching user data. A production input should also identify its source version or immutable snapshot.",
      "Use schema_overrides and explicit null conventions for CSV fields with contractual types. A small inference sample can miss a later malformed value. Record parsing failures instead of silently ignoring them.",
      "Parquet column selection can avoid reading unused columns. Row-group statistics and partition paths can help skip irrelevant data when the predicates and source support it. Small files add metadata and scheduling overhead; one giant file can limit practical partition pruning.",
      "When scanning multiple files, check missing columns, incompatible types and changed meanings. A widened integer type is different from a field changing from cents to whole currency units. Object-store credentials should come from the runtime identity or approved secret provider. Excel readers need optional dependencies; convert at a controlled boundary if those dependencies are unavailable."
    ],
    code: `from pathlib import Path
from tempfile import TemporaryDirectory
import polars as pl
from polars.testing import assert_frame_equal

df = pl.DataFrame({"rfq": ["a", "b"], "qty": [10, 20]})
with TemporaryDirectory(prefix="polars-lesson-") as directory:
    path = Path(directory) / "rfqs.parquet"
    df.write_parquet(path)
    roundtrip = pl.read_parquet(path)
    assert_frame_equal(roundtrip, df)
    total = pl.scan_parquet(path).select(pl.col("qty").sum()).collect()
    assert total.item() == 30`,
    expected: "The Parquet round trip retains values and schema. The scanned quantity total is 30. The temporary directory is removed when the block ends.",
    challenge: "Describe how you would handle a second file where qty becomes a string or changes units. Distinguish a safe cast from a semantic migration.",
    failure: "A wildcard can include an incomplete upload or a file outside the intended report snapshot.",
    tradeoff: "CSV is convenient for interchange. Parquet preserves types and supports column-oriented reads, but it does not replace catalog, retention or publication controls.",
    terms: { Parquet: "A typed columnar file format with metadata useful to analytical readers.", schema_drift: "A change in incoming fields or their types that may require an explicit compatibility decision." },
    source: "https://docs.pola.rs/user-guide/io/parquet/",
    extraSource: "https://docs.pola.rs/user-guide/io/csv/",
    question: ["Which source allows a later lazy projection to influence a Parquet read?", ["read_parquet then lazy", "scan_parquet then select", "read_csv then rows", "collect then select"], 1,
      ["The eager read already happened before lazy planning.", "The scan remains in the query plan.", "This reads another format and materializes rows.", "Collecting first removes that source-read opportunity."]]
  },
  {
    title: "Polars lazy plans, predicate pushdown, projection pushdown, and explain",
    model: "A lazy query lets the engine optimize several operations together before collecting results.",
    foundation: "A LazyFrame represents a query. collect executes it and returns a DataFrame. Projection pushdown reduces requested columns near a source; predicate pushdown moves eligible filters toward the source. An optimizer must preserve the query's meaning.",
    paragraphs: [
      "The query selects positive quantities and doubles them. Before collect, it describes the work. explain lets you inspect the planned operations. A plan is evidence of intended execution, not a measurement of elapsed time or bytes read.",
      "Use scan_csv or scan_parquet when the source read should participate in optimization. Calling read_parquet(...).lazy() starts after eager materialization, so it cannot undo that read.",
      "A filter cannot always move across an aggregation, outer join or opaque Python function without changing results. Likewise, output expressions may need columns that are not returned. Interpret pushdown by dependencies instead of expecting every filter to reach a scan.",
      "Use collect_schema when you need planned names and types, while recognizing that schema resolution may require source metadata. Avoid repeated collect calls in a loop when they execute the same expensive source repeatedly. Pin versions before comparing plan text; exact formatting is not a stable test contract."
    ],
    code: `import polars as pl
from polars.testing import assert_frame_equal

df = pl.DataFrame({"id": [1, 2, 3], "qty": [-1, 2, 3], "unused": ["x", "y", "z"]})
query = df.lazy().filter(pl.col("qty") > 0).select("id", (pl.col("qty") * 2).alias("double_qty"))
assert query.collect_schema()["double_qty"] == pl.Int64
print(query.explain(optimized=True))
assert_frame_equal(query.collect(), pl.DataFrame({"id": [2, 3], "double_qty": [4, 6]}))`,
    expected: "The result contains IDs 2 and 3 with doubled quantities 4 and 6. The unused column is absent from the output. This in-memory fixture does not measure file pruning.",
    challenge: "Replace the source with a Parquet scan in a disposable fixture. Compare optimized and unoptimized explanations without asserting an exact plan string.",
    failure: "Reading a large file eagerly and adding lazy() afterward cannot recover the memory already used to read it.",
    tradeoff: "Lazy optimization benefits compound queries. A small already-materialized frame may not gain enough to justify a complex execution setup; measure equivalent work.",
    terms: { LazyFrame: "A query representation that executes at an explicit collection or sink boundary.", pushdown: "Moving an eligible operation nearer its source while preserving meaning." },
    source: "https://docs.pola.rs/user-guide/lazy/optimizations/",
    extraSource: "https://docs.pola.rs/user-guide/lazy/query-plan/",
    question: ["What does explain establish?", ["Measured request latency", "Planned query operations", "Guaranteed memory ceiling", "Verified business correctness"], 1,
      ["Timing requires execution and measurement.", "It exposes the query plan.", "A plan is not a fixed memory guarantee.", "Correctness needs an input/output contract and tests."]]
  },
  {
    title: "Polars streaming execution, sinks, memory limits, and backpressure",
    model: "Batch-oriented execution can reduce intermediate memory without guaranteeing that every query fits in memory.",
    foundation: "The streaming engine processes supported query work in batches. A sink writes results to a destination. collect still returns a materialized DataFrame, so a large final result can exceed memory even if intermediate execution is streamed.",
    paragraphs: [
      "Request engine='streaming' on collect for the current API. Check the installed release because engine coverage and fallback behavior change. The fixture compares results with ordinary collection; it does not prove a lower peak-memory bound.",
      "Aggregation state grows with group cardinality. Sorting and joins can require substantial retained state or different execution strategies. A tiny batch size does not cap the total memory of those operations.",
      "Use a supported sink such as sink_parquet when the destination is a file and materializing the complete final frame is unnecessary. Write to a new staging location. Publish a manifest or pointer only after completion and validation. Retrying a write must not silently duplicate a published partition.",
      "Measure peak resident memory and source/sink throughput under realistic skew. If the sink is slower than the source, bound admitted work. Polars streaming is query execution, not an unbounded message broker with offset management and durable exactly-once delivery."
    ],
    code: `from pathlib import Path
from tempfile import TemporaryDirectory
import polars as pl
from polars.testing import assert_frame_equal

query = pl.DataFrame({"desk": ["A", "A", "B"], "qty": [1, 2, 4]}).lazy().group_by("desk").agg(pl.col("qty").sum())
normal = query.collect().sort("desk")
streamed = query.collect(engine="streaming").sort("desk")
assert_frame_equal(normal, streamed)
with TemporaryDirectory(prefix="polars-sink-") as directory:
    target = Path(directory) / "result.parquet"
    query.sink_parquet(target)
    assert_frame_equal(pl.read_parquet(target).sort("desk"), normal)`,
    expected: "Both engines and the Parquet sink produce desk totals A=3 and B=4 after sorting. No throughput or memory result is inferred from this tiny fixture.",
    challenge: "Change two groups into millions of distinct keys. Explain why grouping state can grow even when the input is processed in batches.",
    failure: "Collecting a huge final frame can exhaust memory despite requesting the streaming engine.",
    tradeoff: "A sink avoids returning the whole result to Python but requires explicit failure, retry and publication semantics.",
    terms: { sink: "An execution boundary that writes query output to a destination.", backpressure: "Limiting upstream work when downstream processing cannot keep pace." },
    source: "https://docs.pola.rs/user-guide/concepts/streaming/",
    extraSource: "https://docs.pola.rs/user-guide/lazy/sources_sinks/",
    question: ["Why can streaming collect still exhaust memory?", ["Final result materializes", "All columns disappear", "Every value duplicates", "Schemas stop existing"], 0,
      ["The returned DataFrame must hold the final result.", "Streaming does not discard all columns.", "Duplication is not inherent to streaming.", "The query still has a schema."]]
  },
  {
    title: "Polars native vectorization, Python UDFs, NumPy, Arrow, and Pandas interoperability",
    model: "Keep work inside native expressions until an external library is genuinely needed.",
    foundation: "Vectorized expressions describe operations over columns. A Python UDF calls user code across elements or batches. Conversion to NumPy, Pandas or Arrow crosses a representation boundary that may allocate memory or change missing-value behavior.",
    paragraphs: [
      "The native square and map_elements square agree for the fixture. That equality establishes one behavior check, not a speed result. Prefer the native expression because the engine can understand the operation without calling Python for each value.",
      "When a UDF is unavoidable, specify return_dtype and define null behavior. Keep the function pure. map_batches can reduce callback frequency for compatible batch operations, but a function that needs the whole group or global ordering cannot be declared elementwise merely for speed.",
      "NumPy vectorization and Polars expressions both avoid many Python row loops, but they have different memory and schema models. Conversion to a homogeneous NumPy array can coerce types and require a copy. NumPy functions do not automatically preserve Polars null semantics.",
      "Pandas has index-alignment behavior that Polars does not reproduce as an implicit index. Keep join keys explicit during migration. Arrow-compatible buffers can enable sharing, but zero-copy depends on types and the conversion path. Benchmark conversion together with the useful computation."
    ],
    code: `import polars as pl
from polars.testing import assert_frame_equal

df = pl.DataFrame({"x": [1, 2, None]})
native = df.select((pl.col("x") * pl.col("x")).alias("square"))
python_udf = df.select(pl.col("x").map_elements(lambda value: value * value, return_dtype=pl.Int64).alias("square"))
assert_frame_equal(native, python_udf)
assert native["square"].to_list() == [1, 4, None]
# This comparison may emit a UDF performance warning. It is intentional.
# Optional interoperability libraries are not installed by this lesson.`,
    expected: "Both outputs are 1, 4 and null. With default skip_nulls behavior, the Python function is not called for the null element.",
    challenge: "Replace multiplication with an external model call. Explain why retries, batching, network limits and result identity belong outside an element-wise expression.",
    failure: "A UDF that writes to a database or relies on call order creates side effects that query execution cannot safely treat as pure computation.",
    tradeoff: "A UDF can reuse a required library, but may sacrifice optimization and add copies or callback overhead. Measure the full boundary cost before adopting it.",
    terms: { UDF: "A user-defined function invoked from a query, with an explicit input/output contract.", zero_copy: "Sharing existing buffers without copying their data, when representation constraints permit it." },
    source: "https://docs.pola.rs/api/python/stable/reference/expressions/api/polars.Expr.map_elements.html",
    extraSource: "https://docs.pola.rs/user-guide/migration/pandas/",
    question: ["Which square expression exposes the arithmetic directly to Polars?", ["Native column multiplication", "Python callback loop", "Remote HTTP request", "String evaluation function"], 0,
      ["A native expression exposes the computation to the engine.", "A Python callback adds an opaque boundary.", "A network request is a side effect, not a native arithmetic expression.", "Evaluating strings is unnecessary and unsafe for untrusted expressions."]]
  },
  {
    title: "Polars testing, schema contracts, property checks, and fair benchmarks",
    model: "Verify values and schema before measuring equivalent completed work.",
    foundation: "A data test checks a transformation's contract. A benchmark measures cost for a defined workload. assert_frame_equal checks frames with configurable order and tolerance rules. Decide which differences are meaningful before weakening a test.",
    paragraphs: [
      "The transformation is a pure function: it receives a frame and returns desk totals. The test uses a deliberately unsorted input and compares the documented sorted output. Keep source parsing and external I/O outside this small unit.",
      "Include empty input, nulls, duplicate keys, boundary timestamps and incompatible schemas. Property checks can assert that enrichment preserves a total, deduplication is idempotent, or every accepted key is unique. These properties supplement exact expected rows; a consistently wrong algorithm may satisfy a weak property.",
      "For floating-point results, choose tolerances from the domain's error budget. Do not disable dtype or ordering checks just to make a comparison pass. If order is unspecified, canonicalize by a complete deterministic key.",
      "Benchmark after correctness. Include collect for lazy queries and conversions when comparing tools. Record versions, hardware, row and column counts, key skew, null rate and source format. Run repeated trials, separate cold and warm I/O, report distributions and peak memory, and keep the same semantic workload. Timing a plan construction against an eager result is not a fair comparison."
    ],
    code: `import polars as pl
from polars.testing import assert_frame_equal

def totals(frame: pl.DataFrame) -> pl.DataFrame:
    return frame.group_by("desk").agg(pl.col("qty").sum()).sort("desk")

source = pl.DataFrame({"desk": ["B", "A", "A"], "qty": [4, 1, 2]})
expected = pl.DataFrame({"desk": ["A", "B"], "qty": [3, 4]})
assert_frame_equal(totals(source), expected)
assert totals(source)["qty"].sum() == source["qty"].sum()
empty = pl.DataFrame(schema=source.schema)
assert totals(empty).height == 0
assert totals(empty).schema == expected.schema`,
    expected: "The result is A=3 and B=4 with the expected schema. The empty input produces no groups and retains the aggregation output schema.",
    challenge: "Write a failing fixture where a duplicated reference key inflates a joined total. Make the test fail before comparing join performance.",
    failure: "Comparing a lazy plan's construction time with another library's completed calculation reports a meaningless speedup.",
    tradeoff: "Small fixtures give fast precise feedback. Production-scale checks expose memory, skew and I/O behavior that unit tests cannot establish.",
    terms: { invariant: "A property the transformation must preserve under its stated assumptions.", benchmark: "A repeatable measurement of a specified workload and environment." },
    source: "https://docs.pola.rs/api/python/stable/reference/testing.html",
    question: ["What must a lazy-query benchmark include to measure the result computation?", ["Only import", "Only alias", "Actual collect", "Column rename"], 2,
      ["Import time is not query execution time.", "An alias only changes a planned name.", "Collection executes the query and materializes the result.", "A rename alone does not execute a lazy query."]]
  },
  {
    title: "Polars financial types, integer units, decimals, enums, and risk arithmetic",
    model: "Represent units and allowed values explicitly before performing financial calculations.",
    foundation: "An integer amount needs a unit such as cents. Decimal arithmetic uses a stated precision and scale. An Enum has a fixed set of allowed categories. A categorical encoding compresses labels but does not automatically validate a business vocabulary.",
    paragraphs: [
      "This fixture uses integer cents for a simple exposure-times-shock calculation. It defines the rounding policy as floor division for nonnegative products. A real risk calculation must specify sign handling, aggregation level, overflow bounds and the authority for its rounding rule.",
      "One basis point is 1/10000 of a unit fraction. Label the rate column with its unit. Multiplying by 25 when the code expects 0.0025 produces a very different amount. Do not infer units from a dtype alone.",
      "For decimal columns, choose precision and scale explicitly and test casts, multiplication and aggregation on the installed release. Decimal support and operation rules must be checked against that release's documentation. Construct decimal inputs from decimal text rather than a binary float when exact decimal intent matters.",
      "Use Enum when unknown labels should be rejected or quarantined. Use a categorical representation for open-ended repeated labels when that contract fits. Do not use the physical category code as a portable business ID. Missing or invalid risk inputs require an unresolved result, not an invented zero."
    ],
    code: `import polars as pl

df = pl.DataFrame({"exposure_cents": [100_000, 200_000], "shock_bp": [25, 10], "side": ["BUY", "SELL"]})
out = df.with_columns(
    pl.col("side").cast(pl.Enum(["BUY", "SELL"])),
    ((pl.col("exposure_cents") * pl.col("shock_bp")) // 10_000).alias("loss_cents"),
)
assert out["loss_cents"].to_list() == [250, 200]
assert out.schema["side"] == pl.Enum(["BUY", "SELL"])
assert out["loss_cents"].sum() == 450
# Bounded nonnegative synthetic inputs only. This is not a financial pricing model.`,
    expected: "The two illustrative losses are 250 and 200 cents, totaling 450. The side column permits only the two declared labels.",
    challenge: "Introduce negative exposure and fractional-cent results. Write the signed rounding rule and overflow policy before extending the expression.",
    failure: "Binary floating-point equality or an implicit unit conversion can misclassify a value exactly at a risk limit.",
    tradeoff: "Integer units give simple exact arithmetic within bounds. Decimals support explicit fractional scales but require tested precision and rounding behavior.",
    terms: { scale: "The number of fractional decimal places in a declared representation.", Enum: "A column type restricted to a declared fixed set of categories." },
    source: "https://docs.pola.rs/user-guide/expressions/categorical-data-and-enums/",
    extraSource: "https://docs.pola.rs/api/python/stable/reference/api/polars.datatypes.Decimal.html",
    question: ["What fraction corresponds to 25 basis points?", ["25", "0.25", "0.025", "0.0025"], 3,
      ["25 is the count of basis points, not the fraction.", "0.25 is 25 percent.", "0.025 is 250 basis points.", "25 divided by 10000 equals 0.0025."]]
  },
  {
    title: "Polars SQL, database boundaries, cloud storage, and service deployment",
    model: "Place computation where it meets the data, consistency and resource constraints.",
    foundation: "SQLContext lets SQL query registered Polars frames. It does not turn Polars into a transactional database. A database query, an analytical file transform and an API request have different ownership and consistency requirements.",
    paragraphs: [
      "The fixture expresses the same grouped total through SQL and expressions. SQLContext executes against registered frames; it does not automatically push arbitrary SQL into PostgreSQL or Snowflake. If data lives in a database, consider pushing filtering and aggregation there before transferring it.",
      "Database reads need a snapshot contract. Several queries issued at different times may not describe one consistent report. Bind values through the database driver rather than interpolating untrusted SQL. Enforce tenant access before extracting data.",
      "Cloud scans need bounded credentials, an explicit source snapshot and a cost budget. Object-store publication is not a multi-file database transaction. Write immutable outputs and publish a manifest only after validation; readers should select one completed version.",
      "A synchronous collect in an async API handler can block the event-loop thread while the handler waits. Use a bounded worker path for expensive analytical work and keep request deadlines distinct from actual query cancellation. Multiple service workers can each create native thread pools and compete for memory. Configure and measure process-level budgets before adding concurrency.",
      "Use a database for concurrent transactional writes and indexed point lookups. Use local Polars for analytical transforms that fit the execution environment. Consider distributed systems when storage, compute or operational constraints require them. Polars is not automatically a Kafka processor, Snowflake replacement or distributed cluster."
    ],
    code: `import polars as pl
from polars.testing import assert_frame_equal

df = pl.DataFrame({"desk": ["A", "A", "B"], "qty": [1, 2, 4]})
with pl.SQLContext(rfqs=df, eager=False) as context:
    sql_result = context.execute("SELECT desk, SUM(qty) AS total FROM rfqs GROUP BY desk").collect().sort("desk")
expr_result = df.group_by("desk").agg(pl.col("qty").sum().alias("total")).sort("desk")
assert_frame_equal(sql_result, expr_result)
# No database, cloud credentials or service process is used by this fixture.`,
    expected: "SQL and expression results agree on values and schema. The fixture makes no statement about remote database transaction semantics or production throughput.",
    challenge: "Design a FastAPI endpoint for a report that takes 30 seconds. Specify job identity, admission limits, result storage and what a client timeout means.",
    failure: "Increasing web workers can multiply native computation threads and memory until throughput gets worse.",
    tradeoff: "Moving work to Polars can simplify analytical code but adds transfer and snapshot costs. Push work to the source when that reduces data movement without violating the contract.",
    terms: { SQLContext: "A registry of frames queried with Polars SQL execution.", snapshot_contract: "The rule defining which source versions belong to one consistent result." },
    source: "https://docs.pola.rs/user-guide/sql/intro/",
    extraSource: "https://docs.pola.rs/user-guide/misc/multiprocessing/",
    question: ["What does SQLContext supply?", ["Distributed database transactions", "Queries over frames", "Automatic Kafka offsets", "Unlimited service concurrency"], 1,
      ["It does not supply distributed transaction coordination.", "Registered frames can be queried with SQL.", "It does not manage broker offsets.", "Resource limits remain an application responsibility."]]
  },
  {
    title: "Polars capstone, RFQ reconciliation, risk limits, and rates monitoring",
    model: "Build a reproducible analytical projection with explicit accepted, rejected and unresolved states.",
    foundation: "A capstone combines the earlier mechanisms under one business contract. This synthetic report has one latest RFQ per ID and one risk limit per desk. It reports breaches; it does not authorize trades, price instruments or reserve risk capacity.",
    paragraphs: [
      "Define the inputs before writing expressions: event identity, desk, event time, producer sequence, nonnegative quantity, amount units and source snapshot. Require a deterministic winner for repeated RFQs. Quarantine conflicting identities instead of silently treating them as retries.",
      "The core fixture deduplicates updates, totals desk quantities and validates the many-to-one limit join. A missing limit becomes unknown. Quantity equal to the limit is within under this teaching contract; change the comparison if the business rule differs.",
      "Extend the report with the bounded parser from lesson 0648 and the point-in-time quote join from 0654. Keep unmatched, stale and malformed records visible. Use a rate-monitoring window with an explicit cutoff and late-data policy. Do not turn a missing quote into a zero rate.",
      "Separate analytical reporting from concurrent risk enforcement. Two traders can both read the same remaining capacity. A report computed by Polars cannot prevent that race; the authoritative reservation needs a transactional or otherwise serialized boundary.",
      "For delivery, record input snapshot IDs, schema and grammar versions, Polars version, output checksums, rejected counts and reconciliation totals. Stage outputs before publishing them. Test retry behavior and maintain a prior completed report for rollback. Never describe this synthetic exercise as personal production experience."
    ],
    code: `import polars as pl

events = pl.DataFrame({
    "rfq": ["a", "a", "b", "c"], "seq": [1, 2, 1, 1],
    "desk": ["A", "A", "A", "B"], "qty": [10, 12, 8, 5],
})
limits = pl.DataFrame({"desk": ["A"], "limit": [18]})
latest = events.sort(["rfq", "seq"]).unique(subset="rfq", keep="last")
assert latest["rfq"].n_unique() == 3
report = (latest.group_by("desk").agg(pl.col("qty").sum())
    .join(limits, on="desk", how="left", validate="m:1")
    .with_columns(
        pl.when(pl.col("limit").is_null()).then(pl.lit("unknown"))
          .when(pl.col("qty") > pl.col("limit")).then(pl.lit("breach"))
          .otherwise(pl.lit("within")).alias("status")
    ).sort("desk"))
assert report.select("desk", "qty", "status").rows() == [("A", 20, "breach"), ("B", 5, "unknown")]
assert latest["qty"].sum() == report["qty"].sum() == 25`,
    expected: "Latest-state quantities total 25. Desk A has 20 against limit 18 and breaches. Desk B has no limit and remains unknown. Summing all event versions would incorrectly total 35.",
    challenge: "Add duplicate limits, conflicting sequence values, a stale quote and a late RFQ correction. Write expected rejection or correction behavior for each. Present a five-minute design review with the consistency boundary and one failure trace.",
    failure: "Treating missing limits as zero or infinity changes an unknown control state into an invented risk decision.",
    tradeoff: "A batch projection is easy to reproduce from immutable inputs. A continuously updated report lowers freshness delay but needs durable state, replay and late-event coordination outside this small query.",
    terms: { reconciliation: "Checking that source and output counts or totals agree under the transformation's documented rules.", unresolved_state: "An explicit result indicating that required evidence is missing or invalid." },
    source: "https://docs.pola.rs/user-guide/transformations/joins/",
    question: ["A desk has quantity but no configured risk limit. Which report state preserves the uncertainty?", ["Always within", "Always breach", "Unknown limit", "Discard desk"], 2,
      ["This invents permission from missing data.", "This invents a zero-limit policy.", "Unknown preserves the missing-control state for resolution.", "Dropping the desk hides exposure from the report."]]
  }
];

const escapeHtml = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const POLARS_CONTENT = Object.fromEntries(POLARS_LESSONS.map((item, index) => {
  const number = String(645 + index).padStart(4, "0");
  return [number, {
    ...item,
    reading: "Predict the assertions before using an existing Polars environment. Record pl.__version__. These examples target the documented stable Python API reviewed on 2026-09-24; pin and check your installed release. No package installation or runtime success is implied. " + item.expected,
    profile: {
      analogy: item.tradeoff,
      code: item.code,
      sourceLabel: "Polars official documentation",
      sourceUrl: item.source,
      checkpoint: item.expected,
      labScope: "Self-contained synthetic Python fixture requiring Polars already installed. File examples use unique temporary directories. Cloud, database, service and optional-library work is an extension, not a supplied deployment."
    },
    mechanism: item.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("\n") +
      (item.extraSource ? `<p><a href="${item.extraSource}">Related official documentation</a>.</p>` : ""),
    pitfalls: [["Failure to diagnose", item.failure], ["Tradeoff to defend", item.tradeoff]],
    rehearsal: item.challenge,
    answer: item.expected + " " + item.tradeoff
  }];
}));

export const POLARS_SCENARIOS = Object.fromEntries(Object.entries(POLARS_CONTENT).map(([number, item]) => [number, {
  kind: "scenario", terms: [], prompt: item.question[0], context: [item.model],
  options: item.question[1], answer: item.question[2], explanations: item.question[3],
  reasoning: [item.expected], followup: item.challenge
}]));
