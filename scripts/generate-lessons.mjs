import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const roadmapPath = join(root, "roadmap.yaml");
const lessonsDirectory = join(root, "lessons");
const referenceDirectory = join(root, "reference");

const TRACK_PROFILES = {
  "engineering-foundations": {
    analogy: "Treat the development environment like an airport: processes are flights, file descriptors are gates, signals are control messages, and logs are the flight recorder.",
    sourceLabel: "Git documentation",
    sourceUrl: "https://git-scm.com/docs",
    artifact: "diagnostic transcript and decision log",
    code: `# Observe before changing anything
pwd
ps -o pid,ppid,stat,command
printf '%s\\n' "$PATH" | tr ':' '\\n'

# Preserve the evidence
command 2>&1 | tee diagnostic.log
printf 'exit=%s\\n' "$?"`
  },
  "software-design": {
    analogy: "Software design is arranging a workshop: frequently changing work stays easy to reach, dangerous machinery sits behind guards, and each tool earns its space by solving a real task.",
    sourceLabel: "Martin Fowler's Refactoring catalog",
    sourceUrl: "https://refactoring.com/catalog/",
    artifact: "behavior-preserving refactor with a dependency sketch and tests",
    code: `type PriceRule = (subtotal: number) => number;

export function total(subtotal: number, rule: PriceRule): number {
  if (!Number.isFinite(subtotal) || subtotal < 0) throw new RangeError("subtotal");
  return Math.max(0, rule(subtotal));
}

const standard: PriceRule = subtotal => subtotal;
console.assert(total(100, standard) === 100);`
  },
  "computer-science": {
    analogy: "An algorithm is a route plan: correctness gets you to the destination, while the cost model tells you how the route behaves when the city grows.",
    sourceLabel: "MIT 6.006 Introduction to Algorithms",
    sourceUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/",
    artifact: "tested implementation and complexity argument",
    code: `function verify(candidate, cases) {
  for (const { input, expected } of cases) {
    const actual = candidate(input);
    console.assert(Object.is(actual, expected), { input, actual, expected });
  }
}

// State the invariant before optimizing.
// Measure representative sizes after proving correctness.`
  },
  "web-platform": {
    analogy: "A page load resembles a theatre production: networking delivers the script, parsing casts the actors, layout blocks the stage, and paint turns the plan into pixels.",
    sourceLabel: "MDN Web Docs",
    sourceUrl: "https://developer.mozilla.org/en-US/docs/Web",
    artifact: "browser trace with an explained critical path",
    code: `performance.mark("work:start");
await fetch("/api/example", { headers: { Accept: "application/json" } });
performance.mark("work:end");
performance.measure("work", "work:start", "work:end");

console.table(performance.getEntriesByType("measure"));`
  },
  "systems-foundations": {
    analogy: "Production software is a parcel crossing nested transport systems: the application labels intent, protocols add delivery information, and the kernel moves bytes while preserving isolation and resource limits.",
    sourceLabel: "IETF protocol standards and Linux kernel documentation",
    sourceUrl: "https://www.rfc-editor.org/",
    artifact: "executable systems trace with packet, process, memory, or storage evidence",
    code: `# Observe one process without third-party packages.
import os
import resource

print({
    "pid": os.getpid(),
    "open_file_limit": resource.getrlimit(resource.RLIMIT_NOFILE)[0],
    "user_cpu_seconds": resource.getrusage(resource.RUSAGE_SELF).ru_utime,
})`
  },
  "lld-machine-coding": {
    analogy: "A machine-coding interview is a small workshop build: clarify what must work, keep each part's ownership visible, assemble a working slice early, and use tests as the measuring tools.",
    sourceLabel: "Python data model documentation",
    sourceUrl: "https://docs.python.org/3/reference/datamodel.html",
    artifact: "runnable object model with invariants, tests, and an extension note",
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Identifier:
    value: str

    def __post_init__(self) -> None:
        if not self.value.strip():
            raise ValueError("identifier must not be empty")

assert Identifier("demo-1") == Identifier("demo-1")`
  },
  javascript: {
    analogy: "JavaScript execution is a set of labelled rooms: lexical environments hold bindings, the call stack tracks the current route, and job queues decide which door opens next.",
    sourceLabel: "ECMAScript language specification",
    sourceUrl: "https://tc39.es/ecma262/",
    artifact: "executable prediction table and runtime trace",
    code: `const trace = [];

queueMicrotask(() => trace.push("microtask"));
setTimeout(() => trace.push("timer"), 0);
trace.push("synchronous");

setTimeout(() => console.table(trace), 1);
// Predict first. Execute second. Explain from the specification model.`
  },
  typescript: {
    analogy: "A type system is a building inspector, not a security guard: it checks the plans before construction, but runtime validation still checks who actually enters.",
    sourceLabel: "TypeScript Handbook",
    sourceUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
    artifact: "typed boundary with compile-time and runtime tests",
    code: `type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw new Error(result.error); // exhaustive, explicit boundary
}`
  },
  react: {
    analogy: "React is a projection system: state is the film frame, rendering proposes the picture, and commit changes the screen. Effects synchronize equipment outside the projector.",
    sourceLabel: "React documentation",
    sourceUrl: "https://react.dev/learn",
    artifact: "profiled accessible component and state diagram",
    code: `function SearchStatus({ query, results }) {
  const count = results.length; // derive; do not duplicate state
  return (
    <section aria-live="polite">
      <strong>{count}</strong> results for <q>{query}</q>
    </section>
  );
}`
  },
  nodejs: {
    analogy: "Node is a restaurant with one head waiter and several specialist kitchens: JavaScript coordinates orders while the OS and worker pool perform eligible work.",
    sourceLabel: "Node.js documentation",
    sourceUrl: "https://nodejs.org/api/",
    artifact: "instrumented service with bounded resource use",
    code: `import { monitorEventLoopDelay } from "node:perf_hooks";

const delay = monitorEventLoopDelay({ resolution: 20 });
delay.enable();

setInterval(() => {
  console.log({ p99Ms: Number(delay.percentile(99) / 1e6).toFixed(1) });
  delay.reset();
}, 1000).unref();`
  },
  python: {
    analogy: "Python names are sticky notes attached to objects: assignment moves a note, mutation changes the object, and protocols define which tools know how to use it.",
    sourceLabel: "Python language reference",
    sourceUrl: "https://docs.python.org/3/reference/",
    artifact: "typed experiment with a measured runtime trace",
    code: `from time import perf_counter

started = perf_counter()
try:
    result = operation()
finally:
    elapsed_ms = (perf_counter() - started) * 1000
    print({"elapsed_ms": round(elapsed_ms, 2)})`
  },
  fastapi: {
    analogy: "A FastAPI request is a package moving through checkpoints: the server accepts it, routing identifies the destination, validation inspects it, dependencies prepare resources, and serialization seals the response.",
    sourceLabel: "FastAPI documentation",
    sourceUrl: "https://fastapi.tiangolo.com/tutorial/",
    artifact: "tested API slice with explicit failure behavior",
    code: `from fastapi import Depends, FastAPI
from pydantic import BaseModel

app = FastAPI()

class Command(BaseModel):
    value: str

@app.post("/commands", status_code=202)
async def create_command(body: Command, service=Depends(get_service)):
    return await service.accept(body)`
  },
  "data-systems": {
    analogy: "A database is a shared ledger with librarians: constraints protect meaning, indexes shorten searches, transactions coordinate edits, and recovery logs preserve history.",
    sourceLabel: "PostgreSQL documentation",
    sourceUrl: "https://www.postgresql.org/docs/current/",
    artifact: "schema or query backed by plan evidence",
    code: `BEGIN;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status
FROM jobs
WHERE tenant_id = $1 AND status = 'ready'
ORDER BY created_at
LIMIT 50;

ROLLBACK; -- inspect without retaining experimental changes`
  },
  "api-distributed-systems": {
    analogy: "A distributed system is a team communicating by delayed letters: messages can arrive late, twice, out of order, or not at all, so correctness must survive uncertainty.",
    sourceLabel: "Designing Data-Intensive Applications",
    sourceUrl: "https://dataintensive.net/",
    artifact: "failure-aware design with stated invariants",
    code: `async function executeWithDeadline(operation, signal) {
  if (signal.aborted) throw signal.reason;
  const result = await operation({ signal });
  return { result, observedAt: new Date().toISOString() };
}

// A retry policy also needs: deadline, backoff,
// idempotency, attempt budget, and observable outcomes.`
  },
  "service-architecture-events": {
    analogy: "A business platform is a city: bounded contexts are districts with local language and rules, services are independently operated buildings, and event logs are durable transport routes rather than telepathy.",
    sourceLabel: "Microsoft microservices architecture guidance",
    sourceUrl: "https://learn.microsoft.com/en-us/azure/architecture/microservices/",
    artifact: "domain map and failure-tested event workflow",
    code: `type EventEnvelope<T> = Readonly<{
  id: string;
  type: string;
  occurredAt: string;
  aggregateId: string;
  version: number;
  data: T;
}>;

// Consumers validate versioned contracts and store event IDs with local effects.
// Transport delivery can repeat; business effects must remain idempotent.`
  },
  "quality-security": {
    analogy: "Quality engineering is a safety case: tests supply evidence, security identifies adversaries, observability exposes reality, and incident practice limits the blast radius.",
    sourceLabel: "OWASP ASVS",
    sourceUrl: "https://owasp.org/www-project-application-security-verification-standard/",
    artifact: "risk-based test and operational evidence",
    code: `const testCase = {
  invariant: "a user reads only authorized records",
  stimulus: "request another tenant's identifier",
  expected: { status: 404, leakedFields: 0 },
  evidence: ["response", "audit-event", "trace-id"]
};

console.table(testCase);`
  }
};

function serviceArchitectureCodeFor(title, fallback) {
  if (title.startsWith("Microservices,")) return `type Capability = "orders" | "billing" | "notifications";
type BoundaryEvidence = Readonly<{
  capability: Capability;
  changesIndependently: boolean;
  ownsData: boolean;
  needsIndependentScale: boolean;
  crossBoundaryTransactions: number;
  synchronousCallsPerRequest: number;
}>;

function shouldExtract(candidate: BoundaryEvidence): boolean {
  const benefit = Number(candidate.changesIndependently) + Number(candidate.ownsData) + Number(candidate.needsIndependentScale);
  const distributedCost = candidate.crossBoundaryTransactions + candidate.synchronousCallsPerRequest;
  return benefit >= 2 && distributedCost <= 1;
}

const billing = {
  capability: "billing", changesIndependently: true, ownsData: true,
  needsIndependentScale: false, crossBoundaryTransactions: 0, synchronousCallsPerRequest: 1,
};
console.assert(shouldExtract(billing));
// This score is a discussion aid, not an automatic architecture decision.
// Start modular; extraction also buys network, deployment, and on-call work.`;

  if (title.startsWith("Strategic domain-driven design")) return `type Context = Readonly<{
  name: string;
  subdomain: "core" | "supporting" | "generic";
  language: Readonly<Record<string, string>>;
  upstream?: string;
  relationship?: "customer-supplier" | "published-language" | "anti-corruption-layer";
}>;

const contexts: readonly Context[] = [
  { name: "Ordering", subdomain: "core", language: { Order: "customer purchase commitment" } },
  { name: "Fulfillment", subdomain: "supporting", language: { Order: "warehouse pick instruction" },
    upstream: "Ordering", relationship: "published-language" },
  { name: "Payments", subdomain: "generic", language: { Charge: "provider payment attempt" },
    upstream: "Ordering", relationship: "anti-corruption-layer" },
];

console.assert(contexts[0].language.Order !== contexts[1].language.Order);
// A context map records model and team relationships. It does not require one
// shared Order class or one microservice for every noun.`;

  if (title.startsWith("Tactical domain-driven design")) return `class Money {
  constructor(readonly cents: number, readonly currency: string) {
    if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError("cents");
  }
}

class Order {
  #status = "draft";
  #events = [];
  constructor(readonly id: string, readonly total: Money) {}
  place() {
    if (this.#status !== "draft") throw new Error("only a draft order can be placed");
    this.#status = "placed";
    this.#events.push({ type: "OrderPlaced", orderId: this.id, totalCents: this.total.cents });
  }
  pullEvents() { const events = [...this.#events]; this.#events.length = 0; return events; }
  get status() { return this.#status; }
}

const order = new Order("A-42", new Money(2500, "USD"));
order.place();
console.assert(order.status === "placed" && order.pullEvents()[0].type === "OrderPlaced");
// Order is the aggregate root and protects the immediate consistency boundary.`;

  if (title.startsWith("Commands,")) return `async function placeOrder(command, database) {
  return database.transaction(async tx => {
    if (await tx.commands.exists(command.id)) return; // idempotent command receipt
    const order = await tx.orders.require(command.orderId);
    order.place();
    await tx.orders.save(order);
    await tx.outbox.insert({
      id: crypto.randomUUID(), type: "OrderPlaced.v1",
      aggregateId: order.id, payload: { orderId: order.id },
    });
    await tx.commands.record(command.id);
  });
}

async function consumeOnce(event, database) {
  return database.transaction(async tx => {
    if (!(await tx.inbox.insertIfAbsent(event.id))) return;
    await tx.fulfillment.createIfAbsent(event.aggregateId);
  });
}

// Domain state and outbox commit together. Relay delivery may repeat. Inbox
// identity and local effect commit together. A process manager persists later steps.`;

  if (title.startsWith("Event-driven architecture")) return `type Event = { id: string; type: string; orderId: string };
type Handler = (event: Event) => Promise<void>;

class InMemoryBroker {
  #handlers = new Map<string, Set<Handler>>();
  subscribe(type: string, handler: Handler) {
    const handlers = this.#handlers.get(type) ?? new Set();
    handlers.add(handler); this.#handlers.set(type, handlers);
    return () => handlers.delete(handler);
  }
  async publish(event: Event) {
    const results = await Promise.allSettled([...this.#handlers.get(event.type) ?? []].map(fn => fn(event)));
    if (results.some(result => result.status === "rejected")) throw new Error("partial fan-out failure");
  }
}

const broker = new InMemoryBroker();
const observed = [];
broker.subscribe("OrderPlaced", async event => observed.push(event.orderId));
await broker.publish({ id: "e-1", type: "OrderPlaced", orderId: "A-42" });
console.assert(observed[0] === "A-42");
// Production subscriptions need durable position, retries, idempotency, and traces.`;

  if (title.startsWith("Kafka architecture")) return `# Create an ordered, replayable topic split across six partitions.
kafka-topics.sh --bootstrap-server localhost:9092 --create \\
  --topic order-events --partitions 6 --replication-factor 3 \\
  --config retention.ms=604800000 \\
  --config cleanup.policy=delete

# Inspect leaders, replicas, and in-sync replicas for every partition.
kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --topic order-events

# Key every order event by order_id so one order stays in one ordered partition.
kafka-console-producer.sh --bootstrap-server localhost:9092 \\
  --topic order-events --property parse.key=true --property key.separator=:
A-42:{"type":"OrderPlaced.v1","order_id":"A-42"}

# Retention removes old log data by time or size. Compaction retains the latest
# value per key plus delete tombstones; neither provides global ordering.`;

  if (title.startsWith("Kafka replication")) return `# Topic durability policy: a leader accepts an all-replicas acknowledgement
# only while at least two in-sync replicas are available.
kafka-configs.sh --bootstrap-server localhost:9092 --alter \\
  --entity-type topics --entity-name order-events \\
  --add-config min.insync.replicas=2,unclean.leader.election.enable=false

# Producer side must request the matching acknowledgement strength.
acks=all
enable.idempotence=true
delivery.timeout.ms=120000

# Observe ISR shrink and leadership during controlled broker loss.
kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --topic order-events

# replication.factor=3, min.insync.replicas=2, and acks=all tolerate one replica
# loss for writes. If another required replica is unavailable, safe writes fail.`;

  if (title.startsWith("Kafka producers")) return `const producerConfig = {
  acks: "all",
  enableIdempotence: true,
  compression: "zstd",
  lingerMs: 10,
  batchSize: 64 * 1024,
};

async function handleBatch(consumer, database, records) {
  for (const record of records) {
    await database.transaction(async tx => {
      if (!(await tx.inbox.insertIfAbsent(record.topic, record.partition, record.offset))) return;
      await applyBusinessEffect(tx, record.value);
    });
  }
  await consumer.commitOffset(records.at(-1).offset + 1); // next record to read
}

// Crash before commit: records repeat, so the inbox protects business effects.
// Crash after commit but before an external effect: that effect can be lost.
// Kafka transactions atomically cover Kafka output records and consumed offsets,
// not an unrelated database or third-party API.`;

  if (title.startsWith("Event schemas")) return `const schemaV2 = {
  type: "object",
  required: ["event_id", "type", "order_id", "occurred_at"],
  properties: {
    event_id: { type: "string" },
    type: { const: "OrderPlaced.v2" },
    order_id: { type: "string" },
    occurred_at: { type: "string", format: "date-time" },
    channel: { enum: ["web", "mobile", "support"], default: "web" },
  },
  additionalProperties: false,
};

async function process(event, operations) {
  const parsed = validate(schemaV2, event);
  if (!parsed.ok) return operations.quarantine(event, parsed.errors);
  return operations.consumeIdempotently(parsed.value);
}

// CI checks compatibility against registered old versions. Operations track
// publish errors, bytes, partition skew, consumer lag, rebalance time, retries,
// quarantine age, end-to-end latency, and the final business outcome.`;

  return fallback;
}

const DSA_APPROACHES = [
  ["Arrays and hashing", "Duplicate badge detector → target pair → signature grouping", "Repeated scans: O(n²) time, O(1) space", "Hash index: expected O(n) time, O(n) space", "seen: {} → {7} → duplicate 7"],
  ["Two pointers", "Normalized palindrome → sorted target pair → zero-sum triples", "Enumerate pairs: O(n²) time", "Proven pointer movement: O(n) per scan", "left/right/sum: 0/5/21 → 0/4/16 → 1/4/19"],
  ["Sliding windows", "Fixed load → distinct session → minimum cover", "Rebuild every range: O(n·k) or O(n²)", "Update one window: O(n) time, O(k) space", "[left,right] total: [0,2]=8 → [1,3]=11"],
  ["Stacks", "Delimiter check → next warmer value → largest block", "Rescan unresolved suffixes: O(n²)", "Monotonic stack: O(n) amortized", "stack indices: [] → [0] → [0,1] → [2]"],
  ["Linked lists", "Reverse → sorted merge → cycle detection", "Copy values: O(n) extra space", "Rewire pointers: O(n) time, O(1) space", "prev/curr/next: null/1/2 → 1/2/3"],
  ["Heaps", "Kth largest → merge feeds → running median", "Sort after every update: O(n log n)", "Bounded heap: O(n log k), O(k) space", "heap(k=3): [8] → [3,8] → [3,8,10] → [8,10,12]"],
  ["Binary search", "Lower bound → rotated lookup → minimum capacity", "Linear candidate scan: O(n)", "Halve a monotonic range: O(log n)", "[lo,mid,hi): [0,3,7) → [4,5,7) → [4,4,5)"],
  ["Depth-first search", "Tree depth → constrained path → grid regions", "Repeat traversal per query: up to O(n²)", "One DFS: O(V+E) time", "stack/path: [A] → [A,B] → [A,B,D] → [A,C]"],
  ["Greedy algorithms", "Single trade → minimum jumps → compatible bookings", "Enumerate choice sequences: exponential", "Proven local choice: O(n) or O(n log n)", "finish/chosen: -∞/[] → 2/[B] → 4/[B,C]"],
  ["Dynamic programming", "Stair counts → minimum coins → common subsequence", "Repeat subproblems: exponential", "Store each state once: polynomial time and space", "dp amount 0..6: 0,1,2,1,1,2,2"],
  ["Graphs", "Dependency order → minimum delivery cost → redundant link", "Re-scan all routes: exponential paths", "Adjacency algorithm: usually O(V+E) or O((V+E)log V)", "indegree/queue: {A:0,B:1} / [A] → {B:0} / [B]"],
  ["Backtracking", "Subsets → bounded totals → board placement", "Generate then filter every candidate", "Prune invalid partial states before descent", "path: [] → [2] → [2,3] → undo → [4]"],
  ["Breadth-first search", "Level sums → spread time → word transforms", "DFS all paths: exponential", "Layered BFS: O(V+E)", "queue by level: [A] → [B,C] → [D,E,F]"],
  ["Tries", "Insert/find → suggestions → wildcard lookup", "Scan all words: O(N·L)", "Walk prefix: O(L + output)", "prefix node: root → c → ca → cat terminal"],
  ["Prefix sums", "Range totals → target subarrays → batch updates", "Recompute each range: O(q·n)", "Precompute then query: O(n+q)", "prefix: [0] → [0,2] → [0,2,7] → range=7−0"],
  ["Matrices", "Spiral read → rotate square → propagate zeroes", "Copy transformed grid: O(mn) extra space", "Boundary or marker state: O(1) extra space", "bounds: t0/r3/b2/l0 → t1/r2/b1/l1"],
  ["Intervals", "Merge → insert → minimum rooms", "Compare every pair: O(n²)", "Sort then sweep: O(n log n)", "current: [1,3] + [2,6] → [1,6]"],
  ["Bit manipulation", "Unpaired ID → population count → subsets", "Set or boolean-array bookkeeping: O(n) space", "XOR and masks: O(n) time, O(1) state", "mask: 0000 → 0100 → 0101 → 0001"]
];

function dsaApproachFor(title) {
  const item = DSA_APPROACHES.find(([prefix]) => title.startsWith(prefix));
  return item && { problems: item[1], baseline: item[2], optimized: item[3], trace: item[4] };
}

function dsaApproachMarkup(lesson) {
  if (lesson.trackId !== "computer-science") return "";
  const approach = dsaApproachFor(lesson.title);
  if (!approach) return "";
  return `<section class="card mechanism-walkthrough" data-dsa-approach="true">
    <span class="section-label">05B · Approach ladder</span>
    <div class="walkthrough-grid">
      <article><span>PROBLEM LADDER</span><h3>Easy → intermediate → stretch</h3><p>${escapeHtml(approach.problems)}</p></article>
      <article><span>BASELINE</span><h3>Start with the obvious solution</h3><p>${escapeHtml(approach.baseline)}</p></article>
      <article><span>OPTIMIZED</span><h3>Name the invariant that removes work</h3><p>${escapeHtml(approach.optimized)}</p></article>
      <article><span>STATE TRACE</span><h3>Move one step at a time</h3><p><code>${escapeHtml(approach.trace)}</code></p></article>
    </div>
  </section>`;
}

function computerScienceCodeFor(title, fallback) {
  if (title.startsWith("Arrays and hashing")) return `function groupBySignature(labels) {
  const groups = new Map();
  for (const label of labels) {
    const key = [...label].sort().join("");
    const group = groups.get(key) ?? [];
    group.push(label);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function targetPair(values, target) {
  const indexByValue = new Map();
  for (let i = 0; i < values.length; i++) {
    const match = indexByValue.get(target - values[i]);
    if (match !== undefined) return [match, i];
    indexByValue.set(values[i], i);
  }
}

console.assert(JSON.stringify(targetPair([4, 7, 2], 9)) === "[1,2]");
console.assert(groupBySignature(["arc", "car", "tap"]).length === 2);
// Baseline: compare every pair O(n²). Hash lookup: expected O(n) time, O(n) space.`;

  if (title.startsWith("Two pointers")) return `function sortedPair(values, target) {
  let left = 0, right = values.length - 1;
  const trace = [];
  while (left < right) {
    const sum = values[left] + values[right];
    trace.push({ left, right, sum });
    if (sum === target) return { indices: [left, right], trace };
    if (sum < target) left++; else right--;
  }
  return { indices: undefined, trace };
}

const answer = sortedPair([2, 5, 8, 11, 15, 19], 19);
console.assert(JSON.stringify(answer.indices) === "[2,3]");
console.assert(answer.trace.length === 4);
// Sorted order proves every skipped pair is impossible: O(n) after sorting,
// versus checking O(n²) pairs. If input is unsorted, sort or use a hash map.`;

  if (title.startsWith("Sliding windows")) return `function longestDistinct(text) {
  const lastSeen = new Map(), trace = [];
  let left = 0, best = 0;
  for (let right = 0; right < text.length; right++) {
    const previous = lastSeen.get(text[right]);
    if (previous !== undefined && previous >= left) left = previous + 1;
    lastSeen.set(text[right], right);
    best = Math.max(best, right - left + 1);
    trace.push({ left, right, best });
  }
  return { best, trace };
}

const answer = longestDistinct("abcaef");
console.assert(answer.best === 5 && answer.trace.at(-1).left === 1);
// Enumerating every substring is O(n²); each boundary only moves forward here,
// so total work is O(n) with O(k) character state.`;

  if (title.startsWith("Stacks,")) return `function nextGreater(values) {
  const answer = Array(values.length).fill(-1), stack = [], trace = [];
  for (let i = 0; i < values.length; i++) {
    while (stack.length && values[stack.at(-1)] < values[i]) {
      answer[stack.pop()] = values[i];
    }
    stack.push(i);
    trace.push({ index: i, unresolved: [...stack] });
  }
  return { answer, trace };
}

const result = nextGreater([4, 2, 7, 5]);
console.assert(JSON.stringify(result.answer) === "[7,7,-1,-1]");
// Each index is pushed and popped at most once: O(n), not O(n²), despite while.`;

  if (title.startsWith("Heaps,")) return `function pushHeap(heap, value) {
  heap.push(value);
  for (let child = heap.length - 1; child > 0;) {
    const parent = (child - 1) >> 1;
    if (heap[parent] <= heap[child]) break;
    [heap[parent], heap[child]] = [heap[child], heap[parent]];
    child = parent;
  }
}

function popHeap(heap) {
  const root = heap[0], last = heap.pop();
  if (heap.length) {
    heap[0] = last;
    for (let parent = 0;;) {
      let child = parent * 2 + 1;
      if (child >= heap.length) break;
      if (child + 1 < heap.length && heap[child + 1] < heap[child]) child++;
      if (heap[parent] <= heap[child]) break;
      [heap[parent], heap[child]] = [heap[child], heap[parent]];
      parent = child;
    }
  }
  return root;
}

function kthLargest(values, k) {
  const heap = [], trace = [];
  for (const value of values) {
    pushHeap(heap, value);
    if (heap.length > k) popHeap(heap);
    trace.push([...heap]);
  }
  return { value: heap[0], trace };
}

console.assert(kthLargest([8, 3, 10, 12, 5], 3).value === 8);
// Keep only k candidates: O(n log k) time and O(k) space versus sorting all n.`;

  if (title.startsWith("Depth-first search")) return `function countRegions(grid) {
  const seen = new Set(), trace = [];
  const visit = (row, col) => {
    const key = row + "," + col;
    if (row < 0 || col < 0 || row === grid.length || col === grid[0].length || grid[row][col] === 0 || seen.has(key)) return;
    seen.add(key); trace.push(key);
    visit(row + 1, col); visit(row - 1, col); visit(row, col + 1); visit(row, col - 1);
  };
  let regions = 0;
  for (let row = 0; row < grid.length; row++) for (let col = 0; col < grid[0].length; col++) {
    if (grid[row][col] && !seen.has(row + "," + col)) { regions++; visit(row, col); }
  }
  return { regions, trace };
}

console.assert(countRegions([[1, 0, 1], [1, 0, 1]]).regions === 2);
// Each cell is discovered once: O(rows × columns) time and visited state.`;

  if (title.startsWith("Breadth-first search")) return `function spreadMinutes(grid) {
  const queue = [], trace = []; let fresh = 0, minutes = 0;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) {
    if (grid[r][c] === 2) queue.push([r, c]);
    if (grid[r][c] === 1) fresh++;
  }
  for (let head = 0; head < queue.length && fresh;) {
    const levelEnd = queue.length; minutes++; trace.push(queue.slice(head, levelEnd));
    while (head < levelEnd) {
      const [r, c] = queue[head++];
      for (const [nr, nc] of [[r+1,c],[r-1,c],[r,c+1],[r,c-1]]) {
        if (grid[nr]?.[nc] !== 1) continue;
        grid[nr][nc] = 2; fresh--; queue.push([nr, nc]);
      }
    }
  }
  return { minutes: fresh ? -1 : minutes, trace };
}

console.assert(spreadMinutes([[2,1,0],[0,1,1]]).minutes === 3);
// The queue holds one distance frontier at a time: O(rows × columns).`;

  if (title.startsWith("Tries,")) return `class Trie {
  constructor() { this.root = new Map(); }
  insert(word) {
    let node = this.root;
    for (const character of word) {
      if (!node.has(character)) node.set(character, new Map());
      node = node.get(character);
    }
    node.set("", true);
  }
  has(word) {
    let node = this.root;
    for (const character of word) {
      node = node.get(character);
      if (!node) return false;
    }
    return node.has("");
  }
}

const trie = new Trie(); trie.insert("cat"); trie.insert("car");
console.assert(trie.has("cat") && !trie.has("ca"));
// Lookup follows only the input prefix: O(length), paid for with extra nodes.`;

  if (title.startsWith("Prefix sums")) return `function countTargetSubarrays(values, target) {
  const counts = new Map([[0, 1]]), trace = [];
  let prefix = 0, total = 0;
  for (const value of values) {
    prefix += value;
    total += counts.get(prefix - target) ?? 0;
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
    trace.push({ value, prefix, total });
  }
  return { total, trace };
}

const answer = countTargetSubarrays([2, -1, 2, 1], 3);
console.assert(answer.total === 2);
// Every target range satisfies prefix[right] - prefix[left] = target.
// Hashing earlier prefixes reduces O(n²) range enumeration to expected O(n).`;

  if (title.startsWith("Matrices,")) return `function spiral(matrix) {
  const output = [], trace = [];
  let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    trace.push({ top, right, bottom, left });
    for (let col = left; col <= right; col++) output.push(matrix[top][col]); top++;
    for (let row = top; row <= bottom; row++) output.push(matrix[row][right]); right--;
    if (top <= bottom) for (let col = right; col >= left; col--) output.push(matrix[bottom][col]); bottom--;
    if (left <= right) for (let row = bottom; row >= top; row--) output.push(matrix[row][left]); left++;
  }
  return { output, trace };
}

const result = spiral([[1,2,3],[4,5,6]]);
console.assert(result.output.join() === "1,2,3,6,5,4");
// Each cell is emitted once: O(rows × columns), O(1) traversal state.`;

  if (title.startsWith("Intervals,")) return `function mergeIntervals(intervals) {
  const ordered = [...intervals].sort((a, b) => a[0] - b[0]), merged = [], trace = [];
  for (const interval of ordered) {
    const current = merged.at(-1);
    if (!current || current[1] < interval[0]) merged.push([...interval]);
    else current[1] = Math.max(current[1], interval[1]);
    trace.push(merged.map(item => [...item]));
  }
  return { merged, trace };
}

const result = mergeIntervals([[8,10],[1,3],[2,6]]);
console.assert(JSON.stringify(result.merged) === "[[1,6],[8,10]]");
// Sorting exposes all possible overlaps locally: O(n log n), versus O(n²) pairs.`;

  if (title.startsWith("Sorting,")) return `function mergeSort(values) {
  if (values.length < 2) return [...values];
  const middle = values.length >> 1;
  const left = mergeSort(values.slice(0, middle));
  const right = mergeSort(values.slice(middle));
  const result = [];
  for (let i = 0, j = 0; i < left.length || j < right.length;) {
    if (j === right.length || (i < left.length && left[i] <= right[j])) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result;
}

function quickselect(values, k) {
  if (!Number.isInteger(k) || k < 0 || k >= values.length) throw new RangeError("k");
  const data = [...values];
  for (let lo = 0, hi = data.length - 1;;) {
    const pivot = data[hi]; let write = lo;
    for (let read = lo; read < hi; read++) if (data[read] < pivot) [data[write], data[read]] = [data[read], data[write++]];
    [data[write], data[hi]] = [data[hi], data[write]];
    if (write === k) return data[write];
    if (write < k) lo = write + 1; else hi = write - 1;
  }
}
console.assert(JSON.stringify(mergeSort([3, 1, 2, 1])) === "[1,1,2,3]");
console.assert(quickselect([7, 2, 5, 1], 2) === 5);`;

  if (title.startsWith("Binary search")) return `function lowerBound(values, target) {
  let lo = 0, hi = values.length; // answer is always inside [lo, hi]
  while (lo < hi) {
    const middle = lo + ((hi - lo) >> 1);
    if (values[middle] < target) lo = middle + 1;
    else hi = middle;
  }
  return lo;
}

function firstFeasible(lo, hi, feasible) {
  while (lo < hi) {
    const middle = lo + Math.floor((hi - lo) / 2);
    if (feasible(middle)) hi = middle;
    else lo = middle + 1;
  }
  return lo;
}

console.assert(lowerBound([], 4) === 0);
console.assert(lowerBound([1, 2, 2, 5], 2) === 1);
console.assert(firstFeasible(1, 20, capacity => capacity >= 13) === 13);`;

  if (title.startsWith("Array and string patterns")) return `function longestDistinct(text) {
  const lastSeen = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < text.length; right++) {
    const previous = lastSeen.get(text[right]);
    if (previous !== undefined && previous >= left) left = previous + 1;
    lastSeen.set(text[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}

function prefixSums(values) {
  const prefix = [0];
  for (const value of values) prefix.push(prefix.at(-1) + value);
  return { range: (left, right) => prefix[right] - prefix[left] };
}

console.assert(longestDistinct("abba") === 2);
console.assert(prefixSums([2, 4, 6]).range(1, 3) === 10);`;

  if (title.startsWith("Linked-list patterns") || title.startsWith("Linked lists")) return `function reverse(head) {
  let previous = null;
  while (head) {
    const next = head.next; // Preserve reachability before changing the link.
    head.next = previous;
    previous = head;
    head = next;
  }
  return previous;
}

function hasCycle(head) {
  let slow = head, fast = head;
  while (fast?.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

const list = { value: 1, next: { value: 2, next: null } };
console.assert(reverse(list).value === 2);
console.assert(!hasCycle({ value: 1, next: null }));`;

  if (title.startsWith("Tree algorithms")) return `function breadthFirst(root) {
  if (!root) return [];
  const values = [], queue = [root];
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    values.push(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return values;
}

function isValidBst(node, minimum = -Infinity, maximum = Infinity) {
  if (!node) return true;
  if (node.value <= minimum || node.value >= maximum) return false;
  return isValidBst(node.left, minimum, node.value) && isValidBst(node.right, node.value, maximum);
}

const tree = { value: 2, left: { value: 1 }, right: { value: 3 } };
console.assert(breadthFirst(tree).join() === "2,1,3");
console.assert(isValidBst(tree));`;

  if (title.startsWith("Graph algorithms") || title.startsWith("Graphs,")) return `function shortestUnweighted(graph, start) {
  const distance = new Map([[start, 0]]), queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    for (const next of graph.get(node) ?? []) {
      if (distance.has(next)) continue;
      distance.set(next, distance.get(node) + 1);
      queue.push(next);
    }
  }
  return distance;
}

function topologicalOrder(graph, indegree) {
  const queue = [...indegree].filter(([, degree]) => degree === 0).map(([node]) => node);
  const order = [];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i]; order.push(node);
    for (const next of graph.get(node) ?? []) if (indegree.set(next, indegree.get(next) - 1).get(next) === 0) queue.push(next);
  }
  if (order.length !== indegree.size) throw new Error("cycle");
  return order;
}

const graph = new Map([["a", ["b"]], ["b", ["c"]], ["c", []]]);
console.assert(shortestUnweighted(graph, "a").get("c") === 2);`;

  if (title.startsWith("Backtracking,")) return `function uniquePermutations(values) {
  const sorted = [...values].sort((a, b) => a - b), used = Array(values.length).fill(false), result = [];
  function search(path) {
    if (path.length === sorted.length) { result.push([...path]); return; }
    for (let i = 0; i < sorted.length; i++) {
      if (used[i] || (i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1])) continue;
      used[i] = true; path.push(sorted[i]);
      search(path);
      path.pop(); used[i] = false;
    }
  }
  search([]);
  return result;
}

const output = uniquePermutations([1, 1, 2]);
console.assert(output.length === 3);
console.assert(new Set(output.map(String)).size === output.length);`;

  if (title.startsWith("Dynamic programming")) return `function minimumCoins(coins, amount) {
  const best = Array(amount + 1).fill(Infinity), previous = Array(amount + 1).fill(-1);
  best[0] = 0;
  for (let value = 1; value <= amount; value++) {
    for (const coin of coins) {
      if (coin <= value && best[value - coin] + 1 < best[value]) {
        best[value] = best[value - coin] + 1;
        previous[value] = coin;
      }
    }
  }
  if (!Number.isFinite(best[amount])) return undefined;
  const chosen = [];
  for (let value = amount; value > 0; value -= previous[value]) chosen.push(previous[value]);
  return { count: best[amount], chosen };
}

const answer = minimumCoins([1, 3, 4], 6);
console.assert(answer.count === 2 && answer.chosen.reduce((a, b) => a + b, 0) === 6);`;

  if (title.startsWith("Greedy algorithms")) return `function maximumCompatible(intervals) {
  const ordered = [...intervals].sort((a, b) => a.end - b.end);
  const chosen = [];
  let availableAt = -Infinity;
  for (const interval of ordered) {
    if (interval.start < availableAt) continue;
    chosen.push(interval);
    availableAt = interval.end;
  }
  return chosen;
}

const intervals = [
  { start: 0, end: 6 }, { start: 1, end: 2 },
  { start: 3, end: 4 }, { start: 5, end: 7 },
];
console.assert(maximumCompatible(intervals).length === 3);
// Proof: replace the first interval of any optimum with the earliest-finishing
// compatible interval; this cannot reduce room for the remaining schedule.`;

  if (title.startsWith("Bit manipulation")) return `const hasFlag = (mask, bit) => (mask & (1 << bit)) !== 0;
const addFlag = (mask, bit) => mask | (1 << bit);
const removeFlag = (mask, bit) => mask & ~(1 << bit);

function countBits32(value) {
  value >>>= 0;
  let count = 0;
  while (value) {
    value &= value - 1; // Remove the lowest set bit.
    count++;
  }
  return count;
}

let permissions = addFlag(0, 2);
console.assert(hasFlag(permissions, 2));
permissions = removeFlag(permissions, 2);
console.assert(!hasFlag(permissions, 2));
console.assert(countBits32(0b101101) === 4);
// JavaScript bitwise operators use signed 32-bit integers; use BigInt beyond that.`;

  return fallback;
}

function systemsFoundationsCodeFor(title, fallback) {
  if (title.startsWith("Request to wire")) return `layers = [
    ("application", {"message": "GET /health HTTP/1.1"}),
    ("transport", {"source_port": 53000, "destination_port": 443}),
    ("network", {"source_ip": "192.0.2.10", "destination_ip": "198.51.100.20"}),
    ("link", {"source_mac": "02:00:00:00:00:10", "next_hop_mac": "02:00:00:00:00:01"}),
]

wire = []
for layer, header in layers:
    wire.append({"layer": layer, "header": header.copy()})

assert [item["layer"] for item in wire] == ["application", "transport", "network", "link"]
assert wire[0]["header"]["message"].startswith("GET")
# Encapsulation adds each layer's metadata; receiving removes it in reverse.
# A TCP receive chunk is bytes, not necessarily one complete HTTP message.`;

  if (title.startsWith("IPv4")) return `from ipaddress import ip_address, ip_network

subnet = ip_network("192.0.2.0/27")
host = ip_address("192.0.2.18")
remote = ip_address("198.51.100.8")
assert host in subnet and remote not in subnet
assert str(subnet.netmask) == "255.255.255.224"

neighbor_cache: dict[str, str] = {}
def learn_neighbor(ip: str, mac: str) -> None:
    if ip_address(ip) not in subnet:
        raise ValueError("ARP learns only an on-link next hop")
    neighbor_cache[ip] = mac

learn_neighbor("192.0.2.1", "02:00:00:00:00:01")
next_hop = str(remote) if remote in subnet else "192.0.2.1"
assert neighbor_cache[next_hop].endswith(":01")
# IPv4 uses ARP; IPv6 uses Neighbor Discovery. Both resolve an on-link next hop.`;

  if (title.startsWith("Routing tables")) return `from ipaddress import ip_address, ip_network

routes = [
    (ip_network("0.0.0.0/0"), "192.0.2.1"),
    (ip_network("10.0.0.0/8"), "10.0.0.1"),
    (ip_network("10.42.0.0/16"), "10.42.0.1"),
]

def next_hop(destination: str) -> str:
    address = ip_address(destination)
    matches = [(network.prefixlen, gateway) for network, gateway in routes if address in network]
    if not matches:
        raise LookupError("no route")
    return max(matches)[1]

nat: dict[tuple[str, int], tuple[str, int]] = {}
nat[("203.0.113.5", 40001)] = ("10.42.0.9", 53000)
assert next_hop("10.42.7.8") == "10.42.0.1"
assert next_hop("8.8.8.8") == "192.0.2.1"
assert nat[("203.0.113.5", 40001)] == ("10.42.0.9", 53000)
# Routers change link headers and hop limit. NAT additionally rewrites endpoint tuples.`;

  if (title.startsWith("UDP, TCP")) return `from struct import pack, unpack

def encode_datagram(source: int, destination: int, payload: bytes) -> bytes:
    if len(payload) > 65_527:
        raise ValueError("UDP payload too large")
    length = 8 + len(payload)
    return pack("!HHHH", source, destination, length, 0) + payload

def decode_datagram(data: bytes) -> tuple[int, int, bytes]:
    source, destination, length, _checksum = unpack("!HHHH", data[:8])
    if length != len(data):
        raise ValueError("invalid UDP length")
    return source, destination, data[8:]

packet = encode_datagram(53000, 53, b"query")
assert decode_datagram(packet) == (53000, 53, b"query")

tcp_states = ["CLOSED", "SYN-SENT", "ESTABLISHED", "FIN-WAIT", "CLOSED"]
assert tcp_states[2] == "ESTABLISHED"
# TCP exposes an ordered byte stream; applications still need their own framing.`;

  if (title.startsWith("TCP flow control")) return `def congestion_trace(acks: int, loss_at: int) -> list[int]:
    window, threshold, trace = 1, 8, []
    for step in range(acks):
        trace.append(window)
        if step == loss_at:
            threshold = max(2, window // 2)
            window = 1
        elif window < threshold:
            window *= 2                 # slow start
        else:
            window += 1                 # additive increase
    return trace

trace = congestion_trace(9, loss_at=5)
assert trace[:5] == [1, 2, 4, 8, 9]
assert trace[6] == 1

receiver_window = 6
sendable = min(trace[4], receiver_window)
assert sendable == 6
# Flow control protects the receiver; congestion control protects the path.
# Application backpressure must still bound work before bytes reach the socket.`;

  if (title.startsWith("DNS resolution")) return `from urllib.parse import urlsplit

def request_plan(url: str) -> list[str]:
    parsed = urlsplit(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("absolute HTTPS URL required")
    return [
        f"DNS resolve {parsed.hostname}",
        "connect transport",
        f"TLS authenticate {parsed.hostname}",
        f"HTTP GET {parsed.path or '/'}",
        "validate response and cache policy",
    ]

plan = request_plan("https://example.com/health")
assert plan[0] == "DNS resolve example.com"
assert plan[2] == "TLS authenticate example.com"
assert plan[-1].startswith("validate")
# HTTP semantics stay stable while HTTP/1.1, HTTP/2, and HTTP/3 frame and
# multiplex messages differently over TCP or QUIC.`;

  if (title.startsWith("System calls")) return `import os

read_fd, write_fd = os.pipe()
try:
    written = os.write(write_fd, b"ready")
    os.close(write_fd)
    write_fd = -1
    received = os.read(read_fd, 5)
    assert written == 5 and received == b"ready"
finally:
    os.close(read_fd)
    if write_fd >= 0:
        os.close(write_fd)

# os.pipe/read/write/close cross through C-library wrappers to kernel objects.
# fork creates a process; exec replaces its program; wait retains its exit status.`;

  if (title.startsWith("Processes, threads")) return `from collections import deque

def round_robin(bursts: dict[str, int], quantum: int) -> list[tuple[str, int]]:
    ready, trace = deque(bursts), []
    remaining = bursts.copy()
    while ready:
        task = ready.popleft()
        ran = min(quantum, remaining[task])
        remaining[task] -= ran
        trace.append((task, ran))
        if remaining[task]:
            ready.append(task)
    return trace

trace = round_robin({"api": 5, "worker": 3}, quantum=2)
assert trace == [("api", 2), ("worker", 2), ("api", 2), ("worker", 1), ("api", 1)]
# A real context switch also saves/restores registers and changes address-space,
# cache, and scheduler state depending on whether tasks share a process.`;

  if (title.startsWith("Race conditions")) return `from dataclasses import dataclass, field
from threading import Lock, Thread

@dataclass
class Account:
    number: int
    balance: int
    lock: Lock = field(default_factory=Lock)

def transfer(source: Account, target: Account, amount: int) -> None:
    first, second = sorted((source, target), key=lambda account: account.number)
    with first.lock, second.lock:  # one global lock order prevents circular wait
        if source.balance < amount:
            raise ValueError("insufficient funds")
        source.balance -= amount
        target.balance += amount

a, b = Account(1, 100), Account(2, 100)
threads = [Thread(target=transfer, args=(a, b, 10)), Thread(target=transfer, args=(b, a, 20))]
for thread in threads: thread.start()
for thread in threads: thread.join()
assert a.balance + b.balance == 200
# The lock protects the total-balance invariant; ordering protects progress.`;

  if (title.startsWith("Address spaces")) return `from collections import OrderedDict

def translate(virtual_address: int, page_size: int, page_table: dict[int, int]) -> int:
    virtual_page, offset = divmod(virtual_address, page_size)
    if virtual_page not in page_table:
        raise LookupError("page fault")
    return page_table[virtual_page] * page_size + offset

assert translate(0x1234, 4096, {1: 9}) == 0x9234

def lru_faults(pages: list[int], capacity: int) -> int:
    resident, faults = OrderedDict(), 0
    for page in pages:
        if page not in resident:
            faults += 1
            if len(resident) == capacity: resident.popitem(last=False)
        else: resident.pop(page)
        resident[page] = True
    return faults

assert lru_faults([1, 2, 1, 3, 1], 2) == 3
# Virtual memory provides translation, protection, sharing, and sparse allocation;
# swap is only one possible backing mechanism.`;

  if (title.startsWith("I/O, disks")) return `import os
from pathlib import Path
from tempfile import TemporaryDirectory

def durable_replace(directory: Path, name: str, data: bytes) -> None:
    temporary = directory / (name + ".tmp")
    with temporary.open("wb") as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, directory / name)
    directory_fd = os.open(directory, os.O_RDONLY)
    try: os.fsync(directory_fd)
    finally: os.close(directory_fd)

with TemporaryDirectory() as location:
    directory = Path(location)
    durable_replace(directory, "state.bin", b"committed")
    assert (directory / "state.bin").read_bytes() == b"committed"
# Flush makes Python hand bytes to the OS; fsync asks the storage path to make
# them durable. Atomic rename avoids exposing a partially replaced file.`;

  if (title.startsWith("Namespaces")) return `import os
import platform
import resource

def snapshot() -> dict[str, object]:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    return {
        "pid": os.getpid(),
        "platform": platform.system(),
        "user_cpu_seconds": usage.ru_utime,
        "system_cpu_seconds": usage.ru_stime,
        "open_file_limit": resource.getrlimit(resource.RLIMIT_NOFILE)[0],
    }

evidence = snapshot()
assert evidence["pid"] > 0 and evidence["open_file_limit"] > 0
# On Linux inspect /proc/PID/ns, /proc/PID/cgroup, mountinfo, capabilities,
# pressure-stall data, sockets, faults, throttling, OOM events, and exit status.
# Namespaces change views; cgroups account and limit resources.`;

  return fallback;
}

function lldMachineCodingCodeFor(title, fallback) {
  if (title.startsWith("Requirement discovery")) return `class Capacity:
    def __init__(self, total: int) -> None:
        if total < 1: raise ValueError("total")
        self.total, self.used = total, 0

    def reserve(self) -> None:
        if self.used == self.total: raise RuntimeError("full")
        self.used += 1

    def release(self) -> None:
        if self.used == 0: raise RuntimeError("nothing reserved")
        self.used -= 1

capacity = Capacity(1)
capacity.reserve()
assert (capacity.used, capacity.total) == (1, 1)
try: capacity.reserve()
except RuntimeError: pass
else: raise AssertionError("capacity invariant failed")`;

  if (title.startsWith("Domain modeling")) return `from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str = "INR"

    def __post_init__(self) -> None:
        if self.amount < 0: raise ValueError("negative money")

@dataclass(frozen=True)
class VehicleId:
    value: str

    def __post_init__(self) -> None:
        if not self.value.strip(): raise ValueError("empty vehicle id")

assert Money(Decimal("10.00")) == Money(Decimal("10.00"))
assert VehicleId("KA-01-AB-1234") != VehicleId("KA-01-AB-1235")`;

  if (title.startsWith("Object relationships")) return `from dataclasses import dataclass, field

@dataclass
class Spot:
    number: int
    vehicle_id: str | None = None

@dataclass
class Floor:
    number: int
    spots: list[Spot] = field(default_factory=list)

    def add(self, spot: Spot) -> None:
        if any(item.number == spot.number for item in self.spots):
            raise ValueError("duplicate spot")
        self.spots.append(spot)

floor = Floor(1)
floor.add(Spot(101))
assert floor.spots[0].number == 101
try: floor.add(Spot(101))
except ValueError: pass
else: raise AssertionError("floor must own unique spots")`;

  if (title.startsWith("Interfaces")) return `from typing import Protocol

class PaymentGateway(Protocol):
    def charge(self, amount_cents: int) -> str: ...

class FakeGateway:
    def __init__(self) -> None: self.charges: list[int] = []
    def charge(self, amount_cents: int) -> str:
        self.charges.append(amount_cents)
        return f"payment-{len(self.charges)}"

def checkout(amount_cents: int, gateway: PaymentGateway) -> str:
    if amount_cents < 0: raise ValueError("amount")
    return gateway.charge(amount_cents)

fake = FakeGateway()
assert checkout(2500, fake) == "payment-1"
assert fake.charges == [2500]`;

  if (title.startsWith("Strategy")) return `from collections.abc import Callable

PriceRule = Callable[[int, int], int]

def hourly(hours: int, rate: int) -> int:
    return max(1, hours) * rate

def first_hour_free(hours: int, rate: int) -> int:
    return max(0, hours - 1) * rate

def fee(hours: int, rate: int, rule: PriceRule = hourly) -> int:
    if hours < 0 or rate < 0: raise ValueError("negative input")
    return rule(hours, rate)

assert fee(3, 100) == 300
assert fee(3, 100, first_hour_free) == 200
# The second real pricing rule earns the strategy seam; no factory hierarchy is needed.`;

  if (title.startsWith("State machines")) return `from enum import Enum, auto

class State(Enum):
    NEW = auto(); PAID = auto(); CANCELLED = auto(); SHIPPED = auto()

TRANSITIONS = {
    (State.NEW, "pay"): State.PAID,
    (State.NEW, "cancel"): State.CANCELLED,
    (State.PAID, "ship"): State.SHIPPED,
}

def transition(state: State, command: str) -> State:
    try: return TRANSITIONS[(state, command)]
    except KeyError: raise ValueError(f"invalid: {state.name} -> {command}") from None

assert transition(transition(State.NEW, "pay"), "ship") is State.SHIPPED
try: transition(State.CANCELLED, "ship")
except ValueError: pass
else: raise AssertionError("forbidden transition accepted")`;

  if (title.startsWith("Concurrency")) return `from threading import Lock, Thread

class Seat:
    def __init__(self) -> None:
        self._lock = Lock()
        self.owner: str | None = None

    def reserve(self, customer: str) -> bool:
        with self._lock:
            if self.owner is not None: return False
            self.owner = customer
            return True

seat = Seat()
results: list[bool] = []
threads = [Thread(target=lambda name=name: results.append(seat.reserve(name))) for name in ("A", "B")]
for thread in threads: thread.start()
for thread in threads: thread.join()
assert sorted(results) == [False, True] and seat.owner in {"A", "B"}`;

  if (title.startsWith("Repositories")) return `from dataclasses import dataclass

@dataclass(frozen=True)
class Booking:
    booking_id: str

class BookingRepository:
    def __init__(self) -> None: self.items: dict[str, Booking] = {}
    def add(self, booking: Booking) -> None:
        if booking.booking_id in self.items: raise ValueError("duplicate")
        self.items[booking.booking_id] = booking

def create_booking(booking_id: str, repository: BookingRepository, events: list[dict]) -> None:
    booking = Booking(booking_id)
    repository.add(booking)                 # authoritative change
    events.append({"type": "booked", "id": booking_id})  # after commit boundary

repository, events = BookingRepository(), []
create_booking("b-1", repository, events)
assert list(repository.items) == ["b-1"] and events == [{"type": "booked", "id": "b-1"}]`;

  if (title.startsWith("Testable design")) return `class MemoryStore:
    def __init__(self) -> None: self.data: dict[str, str] = {}
    def put(self, key: str, value: str) -> None:
        if not key: raise ValueError("key")
        self.data[key] = value
    def get(self, key: str) -> str | None: return self.data.get(key)

def store_contract(make_store) -> None:
    store = make_store()
    assert store.get("missing") is None
    store.put("a", "one"); store.put("a", "two")
    assert store.get("a") == "two"
    try: store.put("", "invalid")
    except ValueError: pass
    else: raise AssertionError("empty key accepted")

store_contract(MemoryStore)`;

  if (title.startsWith("Parking lot")) return `from dataclasses import dataclass

@dataclass
class Spot:
    number: int
    kind: str
    vehicle: str | None = None

class ParkingLot:
    def __init__(self, spots: list[Spot]) -> None: self.spots = spots
    def park(self, vehicle: str, kind: str) -> int:
        if any(spot.vehicle == vehicle for spot in self.spots): raise ValueError("already parked")
        spot = next((item for item in self.spots if item.vehicle is None and item.kind == kind), None)
        if spot is None: raise RuntimeError("full")
        spot.vehicle = vehicle
        return spot.number
    def leave(self, vehicle: str) -> None:
        spot = next((item for item in self.spots if item.vehicle == vehicle), None)
        if spot is None: raise KeyError(vehicle)
        spot.vehicle = None

lot = ParkingLot([Spot(1, "car"), Spot(2, "bike")])
assert lot.park("KA-01", "car") == 1
lot.leave("KA-01")
assert all(spot.vehicle is None for spot in lot.spots)`;

  if (title.startsWith("Splitwise")) return `from decimal import Decimal

def post_expense(payer: str, shares: dict[str, Decimal]) -> dict[str, Decimal]:
    if payer not in shares or any(value < 0 for value in shares.values()):
        raise ValueError("participants and shares")
    total = sum(shares.values(), Decimal("0"))
    balances = {person: -share for person, share in shares.items()}
    balances[payer] += total
    if sum(balances.values(), Decimal("0")) != 0:
        raise AssertionError("ledger must balance")
    return balances

balances = post_expense("A", {"A": Decimal("30.00"), "B": Decimal("30.00"), "C": Decimal("30.00")})
assert balances == {"A": Decimal("60.00"), "B": Decimal("-30.00"), "C": Decimal("-30.00")}
assert sum(balances.values(), Decimal("0")) == 0`;

  if (title.startsWith("Timed machine-coding")) return `from collections import OrderedDict, deque

class LRUCache:
    def __init__(self, capacity: int) -> None:
        if capacity < 1: raise ValueError("capacity")
        self.capacity, self.data = capacity, OrderedDict()
    def get(self, key):
        if key not in self.data: return None
        self.data.move_to_end(key)
        return self.data[key]
    def put(self, key, value) -> None:
        self.data[key] = value; self.data.move_to_end(key)
        if len(self.data) > self.capacity: self.data.popitem(last=False)

def allow(history: deque[float], now: float, limit: int, window: float) -> bool:
    while history and history[0] <= now - window: history.popleft()
    if len(history) >= limit: return False
    history.append(now); return True

cache = LRUCache(2); cache.put("a", 1); cache.put("b", 2); cache.get("a"); cache.put("c", 3)
assert cache.get("b") is None and cache.get("a") == 1
history = deque()
assert [allow(history, time, 2, 10) for time in (0, 1, 2, 10)] == [True, True, False, True]`;

  return fallback;
}

function softwareDesignCodeFor(title, fallback) {
  if (title.startsWith("Clean code")) return `type Line = { unitPrice: number; quantity: number };

function lineTotal(line: Line): number {
  if (line.quantity < 0) throw new RangeError("quantity must be non-negative");
  return line.unitPrice * line.quantity;
}

function discountFor(subtotal: number, isMember: boolean): number {
  if (!isMember) return 0;
  return subtotal >= 100 ? subtotal * 0.1 : 0;
}

export function orderTotal(lines: readonly Line[], isMember: boolean): number {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  return subtotal - discountFor(subtotal, isMember);
}

// Names expose the business steps. Small functions isolate rules. The comment
// is unnecessary because the code states what; add comments only for why.
console.assert(orderTotal([{ unitPrice: 50, quantity: 2 }], true) === 90);`;

  if (title.startsWith("DRY,")) return `type Region = "domestic" | "international";

// One business rule has one owner because every caller must change together.
export function shippingCents(region: Region, weightGrams: number): number {
  if (weightGrams <= 0) throw new RangeError("weightGrams");
  const base = region === "domestic" ? 500 : 1500;
  return base + Math.ceil(weightGrams / 1000) * 200;
}

// These transformations look similar today but represent different knowledge.
// Keep them separate until requirements prove they must change together.
export const normalizeSearchQuery = (value: string) => value.trim().toLowerCase();
export const normalizeDisplayName = (value: string) => value.trim().replace(/\\s+/g, " ");

// YAGNI: no ShippingRuleFactory, plugin registry, or remote configuration exists
// until a second real rule or deployment boundary requires one.
console.assert(shippingCents("domestic", 1200) === 900);
console.assert(normalizeSearchQuery("  React  ") === "react");`;

  if (title.startsWith("Cohesion,")) return `type Product = { id: string; available: number };

interface Inventory {
  find(productId: string): Promise<Product | undefined>;
  reserve(productId: string, quantity: number): Promise<void>;
}

export async function reserveAvailable(
  inventory: Inventory,
  productId: string,
  quantity: number,
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new RangeError("quantity");
  const product = await inventory.find(productId);
  if (!product || product.available < quantity) throw new Error("insufficient stock");
  await inventory.reserve(productId, quantity);
}

// Domain policy depends on a narrow capability, not SQL or an HTTP SDK.
// The adapter hides volatile storage details behind the stable Inventory boundary.`;

  if (title.startsWith("Single Responsibility")) return `type Quote = { subtotal: number; customer: "standard" | "member" };
type PricingRule = { name: string; applies(quote: Quote): boolean; price(quote: Quote): number };

const memberDiscount: PricingRule = {
  name: "member-discount",
  applies: quote => quote.customer === "member",
  price: quote => quote.subtotal * 0.9,
};

const standardPrice: PricingRule = {
  name: "standard",
  applies: () => true,
  price: quote => quote.subtotal,
};

export function price(quote: Quote, rules = [memberDiscount, standardPrice]): number {
  if (quote.subtotal < 0) throw new RangeError("subtotal");
  const rule = rules.find(candidate => candidate.applies(quote));
  if (!rule) throw new Error("no pricing rule");
  return rule.price(quote);
}

// Pricing owns pricing changes. Notification belongs elsewhere. Add a rule only
// when a real variation exists; one stable conditional can remain a conditional.
console.assert(price({ subtotal: 100, customer: "member" }) === 90);`;

  if (title.startsWith("Liskov Substitution")) return `type Order = Readonly<{ id: string; total: number }>;

interface OrderReader { find(id: string): Promise<Order | undefined> }
interface OrderWriter { save(order: Order): Promise<void> }

class MemoryOrders implements OrderReader, OrderWriter {
  readonly #orders = new Map<string, Order>();
  async find(id: string) { return this.#orders.get(id); }
  async save(order: Order) { this.#orders.set(order.id, order); }
}

async function readerContract(create: () => OrderReader & OrderWriter) {
  const store = create();
  console.assert(await store.find("missing") === undefined); // same missing-value contract
  await store.save({ id: "A-42", total: 10 });
  console.assert((await store.find("A-42"))?.total === 10);
}

// Consumers receive only capabilities they use. Domain code owns these ports;
// database adapters implement them without strengthening preconditions or
// weakening postconditions and failure behavior.
await readerContract(() => new MemoryOrders());`;

  if (title.startsWith("Composition,")) return `type Price = (subtotal: number) => number;
type Guard = (subtotal: number) => void;

const nonNegative: Guard = subtotal => {
  if (subtotal < 0) throw new RangeError("subtotal");
};
const memberDiscount: Price = subtotal => subtotal * 0.9;
const capAt = (limit: number): Price => subtotal => Math.min(subtotal, limit);

function composePrice(guard: Guard, ...rules: Price[]): Price {
  return subtotal => {
    guard(subtotal);
    return rules.reduce((value, rule) => rule(value), subtotal);
  };
}

const campaignPrice = composePrice(nonNegative, memberDiscount, capAt(80));
console.assert(campaignPrice(100) === 80);

// Pure rules own no mutable state. Composition supports combinations without a
// subclass for every pair. Use inheritance only for a genuine substitutable
// is-a relationship whose base contract remains true.`;

  if (title.startsWith("Design pattern literacy")) return `type PatternDecision = Readonly<{
  problem: string;
  forces: readonly string[];
  directDesign: string;
  pattern?: string;
  consequence: string;
  evidence: string;
}>;

const decision: PatternDecision = {
  problem: "Two payment providers expose incompatible APIs",
  forces: ["domain must not import provider SDKs", "providers fail differently"],
  directDesign: "one function while only one provider exists",
  pattern: "Adapter after the second provider arrives",
  consequence: "one extra boundary; stable domain contract",
  evidence: "provider contract tests and import graph",
};

function isJustified(value: PatternDecision): boolean {
  return Boolean(value.pattern && value.forces.length && value.evidence);
}

console.assert(isJustified(decision));
// Pattern names improve communication only after problem, forces, alternatives,
// and consequences are clear. Otherwise the pattern is decorative complexity.`;

  if (title.startsWith("Creational patterns")) return `type RequestOptions = Readonly<{ url: URL; timeoutMs: number; headers: Readonly<Record<string, string>> }>;

class RequestBuilder {
  #url?: URL;
  #timeoutMs = 5000;
  #headers: Record<string, string> = {};
  url(value: string) { this.#url = new URL(value); return this; }
  timeout(ms: number) { if (ms <= 0) throw new RangeError("timeout"); this.#timeoutMs = ms; return this; }
  header(name: string, value: string) { this.#headers[name] = value; return this; }
  build(): RequestOptions {
    if (!this.#url || this.#url.protocol !== "https:") throw new Error("secure URL required");
    return Object.freeze({ url: this.#url, timeoutMs: this.#timeoutMs, headers: { ...this.#headers } });
  }
}

interface Mailer { send(to: string, body: string): Promise<void> }
function createMailer(environment: "test" | "production"): Mailer {
  return environment === "test" ? new MemoryMailer() : new SmtpMailer(requiredConfig());
}

const request = new RequestBuilder().url("https://api.example/jobs").timeout(2000).build();
console.assert(request.timeoutMs === 2000);
// Prefer explicit construction and injection. Mutable singletons hide lifetime,
// leak state between tests, and make parallel work interfere.`;

  if (title.startsWith("Structural patterns")) return `interface TextModel { complete(prompt: string, signal: AbortSignal): Promise<string> }
type Provider = { generate(input: { text: string; abort: AbortSignal }): Promise<{ output: string }> };

class ProviderAdapter implements TextModel {
  constructor(private readonly provider: Provider) {}
  async complete(prompt: string, signal: AbortSignal) {
    return (await this.provider.generate({ text: prompt, abort: signal })).output;
  }
}

class TracedModel implements TextModel {
  constructor(private readonly inner: TextModel, private readonly record: (event: object) => void) {}
  async complete(prompt: string, signal: AbortSignal) {
    const started = performance.now();
    try { return await this.inner.complete(prompt, signal); }
    finally { this.record({ operation: "model.complete", elapsedMs: performance.now() - started }); }
  }
}

class AssistantFacade {
  constructor(private readonly model: TextModel) {}
  answer(question: string, signal: AbortSignal) {
    if (!question.trim()) throw new Error("question required");
    return this.model.complete("Answer briefly: " + question, signal);
  }
}

// Adapter changes an interface; Decorator preserves it while adding behavior;
// Facade exposes a smaller use-case surface. Similar wrappers, different intent.`;

  if (title.startsWith("Behavioral patterns")) return `type Status = "draft" | "approved" | "sent";
type Command = { type: "approve" } | { type: "send" };
type Listener = (from: Status, to: Status) => void;

const transition: Record<Status, Partial<Record<Command["type"], Status>>> = {
  draft: { approve: "approved" },
  approved: { send: "sent" },
  sent: {},
};

class Workflow {
  #status: Status = "draft";
  #listeners = new Set<Listener>();
  subscribe(listener: Listener) { this.#listeners.add(listener); return () => this.#listeners.delete(listener); }
  dispatch(command: Command) {
    const next = transition[this.#status][command.type];
    if (!next) throw new Error("invalid " + command.type + " from " + this.#status);
    const previous = this.#status;
    this.#status = next;
    for (const listener of [...this.#listeners]) listener(previous, next);
  }
  get status() { return this.#status; }
}

const workflow = new Workflow();
const events: string[] = [];
const unsubscribe = workflow.subscribe((from, to) => events.push(from + "->" + to));
workflow.dispatch({ type: "approve" });
unsubscribe();
console.assert(workflow.status === "approved" && events[0] === "draft->approved");`;

  if (title.startsWith("Code smells")) return `type LegacyOrder = { kind: "standard" | "member"; subtotal: number; shipping: number };

// Characterization tests capture current observable behavior before restructuring.
function legacyTotal(order: LegacyOrder): number {
  const discounted = order.kind === "member" ? order.subtotal * 0.9 : order.subtotal;
  return discounted + order.shipping;
}

const cases = [
  { input: { kind: "standard", subtotal: 100, shipping: 5 } as const, expected: 105 },
  { input: { kind: "member", subtotal: 100, shipping: 5 } as const, expected: 95 },
];

type Discount = (subtotal: number) => number;
const discounts: Record<LegacyOrder["kind"], Discount> = {
  standard: subtotal => subtotal,
  member: subtotal => subtotal * 0.9,
};
function refactoredTotal(order: LegacyOrder) { return discounts[order.kind](order.subtotal) + order.shipping; }

for (const test of cases) {
  console.assert(legacyTotal(test.input) === test.expected);
  console.assert(refactoredTotal(test.input) === test.expected);
}
// Commit structural changes separately; run tests after each named small step.`;

  if (title.startsWith("Architecture patterns")) return `type Order = { id: string; status: "draft" | "placed" };
interface Orders { find(id: string): Promise<Order | undefined>; save(order: Order): Promise<void> }
interface UnitOfWork { orders: Orders; commit(): Promise<void>; rollback(): Promise<void> }

export class PlaceOrder {
  constructor(private readonly start: () => Promise<UnitOfWork>) {}
  async execute(id: string): Promise<void> {
    const work = await this.start();
    try {
      const order = await work.orders.find(id);
      if (!order || order.status !== "draft") throw new Error("order cannot be placed");
      await work.orders.save({ ...order, status: "placed" });
      await work.commit();
    } catch (error) {
      await work.rollback();
      throw error;
    }
  }
}

// The vertical slice owns one use case. Domain state is framework-free. HTTP
// and database adapters point inward. The unit of work owns one transaction.
// Keep modules in one deployment until independent operation is proven necessary.`;

  return fallback;
}

function reactCodeFor(title, fallback) {
  if (title.startsWith("React setup")) return `// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root mount point");

createRoot(container, {
  onRecoverableError(error, info) {
    reportError({ error, componentStack: info.componentStack });
  }
}).render(<StrictMode><App /></StrictMode>);`;

  if (title.startsWith("JSX,")) return `const avatar = (
  <img
    src={user.avatarUrl}
    alt={user.displayName}
    width={48}
    height={48}
  />
);

// Approximate JSX transform:
const avatarElement = jsx("img", {
  src: user.avatarUrl,
  alt: user.displayName,
  width: 48,
  height: 48
});

console.log(Object.freeze(avatarElement));`;

  if (title.startsWith("Components,")) return `function Dialog({ title, actions, children }) {
  return (
    <section role="dialog" aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <div>{children}</div>
      <footer>{actions}</footer>
    </section>
  );
}

<Dialog title="Delete project" actions={<DeleteActions />}>
  <p>This cannot be undone.</p>
</Dialog>`;

  if (title.startsWith("Purity,")) return `function StoryTray({ stories }) {
  // Never mutate props: const items = stories; items.push(...)
  const items = [...stories, { id: "create", label: "Create story" }];
  return items.map(story => <Story key={story.id} story={story} />);
}

function Panel({ enabled }) {
  // Hooks stay unconditional because React stores them by call position.
  const [open, setOpen] = useState(false);
  if (!enabled) return null;
  return <button onClick={() => setOpen(value => !value)}>{String(open)}</button>;
}`;

  if (title.startsWith("Events,")) return `function Toolbar() {
  const [count, setCount] = useState(0);

  function handleClick(event) {
    event.stopPropagation();
    setCount(value => value + 1);
    setCount(value => value + 1); // queued against prior updater
    console.log("snapshot still", count);
  }

  return <div onClickCapture={() => audit("toolbar-click")}>
    <button onClick={handleClick}>Count: {count}</button>
  </div>;
}`;

  if (title.startsWith("useState,")) return `function Quantity({ initial = 1 }) {
  const [quantity, setQuantity] = useState(() => clamp(initial, 1, 99));
  const [draft, setDraft] = useState({ note: "", tags: [] });

  function addThree() {
    setQuantity(value => value + 1);
    setQuantity(value => value + 1);
    setQuantity(value => value + 1);
  }

  function addTag(tag) {
    setDraft(current => ({ ...current, tags: [...current.tags, tag] }));
  }

  return <Editor quantity={quantity} onAdd={addThree} draft={draft} onTag={addTag} />;
}`;

  if (title.startsWith("useReducer,")) return `const initialState = { step: 0, answers: {}, history: [] };

function reducer(state, action) {
  switch (action.type) {
    case "answered":
      return {
        ...state,
        answers: { ...state.answers, [state.step]: action.value },
        history: [...state.history, state]
      };
    case "next": return { ...state, step: state.step + 1 };
    case "undo": return state.history.at(-1) ?? state;
    default: throw new Error("Unknown action: " + action.type);
  }
}

const [state, dispatch] = useReducer(reducer, initialState);`;

  if (title.startsWith("State modeling,")) return `function Selection({ items }) {
  // Store identity; derive the selected object from current props.
  const [selectedId, setSelectedId] = useState(null);
  const selected = items.find(item => item.id === selectedId) ?? null;
  const completed = items.filter(item => item.done).length;

  return <List
    items={items}
    selectedId={selectedId}
    summary={completed + "/" + items.length}
    onSelect={setSelectedId}
  />;
}`;

  if (title.startsWith("Identity,")) return `function Board({ columns }) {
  return columns.map(column => (
    <Column key={column.id} title={column.title}>
      {column.cards.map(card => (
        // Stable identity preserves Card draft state during reordering.
        <Card key={card.id} card={card} />
      ))}
    </Column>
  ));
}

// Intentional reset when the selected account changes:
<AccountForm key={account.id} account={account} />`;

  if (title.startsWith("createContext")) return `const TasksContext = createContext(null);
const TasksDispatchContext = createContext(null);

function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  return (
    <TasksContext value={tasks}>
      <TasksDispatchContext value={dispatch}>{children}</TasksDispatchContext>
    </TasksContext>
  );
}

function useTasks() {
  const value = useContext(TasksContext);
  if (value === null) throw new Error("useTasks requires TasksProvider");
  return value;
}`;

  if (title.startsWith("useRef,")) return `const SearchBox = forwardRef(function SearchBox(props, ref) {
  const inputRef = useRef(null);
  const requestRef = useRef(null); // retained, non-rendering value

  useImperativeHandle(ref, () => ({
    focus() { inputRef.current?.focus(); },
    select() { inputRef.current?.select(); }
  }), []);

  return <input {...props} ref={inputRef} type="search" />;
});

const searchRef = useRef(null);
<SearchBox ref={searchRef} aria-label="Search lessons" />;`;

  if (title.startsWith("useEffect,")) return `function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const connection = createConnection(roomId);
    connection.onMessage(message => setMessages(items => [...items, message]));
    connection.connect({ signal: controller.signal });

    return () => {
      controller.abort();
      connection.disconnect();
    };
  }, [roomId]);

  return <MessageList messages={messages} />;
}`;

  if (title.startsWith("useLayoutEffect")) return `function Tooltip({ anchorRect, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useInsertionEffect(() => {
    // Library-only timing: insert critical dynamic style before layout work.
    return styleRegistry.acquire("tooltip", tooltipCss);
  }, []);

  useLayoutEffect(() => {
    setHeight(ref.current.getBoundingClientRect().height);
  }, [children]);

  return <div ref={ref} style={{ top: anchorRect.top - height }}>{children}</div>;
}`;

  if (title.startsWith("useEffectEvent")) return `function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected", theme); // reads latest committed theme
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", onConnected);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // theme is deliberately non-reactive here
}`;

  if (title.startsWith("Custom Hooks")) return `function useOnlineStatus() {
  const online = useSyncExternalStore(
    notify => {
      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
      };
    },
    () => navigator.onLine,
    () => true
  );
  useDebugValue(online, value => value ? "Online" : "Offline");
  return online;
}`;

  if (title.startsWith("memo,")) return `const Results = memo(function Results({ items, onChoose }) {
  return items.map(item => (
    <button key={item.id} onClick={() => onChoose(item.id)}>{item.label}</button>
  ));
});

function Search({ items, query }) {
  const visible = useMemo(() => rank(items, query), [items, query]);
  const choose = useCallback(id => analytics.track("choose", { id }), []);
  return <Results items={visible} onChoose={choose} />;
}

// Keep this only after Profiler evidence shows a useful bailout.`;

  if (title.startsWith("useTransition,")) return `function SearchPage({ allItems }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const deferredQuery = useDeferredValue(filter);
  const [isPending, startTransition] = useTransition();

  function change(event) {
    const next = event.target.value;
    setQuery(next); // urgent: keep controlled input synchronous
    startTransition(() => setFilter(next));
  }

  return <><input value={query} onChange={change} />
    <div aria-busy={isPending}><SlowResults query={deferredQuery} items={allItems} /></div></>;
}`;

  if (title.startsWith("useId,")) return `function Field({ label, error, ...inputProps }) {
  const id = useId();
  const errorId = error ? id + "-error" : undefined;
  return <div>
    <label htmlFor={id}>{label}</label>
    <input {...inputProps} id={id} aria-invalid={Boolean(error)} aria-describedby={errorId} />
    {error && <p id={errorId} role="alert">{error}</p>}
  </div>;
}

// useId coordinates accessibility and hydration; data IDs remain list keys.`;

  if (title.startsWith("useSyncExternalStore,")) return `const store = createStore();

function useCart() {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,       // must return cached immutable snapshots
    store.getServerSnapshot  // must match the hydration bootstrap value
  );
}

function CartCount() {
  const cart = useCart();
  return <output>{cart.items.length}</output>;
}`;

  if (title.startsWith("use, promises")) return `// Server Component starts work without blocking the whole tree.
function Page() {
  const commentsPromise = loadComments();
  return <Suspense fallback={<CommentsSkeleton />}>
    <Comments promise={commentsPromise} />
  </Suspense>;
}

// Client Component may read the streamed promise.
"use client";
function Comments({ promise }) {
  const comments = use(promise);
  return comments.map(comment => <p key={comment.id}>{comment.body}</p>);
}`;

  if (title.startsWith("useActionState,")) return `import { useActionState, useOptimistic } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Sending…" : "Send"}</button>;
}

function CommentForm({ comments, saveComment }) {
  const [state, action] = useActionState(saveComment, { error: null });
  const [optimistic, addOptimistic] = useOptimistic(comments,
    (items, body) => [...items, { id: "pending", body, pending: true }]);

  async function submit(formData) {
    addOptimistic(formData.get("body"));
    return action(formData);
  }

  return <><CommentList comments={optimistic} />
    <form action={submit}><textarea name="body" required />
      <SubmitButton />{state.error && <p role="alert">{state.error}</p>}</form></>;
}`;

  if (title.startsWith("Controlled and uncontrolled")) return `function ProfileForm() {
  const [name, setName] = useState(""); // controlled

  function submit(formData) {
    const avatar = formData.get("avatar"); // file input remains uncontrolled
    saveProfile({ name, avatar });
  }

  return <form action={submit}>
    <label>Name <input name="name" value={name}
      onChange={event => setName(event.target.value)} required /></label>
    <label>Avatar <input name="avatar" type="file" accept="image/*" /></label>
    <button>Save</button>
  </form>;
}`;

  if (title.startsWith("Suspense,")) return `const AnalyticsPanel = lazy(() => import("./AnalyticsPanel.js"));

function Dashboard() {
  return <ErrorBoundary fallback={<PanelError />}>
    <Suspense fallback={<PanelSkeleton />}>
      <AnalyticsPanel />
    </Suspense>
  </ErrorBoundary>;
}

// Start module work on intent, before the click commits navigation.
button.addEventListener("pointerenter", () => import("./AnalyticsPanel.js"), { once: true });`;

  if (title.startsWith("Portals,")) return `function Modal({ title, onClose, children }) {
  const headingId = useId();
  useEffect(() => {
    const before = document.activeElement;
    function keydown(event) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); before?.focus(); };
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>{children}
    </div>, document.body
  );
}`;

  if (title.startsWith("Server Components,")) return `// Server Component: data access and markdown library stay off the client.
async function ArticlePage({ id }) {
  const article = await db.articles.find(id);
  const html = sanitizeHtml(marked(article.body));
  return <article>
    <div dangerouslySetInnerHTML={{ __html: html }} />
    <LikeButton articleId={id} initialLikes={article.likes} />
  </article>;
}

// LikeButton.js
"use client";
function LikeButton({ articleId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  return <button onClick={() => setLikes(value => value + 1)}>{likes}</button>;
}`;

  if (title.startsWith("Server Functions,")) return `"use server";
export async function updateProject(previous, formData) {
  const session = await requireSession();
  const input = ProjectUpdate.safeParse(Object.fromEntries(formData));
  if (!input.success) return { ok: false, errors: input.error.flatten() };

  const project = await db.projects.find(input.data.id);
  if (!project || project.ownerId !== session.userId) return { ok: false, errors: { form: "Not found" } };

  await db.projects.update(project.id, input.data, { idempotencyKey: formData.get("requestId") });
  return { ok: true, errors: null };
}`;

  if (title.startsWith("React security,")) return `function RichText({ untrustedHtml, href }) {
  const safeHtml = sanitizeHtml(untrustedHtml, {
    allowedTags: ["p", "strong", "em", "a"],
    allowedAttributes: { a: ["href", "rel"] },
    allowedSchemes: ["https", "mailto"]
  });
  const safeHref = new URL(href, location.origin);
  if (!["http:", "https:"].includes(safeHref.protocol)) throw new Error("Unsafe URL");

  return <><div dangerouslySetInnerHTML={{ __html: safeHtml }} />
    <a href={safeHref.href} rel="noreferrer">Continue</a></>;
}`;

  if (title.startsWith("Class components,")) return `class ConnectionPanel extends Component {
  state = { status: "idle" };
  componentDidMount() { this.synchronize(); }
  componentDidUpdate(previous) {
    if (previous.roomId !== this.props.roomId) this.synchronize();
  }
  componentWillUnmount() { this.connection?.disconnect(); }
  synchronize() {
    this.connection?.disconnect();
    this.connection = createConnection(this.props.roomId);
    this.connection.connect();
  }
  render() { return <output>{this.state.status}</output>; }
}

// Migration target: one useEffect keyed by roomId with cleanup.`;

  return fallback;
}

function fastApiCodeFor(title, fallback) {
  if (title.startsWith("FastAPI setup")) return `# app/main.py
from fastapi import FastAPI

app = FastAPI(title="Interview Evidence API", version="1.0.0")

@app.get("/health", tags=["operations"])
async def health() -> dict[str, str]:
    return {"status": "ok"}

# Development: fastapi dev app/main.py
# Production:  fastapi run app/main.py --port 8000
# Inspect:     curl -s http://127.0.0.1:8000/openapi.json`;

  if (title.startsWith("ASGI scope")) return `# A complete minimal ASGI HTTP application.
async def app(scope, receive, send):
    assert scope["type"] == "http"
    event = await receive()
    assert event["type"] == "http.request"

    body = b'{"status":"ok"}'
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [(b"content-type", b"application/json")],
    })
    await send({"type": "http.response.body", "body": body})

# Trace scope → receive events → middleware → route → send events.`;

  if (title.startsWith("FastAPI application configuration")) return `from fastapi import FastAPI
from fastapi.routing import APIRoute

app = FastAPI(
    title="Projects API",
    summary="A stable contract for project operations",
    version="2.1.0",
    docs_url="/documentation",
    redoc_url=None,
    openapi_tags=[{"name": "projects", "description": "Project lifecycle"}],
)

def use_route_name_as_operation_id(application: FastAPI) -> None:
    for route in application.routes:
        if isinstance(route, APIRoute):
            route.operation_id = route.name

use_route_name_as_operation_id(app)`;

  if (title.startsWith("Path operations")) return `from fastapi import FastAPI, Response, status

app = FastAPI()

@app.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(command: ProjectCreate, response: Response) -> ProjectRead:
    project, created = await service.put(command)
    response.status_code = 201 if created else 200
    response.headers["Location"] = "/projects/" + str(project.id)
    return ProjectRead.model_validate(project)

# Register fixed paths before dynamic ones when both could match.
@app.get("/projects/me")
async def my_projects(): ...

@app.get("/projects/{project_id}")
async def read_project(project_id: UUID): ...`;

  if (title.startsWith("Path parameters")) return `from datetime import date
from enum import Enum
from typing import Annotated
from uuid import UUID
from fastapi import Path

class ProjectKind(str, Enum):
    personal = "personal"
    team = "team"

@app.get("/tenants/{tenant_id}/projects/{project_id}")
async def read_project(
    tenant_id: Annotated[UUID, Path(description="Tenant boundary")],
    project_id: Annotated[int, Path(gt=0, le=2_147_483_647)],
    kind: ProjectKind,
    as_of: date | None = None,
):
    return await service.get(tenant_id, project_id, kind, as_of)`;

  if (title.startsWith("Query parameters")) return `from typing import Annotated, Literal
from fastapi import Cookie, Header, Query
from pydantic import BaseModel, Field

class ProjectFilter(BaseModel):
    model_config = {"extra": "forbid"}
    limit: int = Field(50, gt=0, le=100)
    offset: int = Field(0, ge=0)
    order: Literal["created_at", "updated_at"] = "created_at"
    tags: list[str] = []

@app.get("/projects")
async def list_projects(
    filters: Annotated[ProjectFilter, Query()],
    request_id: Annotated[str | None, Header(alias="X-Request-ID")] = None,
    session: Annotated[str | None, Cookie()] = None,
):
    return await service.list(filters, request_id, session)`;

  if (title.startsWith("Pydantic request bodies")) return `from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

class CardPayment(BaseModel):
    kind: Literal["card"]
    token: str = Field(min_length=20)

class InvoicePayment(BaseModel):
    kind: Literal["invoice"]
    purchase_order: str

Payment = Annotated[CardPayment | InvoicePayment, Field(discriminator="kind")]

class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    quantity: int = Field(gt=0, le=100)
    unit_price_cents: int = Field(gt=0)
    payment: Payment

    @model_validator(mode="after")
    def total_is_bounded(self):
        if self.quantity * self.unit_price_cents > 10_000_000:
            raise ValueError("order total exceeds limit")
        return self`;

  if (title.startsWith("Forms, files")) return `from typing import Annotated
from fastapi import File, Form, HTTPException, UploadFile

MAX_BYTES = 5 * 1024 * 1024

@app.post("/avatars", status_code=201)
async def upload_avatar(
    owner_id: Annotated[UUID, Form()],
    image: Annotated[UploadFile, File(description="JPEG or PNG")],
):
    if image.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(415, "unsupported media type")
    content = await image.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(413, "file too large")
    await image.close()
    verified = verify_image_signature(content)
    return await storage.save(owner_id, verified)`;

  if (title.startsWith("Response models")) return `from pydantic import BaseModel, ConfigDict

class UserRecord(BaseModel):
    id: UUID
    email: str
    password_hash: str
    internal_flags: list[str]

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str

@app.get("/users/{user_id}", response_model=UserPublic)
async def read_user(user_id: UUID) -> UserRecord:
    # Response validation and filtering prevent private fields from leaving.
    return await repository.get_required(user_id)`;

  if (title.startsWith("Response classes")) return `from collections.abc import AsyncIterator
from fastapi import Response
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse

async def csv_rows() -> AsyncIterator[bytes]:
    yield b"id,name\\n"
    async for project in repository.iter_projects(batch_size=100):
        yield (str(project.id) + "," + project.name + "\\n").encode()

@app.get("/exports/projects")
async def export_projects() -> StreamingResponse:
    return StreamingResponse(
        csv_rows(), media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="projects.csv"'},
    )

@app.get("/latest", response_class=RedirectResponse)
async def latest(): return "/reports/current"`;

  if (title.startsWith("HTTPException")) return `from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={
        "type": "https://api.example.com/problems/validation",
        "title": "Request validation failed",
        "status": 422,
        "instance": str(request.url.path),
        "request_id": request.state.request_id,
        "errors": exc.errors(),
    })

@app.exception_handler(ProjectNotFound)
async def project_missing(request: Request, exc: ProjectNotFound):
    return JSONResponse(status_code=404, content={"title": "Project not found", "status": 404})`;

  if (title.startsWith("Request and Response")) return `from fastapi import Request, Response

@app.get("/diagnostics")
async def diagnostics(request: Request, response: Response):
    if await request.is_disconnected():
        return Response(status_code=499)
    response.headers["X-Request-ID"] = request.state.request_id
    return {
        "method": request.method,
        "path": request.url.path,
        "client": request.client.host if request.client else None,
        "root_path": request.scope.get("root_path"),
    }`;

  if (title.startsWith("Depends,")) return `from typing import Annotated
from fastapi import Depends, Header

async def current_tenant(x_tenant_id: Annotated[UUID, Header()]) -> Tenant:
    return await tenants.get_required(x_tenant_id)

async def project_service(
    tenant: Annotated[Tenant, Depends(current_tenant)],
    repository: Annotated[ProjectRepository, Depends(project_repository)],
) -> ProjectService:
    return ProjectService(tenant=tenant, repository=repository)

TenantDep = Annotated[Tenant, Depends(current_tenant)]
ServiceDep = Annotated[ProjectService, Depends(project_service)]

@app.get("/projects")
async def projects(service: ServiceDep):
    return await service.list()`;

  if (title.startsWith("Yield dependencies")) return `from collections.abc import AsyncIterator
from typing import Annotated
from fastapi import Depends

async def session() -> AsyncIterator[AsyncSession]:
    async with session_factory() as value:
        try:
            yield value
        except Exception:
            await value.rollback()
            raise

async def unit_of_work(
    db: Annotated[AsyncSession, Depends(session)],
) -> AsyncIterator[UnitOfWork]:
    uow = UnitOfWork(db)
    yield uow
    await uow.commit()

UowDep = Annotated[UnitOfWork, Depends(unit_of_work, scope="function")]`;

  if (title.startsWith("Callable dependencies")) return `class RequiresScope:
    def __init__(self, required: str):
        self.required = required

    async def __call__(self, principal: PrincipalDep) -> Principal:
        if self.required not in principal.scopes:
            raise HTTPException(status_code=403, detail="insufficient scope")
        return principal

can_write = RequiresScope("projects:write")

router = APIRouter(
    prefix="/projects",
    dependencies=[Depends(require_request_id)],
)

@router.post("", dependencies=[Depends(can_write)])
async def create(command: ProjectCreate, service: ServiceDep): ...

# Test isolation: app.dependency_overrides[current_principal] = fake_principal`;

  if (title.startsWith("Settings,")) return `from functools import lru_cache
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")
    environment: str = "development"
    database_url: SecretStr
    allowed_origins: list[str] = []
    token_issuer: str

@lru_cache
def get_settings() -> Settings:
    return Settings()  # validated once per worker process

SettingsDep = Annotated[Settings, Depends(get_settings)]`;

  if (title.startsWith("Lifespan,")) return `from contextlib import asynccontextmanager
from fastapi import FastAPI
from httpx import AsyncClient

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_async_engine(settings.database_url)
    http = AsyncClient(timeout=5.0)
    try:
        await verify_database(engine)
        app.state.engine = engine
        app.state.http = http
        yield
    finally:
        await http.aclose()
        await engine.dispose()

app = FastAPI(lifespan=lifespan)`;

  if (title.startsWith("async def,")) return `@app.get("/async-io")
async def async_io():
    return await async_http_client.get("https://upstream.test/data")

@app.get("/sync-library")
def sync_library():
    # FastAPI offloads a normal def path operation to a thread pool.
    return blocking_client.get("https://upstream.test/data").json()

@app.get("/broken")
async def broken():
    # Never block the event loop like this:
    # time.sleep(2)
    # CPU-heavy work belongs in a worker process or job system.
    return {"event_loop": "healthy"}`;

  if (title.startsWith("Cancellation,")) return `import anyio

async def load_dashboard(project_id: UUID) -> Dashboard:
    results: dict[str, object] = {}

    async def capture(name: str, operation):
        results[name] = await operation(project_id)

    with anyio.fail_after(2.0):
        async with anyio.create_task_group() as group:
            group.start_soon(capture, "project", projects.get)
            group.start_soon(capture, "activity", activity.list)
            group.start_soon(capture, "permissions", permissions.for_project)

    return Dashboard.model_validate(results)

# Cancellation propagates through the task group and each awaited operation.`;

  if (title.startsWith("Async SQLAlchemy")) return `from collections.abc import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=5,
    pool_timeout=3,
    pool_pre_ping=True,
)
session_factory = async_sessionmaker(engine, expire_on_commit=False)

async def db_session() -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session

@app.get("/projects/{project_id}")
async def project(project_id: UUID, db: Annotated[AsyncSession, Depends(db_session)]):
    value = await db.scalar(select(Project).where(Project.id == project_id))
    if value is None: raise HTTPException(404)
    return value`;

  if (title.startsWith("Transactions,")) return `class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_project(self, command: CreateProject) -> Project:
        async with self.session.begin():
            project = Project.from_command(command)
            self.session.add(project)
            self.session.add(OutboxMessage.for_event(project.created_event()))
            await self.session.flush()  # obtains IDs; transaction is not committed yet
        return project

async def execute_with_retry(operation, attempts: int = 3):
    for attempt in range(attempts):
        try: return await operation()
        except SerializationError:
            if attempt == attempts - 1: raise
            await anyio.sleep(0.05 * (2 ** attempt))`;

  if (title.startsWith("BackgroundTasks")) return `from fastapi import BackgroundTasks, Header

@app.post("/commands", status_code=202)
async def accept_command(
    command: Command,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key")],
    db: DbDep,
):
    async with db.begin():
        existing = await commands.by_key(idempotency_key, db)
        if existing: return existing.receipt
        job = Job.from_command(command, idempotency_key)
        db.add_all([job, OutboxMessage.for_job(job)])
    return {"job_id": job.id, "status": "accepted"}

# BackgroundTasks is appropriate only for small, non-durable post-response work.
# Durable workers claim and acknowledge the outbox message separately.`;

  if (title.startsWith("OAuth2,")) return `from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/token")

@app.post("/auth/token", response_model=Token)
async def issue_token(form: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await users.by_username(form.username)
    if user is None or not password_hasher.verify(form.password, user.password_hash):
        raise HTTPException(401, "invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    now = datetime.now(timezone.utc)
    claims = {"sub": str(user.id), "iss": settings.issuer, "iat": now,
              "exp": now + timedelta(minutes=15), "aud": "projects-api"}
    return Token(access_token=jwt.encode(claims, signing_key, algorithm="EdDSA"))

async def principal(token: Annotated[str, Depends(oauth2)]) -> Principal:
    claims = jwt.decode(token, verify_key, audience="projects-api", issuer=settings.issuer)
    return await users.principal(UUID(claims["sub"]))`;

  if (title.startsWith("Cookie sessions")) return `from secrets import compare_digest
from fastapi import Cookie, Form, Response

@app.post("/session")
async def login(credentials: Login, response: Response):
    user = await authenticate_password(credentials)
    session, csrf = await sessions.create(user.id, rotate=True)
    response.set_cookie("session", session.token, httponly=True, secure=True,
        samesite="lax", max_age=1800, path="/")
    response.set_cookie("csrf", csrf, httponly=False, secure=True,
        samesite="lax", max_age=1800, path="/")
    return {"user_id": user.id}

async def require_csrf(
    csrf_cookie: Annotated[str, Cookie(alias="csrf")],
    csrf_form: Annotated[str, Form(alias="csrf")],
):
    if not compare_digest(csrf_cookie, csrf_form):
        raise HTTPException(403, "invalid CSRF token")`;

  if (title.startsWith("Security scopes")) return `from fastapi import Security
from fastapi.security import SecurityScopes

oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    scopes={"projects:read": "Read projects", "projects:write": "Modify projects"},
)

async def authorized_principal(
    required: SecurityScopes,
    token: Annotated[str, Depends(oauth2)],
) -> Principal:
    principal = await authenticate(token)
    missing = set(required.scopes) - principal.scopes
    if missing: raise HTTPException(403, "insufficient scope")
    return principal

@app.get("/tenants/{tenant_id}/projects/{project_id}")
async def project(tenant_id: UUID, project_id: UUID,
    principal: Annotated[Principal, Security(authorized_principal, scopes=["projects:read"])]):
    return await service.get_authorized(principal, tenant_id, project_id)`;

  if (title.startsWith("CORS,")) return `from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.example.com"])
app.add_middleware(HTTPSRedirectMiddleware)

# Trust proxy headers only from infrastructure you control:
# fastapi run app/main.py --proxy-headers --forwarded-allow-ips=10.0.0.10`;

  if (title.startsWith("HTTP middleware")) return `class RequestContextMiddleware:
    def __init__(self, app): self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] not in {"http", "websocket"}:
            return await self.app(scope, receive, send)
        headers = Headers(scope=scope)
        request_id = headers.get("x-request-id") or uuid4().hex
        token = request_id_var.set(request_id)

        async def send_with_id(message):
            if message["type"] == "http.response.start":
                MutableHeaders(scope=message).append("X-Request-ID", request_id)
            await send(message)

        try: await self.app(scope, receive, send_with_id)
        finally: request_id_var.reset(token)

app.add_middleware(RequestContextMiddleware)`;

  if (title.startsWith("API security hardening")) return `@app.middleware("http")
async def enforce_request_budget(request: Request, call_next):
    content_length = int(request.headers.get("content-length", "0"))
    if content_length > settings.max_body_bytes:
        return JSONResponse({"title": "Payload too large"}, status_code=413)

    principal_key = request.client.host if request.client else "unknown"
    allowed, retry_after = await limiter.consume(principal_key, request.url.path)
    if not allowed:
        return JSONResponse({"title": "Rate limit exceeded"}, status_code=429,
            headers={"Retry-After": str(retry_after)})

    response = await call_next(request)
    response.headers.update({
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store" if request.url.path.startswith("/auth") else "private",
    })
    return response

# Enforce global byte/time/concurrency limits at the trusted proxy too.`;

  if (title.startsWith("OpenAPI schemas")) return `from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
        summary="Stable public project contract",
    )
    schema["info"]["x-logo"] = {"url": "https://example.com/logo.svg"}
    schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http", "scheme": "bearer", "bearerFormat": "JWT"
    }
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi

# CI: generate openapi.json, diff it, and fail on unapproved breaking changes.`;

  if (title.startsWith("OpenAPI callbacks")) return `class Event(BaseModel):
    id: UUID
    type: Literal["project.created"]
    occurred_at: datetime
    data: ProjectRead

@app.webhooks.post("project-created")
async def project_created(body: Event):
    """Document the event sent to registered subscriber URLs."""

async def deliver(subscription: Subscription, event: Event):
    body = event.model_dump_json().encode()
    signature = hmac.new(subscription.secret, body, sha256).hexdigest()
    await client.post(subscription.url, content=body, headers={
        "Content-Type": "application/json",
        "X-Event-ID": str(event.id),
        "X-Signature-SHA256": signature,
    })

# The receiver stores Event.id before applying effects to tolerate duplicates.`;

  if (title.startsWith("APIRouter,")) return `# app/projects/router.py
router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/{project_id}", response_model=ProjectRead)
async def read_project(project_id: UUID, service: ServiceDep): ...

# app/main.py
app = FastAPI(root_path="/api/v1")
app.include_router(projects.router)
app.include_router(auth.router, prefix="/auth")
app.mount("/assets", StaticFiles(directory="static"), name="assets")

internal = FastAPI(docs_url=None)
internal.include_router(operations.router)
app.mount("/_internal", internal)

# include_router copies routes into one app; mount delegates to another ASGI app.`;

  if (title.startsWith("WebSockets,")) return `from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/rooms/{room_id}")
async def room_socket(websocket: WebSocket, room_id: UUID, principal: WsPrincipalDep):
    await websocket.accept()
    outbound = anyio.create_memory_object_stream[dict](max_buffer_size=50)
    await manager.join(room_id, principal, outbound[0])
    try:
        async with anyio.create_task_group() as group:
            group.start_soon(send_messages, websocket, outbound[1])
            while True:
                message = ClientMessage.model_validate(await websocket.receive_json())
                await manager.publish(room_id, principal, message)
    except WebSocketDisconnect:
        pass
    finally:
        await manager.leave(room_id, principal)`;

  if (title.startsWith("Server-sent events")) return `from fastapi.responses import StreamingResponse

async def event_stream(request: Request, project_id: UUID):
    async with events.subscribe(project_id) as subscription:
        while not await request.is_disconnected():
            with anyio.move_on_after(15) as heartbeat:
                event = await subscription.receive()
                yield "id: " + str(event.id) + "\\nevent: " + event.type + "\\ndata: " + event.json + "\\n\\n"
            if heartbeat.cancel_called:
                yield ": heartbeat\\n\\n"

@app.get("/projects/{project_id}/events")
async def stream_events(request: Request, project_id: UUID):
    return StreamingResponse(event_stream(request, project_id), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})`;

  if (title.startsWith("Static files,")) return `from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from strawberry.fastapi import GraphQLRouter

templates = Jinja2Templates(directory="templates", autoescape=True)
app.mount("/assets", StaticFiles(directory="static", html=False), name="assets")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {
        "asset_version": settings.asset_hash,
        "content_security_policy_nonce": request.state.csp_nonce,
    })

graphql = GraphQLRouter(schema, context_getter=graphql_context)
app.include_router(graphql, prefix="/graphql")

# Reuse identity services, but keep GraphQL authorization explicit per resolver.`;

  if (title.startsWith("TestClient,")) return `from fastapi.testclient import TestClient

def test_project_requires_permission(app):
    async def fake_principal():
        return Principal(id=TEST_USER, scopes=set(), tenant_id=TEST_TENANT)

    app.dependency_overrides[current_principal] = fake_principal
    try:
        with TestClient(app, raise_server_exceptions=True) as client:
            response = client.get("/projects/" + str(TEST_PROJECT))
        assert response.status_code == 403
        assert response.json()["title"] == "Forbidden"
    finally:
        app.dependency_overrides.clear()

# The context manager runs application lifespan around the test.`;

  if (title.startsWith("Async integration tests")) return `import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

@pytest.mark.anyio
async def test_concurrent_idempotent_create(app, migrated_database):
    async with LifespanManager(app):
        transport = ASGITransport(app=app, raise_app_exceptions=True)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"Idempotency-Key": "same-command"}
            first, second = await asyncio.gather(
                client.post("/projects", json=COMMAND, headers=headers),
                client.post("/projects", json=COMMAND, headers=headers),
            )
    assert first.status_code in {200, 201}
    assert second.status_code in {200, 201}
    assert first.json()["id"] == second.json()["id"]`;

  if (title.startsWith("Structured logging")) return `@app.middleware("http")
async def observe_request(request: Request, call_next):
    started = time.perf_counter()
    with tracer.start_as_current_span("http.request") as span:
        span.set_attribute("http.request.method", request.method)
        span.set_attribute("http.route", request.scope.get("route").path)
        try:
            response = await call_next(request)
            return response
        except Exception:
            request_errors.add(1, {"route": request.scope.get("route").path})
            raise
        finally:
            request_duration.record(time.perf_counter() - started,
                {"route": request.scope.get("route").path, "method": request.method})
            logger.info("request.completed", request_id=request.state.request_id)

@app.get("/health/live", include_in_schema=False)
async def live(): return {"status": "alive"}

@app.get("/health/ready", include_in_schema=False)
async def ready(): return await readiness.check_required_dependencies()`;

  if (title.startsWith("Performance profiling")) return `# Measure the representative application path, not a hello-world route.
async def benchmark(client: AsyncClient, requests: int, concurrency: int):
    limiter = anyio.CapacityLimiter(concurrency)
    latencies = []

    async def one_request():
        async with limiter:
            started = time.perf_counter()
            response = await client.get("/projects?limit=50")
            response.raise_for_status()
            latencies.append(time.perf_counter() - started)

    async with anyio.create_task_group() as group:
        for _ in range(requests): group.start_soon(one_request)
    return percentile(latencies, 50), percentile(latencies, 95), percentile(latencies, 99)

# Correlate latency with event-loop delay, CPU profile, pool waits, query traces,
# response size, validation cost, worker queueing, memory, and error rate.`;

  if (title.startsWith("Containers,")) return `# Dockerfile
FROM python:3.14-slim AS runtime
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --chown=app:app requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY --chown=app:app app ./app
USER app
EXPOSE 8000
CMD ["fastapi", "run", "app/main.py", "--port", "8000", "--proxy-headers"]

# Orchestrator contract:
# - run migrations once before replicas become ready
# - GET /health/live checks the process
# - GET /health/ready checks required dependencies
# - send SIGTERM, stop new traffic, drain, then enforce a grace deadline`;

  if (title.startsWith("API versioning")) return `v1 = APIRouter(prefix="/v1")

@v1.get("/projects/{project_id}", response_model=ProjectV1,
    deprecated=True, responses={200: {"headers": {
        "Deprecation": {"schema": {"type": "string"}},
        "Sunset": {"schema": {"type": "string"}},
    }}})
async def project_v1(project_id: UUID, response: Response):
    response.headers["Deprecation"] = "true"
    response.headers["Sunset"] = "Wed, 01 Jul 2027 00:00:00 GMT"
    return ProjectV1.from_domain(await projects.get(project_id))

@app.get("/v2/projects/{project_id}", response_model=ProjectV2)
async def project_v2(project_id: UUID):
    return ProjectV2.from_domain(await projects.get(project_id))

# CI compares OpenAPI schemas and consumer contracts before rollout.`;

  if (title.startsWith("Custom APIRoute")) return `from fastapi.routing import APIRoute

class TimedRoute(APIRoute):
    def get_route_handler(self):
        original = super().get_route_handler()

        async def timed(request: Request) -> Response:
            started = time.perf_counter()
            try:
                return await original(request)
            finally:
                duration = time.perf_counter() - started
                route_latency.observe(duration, {"route": self.path, "method": request.method})

        return timed

router = APIRouter(route_class=TimedRoute)

# Prefer dependencies for endpoint requirements and middleware for app-wide policy.`;

  if (title.startsWith("FastAPI production architecture capstone")) return `# Transport stays thin; application service owns the use case.
@router.post("/projects", response_model=ProjectRead, status_code=201)
async def create_project(
    command: ProjectCreate,
    principal: WritePrincipalDep,
    service: ProjectServiceDep,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key")],
):
    return await service.create(principal, command, idempotency_key)

class ProjectService:
    async def create(self, principal, command, key):
        async with self.uow_factory() as uow:
            await uow.idempotency.claim(principal.tenant_id, key)
            project = Project.create(principal.tenant_id, command)
            await uow.projects.add(project)
            await uow.outbox.add(ProjectCreated.from_project(project))
            await uow.commit()
        return project

# Evidence: OpenAPI compatibility gate, authorization matrix, transaction tests,
# queue replay, traces, load profile, container SBOM, deployment and incident runbook.`;

  return fallback;
}

function pythonCodeFor(title, fallback) {
  if (title.startsWith("Python setup")) return `# Run with: python -X dev inspect_runtime.py
import dis
import importlib.util
import sys

def total(values: list[int]) -> int:
    return sum(values)

print({"python": sys.version, "executable": sys.executable})
print({"prefix": sys.prefix, "base_prefix": sys.base_prefix})
print({"module": importlib.util.find_spec("json").origin})
dis.dis(total)  # source was compiled to instructions for this interpreter

# Environment evidence:
# python -m venv .venv
# .venv/bin/python -m pip list
# .venv/bin/python -c "import sys; print(sys.executable)"`;

  if (title.startsWith("Execution model")) return `import inspect

rate = 10

def multiplier(factor: int):
    calls = 0
    def apply(value: int) -> int:
        nonlocal calls
        calls += 1
        frame = inspect.currentframe()
        print({"locals": frame.f_locals, "globals_rate": frame.f_globals["rate"]})
        return value * factor
    return apply

double = multiplier(2)
assert double(4) == 8
assert double.__closure__[0].cell_contents in (1, 2)

# Assignment makes a name local for the whole code block:
def broken():
    print(rate)
    rate = 20  # UnboundLocalError before this line executes`;

  if (title.startsWith("Objects, identity")) return `from copy import copy, deepcopy

original = {"members": [{"name": "Ada"}]}
alias = original
shallow = copy(original)
deep = deepcopy(original)

original["members"][0]["name"] = "Grace"

assert alias is original
assert shallow is not original
assert shallow["members"] is original["members"]
assert deep["members"] is not original["members"]
assert original == shallow

def append_member(members=None):
    members = [] if members is None else members
    members.append("new")
    return members`;

  if (title.startsWith("Numbers, booleans")) return `from decimal import Decimal, ROUND_HALF_EVEN, localcontext
from fractions import Fraction
import math

assert 0.1 + 0.2 != 0.3
assert math.isclose(0.1 + 0.2, 0.3)
assert Fraction(1, 10) + Fraction(2, 10) == Fraction(3, 10)

with localcontext() as context:
    context.prec = 28
    subtotal = Decimal("19.99") * 3
    tax = subtotal * Decimal("0.0825")
    total = (subtotal + tax).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

assert isinstance(True, int)
assert total == Decimal("64.92")`;

  if (title.startsWith("Strings, Unicode")) return `import unicodedata

wire = "café ☕".encode("utf-8")
text = wire.decode("utf-8")
assert isinstance(text, str) and isinstance(wire, bytes)

composed = "é"
decomposed = "e\\u0301"
assert composed != decomposed
assert unicodedata.normalize("NFC", composed) == unicodedata.normalize("NFC", decomposed)

def decode_payload(payload: bytes) -> str:
    # Boundary policy is explicit: reject malformed UTF-8.
    return unicodedata.normalize("NFC", payload.decode("utf-8", errors="strict"))

buffer = bytearray(wire)
buffer[-1:] = b"!"  # mutable binary data`;

  if (title.startsWith("Lists, tuples")) return `from collections import deque
from copy import deepcopy
from timeit import timeit

rows = [[0] * 3 for _ in range(3)]
broken = [[0] * 3] * 3
broken[0][0] = 1
assert broken[1][0] == 1  # three references to the same inner list

head, *middle, tail = range(8)
assert (head, middle, tail) == (0, [1, 2, 3, 4, 5, 6], 7)

queue = deque()
queue.append("job")
assert queue.popleft() == "job"

print("append:", timeit("x.append(1)", setup="x=[]", number=100_000))
print("front insert:", timeit("x.insert(0, 1)", setup="x=[]", number=10_000))`;

  if (title.startsWith("Dictionaries, sets")) return `from dataclasses import dataclass

@dataclass(frozen=True)
class TenantProject:
    tenant_id: str
    project_id: str

owners = {
    TenantProject("t-1", "p-1"): "Ada",
    TenantProject("t-1", "p-2"): "Grace",
}
assert owners[TenantProject("t-1", "p-1")] == "Ada"

# Equal values must have equal hashes.
a = TenantProject("t-1", "p-1")
b = TenantProject("t-1", "p-1")
assert a == b and hash(a) == hash(b)

permissions = {"read", "write"}
assert {"read"} <= permissions
ordered = {"first": 1, "second": 2}
assert list(ordered) == ["first", "second"]`;

  if (title.startsWith("Control flow")) return `from dataclasses import dataclass

@dataclass(frozen=True)
class Create:
    name: str

def execute(command):
    match command:
        case {"type": "create", "name": str(name)} if name.strip():
            return Create(name.strip())
        case ["sum", *raw_values]:
            return sum(int(value) for value in raw_values)
        case {"type": unknown}:
            raise ValueError(f"unknown command: {unknown}")
        case _:
            raise TypeError("unsupported command shape")

assert execute({"type": "create", "name": "  demo "}) == Create("demo")
assert execute(["sum", "2", "3"]) == 5`;

  if (title.startsWith("Functions, parameters")) return `from inspect import signature
from typing import Final

_MISSING: Final = object()

def search(
    query: str,
    /,
    *filters: str,
    limit: int = 20,
    cursor: str | None = None,
    **metadata: str,
) -> dict[str, object]:
    return {"query": query, "filters": filters, "limit": limit,
            "cursor": cursor, "metadata": metadata}

def remember(value, cache=_MISSING):
    cache = {} if cache is _MISSING else cache
    cache[value] = True
    return cache

print(signature(search))
assert search("python", "senior", limit=10, region="EU")["limit"] == 10`;

  if (title.startsWith("First-class functions")) return `from functools import partial
from typing import Callable

def minimum_length(size: int, value: str) -> str:
    if len(value) < size:
        raise ValueError(f"expected at least {size} characters")
    return value

username = partial(minimum_length, 3)

class Between:
    def __init__(self, low: int, high: int):
        self.low, self.high = low, high
    def __call__(self, value: int) -> int:
        if not self.low <= value <= self.high:
            raise ValueError("outside range")
        return value

validators: list[Callable] = [username, Between(1, 100)]
assert validators[0]("ada") == "ada"
assert validators[1](42) == 42`;

  if (title.startsWith("Exceptions, chaining")) return `class RepositoryError(Exception):
    pass

class ProjectUnavailable(Exception):
    def __init__(self, project_id: str):
        super().__init__(f"project {project_id} is unavailable")
        self.add_note("safe_to_retry=true")

def load_project(project_id: str):
    try:
        return repository.fetch(project_id)
    except RepositoryError as error:
        raise ProjectUnavailable(project_id) from error

try:
    raise ExceptionGroup("parallel reads failed", [
        TimeoutError("profile timed out"),
        ValueError("project was malformed"),
    ])
except* TimeoutError as timeouts:
    print("retryable", timeouts.exceptions)
except* ValueError as invalid:
    print("invalid", invalid.exceptions)`;

  if (title.startsWith("Modules, packages")) return `# src/projects/__init__.py
from .service import ProjectService

__all__ = ["ProjectService"]

# inspect_import.py
import importlib
import sys

first = importlib.import_module("projects")
second = importlib.import_module("projects")
assert first is second is sys.modules["projects"]
print({
    "name": first.__name__,
    "package": first.__package__,
    "spec": first.__spec__,
    "loader": type(first.__spec__.loader).__name__,
})

# Avoid circular imports by moving shared contracts inward and wiring
# concrete adapters in one composition-root module.`;

  if (title.startsWith("Classes, instances")) return `class Project:
    category = "portfolio"

    def __new__(cls, *args, **kwargs):
        instance = super().__new__(cls)
        return instance

    def __init__(self, name: str):
        self.name = name

    @classmethod
    def from_mapping(cls, value: dict[str, str]) -> "Project":
        return cls(value["name"].strip())

    @staticmethod
    def valid_name(value: str) -> bool:
        return bool(value.strip())

project = Project.from_mapping({"name": " Agent Lab "})
assert project.name == "Agent Lab"
assert project.valid_name("x")
assert project.__dict__ == {"name": "Agent Lab"}
assert Project.__dict__["from_mapping"].__func__ is not None`;

  if (title.startsWith("Inheritance, composition")) return `from abc import ABC, abstractmethod

class Saver(ABC):
    @abstractmethod
    def save(self, value: str) -> None: ...

class LoggingMixin:
    def save(self, value: str) -> None:
        print("saving", value)
        super().save(value)

class MemorySaver(Saver):
    def __init__(self):
        self.values = []
    def save(self, value: str) -> None:
        self.values.append(value)

class LoggedMemorySaver(LoggingMixin, MemorySaver):
    pass

saver = LoggedMemorySaver()
saver.save("evidence")
assert saver.values == ["evidence"]
print(LoggedMemorySaver.mro())`;

  if (title.startsWith("Data model, special")) return `from dataclasses import dataclass
from functools import total_ordering

@total_ordering
@dataclass(frozen=True)
class ScoreBoard:
    scores: tuple[int, ...]

    def __iter__(self):
        return iter(self.scores)
    def __len__(self):
        return len(self.scores)
    def __contains__(self, value):
        return value in self.scores
    def __lt__(self, other):
        if not isinstance(other, ScoreBoard):
            return NotImplemented
        return sum(self) < sum(other)
    def __repr__(self):
        return f"ScoreBoard(scores={self.scores!r})"

board = ScoreBoard((8, 13, 21))
assert len(board) == 3 and 13 in board and list(board) == [8, 13, 21]`;

  if (title.startsWith("Attribute lookup")) return `class Positive:
    def __set_name__(self, owner, name):
        self.name = name
    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return instance.__dict__[self.name]
    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive")
        instance.__dict__[self.name] = value

class Batch:
    size = Positive()  # data descriptor outranks instance lookup
    __slots__ = ("__dict__", "label")
    def __init__(self, label: str, size: int):
        self.label, self.size = label, size
    def __getattr__(self, name):
        if name == "summary":
            return f"{self.label}:{self.size}"
        raise AttributeError(name)

assert Batch("jobs", 3).summary == "jobs:3"`;

  if (title.startsWith("Dataclasses, named")) return `from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum

class Currency(StrEnum):
    USD = "USD"
    EUR = "EUR"

@dataclass(frozen=True, slots=True)
class Money:
    amount: Decimal
    currency: Currency
    tags: tuple[str, ...] = field(default_factory=tuple)

    def __post_init__(self):
        if self.amount.is_nan():
            raise ValueError("amount must be a number")

    def __add__(self, other: "Money") -> "Money":
        if self.currency is not other.currency:
            raise ValueError("currency mismatch")
        return Money(self.amount + other.amount, self.currency)

assert Money(Decimal("2"), Currency.USD) + Money(Decimal("3"), Currency.USD) == Money(Decimal("5"), Currency.USD)`;

  if (title.startsWith("Iterables, iterators")) return `from collections.abc import Iterable, Iterator

class Countdown(Iterable[int]):
    def __init__(self, start: int):
        self.start = start
    def __iter__(self) -> Iterator[int]:
        current = self.start
        while current:
            yield current
            current -= 1

iterator = iter(Countdown(3))
assert iterator is iter(iterator)
assert next(iterator) == 3
assert list(iterator) == [2, 1]
assert list(Countdown(3)) == [3, 2, 1]  # fresh iterator

values = iter(lambda: input("value (blank ends): "), "")
# iter(callable, sentinel) stops when the callable returns the sentinel.`;

  if (title.startsWith("Generators, yield")) return `from collections.abc import Generator, Iterable, Iterator

def managed_lines(path: str) -> Generator[str, None, int]:
    count = 0
    handle = open(path, encoding="utf-8")
    try:
        for line in handle:
            count += 1
            yield line.rstrip("\\n")
    finally:
        handle.close()
    return count

def flatten(groups: Iterable[Iterable[str]]) -> Iterator[str]:
    for group in groups:
        yield from group

generator = flatten([["a", "b"], ["c"]])
assert next(generator) == "a"
generator.close()  # injects GeneratorExit at suspension`;

  if (title.startsWith("Comprehensions, generator")) return `from itertools import batched, chain, islice
from tracemalloc import get_traced_memory, start

def normalized_events(lines):
    parsed = (line.strip().split(",", 1) for line in lines)
    valid = ((kind, value) for kind, value in parsed if kind and value)
    yield from ({"kind": kind, "value": value} for kind, value in valid)

start()
first_hundred = list(islice(normalized_events(source()), 100))
current, peak = get_traced_memory()
print({"items": len(first_hundred), "peak_bytes": peak})

for batch in batched(normalized_events(source()), 50):
    persist(batch)  # bounded batch, not an unbounded list`;

  if (title.startsWith("Decorators, wrappers")) return `from functools import wraps
from time import perf_counter
from typing import Callable, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

def timed(function: Callable[P, R]) -> Callable[P, R]:
    @wraps(function)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        started = perf_counter()
        try:
            return function(*args, **kwargs)
        finally:
            print({"function": function.__qualname__,
                   "elapsed_ms": (perf_counter() - started) * 1000})
    return wrapper

@timed
def parse(value: str) -> int:
    return int(value)

assert parse.__name__ == "parse" and parse("42") == 42`;

  if (title.startsWith("Context managers")) return `from contextlib import ExitStack, asynccontextmanager

def read_all(paths: list[str]) -> list[str]:
    with ExitStack() as stack:
        handles = [stack.enter_context(open(path, encoding="utf-8")) for path in paths]
        return [handle.read() for handle in handles]

@asynccontextmanager
async def connected(client):
    await client.connect()
    try:
        yield client
    finally:
        await client.close()

async def use_client(client):
    async with connected(client) as ready:
        return await ready.fetch()

# __exit__ receives exception details and returns truthy only to suppress it.`;

  if (title.startsWith("Type hints")) return `from typing import Literal, Never, TypeAlias

ProjectState: TypeAlias = Literal["draft", "active", "archived"]

def assert_never(value: Never) -> Never:
    raise AssertionError(f"unhandled value: {value!r}")

def label(state: ProjectState) -> str:
    match state:
        case "draft":
            return "Draft"
        case "active":
            return "Live"
        case "archived":
            return "Archived"
        case _:
            return assert_never(state)

def length(value: object) -> int:
    if isinstance(value, str):  # narrows object to str
        return len(value)
    raise TypeError("expected text")`;

  if (title.startsWith("Generics, type")) return `from collections.abc import Callable, Iterable
from typing import ParamSpec, Protocol, TypeVar

T_co = TypeVar("T_co", covariant=True)
P = ParamSpec("P")
R = TypeVar("R")

class Reader(Protocol[T_co]):
    def get(self, item_id: str) -> T_co: ...

def traced(function: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(function.__qualname__)
        return function(*args, **kwargs)
    return wrapper

def names(reader: Reader[str], ids: Iterable[str]) -> list[str]:
    return [reader.get(item_id) for item_id in ids]`;

  if (title.startsWith("Runtime validation")) return `from dataclasses import dataclass
from typing import Any

@dataclass(frozen=True)
class CreateProject:
    name: str
    member_ids: tuple[int, ...]

def parse_command(raw: Any) -> CreateProject:
    if not isinstance(raw, dict):
        raise ValueError("body must be an object")
    name = raw.get("name")
    members = raw.get("member_ids")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("name must be non-empty text")
    if not isinstance(members, list) or not all(type(item) is int for item in members):
        raise ValueError("member_ids must be integer list")
    return CreateProject(name.strip(), tuple(members))

# The annotation documents the trusted result; parse_command establishes it.`;

  if (title.startsWith("Standard library")) return `from datetime import UTC, datetime
from pathlib import Path
import json
import os
import tempfile

def atomic_json_write(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8",
                                     dir=path.parent, delete=False) as handle:
        json.dump(value, handle, ensure_ascii=False)
        handle.flush()
        os.fsync(handle.fileno())
        temporary = Path(handle.name)
    temporary.replace(path)

payload = {"observed_at": datetime.now(UTC).isoformat(), "name": "café"}
atomic_json_write(Path("state/project.json"), payload)`;

  if (title.startsWith("Regular expressions")) return `import os
import re
import signal
import subprocess

SAFE_ID = re.compile(r"\\A[a-z0-9_-]{1,40}\\Z")

def inspect_revision(revision: str) -> str:
    if not SAFE_ID.fullmatch(revision):
        raise ValueError("invalid revision")
    completed = subprocess.run(
        ["git", "show", "--stat", "--oneline", revision],
        text=True,
        capture_output=True,
        timeout=3,
        check=True,
        env={"PATH": os.environ["PATH"], "LANG": "C.UTF-8"},
    )
    return completed.stdout

# Argument arrays avoid shell parsing; timeout and check make failure explicit.`;

  if (title.startsWith("Asyncio event loop")) return `import asyncio
from time import perf_counter

async def fetch(name: str, delay: float) -> str:
    started = perf_counter()
    await asyncio.sleep(delay)  # task suspends; loop can run another task
    print({"task": name, "elapsed": perf_counter() - started})
    return name

async def main() -> None:
    tasks = [asyncio.create_task(fetch(f"item-{i}", 0.1)) for i in range(5)]
    assert await asyncio.gather(*tasks) == [f"item-{i}" for i in range(5)]

asyncio.run(main())

# Calling time.sleep() inside fetch would block the event-loop thread.`;

  if (title.startsWith("TaskGroup")) return `import asyncio

async def worker(name: str, queue: asyncio.Queue[int | None]) -> None:
    while (item := await queue.get()) is not None:
        try:
            async with asyncio.timeout(1):
                await process(item)
        finally:
            queue.task_done()

async def main(items: list[int]) -> None:
    queue = asyncio.Queue(maxsize=20)
    async with asyncio.TaskGroup() as group:
        for index in range(4):
            group.create_task(worker(f"w-{index}", queue))
        for item in items:
            await queue.put(item)  # bounded admission is backpressure
        for _ in range(4):
            await queue.put(None)
        await queue.join()

asyncio.run(main(list(range(100))))`;

  if (title.startsWith("Threads, the GIL")) return `from concurrent.futures import ThreadPoolExecutor
from threading import Lock

class Counter:
    def __init__(self):
        self.value = 0
        self.lock = Lock()
    def increment(self) -> None:
        with self.lock:
            next_value = self.value + 1
            self.value = next_value

counter = Counter()
with ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(lambda _: counter.increment(), range(20_000)))
assert counter.value == 20_000

# The GIL is not a business-invariant lock. Explicit synchronization remains
# necessary, and free-threaded builds make accidental assumptions more visible.`;

  if (title.startsWith("Multiprocessing")) return `from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp

def count_primes(limit: int) -> int:
    def prime(value: int) -> bool:
        return value > 1 and all(value % divisor for divisor in range(2, int(value ** 0.5) + 1))
    return sum(prime(value) for value in range(limit))

if __name__ == "__main__":
    context = mp.get_context("spawn")
    with ProcessPoolExecutor(max_workers=4, mp_context=context) as pool:
        futures = [pool.submit(count_primes, limit) for limit in (40_000, 42_000)]
        try:
            print([future.result(timeout=10) for future in futures])
        except BaseException:
            for future in futures:
                future.cancel()
            raise

# Top-level callables and arguments cross the process boundary via serialization.`;

  if (title.startsWith("Concurrency selection")) return `from dataclasses import dataclass
from enum import StrEnum

class Boundary(StrEnum):
    ASYNC = "async task"
    THREAD = "thread"
    PROCESS = "process"
    DURABLE = "queue worker"

@dataclass(frozen=True)
class Work:
    waits_on_io: bool
    releases_gil: bool
    cpu_heavy: bool
    must_survive_restart: bool

def choose(work: Work) -> Boundary:
    if work.must_survive_restart:
        return Boundary.DURABLE
    if work.cpu_heavy and not work.releases_gil:
        return Boundary.PROCESS
    if work.waits_on_io:
        return Boundary.ASYNC
    return Boundary.THREAD

assert choose(Work(False, False, True, False)) is Boundary.PROCESS`;

  if (title.startsWith("Memory management")) return `import gc
import weakref

class Node:
    def __init__(self, name: str):
        self.name = name
        self.other = None

left, right = Node("left"), Node("right")
left.other, right.other = right, left
observed = weakref.ref(left)

del left, right
collected = gc.collect()
assert observed() is None
print({"cyclic_objects_collected": collected, "thresholds": gc.get_threshold()})

# WeakValueDictionary allows cached values to disappear when no strong
# application reference remains. External resources still need explicit close().`;

  if (title.startsWith("Copying, serialization")) return `from copy import copy, deepcopy
import json
import pickle

graph = {"members": [{"id": 1}]}
shallow = copy(graph)
deep = deepcopy(graph)
assert shallow["members"] is graph["members"]
assert deep["members"] is not graph["members"]

def encode_project(project: dict) -> bytes:
    envelope = {"schema_version": 1, "project": project}
    return json.dumps(envelope, separators=(",", ":")).encode("utf-8")

def decode_project(payload: bytes) -> dict:
    envelope = json.loads(payload)
    if envelope.get("schema_version") != 1:
        raise ValueError("unsupported schema")
    return envelope["project"]

# Never call pickle.loads() on untrusted data: the format can execute code.`;

  if (title.startsWith("Performance, complexity")) return `import cProfile
import pstats
import timeit
import tracemalloc

def unique_sorted(values: list[int]) -> list[int]:
    return sorted(set(values))

values = list(range(50_000)) * 2
tracemalloc.start()
with cProfile.Profile() as profile:
    result = unique_sorted(values)
current, peak = tracemalloc.get_traced_memory()

pstats.Stats(profile).sort_stats("cumulative").print_stats(10)
seconds = timeit.timeit(lambda: unique_sorted(values), number=20)
print({"seconds": seconds, "peak_bytes": peak, "result_size": len(result)})

# Optimize only after recording representative baseline evidence.`;

  if (title.startsWith("Testing, unittest")) return `from dataclasses import dataclass
from unittest.mock import create_autospec

class Gateway:
    def save(self, project): ...

@dataclass
class ProjectService:
    gateway: Gateway
    def create(self, name: str) -> dict:
        if not name.strip():
            raise ValueError("name required")
        project = {"name": name.strip()}
        self.gateway.save(project)
        return project

def test_create_project():
    gateway = create_autospec(Gateway, instance=True)
    service = ProjectService(gateway)
    assert service.create(" Demo ") == {"name": "Demo"}
    gateway.save.assert_called_once_with({"name": "Demo"})

# Add property tests: normalization is idempotent and blank names always fail.`;

  if (title.startsWith("Debugging, tracebacks")) return `import logging
import sys
import warnings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s request_id=%(request_id)s %(message)s",
)
logger = logging.getLogger("projects.worker")

def execute(job, request_id: str):
    adapter = logging.LoggerAdapter(logger, {"request_id": request_id})
    try:
        adapter.info("job_started")
        return process(job)
    except Exception:
        adapter.exception("job_failed")
        raise

warnings.warn("legacy configuration", DeprecationWarning, stacklevel=2)

# Post-mortem locally: python -m pdb worker.py
# Inside pdb: where, up, down, p expression, break module.py:42, continue`;

  if (title.startsWith("Packaging, pyproject")) return `# pyproject.toml
[build-system]
requires = ["hatchling>=1.27"]
build-backend = "hatchling.build"

[project]
name = "interview-evidence"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[tool.hatch.build.targets.wheel]
packages = ["src/interview_evidence"]

# src/interview_evidence/py.typed marks inline types for consumers.
# Build and inspect:
# python -m build
# python -m zipfile --list dist/interview_evidence-0.1.0-py3-none-any.whl
# python -m venv /tmp/evidence-check
# /tmp/evidence-check/bin/python -m pip install dist/*.whl`;

  if (title.startsWith("Dependencies, virtual")) return `# Application workflow (tool-neutral commands shown as checks):
# 1. Create an isolated environment.
python -m venv .venv

# 2. Install from a reviewed lock or fully hashed requirements export.
.venv/bin/python -m pip install --require-hashes -r requirements.lock

# 3. Record the interpreter and resolved graph as evidence.
.venv/bin/python -m pip check
.venv/bin/python -m pip inspect

# 4. Build once, inspect artifacts, and publish that immutable artifact.
python -m build
python -m zipfile --list dist/*.whl

# A venv selects an interpreter prefix. A lock records a resolution.
# Neither proves that a dependency is trustworthy; verify source and provenance.`;

  if (title.startsWith("Native extensions")) return `from ctypes import CDLL, POINTER, c_double, c_size_t
from pathlib import Path

library = CDLL(str(Path("./libstats.so").resolve()))
library.mean.argtypes = [POINTER(c_double), c_size_t]
library.mean.restype = c_double

values = (c_double * 4)(1.0, 2.0, 3.0, 4.0)
result = library.mean(values, len(values))
assert result == 2.5

# Document:
# - who owns every allocation
# - whether the native call may block or release the GIL
# - accepted lengths and nullability
# - platform ABI and library lookup expectations
# Native memory errors can crash the entire interpreter.`;

  if (title.startsWith("Architecture, modules")) return `from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True)
class CreateProject:
    name: str

class ProjectRepository(Protocol):
    def add(self, project: dict) -> None: ...

class CreateProjectHandler:
    def __init__(self, projects: ProjectRepository):
        self.projects = projects
    def execute(self, command: CreateProject) -> dict:
        project = {"name": command.name.strip()}
        if not project["name"]:
            raise ValueError("name required")
        self.projects.add(project)
        return project

# Composition root imports concrete database/framework adapters and injects
# them here. The domain and use case do not import those outer details.`;

  if (title.startsWith("Python security")) return `from pathlib import Path
import hmac
import os
import secrets
import subprocess

UPLOAD_ROOT = Path("/srv/uploads").resolve()

def safe_target(filename: str) -> Path:
    candidate = (UPLOAD_ROOT / filename).resolve()
    if not candidate.is_relative_to(UPLOAD_ROOT):
        raise ValueError("path traversal")
    return candidate

token = secrets.token_urlsafe(32)
assert hmac.compare_digest(token, token)

subprocess.run(["convert", "--", str(safe_target("input.png"))],
               check=True, timeout=5, env={"PATH": os.environ["PATH"]})

# Never eval untrusted input, never unpickle it, parameterize SQL, bound sizes
# and time, keep secrets out of source/logs, and review dependency artifacts.`;

  if (title.startsWith("Python production architecture capstone")) return `from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True)
class CreateProject:
    name: str
    idempotency_key: str

class UnitOfWork(Protocol):
    async def __aenter__(self): ...
    async def __aexit__(self, exc_type, exc, tb): ...
    async def claim(self, key: str): ...
    async def add_project(self, project: dict): ...
    async def commit(self): ...

class ProjectService:
    def __init__(self, uow_factory):
        self.uow_factory = uow_factory
    async def create(self, command: CreateProject) -> dict:
        async with self.uow_factory() as uow:
            await uow.claim(command.idempotency_key)
            project = {"name": command.name.strip()}
            await uow.add_project(project)
            await uow.commit()
            return project

# Evidence: strict types, contract tests, bounded concurrency, profiles,
# wheel inspection, dependency provenance, graceful shutdown, and runbook.`;

  return fallback;
}

function javascriptCodeFor(title, fallback) {
  if (title.startsWith("JavaScript setup")) return `// experiment.mjs — run with: node experiment.mjs
import assert from "node:assert/strict";

function observe(label, operation) {
  try {
    const value = operation();
    console.table([{ label, value: String(value), type: typeof value }]);
    return value;
  } catch (error) {
    console.table([{ label, error: error.name, message: error.message }]);
    return error;
  }
}

assert.equal(observe("addition", () => 20 + 22), 42);
observe("failure", () => { throw new TypeError("boundary failed"); });
console.log({ runtime: process.release.name, version: process.version });`;

  if (title.startsWith("ECMAScript specification")) return `// Translate a specification algorithm into an observable prediction.
const object = {
  valueOf() { console.log("01 valueOf"); return {}; },
  toString() { console.log("02 toString"); return "40"; }
};

// Addition evaluates operands, applies ToPrimitive, then chooses concatenation
// because one primitive is a String.
const result = object + 2;
console.assert(result === "402", { result });

// Execution contexts, Environment Records, References, and Completion Records
// are specification devices. Do not claim an engine allocates these exact objects.`;

  if (title.startsWith("Primitive values")) return `const primitive = "Ada";
const record = { name: primitive };
const alias = record;
const copy = { ...record };

alias.name = "Grace";
console.assert(record === alias);
console.assert(record !== copy);
console.assert(copy.name === "Ada");

const cases = [undefined, null, true, 1, 1n, "x", Symbol("x"), {}, () => {}];
console.table(cases.map(value => ({
  display: String(value),
  typeof: typeof value,
  isNull: value === null
})));

// Arguments are always passed by value. For an object, that value identifies
// the same object, so both bindings can observe mutations to it.`;

  if (title.startsWith("Numbers,")) return `const cents = 10n + 20n;
console.assert(cents === 30n);
console.assert(0.1 + 0.2 !== 0.3);
console.assert(Number.isNaN(Number("not-a-number")));
console.assert(Object.is(-0, 0) === false);
console.assert(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2);

function addMoney(leftCents, rightCents) {
  if (typeof leftCents !== "bigint" || typeof rightCents !== "bigint") {
    throw new TypeError("money must use integer cents");
  }
  return leftCents + rightCents;
}

console.table({
  floatingPoint: 0.1 + 0.2,
  epsilon: Number.EPSILON,
  safeInteger: Number.isSafeInteger(9_007_199_254_740_991),
  exactCents: addMoney(199n, 299n)
});`;

  if (title.startsWith("Strings,")) return `const text = "👩🏽‍💻 café";
const graphemes = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)]
  .map(part => part.segment);

console.table({
  utf16CodeUnits: text.length,
  codePoints: [...text].length,
  graphemes: graphemes.length,
  firstCodeUnit: text[0],
  firstCodePoint: [...text][0],
  firstGrapheme: graphemes[0]
});

const composed = "é";
const decomposed = "e\u0301";
console.assert(composed !== decomposed);
console.assert(composed.normalize("NFC") === decomposed.normalize("NFC"));`;

  if (title.startsWith("Type coercion")) return `function inspect(value) {
  return {
    input: String(value),
    boolean: Boolean(value),
    number: Number(value),
    string: String(value)
  };
}

const domainValue = {
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return 42;
    return "project:42";
  }
};

console.table(["", "0", 0, -0, null, undefined, [], {}, domainValue].map(inspect));
console.assert(+domainValue === 42);
console.assert(String(domainValue) === "project:42");

// At external boundaries, parse deliberately instead of relying on truthiness.
const count = Number.parseInt("42", 10);
if (!Number.isSafeInteger(count)) throw new TypeError("invalid count");`;

  if (title.startsWith("Equality,")) return `const values = [NaN, -0, 0, "0", {}, {}];
const rows = [];
for (const left of values) {
  for (const right of values) {
    rows.push({
      left: String(left), right: String(right),
      loose: left == right,
      strict: left === right,
      sameValue: Object.is(left, right)
    });
  }
}
console.table(rows);

console.assert([NaN].includes(NaN));       // SameValueZero
console.assert([NaN].indexOf(NaN) === -1); // strict equality
console.assert(new Set([-0, 0]).size === 1);
console.assert(Object.is(-0, 0) === false);`;

  if (/^(Declarations|Execution contexts|Hoisting)/.test(title)) return `"use strict";
let globalLexical = "module binding";

function outer(parameter) {
  var functionScoped = "created during declaration instantiation";
  if (parameter) {
    let blockScoped = "initialized when this declaration executes";
    return function inner() {
      return { parameter, functionScoped, blockScoped };
    };
  }
}

const closure = outer("input");
console.log(closure());

try {
  console.log(temporal);
  let temporal = 1;
} catch (error) {
  console.assert(error instanceof ReferenceError);
}

// Resolve identifiers through linked lexical environments—not by searching
// debugger stack frames or moving declaration source text upward.`;

  if (title.startsWith("Closures,")) return `function createCounter() {
  let value = 0; // one captured binding, not a copied primitive
  return Object.freeze({
    read: () => value,
    increment: () => ++value
  });
}

const left = createCounter();
const right = createCounter();
console.assert(left.increment() === 1 && left.increment() === 2);
console.assert(right.read() === 0);

const callbacks = [];
for (let index = 0; index < 3; index += 1) {
  callbacks.push(() => index);
}
console.assert(callbacks.map(callback => callback()).join(",") === "0,1,2");

// To release retained data, remove the listener/timer/registry entry that
// keeps the closure—and therefore its reachable environment—alive.`;

  if (/^(Functions|this binding)/.test(title)) return `"use strict";
const account = {
  balance: 40,
  read(prefix = "balance") { return prefix + ":" + this.balance; }
};

const detached = account.read;
console.assert(account.read() === "balance:40");
console.assert(detached.call(account, "call") === "call:40");
console.assert(detached.apply(account, ["apply"]) === "apply:40");

const bound = detached.bind(account, "bound");
console.assert(bound() === "bound:40");

function Account(balance) {
  if (!new.target) throw new TypeError("use new");
  this.balance = balance;
}
const instance = new Account(42);
console.assert(Object.getPrototypeOf(instance) === Account.prototype);

const lexicalThis = () => this;
console.assert(lexicalThis.call(account) === undefined);`;

  if (/^(Objects|Prototypes)/.test(title)) return `const base = Object.create(null, {
  kind: { value: "project", enumerable: true, writable: false }
});
const project = Object.create(base);

Object.defineProperty(project, "name", {
  enumerable: true,
  configurable: false,
  get() { return this._name; },
  set(value) {
    if (!value.trim()) throw new TypeError("name required");
    this._name = value.trim();
  }
});

project.name = " Evidence ";
console.assert(project.name === "Evidence");
console.assert(Object.hasOwn(project, "name"));
console.assert(!Object.hasOwn(project, "kind"));
console.log(Reflect.ownKeys(project), Object.getOwnPropertyDescriptors(project));

// Lookup checks own descriptors first, then follows [[Prototype]]. Assignment
// may invoke an inherited setter or create/shadow an own data property.`;

  if (title.startsWith("Classes,")) return `class Ledger {
  static #created = 0;
  #entries = [];
  static { this.kind = "append-only"; }

  constructor(owner) {
    this.owner = owner;
    Ledger.#created += 1;
  }
  add(amount) {
    if (!Number.isSafeInteger(amount)) throw new TypeError("integer cents required");
    this.#entries.push(amount);
  }
  get balance() { return this.#entries.reduce((sum, value) => sum + value, 0); }
  static get created() { return this.#created; }
}

class AuditedLedger extends Ledger {
  add(amount) {
    console.log({ event: "ledger.add", amount });
    return super.add(amount);
  }
}

const ledger = new AuditedLedger("Ada");
ledger.add(4200);
console.assert(ledger.balance === 4200 && Ledger.created === 1);`;

  if (/^(Composition|Arrays)/.test(title)) return `const state = Object.freeze({
  project: Object.freeze({ id: 1, name: "Draft" }),
  tags: Object.freeze(["js", "interview"])
});

const next = {
  ...state,
  project: { ...state.project, name: "Production" },
  tags: state.tags.toSorted()
};

console.assert(next !== state);
console.assert(next.project !== state.project);
console.assert(next.tags !== state.tags);
console.assert(state.project.name === "Draft");

const sparse = [, undefined, 3];
console.table({
  length: sparse.length,
  hasZero: 0 in sparse,
  hasOne: 1 in sparse,
  mapped: sparse.map(String),
  spread: [...sparse]
});`;

  if (title.startsWith("Map,")) return `const byId = new Map();
const selected = new Set();
const metadata = new WeakMap();

const project = { id: "p-42" };
byId.set(project.id, project);
selected.add(project.id);
metadata.set(project, { observedAt: performance.now() });

console.assert(byId.get("p-42") === project);
console.assert(selected.has("p-42"));
console.assert(metadata.has(project));
console.assert(new Map([[NaN, "value"]]).get(NaN) === "value");

// WeakMap keys do not keep an otherwise unreachable object alive, and weak
// collections deliberately provide no size or iteration API.`;

  if (/^(Iteration protocols|Generators)/.test(title)) return `function* range(start, end) {
  try {
    for (let value = start; value < end; value += 1) {
      const command = yield value;
      if (command === "stop") return "stopped";
    }
    return "complete";
  } finally {
    console.log("iterator resources released");
  }
}

const iterator = range(1, 5);
console.assert(iterator[Symbol.iterator]() === iterator);
console.log(iterator.next());        // { value: 1, done: false }
console.log(iterator.next());        // { value: 2, done: false }
console.log(iterator.next("stop"));  // { value: "stopped", done: true }

for (const value of range(0, 1_000_000)) {
  console.log(value);
  break; // IteratorClose calls return(), so finally executes.
}`;

  if (/^(Symbols|Proxy)/.test(title)) return `const inspect = Symbol("inspect");
const target = Object.defineProperty({ value: 42 }, "fixed", {
  value: "cannot hide", configurable: false
});

const { proxy, revoke } = Proxy.revocable(target, {
  get(object, key, receiver) {
    if (key === inspect) return () => ({ keys: Reflect.ownKeys(object) });
    console.log({ operation: "get", key: String(key) });
    return Reflect.get(object, key, receiver);
  },
  ownKeys(object) {
    return Reflect.ownKeys(object); // omitting fixed would violate an invariant
  }
});

console.assert(proxy.value === 42);
console.log(proxy[inspect]());
revoke();
try { proxy.value; } catch (error) { console.assert(error instanceof TypeError); }`;

  if (title.startsWith("Errors,")) return `class DependencyError extends Error {
  constructor(service, options) {
    super("dependency unavailable", options);
    this.name = "DependencyError";
    this.service = service;
  }
}

async function loadProject(id) {
  try {
    return await gateway.read(id);
  } catch (cause) {
    throw new DependencyError("projects", { cause });
  } finally {
    telemetry.increment("project.load.finished");
  }
}

const failures = await Promise.allSettled([loadProject("a"), loadProject("b")]);
const errors = failures.filter(item => item.status === "rejected").map(item => item.reason);
if (errors.length) throw new AggregateError(errors, "project batch failed");`;

  if (/^(ECMAScript modules|Dynamic import)/.test(title)) return `// counter.mjs — imports are live read-only views of exporter bindings.
export let count = 0;
export function increment() { count += 1; }

// feature.mjs
import { count, increment } from "./counter.mjs";
increment();
console.assert(count === 1);

export async function loadAnalytics(enabled) {
  if (!enabled) return { track() {} };
  try {
    const module = await import("./analytics.mjs");
    return module.analytics;
  } catch (cause) {
    throw new Error("analytics chunk unavailable", { cause });
  }
}

// Module processing has host resolution, graph linking/environment creation,
// then ordered evaluation. Cycles are supported, but early reads can hit TDZ.`;

  if (title.startsWith("Promises,")) return `const hostileThenable = {
  then(resolve, reject) {
    resolve(40);
    reject(new Error("ignored: already resolved"));
    resolve(99);
  }
};

const trace = ["sync:start"];
const promise = Promise.resolve(hostileThenable)
  .then(value => {
    trace.push("reaction:" + value);
    return value + 2;
  })
  .finally(() => trace.push("finally"));

trace.push("sync:end");
console.assert((await promise) === 42);
console.assert(trace.join("|") === "sync:start|sync:end|reaction:40|finally");

// Resolving adopts another promise/thenable's fate. Fulfillment means the
// promise has a final non-rejection value.`;

  if (/^(Async functions|Event loop)/.test(title)) return `const trace = [];

async function operation() {
  trace.push("async:start");
  await 0;
  trace.push("async:resume");
  return 42;
}

const pending = operation();
queueMicrotask(() => trace.push("queued:microtask"));
Promise.resolve().then(() => trace.push("promise:reaction"));
setTimeout(() => trace.push("timer:task"), 0);
trace.push("script:end");

console.assert(await pending === 42);
await new Promise(resolve => setTimeout(resolve, 1));
console.table(trace.map((event, order) => ({ order, event })));

// ECMAScript defines Promise Jobs. The browser or Node host defines its event
// loop, task sources, rendering opportunities, and other queue priorities.`;

  if (title.startsWith("Promise combinators")) return `async function mapBounded(inputs, limit, operation) {
  const results = new Array(inputs.length);
  let cursor = 0;

  async function worker(workerId) {
    while (cursor < inputs.length) {
      const index = cursor++;
      try {
        results[index] = { status: "fulfilled", value: await operation(inputs[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason, workerId };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, inputs.length) }, (_, id) => worker(id)));
  return results;
}

const results = await mapBounded([1, 2, 3, 4], 2, async value => {
  if (value === 3) throw new Error("expected test failure");
  return value * 2;
});
console.table(results);`;

  if (title.startsWith("AbortController")) return `async function fetchJson(url, { timeoutMs, parentSignal } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs ?? 3000);
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, timeout])
    : timeout;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.json();
  } catch (error) {
    if (signal.aborted) {
      throw new DOMException("operation aborted: " + String(signal.reason), "AbortError");
    }
    throw error;
  }
}

const controller = new AbortController();
const pending = fetchJson("/api/projects", { timeoutMs: 1000, parentSignal: controller.signal });
controller.abort("navigation");
await pending.catch(error => console.assert(error.name === "AbortError"));`;

  if (title.startsWith("Explicit resource management")) return `class Subscription {
  #active = true;
  constructor(name) { this.name = name; console.log("open", name); }
  publish(value) {
    if (!this.#active) throw new Error("subscription closed");
    console.log(this.name, value);
  }
  [Symbol.dispose]() {
    this.#active = false;
    console.log("close", this.name);
  }
}

function execute() {
  using stack = new DisposableStack();
  const audit = stack.use(new Subscription("audit"));
  stack.defer(() => console.log("final callback"));
  audit.publish({ event: "started" });
  throw new Error("work failed");
} // resources dispose in reverse acquisition order

try { execute(); } catch (error) { console.log(error.name, error.message); }`;

  if (title.startsWith("JSON,")) return `const original = {
  createdAt: new Date("2026-09-01T00:00:00Z"),
  missing: undefined,
  amount: 42n,
  map: new Map([["id", 42]])
};
original.self = original;

const cloned = structuredClone(original);
console.assert(cloned !== original && cloned.self === cloned);
console.assert(cloned.createdAt instanceof Date);
console.assert(cloned.map instanceof Map);

try { JSON.stringify(original); }
catch (error) { console.log("JSON rejected graph:", error.message); }

const envelope = JSON.stringify({ schemaVersion: 1, project: { id: 42 } });
const parsed = JSON.parse(envelope);
if (parsed.schemaVersion !== 1) throw new Error("unsupported schema");`;

  if (title.startsWith("Date,")) return `const instant = new Date("2026-11-01T05:30:00.000Z");
if (Number.isNaN(instant.valueOf())) throw new TypeError("invalid instant");

const formats = ["en-US", "en-GB", "hi-IN"].map(locale => ({
  locale,
  display: new Intl.DateTimeFormat(locale, {
    dateStyle: "full", timeStyle: "long", timeZone: "America/New_York"
  }).format(instant)
}));
console.table(formats);

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
console.log(["item10", "item2", "Item1"].toSorted(collator.compare));

// Store instants in an unambiguous format. Apply named-zone calendar rules and
// locale formatting only where the product explicitly needs them.`;

  if (title.startsWith("Regular expressions")) return `const safeIdentifier = /^(?<prefix>[a-z]+)-(?<id>\d{1,10})$/u;
const match = safeIdentifier.exec("project-42");
console.assert(match?.groups?.prefix === "project");
console.assert(match?.groups?.id === "42");

function validateIdentifier(value) {
  if (value.length > 64) return false; // bound work before matching
  return safeIdentifier.test(value);
}

console.assert(validateIdentifier("project-42"));
console.assert(!validateIdentifier("project-" + "9".repeat(1_000)));

// Avoid nested ambiguous repetitions such as /^(a+)+$/ on untrusted input;
// their backtracking search can grow catastrophically.`;

  if (title.startsWith("ArrayBuffer,")) return `const buffer = new ArrayBuffer(12);
const view = new DataView(buffer);

view.setUint16(0, 1, false);          // schema version, big-endian
view.setUint16(2, 8, false);          // payload length
view.setBigUint64(4, 42n, false);     // project identifier

function decodeProject(bytes) {
  if (bytes.byteLength < 12) throw new RangeError("truncated message");
  const data = new DataView(bytes);
  const version = data.getUint16(0, false);
  const length = data.getUint16(2, false);
  if (version !== 1 || length !== 8) throw new TypeError("unsupported message");
  return { version, id: data.getBigUint64(4, false) };
}

console.assert(decodeProject(buffer).id === 42n);`;

  if (title.startsWith("SharedArrayBuffer")) return `// Shared state: Int32Array [status, value].
const shared = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
const state = new Int32Array(shared);

// Main agent sends shared to a Worker, then waits asynchronously where
// Atomics.waitAsync is supported. A worker may use Atomics.wait.
worker.postMessage(shared);
const waiter = Atomics.waitAsync(state, 0, 0);
if (waiter.async) await waiter.value;

console.assert(Atomics.load(state, 0) === 1);
console.log({ result: Atomics.load(state, 1) });

// Worker protocol:
// const state = new Int32Array(event.data);
// Atomics.store(state, 1, compute());
// Atomics.store(state, 0, 1);
// Atomics.notify(state, 0, 1);
// Non-atomic shared reads and writes require a rigorously designed protocol.`;

  if (title.startsWith("Reachability,")) return `const registry = new FinalizationRegistry(label => {
  console.log("eventual diagnostic only", label);
});

const cache = new WeakMap();
let owner = { id: "project-42" };
cache.set(owner, { expensive: "metadata" });
registry.register(owner, owner.id);

const listener = () => console.log(owner?.id);
globalThis.addEventListener?.("tick", listener);

// Remove the retaining edge deterministically.
globalThis.removeEventListener?.("tick", listener);
owner = null;

// There is no portable force-GC API and no promise that the finalizer runs.
// Use heap snapshots to find retaining paths; use explicit dispose for files,
// sockets, subscriptions, observers, and timers.`;

  if (/^(Engine pipeline|Hidden classes|Measurement)/.test(title)) return `import { performance } from "node:perf_hooks";

function total(points) {
  let sum = 0;
  for (const point of points) sum += point.x + point.y;
  return sum;
}

const stable = Array.from({ length: 100_000 }, (_, index) => ({ x: index, y: 1 }));
for (let warmup = 0; warmup < 20; warmup += 1) total(stable);

const samples = [];
for (let run = 0; run < 30; run += 1) {
  const started = performance.now();
  total(stable);
  samples.push(performance.now() - started);
}
samples.sort((a, b) => a - b);
console.table({
  medianMs: samples[Math.floor(samples.length * 0.5)],
  p95Ms: samples[Math.floor(samples.length * 0.95)]
});

// V8 experiment flags: node --print-bytecode experiment.mjs
// Treat shapes, inline caches, and deoptimization as measured implementation
// explanations—not portable correctness rules.`;

  if (title.startsWith("JavaScript security")) return `const blockedKeys = new Set(["__proto__", "prototype", "constructor"]);

function safeRecord(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("record required");
  }
  const output = Object.create(null);
  for (const [key, value] of Object.entries(input)) {
    if (blockedKeys.has(key)) throw new TypeError("unsafe key");
    if (typeof value !== "string" || value.length > 200) throw new TypeError("unsafe value");
    output[key] = value;
  }
  return output;
}

const url = new URL(userSuppliedUrl, location.origin);
if (url.origin !== location.origin || url.protocol !== "https:") throw new TypeError("unsafe URL");

// Never pass untrusted text to eval, Function, shell interpreters, HTML sinks,
// SQL, template compilers, or module specifiers without a boundary-specific design.`;

  if (/^(Testing|Debugging)/.test(title)) return `import assert from "node:assert/strict";
import test from "node:test";

function normalize(value) { return value.trim().normalize("NFC").toLowerCase(); }

for (const [input, expected] of [[" Ada ", "ada"], ["E\u0301", "é"]]) {
  test("normalize " + JSON.stringify(input), () => {
    assert.equal(normalize(input), expected);
    assert.equal(normalize(normalize(input)), expected); // idempotence property
  });
}

test("abort is observable", async () => {
  const controller = new AbortController();
  controller.abort("test");
  await assert.rejects(
    () => fetch("https://example.invalid", { signal: controller.signal }),
    error => error.name === "TypeError" || error.name === "AbortError"
  );
});

// Debug evidence: breakpoint condition, async stack, heap retaining path,
// CPU profile, event-loop timeline, source-map location, and minimal reproduction.`;

  if (/^(JavaScript architecture|JavaScript production architecture capstone)/.test(title)) return `export function createProcessor({ repository, publish, clock, telemetry, concurrency = 4 }) {
  return async function process(commands, signal) {
    const seen = new Set();
    return mapBounded(commands, concurrency, async command => {
      signal.throwIfAborted();
      validateCommand(command);
      if (seen.has(command.idempotencyKey)) return { status: "duplicate" };
      seen.add(command.idempotencyKey);

      const started = clock.now();
      try {
        const event = await repository.commit(command, { signal });
        await publish(event, { signal });
        telemetry.observe("command.duration", clock.now() - started, { status: "ok" });
        return { status: "accepted", eventId: event.id };
      } catch (cause) {
        telemetry.increment("command.failure", { kind: cause.name });
        throw new Error("command processing failed", { cause });
      }
    });
  };
}

// Composition root injects real adapters. Tests inject deterministic clock,
// repository, publisher, and telemetry. Production evidence includes queue
// depth, latency percentiles, abort count, duplicate rate, heap, and profiles.`;

  return fallback;
}

function typescriptCodeFor(title, fallback) {
  if (title.startsWith("TypeScript setup")) return `// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}

// Reproducible evidence:
// npx tsc --version
// npx tsc --showConfig
// npx tsc --noEmit --pretty false`;

  if (title.startsWith("Compiler pipeline")) return `import ts from "typescript";

const source = "export const answer: number = 42";
const file = ts.createSourceFile("lesson.ts", source, ts.ScriptTarget.Latest, true);

function visit(node: ts.Node, depth = 0): void {
  console.log("  ".repeat(depth) + ts.SyntaxKind[node.kind]);
  node.forEachChild(child => visit(child, depth + 1));
}
visit(file);

const emitted = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, declaration: true },
  reportDiagnostics: true
});
console.log(emitted.outputText, emitted.diagnostics);

// Full compilation adds Program creation, binding, type checking, declaration
// emit, module resolution, incremental state, and language-service queries.`;

  if (title.startsWith("TypeScript design goals")) return `type User = { id: string; name: string };

function first(users: User[]): User {
  return users[0]; // accepted without noUncheckedIndexedAccess; may be undefined
}

const payload = JSON.parse('{"id":42,"name":null}') as User;
// The assertion emits no validator. payload.id is still a number at runtime.
console.log(typeof payload.id, payload.name);

const mutable: { name: string } = { name: "Ada", admin: true } as {
  name: string;
  admin: boolean;
};
const narrower: { name: string } = mutable; // structural compatibility
console.log(narrower);

// TypeScript intentionally balances soundness and JavaScript compatibility.
// Runtime input, mutation, indexing, and assertions remain trust boundaries.`;

  if (title.startsWith("Type annotations")) return `type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

const widened = { status: "ready" }; // { status: string }
const preserved = { status: "ready" } as const;
const catalog = {
  create: { method: "POST", path: "/projects" },
  read: { method: "GET", path: "/projects/:id" }
} satisfies Record<string, { method: "GET" | "POST"; path: string }>;

type _Widened = Expect<Equal<typeof widened.status, string>>;
type _Literal = Expect<Equal<typeof preserved.status, "ready">>;
type _Method = Expect<Equal<typeof catalog.create.method, "POST">>;`;

  if (title.startsWith("any,")) return `function parseProject(input: unknown): { id: string; name: string } {
  if (typeof input !== "object" || input === null) throw new TypeError("object required");
  const value = input as Record<PropertyKey, unknown>;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    throw new TypeError("invalid project");
  }
  return { id: value.id, name: value.name };
}

function fail(message: string): never { throw new Error(message); }
function log(message: string): void { console.log(message); }

const trusted = parseProject(JSON.parse('{"id":"p1","name":"Demo"}'));
log(trusted.name || fail("name required"));

// any disables checking and spreads. unknown requires evidence before use.
// never represents an impossible value; void describes an ignored return.`;

  if (/^(Assignability|Optional properties)/.test(title)) return `interface ProjectPatch {
  name?: string; // with exactOptionalPropertyTypes: absent, or present string
}

function applyPatch(current: { name: string }, patch: ProjectPatch) {
  if ("name" in patch) return { ...current, name: patch.name };
  return current;
}

const counts: Record<string, number> = { ready: 2 };
const key = "missing";
const count = counts[key]; // number | undefined with noUncheckedIndexedAccess
console.log(count ?? 0);

function acceptName(value: { name: string }) {}
const variable = { name: "Ada", admin: true };
acceptName(variable); // open structural type accepts extra member
// acceptName({ name: "Ada", admin: true }); // fresh literal gets excess check`;

  if (/^(Union types|Discriminated unions)/.test(title)) return `type RequestState<T> =
  | { status: "idle" }
  | { status: "loading"; requestId: string }
  | { status: "success"; data: T }
  | { status: "failure"; error: Error; retryable: boolean };

function assertNever(value: never): never {
  throw new Error("unhandled state: " + JSON.stringify(value));
}

function message<T>(state: RequestState<T>): string {
  switch (state.status) {
    case "idle": return "Not started";
    case "loading": return "Loading " + state.requestId;
    case "success": return "Loaded";
    case "failure": return state.retryable ? "Retry" : "Failed";
    default: return assertNever(state);
  }
}

// Add a variant: the never check turns every forgotten consumer into evidence.`;

  if (/^(Control-flow analysis|User-defined type guards)/.test(title)) return `type Command =
  | { kind: "create"; name: string }
  | { kind: "archive"; id: string };

function isCommand(input: unknown): input is Command {
  if (typeof input !== "object" || input === null) return false;
  const value = input as Record<string, unknown>;
  return value.kind === "create" && typeof value.name === "string"
    || value.kind === "archive" && typeof value.id === "string";
}

function assertCommand(input: unknown): asserts input is Command {
  if (!isCommand(input)) throw new TypeError("invalid command");
}

function execute(input: unknown) {
  assertCommand(input);
  if (input.kind === "create") return input.name.trim();
  return input.id; // control flow eliminated create
}

// A false predicate implementation lies to the checker. Test guard logic at runtime.`;

  if (title.startsWith("Function types")) return `interface Formatter {
  (value: Date, locale?: string): string;
  description: string;
}

interface Constructor<T> { new (...args: never[]): T }

function get(id: string): Promise<string>;
function get(ids: readonly string[]): Promise<string[]>;
function get(input: string | readonly string[]): Promise<string | string[]> {
  return Promise.resolve(Array.isArray(input) ? [...input] : input as string);
}

const one = await get("p1");       // string
const many = await get(["p1"]);   // string[]

// The implementation signature is checked but unavailable to callers.
// Prefer a union or generic when it states the relationship more honestly.`;

  if (/^(Object types|Readonly)/.test(title)) return `interface Project { readonly id: string; name: string }
type ProjectKey = keyof Project;
type Coordinate = readonly [x: number, y: number];

const routes = {
  projects: { method: "GET", path: "/projects" },
  create: { method: "POST", path: "/projects" }
} as const satisfies Record<string, {
  method: "GET" | "POST";
  path: string;
}>;

type RouteName = keyof typeof routes;
type CreateMethod = typeof routes.create.method; // "POST"

function move(point: Coordinate): Coordinate {
  return [point[0] + 1, point[1] + 1];
}

// readonly is compile-time shallow protection. Freeze or copy where runtime
// ownership requires actual mutation prevention.`;

  if (/^(Generics|Generic inference)/.test(title)) return `interface Identified { id: string }

function indexById<T extends Identified>(items: readonly T[]): Map<string, T> {
  return new Map(items.map(item => [item.id, item]));
}

function choose<const T extends readonly string[]>(values: T): T[number] {
  return values[0]!;
}

function createStore<T, Key extends keyof T>(key: Key) {
  return (items: readonly T[]) => new Map(items.map(item => [item[key], item]));
}

const projects = [{ id: "p1", name: "Demo", private: true }] as const;
const byId = indexById(projects);
const direction = choose(["north", "south"] as const); // "north" | "south"

// Each parameter must preserve a real relationship. A parameter used only once
// often adds ceremony without information.`;

  if (/^(keyof|Mapped types)/.test(title)) return `type Events<T extends object> = {
  [K in keyof T as K extends string ? "on" & Capitalize<K> : never]:
    (value: T[K]) => void
};

type MutablePatch<T> = {
  -readonly [K in keyof T]?: T[K]
};

interface Project {
  readonly id: string;
  name: string;
  archived: boolean;
}

type ProjectEvents = Events<Project>;
type ProjectPatch = MutablePatch<Omit<Project, "id">>;

function get<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}`;

  if (/^(Conditional types|Template literal types|Built-in utility types)/.test(title)) return `type ElementOf<T> = T extends readonly (infer Item)[] ? Item : T;
type NonDistributive<T> = [T] extends [string] ? "text" : "other";
type EventName<K extends string> = \`\${K}Changed\`;
type EventMap<T> = {
  [K in keyof T as K extends string ? EventName<K> : never]: T[K]
};

type A = ElementOf<string[] | number[]>; // string | number (distributed)
type B = NonDistributive<string | number>; // "other"
type C = Awaited<Promise<Promise<{ id: string }>>>;
type D = Pick<{ id: string; name: string; secret: string }, "id" | "name">;

// Conditional types distribute only when the checked side is a naked type
// parameter. Name complex results and cap recursion to protect checker latency.`;

  if (title.startsWith("Variance,")) return `class Animal { name = "animal" }
class Dog extends Animal { bark() {} }

type Producer<out T> = () => T;
type Consumer<in T> = (value: T) => void;

const dogProducer: Producer<Dog> = () => new Dog();
const animalProducer: Producer<Animal> = dogProducer; // covariance

const animalConsumer: Consumer<Animal> = animal => console.log(animal.name);
const dogConsumer: Consumer<Dog> = animalConsumer; // contravariance

const dogs: readonly Dog[] = [new Dog()];
const animals: readonly Animal[] = dogs; // safe readonly view

// Mutable input/output positions tend toward invariance. Under
// strictFunctionTypes, function properties receive safer variance checking.`;

  if (/^(Classes|Nominal techniques)/.test(title)) return `declare const userIdBrand: unique symbol;
declare const projectIdBrand: unique symbol;
type UserId = string & { readonly [userIdBrand]: "UserId" };
type ProjectId = string & { readonly [projectIdBrand]: "ProjectId" };

abstract class Repository<T extends { id: string }> {
  abstract find(id: T["id"]): Promise<T | undefined>;
  async require(id: T["id"]): Promise<T> {
    return await this.find(id) ?? Promise.reject(new Error("not found"));
  }
}

function parseUserId(input: unknown): UserId {
  if (typeof input !== "string" || !input.startsWith("usr_")) {
    throw new TypeError("invalid user id");
  }
  return input as UserId; // brand only after runtime proof
}

// Brands prevent accidental mixing inside checked code; they erase at runtime.`;

  if (title.startsWith("Decorators,")) return `function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, typeof target>
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    console.log({ event: "method.start", name });
    try { return target.call(this, ...args); }
    finally { console.log({ event: "method.finish", name }); }
  };
}

class ProjectService {
  @logged
  create(name: string): { name: string } {
    return { name: name.trim() };
  }
}

// Current standard decorators differ from experimentalDecorators and do not
// imply a universal runtime metadata system.`;

  if (title.startsWith("Enums,")) return `const ProjectStatus = {
  draft: "draft",
  active: "active",
  archived: "archived"
} as const;

type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

function parseProjectStatus(input: unknown): ProjectStatus {
  if (typeof input !== "string" || !Object.hasOwn(ProjectStatus, input)) {
    throw new TypeError("invalid project status");
  }
  return input as ProjectStatus;
}

// Unlike a type-only literal union, this object exists at runtime for parsing.
// Avoid exported const enums across independently compiled package boundaries.`;

  if (/^(ECMAScript modules|Module resolution)/.test(title)) return `// package.json: { "type": "module" }
// tsconfig: { "module": "NodeNext", "moduleResolution": "NodeNext",
//             "verbatimModuleSyntax": true }

import type { Project } from "./project.js"; // erased type edge
import { parseProject } from "./project.js"; // retained runtime edge

export async function load(input: unknown): Promise<Project> {
  return parseProject(input);
}

// Diagnose resolution instead of guessing:
// npx tsc --traceResolution --pretty false
// npx tsc --explainFiles
//
// paths helps the checker locate declarations; it does not rewrite emitted
// specifiers. Runtime, tests, and bundler must resolve the same graph.`;

  if (/^(Declaration files|Typed library authoring)/.test(title)) return `// src/index.ts
export interface Project { readonly id: string; name: string }
export declare function parseProject(input: unknown): Project;

// package.json
{
  "name": "@deepstep/contracts",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}

// tsconfig: declaration=true, declarationMap=true, composite=true
// Verify from a packed, clean consumer—not from source paths:
// npm pack --dry-run
// npx tsc -b
// npm install ../deepstep-contracts.tgz`;

  if (title.startsWith("JavaScript interop")) return `// @ts-check
/** @typedef {{ readonly id: string, name: string }} Project */

/**
 * @param {unknown} input
 * @returns {Project}
 */
export function parseProject(input) {
  if (!input || typeof input !== "object") throw new TypeError("object required");
  const value = /** @type {Record<string, unknown>} */ (input);
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    throw new TypeError("invalid project");
  }
  return { id: value.id, name: value.name };
}

// Migration: allowJs -> checkJs/JSDoc at dependency leaves -> rename focused
// modules to .ts -> tighten flags -> remove suppressions with runtime tests.`;

  if (/^(Runtime validation|HTTP, environment)/.test(title)) return `type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; errors: E[] };

type CreateProject = { name: string; ownerId: string };

function parseCreateProject(input: unknown): Result<CreateProject, string> {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["body must be an object"] };
  }
  const value = input as Record<string, unknown>;
  const errors = [] as string[];
  if (typeof value.name !== "string" || !value.name.trim()) errors.push("name required");
  if (typeof value.ownerId !== "string") errors.push("ownerId required");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { name: (value.name as string).trim(), ownerId: value.ownerId as string } };
}

const command = parseCreateProject(await response.json());
if (!command.ok) return new Response(JSON.stringify(command.errors), { status: 422 });
await repository.create(command.value);`;

  if (title.startsWith("Async typing")) return `type Page<T> = { items: T[]; nextCursor?: string };

async function* pages<T>(
  firstUrl: URL,
  parse: (input: unknown) => Page<T>,
  signal: AbortSignal
): AsyncGenerator<T, number, void> {
  let url: URL | undefined = firstUrl;
  let count = 0;
  while (url) {
    signal.throwIfAborted();
    const response = await fetch(url, { signal });
    const page = parse(await response.json());
    for (const item of page.items) { count += 1; yield item; }
    url = page.nextCursor ? new URL(page.nextCursor, url) : undefined;
  }
  return count;
}

// Types express values and protocol slots. They do not enforce deadlines,
// schedule work, cancel losing operations, or make rejection exhaustive.`;

  if (title.startsWith("React with TypeScript")) return `type Column<Row> = {
  key: keyof Row;
  heading: string;
  render?: (value: Row[keyof Row], row: Row) => React.ReactNode;
};

type TableProps<Row extends { id: React.Key }> = {
  rows: readonly Row[];
  columns: readonly Column<Row>[];
  onSelect(row: Row): void;
};

function DataTable<Row extends { id: React.Key }>({ rows, columns, onSelect }: TableProps<Row>) {
  return <table><thead><tr>{columns.map(column =>
    <th key={String(column.key)} scope="col">{column.heading}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id} onClick={() => onSelect(row)}>
      {columns.map(column => <td key={String(column.key)}>
        {column.render?.(row[column.key], row) ?? String(row[column.key])}
      </td>)}</tr>)}</tbody></table>;
}`;

  if (title.startsWith("Node.js with TypeScript")) return `import process from "node:process";

type Config = { port: number; shutdownMs: number };
function loadConfig(env: NodeJS.ProcessEnv): Config {
  const port = Number(env.PORT ?? "3000");
  const shutdownMs = Number(env.SHUTDOWN_MS ?? "10000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("invalid PORT");
  if (!Number.isFinite(shutdownMs) || shutdownMs < 0) throw new Error("invalid SHUTDOWN_MS");
  return { port, shutdownMs };
}

const config = loadConfig(process.env);
const controller = new AbortController();
process.once("SIGTERM", () => controller.abort(new Error("SIGTERM")));

try { await serve(config, controller.signal); }
catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}`;

  if (title.startsWith("Type testing")) return `type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

declare function first<T>(items: readonly [T, ...T[]]): T;
const value = first([1, 2] as const);
type _Result = Expect<Equal<typeof value, 1 | 2>>;

// Negative contract: empty arrays must remain rejected.
// @ts-expect-error empty tuple violates the non-empty input contract
first([]);

// If a future change makes the line valid, ts-expect-error itself fails.
// Add runtime tests separately for JavaScript behavior and boundary parsing.`;

  if (title.startsWith("tsconfig strictness")) return `// tsconfig.base.json — rules shared by every environment
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "sourceMap": true
  }
}

// Browser: lib ["ES2023", "DOM"], moduleResolution "Bundler"
// Node:    lib ["ES2023"], types ["node"], moduleResolution "NodeNext"
// Worker:  lib ["ES2023", "WebWorker"]
// Tests:   explicit test types and no production emit

// target controls transformed syntax; lib controls assumed platform APIs;
// module controls output; moduleResolution models how the host finds modules.`;

  if (title.startsWith("Project references")) return `// tsconfig.json at solution root
{
  "files": [],
  "references": [
    { "path": "packages/domain" },
    { "path": "apps/server" },
    { "path": "apps/web" }
  ]
}

// packages/domain/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "outDir": "dist" },
  "include": ["src/**/*.ts"]
}

// npx tsc -b --verbose
// npx tsc -b --clean
// Consumers check against the referenced project's declarations, making the
// project graph both a build order and a compile-time boundary.`;

  if (title.startsWith("Compiler API")) return `import ts from "typescript";

const program = ts.createProgram(["src/index.ts"], { strict: true, noEmit: true });
const checker = program.getTypeChecker();

for (const source of program.getSourceFiles()) {
  if (source.isDeclarationFile) continue;
  ts.forEachChild(source, function visit(node): void {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(
      modifier => modifier.kind === ts.SyntaxKind.ExportKeyword
    ) && !node.type) {
      const symbol = node.name ? checker.getSymbolAtLocation(node.name) : undefined;
      console.log({ file: source.fileName, function: symbol?.getName(), issue: "missing return type" });
    }
    ts.forEachChild(node, visit);
  });
}

// Node = syntax occurrence; Symbol = named declaration identity; Type = the
// checker's semantic view at a location.`;

  if (title.startsWith("Type-checker performance")) return `# Establish the real project and timing breakdown.
npx tsc --version
npx tsc --showConfig
npx tsc --explainFiles > explanations.txt
npx tsc --extendedDiagnostics --noEmit

# Trace expensive relationships and generic instantiations.
npx tsc --generateTrace .trace --noEmit

# Resolution-only diagnosis.
npx tsc --traceResolution --pretty false > resolution.txt

# Compare before and after: files, types, instantiations, memory, parse time,
# bind time, check time, emit time, clean build, incremental build, editor wait.
# Prefer named simple types and right-sized project references; do not hide
# dependency conflicts with skipLibCheck until the cause is understood.`;

  if (/^(TypeScript upgrades|Safe AI-assisted TypeScript)/.test(title)) return `// Upgrade and generated-code evidence checklist:
const review = {
  pinnedCompiler: "record exact version",
  releaseNotesRead: true,
  strictDiagnostics: 0,
  suppressionsAdded: 0,
  boundaryParsersTested: true,
  adversarialCases: ["malformed input", "wrong tenant", "timeout", "large payload"],
  dependencyProvenanceReviewed: true,
  runtimeRegressionSuitePassed: true,
  declarationConsumersPassed: true,
  performanceCompared: true
} as const;

// Commands:
// npx tsc --noEmit --pretty false
// npx tsc -b --force
// npm test
// npm pack --dry-run
// Review emitted JS and changed .d.ts files—not only editor diagnostics.`;

  if (/^(TypeScript architecture|TypeScript production architecture capstone)/.test(title)) return `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type CreateProject = Readonly<{ name: string; idempotencyKey: string }>;
type Project = Readonly<{ id: string; name: string; createdAt: string }>;

interface ProjectRepository {
  create(command: CreateProject, signal: AbortSignal): Promise<Project>;
}
interface Telemetry {
  observe(name: string, value: number, fields: Record<string, string>): void;
}

export function createProjectService(deps: {
  projects: ProjectRepository;
  telemetry: Telemetry;
  now(): number;
}) {
  return async (input: unknown, signal: AbortSignal): Promise<Result<Project, Error>> => {
    const command = parseCreateProject(input); // runtime proof creates domain type
    if (!command.ok) return { ok: false, error: new Error(command.errors.join(", ")) };
    const started = deps.now();
    try {
      const project = await deps.projects.create(command.value, signal);
      return { ok: true, value: project };
    } catch (error: unknown) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      deps.telemetry.observe("project.create.ms", deps.now() - started, {});
    }
  };
}`;

  return fallback;
}

function nodeCodeFor(title, fallback) {
  if (title.startsWith("Node.js setup")) return `// package.json: { "type": "module", "engines": { "node": ">=24 <27" } }
import process from "node:process";

const evidence = {
  node: process.version,
  release: process.release,
  versions: process.versions,
  platform: process.platform,
  architecture: process.arch,
  execPath: process.execPath,
  argv: process.argv
};

console.log(JSON.stringify(evidence, null, 2));
// Pin an LTS line in the repository and deployment image; verify with:
// node --version
// npm --version
// node --v8-options | head`;

  if (title.startsWith("Node.js architecture")) return `import { pbkdf2 } from "node:crypto";
import { readFile } from "node:fs";
import { promisify } from "node:util";

const derive = promisify(pbkdf2);
const read = promisify(readFile);

const started = performance.now();
await Promise.all([
  derive("secret", "salt", 100_000, 32, "sha256"), // shared libuv pool
  read(new URL(import.meta.url)),                     // shared libuv pool
  fetch("https://example.com")                       // OS network readiness
]);
console.log({ elapsedMs: performance.now() - started });

// V8 executes JavaScript. Node bindings enter native code. libuv coordinates
// the event loop and selected worker-pool work; the kernel owns I/O readiness.`;

  if (title.startsWith("Event loop phases")) return `import { readFile } from "node:fs";

const trace = [];
setTimeout(() => trace.push("top-level timer"), 0);
setImmediate(() => trace.push("top-level immediate"));

readFile(new URL(import.meta.url), () => {
  trace.push("I/O callback");
  setTimeout(() => trace.push("I/O timer"), 0);
  setImmediate(() => trace.push("I/O immediate"));
});

setTimeout(() => console.table(trace.map((event, order) => ({ order, event }))), 25);

// Predict stable relationships in their scheduling context. Do not memorize
// one top-level timer/immediate order as a universal Node guarantee.`;

  if (title.startsWith("process.nextTick")) return `const trace = ["script"];

process.nextTick(() => trace.push("nextTick"));
queueMicrotask(() => trace.push("queueMicrotask"));
Promise.resolve().then(() => trace.push("promise reaction"));
setImmediate(() => trace.push("immediate"));
setTimeout(() => trace.push("timer"), 0);

setTimeout(() => console.table(trace.map((event, order) => ({ order, event }))), 10);

let ticks = 0;
function unsafeLoop() {
  if (++ticks < 100_000) process.nextTick(unsafeLoop);
}
unsafeLoop(); // delays I/O; replace recursion with bounded work plus setImmediate
`;

  if (title.startsWith("libuv worker pool")) return `import { pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import { monitorEventLoopDelay } from "node:perf_hooks";

const derive = promisify(pbkdf2);
const delay = monitorEventLoopDelay({ resolution: 20 });
delay.enable();

const started = performance.now();
await Promise.all(Array.from({ length: 12 }, (_, index) =>
  derive("password-" + index, "salt", 200_000, 32, "sha256")
));

console.log({
  elapsedMs: performance.now() - started,
  loopP99Ms: delay.percentile(99) / 1e6,
  poolSize: process.env.UV_THREADPOOL_SIZE ?? "default"
});
delay.disable();

// Bound admission first. Enlarging the shared pool moves the contention ceiling.`;

  if (title.startsWith("Callback APIs")) return `import { readFile } from "node:fs";
import { promisify } from "node:util";

const readFileAsync = promisify(readFile);

function exactlyOnce(operation) {
  return new Promise((resolve, reject) => {
    let settled = false;
    operation((error, value) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(value);
    });
  });
}

const source = await readFileAsync(new URL(import.meta.url), "utf8");
console.assert(source.length > 0);
await exactlyOnce(callback => callback(null, 42)).then(value => console.assert(value === 42));`;

  if (title.startsWith("EventEmitter")) return `import { EventEmitter, once } from "node:events";

const lifecycle = new EventEmitter({ captureRejections: true });
lifecycle.on("error", error => console.error({ event: "lifecycle.error", error }));

function onReady(value) { console.log("ready", value); }
lifecycle.on("ready", onReady);
lifecycle.once("closed", () => console.log("closed once"));

lifecycle.emit("ready", { port: 3000 }); // listeners run synchronously, in order
lifecycle.off("ready", onReady);         // remove the same function identity

const closed = once(lifecycle, "closed");
lifecycle.emit("closed");
await closed;
console.assert(lifecycle.listenerCount("ready") === 0);`;

  if (title.startsWith("async_hooks")) return `import { AsyncLocalStorage, AsyncResource } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const context = new AsyncLocalStorage();

function log(event) {
  console.log({ event, requestId: context.getStore()?.requestId });
}

async function handle() {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 1));
  log("handled");
}

await context.run({ requestId: randomUUID() }, handle);

const resource = new AsyncResource("lesson-resource");
resource.runInAsyncScope(() => context.run({ requestId: "custom" }, log), null, "custom");
resource.emitDestroy();`;

  if (title.startsWith("Timers,")) return `import { setInterval, setTimeout } from "node:timers/promises";

const controller = new AbortController();
const deadline = setTimeout(250, undefined, { signal: controller.signal });

async function periodic(signal) {
  for await (const startedAt of setInterval(100, Date.now(), { signal, ref: false })) {
    await runOnce(startedAt, signal); // no overlap: next iteration waits
  }
}

const task = periodic(controller.signal).catch(error => {
  if (error.name !== "AbortError") throw error;
});

await deadline;
controller.abort("shutdown");
await task;

// Delay is a threshold; loop work and OS scheduling add drift.`;

  if (/^(Buffer|ArrayBuffer)/.test(title)) return `import { Buffer } from "node:buffer";

function decodeFrame(input) {
  if (input.length < 4) throw new RangeError("missing length prefix");
  const length = input.readUInt32BE(0);
  if (length > 1024 || input.length !== length + 4) throw new RangeError("invalid frame length");
  return Buffer.from(input.subarray(4)); // copy: caller cannot mutate decoded payload
}

const payload = Buffer.from("hello", "utf8");
const frame = Buffer.alloc(4 + payload.length);
frame.writeUInt32BE(payload.length, 0);
payload.copy(frame, 4);
console.assert(decodeFrame(frame).toString("utf8") === "hello");

const view = frame.subarray(4); // aliases frame storage
const copy = Buffer.from(view); // owns independent bytes
view[0] = 0x48;
console.assert(copy[0] !== view[0]);

const exactArrayBuffer = frame.buffer.slice(frame.byteOffset, frame.byteOffset + frame.byteLength);`;

  if (title.startsWith("Stream architecture")) return `import { Readable, Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

const upper = new Transform({
  transform(chunk, encoding, callback) {
    try { callback(null, chunk.toString("utf8").toUpperCase()); }
    catch (error) { callback(error); }
  }
});

let output = "";
const sink = new Writable({
  write(chunk, encoding, callback) { output += chunk; callback(); }
});

await pipeline(Readable.from(["node", " ", "streams"]), upper, sink);
console.assert(output === "NODE STREAMS");
console.log({ readable: upper.readable, writable: upper.writable, destroyed: upper.destroyed });`;

  if (title.startsWith("Readable streams")) return `import { Readable } from "node:stream";

async function* source(signal) {
  try {
    for (let index = 0; index < 1_000_000; index += 1) {
      signal.throwIfAborted();
      yield Buffer.from(String(index) + "\n");
    }
  } finally {
    console.log("source cleanup");
  }
}

const controller = new AbortController();
const readable = Readable.from(source(controller.signal), { highWaterMark: 16 * 1024 });
for await (const chunk of readable) {
  console.log(chunk.toString());
  controller.abort("enough");
  break;
}
console.assert(readable.destroyed);`;

  if (title.startsWith("Writable streams")) return `import { Writable } from "node:stream";
import { once } from "node:events";

const sink = new Writable({
  highWaterMark: 16 * 1024,
  write(chunk, encoding, callback) { setTimeout(callback, 2); }
});

for (let index = 0; index < 10_000; index += 1) {
  const canContinue = sink.write(Buffer.alloc(1024));
  if (!canContinue) await once(sink, "drain");
}
sink.end();
await once(sink, "finish");

console.log({ writableLength: sink.writableLength, destroyed: sink.destroyed });
// Ignoring false allows the JavaScript-side write queue to grow with input.`;

  if (/^(Transform streams|Node streams)/.test(title)) return `import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

const controller = new AbortController();
const source = new URL("./input.ndjson", import.meta.url);
const temporary = new URL("./input.ndjson.gz.tmp", import.meta.url);
const target = new URL("./input.ndjson.gz", import.meta.url);

try {
  await pipeline(
    createReadStream(source),
    createGzip(),
    createWriteStream(temporary, { mode: 0o600 }),
    { signal: controller.signal }
  );
  await fs.rename(temporary, target);
} catch (error) {
  await fs.rm(temporary, { force: true });
  throw error;
}`;

  if (title.startsWith("File system")) return `import { open, rename, rm } from "node:fs/promises";
import { dirname } from "node:path";

async function atomicWrite(path, content) {
  const temporary = path + ".tmp-" + process.pid;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try { await rename(temporary, path); }
  catch (error) { await rm(temporary, { force: true }); throw error; }
}

await atomicWrite("./state.json", JSON.stringify({ version: 1 }));
// Open directly with the required flags. A prior exists/access check creates a TOCTOU race.`;

  if (title.startsWith("Paths,")) return `import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const uploadRoot = resolve("/srv/uploads");

function safePath(filename) {
  if (typeof filename !== "string" || filename.includes("\0")) throw new TypeError("invalid filename");
  const target = resolve(uploadRoot, filename);
  const fromRoot = relative(uploadRoot, target);
  if (fromRoot === "" || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error("path escapes upload root");
  }
  return target;
}

console.assert(safePath("tenant/file.txt") === resolve(uploadRoot, "tenant/file.txt"));
console.assert(fileURLToPath(import.meta.url).endsWith(".mjs"));`;

  if (title.startsWith("TCP sockets")) return `import { createServer, connect } from "node:net";

const server = createServer(socket => {
  socket.setTimeout(5_000, () => socket.destroy(new Error("idle timeout")));
  let pending = Buffer.alloc(0);
  socket.on("data", chunk => {
    pending = Buffer.concat([pending, chunk]);
    if (pending.length > 4096) return socket.destroy(new Error("frame too large"));
    for (let newline; (newline = pending.indexOf(10)) >= 0;) {
      const message = pending.subarray(0, newline).toString("utf8");
      pending = pending.subarray(newline + 1);
      if (!socket.write(JSON.stringify({ echo: message }) + "\n")) socket.pause();
    }
  });
  socket.on("drain", () => socket.resume());
  socket.on("error", () => {});
});

server.listen(0, "127.0.0.1");`;

  if (title.startsWith("DNS,")) return `import dns from "node:dns/promises";

const started = performance.now();
const [lookup, addresses, records] = await Promise.all([
  dns.lookup("example.com", { all: true }),       // OS resolver; may use libuv pool
  dns.resolve4("example.com", { ttl: true }),     // DNS protocol query
  dns.resolveMx("example.com")
]);

console.dir({ lookup, addresses, records, elapsedMs: performance.now() - started }, { depth: null });

dns.setDefaultResultOrder("verbatim");
// Node does not turn these calls into an application DNS cache. Bound retries
// and observe which API, resolver, address family, and connection failed.`;

  if (title.startsWith("TLS,")) return `import tls from "node:tls";
import { readFile } from "node:fs/promises";

const socket = tls.connect({
  host: "example.com",
  servername: "example.com",
  port: 443,
  ALPNProtocols: ["h2", "http/1.1"],
  rejectUnauthorized: true,
  timeout: 5_000
});

socket.once("secureConnect", () => {
  console.log({
    authorized: socket.authorized,
    protocol: socket.getProtocol(),
    alpn: socket.alpnProtocol,
    peer: socket.getPeerCertificate().subject
  });
  socket.end();
});
socket.once("timeout", () => socket.destroy(new Error("TLS timeout")));
socket.once("error", error => console.error(error));`;

  if (title.startsWith("HTTP server")) return `import http from "node:http";

async function readJson(request, limit = 64 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("body too large"), { statusCode: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== "POST" || request.url !== "/projects") throw Object.assign(new Error("not found"), { statusCode: 404 });
    const body = await readJson(request);
    if (typeof body.name !== "string" || !body.name.trim()) throw Object.assign(new Error("name required"), { statusCode: 422 });
    response.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ name: body.name.trim() }));
  } catch (error) {
    response.writeHead(error.statusCode ?? 500, { "content-type": "application/json" }).end(JSON.stringify({ error: error.message }));
  }
});
server.headersTimeout = 10_000;
server.requestTimeout = 15_000;
server.keepAliveTimeout = 5_000;`;

  if (title.startsWith("Fetch,")) return `async function fetchJson(url, { signal, timeoutMs = 3_000 } = {}) {
  const deadline = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const response = await fetch(url, {
    signal: combined,
    headers: { accept: "application/json" }
  });
  try {
    if (!response.ok) throw new Error("HTTP " + response.status, { cause: response });
    const value = await response.json();
    if (!value || typeof value !== "object") throw new TypeError("object response required");
    return value;
  } catch (error) {
    await response.body?.cancel(error).catch(() => {});
    throw error;
  }
}

console.log(await fetchJson("https://example.com/data", { timeoutMs: 1_000 }));`;

  if (title.startsWith("HTTP/2")) return `import http2 from "node:http2";
import { readFileSync } from "node:fs";

const server = http2.createSecureServer({
  key: readFileSync("server-key.pem"),
  cert: readFileSync("server-cert.pem"),
  allowHTTP1: true
});

server.on("stream", (stream, headers) => {
  stream.respond({ ":status": 200, "content-type": "application/json" });
  stream.end(JSON.stringify({ path: headers[":path"] }));
});

async function shutdown() {
  for (const session of activeSessions) session.goaway(http2.constants.NGHTTP2_NO_ERROR);
  await new Promise(resolve => server.close(resolve));
}`;

  if (/^(ECMAScript modules|CommonJS|ESM and CommonJS)/.test(title)) return `// package.json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "imports": { "#config": "./dist/config.js" }
}

// ESM uses URL resolution and live bindings.
import config from "#config";
console.log(import.meta.url, import.meta.dirname, config);

// CommonJS inserts a module into require.cache before evaluation; cycles can
// observe partial exports. In CommonJS, replace the object via module.exports,
// not by reassigning the local exports alias.

// Test both consumers from a packed artifact and ensure they share intended
// state rather than loading independent implementations.`;

  if (title.startsWith("Runtime TypeScript")) return `// erasable.ts — Node strips types; it does not type-check this file.
type Project = { id: string; name: string };

function label(project: Project): string {
  return project.id + ": " + project.name;
}

console.log(label({ id: "p1", name: "Demo" }));

// Run: node erasable.ts
// Check separately: npx tsc --noEmit
// Recommended settings for direct execution include:
// module=nodenext, target=esnext, erasableSyntaxOnly=true,
// verbatimModuleSyntax=true, rewriteRelativeImportExtensions=true.
// Node ignores tsconfig at runtime and packages should publish JavaScript.`;

  if (title.startsWith("Packages,")) return `# Reproducible package evidence using built-in npm commands.
npm ci --ignore-scripts
npm ls --all
npm audit --omit=dev
npm pack --dry-run
npm explain DEPENDENCY_NAME

# Inspect resolved versions and integrity in package-lock.json.
# Review package.json scripts before allowing lifecycle execution.
# Test the packed tarball from a clean temporary consumer.

# Semver range = versions the manifest permits.
# Lockfile = exact resolved graph and integrity for this install model.
# Tarball = artifact consumers actually receive.`;

  if (title.startsWith("Configuration,")) return `function loadConfig(env, argv) {
  const errors = [];
  const port = Number(env.PORT ?? "3000");
  const shutdownMs = Number(env.SHUTDOWN_MS ?? "10000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push("PORT must be 1..65535");
  if (!Number.isFinite(shutdownMs) || shutdownMs < 0) errors.push("SHUTDOWN_MS must be non-negative");
  if (!env.DATABASE_URL) errors.push("DATABASE_URL is required");
  if (errors.length) throw new AggregateError(errors.map(message => new Error(message)), "invalid configuration");
  return Object.freeze({ port, shutdownMs, databaseUrl: new URL(env.DATABASE_URL) });
}

try {
  const config = loadConfig(process.env, process.argv.slice(2));
  console.log({ port: config.port, shutdownMs: config.shutdownMs }); // never log secret URLs
} catch (error) {
  console.error(error.errors?.map(item => item.message) ?? error.message);
  process.exitCode = 78;
}`;

  if (/^(Node errors|uncaughtException)/.test(title)) return `class DependencyError extends Error {
  constructor(service, options) {
    super("dependency unavailable", options);
    this.name = "DependencyError";
    this.code = "DEPENDENCY_UNAVAILABLE";
    this.service = service;
  }
}

process.on("warning", warning => console.error({ event: "process.warning", warning }));
process.on("unhandledRejection", reason => {
  console.error({ event: "unhandledRejection", reason });
  process.exitCode = 1;
});
process.on("uncaughtExceptionMonitor", error => {
  console.error({ event: "uncaughtException", error }); // observe only
});

try { await dependency.call(); }
catch (cause) { throw new DependencyError("payments", { cause }); }

// Let the supervisor restart after an uncaught exception; process state may be invalid.`;

  if (title.startsWith("Process lifecycle")) return `import http from "node:http";

const controller = new AbortController();
let ready = false;
const server = http.createServer((request, response) => {
  if (request.url === "/ready") return response.writeHead(ready ? 200 : 503).end();
  handle(request, response, controller.signal).catch(error => {
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
});

server.listen(3000, () => { ready = true; });

async function shutdown(signal) {
  ready = false;
  controller.abort(new Error(signal));
  server.close();
  await Promise.race([
    new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
    new Promise((_, reject) => setTimeout(() => reject(new Error("drain deadline")), 10_000))
  ]);
}

for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => shutdown(signal).catch(() => { process.exitCode = 1; }));`;

  if (title.startsWith("child_process")) return `import { spawn } from "node:child_process";

async function inspectRevision(revision, signal) {
  if (!/^[a-f0-9]{7,40}$/.test(revision)) throw new TypeError("invalid revision");
  const child = spawn("git", ["show", "--stat", "--oneline", revision], {
    shell: false,
    signal,
    stdio: ["ignore", "pipe", "pipe"],
    env: { PATH: process.env.PATH, LANG: "C.UTF-8" }
  });
  const chunks = [];
  let size = 0;
  for await (const chunk of child.stdout) {
    size += chunk.length;
    if (size > 1_000_000) { child.kill("SIGTERM"); throw new Error("output limit"); }
    chunks.push(chunk);
  }
  const [code] = await once(child, "close");
  if (code !== 0) throw new Error("git exited " + code);
  return Buffer.concat(chunks).toString("utf8");
}`;

  if (title.startsWith("worker_threads")) return `import { Worker } from "node:worker_threads";

function runWorker(value, signal) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.mjs", import.meta.url), { workerData: value });
    const abort = () => worker.terminate().then(() => reject(signal.reason));
    signal.addEventListener("abort", abort, { once: true });
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", code => { if (code !== 0 && !signal.aborted) reject(new Error("worker exit " + code)); });
    worker.once("exit", () => signal.removeEventListener("abort", abort));
  });
}

const controller = new AbortController();
console.log(await runWorker(100_000, controller.signal));

// Reuse a bounded worker pool for repeated tasks; worker startup is not free.`;

  if (title.startsWith("Cluster,")) return `import cluster from "node:cluster";
import { availableParallelism } from "node:os";

if (cluster.isPrimary) {
  const count = Math.min(availableParallelism(), 4);
  for (let index = 0; index < count; index += 1) cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    console.error({ worker: worker.process.pid, code, signal });
    if (!shuttingDown) cluster.fork();
  });
} else {
  startServer();
}

// Prefer independent replicas when the deployment platform already owns load
// balancing, health checks, rolling replacement, limits, and failure isolation.`;

  if (title.startsWith("Background jobs")) return `class LocalQueue {
  #items = [];
  #seen = new Set();

  enqueue(job) {
    if (!job.idempotencyKey) throw new TypeError("idempotency key required");
    this.#items.push({ ...job, attempt: 0 });
  }
  async run(signal) {
    while (!signal.aborted && this.#items.length) {
      const job = this.#items.shift();
      if (this.#seen.has(job.idempotencyKey)) continue;
      try { await processJob(job, signal); this.#seen.add(job.idempotencyKey); }
      catch (error) {
        if (++job.attempt < 3) this.#items.push(job);
        else console.error({ event: "job.dead", job, error });
      }
    }
  }
}

// ponytail: in-memory model loses jobs on crash; replace with a durable broker
// when work must survive restart or cross processes.`;

  if (title.startsWith("Node test runner")) return `import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

afterEach(() => mock.restoreAll());

test("client propagates cancellation", async t => {
  const controller = new AbortController();
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.signal, controller.signal);
    await new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true }));
  });

  const pending = loadProjects({ signal: controller.signal });
  controller.abort(new Error("test abort"));
  await assert.rejects(pending, /test abort/);
  assert.equal(fetchMock.mock.callCount(), 1);
});

// node --test --experimental-test-coverage`;

  if (title.startsWith("Node security")) return `import { isIP } from "node:net";
import { resolve4 } from "node:dns/promises";

function privateIPv4(address) {
  const [a, b] = address.split(".").map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function safeHttpUrl(input) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.username || url.password) throw new TypeError("unsafe URL");
  const addresses = await resolve4(url.hostname);
  if (!addresses.length || addresses.some(privateIPv4)) throw new TypeError("private destination");
  return url;
}

await safeHttpUrl(userInput);

// Defense in depth example:
// node --permission --allow-fs-read=/srv/config --allow-net=api.example.com app.mjs`;

  if (title.startsWith("diagnostics_channel")) return `import diagnostics from "node:diagnostics_channel";
import { AsyncLocalStorage } from "node:async_hooks";

const context = new AsyncLocalStorage();
const requests = diagnostics.channel("deepstep.request");

requests.subscribe(message => {
  const requestId = context.getStore()?.requestId;
  console.log(JSON.stringify({ ...message, requestId }));
});

export async function observeRequest(requestId, operation) {
  return context.run({ requestId }, async () => {
    const started = performance.now();
    requests.publish({ event: "request.start" });
    try { return await operation(); }
    finally { requests.publish({ event: "request.finish", elapsedMs: performance.now() - started }); }
  });
}

// Bound label values and redact credentials before publishing telemetry.`;

  if (title.startsWith("perf_hooks")) return `import { eventLoopUtilization, monitorEventLoopDelay, performance } from "node:perf_hooks";

const histogram = monitorEventLoopDelay({ resolution: 20 });
const baseline = eventLoopUtilization();
histogram.enable();

performance.mark("work:start");
await representativeLoad();
performance.mark("work:end");
performance.measure("work", "work:start", "work:end");

const utilization = eventLoopUtilization(baseline);
console.table({
  durationMs: performance.getEntriesByName("work").at(-1).duration,
  utilization: utilization.utilization,
  loopP50Ms: histogram.percentile(50) / 1e6,
  loopP99Ms: histogram.percentile(99) / 1e6
});
histogram.disable();`;

  if (title.startsWith("Memory,")) return `import { getHeapStatistics } from "node:v8";

const cache = new Map();
function unsafeRemember(request) {
  cache.set(request.id, request); // unbounded strong references retain graphs
}

function evidence() {
  const memory = process.memoryUsage();
  console.table({
    rss: memory.rss,
    heapUsed: memory.heapUsed,
    heapTotal: memory.heapTotal,
    external: memory.external,
    arrayBuffers: memory.arrayBuffers,
    heapLimit: getHeapStatistics().heap_size_limit,
    cacheEntries: cache.size
  });
}

setInterval(evidence, 10_000).unref();
// Capture comparable heap snapshots and inspect retaining paths. If RSS grows
// while heapUsed stays flat, inspect Buffers, native memory, threads, and allocator behavior.`;

  if (title.startsWith("CPU profiles")) return `# Reproduce with representative load, then collect the smallest useful evidence.
node --cpu-prof --cpu-prof-name=lesson.cpuprofile app.mjs
node --heap-prof app.mjs
node --trace-event-categories=node,v8 app.mjs
node --report-on-fatalerror --report-on-signal app.mjs

# Live inspector when an authenticated local tunnel is appropriate:
node --inspect=127.0.0.1:9229 app.mjs

# Correlate:
# request latency percentiles
# event-loop delay and utilization
# sampled JavaScript/native stacks
# GC and allocation activity
# active handles and requests
# deployed commit, Node version, flags, traffic, and input`;

  if (title.startsWith("Native addons")) return `// Node-API sketch: prefer ABI-stable Node-API over V8-specific bindings.
#include <node_api.h>

napi_value Add(napi_env env, napi_callback_info info) {
  // Validate arity and types, convert values, bound work, and translate errors.
  // Long CPU work must not block the main thread; use async work or a worker.
}

// WebAssembly alternative:
const module = await WebAssembly.instantiate(bytes, imports);
const result = module.instance.exports.add(20, 22);
console.assert(result === 42);

// Document memory ownership, lifetimes, thread access, cancellation, ABI,
// platform artifacts, sandbox assumptions, and crash containment.`;

  if (/^(Node\.js service architecture|Node\.js production architecture capstone)/.test(title)) return `import http from "node:http";
import { pipeline } from "node:stream/promises";

export function createService({ repository, workers, telemetry, now }) {
  return async function ingest(request, response, signal) {
    const started = now();
    try {
      if (request.headers["content-type"] !== "application/x-ndjson") throw Object.assign(new Error("unsupported media type"), { statusCode: 415 });
      const validated = request.pipe(createValidationTransform({ maxLineBytes: 64 * 1024 }));
      const persisted = createPersistenceSink(repository, { concurrency: 8, signal });
      await pipeline(validated, persisted, { signal });
      response.writeHead(202).end();
    } catch (error) {
      if (!response.headersSent) response.writeHead(error.statusCode ?? 500);
      response.end();
    } finally {
      telemetry.observe("ingest.duration", now() - started, { aborted: String(signal.aborted) });
    }
  };
}

// Evidence: body limit, queue depth, write backpressure, worker utilization,
// loop delay, latency, heap, stable errors, shutdown drain, and recovery runbook.`;

  return fallback;
}

function dataSystemsCodeFor(title, fallback) {
  if (title.startsWith("PostgreSQL setup")) return `# psql variables make identity and resolution observable.
psql -X --set ON_ERROR_STOP=1 postgres

CREATE ROLE app_owner NOLOGIN;
CREATE ROLE app_runtime LOGIN PASSWORD 'replace-through-secret-manager';
CREATE DATABASE lessons OWNER app_owner;
\\connect lessons
CREATE SCHEMA app AUTHORIZATION app_owner;
GRANT USAGE ON SCHEMA app TO app_runtime;
ALTER ROLE app_runtime IN DATABASE lessons SET search_path = app, pg_catalog;

SELECT current_database(), current_user, session_user,
       current_setting('search_path');
SELECT to_regclass('projects'), to_regclass('app.projects');`;

  if (title.startsWith("PostgreSQL architecture")) return `SELECT pid, backend_type, usename, datname, state, wait_event_type,
       wait_event, backend_start, query_start, left(query, 80) AS query
FROM pg_stat_activity
ORDER BY backend_type, pid;

SELECT name, setting, unit, source
FROM pg_settings
WHERE name IN ('shared_buffers', 'wal_buffers', 'max_connections',
               'autovacuum', 'checkpoint_timeout');

# Correlate database PIDs with the host; do not expose credentials.
ps -o pid,ppid,rss,etime,command -p POSTMASTER_PID,BACKEND_PID`;

  if (title.startsWith("Relations,")) return `CREATE TABLE storage_probe (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO storage_probe(payload)
SELECT repeat(md5(n::text), 8) FROM generate_series(1, 10000) AS n;

SELECT pg_relation_filepath('storage_probe') AS main_fork,
       pg_relation_size('storage_probe') AS heap_bytes,
       pg_indexes_size('storage_probe') AS index_bytes,
       pg_total_relation_size('storage_probe') AS total_bytes;
SELECT relpages, reltuples FROM pg_class WHERE oid = 'storage_probe'::regclass;`;

  if (title.startsWith("PostgreSQL data types")) return `CREATE DOMAIN email_address AS text
  CHECK (VALUE = lower(VALUE) AND VALUE LIKE '%@%');
CREATE TYPE job_state AS ENUM ('queued', 'running', 'done', 'failed');
CREATE TABLE jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_email email_address NOT NULL,
  state job_state NOT NULL DEFAULT 'queued',
  active_during tstzrange NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  search_text text GENERATED ALWAYS AS (owner_email || ' ' || array_to_string(tags, ' ')) STORED
);

SELECT NULL = NULL AS unknown, NULL IS NOT DISTINCT FROM NULL AS null_safe;`;

  if (title.startsWith("Relational modeling")) return `CREATE TABLE tenants (
  tenant_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE
);
CREATE TABLE products (
  tenant_id bigint NOT NULL REFERENCES tenants,
  product_id bigint GENERATED ALWAYS AS IDENTITY,
  sku text NOT NULL,
  name text NOT NULL,
  PRIMARY KEY (tenant_id, product_id),
  UNIQUE (tenant_id, sku)
);
CREATE TABLE orders (
  tenant_id bigint NOT NULL,
  order_id bigint GENERATED ALWAYS AS IDENTITY,
  status text NOT NULL CHECK (status IN ('draft', 'placed', 'paid')),
  PRIMARY KEY (tenant_id, order_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants
);
# Store order-line price snapshots separately: product price changes must not rewrite history.`;

  if (title.startsWith("Constraints,")) return `CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE bookings (
  booking_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL,
  room_id bigint NOT NULL,
  occupied tstzrange NOT NULL CHECK (NOT isempty(occupied)),
  EXCLUDE USING gist (
    tenant_id WITH =,
    room_id WITH =,
    occupied WITH &&
  ) DEFERRABLE INITIALLY IMMEDIATE,
  UNIQUE (tenant_id, booking_id)
);

BEGIN;
SET CONSTRAINTS ALL DEFERRED;
# Conflicting concurrent inserts cannot both commit.
COMMIT;`;

  if (title.startsWith("Schema migrations")) return `-- 1. Expand: brief metadata lock; nullable avoids a full validation dependency.
SET lock_timeout = '2s';
ALTER TABLE accounts ADD COLUMN display_name text;

-- 2. Deploy readers that tolerate NULL and writers that populate both shapes.
-- 3. Backfill in bounded committed batches using the primary key.
UPDATE accounts
SET display_name = left(full_name, 120)
WHERE account_id > :after_id AND account_id <= :through_id
  AND display_name IS NULL;

-- 4. Add and validate separately, then contract in a later release.
ALTER TABLE accounts ADD CONSTRAINT display_name_present
  CHECK (display_name IS NOT NULL) NOT VALID;
ALTER TABLE accounts VALIDATE CONSTRAINT display_name_present;
ALTER TABLE accounts ALTER COLUMN display_name SET NOT NULL;`;

  if (title.startsWith("SQL logical query processing")) return `SELECT p.tenant_id,
       count(*) FILTER (WHERE j.state = 'done') AS completed,
       avg(j.duration_ms) AS average_ms
FROM projects AS p
JOIN jobs AS j USING (tenant_id, project_id)
WHERE j.created_at >= current_date - interval '30 days'
GROUP BY p.tenant_id
HAVING count(*) >= 10
ORDER BY completed DESC, p.tenant_id
LIMIT 20;

-- Logical model: FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT
-- -> DISTINCT -> ORDER BY -> LIMIT. The physical plan may reorder safe work.`;

  if (title.startsWith("Joins,")) return `-- Semi-join: return each project at most once.
SELECT p.* FROM projects AS p
WHERE EXISTS (SELECT 1 FROM jobs AS j WHERE j.project_id = p.id AND j.state = 'failed');

-- Anti-join: NOT EXISTS is safe when the inner key could contain NULL.
SELECT p.* FROM projects AS p
WHERE NOT EXISTS (SELECT 1 FROM jobs AS j WHERE j.project_id = p.id);

-- Latest child per parent through a parameterized LATERAL subquery.
SELECT p.id, latest.state, latest.created_at
FROM projects AS p
LEFT JOIN LATERAL (
  SELECT state, created_at FROM jobs
  WHERE project_id = p.id ORDER BY created_at DESC, id DESC LIMIT 1
) AS latest ON true;`;

  if (title.startsWith("Subqueries,")) return `WITH RECURSIVE tree AS (
  SELECT id, parent_id, name, ARRAY[id] AS path, false AS cycle
  FROM categories WHERE id = $1
  UNION ALL
  SELECT c.id, c.parent_id, c.name, t.path || c.id, c.id = ANY(t.path)
  FROM categories AS c
  JOIN tree AS t ON c.parent_id = t.id
  WHERE NOT t.cycle
)
SELECT id, parent_id, name, path, cycle
FROM tree
ORDER BY path;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE) WITH candidates AS NOT MATERIALIZED (
  SELECT * FROM jobs WHERE state = 'ready'
) SELECT * FROM candidates WHERE tenant_id = $2;`;

  if (title.startsWith("Aggregates,")) return `SELECT tenant_id, created_at::date AS day, duration_ms,
       row_number() OVER (
         PARTITION BY tenant_id ORDER BY duration_ms DESC, id
       ) AS slowest_rank,
       sum(duration_ms) OVER (
         PARTITION BY tenant_id ORDER BY created_at, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_ms,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
         OVER (PARTITION BY tenant_id) AS p95_ms
FROM jobs;

SELECT tenant_id, state, count(*)
FROM jobs GROUP BY GROUPING SETS ((tenant_id, state), (tenant_id), ());`;

  if (title.startsWith("Transactions,")) return `BEGIN;
SET LOCAL statement_timeout = '3s';
SELECT balance_cents FROM accounts WHERE id = 10 FOR UPDATE;
SELECT balance_cents FROM accounts WHERE id = 20 FOR UPDATE;
UPDATE accounts SET balance_cents = balance_cents - 500 WHERE id = 10;
SAVEPOINT credited;
UPDATE accounts SET balance_cents = balance_cents + 500 WHERE id = 20;
INSERT INTO transfers(request_id, from_id, to_id, amount_cents)
VALUES ('req-42', 10, 20, 500);
COMMIT;

-- A UNIQUE(request_id) constraint makes a retried command observable and safe.`;

  if (title.startsWith("MVCC,")) return `-- Run in session A.
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT txid_current(), txid_current_snapshot();
SELECT xmin, xmax, ctid, balance_cents FROM accounts WHERE id = 10;

-- In session B, update and commit the same logical row.
UPDATE accounts SET balance_cents = balance_cents + 1 WHERE id = 10
RETURNING xmin, xmax, ctid, balance_cents;

-- Session A still applies its older snapshot; a new transaction sees the new tuple.
SELECT xmin, xmax, ctid, balance_cents FROM accounts WHERE id = 10;
COMMIT;
VACUUM (VERBOSE, ANALYZE) accounts;`;

  if (title.startsWith("Isolation levels")) return `-- Both sessions read two doctors on call, then each disables a different row.
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM duty WHERE shift_id = 7 AND on_call;
UPDATE duty SET on_call = false WHERE shift_id = 7 AND doctor_id = $1;
COMMIT; -- one transaction can fail with SQLSTATE 40001

-- Retry the complete transaction with fresh reads and bounded backoff.
-- PostgreSQL Serializable uses dependency tracking to reject unsafe outcomes;
-- it does not serialize execution by running one transaction at a time.`;

  if (title.startsWith("Table locks")) return `BEGIN;
SELECT id, payload
FROM jobs
WHERE state = 'ready'
ORDER BY created_at, id
FOR UPDATE SKIP LOCKED
LIMIT 10;

SELECT a.pid, a.wait_event_type, a.wait_event,
       pg_blocking_pids(a.pid) AS blockers, left(a.query, 80) AS query
FROM pg_stat_activity AS a
WHERE a.datname = current_database() AND a.pid <> pg_backend_pid();

SELECT locktype, mode, granted, relation::regclass, transactionid
FROM pg_locks WHERE pid = $1 ORDER BY granted, locktype, mode;
COMMIT;`;

  if (title.startsWith("Deadlocks,")) return `# Retry the complete database unit, never just the failed statement.
for attempt in 0 1 2 3; do
  if psql -X --set ON_ERROR_STOP=1 --file transfer.sql; then exit 0; fi
  status=$?
  # Production code checks SQLSTATE 40001 and 40P01 specifically and preserves
  # one idempotency key. Other errors escape immediately.
  sleep "0.$((RANDOM % (2 ** attempt + 1)))"
done
exit "$status"

# Prevent common deadlocks by locking accounts in stable account_id order.
# Also set lock_timeout and statement_timeout below the caller deadline.`;

  if (/^(B-tree internals|Hash, GiST|Composite, covering)/.test(title)) return `CREATE INDEX CONCURRENTLY jobs_ready_lookup
ON jobs (tenant_id, created_at, id)
INCLUDE (payload)
WHERE state = 'ready';

CREATE INDEX documents_search_gin ON documents USING gin (search_document);
CREATE INDEX bookings_period_gist ON bookings USING gist (occupied);
CREATE INDEX events_created_brin ON events USING brin (created_at)
  WITH (pages_per_range = 64);

SELECT indexrelid::regclass, idx_scan, idx_tup_read, idx_tup_fetch,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE relid = 'jobs'::regclass;

EXPLAIN (ANALYZE, BUFFERS) SELECT id, payload FROM jobs
WHERE tenant_id = 42 AND state = 'ready' ORDER BY created_at, id LIMIT 50;`;

  if (title.startsWith("Planner statistics")) return `ALTER TABLE jobs ALTER COLUMN tenant_id SET STATISTICS 500;
CREATE STATISTICS jobs_tenant_state (dependencies, mcv, ndistinct)
ON tenant_id, state FROM jobs;
ANALYZE jobs;

SELECT attname, null_frac, n_distinct, most_common_vals,
       most_common_freqs, histogram_bounds, correlation
FROM pg_stats
WHERE schemaname = 'app' AND tablename = 'jobs';

SELECT statistics_name, kinds, attnames
FROM pg_statistic_ext JOIN pg_statistic_ext_data
  ON oid = stxoid WHERE stxrelid = 'jobs'::regclass;`;

  if (/^(EXPLAIN,|Sequential scans)/.test(title)) return `EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, VERBOSE, SUMMARY)
SELECT p.id, count(*)
FROM projects AS p
JOIN jobs AS j ON j.project_id = p.id
WHERE p.tenant_id = 42 AND j.created_at >= now() - interval '7 days'
GROUP BY p.id ORDER BY count(*) DESC LIMIT 20;

-- Read bottom-up. Compare estimated rows with actual rows * loops first.
-- Then inspect access paths, join inputs, sort/hash methods, buffer reads,
-- temporary blocks, WAL, and end-to-end timing under representative data.
-- EXPLAIN ANALYZE executes writes unless wrapped in BEGIN ... ROLLBACK.`;

  if (/^(Heap pages|VACUUM,)/.test(title)) return `SELECT relname, n_live_tup, n_dead_tup, last_autovacuum,
       autovacuum_count, last_autoanalyze, autoanalyze_count
FROM pg_stat_user_tables WHERE relname = 'events';

SELECT age(relfrozenxid) AS xid_age,
       pg_size_pretty(pg_table_size(oid)) AS table_size
FROM pg_class WHERE oid = 'events'::regclass;

VACUUM (VERBOSE, ANALYZE) events;
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01
);

# Check for old transactions and replication slots before blaming autovacuum.`;

  if (title.startsWith("WAL,")) return `SELECT pg_current_wal_lsn() AS before_lsn;
BEGIN;
INSERT INTO audit_events(kind, payload) VALUES ('probe', '{"ok":true}');
COMMIT;
SELECT pg_current_wal_lsn() AS after_lsn,
       pg_wal_lsn_diff(pg_current_wal_lsn(), :'before_lsn') AS wal_bytes;

SELECT checkpoints_timed, checkpoints_req, checkpoint_write_time,
       checkpoint_sync_time, buffers_checkpoint
FROM pg_stat_bgwriter;

CHECKPOINT;
# In an isolated environment only: terminate the server uncleanly, restart,
# inspect recovery logs, and verify the committed row and uncommitted absence.`;

  if (title.startsWith("Connections,")) return `# PgBouncer transaction-pooling sketch.
[databases]
app = host=postgres port=5432 dbname=app

[pgbouncer]
pool_mode = transaction
default_pool_size = 20
reserve_pool_size = 5
max_client_conn = 500
query_wait_timeout = 5
server_idle_timeout = 60

SELECT datname, state, count(*)
FROM pg_stat_activity GROUP BY datname, state ORDER BY datname, state;
# Measure client queue time, database active sessions, throughput, p95 latency,
# CPU, I/O, and lock waits while increasing concurrency.`;

  if (title.startsWith("Declarative partitioning")) return `CREATE TABLE events (
  tenant_id bigint NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL
) PARTITION BY RANGE (occurred_at);
CREATE TABLE events_2026_09 PARTITION OF events
FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE INDEX ON events_2026_09 (tenant_id, occurred_at DESC);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM events
WHERE tenant_id = 42
  AND occurred_at >= '2026-09-10' AND occurred_at < '2026-09-11';

ALTER TABLE events DETACH PARTITION events_2026_08 CONCURRENTLY;`;

  if (title.startsWith("Physical streaming replication")) return `SELECT application_name, client_addr, state, sync_state,
       sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;

SELECT slot_name, slot_type, active, restart_lsn, confirmed_flush_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;

# On a standby:
SELECT pg_is_in_recovery(), pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn(),
       now() - pg_last_xact_replay_timestamp() AS replay_delay;
# Test promotion and client rerouting in an isolated topology.`;

  if (title.startsWith("Logical replication")) return `-- Publisher
ALTER TABLE events REPLICA IDENTITY FULL;
CREATE PUBLICATION app_changes FOR TABLE projects, events;
SELECT * FROM pg_create_logical_replication_slot('cdc_probe', 'pgoutput');

-- Subscriber
CREATE SUBSCRIPTION app_copy
CONNECTION 'host=publisher dbname=app user=replicator sslmode=verify-full'
PUBLICATION app_changes;

SELECT subname, received_lsn, latest_end_lsn, latest_end_time
FROM pg_stat_subscription;
SELECT slot_name, active, confirmed_flush_lsn FROM pg_replication_slots;
# Consumers persist event identity plus business effect in one local transaction.`;

  if (title.startsWith("Backups,")) return `# Logical, selective, portable restore path.
pg_dump --format=custom --file=app.dump --dbname=app
createdb restore_probe
pg_restore --clean --if-exists --exit-on-error --dbname=restore_probe app.dump

# Physical base backup for WAL-based point-in-time recovery.
pg_basebackup --dbname=postgres --format=plain --wal-method=stream \
  --checkpoint=fast --pgdata=/validated/backup

# Restore into an isolated instance, set recovery_target_time or LSN, replay
# archived WAL, then verify constraints, row counts, critical checksums, RPO,
# RTO, application smoke tests, and the ability to promote.`;

  if (title.startsWith("Authentication,")) return `# pg_hba.conf: TLS plus SCRAM; use a narrow CIDR and certificate verification.
hostssl app app_runtime 10.40.16.0/20 scram-sha-256

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE app FROM PUBLIC;
GRANT CONNECT ON DATABASE app TO app_runtime;
GRANT USAGE ON SCHEMA app TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON app.projects TO app_runtime;

ALTER TABLE app.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON app.projects
USING (tenant_id = current_setting('app.tenant_id')::bigint)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);
SET LOCAL app.tenant_id = '42';`;

  if (/^(PostgreSQL observability|PostgreSQL performance tuning)/.test(title)) return `SELECT queryid, calls, total_exec_time, mean_exec_time, rows,
       shared_blks_hit, shared_blks_read, temp_blks_written, wal_bytes,
       left(query, 100) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;

SELECT wait_event_type, wait_event, state, count(*)
FROM pg_stat_activity WHERE backend_type = 'client backend'
GROUP BY wait_event_type, wait_event, state ORDER BY count(*) DESC;

SELECT checkpoints_timed, checkpoints_req, buffers_checkpoint,
       buffers_clean, maxwritten_clean, buffers_backend
FROM pg_stat_bgwriter;
# Correlate database evidence with host CPU, memory, storage latency, and queueing.`;

  if (title.startsWith("JSONB indexing")) return `CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE candidates
  ADD COLUMN search_document tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(profile->>'summary', ''))
  ) STORED,
  ADD COLUMN embedding vector(768);
CREATE INDEX candidates_profile_gin ON candidates USING gin (profile jsonb_path_ops);
CREATE INDEX candidates_text_gin ON candidates USING gin (search_document);
CREATE INDEX candidates_embedding_hnsw ON candidates
  USING hnsw (embedding vector_cosine_ops);

SELECT id, ts_rank(search_document, websearch_to_tsquery('english', $1)) AS text_score,
       1 - (embedding <=> $2::vector) AS vector_score
FROM candidates WHERE tenant_id = $3 ORDER BY embedding <=> $2::vector LIMIT 40;
# Measure recall@k and latency against an exact-search baseline.`;

  if (title.startsWith("Application data patterns")) return `BEGIN;
INSERT INTO command_receipts(request_id, status)
VALUES ($1, 'started') ON CONFLICT (request_id) DO NOTHING;
-- Stop if the receipt already contains the authoritative prior result.
UPDATE projects SET name = $2, version = version + 1
WHERE tenant_id = $3 AND id = $4 AND version = $5
RETURNING id, version;
INSERT INTO outbox(event_id, aggregate_id, kind, payload)
VALUES ($1, $4, 'project.renamed', jsonb_build_object('name', $2));
UPDATE command_receipts SET status = 'done' WHERE request_id = $1;
COMMIT;

-- Publisher claims with FOR UPDATE SKIP LOCKED; consumer stores event_id in an
-- inbox table in the same transaction as its local side effect.`;

  if (title.startsWith("Redis architecture")) return `redis-cli INFO server
redis-cli INFO stats
redis-cli INFO commandstats
redis-cli LATENCY DOCTOR
redis-cli SLOWLOG GET 20

# Safe isolated demonstration of event-loop occupancy:
redis-cli SET counter 0
redis-cli --latency-history
# In another terminal, compare bounded commands with a deliberately large
# O(N) operation against test data. Record p50/p99 latency and ops/sec.
redis-cli COMMAND DOCS ZRANGE
redis-cli OBJECT ENCODING counter`;

  if (title.startsWith("RESP,")) return `# RESP arrays contain bulk strings. This frame encodes: SET lesson 42
printf '*3\r\n$3\r\nSET\r\n$6\r\nlesson\r\n$2\r\n42\r\n' | nc 127.0.0.1 6379

# Bounded pipeline: replies remain in request order.
for n in $(seq 1 100); do
  printf 'INCR counter\r\n'
done | redis-cli --pipe

redis-cli CLIENT LIST
redis-cli INFO clients
# Inspect connected_clients, blocked_clients, client_recent_max_output_buffer,
# rejected_connections, and application-side pending-command bounds.`;

  if (/^Redis strings/.test(title)) return `MULTI
HSET user:42 name "Ada" plan "pro" logins 0
HINCRBY user:42 logins 1
INCR page:home:views
SET session:abc '{"user_id":42,"scope":["read"]}' EX 1800 NX
EXEC

MEMORY USAGE user:42
OBJECT ENCODING user:42
STRLEN session:abc
TTL session:abc
# Hash fields are not independent keys: decide serialization, TTL, and update
# granularity from the real access pattern.`;

  if (title.startsWith("Redis lists")) return `LPUSH feed:42 event-3 event-2 event-1
LTRIM feed:42 0 99
SADD project:42:members user:1 user:2
SISMEMBER project:42:members user:2
ZADD leaderboard 1840 user:1 2190 user:2 2190 user:3
ZREVRANGE leaderboard 0 9 WITHSCORES
ZREVRANK leaderboard user:1

# Blocking list operations hold the client, not the whole server.
BLMOVE queue:ready queue:processing RIGHT LEFT 5
# For durable consumer state, retries, and acknowledgements, prefer Streams or
# a dedicated broker over inventing a multi-list protocol casually.`;

  if (title.startsWith("Redis bitmaps")) return `SETBIT attendance:2026-09-01 42 1
GETBIT attendance:2026-09-01 42
BITCOUNT attendance:2026-09-01
BITOP OR attendance:week attendance:2026-09-01 attendance:2026-09-02

PFADD dau:2026-09-01 user:42 user:99 user:42
PFCOUNT dau:2026-09-01

GEOADD offices 72.8777 19.0760 mumbai 77.5946 12.9716 bengaluru
GEOSEARCH offices FROMLONLAT 73 19 BYRADIUS 1000 km WITHDIST

MEMORY USAGE attendance:2026-09-01
# Compare HyperLogLog estimates against a SET on representative cardinalities.`;

  if (title.startsWith("Redis TTL")) return `CONFIG SET maxmemory 32mb
CONFIG SET maxmemory-policy allkeys-lfu
SET cache:project:42 '{"name":"probe"}' EX 60
TTL cache:project:42
OBJECT FREQ cache:project:42

# SET without KEEPTTL replaces the old TTL; prove the behavior explicitly.
SET cache:project:42 '{"name":"updated"}' KEEPTTL
INFO memory
INFO stats

# Track keyspace_hits, keyspace_misses, expired_keys, evicted_keys,
# used_memory, maxmemory, mem_fragmentation_ratio, errors, and source-of-truth
# fallback correctness under pressure.`;

  if (title.startsWith("Redis atomic commands")) return `WATCH balance:42
GET balance:42
MULTI
DECRBY balance:42 500
INCRBY balance:99 500
EXEC

# Atomic fixed-window limiter; use Redis server TIME in stricter designs.
EVAL "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}" \
  1 limit:user:42:window 60000

# MULTI queues commands and EXEC runs them without interleaving, but runtime
# command errors do not roll back earlier successful commands.`;

  if (title.startsWith("Redis pipelining")) return `# Generate one million commands without retaining them client-side.
seq 1 1000000 | awk '{print "SET bench:"$1" "$1}' | redis-cli --pipe

redis-benchmark -t set,get -n 100000 -c 50 -P 1 -q
redis-benchmark -t set,get -n 100000 -c 50 -P 16 -q
redis-benchmark -t set,get -n 100000 -c 50 -P 64 -q

# Preserve p50/p95/p99 client latency, throughput, batch size, response bytes,
# server CPU, network, memory, and output-buffer growth. Use realistic values;
# redis-benchmark is a mechanism experiment, not an application capacity proof.`;

  if (title.startsWith("Redis RDB")) return `CONFIG GET save
CONFIG GET appendonly
CONFIG GET appendfsync
BGSAVE
BGREWRITEAOF
INFO persistence

redis-check-rdb /var/lib/redis/dump.rdb
redis-check-aof --fix /var/lib/redis/appendonlydir/appendonly.aof.manifest

# In an isolated instance: record an acknowledged write, terminate the process
# at controlled moments, restart, verify the data-loss window and load time,
# then restore from an offline copy. Track fork time and copy-on-write memory.`;

  if (title.startsWith("Redis replication")) return `INFO replication
ROLE
WAIT 1 1000

SENTINEL MASTERS
SENTINEL REPLICAS primary
SENTINEL CKQUORUM primary
SENTINEL FAILOVER primary

# Before and after failure, record master_replid, master_repl_offset,
# slave_repl_offset, repl_backlog_histlen, sync_full, sync_partial_ok,
# link state, acknowledged writes, promoted node, client reroute, and data state.
# WAIT improves observation of replication; it does not turn Redis into a
# consensus-backed linearizable database.`;

  if (title.startsWith("Redis Cluster")) return `redis-cli --cluster check 127.0.0.1:7000
redis-cli -c -p 7000 CLUSTER SHARDS
redis-cli -c -p 7000 CLUSTER KEYSLOT 'cart:{user42}'
redis-cli -c -p 7000 CLUSTER KEYSLOT 'lock:{user42}'

MULTI
HSET 'cart:{user42}' sku-1 2
SET 'lock:{user42}' owner NX PX 5000
EXEC

redis-cli --cluster reshard 127.0.0.1:7000
# Observe MOVED and ASK handling, migrating/importing slots, cluster_state,
# fail reports, replica offsets, promotion, unavailable slots, and write loss.`;

  if (title.startsWith("Redis Streams")) return `XGROUP CREATE jobs workers 0 MKSTREAM
XADD jobs * event_id evt-42 kind resize source s3://bucket/key
XREADGROUP GROUP workers worker-a COUNT 10 BLOCK 2000 STREAMS jobs '>'
XPENDING jobs workers

# After the side effect and inbox deduplication commit:
XACK jobs workers MESSAGE_ID

# Recover abandoned pending work.
XAUTOCLAIM jobs workers worker-b 60000 0-0 COUNT 10
XTRIM jobs MAXLEN ~ 100000
# Track entries-added, lag, pending count and age, deliveries, claims, failures,
# acknowledgements, trimming, duplicates, and downstream business state.`;

  if (title.startsWith("Cache-aside")) return `async function loadProject(id, version, redis, database) {
  const key = \`project:\${id}:v\${version}\`;
  const cached = await redis.get(key);
  if (cached !== null) return JSON.parse(cached);

  // Production: use bounded single-flight per key to collapse concurrent fills.
  const project = await database.findProject(id);
  const ttlSeconds = project ? 300 + Math.floor(Math.random() * 60) : 15;
  await redis.set(key, JSON.stringify(project), { EX: ttlSeconds });
  return project;
}

// PostgreSQL remains authoritative. On Redis timeout, use a bounded DB fallback;
// on writes, advance the version in the same DB transaction as the source data.`;

  if (title.startsWith("Distributed locks")) return `# Lease acquisition with an opaque owner token.
SET resource:42:lease 8bb9 NX PX 5000

# Safe release only if this client still owns the lease.
EVAL "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" \
  1 resource:42:lease 8bb9

# A pause can let the lease expire while the old owner continues. The protected
# database therefore also rejects stale monotonically increasing fencing tokens:
UPDATE resources SET value = $1, fence = $2
WHERE id = $3 AND fence < $2;

# Prefer a database constraint, transaction, broker, or rate-limit algorithm
# when that primitive expresses the real invariant directly.`;

  if (title.startsWith("Redis security")) return `ACL SETUSER app reset on '>replace-through-secret-manager' \
  '~cache:project:*' '+get' '+set' '+del' '+pttl' '-@dangerous'
ACL GETUSER app
ACL DRYRUN app GET cache:project:42
ACL DRYRUN app CONFIG GET '*'

CONFIG GET protected-mode
CONFIG GET tls-port
INFO clients
INFO memory
INFO persistence
INFO replication
SLOWLOG GET 20
LATENCY LATEST
MEMORY DOCTOR
# Keep Redis private, authenticate every client, use TLS across untrusted links,
# rotate credentials, restrict admin commands, and alert on persistence failure.`;

  if (title.startsWith("Data systems production architecture capstone")) return `BEGIN;
SET LOCAL app.tenant_id = '42';
INSERT INTO commands(request_id, tenant_id, status)
VALUES ($1, 42, 'accepted') ON CONFLICT (request_id) DO NOTHING;
INSERT INTO jobs(tenant_id, request_id, state, payload)
VALUES (42, $1, 'queued', $2) RETURNING id, version;
INSERT INTO outbox(event_id, tenant_id, kind, payload)
VALUES ($1, 42, 'job.queued', jsonb_build_object('request_id', $1));
COMMIT;

# Publisher: claim outbox rows with FOR UPDATE SKIP LOCKED, XADD to a Redis
# Stream, then record publication. Consumer: deduplicate event_id in PostgreSQL.
# Cache reads are optional acceleration and fall back through bounded admission.

make load-test failure-test restore-drill security-check
# Preserve plans, waits, lag, cache hit rate, stream PEL, RPO/RTO, SLOs, alerts,
# architecture decisions, and the incident runbook as interview evidence.`;

  return fallback;
}

function apiDistributedCodeFor(title, fallback) {
  if (title.startsWith("System boundaries")) return `const capabilities = {
  projects: { owner: "project-service", invariant: "tenant owns every project" },
  jobs: { owner: "job-service", invariant: "one terminal outcome per accepted command" },
  billing: { owner: "billing-service", invariant: "charges are idempotent by operation" }
};

const boundary = {
  command: "SubmitJob",
  input: "validated request + caller + deadline + idempotency key",
  authority: "job-service transaction",
  output: "accepted job resource or stable problem",
  consistency: "read-your-write from authority; cache is optional",
  failure: "unknown outcome is resolved by operation identity"
};

console.table(capabilities);
console.table(boundary);`;

  if (/^HTTP architecture|^HTTP methods/.test(title)) return `# Observe semantics independently from the negotiated HTTP version.
curl --http2 -i https://api.example.test/projects/42 \
  -H 'Accept: application/json' \
  -H 'If-None-Match: "project-42-v7"' \
  -H 'Traceparent: 00-TRACE-SPAN-01'

curl -i -X PUT https://api.example.test/projects/42 \
  -H 'Content-Type: application/json' \
  -H 'If-Match: "project-42-v7"' \
  --data '{"name":"Evidence"}'

# Record method, target, status, representation metadata, validators, cache
# behavior, intermediary headers, connection reuse, and repeated-request effects.`;

  if (/^Resource modeling|^Representations/.test(title)) return `const project = {
  id: "prj_42",
  name: "Evidence",
  links: {
    self: { href: "/projects/prj_42" },
    jobs: { href: "/projects/prj_42/jobs" },
    submitJob: { href: "/projects/prj_42/jobs", method: "POST" }
  }
};

// The resource identity is stable; JSON and text/event-stream are representations.
const responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Content-Language": "en",
  "Content-Encoding": "br",
  "Vary": "Accept, Accept-Encoding, Accept-Language"
};
console.log(project, responseHeaders);`;

  if (title.startsWith("Status codes")) return `HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "https://api.example.test/problems/idempotency-conflict",
  "title": "Idempotency key already represents another request",
  "status": 409,
  "detail": "Use a new key for a different operation.",
  "instance": "urn:request:req_7f2",
  "code": "IDEMPOTENCY_KEY_REUSED",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736"
}

# Clients branch on status, type, and stable code—not title or detail prose.`;

  if (title.startsWith("Boundary validation")) return `const allowed = new Set(["project_id", "input_uri", "priority"]);

function parseJob(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw problem("INVALID_BODY");
  const unknown = Object.keys(raw).filter(key => !allowed.has(key));
  const errors = [];
  if (unknown.length) errors.push({ path: [], code: "UNKNOWN_FIELDS", fields: unknown });
  if (typeof raw.project_id !== "string") errors.push({ path: ["project_id"], code: "TYPE" });
  if (!Number.isInteger(raw.priority) || raw.priority < 0 || raw.priority > 9) {
    errors.push({ path: ["priority"], code: "RANGE" });
  }
  if (Buffer.byteLength(JSON.stringify(raw)) > 16_384) errors.push({ path: [], code: "TOO_LARGE" });
  if (errors.length) throw problem("VALIDATION_FAILED", { errors });
  return Object.freeze({ projectId: raw.project_id, inputUri: new URL(raw.input_uri), priority: raw.priority });
}`;

  if (title.startsWith("Idempotency keys")) return `BEGIN;
INSERT INTO idempotency_records(scope, key, request_hash, state)
VALUES ($1, $2, digest($3, 'sha256'), 'processing')
ON CONFLICT (scope, key) DO NOTHING
RETURNING scope, key;

-- If no row returned: lock the existing record. Different hash => 409.
SELECT request_hash, state, status_code, response_body
FROM idempotency_records WHERE scope = $1 AND key = $2 FOR UPDATE;

INSERT INTO jobs(tenant_id, input_uri) VALUES ($1, $4) RETURNING id;
UPDATE idempotency_records
SET state = 'completed', status_code = 201, response_body = $5
WHERE scope = $1 AND key = $2;
COMMIT;

-- Concurrent requests share one durable claim; retries replay the stored result.`;

  if (title.startsWith("ETags,")) return `import { createHash } from "node:crypto";

const strongEtag = bytes => '"' + createHash("sha256").update(bytes).digest("base64url") + '"';

function conditionalUpdate(request, current) {
  const supplied = request.headers["if-match"];
  if (!supplied) return { status: 428, code: "PRECONDITION_REQUIRED" };
  if (supplied !== current.etag) return { status: 412, code: "PRECONDITION_FAILED" };
  return repository.updateIfVersion(current.id, current.version, request.body);
}

// SQL authority:
// UPDATE projects SET name=$1, version=version+1
// WHERE id=$2 AND version=$3 RETURNING *;
// Zero rows means another writer won after the read.`;

  if (title.startsWith("Pagination")) return `SELECT id, created_at, status
FROM jobs
WHERE tenant_id = $1
  AND (created_at, id) < ($2::timestamptz, $3::bigint)
ORDER BY created_at DESC, id DESC
LIMIT $4 + 1;

// Cursor payload is opaque, versioned, authenticated, and scoped to the query:
const cursor = sign({
  v: 1,
  after: { createdAt: last.created_at, id: last.id },
  filterHash,
  expiresAt
});

// Fetch limit + 1 to determine hasNextPage; never infer it from page length alone.`;

  if (title.startsWith("Filtering,")) return `const fields = {
  status: { sql: "j.status", operators: new Set(["eq", "in"]) },
  created_at: { sql: "j.created_at", operators: new Set(["gte", "lt"]) },
  duration_ms: { sql: "j.duration_ms", operators: new Set(["gte", "lte"]) }
};

function compile(filter) {
  const definition = fields[filter.field];
  if (!definition || !definition.operators.has(filter.operator)) throw problem("UNSUPPORTED_FILTER");
  const parameter = validateValue(filter.field, filter.value);
  return { sql: operatorSql(definition.sql, filter.operator), parameters: [parameter], cost: 1 };
}

// Reject unknown fields, unbounded includes, non-indexable sort, excess clauses,
// and queries whose estimated budget exceeds the endpoint policy.`;

  if (title.startsWith("API versioning")) return `const compatibilityCases = [
  { client: "v1", request: { name: "A" }, accepts: response => typeof response.id === "string" },
  { client: "v2", request: { name: "A", priority: "normal" }, accepts: response => response.priority != null }
];

for (const test of compatibilityCases) {
  const response = await candidateServer.createProject(test.request, { clientVersion: test.client });
  console.assert(test.accepts(response), test.client + " contract broke");
}

// Deprecation: true
// Sunset: Sat, 31 Oct 2026 23:59:59 GMT
// Link: <https://docs.example.test/migrations/projects-v2>; rel="deprecation"`;

  if (title.startsWith("HTTP caching")) return `HTTP/1.1 200 OK
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=30
ETag: "catalog-v42"
Vary: Accept-Encoding
Age: 18
Via: 1.1 edge.example

# Revalidation
GET /catalog HTTP/1.1
If-None-Match: "catalog-v42"

HTTP/1.1 304 Not Modified
ETag: "catalog-v42"
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=30

# Never share personalized content unless the cache key and authorization model prove safety.`;

  if (title.startsWith("REST constraints")) return `{
  "id": "job_42",
  "state": "awaiting_approval",
  "links": {
    "self": { "href": "/jobs/job_42" },
    "project": { "href": "/projects/prj_7" },
    "approve": { "href": "/jobs/job_42/approval", "method": "PUT" },
    "cancel": { "href": "/jobs/job_42/cancellation", "method": "PUT" }
  }
}

# The request carries all server-required context; links expose valid next
# transitions. A client may still bind to documented relations and semantics.`;

  if (title.startsWith("OpenAPI,")) return `openapi: 3.1.0
info: {title: Job API, version: 2.3.0}
paths:
  /jobs:
    post:
      operationId: createJob
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/CreateJob'}
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Job'}
        '422': {$ref: '#/components/responses/Problem'}

# CI: validate schema + examples, lint conventions, diff the released contract,
# generate a clean consumer, then run conformance tests against the real server.`;

  if (title.startsWith("Protocol Buffers")) return `syntax = "proto3";
package jobs.v1;

service Jobs {
  rpc GetJob(GetJobRequest) returns (Job);
  rpc WatchJob(WatchJobRequest) returns (stream JobEvent);
}
message GetJobRequest { string id = 1; }
message Job {
  string id = 1;
  string state = 2;
  reserved 3; // removed fields and names are never reused
  optional string result_uri = 4;
}

// Client sets one deadline; server propagates remaining budget and observes
// cancellation. Add fields with new tags; do not change a field's meaning.`;

  if (title.startsWith("GraphQL")) return `type Query { project(id: ID!): Project }
type Project { id: ID!, name: String!, jobs(first: Int!, after: String): JobConnection! }

const resolvers = {
  Query: { project: (_, { id }, context) => context.projects.loadAuthorized(id) },
  Project: { jobs: (project, args, context) => context.jobsByProject.load({ project, args }) }
};

const policy = {
  maxDepth: 10,
  maxComplexity: 1000,
  maxPageSize: 100,
  persistedOperationsOnly: true
};

// Batch per request, authorize the object and field, trace resolver fan-out,
// and bound list multiplication before execution.`;

  if (title.startsWith("Webhooks,")) return `import { createHmac, timingSafeEqual } from "node:crypto";

function verifyWebhook(rawBody, headers, secret, nowSeconds) {
  const timestamp = Number(headers["x-hook-timestamp"]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) throw new Error("stale");
  const expected = createHmac("sha256", secret).update(timestamp + ".").update(rawBody).digest();
  const supplied = Buffer.from(headers["x-hook-signature"], "hex");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error("bad signature");
  return JSON.parse(rawBody);
}

// Atomically insert event_id into an inbox, enqueue local work, return 2xx,
// and replay the stored outcome for duplicate delivery.`;

  if (title.startsWith("SSE,")) return `// Resumable SSE frame
id: 8472
event: job.progress
retry: 3000
data: {"job_id":"job_42","percent":65}

// Reconnect request
GET /jobs/job_42/events HTTP/1.1
Accept: text/event-stream
Last-Event-ID: 8472

// WebSocket policy: authenticate upgrade, cap message and connection counts,
// heartbeat, bound each outbound queue, close slow consumers explicitly,
// resume from durable sequence where required, and drain on server shutdown.`;

  if (title.startsWith("Authentication,")) return `function authorize(principal, action, resource, context) {
  if (principal.tenantId !== resource.tenantId) return { allow: false, reason: "TENANT_BOUNDARY" };
  if (!principal.scopes.includes(action)) return { allow: false, reason: "MISSING_SCOPE" };
  if (resource.classification === "restricted" && !principal.roles.includes("reviewer")) {
    return { allow: false, reason: "RESOURCE_POLICY" };
  }
  return { allow: true, obligations: { audit: true, fields: allowedFields(principal, resource) } };
}

// Record subject, actor/delegation chain, tenant, action, resource, decision,
// policy version, request/trace IDs, and outcome without logging credentials.`;

  if (title.startsWith("API gateways")) return `routes:
  - match: {pathPrefix: /v1/jobs}
    destination: job-service
    timeout: 4s
    requestLimits: {bodyBytes: 16384, headersBytes: 8192}
    rateLimit: {key: authenticated_subject, sustainedRps: 20, burst: 40}
    retry: {attempts: 1}
trustedForwarders: [10.40.0.0/16]

# Gateway: transport, routing, coarse authentication, protocol limits, global
# admission. Service: object authorization, domain validation, idempotency,
# transaction, stable errors. Propagate the caller deadline and trusted identity.`;

  if (title.startsWith("API security")) return `const outboundPolicy = {
  schemes: new Set(["https:"]),
  hosts: new Set(["models.internal.example", "storage.internal.example"]),
  ports: new Set([443]),
  maxRedirects: 0,
  maxBytes: 1_000_000,
  deadlineMs: 2_000
};

function writableProjectFields(input) {
  return { name: validatedName(input.name), visibility: validatedVisibility(input.visibility) };
}

// Tests: another tenant's ID, private IP and DNS rebinding, duplicate parser
// keys, SQL/shell/template payloads, excess fields, oversized decompression,
// expensive filters, credential stuffing, quota bypass, and secret redaction.`;

  if (title.startsWith("API observability")) return `const observation = {
  requestId,
  traceId: span.spanContext().traceId,
  route: "/projects/{projectId}/jobs",
  method: "POST",
  statusCode: 202,
  durationMs,
  retryAttempt,
  deadlineRemainingMs,
  tenantClass: "paid", // bounded label, never raw tenant ID in metrics
  outcome: "accepted"
};

metrics.histogram("http.server.duration", durationMs, boundedLabels(observation));
logger.info(observation);
span.setAttributes(traceAttributes(observation));
audit.append(securityEvent(observation));`;

  if (title.startsWith("API testing")) return `import test from "node:test";
import assert from "node:assert/strict";

test("cursor traversal preserves a stable total order", async () => {
  const inserted = await seedJobsWithTies(250);
  const traversed = await readAllPages({ pageSize: 17 });
  assert.deepEqual(traversed.map(x => x.id), expectedOrder(inserted).map(x => x.id));
  assert.equal(new Set(traversed.map(x => x.id)).size, inserted.length);
});

test("released consumer accepts candidate provider", async () => {
  await assertContract({ consumer: "sdk-v2.3", provider: candidate });
});

// Add schema-generated invalid inputs, authorization matrix, concurrency,
// retry/idempotency, unknown fields, and deployed conformance smoke tests.`;

  if (title.startsWith("Developer experience")) return `# A new consumer runs one supported path from a clean directory.
npm create @example/job-api-quickstart consumer-probe
cd consumer-probe
npm test

# Release gate
openapi validate openapi.yaml
openapi lint openapi.yaml
openapi diff released.yaml openapi.yaml --fail-on-incompatible
sdk generate --contract openapi.yaml --language typescript
sdk consumer-test --package ./dist/job-sdk.tgz

# Measure time to first authenticated success, docs search failures, SDK errors,
# support themes, deprecated usage, and migration completion.`;

  if (title.startsWith("Distributed system model")) return `const system = {
  nodes: new Map([["A", { term: 1, state: {} }], ["B", { term: 1, state: {} }], ["C", { term: 1, state: {} }]]),
  network: { delay: "unbounded", mayDrop: true, mayDuplicate: true, mayReorder: true },
  storage: { survivesCrash: true },
  faults: { maxCrashFailures: 1, byzantine: false },
  safety: "never commit two outcomes for one command",
  liveness: "a majority-connected stable leader eventually commits"
};

function transition(node, message) {
  return deterministicStateMachine(node, message); // no wall clock or network I/O inside
}
console.dir(system, { depth: 4 });`;

  if (/^Failure models|^Network uncertainty/.test(title)) return `const faultPlan = [
  { atMs: 100, action: "delay", link: "client->api", durationMs: 1500 },
  { atMs: 300, action: "drop", link: "api->database", count: 1 },
  { atMs: 600, action: "reset", link: "api->client" },
  { atMs: 900, action: "pause", node: "worker-a", durationMs: 5000 },
  { atMs: 1200, action: "partition", groups: [["A"], ["B", "C"]] }
];

for (const fault of faultPlan) await injector.apply(fault);
await assertInvariant("one business effect per operation_id");
await assertBounded({ clientDeadlineMs: 2000, queueDepth: 100, attempts: 2 });

// A timeout means the outcome is unknown. Reconcile by stable identity and
// authoritative state; TCP cannot make an application operation exactly once.`;

  if (title.startsWith("Physical clocks")) return `const wallStarted = Date.now();
const monotonicStarted = performance.now();

await operation();

console.table({
  wallElapsed: Date.now() - wallStarted,          // can jump with clock adjustment
  monotonicElapsed: performance.now() - monotonicStarted // duration evidence
});

// Unsafe: if (remote.updatedAt > local.updatedAt) accept(remote)
// Safer depends on the need: version checked by authority, causal token,
// logical clock, bounded clock uncertainty, or an explicit merge conflict.
simulateClockStep({ node: "B", milliseconds: -30_000 });`;

  if (title.startsWith("Logical clocks")) return `function receive(local, remote) {
  return Math.max(local, remote) + 1; // Lamport clock
}

function mergeVector(local, remote, self) {
  const merged = {};
  for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    merged[id] = Math.max(local[id] ?? 0, remote[id] ?? 0);
  }
  merged[self] = (merged[self] ?? 0) + 1;
  return merged;
}

const dominates = (a, b) => Object.keys({ ...a, ...b }).every(k => (a[k] ?? 0) >= (b[k] ?? 0))
  && Object.keys({ ...a, ...b }).some(k => (a[k] ?? 0) > (b[k] ?? 0));

console.assert(!dominates({ A: 2 }, { B: 2 })); // concurrent`;

  if (title.startsWith("Latency distributions")) return `const percentile = (sorted, p) => sorted[Math.ceil((p / 100) * sorted.length) - 1];
const samples = await openLoopLoad({ requestsPerSecond: 200, seconds: 60 });
const durations = samples.map(x => x.completedAt - x.scheduledAt).sort((a, b) => a - b);

console.table({
  p50: percentile(durations, 50),
  p95: percentile(durations, 95),
  p99: percentile(durations, 99),
  p999: percentile(durations, 99.9),
  max: durations.at(-1),
  omitted: samples.filter(x => x.wasNeverSent).length
});

// Compare a single dependency with fan-out to 20 parallel dependencies.`;

  if (title.startsWith("Timeouts,")) return `async function withDeadline(operation, { deadline, parentSignal }) {
  const remaining = deadline - performance.timeOrigin - performance.now();
  if (remaining <= 0) throw new DOMException("deadline exceeded", "TimeoutError");
  const signal = AbortSignal.any([parentSignal, AbortSignal.timeout(remaining)]);
  return operation({ signal, deadline });
}

await withDeadline(async ({ signal, deadline }) => {
  const project = await projects.get(id, { signal, deadline });
  signal.throwIfAborted();
  return jobs.submit(project, { signal, deadline });
}, { deadline: Date.now() + 2000, parentSignal: request.signal });

// Every child stops queued and active work and releases sockets, locks, and buffers.`;

  if (title.startsWith("Retries,")) return `async function retry(operation, { signal, maxAttempts = 3, baseMs = 50, budget }) {
  for (let attempt = 1; ; attempt += 1) {
    try { return await operation({ signal, attempt }); }
    catch (error) {
      if (attempt >= maxAttempts || !isTransient(error) || !budget.take() || signal.aborted) throw error;
      const cap = Math.min(1000, baseMs * 2 ** (attempt - 1));
      const delay = Math.random() * cap; // full jitter
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
      });
    }
  }
}`;

  if (title.startsWith("Overload control")) return `class Admission {
  #active = 0;
  constructor(limit) { this.limit = limit; }
  async run(operation) {
    if (this.#active >= this.limit) throw Object.assign(new Error("overloaded"), { status: 503, retryAfter: 1 });
    this.#active += 1;
    try { return await operation(); }
    finally { this.#active -= 1; }
  }
}

const admission = new Admission(64);
// Keep ingress and internal queues bounded. Shed before expensive parsing or
// fan-out, reserve capacity for health/control work, and offer a cheaper result
// only when its product semantics are explicit.`;

  if (title.startsWith("Circuit breakers")) return `const dependencies = {
  search: { concurrency: 20, queue: 20, breaker: { state: "closed", failures: [] } },
  billing: { concurrency: 5, queue: 5, breaker: { state: "closed", failures: [] } }
};

function mayAttempt(breaker, now) {
  if (breaker.state === "closed") return true;
  if (breaker.state === "open" && now >= breaker.probeAt) {
    breaker.state = "half-open";
    return true; // exactly one bounded probe
  }
  return false;
}

// Separate pools prevent search saturation from consuming billing capacity.
// Readiness asks whether this instance can serve its contract, not whether
// every optional dependency is healthy.`;

  if (title.startsWith("Idempotency,")) return `const operations = {
  addMember: { form: "set union", duplicateSafe: true, commutative: true },
  setMaxProgress: { form: "max(current, incoming)", duplicateSafe: true, monotonic: true },
  increment: { form: "current + delta", duplicateSafe: false },
  transfer: { form: "debit + credit", duplicateSafe: false, needsOperationIdentity: true }
};

function applyTransfer(state, command) {
  if (state.receipts.has(command.operationId)) return state.receipts.get(command.operationId);
  return atomicCommit(state, command.operationId, () => moveFunds(command));
}
console.table(operations);`;

  if (title.startsWith("Queues,")) return `const envelope = {
  eventId: "evt_01J...",
  type: "job.completed",
  version: 2,
  occurredAt: "2026-09-02T12:00:00Z",
  producer: "job-service",
  partitionKey: "job_42",
  traceparent: "00-TRACE-SPAN-01",
  data: { jobId: "job_42", resultUri: "s3://results/42" }
};

// Queue: one worker owns work. Pub/sub: independent subscriptions.
// Log/stream: retained ordered partitions support replay.
// Command requests an action; event states an immutable fact.`;

  if (title.startsWith("Broker internals")) return `await producer.send({ topic: "jobs", key: job.id, value: event, acks: "all" });

for await (const record of consumer.records({ maxInFlight: 32 })) {
  try {
    await handle(record);
    await consumer.commit(record.partition, record.offset + 1);
  } catch (error) {
    await retryPolicy.route(record, error);
  }
}

// Observe producer acknowledgement, broker append position, replica state,
// consumer fetch position, processing position, committed offset, lag, in-flight
// count, redelivery, retention horizon, and client/broker flow control.`;

  if (title.startsWith("Delivery semantics")) return `async function consume(record, database, broker) {
  await database.transaction(async tx => {
    const claimed = await tx.inbox.insertIfAbsent(record.eventId);
    if (!claimed) return; // already committed locally
    await tx.applyBusinessEffect(record.data);
  });
  await broker.ack(record); // crash before this line => safe redelivery
}

// Ack before the transaction risks loss. Ack after it risks redelivery.
// Atomic inbox + local effect turns redelivery into the same local outcome;
// external effects need their own operation identity and reconciliation.`;

  if (title.startsWith("Ordering,")) return `const partitionFor = event => stableHash(event.aggregateId) % partitionCount;

async function handlePartition(records, ownershipSignal) {
  for await (const record of records) {
    ownershipSignal.throwIfAborted();
    await handleInOrder(record); // one key stays on one partition
    await commit(record.offset + 1);
  }
}

// On rebalance: stop fetching, abort or drain old work, commit only completed
// positions, release ownership, then start the newly assigned partitions.
// More consumers than partitions add no consumer-group parallelism.`;

  if (title.startsWith("Poison messages")) return `function classify(error) {
  if (error.code === "SCHEMA_INVALID") return { route: "quarantine", retry: false };
  if (error.code === "DEPENDENCY_UNAVAILABLE") return { route: "retry", retry: true };
  return { route: "investigate", retry: false };
}

const quarantineRecord = {
  originalEnvelope,
  failureCode,
  failedAt,
  consumerVersion,
  attempts,
  traceId,
  replayStatus: "not-reviewed"
};

// Retry topics delay bounded attempts without blocking the source partition.
// Replay is an owned, audited change with idempotency and rate limits.`;

  if (title.startsWith("Transactional outbox")) return `BEGIN;
UPDATE jobs SET state = 'completed', result_uri = $2 WHERE id = $1;
INSERT INTO outbox(event_id, aggregate_id, kind, payload)
VALUES ($3, $1, 'job.completed', $4);
COMMIT;

-- Relay claims unpublished rows or decodes WAL, publishes at least once, and
-- records progress. Consumer commits identity and local effect together:
BEGIN;
INSERT INTO inbox(event_id) VALUES ($3) ON CONFLICT DO NOTHING RETURNING event_id;
UPDATE project_stats SET completed = completed + 1 WHERE project_id = $5;
COMMIT;

-- Only update stats when the inbox insert returned a new identity.`;

  if (title.startsWith("Sagas,")) return `const orderSaga = {
  reserveInventory: { compensate: "releaseInventory", timeoutMs: 2000 },
  authorizePayment: { compensate: "voidAuthorization", timeoutMs: 3000 },
  createShipment: { compensate: "cancelShipment", timeoutMs: 5000 }
};

async function advance(instance, result) {
  const next = transition(instance.state, result);
  await store.transaction(tx => {
    tx.appendHistory(instance.id, result);
    tx.saveState(instance.id, next);
    tx.enqueueDueActions(instance.id, next.actions);
  });
}

// Each action and compensation is idempotent. Irreversible steps and failed
// compensation enter explicit manual-repair states instead of disappearing.`;

  if (title.startsWith("Distributed transactions")) return `// Coordinator durable log
PREPARING tx-42 participants=A,B
PREPARED  tx-42 participant=A
PREPARED  tx-42 participant=B
COMMIT    tx-42

// Participant state machine:
ACTIVE -> PREPARED -> COMMITTED
                 \\-> ABORTED

async function recover(inDoubt) {
  const decision = await coordinator.readDurableDecision(inDoubt.transactionId);
  if (decision === "COMMIT") await participant.commitPrepared(inDoubt);
  else if (decision === "ABORT") await participant.rollbackPrepared(inDoubt);
  else await keepLocksAndEscalate(); // blocking preserves atomicity
}`;

  if (title.startsWith("Single-leader replication")) return `const cluster = {
  leader: { id: "A", term: 8, log: [], commitIndex: 0 },
  followers: [{ id: "B", matchIndex: 0 }, { id: "C", matchIndex: 0 }]
};

async function write(command) {
  const entry = appendLeaderLog(command);
  await replicateToMajority(entry);
  cluster.leader.commitIndex = entry.index;
  applyCommitted();
  return { term: entry.term, index: entry.index };
}

// Route freshness-sensitive reads to a node that proves appliedIndex >= token.index.
// Failover accepts only a candidate whose log contains every committed entry.`;

  if (title.startsWith("Multi-leader replication")) return `const left = { value: "Ada", clock: { eu: 5, us: 2 } };
const right = { value: "Grace", clock: { eu: 4, us: 3 } };

function reconcile(a, b) {
  if (dominates(a.clock, b.clock)) return a;
  if (dominates(b.clock, a.clock)) return b;
  return { conflict: true, siblings: [a, b] }; // application decides
}

console.log(reconcile(left, right));
// Last-write-wins would silently discard one concurrent update based on clocks
// that may not represent causality. Prefer single ownership where possible.`;

  if (title.startsWith("Leaderless replication")) return `const N = 3, W = 2, R = 2;

async function quorumWrite(key, versionedValue) {
  const results = await Promise.allSettled(replicasFor(key).map(node => node.put(key, versionedValue)));
  if (results.filter(x => x.status === "fulfilled").length < W) throw new Error("write quorum unavailable");
}

async function quorumRead(key) {
  const versions = await firstSuccessful(replicasFor(key).map(node => node.get(key)), R);
  const resolved = resolveVersions(versions);
  repairStaleReplicas(key, resolved).catch(report);
  return resolved;
}

// Sloppy quorum and hinted handoff change which nodes count; concurrent versions
// and failures still require explicit resolution and anti-entropy.`;

  if (title.startsWith("Consistency models")) return `const history = [
  { process: "A", op: "write", value: 1, start: 0, end: 5 },
  { process: "B", op: "read",  value: 0, start: 6, end: 7 }
];

function checkReadYourWrites(session, response) {
  if (response.appliedPosition < session.minimumPosition) {
    return routeToAuthority({ minimumPosition: session.minimumPosition });
  }
  return response;
}

console.assert(!isLinearizable(history)); // read began after completed write yet returned old value
// Serializability constrains transaction equivalence; linearizability adds
// real-time order for operations. They solve different questions.`;

  if (title.startsWith("CAP theorem")) return `function handleDuringPartition(policy, request) {
  if (policy === "linearizable") {
    if (!hasQuorum(request.partition)) return { status: 503, guarantee: "no stale success" };
    return quorumOperation(request);
  }
  if (policy === "available-eventual") {
    return localReplicaOperation(request); // may be stale or conflict later
  }
}

for (const policy of ["linearizable", "available-eventual"]) {
  console.table(simulatePartition({ policy, groups: [["A"], ["B", "C"]] }));
}

// PACELC asks about normal-operation latency/consistency choices as well as the
// partition branch. State the guarantee per operation, not per product logo.`;

  if (title.startsWith("Sharding,")) return `function owner(key, ring) {
  const point = hash(key);
  return ring.find(node => node.token >= point) ?? ring[0];
}

const shardKey = event => event.tenantId + ":" + bucket(event.createdAt);
const workload = sampleRequests(1_000_000);
const distribution = groupCount(workload, request => owner(shardKey(request), ring).id);

console.table(distribution);
assertSkewBelow(distribution, 1.5);

// Measure hot keys, virtual-node movement, routing-cache propagation, cross-shard
// requests, scatter width, slowest-shard tail, and migration double-read/write windows.`;

  if (title.startsWith("Consensus,")) return `function onAppendEntries(node, message) {
  if (message.term < node.currentTerm) return { term: node.currentTerm, success: false };
  if (!matches(node.log, message.prevLogIndex, message.prevLogTerm)) return { term: node.currentTerm, success: false };
  node.currentTerm = message.term;
  node.role = "follower";
  appendWithoutConflicts(node.log, message.entries);
  node.commitIndex = Math.min(message.leaderCommit, node.log.length - 1);
  applyThrough(node, node.commitIndex);
  return { term: node.currentTerm, success: true, matchIndex: node.log.length - 1 };
}

// Test: one leader per term, stale-term rejection, majority commit, committed
// prefix preservation, split votes, leader isolation, and recovered follower catch-up.`;

  if (title.startsWith("Membership,")) return `BEGIN;
SELECT nextval('fencing_token_seq') AS token; -- new owner receives 1042
UPDATE resources SET lease_owner = $1, lease_until = now() + interval '5 seconds'
WHERE id = $2;
COMMIT;

-- Protected resource rejects every stale owner, even if its lease once looked valid.
UPDATE protected_state
SET value = $1, last_fence = $2
WHERE id = $3 AND last_fence < $2;

-- Heartbeat timeout creates suspicion, not proof of death. Membership and leader
-- authority require quorum; time-bounded leases require clock assumptions.`;

  if (title.startsWith("Service discovery")) return `const resolver = watchService("job-service");
const balancer = leastOutstanding({ localityPreference: "same-zone" });

resolver.on("update", endpoints => {
  balancer.replace(endpoints.filter(x => x.ready && !x.draining));
});

async function call(request, signal) {
  const endpoint = balancer.pick();
  balancer.started(endpoint);
  try { return await endpoint.call(request, { signal }); }
  finally { balancer.finished(endpoint); }
}

// Observe DNS/watch freshness, endpoint health, subchannel state, connection
// reuse, outstanding work, zone choice, ejection, retry, and churn.`;

  if (title.startsWith("Multi-region architecture")) return `regions:
  primary:
    name: ap-south-1
    capacity: 100%
    writes: authoritative
  recovery:
    name: eu-west-1
    capacity: 100%
    writes: disabled-until-fenced-promotion
data:
  replication: asynchronous
  targetRpoSeconds: 30
  targetRtoMinutes: 15
routing:
  health: end-to-end synthetic write-and-read
  failover: operator-approved
  failback: resynchronize-then-shift

# Game day proves lost-write boundary, promotion fencing, DNS/client behavior,
# capacity, residency, dependent services, communications, and return to normal.`;

  if (title.startsWith("CQRS,")) return `class JobAggregate {
  constructor() { this.version = 0; this.state = "missing"; }
  decide(command) {
    if (command.type === "Submit" && this.state === "missing") return [{ type: "JobSubmitted", jobId: command.jobId }];
    if (command.type === "Complete" && this.state === "running") return [{ type: "JobCompleted", result: command.result }];
    throw new Error("invalid transition");
  }
  apply(event) { this.state = transition(this.state, event); this.version += 1; }
}

await eventStore.append(streamId, expectedVersion, events);
await projections.rebuild("job-list-v2", { fromPosition: 0 });
// Upcast old event versions, deduplicate projection input, and verify snapshot
// plus tail replay equals full replay.`;

  if (title.startsWith("System design method")) return `const estimate = {
  writesPerSecond: 2_000,
  readsPerSecond: 20_000,
  averageObjectBytes: 4_096,
  retentionDays: 365,
  peakFactor: 4,
  targetP99Ms: 300
};

estimate.annualRawBytes = estimate.writesPerSecond * estimate.averageObjectBytes * 86_400 * estimate.retentionDays;
estimate.peakRequestsPerSecond = (estimate.writesPerSecond + estimate.readsPerSecond) * estimate.peakFactor;
estimate.averageConcurrency = estimate.peakRequestsPerSecond * (estimate.targetP99Ms / 1000); // conservative Little's Law input
console.table(estimate);

// Clarify requirements -> invariants -> API -> data/ownership -> critical path
// -> estimates -> failure/resilience -> observability/security -> evolution.`;

  if (title.startsWith("System design case studies")) return `const cases = {
  shortener: { dominant: "read-heavy key lookup", hard: "hot links and abuse" },
  chat: { dominant: "ordered realtime delivery", hard: "offline sync and fan-out" },
  feed: { dominant: "fan-out and ranking", hard: "celebrity skew" },
  files: { dominant: "durable asynchronous workflow", hard: "large bytes and retries" },
  inference: { dominant: "scarce accelerator scheduling", hard: "batching and tail latency" }
};

for (const [name, system] of Object.entries(cases)) {
  design(name, { api: true, estimates: true, dataOwnership: true, criticalPath: true,
    failureMode: system.hard, observability: true, evolution: true });
}
console.table(cases);`;

  if (title.startsWith("Distributed systems production architecture capstone")) return `const guarantees = {
  submitJob: { identity: "Idempotency-Key", authority: "PostgreSQL transaction", response: "202 + job URI" },
  publishEvent: { mechanism: "transactional outbox", delivery: "at least once" },
  consumeEvent: { mechanism: "inbox + local effect", duplicates: "no duplicate local outcome" },
  modelCall: { deadlineMs: 20_000, attempts: 1, concurrency: 32, queue: 64 },
  progressRead: { consistency: "session token or authority", cache: "optional" },
  recovery: { rpoSeconds: 30, rtoMinutes: 15 }
};

await gameDay.run(["lost-response", "broker-redelivery", "slow-model", "database-failover", "region-isolation"]);
await verify(["invariants", "deadlines", "queue-bounds", "trace-continuity", "restore", "security-policy"]);
console.table(guarantees);`;

  return fallback;
}

function internationalInterviewCodeFor(title, fallback) {
  if (title.startsWith("Role targeting")) return `const roles = [
  { title: "Full Stack AI Engineer", location: "EU", must: ["typescript", "python", "rag", "aws"], preferred: ["kubernetes"] },
  { title: "Backend AI Engineer", location: "UK", must: ["python", "fastapi", "postgresql", "llm-evals"], preferred: ["react"] }
];
const evidence = new Map([
  ["typescript", "project-a:type-safe-contracts"],
  ["python", "project-b:async-worker-tests"],
  ["rag", "project-c:retrieval-evaluation-report"]
]);

for (const role of roles) {
  const proven = role.must.filter(skill => evidence.has(skill));
  console.log(role.title, { fit: proven.length / role.must.length, proven, gaps: role.must.filter(x => !evidence.has(x)) });
}

// Sample 30 real postings; count recurring responsibilities, not inflated keyword lists.`;

  if (title.startsWith("Resume architecture")) return `const bullet = {
  context: "Multi-tenant AI document workflow",
  action: "Designed an outbox-driven FastAPI pipeline and bounded workers",
  result: "Reduced duplicate side effects from 1.8% to 0 in failure tests",
  evidence: "load report + incident replay + commit links",
  ownership: "I designed the transaction boundary and implemented the consumer"
};

const checks = [
  text => !/responsible for|worked on/i.test(text),
  text => /\d/.test(text),
  text => text.length <= 220
];
const rendered = bullet.action + "; " + bullet.result + ".";
console.assert(checks.every(check => check(rendered)), rendered);

# Extraction check: pdftotext resume.pdf - | sed -n '1,120p'`;

  if (title.startsWith("LinkedIn profile")) return `const linkedInProfile = {
  headline: "Full Stack AI Engineer | TypeScript, React, Python, FastAPI | Reliable RAG systems",
  about: ["problem domain", "engineering depth", "measured proof", "target role"],
  experience: "impact-first bullets consistent with the resume",
  featured: ["live product", "architecture case study", "evaluation report"],
  skills: ["TypeScript", "Python", "React", "FastAPI", "PostgreSQL", "AWS", "LLM Evaluation"],
  preferences: { titles: ["Full Stack AI Engineer"], locations: ["target locations"], visibility: "chosen deliberately" }
};

const audit = ["custom URL", "professional image", "current location", "contact path",
  "Open to Work visibility", "no confidential data", "same dates and claims as resume"];
console.table(audit.map(item => ({ item, verified: false })));

// Use LinkedIn's own alerts and controls; never scrape or automate engagement.`;

  if (title.startsWith("GitHub profile")) return `# Profile README

## Full Stack AI Engineer
I build observable, evaluated AI products with TypeScript and Python.

## Selected evidence
- **RAG Workbench** — live demo · architecture · retrieval evaluation · threat model
- **Durable Agent Runner** — traces · idempotency tests · failure recovery · runbook
- **Multi-tenant Product** — React accessibility · FastAPI contracts · PostgreSQL plans

## Each pinned repository must answer
1. What user problem does this solve?
2. How do I run and verify it?
3. Which parts did I personally own?
4. What do tests, measurements, and incidents prove?
5. What remains deliberately incomplete?

# Verify links and setup from a clean checkout before every interview loop.`;

  if (title.startsWith("Job portals")) return `const searches = [
  { query: '"full stack" AND (AI OR LLM) AND (TypeScript OR React) AND Python', locations: ["target-1", "target-2"] },
  { query: '"backend engineer" AND (FastAPI OR Python) AND (RAG OR GenAI)', locations: ["target-1"] },
  { query: '"AI engineer" AND production AND evaluation', locations: ["remote-compatible"] }
];

const sources = ["employer-career-site", "LinkedIn alert", "reputable general portal",
  "specialist startup portal", "community board", "known recruiter", "referral"];
const verify = role => ({
  officialPosting: role.officialUrl?.startsWith(role.companyDomain),
  realCompany: Boolean(role.companyRegistryEvidence),
  noPaymentRequested: role.candidateFee === 0,
  contactDomainMatches: role.recruiterEmail.endsWith("@" + role.companyDomain)
});
console.table({ searches, sources });`;

  if (title.startsWith("Application tracking")) return `const application = {
  id: crypto.randomUUID(),
  company: "Example",
  role: "Full Stack AI Engineer",
  canonicalUrl: "https://company.example/careers/123",
  source: "company-career-site",
  stage: "research",
  fit: { responsibilities: 0.8, evidence: 0.7, location: 1, sponsorship: "unknown" },
  contacts: [],
  history: [{ at: new Date().toISOString(), event: "created" }],
  nextAction: { kind: "human-review", due: "2026-09-05" }
};

function dedupeKey(item) {
  return [item.company.trim().toLowerCase(), item.role.trim().toLowerCase(), new URL(item.canonicalUrl).pathname].join("|");
}

// Safe automation: permitted email alerts/manual exports -> local normalization
// -> dedupe -> reminder. A human verifies role, truth, personalization, and submit.
// Never scrape sites, automate messages/engagement, bypass controls, or mass-apply.`;

  if (title.startsWith("Recruiter screens")) return `const introduction = {
  now: "I build production full-stack AI systems with TypeScript/React and Python/FastAPI.",
  proof: "My recent project combines evaluated retrieval, durable jobs, PostgreSQL invariants, and AWS operations.",
  direction: "I am targeting product teams that need engineers across UX, backend, AI quality, and reliability.",
  fit: "This role matches because it owns both customer workflow and production model integration."
};

const logistics = {
  currentLocation: "state the fact",
  workAuthorization: "state exact known status; do not infer",
  sponsorship: "state whether required",
  noticePeriod: "state contractual timing",
  compensation: "ask for level, location, and total-comp range before anchoring"
};

// Rehearse 30s, 90s, and 5m versions; stop when the interviewer has enough.`;

  if (title.startsWith("Coding interview method")) return `function interviewLoop(problem) {
  const contract = clarify(problem, ["inputs", "outputs", "constraints", "invalid cases"]);
  const examples = testExamples(contract, ["normal", "empty", "boundary", "duplicate"]);
  const bruteForce = describeCorrectBaseline(contract);
  const invariant = stateInvariant(bruteForce);
  const optimized = improveBottleneck(bruteForce, contract.constraints);
  const code = implement(optimized, { communicate: true });
  const tests = runByHand(code, examples);
  return { code, tests, complexity: deriveComplexity(optimized), improvements: review(code) };
}

// Say assumptions and invariants aloud. If stuck: shrink the example, restore a
// known-correct baseline, identify the first divergence, and ask a precise question.`;

  if (title.startsWith("JavaScript and Python coding")) return `// JavaScript: count with Map; sort explicitly with a numeric comparator.
function topK(values, k) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k).map(([value]) => value);
}
console.assert(JSON.stringify(topK([3, 1, 3, 2, 1, 3], 2)) === "[3,1]");

# Python equivalent uses collections.Counter and heapq.nlargest when useful.
# Practice without third-party packages. Track errors separately: algorithm,
# language API, syntax, mutation/aliasing, boundary, complexity, or communication.`;

  if (title.startsWith("Full-stack technical")) return `const answer = {
  define: "State the precise boundary and guarantee.",
  trace: "Follow input, control, state, resources, scheduling, and output.",
  production: "Connect the mechanism to latency, correctness, security, or operability.",
  failure: "Name one realistic failure and its first diagnostic evidence.",
  tradeoff: "Compare the nearest credible alternative under stated constraints.",
  evidence: "Use one project measurement, test, trace, plan, incident, or decision."
};

const prompt = "Why can a Node.js service handle concurrent I/O on one JavaScript thread?";
recordAnswer(prompt, answer, { targetSeconds: 120, noNotes: true });

// Interleave React, JS/Node, Python/FastAPI, data, cloud, security, and operations.`;

  if (title.startsWith("System-design interviews")) return `const design = {
  clarify: ["users", "operations", "scale", "latency", "availability", "consistency", "geography", "cost"],
  estimates: { requestsPerSecond: null, peakFactor: null, objectBytes: null, retention: null },
  invariants: [],
  api: [],
  ownership: [],
  criticalPath: [],
  failureTable: [],
  observability: [],
  security: [],
  evolution: ["single service", "measured bottleneck", "next justified split"]
};

function checkpoint(interviewer, design) {
  return interviewer.confirm("I will trace the critical write path next; should I prioritize scale, consistency, or failure recovery?");
}

// Draw one readable path and calculate before adding components.`;

  if (title.startsWith("AI engineering")) return `const aiClaim = {
  feature: "answer questions from private documents",
  deterministicBoundary: "authorization + input limits + citation schema",
  retrieval: { metric: "recall@10", slices: ["acronyms", "tables", "recent docs"] },
  generation: { metric: "grounded task success", grader: "human-calibrated rubric" },
  safety: { tests: ["prompt injection", "cross-tenant retrieval", "unsafe tool arguments"] },
  serving: { p95Ms: 2500, tokenBudget: 6000, maxConcurrent: 24 },
  release: "versioned dataset + model/prompt/index config + regression gate"
};

for (const claim of ["quality", "groundedness", "safety", "latency", "cost"]) {
  console.log(claim, evidenceFor(aiClaim, claim));
}

// Never answer 'the model is better' without dataset, slice, metric, uncertainty, and tradeoff.`;

  if (title.startsWith("Situational interview questions")) return `const modelAnswers = [
  {
    question: "A manager asks you to skip tests to meet a deadline. What do you do?",
    answer: [
      "Clarify the deadline, customer impact, exact untested risk, and reversible scope.",
      "State the principle: make risk visible and protect critical behavior; do not claim zero risk.",
      "Offer options: reduce scope, automate the highest-risk checks, stage exposure, or move the date.",
      "Recommend the smallest safe release with owner, monitoring, rollback, and written acceptance of residual risk."
    ]
  },
  {
    question: "Two teams disagree about service ownership. How would you proceed?",
    answer: [
      "Map the user capability, data authority, change frequency, on-call responsibility, and current dependency pain.",
      "Hear both teams separately, then restate the shared goal and disputed decision in neutral language.",
      "Compare ownership options with explicit tradeoffs and propose a time-bounded experiment or decision owner.",
      "Record the contract, owner, escalation path, and evidence that will trigger a boundary review."
    ]
  }
];

console.assert(modelAnswers.every(item => item.answer.length === 4));
// Adapt the answer when constraints change. Do not falsely present a hypothetical as past experience.`;

  if (title.startsWith("Technical storytelling")) return `const story = {
  audience: "engineering manager",
  context: "A model integration caused unpredictable response latency.",
  stakes: "Checkout support agents were waiting and abandoning requests.",
  tension: "Retries improved success but amplified load and tail latency.",
  decision: "I introduced one propagated deadline, bounded concurrency, and a degraded response.",
  evidence: "p99 fell from 14s to 4.2s; timeout errors became explicit; load stayed within budget.",
  tradeoff: "Some requests returned partial results instead of retrying invisibly.",
  reflection: "I now define latency and retry budgets before provider integration."
};

function versionFor(audience) {
  if (audience === "recruiter") return [story.context, story.decision, story.evidence];
  if (audience === "engineer") return [story.context, story.tension, story.decision, story.evidence, story.tradeoff];
  return Object.values(story);
}
console.assert(versionFor("recruiter").length === 3);`;

  if (title.startsWith("Influence without authority")) return `const influencePlan = {
  decision: "Adopt bounded retries before launch",
  sharedGoal: "Protect checkout availability without overloading payments",
  stakeholders: [
    { role: "product", incentive: "launch date", concern: "lost conversion", evidence: "degraded-mode demo" },
    { role: "payments", incentive: "service stability", concern: "retry storm", evidence: "load curve" },
    { role: "support", incentive: "clear outcomes", concern: "ambiguous failures", evidence: "error workflow" }
  ],
  options: ["bounded retry + degradation", "smaller launch", "delay for capacity"],
  decisionOwner: "product director",
  escalationCondition: "risk exceeds agreed error budget"
};

for (const stakeholder of influencePlan.stakeholders) {
  console.log(stakeholder.role, "ask:", stakeholder.concern, "show:", stakeholder.evidence);
}
// Listen before framing. Share evidence and alternatives. Record dissent and
// escalate by agreed impact, never by surprise or political pressure.`;

  if (title.startsWith("Ethical persuasion")) return `const ethicalCheck = {
  truthful: message => !message.omitsMaterialFact && !message.falseClaim,
  voluntary: message => message.clearDecline && !message.penaltyForDeclining,
  understandable: message => message.plainLanguage && message.visibleTerms,
  proportionate: message => !message.manufacturedUrgency && !message.exploitsVulnerability,
};

function mayUse(message) {
  return Object.values(ethicalCheck).every(check => check(message));
}

const proposal = {
  omitsMaterialFact: false, falseClaim: false,
  clearDecline: true, penaltyForDeclining: false,
  plainLanguage: true, visibleTerms: true,
  manufacturedUrgency: false, exploitsVulnerability: false,
};
console.assert(mayUse(proposal));

// Positive influence preserves informed choice. Hidden defaults, obstruction,
// deception, coercion, surveillance, and manufactured urgency are not acceptable tools.`;

  if (title.startsWith("Salary negotiation")) return `const offers = [
  { company: "A", base: 100, targetBonus: 10, expectedEquity: 8, pension: 5, relocation: 4, currency: "same" },
  { company: "B", base: 108, targetBonus: 5, expectedEquity: 2, pension: 3, relocation: 0, currency: "same" },
];

const comparableAnnual = offer => offer.base + offer.targetBonus + offer.expectedEquity + offer.pension + offer.relocation;
console.table(offers.map(offer => ({ company: offer.company, comparableAnnual: comparableAnnual(offer) })));

const counter = {
  appreciation: "I am excited about the role and team.",
  evidence: "The scope, level, and comparable market evidence support a higher base.",
  request: "Could we move the base to the discussed target range?",
  alternatives: "If base is fixed, could we discuss sign-on, equity, review timing, or relocation support?",
  close: "Please send any revision and all conditions in writing so I can compare the complete offer."
};

// BATNA is your best real alternative, not a bluff. Do not invent offers, reveal
// confidential data, or accept before checking equity, bonus, tax, clawbacks, and written terms.`;

  if (title.startsWith("Behavioral story bank")) return `const story = {
  id: "incident-queue-overload",
  competencies: ["ownership", "dive-deep", "communication", "learning"],
  situation: "A release caused queue growth and delayed customer jobs.",
  task: "Restore service and prevent duplicate effects while coordinating three teams.",
  decisions: ["shed low-priority work", "pause rollout", "preserve idempotency evidence"],
  actions: ["declared incident", "assigned owners", "traced queue age", "rolled back", "added capacity gate"],
  result: { recoveryMinutes: 18, duplicateEffects: 0, regressionCaught: true },
  reflection: "I should have load-tested the changed payload distribution before rollout.",
  evidence: ["incident timeline", "dashboard", "postmortem action"]
};

// Prepare 1m, 3m, and 5m versions. Keep facts and ownership identical.`;

  if (title.startsWith("Leadership,")) return `const conflictReview = {
  sharedGoal: "Protect launch date without accepting an unbounded retry design.",
  otherView: "The partner prioritized feature availability and expected autoscaling to absorb retries.",
  myView: "Load evidence showed retry amplification would exceed downstream capacity.",
  mechanism: "Wrote options, measured a failure case, proposed a bounded retry budget, invited review.",
  decision: "Ship bounded retries and an explicit degraded mode.",
  relationship: "Partner co-owned the alert and runbook.",
  outcome: "Launch met SLO during injected dependency failure.",
  learning: "Raise capacity evidence earlier, before positions harden."
};

// Avoid villains, vague 'we', cultural stereotypes, and fake perfection.`;

  if (title.startsWith("Portfolio presentations")) return `const presentation = {
  fiveMinutes: ["user problem", "one architecture", "live outcome", "one metric", "tradeoff"],
  fifteenMinutes: ["constraints", "critical path", "deep mechanism", "test/failure evidence", "next step"],
  fortyFiveMinutes: ["product demo", "architecture", "code", "operations", "incident", "discussion"],
  recovery: { recordedDemo: true, seededData: true, screenshots: true, localFallback: true },
  branches: ["React rendering", "FastAPI contracts", "PostgreSQL MVCC", "RAG evaluation", "AWS recovery"]
};

function verifyDemo() {
  return Promise.all([checkLinks(), runSmokeTest(), verifySeedData(), openDashboards(), validateBackupVideo()]);
}

// Never spend the whole interview fighting a demo; switch to evidence and continue.`;

  if (title.startsWith("Networking,")) return `const outreach = {
  context: "We worked together on the payments migration in 2024.",
  relevance: "I am targeting full-stack AI roles and saw your team is hiring for production RAG work.",
  evidence: "I recently published an evaluation and failure-testing case study.",
  ask: "Would you be open to a 15-minute perspective call? No problem if timing is poor.",
  link: "one relevant artifact"
};

const contribution = {
  issue: "reproduced and scoped",
  change: "one reviewable fix with tests",
  communication: "documented tradeoff and responded to review",
  followThrough: "updated after maintainer feedback"
};

// Personalize manually; never automate connection requests, messages, likes, or comments.`;

  if (title.startsWith("Relocation readiness")) return `const relocation = {
  country: "choose before researching",
  checkedAt: "YYYY-MM-DD",
  officialImmigrationAuthority: "exact government URL",
  visaRoute: "exact route name",
  eligibility: "verified facts and unresolved questions",
  employerRequirement: "licensed sponsor / petition / none / unknown",
  documents: [],
  leadTime: { officialEstimate: null, personalBuffer: null },
  family: { dependants: null, workRights: "verify officially" },
  offer: { base: null, bonus: null, equity: null, pension: null, insurance: null,
    leave: null, probation: null, relocation: null, clawback: null, currency: null },
  risks: [],
  professionalAdviceNeeded: []
};

// Recheck official sources at application and offer time. This tracker is not legal advice.`;

  if (title.startsWith("Mock interview loops")) return `const scorecard = {
  coding: ["clarifies", "correct invariant", "working code", "tests", "complexity", "collaborates"],
  technical: ["defines", "traces mechanism", "failure", "tradeoff", "evidence"],
  systemDesign: ["requirements", "estimates", "critical path", "reliability", "evolution"],
  behavioral: ["specific context", "personal decisions", "actions", "measured result", "reflection"],
  communication: ["structured", "concise", "checks understanding", "adapts"]
};

function schedule(error) {
  return { rootCause: classify(error), drills: ["tomorrow", "in 3 days", "in 7 days"],
    proof: "same skill on a different prompt", owner: "learner" };
}

const loop = runMock(["coding", "technical", "system-design", "behavioral"]);
console.table(loop.errors.map(schedule));

// Score observable behavior, not confidence or interviewer vibes.`;

  return fallback;
}

function infrastructureCodeFor(lesson, fallback) {
  const title = lesson.title;

  if (lesson.trackId === "cloud-aws" && /IAM identities/.test(title)) return `{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "ReadOnlyOnePrefix",
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::evidence-bucket/tenant-42/*"],
    "Condition": {"Bool": {"aws:SecureTransport": "true"}}
  }]
}

# Prove both paths with aws iam simulate-principal-policy,
# then verify the real request and CloudTrail event.`;

  if (lesson.trackId === "cloud-aws" && /VPCs, CIDR/.test(title)) return `AWSTemplateFormatVersion: "2010-09-09"
Resources:
  Vpc:
    Type: AWS::EC2::VPC
    Properties: {CidrBlock: 10.40.0.0/16, EnableDnsSupport: true, EnableDnsHostnames: true}
  AppSubnetA:
    Type: AWS::EC2::Subnet
    Properties: {VpcId: {Ref: Vpc}, CidrBlock: 10.40.16.0/20, AvailabilityZone: us-east-1a}
  DataSubnetA:
    Type: AWS::EC2::Subnet
    Properties: {VpcId: {Ref: Vpc}, CidrBlock: 10.40.64.0/20, AvailabilityZone: us-east-1a}

# Repeat in two more AZs; isolated data routes must have no internet default.`;

  if (lesson.trackId === "cloud-aws" && /S3 buckets/.test(title)) return `aws s3api put-public-access-block --bucket evidence-bucket \
  --public-access-block-configuration \
'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'

aws s3api put-bucket-versioning --bucket evidence-bucket \
  --versioning-configuration Status=Enabled

aws s3api list-object-versions --bucket evidence-bucket --prefix recovery-test/
# Delete a current version, then restore by removing its delete marker.`;

  if (lesson.trackId === "cloud-aws" && /ECR, ECS/.test(title)) return `{
  "family": "evidence-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "api",
    "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/api@sha256:DIGEST",
    "essential": true,
    "portMappings": [{"containerPort": 8000}],
    "readonlyRootFilesystem": true,
    "user": "10001",
    "stopTimeout": 30
  }]
}`;

  if (lesson.trackId === "cloud-aws" && /Lambda execution/.test(title)) return `import json
import os

def handler(event, context):
    message_id = event["Records"][0]["messageId"]
    if idempotency.claim(message_id) is False:
        return {"duplicate": True}
    try:
        process(event["Records"][0]["body"], deadline_ms=context.get_remaining_time_in_millis())
        return {"ok": True}
    except Exception:
        idempotency.release(message_id)
        raise  # let the event-source retry and eventually use its DLQ`;

  if (lesson.trackId === "cloud-aws" && /SQS, SNS/.test(title)) return `aws sqs create-queue --queue-name jobs-dlq
aws sqs create-queue --queue-name jobs \
  --attributes '{
    "VisibilityTimeout":"60",
    "ReceiveMessageWaitTimeSeconds":"20",
    "RedrivePolicy":"{\"deadLetterTargetArn\":\"DLQ_ARN\",\"maxReceiveCount\":\"5\"}"
  }'

# Consumer rule: only delete after durable success; duplicates are expected.`;

  if (lesson.trackId === "cloud-aws" && /CloudWatch metrics/.test(title)) return `aws cloudwatch put-metric-alarm \
  --alarm-name api-fast-burn \
  --namespace Evidence/API \
  --metric-name ErrorBudgetBurnRate \
  --dimensions Name=Service,Value=api \
  --statistic Average --period 60 --evaluation-periods 5 \
  --threshold 14.4 --comparison-operator GreaterThanThreshold

# Alarm a user symptom; use logs and traces to locate its cause.`;

  if (lesson.trackId === "cloud-aws" && /CloudFormation, CDK/.test(title)) return `# Review before apply; preserve the exact plan as evidence.
aws cloudformation create-change-set \
  --stack-name evidence-prod \
  --change-set-name release-2026-09-01 \
  --change-set-type UPDATE \
  --template-body file://template.yaml

aws cloudformation describe-change-set \
  --stack-name evidence-prod --change-set-name release-2026-09-01
aws cloudformation detect-stack-drift --stack-name evidence-prod`;

  if (lesson.trackId === "cloud-aws" && /Amazon Bedrock/.test(title)) return `import boto3
import json

client = boto3.client("bedrock-runtime", region_name="us-east-1")
response = client.converse(
    modelId=MODEL_ID,
    system=[{"text": SYSTEM_PROMPT}],
    messages=[{"role": "user", "content": [{"text": untrusted_question}]}],
    inferenceConfig={"maxTokens": 500, "temperature": 0},
)
answer = response["output"]["message"]["content"][0]["text"]
evaluation.record(question=untrusted_question, answer=answer, model=MODEL_ID)`;

  if (lesson.trackId === "devops" && /Shell automation/.test(title)) return `#!/usr/bin/env bash
set -Eeuo pipefail
trap 'printf "failed line=%s exit=%s\\n" "$LINENO" "$?" >&2' ERR

artifact="\${1:?usage: deploy ARTIFACT_DIGEST}"
case "$artifact" in *@sha256:*) ;; *) printf 'digest required\\n' >&2; exit 2;; esac

./deploy --artifact "$artifact" --dry-run
./deploy --artifact "$artifact"
./smoke-test --deadline 60s`;

  if (lesson.trackId === "devops" && /CI pipeline graphs/.test(title)) return `name: verified-artifact
on: [push]
permissions: {contents: read}
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make test
      - run: make build-artifact
      - uses: actions/upload-artifact@v4
        with: {name: candidate, path: dist/}
  integration:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: {name: candidate, path: dist/}
      - run: make integration-test ARTIFACT=dist/`;

  if (lesson.trackId === "devops" && /Deployment strategies/.test(title)) return `release candidate --artifact image@sha256:DIGEST --weight 5
observe candidate --window 10m \
  --require 'availability>=99.9' \
  --require 'p95_ms<=350' \
  --require 'task_success>=95'

release promote --weight 25
release promote --weight 100
# Any failed gate runs: release abort --drain --restore-stable`;

  if (lesson.trackId === "devops" && /Database delivery/.test(title)) return `-- 1. Expand: old and new versions both work.
ALTER TABLE projects ADD COLUMN display_name text;

-- 2. Backfill in small resumable batches outside one giant transaction.
UPDATE projects SET display_name = name
WHERE id > :cursor AND display_name IS NULL
ORDER BY id LIMIT 1000;

-- 3. Switch reads, verify, stop old writes, then contract later.
ALTER TABLE projects ALTER COLUMN display_name SET NOT NULL;`;

  if (lesson.trackId === "devops" && /Observability, SLIs/.test(title)) return `groups:
- name: api-slo
  rules:
  - record: api:availability:ratio_rate5m
    expr: sum(rate(http_requests_total{status!~"5.."}[5m]))
          / sum(rate(http_requests_total[5m]))
  - alert: AvailabilityFastBurn
    expr: (1 - api:availability:ratio_rate5m) / (1 - 0.999) > 14.4
    for: 5m
    labels: {severity: page}
    annotations: {runbook: "https://runbooks.example/api-availability"}`;

  if (lesson.trackId === "devops" && /Infrastructure as code/.test(title)) return `terraform init -lockfile=readonly
terraform fmt -check
terraform validate
terraform plan -out=reviewed.plan
terraform show -json reviewed.plan > reviewed-plan.json

# Policy and human review consume reviewed-plan.json.
terraform apply reviewed.plan
terraform plan -detailed-exitcode  # detect remaining drift`;

  if (lesson.trackId === "docker" && /BuildKit, multi-stage/.test(title)) return `# syntax=docker/dockerfile:1
FROM python:3.13-slim AS build
WORKDIR /src
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.13-slim AS runtime
RUN useradd --uid 10001 --create-home app
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir /wheels/*
COPY --chown=app:app . /app
USER 10001
ENTRYPOINT ["python", "-m", "app"]`;

  if (lesson.trackId === "docker" && /CMD, ENTRYPOINT/.test(title)) return `FROM python:3.13-slim
WORKDIR /app
COPY . .
USER 10001

# Exec form: Python becomes PID 1 and receives signals directly.
ENTRYPOINT ["python", "-m", "app"]
CMD ["--host", "0.0.0.0", "--port", "8000"]

# docker run image --port 9000 overrides CMD, not ENTRYPOINT.`;

  if (lesson.trackId === "docker" && /Rootless Docker/.test(title)) return `docker run --rm \
  --user 10001:10001 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --cap-drop ALL \
  --security-opt no-new-privileges=true \
  --pids-limit 100 --memory 512m --cpus 1 \
  app@sha256:DIGEST

docker inspect --format '{{json .HostConfig}}' CONTAINER_ID`;

  if (lesson.trackId === "docker" && /Docker networking/.test(title)) return `docker network create --driver bridge private-app
docker run -d --name api --network private-app api@sha256:DIGEST
docker run --rm --network private-app curlimages/curl \
  -fsS http://api:8000/health

# Only the edge container needs -p HOST:CONTAINER.
docker network inspect private-app
docker exec api cat /etc/resolv.conf`;

  if (lesson.trackId === "docker" && /Docker Compose services/.test(title)) return `services:
  api:
    build: {context: ., target: runtime}
    read_only: true
    tmpfs: [/tmp]
    depends_on:
      db: {condition: service_healthy}
    networks: [app]
  db:
    image: postgres:17@sha256:DIGEST
    volumes: [db-data:/var/lib/postgresql/data]
    healthcheck: {test: ["CMD-SHELL", "pg_isready -U postgres"], interval: 5s, timeout: 3s, retries: 12}
networks: {app: {internal: true}}
volumes: {db-data: {}}`;

  if (lesson.trackId === "docker" && /Multi-platform images/.test(title)) return `docker buildx create --name evidence-builder --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --provenance=true --sbom=true \
  --tag registry.example/app:1.0.0 \
  --push .

docker buildx imagetools inspect registry.example/app:1.0.0`;

  if (lesson.trackId === "kubernetes" && /Deployments, ReplicaSets/.test(title)) return `apiVersion: apps/v1
kind: Deployment
metadata: {name: evidence-api}
spec:
  replicas: 4
  strategy:
    rollingUpdate: {maxSurge: 1, maxUnavailable: 0}
  minReadySeconds: 10
  progressDeadlineSeconds: 300
  selector: {matchLabels: {app: evidence-api}}
  template:
    metadata: {labels: {app: evidence-api}}
    spec:
      containers:
      - name: api
        image: registry.example/api@sha256:DIGEST
        readinessProbe: {httpGet: {path: /ready, port: 8000}}`;

  if (lesson.trackId === "kubernetes" && /Services, ClusterIP/.test(title)) return `apiVersion: v1
kind: Service
metadata: {name: evidence-api}
spec:
  selector: {app: evidence-api}
  ports: [{name: http, port: 80, targetPort: 8000}]
  type: ClusterIP

# Evidence:
kubectl get service evidence-api -o yaml
kubectl get endpointslice -l kubernetes.io/service-name=evidence-api -o wide`;

  if (lesson.trackId === "kubernetes" && /Kubernetes network model/.test(title)) return `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: api-ingress, namespace: product}
spec:
  podSelector: {matchLabels: {app: api}}
  policyTypes: [Ingress, Egress]
  ingress:
  - from: [{podSelector: {matchLabels: {app: web}}}]
    ports: [{protocol: TCP, port: 8000}]
  egress:
  - to: [{namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: data}}}]
    ports: [{protocol: TCP, port: 5432}]`;

  if (lesson.trackId === "kubernetes" && /ServiceAccounts, RBAC/.test(title)) return `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: {name: job-reader, namespace: product}
rules:
- apiGroups: ["batch"]
  resources: ["jobs", "jobs/status"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: {name: worker-job-reader, namespace: product}
subjects: [{kind: ServiceAccount, name: worker}]
roleRef: {apiGroup: rbac.authorization.k8s.io, kind: Role, name: job-reader}`;

  if (lesson.trackId === "kubernetes" && /CPU and memory requests/.test(title)) return `resources:
  requests: {cpu: 250m, memory: 256Mi}
  limits: {cpu: "1", memory: 512Mi}

# Diagnose enforcement and pressure:
kubectl top pod -n product
kubectl describe pod POD -n product
kubectl get events -n product --sort-by=.lastTimestamp
kubectl get pod POD -o jsonpath='{.status.containerStatuses[*].lastState}'`;

  if (lesson.trackId === "kubernetes" && /Horizontal Pod Autoscaler/.test(title)) return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: {name: evidence-api}
spec:
  scaleTargetRef: {apiVersion: apps/v1, kind: Deployment, name: evidence-api}
  minReplicas: 3
  maxReplicas: 30
  behavior:
    scaleDown: {stabilizationWindowSeconds: 300}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: {type: Utilization, averageUtilization: 65}`;

  if (lesson.trackId === "kubernetes" && /SecurityContext/.test(title)) return `spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile: {type: RuntimeDefault}
  containers:
  - name: api
    image: registry.example/api@sha256:DIGEST
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities: {drop: ["ALL"]}
    volumeMounts: [{name: tmp, mountPath: /tmp}]
  volumes: [{name: tmp, emptyDir: {medium: Memory, sizeLimit: 64Mi}}]`;

  if (lesson.trackId === "kubernetes" && /Kubernetes debugging/.test(title)) return `kubectl get pod POD -o wide
kubectl describe pod POD
kubectl logs POD -c APP --previous
kubectl get events --field-selector involvedObject.name=POD --sort-by=.lastTimestamp
kubectl debug pod/POD -it --image=nicolaka/netshoot --target=APP
kubectl get pod POD -o jsonpath='{.status.conditions}'

# Start at status and owner; follow evidence to scheduler, kubelet, runtime,
# network, storage, or application instead of restarting randomly.`;

  return fallback;
}

function apiDistributedDiagramFor(lesson, title, flow) {
  if (lesson.trackId === "api-distributed-systems" && /http|resource|representation|status code|validation|idempotency key|etag|pagination|filtering|versioning|rest|openapi|grpc|graphql|authentication|gateway|api security|api observability|api testing|developer experience/.test(title)) {
    return flow("api-contract-request", [
      ["01 · INTENT", "Client forms a contract request", "Method or operation, identity, representation, validators, deadline, and version enter."],
      ["02 · BOUNDARY", "Intermediary and service apply policy", "Routing, authentication, limits, parsing, validation, and authorization constrain work."],
      ["03 · AUTHORITY", "Owned state evaluates the transition", "Preconditions, invariants, idempotency, transaction, and dependencies decide outcome."],
      ["04 · CONTRACT", "Stable response returns", "Status, representation, error type, cache metadata, telemetry, and compatibility become evidence."]
    ], "Repeat or condition the same request through one intermediary and predict every observable difference.", "Raw request and response, route, principal, validator, transaction result, cache status, span, stable error, and client test.");
  }
  if (lesson.trackId === "api-distributed-systems" && /webhook|sse|websocket|bidirectional stream/.test(title)) {
    return flow("api-stream-delivery", [
      ["01 · EVENT", "Producer creates identified data", "Schema version, sequence, signature input, authorization, and resume position enter."],
      ["02 · CONNECTION", "Long-lived or retried transport carries it", "Framing, intermediaries, buffers, heartbeat, timeout, and reconnect apply."],
      ["03 · CONSUMER", "Receiver authenticates and advances", "Bounds, deduplication, ordering, backpressure, and local transaction protect effects."],
      ["04 · RECOVER", "Ack, resume, retry, or close follows", "Delivery identity, lag, queue depth, reconnection, duplicate effects, and cleanup prove behavior."]
    ], "Pause the consumer until buffers fill, then disconnect it after the effect but before acknowledgement.", "Raw frame, signature, sequence, queue bytes, heartbeat, reconnect cursor, inbox identity, acknowledgement, and final state.");
  }
  if (lesson.trackId === "api-distributed-systems" && /physical clock|logical clock|happens-before|lamport|vector clock/.test(title)) {
    return flow("distributed-time", [
      ["01 · LOCAL EVENT", "A process observes or changes state", "Wall time, monotonic time, and logical state may all differ."],
      ["02 · SEND", "Message carries ordering evidence", "Timestamp, Lamport value, vector, version, or causal token leaves one process."],
      ["03 · RECEIVE", "Another process merges knowledge", "Delay and skew prevent arrival time from proving original global order."],
      ["04 · RELATE", "System decides order or concurrency", "Causal relation, conflict, duration, lease check, or arbitrary tie-break becomes explicit."]
    ], "Move one wall clock backward and deliver two independent messages in opposite orders.", "Wall and monotonic readings, message edges, Lamport values, vectors, conflicts, lease result, and chosen order.");
  }
  if (lesson.trackId === "api-distributed-systems" && /latency|timeout|deadline|retr|overload|backpressure|admission|load shedding|circuit breaker|bulkhead/.test(title)) {
    return flow("resilience-budget", [
      ["01 · BUDGET", "Request enters with finite value", "Deadline, attempt, concurrency, queue, priority, and retry budgets state limits."],
      ["02 · DEPENDENCY", "Work consumes time and capacity", "Latency distribution, fan-out, saturation, and partial failure shape progress."],
      ["03 · CONTROL", "System cancels, retries, isolates, or sheds", "Backoff, jitter, admission, bulkhead, breaker, and degradation bound amplification."],
      ["04 · EVIDENCE", "Outcome closes every resource", "Attempts, queue time, tail latency, rejected work, cancellation, utilization, and leaks reveal control."]
    ], "Slow one dependency past its budget while increasing arrival rate beyond service capacity.", "Deadline remaining, attempts, queue depth, active work, breaker state, shed count, p99 latency, dependency load, and open resources.");
  }
  if (lesson.trackId === "api-distributed-systems" && /queue|publish-subscribe|broker|delivery semantic|ordering|consumer group|poison|dead-letter|outbox|inbox|cdc/.test(title)) {
    return flow("message-delivery", [
      ["01 · PUBLISH", "Producer emits identified intent or fact", "Envelope, partition key, schema, transaction, and acknowledgement requirement enter."],
      ["02 · BROKER", "Durable channel stores and assigns", "Partition, replica, offset or visibility, retention, flow control, and consumer ownership apply."],
      ["03 · PROCESS", "Consumer creates a local effect", "Ordering, inbox, transaction, timeout, crash, and external dependencies determine success."],
      ["04 · SETTLE", "Ack, commit, retry, quarantine, or replay", "Position, lag, attempts, duplicate identity, DLQ state, and business effect prove semantics."]
    ], "Crash at every boundary before and after the side effect and acknowledgement.", "Event ID, broker position, assignment, delivery count, inbox row, local effect, committed offset, lag, retry, and quarantine record.");
  }
  if (lesson.trackId === "api-distributed-systems" && /saga|compensat|two-phase commit|distributed transaction/.test(title)) {
    return flow("distributed-workflow", [
      ["01 · DECIDE", "Workflow records the next durable step", "State, version, idempotency, deadline, and participant ownership define intent."],
      ["02 · EXECUTE", "Participant commits a local transition", "Prepare or forward action may succeed while the response is lost."],
      ["03 · RESOLVE", "Coordinator observes result or uncertainty", "Retry, commit decision, compensation, timer, or manual repair advances state."],
      ["04 · HISTORY", "One explainable outcome remains", "Durable decisions, locks, step attempts, compensations, invariant, and final state support recovery."]
    ], "Stop the coordinator after a participant commits but before the result is recorded.", "Workflow history, participant transaction, prepared state, locks, operation identity, compensation result, timer, and final invariant.");
  }
  if (lesson.trackId === "api-distributed-systems" && /single-leader|multi-leader|leaderless|consistency model|cap theorem/.test(title)) {
    return flow("replicated-operation", [
      ["01 · CLIENT", "Operation targets replicated state", "Required consistency, session token, version, and deadline define acceptable outcomes."],
      ["02 · REPLICAS", "Leaders or quorums coordinate versions", "Log position, acknowledgements, causal metadata, and topology govern visibility."],
      ["03 · FAILURE", "Lag, conflict, or partition intervenes", "Some nodes respond, reject, diverge, or remain uncertain according to policy."],
      ["04 · CONVERGE", "Read, repair, failover, or merge completes", "History, positions, conflicts, staleness, lost writes, and product invariant expose the guarantee."]
    ], "Partition one replica group immediately after a write acknowledgement, then read from every side.", "Version, log or vector position, quorum responses, session token, lag, conflict siblings, repair, failover, and returned value.");
  }
  if (lesson.trackId === "api-distributed-systems" && /consensus|raft|membership|failure detection|lease|distributed lock|fencing|split brain/.test(title)) {
    return flow("consensus-authority", [
      ["01 · PROPOSE", "Node proposes command or authority", "Term, log prefix, membership, lease, and candidate state enter."],
      ["02 · QUORUM", "Peers vote or acknowledge", "Majority intersection and log freshness prevent conflicting committed histories."],
      ["03 · COMMIT", "Decision becomes durable authority", "Leader applies ordered state and issues a position or fencing token."],
      ["04 · RECOVER", "Stale and failed nodes rejoin safely", "Terms, committed prefix, membership transition, rejected stale write, and state match prove safety."]
    ], "Partition the leader into a minority, elect a new leader, then let the old leader send a late write.", "Terms, votes, logs, commit indexes, membership, lease time, fencing token, rejected write, and applied state.");
  }
  if (lesson.trackId === "api-distributed-systems" && /sharding|service discovery|load balancing|multi-region|cqrs|event sourcing|materialized view/.test(title)) {
    return flow("distributed-placement", [
      ["01 · ROUTE", "Key or request maps to an owner", "Partition key, ring, region, discovery view, locality, and consistency need guide placement."],
      ["02 · SERVE", "Selected node executes local work", "Capacity, connection state, authoritative data, projection, and replication position apply."],
      ["03 · CHANGE", "Membership, load, or region state shifts", "Rebalance, failover, endpoint churn, projection rebuild, or conflict moves responsibility."],
      ["04 · VERIFY", "Traffic and data settle safely", "Skew, moved keys, stale routes, lag, capacity, conflicts, RPO, RTO, and query result prove the design."]
    ], "Remove one owner during a hot-key spike and route traffic before every client refreshes membership.", "Routing decision, owner map, outstanding work, key movement, hotspot, replica or projection position, failover, RPO, RTO, and result.");
  }
  if (lesson.trackId === "api-distributed-systems" && /system design|production architecture capstone/.test(title)) {
    return flow("system-design-evolution", [
      ["01 · REQUIRE", "Product need becomes explicit constraints", "Users, scale, latency, consistency, security, geography, cost, and success are quantified."],
      ["02 · DESIGN", "Ownership and critical paths emerge", "APIs, data, messages, placement, capacity, and invariants form one traceable system."],
      ["03 · STRESS", "Load and failure challenge assumptions", "Hotspots, tail latency, retries, partitions, recovery, and human operation reveal bottlenecks."],
      ["04 · EVOLVE", "Evidence drives the next architecture", "SLOs, traces, load tests, costs, incidents, migration, and rollback support each change."]
    ], "Change one dominant constraint after the first design and evolve it without discarding guarantees.", "Estimates, diagram, invariant table, critical trace, load curve, failure result, SLO, cost, migration steps, and rollback.");
  }
  return undefined;
}

function teachingProfileFor(lesson, profile) {
  if (lesson.trackId === "computer-science") {
    return {
      ...profile,
      sourceLabel: "MIT 6.006 Introduction to Algorithms",
      sourceUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/",
      commentPrefix: "//",
      code: computerScienceCodeFor(lesson.title, profile.code)
    };
  }
  if (lesson.trackId === "systems-foundations") {
    let sourceLabel = "RFC 9110 HTTP Semantics";
    let sourceUrl = "https://www.rfc-editor.org/rfc/rfc9110.html";
    if (/IPv4|Routing tables/.test(lesson.title)) {
      sourceLabel = "RFC 4632 CIDR addressing and routing";
      sourceUrl = "https://www.rfc-editor.org/rfc/rfc4632.html";
    } else if (/UDP, TCP|TCP flow control/.test(lesson.title)) {
      sourceLabel = "RFC 9293 Transmission Control Protocol";
      sourceUrl = "https://www.rfc-editor.org/rfc/rfc9293.html";
    } else if (/System calls/.test(lesson.title)) {
      sourceLabel = "Linux system calls manual";
      sourceUrl = "https://man7.org/linux/man-pages/man2/syscalls.2.html";
    } else if (/Processes, threads/.test(lesson.title)) {
      sourceLabel = "Linux scheduler documentation";
      sourceUrl = "https://docs.kernel.org/scheduler/";
    } else if (/Race conditions/.test(lesson.title)) {
      sourceLabel = "Linux kernel locking documentation";
      sourceUrl = "https://docs.kernel.org/locking/";
    } else if (/Address spaces/.test(lesson.title)) {
      sourceLabel = "Linux memory-management documentation";
      sourceUrl = "https://docs.kernel.org/mm/";
    } else if (/I\/O, disks/.test(lesson.title)) {
      sourceLabel = "Linux virtual filesystem documentation";
      sourceUrl = "https://docs.kernel.org/filesystems/vfs.html";
    } else if (/Namespaces/.test(lesson.title)) {
      sourceLabel = "Linux namespaces manual";
      sourceUrl = "https://man7.org/linux/man-pages/man7/namespaces.7.html";
    }
    return {
      ...profile,
      sourceLabel,
      sourceUrl,
      commentPrefix: "#",
      code: systemsFoundationsCodeFor(lesson.title, profile.code)
    };
  }
  if (lesson.trackId === "lld-machine-coding") {
    let sourceLabel = "Python data model documentation";
    let sourceUrl = "https://docs.python.org/3/reference/datamodel.html";
    if (/Object relationships/.test(lesson.title)) {
      sourceLabel = "OMG UML 2.5.1 specification";
      sourceUrl = "https://www.omg.org/spec/UML/2.5.1/";
    } else if (/Interfaces/.test(lesson.title)) {
      sourceLabel = "Python typing protocols documentation";
      sourceUrl = "https://docs.python.org/3/library/typing.html#typing.Protocol";
    } else if (/State machines/.test(lesson.title)) {
      sourceLabel = "Python enum documentation";
      sourceUrl = "https://docs.python.org/3/library/enum.html";
    } else if (/Concurrency/.test(lesson.title)) {
      sourceLabel = "Python threading documentation";
      sourceUrl = "https://docs.python.org/3/library/threading.html";
    } else if (/Repositories/.test(lesson.title)) {
      sourceLabel = "Martin Fowler's data source architectural patterns";
      sourceUrl = "https://martinfowler.com/eaaCatalog/";
    } else if (/Testable design/.test(lesson.title)) {
      sourceLabel = "Python unittest documentation";
      sourceUrl = "https://docs.python.org/3/library/unittest.html";
    } else if (/Strategy/.test(lesson.title)) {
      sourceLabel = "Design Patterns: Elements of Reusable Object-Oriented Software";
      sourceUrl = "https://www.pearson.com/en-us/subject-catalog/p/design-patterns-elements-of-reusable-object-oriented-software/P200000009480/9780201633610";
    }
    return {
      ...profile,
      sourceLabel,
      sourceUrl,
      commentPrefix: "#",
      code: lldMachineCodingCodeFor(lesson.title, profile.code)
    };
  }
  if (lesson.trackId === "software-design") {
    let sourceLabel = "Google engineering practices for code review";
    let sourceUrl = "https://google.github.io/eng-practices/review/reviewer/looking-for.html";
    if (/Cohesion|Single Responsibility|Liskov Substitution|Composition/.test(lesson.title)) {
      sourceLabel = "Microsoft object-oriented design principles";
      sourceUrl = "https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/";
    } else if (/Design pattern literacy|Creational patterns|Structural patterns|Behavioral patterns/.test(lesson.title)) {
      sourceLabel = "Design Patterns: Elements of Reusable Object-Oriented Software";
      sourceUrl = "https://www.pearson.com/en-us/subject-catalog/p/design-patterns-elements-of-reusable-object-oriented-software/P200000009480/9780201633610";
    } else if (/Code smells/.test(lesson.title)) {
      sourceLabel = "Martin Fowler's Refactoring catalog";
      sourceUrl = "https://refactoring.com/catalog/";
    } else if (/Architecture patterns/.test(lesson.title)) {
      sourceLabel = "Microsoft application architecture fundamentals";
      sourceUrl = "https://learn.microsoft.com/en-us/azure/architecture/guide/";
    }
    return {
      ...profile,
      sourceLabel,
      sourceUrl,
      commentPrefix: "//",
      code: softwareDesignCodeFor(lesson.title, profile.code)
    };
  }
  if (lesson.trackId === "api-distributed-systems" && lesson.title.startsWith("Layer 4 and Layer 7 load balancing")) {
    return {
      ...profile,
      sourceLabel: "AWS Elastic Load Balancing documentation",
      sourceUrl: "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html",
      commentPrefix: "//",
      code: `type Target = { id: string; healthy: boolean; outstanding: number; zone: string };

function leastOutstanding(targets: readonly Target[], localZone: string): Target {
  const healthy = targets.filter(target => target.healthy);
  if (!healthy.length) throw new Error("no healthy targets");
  const local = healthy.filter(target => target.zone === localZone);
  return (local.length ? local : healthy).reduce((best, target) =>
    target.outstanding < best.outstanding ? target : best);
}

function layer7Route(request: Request): "api" | "static" {
  const url = new URL(request.url);
  if (url.hostname === "api.example.com" || url.pathname.startsWith("/api/")) return "api";
  return "static";
}

const targets = [
  { id: "a", healthy: true, outstanding: 8, zone: "az-1" },
  { id: "b", healthy: true, outstanding: 2, zone: "az-1" },
  { id: "c", healthy: false, outstanding: 0, zone: "az-2" },
];
console.assert(leastOutstanding(targets, "az-1").id === "b");

// Layer 4 selects from address, port, and transport flow without parsing HTTP.
// Layer 7 terminates HTTP and can route by host, path, headers, or method.
// Production also needs connection draining, truthful health, TLS ownership,
// source-address handling, retry limits, overload control, and per-target metrics.`
    };
  }
  if (lesson.trackId === "service-architecture-events") {
    let sourceLabel = "Microsoft microservices architecture guidance";
    let sourceUrl = "https://learn.microsoft.com/en-us/azure/architecture/microservices/";
    if (lesson.title.startsWith("Strategic domain-driven design")) {
      sourceLabel = "Microsoft domain analysis guidance";
      sourceUrl = "https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis";
    } else if (lesson.title.startsWith("Tactical domain-driven design")) {
      sourceLabel = "Microsoft tactical DDD guidance";
      sourceUrl = "https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd";
    } else if (/Commands|Event-driven architecture/.test(lesson.title)) {
      sourceLabel = "Microsoft event-driven architecture guidance";
      sourceUrl = "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven";
    } else if (/Kafka/.test(lesson.title) || lesson.title.startsWith("Event schemas")) {
      sourceLabel = "Apache Kafka documentation";
      sourceUrl = lesson.title.startsWith("Kafka architecture")
        ? "https://kafka.apache.org/documentation/"
        : "https://kafka.apache.org/41/design/design/";
    }
    return {
      ...profile,
      sourceLabel,
      sourceUrl,
      commentPrefix: /Kafka architecture|Kafka replication/.test(lesson.title) ? "#" : "//",
      code: serviceArchitectureCodeFor(lesson.title, profile.code)
    };
  }
  if (lesson.trackId === "ai-application-engineering" && lesson.title.startsWith("Tool calling")) {
    return {
      ...profile,
      commentPrefix: "#",
      code: `def lookup_order(arguments: dict) -> dict:
    order_id = arguments.get("order_id")
    if not isinstance(order_id, str) or set(arguments) != {"order_id"}:
        raise ValueError("expected one string order_id")
    return {"order_id": order_id, "status": "packed"}

TOOLS = {"lookup_order": {"handler": lookup_order, "needs_approval": False}}

def execute_tool(call: dict, completed: dict, audit: list, approved: bool = False) -> dict:
    name = call.get("name")
    if name not in TOOLS:
        raise ValueError("tool not allowed")
    tool = TOOLS[name]
    if tool["needs_approval"] and not approved:
        raise PermissionError("approval required")
    key = call.get("idempotency_key")
    if not isinstance(key, str) or not key:
        raise ValueError("idempotency_key required")
    if key not in completed:
        completed[key] = tool["handler"](call.get("arguments", {}))
        audit.append({"tool": name, "idempotency_key": key, "outcome": "executed"})
    return completed[key]

completed, audit = {}, []
call = {"name": "lookup_order", "arguments": {"order_id": "A-42"}, "idempotency_key": "req-1"}
assert execute_tool(call, completed, audit) == execute_tool(call, completed, audit)
assert len(audit) == 1  # A retry did not repeat the effect.

# The model proposes structured data; application code validates, authorizes,
# executes, deduplicates, and records the real side effect.`
    };
  }
  if (lesson.trackId === "agents" && lesson.title.startsWith("Tool design")) {
    return {
      ...profile,
      sourceLabel: "LangChain context engineering documentation",
      sourceUrl: "https://docs.langchain.com/oss/python/langchain/context-engineering",
      commentPrefix: "#",
      code: `from dataclasses import dataclass, field

@dataclass
class AgentState:
    goal: str
    observations: list[str] = field(default_factory=list)  # working state

durable_memory: dict[str, list[str]] = {}

def remember(user_id: str, fact: str, *, consent: bool) -> None:
    if not consent:
        raise PermissionError("durable memory requires consent")
    durable_memory.setdefault(user_id, []).append(fact)

def build_context(user_id: str, state: AgentState, max_items: int = 4) -> list[str]:
    if max_items < 1:
        raise ValueError("max_items must be positive")
    candidates = [f"Goal: {state.goal}", *durable_memory.get(user_id, []), *state.observations[-2:]]
    return candidates[-max_items:]  # selection policy, not an unbounded transcript dump

state = AgentState("answer concisely", ["order A-42", "status packed"])
remember("u-1", "prefers email updates", consent=True)
context = build_context("u-1", state)
assert context == ["Goal: answer concisely", "prefers email updates", "order A-42", "status packed"]

# Conversation history is raw events; state is current progress; context is the
# selected model input; durable memory is intentionally retained across runs.`
    };
  }
  if (lesson.trackId === "agents" && lesson.title.startsWith("LLM system blueprint")) {
    return {
      ...profile,
      sourceLabel: "LangChain agents and ReAct documentation",
      sourceUrl: "https://docs.langchain.com/oss/python/langchain/agents",
      commentPrefix: "#",
      code: `from collections.abc import Callable

Tool = Callable[[str], str]
tools: dict[str, Tool] = {
    "lookup_order": lambda order_id: "packed" if order_id == "A-42" else "not found"
}

def run_react(model, question: str, max_steps: int = 3) -> str:
    messages = [{"role": "user", "content": question}]
    for _ in range(max_steps):
        decision = model(messages)  # reason, then propose a tool call or final answer
        if decision["type"] == "final":
            return decision["answer"]
        name, argument = decision["tool"], decision["argument"]
        if name not in tools:
            raise ValueError(f"tool not allowed: {name}")
        observation = tools[name](argument)
        messages += [decision, {"role": "tool", "name": name, "content": observation}]
    raise RuntimeError("agent step budget exhausted")

def scripted_model(messages):
    if messages[-1]["role"] == "user":
        return {"type": "tool", "tool": "lookup_order", "argument": "A-42"}
    return {"type": "final", "answer": f"Order is {messages[-1]['content']}."}

assert run_react(scripted_model, "Where is A-42?") == "Order is packed."

# Production blueprint: authenticate input -> assemble bounded context -> model
# -> validate and authorize tool proposal -> execute -> return observation to state
# -> stop or repeat -> validate output. Persist only selected memory; trace and
# evaluate every boundary. Never expose hidden reasoning as an application contract.`
    };
  }
  if (lesson.trackId === "agents" && /Model Context Protocol|MCP transports/.test(lesson.title)) {
    if (lesson.title.startsWith("Model Context Protocol")) {
      return {
        ...profile,
        sourceLabel: "Model Context Protocol architecture and lifecycle specification",
        sourceUrl: "https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle",
        commentPrefix: "#",
        code: `# minimal_mcp_server.py — newline-delimited JSON-RPC over MCP stdio
import json
import sys

PROTOCOL = "2025-11-25"

def reply(request, result=None, error=None):
    message = {"jsonrpc": "2.0", "id": request["id"]}
    message["error" if error else "result"] = error or result
    print(json.dumps(message, separators=(",", ":")), flush=True)

def dispatch(request):
    method = request.get("method")
    params = request.get("params", {})
    if method == "initialize":
        return {
            "protocolVersion": PROTOCOL,
            "capabilities": {"tools": {}, "resources": {}, "prompts": {}},
            "serverInfo": {"name": "interview-tutor", "version": "0.1.0"},
        }
    if method == "tools/list":
        return {"tools": [{
            "name": "explain_term",
            "description": "Explain one technical term in simple language",
            "inputSchema": {
                "type": "object",
                "properties": {"term": {"type": "string", "maxLength": 80}},
                "required": ["term"],
                "additionalProperties": False,
            },
        }]}
    if method == "tools/call":
        if params.get("name") != "explain_term":
            raise ValueError("unknown tool")
        term = params.get("arguments", {}).get("term", "").strip()
        if not term or len(term) > 80:
            raise ValueError("invalid term")
        return {"content": [{"type": "text", "text": term + " is a concept to investigate."}]}
    if method == "resources/list":
        return {"resources": [{"uri": "lesson://roadmap", "name": "Roadmap"}]}
    if method == "resources/read":
        if params.get("uri") != "lesson://roadmap":
            raise ValueError("unknown resource")
        return {"contents": [{"uri": "lesson://roadmap", "text": "MCP -> RAG -> evaluation"}]}
    if method == "prompts/list":
        return {"prompts": [{"name": "quiz", "description": "Start a short quiz"}]}
    if method == "prompts/get":
        return {"messages": [{"role": "user", "content": {"type": "text", "text": "Quiz me."}}]}
    raise LookupError("method not found")

for line in sys.stdin:
    request = None
    try:
        request = json.loads(line)
        if "id" not in request:  # A notification has no response.
            continue
        reply(request, result=dispatch(request))
    except (ValueError, LookupError, json.JSONDecodeError) as exc:
        if isinstance(request, dict) and "id" in request:
            reply(request, error={"code": -32602, "message": str(exc)})`
      };
    }
    return {
      ...profile,
      sourceLabel: "Model Context Protocol transport and authorization specification",
      sourceUrl: "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports",
      commentPrefix: "//",
      code: `// Security boundary around a Streamable HTTP MCP endpoint.
const trustedOrigins = new Set(["https://assistant.example"]);

export async function handleMcp(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && !trustedOrigins.has(origin)) return new Response("Forbidden origin", { status: 403 });
  if (request.headers.get("mcp-protocol-version") !== "2025-11-25") {
    return new Response("Unsupported protocol", { status: 400 });
  }

  const token = await verifyAccessToken(request.headers.get("authorization"));
  if (token.aud !== "https://mcp.example") return new Response("Wrong audience", { status: 401 });
  if (!token.scopes.includes("lessons:read")) return new Response("Insufficient scope", { status: 403 });

  const raw = await readBodyWithLimit(request, 64_000);
  const rpc = parseAndValidateJsonRpc(raw);       // Reject unknown fields and invalid IDs.
  const session = await loadOwnedSession(request.headers.get("mcp-session-id"), token.sub);
  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort(), { once: true });

  const result = await withDeadline(
    () => dispatchAllowlistedMethod(rpc, { token, session, signal: controller.signal }),
    10_000,
  );
  await appendAuditEvent({ actor: token.sub, method: rpc.method, requestId: rpc.id, outcome: "ok" });
  return jsonRpcResponse(rpc.id, result, { sessionId: session.id });
}

// Mutating tools also need per-call consent, argument validation, idempotency,
// least-privilege credentials, output limits, cancellation, and trace IDs.`
    };
  }
  if (lesson.trackId === "retrieval-rag" && lesson.title.startsWith("Vector database")) {
    const internals = lesson.title.startsWith("Vector database storage");
    return {
      ...profile,
      sourceLabel: internals ? "Qdrant storage internals documentation" : "pgvector official documentation",
      sourceUrl: internals ? "https://qdrant.tech/documentation/manage-data/storage/" : "https://github.com/pgvector/pgvector",
      commentPrefix: internals ? "#" : "--",
      code: internals ? `# Exercise a local Qdrant collection through its HTTP API.
collection=lesson_vectors
base=http://localhost:6333

curl -fsS -X PUT "$base/collections/$collection" \\
  -H 'content-type: application/json' \\
  -d '{"vectors":{"size":3,"distance":"Cosine"},"shard_number":2,"replication_factor":2}'

# Upsert, update, and delete churn creates new versions and tombstones in segments.
curl -fsS -X PUT "$base/collections/$collection/points?wait=true" \\
  -H 'content-type: application/json' \\
  -d '{"points":[{"id":1,"vector":[1,0,0],"payload":{"tenant":"a"}},{"id":2,"vector":[0,1,0],"payload":{"tenant":"b"}}]}'
curl -fsS -X DELETE "$base/collections/$collection/points?wait=true" \\
  -H 'content-type: application/json' -d '{"points":[2]}'

# Inspect segment, optimizer, and indexed-vector counts before and after churn.
curl -fsS "$base/collections/$collection"
curl -fsS -X POST "$base/collections/$collection/snapshots"
curl -fsS "$base/collections/$collection/snapshots"

# Record recall@k and p95 latency before maintenance and after snapshot restore.
# A valid recovery check also confirms the deleted point stays absent and a
# tenant=a filter can never return tenant=b payloads.` : `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE passages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL,
  embedding_model text NOT NULL,
  embedding vector(3) NOT NULL,
  body text NOT NULL,
  UNIQUE (tenant_id, body)
);

INSERT INTO passages (tenant_id, embedding_model, embedding, body) VALUES
  (7, 'demo-v1', '[1,0,0]', 'React renders components'),
  (7, 'demo-v1', '[0.9,0.1,0]', 'React reconciles trees'),
  (8, 'demo-v1', '[0,1,0]', 'Private Python note');

-- Metric and operator class must match: cosine distance uses <=>.
SELECT id, body, embedding <=> '[1,0,0]' AS distance
FROM passages
WHERE tenant_id = 7 AND embedding_model = 'demo-v1'
ORDER BY embedding <=> '[1,0,0]'
LIMIT 2;

CREATE INDEX passages_hnsw_cosine ON passages
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX passages_tenant ON passages (tenant_id);

BEGIN;
SET LOCAL hnsw.ef_search = 100;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM passages WHERE tenant_id = 7
ORDER BY embedding <=> '[1,0,0]' LIMIT 2;
ROLLBACK;

-- Re-run after UPDATE and DELETE. Compare IDs with an exact baseline by
-- disabling index scans; approximate search must be measured, not assumed.`
    };
  }
  if (lesson.trackId === "retrieval-rag" && lesson.title.startsWith("Vector index internals")) {
    return {
      ...profile,
      sourceLabel: "pgvector HNSW and IVFFlat documentation",
      sourceUrl: "https://github.com/pgvector/pgvector#hnsw",
      commentPrefix: "#",
      code: `from math import sqrt

def l2(a, b):
    return sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

def exact_top_k(rows, query, k):
    return sorted(rows, key=lambda row: l2(row[1], query))[:k]

def recall_at_k(expected, actual, k):
    wanted = {row[0] for row in expected[:k]}
    found = {row[0] for row in actual[:k]}
    return len(wanted & found) / k

rows = [("a", [0.0, 0.0]), ("b", [0.1, 0.0]),
        ("c", [0.9, 1.0]), ("d", [1.0, 1.0])]
queries = [[0.05, 0.0], [0.95, 1.0]]

# Replace this function with HNSW/IVF calls under test. Log visited nodes for
# HNSW or probed centroid lists for IVF so a missed neighbor is explainable.
def candidate_search(rows, query, k):
    return exact_top_k(rows, query, k)

for query in queries:
    truth = exact_top_k(rows, query, 2)
    candidate = candidate_search(rows, query, 2)
    print(query, candidate, "recall@2=", recall_at_k(truth, candidate, 2))

# HNSW: sweep m, ef_construction, and ef_search.
# IVF: train representative centroids; sweep lists and probes.
# PQ: sweep subvector count and code width, then rerank compressed candidates.
# Record build time, bytes/vector, p50/p95 latency, update cost, and recall.
assert recall_at_k(exact_top_k(rows, queries[0], 2), candidate_search(rows, queries[0], 2), 2) == 1.0`
    };
  }
  if (lesson.trackId === "ai-application-engineering" && /AI frontend streaming|Generative UI|Conversation persistence/.test(lesson.title)) {
    if (lesson.title.startsWith("AI frontend streaming")) {
      return {
        ...profile,
        sourceLabel: "AI SDK UI stream protocol documentation",
        sourceUrl: "https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol",
        commentPrefix: "//",
        code: `type StreamEvent = { id?: string; event: string; data: unknown };

export async function* readSse(response: Response): AsyncGenerator<StreamEvent> {
  if (!response.ok || !response.body) throw new Error("stream unavailable");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const { value = "", done } = await reader.read();
      buffer = (buffer + value).replaceAll("\\r\\n", "\\n");
      // One network chunk may contain half or many SSE events.
      let boundary;
      while ((boundary = buffer.indexOf("\\n\\n")) >= 0) {
        const block = buffer.slice(0, boundary).replaceAll("\\r", "");
        buffer = buffer.slice(boundary + 2);
        let id: string | undefined;
        let event = "message";
        const data: string[] = [];
        for (const line of block.split("\\n")) {
          if (line.startsWith("id:")) id = line.slice(3).trimStart();
          else if (line.startsWith("event:")) event = line.slice(6).trimStart();
          else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        }
        if (data.length) yield { id, event, data: JSON.parse(data.join("\\n")) };
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}

const controller = new AbortController();
const response = await fetch("/api/chat", { method: "POST", signal: controller.signal });
for await (const event of readSse(response)) {
  applyTypedEvent(event);               // Batch visible updates per animation frame.
  saveResumeCursor(event.id);           // Reconnect with the last committed event ID.
}
// A Stop button calls controller.abort(); the server must propagate cancellation.`
      };
    }
    if (lesson.title.startsWith("Generative UI")) {
      return {
        ...profile,
        sourceLabel: "AI SDK UI tool invocation documentation",
        sourceUrl: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage",
        commentPrefix: "//",
        code: `type Part =
  | { type: "text"; text: string }
  | { type: "citation"; title: string; href: string }
  | { type: "tool"; callId: string; name: string; state: "proposed" | "approved" | "running" | "done" | "error"; input: unknown; output?: unknown };

function MessagePart({ part }: { part: Part }) {
  switch (part.type) {
    case "text": return <p>{part.text}</p>;
    case "citation": return <a href={part.href}>{part.title}</a>;
    case "tool": return <section aria-label={"Tool: " + part.name}>
      <p aria-live="polite">{part.state}</p>
      {part.state === "proposed" && <>
        <pre>{JSON.stringify(part.input, null, 2)}</pre>
        <button onClick={() => decide(part.callId, "approve")}>Approve</button>
        <button onClick={() => decide(part.callId, "reject")}>Reject</button>
      </>}
      {part.state === "error" && <button onClick={() => retry(part.callId)}>Retry</button>}
    </section>;
    default: return assertNever(part); // New protocol parts cannot fail silently.
  }
}

async function decide(callId: string, decision: "approve" | "reject") {
  // The server reauthorizes the user and tool; UI approval is not authority.
  await fetch("/api/tool-decisions", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": callId + ":" + decision },
    body: JSON.stringify({ callId, decision }),
  });
}`
      };
    }
    return {
      ...profile,
      sourceLabel: "AI SDK UI persistence and resume-stream documentation",
      sourceUrl: "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence",
      commentPrefix: "//",
      code: `type Event = { streamId: string; sequence: number; type: string; payload: unknown };

export async function postMessage(request: Request, chatId: string) {
  const user = await requireUser(request);
  await requireChatOwner(chatId, user.id);          // Server authority, never client claims.
  const input = await validateMessage(await request.json());
  const key = request.headers.get("idempotency-key");
  if (!key) return new Response("Missing idempotency key", { status: 400 });

  const accepted = await messages.insertOnce({
    chatId, userId: user.id, idempotencyKey: key,
    messageId: crypto.randomUUID(), input,
  });
  const stream = await streams.startOnce(accepted.messageId);
  return streamResponse(stream, { after: 0 });
}

export async function resume(request: Request, chatId: string) {
  const user = await requireUser(request);
  await requireChatOwner(chatId, user.id);
  const after = Number(new URL(request.url).searchParams.get("after") || 0);
  if (!Number.isSafeInteger(after) || after < 0) return new Response("Bad cursor", { status: 400 });

  // Events have unique(stream_id, sequence). Replayed events rebuild the same UI.
  const events: Event[] = await streams.readAfter(chatId, after);
  return sse(events, { cacheControl: "no-store" });
}

// Tests: duplicate POST, disconnect/resume, concurrent tabs, ownership denial,
// deletion during generation, malformed stored parts, and redacted telemetry.`
    };
  }
  if (lesson.trackId === "quality-security" && /Production webhooks|Application file storage|Background jobs|Audit logs|Admin systems/.test(lesson.title)) {
    if (lesson.title.startsWith("Production webhooks")) {
      return {
        ...profile,
        sourceLabel: "Stripe webhook production guidance",
        sourceUrl: "https://docs.stripe.com/webhooks",
        commentPrefix: "//",
        code: `import { createHmac, timingSafeEqual } from "node:crypto";

function sign(secret: string, timestamp: number, rawBody: Buffer) {
  return createHmac("sha256", secret).update(timestamp + ".").update(rawBody).digest("hex");
}

function verify(rawBody: Buffer, header: string, secrets: string[], now = Date.now()) {
  const fields = Object.fromEntries(header.split(",").map(v => v.split("=", 2)));
  const timestamp = Number(fields.t);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300) throw new Error("stale event");
  const supplied = Buffer.from(fields.v1 || "", "hex");
  const valid = secrets.some(secret => {
    const expected = Buffer.from(sign(secret, timestamp, rawBody), "hex");
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
  if (!valid) throw new Error("bad signature");
}

export async function receive(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer()); // Verify before JSON parsing.
  verify(raw, request.headers.get("webhook-signature") || "", activeAndPreviousSecrets());
  const event = validateEvent(JSON.parse(raw.toString("utf8")));
  await database.transaction(async tx => {
    await tx.webhookEvents.insertOnce(event.id, raw); // Unique provider event ID.
    await tx.jobs.insertOnce("webhook:" + event.id, { eventId: event.id });
  });
  return new Response(null, { status: 204 });          // Worker performs the slow effect.
}`
      };
    }
    if (lesson.title.startsWith("Application file storage")) {
      return {
        ...profile,
        sourceLabel: "Amazon S3 presigned upload documentation",
        sourceUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html",
        commentPrefix: "#",
        code: `from pathlib import PurePosixPath
from uuid import uuid4

ALLOWED = {"image/png", "image/jpeg", "application/pdf"}
MAX_BYTES = 25 * 1024 * 1024

def begin_upload(user, request, s3, db):
    if request.content_type not in ALLOWED or not 0 < request.size <= MAX_BYTES:
        raise ValueError("unsupported file")
    upload_id = str(uuid4())
    key = str(PurePosixPath("quarantine") / user.tenant_id / upload_id)
    db.files.insert({"id": upload_id, "owner": user.id, "key": key,
                     "name": request.display_name, "checksum": request.checksum,
                     "state": "pending"})
    return s3.generate_presigned_post(
        Bucket="private-uploads", Key=key,
        Fields={"Content-Type": request.content_type,
                "x-amz-checksum-sha256": request.checksum},
        Conditions=[{"Content-Type": request.content_type},
                    {"x-amz-checksum-sha256": request.checksum},
                    ["content-length-range", 1, MAX_BYTES]],
        ExpiresIn=600,
    )

def complete_upload(user, upload_id, s3, db, jobs):
    record = db.files.require_owner(upload_id, user.id)
    head = s3.head_object(Bucket="private-uploads", Key=record.key)
    if head["ContentLength"] > MAX_BYTES or head.get("ChecksumSHA256") != record.checksum:
        raise ValueError("stored object failed validation")
    jobs.insert_once("scan:" + upload_id, {"file_id": upload_id})
    db.files.transition(upload_id, "pending", "quarantined")

# Scanner validates magic bytes, malware result, and page/image limits before
# moving to a non-public clean prefix. Downloads require authorization and a
# short-lived URL with safe Content-Disposition; deletion removes bytes and metadata.`
      };
    }
    if (lesson.title.startsWith("Background jobs")) {
      return {
        ...profile,
        sourceLabel: "Amazon SQS visibility timeout documentation",
        sourceUrl: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html",
        commentPrefix: "#",
        code: `# PostgreSQL-style lease algorithm; run each block in a transaction.
CLAIM = """
WITH candidate AS (
  SELECT id FROM jobs
  WHERE run_after <= now() AND (
    (state = 'ready' AND lease_until IS NULL)
    OR (state = 'running' AND lease_until < now())
  )
  ORDER BY run_after, id
  FOR UPDATE SKIP LOCKED LIMIT 1
)
UPDATE jobs SET state = 'running', attempts = attempts + 1,
  lease_owner = %(worker)s, lease_until = now() + interval '30 seconds'
WHERE id = (SELECT id FROM candidate)
RETURNING *
"""

def run_one(db, worker, stopping):
    if stopping.is_set(): return False
    job = db.fetch_one(CLAIM, {"worker": worker})
    if not job: return False
    try:
        # Business table has UNIQUE(job.id); repeated delivery cannot repeat effect.
        perform_idempotently(job)
        db.execute("DELETE FROM jobs WHERE id=%s AND lease_owner=%s", job.id, worker)
    except RetryableError as error:
        delay = min(3600, 2 ** min(job.attempts, 10))
        db.retry_after(job.id, worker, delay, str(error))
    except PermanentError as error:
        db.move_to_dead_letter(job.id, worker, str(error))
    return True

# On SIGTERM: stop claiming, extend or release owned leases, finish within the
# shutdown deadline, then exit. Another worker recovers any expired lease.`
      };
    }
    if (lesson.title.startsWith("Audit logs")) {
      return {
        ...profile,
        sourceLabel: "OWASP Logging Cheat Sheet",
        sourceUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
        commentPrefix: "//",
        code: `import { createHash } from "node:crypto";

type AuditEvent = {
  occurredAt: string; actor: { id: string; type: string };
  action: string; target: { type: string; id: string };
  outcome: "allowed" | "denied" | "failed"; requestId: string;
  reason?: string; changes?: Record<string, { from: unknown; to: unknown }>;
};

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return "{" + entries.map(([key, child]) => JSON.stringify(key) + ":" + canonical(child)).join(",") + "}";
}

export async function appendAudit(event: AuditEvent) {
  const clean = redactAndValidate(event);               // Never store tokens or raw secrets.
  await auditStore.transaction(async tx => {
    const previous = await tx.lockTail();
    const previousHash = previous?.hash || "GENESIS";
    const hash = createHash("sha256").update(previousHash).update(canonical(clean)).digest("hex");
    await tx.insert({ ...clean, previousHash, hash });   // Append-only role; no UPDATE/DELETE.
  });
}

// Verify the chain regularly and anchor its latest hash in separately controlled
// immutable storage. A local hash chain alone cannot stop an administrator from
// deleting the tail. Restrict readers, log reads, and enforce retention policy.`
      };
    }
    return {
      ...profile,
      sourceLabel: "OWASP Authorization Cheat Sheet",
      sourceUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
      commentPrefix: "#",
      code: `from datetime import UTC, datetime, timedelta
from fastapi import Depends, Header, HTTPException

@app.post("/admin/users/{user_id}/disable")
def disable_user(user_id: str, command: DisableCommand,
                 actor=Depends(require_admin), idempotency_key: str=Header()):
    if "users:disable" not in actor.permissions:
        raise HTTPException(403)
    if actor.authenticated_at < datetime.now(UTC) - timedelta(minutes=10):
        raise HTTPException(401, "fresh authentication required")
    if actor.user_id == user_id:
        raise HTTPException(409, "self-disable is forbidden")

    target = users.require_in_actor_scope(user_id, actor)
    preview = {"user": target.id, "active_sessions": sessions.count(target.id),
               "reason": command.reason}
    if command.mode == "preview": return preview
    if command.confirmation != target.email:
        raise HTTPException(400, "confirmation does not match target")

    with db.transaction():
        result = operations.insert_once(idempotency_key, actor.user_id, preview)
        if result.is_new:
            users.disable(target.id)
            sessions.revoke_all(target.id)
            audit.append(actor, "user.disable", target, "allowed", command.reason)
    return {"operation_id": result.id, "status": "complete"}

# Large bulk actions add a reviewed change set, dual approval, rate limit,
# progress visibility, per-item result, cancellation point, and rollback plan.`
    };
  }
  if (lesson.trackId === "agents" && lesson.title.startsWith("LangChain")) {
    return {
      ...profile,
      sourceLabel: "LangChain v1 agents documentation",
      sourceUrl: "https://docs.langchain.com/oss/python/langchain/agents",
      commentPrefix: "#",
      code: `import os
from pydantic import BaseModel, Field
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langchain.tools import tool

class SupportAnswer(BaseModel):
    answer: str = Field(description="A short answer supported by tool data")
    order_found: bool

@tool
def lookup_order(order_id: str) -> str:
    """Return trusted order data for one exact order ID."""
    if order_id != "A-42":
        return "Order not found"
    return "A-42: packed, expected Friday"

agent = create_agent(
    model=os.getenv("MODEL_NAME", "openai:gpt-5.4-mini"),
    tools=[lookup_order],
    system_prompt="Use lookup_order. Do not invent order state.",
    response_format=ToolStrategy(SupportAnswer),
)

request = {"messages": [{"role": "user", "content": "Where is A-42?"}]}
for update in agent.stream(request, stream_mode="updates", version="v2"):
    print(update)  # Model step, tool result, and final structured response.

result = agent.invoke(request)
print(result["structured_response"])`
    };
  }
  if (lesson.trackId === "agents" && lesson.title.startsWith("LangGraph")) {
    return {
      ...profile,
      sourceLabel: "LangGraph graph API and state schema documentation",
      sourceUrl: "https://docs.langchain.com/oss/python/langgraph/graph-api",
      commentPrefix: "#",
      code: `from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, END, StateGraph
from langgraph.types import Command, interrupt

class ApprovalState(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: str = Field(min_length=1)
    action: str = Field(min_length=1, max_length=200)
    status: Literal["pending", "approved", "rejected"] = "pending"

def review(state: ApprovalState) -> Command[Literal["execute", "cancel"]]:
    approved = interrupt({"question": "Approve?", "action": state["action"]})
    status = "approved" if approved else "rejected"
    return Command(goto="execute" if approved else "cancel", update={"status": status})

def execute(state: ApprovalState):
    # Use request_id as a database idempotency key in production.
    return {"status": "approved"}

def cancel(state: ApprovalState):
    return {"status": "rejected"}

builder = StateGraph(ApprovalState)
builder.add_node("review", review)
builder.add_node("execute", execute)
builder.add_node("cancel", cancel)
builder.add_edge(START, "review")
builder.add_edge("execute", END)
builder.add_edge("cancel", END)
graph = builder.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "approval-A-42"}}
paused = graph.invoke(
    ApprovalState(request_id="A-42", action="refund order"),
    config=config,
)
print(paused["__interrupt__"])
resumed = graph.invoke(Command(resume=True), config=config)
print(resumed["status"])
# Pydantic validates graph input, not every later node update or final output.
# Replace InMemorySaver with a durable checkpointer before deployment.`
    };
  }
  if (lesson.trackId === "ai-quality-safety" && lesson.title.startsWith("LLM benchmarking")) {
    return {
      ...profile,
      sourceLabel: "LangSmith evaluation and benchmarking types",
      sourceUrl: "https://docs.langchain.com/langsmith/evaluation-types",
      commentPrefix: "#",
      code: `from dataclasses import dataclass
from statistics import mean, pstdev
from time import perf_counter

@dataclass(frozen=True)
class Case:
    prompt: str
    expected: str
    slice: str

CASES = [
    Case("2 + 2", "4", "simple"),
    Case("Return only YES", "YES", "format"),
]

def run_candidate(candidate, repetitions=5):
    scores, latencies, costs = [], [], []
    for case in CASES:
        for _ in range(repetitions):
            started = perf_counter()
            output, estimated_cost = candidate(case.prompt)
            latencies.append((perf_counter() - started) * 1000)
            costs.append(estimated_cost)
            scores.append(int(output.strip() == case.expected))
    return {
        "quality_mean": mean(scores),
        "quality_stddev": pstdev(scores),
        "latency_ms_mean": mean(latencies),
        "cost_mean": mean(costs),
        "runs": len(scores),
    }

def baseline(prompt):
    return ({"2 + 2": "4", "Return only YES": "YES"}[prompt], 0.001)

def candidate(prompt):
    return ({"2 + 2": "4", "Return only YES": "Yes."}[prompt], 0.0005)

print("baseline", run_candidate(baseline))
print("candidate", run_candidate(candidate))
# Compare the same cases and repetitions. Do not hide slice regressions.`
    };
  }
  if (lesson.trackId === "international-interviews") {
    let sourceUrl = "https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep";
    let sourceLabel = "Amazon SDE interview preparation";
    if (/LinkedIn profile/.test(lesson.title)) {
      sourceUrl = "https://www.linkedin.com/help/linkedin/answer/a507508";
      sourceLabel = "LinkedIn Open to Work guidance";
    } else if (/GitHub profile|Portfolio presentations/.test(lesson.title)) {
      sourceUrl = "https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume";
      sourceLabel = "GitHub profile job-search guidance";
    } else if (/Job portals/.test(lesson.title)) {
      sourceUrl = "https://www.linkedin.com/help/linkedin/answer/a509393";
      sourceLabel = "LinkedIn job-search best practices";
    } else if (/Application tracking|safe automation/.test(lesson.title)) {
      sourceUrl = "https://www.linkedin.com/legal/user-agreement";
      sourceLabel = "LinkedIn User Agreement";
    } else if (/Situational interview questions/.test(lesson.title)) {
      sourceUrl = "https://www.amazon.jobs/content/en/our-workplace/leadership-principles";
      sourceLabel = "Amazon Leadership Principles";
    } else if (/Technical storytelling/.test(lesson.title)) {
      sourceUrl = "https://developers.google.com/tech-writing";
      sourceLabel = "Google Technical Writing Courses";
    } else if (/Influence without authority/.test(lesson.title)) {
      sourceUrl = "https://www.ccl.org/articles/leading-effectively-articles/influence-others/";
      sourceLabel = "Center for Creative Leadership influence guidance";
    } else if (/Ethical persuasion/.test(lesson.title)) {
      sourceUrl = "https://www.ftc.gov/reports/bringing-dark-patterns-light";
      sourceLabel = "US FTC dark-patterns report";
    } else if (/Salary negotiation/.test(lesson.title)) {
      sourceUrl = "https://www.pon.harvard.edu/daily/salary-negotiations/negotiate-salary-3-winning-strategies/";
      sourceLabel = "Harvard Program on Negotiation salary guidance";
    } else if (/Behavioral|Leadership|conflict|failure|feedback|ambiguity/.test(lesson.title)) {
      sourceUrl = "https://www.amazon.jobs/content/en/our-workplace/leadership-principles";
      sourceLabel = "Amazon Leadership Principles";
    } else if (/Networking|open source|communities/.test(lesson.title)) {
      sourceUrl = "https://opensource.guide/how-to-contribute/";
      sourceLabel = "GitHub Open Source Guide";
    } else if (/Relocation readiness/.test(lesson.title)) {
      sourceUrl = "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal_en";
      sourceLabel = "EU Immigration Portal example official source";
    } else if (/System-design|Full-stack technical|AI engineering/.test(lesson.title)) {
      sourceUrl = "https://sre.google/sre-book/table-of-contents/";
      sourceLabel = "Google Site Reliability Engineering";
    }
    return { ...profile, code: internationalInterviewCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "api-distributed-systems") {
    let sourceUrl = "https://www.rfc-editor.org/rfc/rfc9110.html";
    let sourceLabel = "RFC 9110 HTTP Semantics";
    if (/Status codes|Problem Details/.test(lesson.title)) {
      sourceUrl = "https://www.rfc-editor.org/rfc/rfc9457.html";
      sourceLabel = "RFC 9457 Problem Details for HTTP APIs";
    } else if (/OpenAPI|JSON Schema/.test(lesson.title)) {
      sourceUrl = "https://spec.openapis.org/oas/latest.html";
      sourceLabel = "OpenAPI Specification";
    } else if (/Protocol Buffers|gRPC|Timeouts|Retries|Service discovery/.test(lesson.title)) {
      sourceUrl = "https://grpc.io/docs/what-is-grpc/core-concepts/";
      sourceLabel = "gRPC core concepts";
    } else if (/GraphQL/.test(lesson.title)) {
      sourceUrl = "https://spec.graphql.org/";
      sourceLabel = "GraphQL specification";
    } else if (/SSE|WebSockets/.test(lesson.title)) {
      sourceUrl = "https://www.rfc-editor.org/rfc/rfc6455.html";
      sourceLabel = "RFC 6455 WebSocket Protocol";
    } else if (/Authentication|authorization|API security/.test(lesson.title)) {
      sourceUrl = "https://www.rfc-editor.org/rfc/rfc9700.html";
      sourceLabel = "RFC 9700 OAuth 2.0 Security Best Current Practice";
    } else if (/API observability/.test(lesson.title)) {
      sourceUrl = "https://www.w3.org/TR/trace-context/";
      sourceLabel = "W3C Trace Context";
    } else if (/Physical clocks|Logical clocks/.test(lesson.title)) {
      sourceUrl = "https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/";
      sourceLabel = "Lamport: Time, Clocks, and Event Ordering";
    } else if (/Queues|Broker|Delivery semantics|Ordering|Poison messages|outbox|Sagas/.test(lesson.title)) {
      sourceUrl = "https://kafka.apache.org/documentation/";
      sourceLabel = "Apache Kafka documentation";
    } else if (/Consensus|Raft|Membership|leases|split brain/.test(lesson.title)) {
      sourceUrl = "https://raft.github.io/raft.pdf";
      sourceLabel = "Raft extended paper";
    } else if (/Failure models|Network uncertainty|Latency|Overload|Circuit breakers|Distributed system model|Multi-region|System design|production architecture/.test(lesson.title)) {
      sourceUrl = "https://sre.google/sre-book/table-of-contents/";
      sourceLabel = "Google Site Reliability Engineering";
    } else if (/replication|Consistency models|CAP theorem|Sharding/.test(lesson.title)) {
      sourceUrl = "https://research.google/pubs/pub45855/";
      sourceLabel = "Google Spanner paper";
    }
    return { ...profile, code: apiDistributedCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "data-systems") {
    let sourceUrl = "https://www.postgresql.org/docs/current/";
    let sourceLabel = "PostgreSQL current documentation";
    if (/Transactions|MVCC|Isolation|locks|Deadlocks/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/mvcc.html";
      sourceLabel = "PostgreSQL concurrency control documentation";
    } else if (/B-tree|Hash, GiST|Composite, covering/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/indexes.html";
      sourceLabel = "PostgreSQL indexes documentation";
    } else if (/Planner statistics|EXPLAIN|Sequential scans/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/performance-tips.html";
      sourceLabel = "PostgreSQL query planning documentation";
    } else if (/Heap pages|VACUUM|WAL|Backups/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/maintenance.html";
      sourceLabel = "PostgreSQL maintenance documentation";
    } else if (/Physical streaming replication|Logical replication/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/high-availability.html";
      sourceLabel = "PostgreSQL high availability documentation";
    } else if (/Authentication|observability/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/admin.html";
      sourceLabel = "PostgreSQL server administration documentation";
    } else if (/JSONB indexing/.test(lesson.title)) {
      sourceUrl = "https://www.postgresql.org/docs/current/datatype-json.html";
      sourceLabel = "PostgreSQL JSON documentation";
    }
    if (/^Redis/.test(lesson.title)) {
      sourceUrl = "https://redis.io/docs/latest/";
      sourceLabel = "Redis Open Source documentation";
      if (/strings|lists|bitmaps|Streams/.test(lesson.title)) {
        sourceUrl = "https://redis.io/docs/latest/develop/data-types/";
        sourceLabel = "Redis data types documentation";
      } else if (/RDB|AOF/.test(lesson.title)) {
        sourceUrl = "https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/";
        sourceLabel = "Redis persistence documentation";
      } else if (/replication|Sentinel/.test(lesson.title)) {
        sourceUrl = "https://redis.io/docs/latest/operate/oss_and_stack/management/replication/";
        sourceLabel = "Redis replication documentation";
      } else if (/Cluster/.test(lesson.title)) {
        sourceUrl = "https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/";
        sourceLabel = "Redis Cluster specification";
      }
    }
    return { ...profile, code: dataSystemsCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (["cloud-aws", "devops", "docker", "kubernetes"].includes(lesson.trackId)) {
    let sourceUrl = profile.sourceUrl;
    let sourceLabel = profile.sourceLabel;
    if (lesson.trackId === "cloud-aws") {
      sourceUrl = "https://docs.aws.amazon.com/";
      sourceLabel = "AWS Documentation";
      if (/IAM|STS|role|KMS|Secrets/.test(lesson.title)) {
        sourceUrl = "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html";
        sourceLabel = "AWS IAM User Guide";
      } else if (/VPC|gateway|Security groups/.test(lesson.title)) {
        sourceUrl = "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html";
        sourceLabel = "Amazon VPC User Guide";
      } else if (/reliability|cost|production architecture/.test(lesson.title)) {
        sourceUrl = "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html";
        sourceLabel = "AWS Well-Architected Framework";
      }
    }
    if (lesson.trackId === "docker") {
      sourceUrl = /BuildKit|Dockerfile|Build context/.test(lesson.title)
        ? "https://docs.docker.com/build/"
        : "https://docs.docker.com/engine/";
      sourceLabel = /BuildKit|Dockerfile|Build context/.test(lesson.title) ? "Docker Build documentation" : "Docker Engine documentation";
    }
    if (lesson.trackId === "kubernetes") {
      sourceUrl = "https://kubernetes.io/docs/concepts/";
      sourceLabel = "Kubernetes Concepts";
    }
    if (lesson.trackId === "devops" && /CI|OIDC/.test(lesson.title)) {
      sourceUrl = "https://docs.github.com/en/actions";
      sourceLabel = "GitHub Actions documentation";
    }
    return { ...profile, code: infrastructureCodeFor(lesson, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "python") {
    let sourceUrl = "https://docs.python.org/3/tutorial/";
    let sourceLabel = "Python Tutorial";
    if (/Execution model|Objects, identity|Data model|Attribute lookup|Classes, instances|Inheritance/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/reference/datamodel.html";
      sourceLabel = "Python Data Model reference";
    }
    if (/Modules, packages/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/reference/import.html";
      sourceLabel = "Python import system reference";
    }
    if (/Type hints|Generics, type/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/library/typing.html";
      sourceLabel = "Python typing reference";
    }
    if (/Asyncio event loop|TaskGroup|Concurrency selection/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/library/asyncio.html";
      sourceLabel = "Python asyncio reference";
    }
    if (/Threads, the GIL/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/library/threading.html";
      sourceLabel = "Python threading reference";
    }
    if (/Multiprocessing/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/library/multiprocessing.html";
      sourceLabel = "Python multiprocessing reference";
    }
    if (/Memory management/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/library/gc.html";
      sourceLabel = "Python garbage collector reference";
    }
    if (/Packaging|Dependencies, virtual/.test(lesson.title)) {
      sourceUrl = "https://packaging.python.org/en/latest/";
      sourceLabel = "Python Packaging User Guide";
    }
    if (/Native extensions/.test(lesson.title)) {
      sourceUrl = "https://docs.python.org/3/extending/index.html";
      sourceLabel = "Extending and Embedding Python";
    }
    return { ...profile, code: pythonCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "fastapi") {
    let sourceUrl = "https://fastapi.tiangolo.com/tutorial/";
    let sourceLabel = "FastAPI Tutorial";
    if (/Depends|dependencies|Dependency injection|Yield dependencies|Callable dependencies/.test(lesson.title)) {
      sourceUrl = "https://fastapi.tiangolo.com/tutorial/dependencies/";
      sourceLabel = "FastAPI Dependencies guide";
    }
    if (/OAuth2|Security scopes|Cookie sessions|security hardening|CORS/.test(lesson.title)) {
      sourceUrl = "https://fastapi.tiangolo.com/tutorial/security/";
      sourceLabel = "FastAPI Security guide";
    }
    if (/async def|Cancellation|ASGI scope/.test(lesson.title)) {
      sourceUrl = "https://fastapi.tiangolo.com/async/";
      sourceLabel = "FastAPI concurrency guide";
    }
    if (/Containers|Performance profiling/.test(lesson.title)) {
      sourceUrl = "https://fastapi.tiangolo.com/deployment/concepts/";
      sourceLabel = "FastAPI deployment concepts";
    }
    if (/OpenAPI callbacks|Custom APIRoute|HTTP middleware|WebSockets|Server-sent/.test(lesson.title)) {
      sourceUrl = "https://fastapi.tiangolo.com/advanced/";
      sourceLabel = "FastAPI Advanced User Guide";
    }
    return { ...profile, code: fastApiCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "javascript") {
    let sourceUrl = "https://tc39.es/ecma262/";
    let sourceLabel = "ECMAScript language specification";
    if (/setup|Primitive values|Numbers|Strings|coercion|Equality|Functions|Objects|Arrays|Map|Set|Date|Regular expressions/.test(lesson.title)) {
      sourceUrl = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide";
      sourceLabel = "MDN JavaScript Guide";
    }
    if (/module|Dynamic import/.test(lesson.title)) {
      sourceUrl = "https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html";
      sourceLabel = "ECMAScript scripts and modules specification";
    }
    if (/Promise|Async functions|Event loop|AbortController/.test(lesson.title)) {
      sourceUrl = "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects";
      sourceLabel = "ECMAScript Promise specification";
    }
    if (/Explicit resource management/.test(lesson.title)) {
      sourceUrl = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management";
      sourceLabel = "MDN resource management guide";
    }
    if (/SharedArrayBuffer|Atomics|memory ordering/.test(lesson.title)) {
      sourceUrl = "https://tc39.es/ecma262/multipage/memory-model.html";
      sourceLabel = "ECMAScript memory model";
    }
    if (/Reachability|garbage collection|weak references/.test(lesson.title)) {
      sourceUrl = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management";
      sourceLabel = "MDN JavaScript memory management";
    }
    if (/Engine pipeline|Hidden classes|Measurement/.test(lesson.title)) {
      sourceUrl = "https://v8.dev/docs";
      sourceLabel = "V8 documentation";
    }
    return { ...profile, code: javascriptCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "typescript") {
    let sourceUrl = "https://www.typescriptlang.org/docs/handbook/intro.html";
    let sourceLabel = "TypeScript Handbook";
    if (/Compiler pipeline|Compiler API|language service/.test(lesson.title)) {
      sourceUrl = "https://github.com/microsoft/TypeScript/wiki/Architectural-Overview";
      sourceLabel = "TypeScript compiler architectural overview";
    }
    if (/design goals|soundness/.test(lesson.title)) {
      sourceUrl = "https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals";
      sourceLabel = "TypeScript design goals";
    }
    if (/Module resolution|ECMAScript modules|Node.js with TypeScript/.test(lesson.title)) {
      sourceUrl = "https://www.typescriptlang.org/docs/handbook/modules/reference.html";
      sourceLabel = "TypeScript modules reference";
    }
    if (/Declaration files|Typed library authoring/.test(lesson.title)) {
      sourceUrl = "https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html";
      sourceLabel = "TypeScript declaration files guide";
    }
    if (/tsconfig strictness/.test(lesson.title)) {
      sourceUrl = "https://www.typescriptlang.org/tsconfig/";
      sourceLabel = "TSConfig reference";
    }
    if (/Project references/.test(lesson.title)) {
      sourceUrl = "https://www.typescriptlang.org/docs/handbook/project-references.html";
      sourceLabel = "TypeScript project references";
    }
    if (/Type-checker performance/.test(lesson.title)) {
      sourceUrl = "https://github.com/microsoft/TypeScript/wiki/Performance";
      sourceLabel = "TypeScript performance guide";
    }
    if (/TypeScript upgrades/.test(lesson.title)) {
      sourceUrl = "https://www.typescriptlang.org/docs/handbook/release-notes/overview.html";
      sourceLabel = "TypeScript release notes";
    }
    return { ...profile, code: typescriptCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId === "nodejs") {
    let sourceUrl = "https://nodejs.org/api/";
    let sourceLabel = "Node.js API documentation";
    if (/Event loop|process.nextTick|libuv worker pool/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick";
      sourceLabel = "Node.js event loop guide";
    }
    if (/Stream|streams|backpressure/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/stream.html";
      sourceLabel = "Node.js Stream API";
    }
    if (/ECMAScript modules|CommonJS|interoperability/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/packages.html";
      sourceLabel = "Node.js packages and modules documentation";
    }
    if (/Runtime TypeScript/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/typescript.html";
      sourceLabel = "Node.js TypeScript documentation";
    }
    if (/worker_threads/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/worker_threads.html";
      sourceLabel = "Node.js Worker Threads API";
    }
    if (/Node test runner/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/test.html";
      sourceLabel = "Node.js test runner documentation";
    }
    if (/Node security|permission model/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/permissions.html";
      sourceLabel = "Node.js permissions documentation";
    }
    if (/diagnostics_channel|perf_hooks|Memory|CPU profiles/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/diagnostics_channel.html";
      sourceLabel = "Node.js diagnostics documentation";
    }
    if (/Native addons/.test(lesson.title)) {
      sourceUrl = "https://nodejs.org/api/n-api.html";
      sourceLabel = "Node-API documentation";
    }
    return { ...profile, code: nodeCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
  }
  if (lesson.trackId !== "react") return profile;
  let sourceUrl = "https://react.dev/learn";
  let sourceLabel = "React Learn documentation";
  if (/use[A-Z]|Custom Hooks|createContext/.test(lesson.title)) {
    sourceUrl = "https://react.dev/reference/react/hooks";
    sourceLabel = "React Hooks reference";
  }
  if (lesson.title.startsWith("React Compiler")) {
    sourceUrl = "https://react.dev/learn/react-compiler";
    sourceLabel = "React Compiler documentation";
  }
  if (lesson.title.startsWith("Server Components")) {
    sourceUrl = "https://react.dev/reference/rsc/server-components";
    sourceLabel = "React Server Components reference";
  }
  if (lesson.title.startsWith("Server Functions")) {
    sourceUrl = "https://react.dev/reference/rsc/server-functions";
    sourceLabel = "React Server Functions reference";
  }
  if (/createRoot|Server rendering/.test(lesson.title)) {
    sourceUrl = "https://react.dev/reference/react-dom";
    sourceLabel = "React DOM reference";
  }
  return { ...profile, code: reactCodeFor(lesson.title, profile.code), sourceUrl, sourceLabel };
}

const REMAINING_TRACK_PROFILES = {
  "cloud-aws": {
    analogy: "AWS is a programmable city: accounts set legal boundaries, IAM issues authority, VPCs define roads, managed services operate utilities, and telemetry shows whether citizens are safe.",
    sourceLabel: "AWS Well-Architected Framework",
    sourceUrl: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
    artifact: "reviewed AWS design with executable evidence",
    code: `aws sts get-caller-identity
aws configure list
aws ec2 describe-vpcs --output table

# Record account, role, Region, resource IDs, policy decision, cost,
# failure behavior, and the command or IaC change that produced them.`
  },
  devops: {
    analogy: "DevOps is a learning conveyor belt: small changes move through automated checks into production, telemetry returns feedback, and teams improve the whole flow.",
    sourceLabel: "Google SRE books",
    sourceUrl: "https://sre.google/books/",
    artifact: "reproducible delivery evidence with recovery proof",
    code: `# One immutable identity moves through every environment.
artifact_digest="$(docker image inspect app:candidate --format '{{index .RepoDigests 0}}')"
printf 'artifact=%s\n' "$artifact_digest"

make test
make security-check
make deploy-preview
make smoke-test`
  },
  docker: {
    analogy: "A container is a constrained process, not a tiny computer: the image supplies its filesystem and defaults while the host kernel supplies execution and isolation.",
    sourceLabel: "Docker documentation",
    sourceUrl: "https://docs.docker.com/get-started/docker-overview/",
    artifact: "hardened image plus runtime diagnostic evidence",
    code: `docker image inspect app:lesson
docker container run --rm --read-only --cap-drop=ALL \
  --user 10001:10001 --memory=512m --cpus=1 app:lesson
docker container stats --no-stream

# Inspect digest, user, mounts, namespaces, limits, health, logs, and exit.`
  },
  kubernetes: {
    analogy: "Kubernetes is a control room: you declare desired state through an API, controllers compare it with reality, and node agents keep reconciling until status matches or evidence explains why not.",
    sourceLabel: "Kubernetes Concepts",
    sourceUrl: "https://kubernetes.io/docs/concepts/",
    artifact: "declarative workload with reconciliation and failure evidence",
    code: `kubectl apply --server-side -f workload.yaml
kubectl get deploy,pod,svc -o wide
kubectl describe pod -l app=lesson
kubectl get events --sort-by=.metadata.creationTimestamp

# Compare spec, status, conditions, events, controller actions, and data plane.`
  },
  "ml-foundations": {
    analogy: "A model is a fitted map, not the territory: features choose the coordinates, loss defines what counts as wrong, and evaluation checks whether the map travels.",
    sourceLabel: "scikit-learn user guide",
    sourceUrl: "https://scikit-learn.org/stable/user_guide.html",
    artifact: "reproducible experiment with metric rationale",
    code: `from sklearn.metrics import precision_recall_fscore_support

precision, recall, f1, _ = precision_recall_fscore_support(
    y_true, y_pred, average="binary", zero_division=0
)
print({"precision": precision, "recall": recall, "f1": f1})
# Choose metrics from product error costs, not convenience.`
  },
  "llm-internals": {
    analogy: "A language model is an extremely detailed next-step navigator: it converts text into tokens, transforms context into probability distributions, then samples one continuation at a time.",
    sourceLabel: "Attention Is All You Need",
    sourceUrl: "https://arxiv.org/abs/1706.03762",
    artifact: "mechanistic trace with a falsifiable prediction",
    code: `function softmax(logits) {
  const max = Math.max(...logits);
  const weights = logits.map(x => Math.exp(x - max));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map(x => x / total);
}

console.log(softmax([2.1, 1.2, -0.3]));`
  },
  "ai-application-engineering": {
    analogy: "An AI feature is a probabilistic service behind a strict border: prompts shape the request, schemas inspect the response, and fallbacks protect the product contract.",
    sourceLabel: "OpenAI API documentation",
    sourceUrl: "https://developers.openai.com/api/docs/",
    artifact: "contract-tested model integration with budgets",
    code: `const contract = {
  input: validateRequest(rawInput),
  deadlineMs: 4_000,
  maxAttempts: 2,
  outputSchema: AnswerSchema,
  fallback: "retrieve-only"
};

const result = await modelGateway.execute(contract);`
  },
  "retrieval-rag": {
    analogy: "RAG is an open-book exam: retrieval chooses the pages, context assembly arranges them, generation writes the response, and evaluation checks both selection and answer support.",
    sourceLabel: "Retrieval-Augmented Generation paper",
    sourceUrl: "https://arxiv.org/abs/2005.11401",
    artifact: "evaluated retrieval trace with citations",
    code: `const trace = {
  query,
  candidates: await retrieve(query, { limit: 40 }),
  reranked: [],
  context: [],
  answer: null,
  metrics: { recallAtK: null, groundedness: null }
};

trace.reranked = await rerank(query, trace.candidates);`
  },
  agents: {
    analogy: "An agent is a bounded control loop: observe state, choose an allowed action, execute through a guarded tool, inspect the result, and stop by policy.",
    sourceLabel: "NIST AI Risk Management Framework",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    artifact: "replayable workflow trace with recovery proof",
    code: `while (!state.done && state.steps < budget.maxSteps) {
  const action = await policy.choose(visibleState(state));
  authorize(action, policy.permissions);
  const result = await tools.execute(action, { idempotencyKey: state.id });
  state = transition(state, action, result);
  await checkpoints.save(state);
}`
  },
  "ai-quality-safety": {
    analogy: "AI quality is a flight test program: a single demo proves takeoff, while datasets, slices, red-team cases, traces, and release gates establish an operating envelope.",
    sourceLabel: "NIST AI Risk Management Framework",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    artifact: "versioned evaluation with sliced results",
    code: `const releaseGate = {
  datasetVersion: "golden-v3",
  minimum: { taskSuccess: 0.9, groundedness: 0.95 },
  criticalSlices: ["untrusted-input", "empty-context", "permission-boundary"]
};

assertRelease(candidateMetrics, releaseGate);`
  },
  "portfolio-capstone": {
    analogy: "A capstone is an engineering case file: the product is evidence, but the decisions, measurements, failures, and recovery story demonstrate judgment.",
    sourceLabel: "Google SRE books",
    sourceUrl: "https://sre.google/books/",
    artifact: "deployed system and defensible case study",
    code: `# Evidence checklist
make test
make evaluate
make security-check
make deploy-preview

# Preserve architecture decisions, traces, benchmarks,
# screenshots, incidents, and measured before/after results.`
  },
  "international-interviews": {
    analogy: "An interview is a compressed collaboration sample: the result matters, but reviewers also observe framing, assumptions, tradeoffs, verification, and communication under uncertainty.",
    sourceLabel: "GitHub Open Source guide",
    sourceUrl: "https://github.com/open-source",
    artifact: "rehearsed evidence story with measurable outcomes",
    code: `const evidenceStory = {
  context: "What constraint made this difficult?",
  responsibility: "What did I personally own?",
  decision: "Which options and tradeoffs did I evaluate?",
  evidence: "What changed, and how was it measured?",
  reflection: "What would I improve next time?"
};`
  }
};

Object.assign(TRACK_PROFILES, REMAINING_TRACK_PROFILES);

function cleanYamlScalar(value) {
  const text = value.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseRoadmap(source) {
  const tracks = [];
  let insideTracks = false;
  let track;
  let topic;

  for (const rawLine of source.replaceAll("\r", "").split("\n")) {
    if (rawLine === "tracks:") {
      insideTracks = true;
      continue;
    }
    if (!insideTracks) continue;
    if (rawLine && !rawLine.startsWith(" ")) break;

    let match = rawLine.match(/^  - id:\s*(.+)$/);
    if (match) {
      track = { id: cleanYamlScalar(match[1]), topics: [] };
      tracks.push(track);
      topic = undefined;
      continue;
    }
    if (!track) continue;

    match = rawLine.match(/^    (title|tier|goal):\s*(.+)$/);
    if (match) {
      track[match[1]] = cleanYamlScalar(match[2]);
      continue;
    }

    match = rawLine.match(/^      - title:\s*(.+)$/);
    if (match) {
      topic = { title: cleanYamlScalar(match[1]) };
      track.topics.push(topic);
      continue;
    }

    match = rawLine.match(/^        (behind_the_scenes|practical|interview):\s*(.+)$/);
    if (match && topic) topic[match[1]] = cleanYamlScalar(match[2]);
  }

  if (!tracks.length) throw new Error("roadmap.yaml contains no tracks");
  for (const trackItem of tracks) {
    if (!trackItem.title || !trackItem.goal || !trackItem.tier || !TRACK_PROFILES[trackItem.id]) {
      throw new Error(`Track ${trackItem.id} is incomplete or has no teaching profile`);
    }
    for (const topicItem of trackItem.topics) {
      if (!topicItem.title || !topicItem.behind_the_scenes || !topicItem.practical || !topicItem.interview) {
        throw new Error(`Incomplete topic in ${trackItem.id}: ${topicItem.title || "untitled"}`);
      }
    }
  }
  return tracks;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sentence(value) {
  const text = String(value).trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function diagramFor(lesson) {
  const title = lesson.title.toLowerCase();
  const flow = (key, stages, probe, evidence) => ({
    key,
    stages: stages.map(([label, name, detail]) => ({ label, name, detail })),
    probe,
    evidence
  });

  const apiDistributedDiagram = apiDistributedDiagramFor(lesson, title, flow);
  if (apiDistributedDiagram) return apiDistributedDiagram;

  if (lesson.trackId === "react" && /effect|external synchronization/.test(title)) {
    return flow("react-effect", [
      ["01 · COMMIT", "New UI state is committed", "The DOM now represents the latest render."],
      ["02 · CLEANUP", "Previous synchronization stops", "Release the old timer, listener, or connection."],
      ["03 · SETUP", "Effect synchronizes again", "Use the committed dependency values."],
      ["04 · EXTERNAL", "Outside system changes", "The browser or service exposes the result."]
    ], "Change one dependency and verify cleanup happens before the new setup.", "Effect log order, active handles, DOM state, and Strict Mode replay.");
  }
  if (lesson.trackId === "react" && /state|reducer|batching|transition|optimistic/.test(title)) {
    return flow("react-state", [
      ["01 · EVENT", "User or server supplies intent", "A click, action, response, or queued update begins."],
      ["02 · QUEUE", "React records the update", "Priority and update order determine pending work."],
      ["03 · RENDER", "React computes a new tree", "Components read one state snapshot and reconcile."],
      ["04 · COMMIT", "Visible UI changes atomically", "DOM mutations and layout work become observable."]
    ], "Queue two related updates and predict which state snapshot each callback reads.", "Rendered values, Profiler events, commit count, and interaction responsiveness.");
  }
  if (lesson.trackId === "react" && /server component|server function|hydration|server rendering/.test(title)) {
    return flow("react-server-client", [
      ["01 · REQUEST", "A route or action reaches the server", "Authenticate and load server-owned data."],
      ["02 · SERVER", "React produces server output", "Render HTML or a serialized component/action result."],
      ["03 · BOUNDARY", "Serializable data crosses", "Code and non-serializable values stay on their side."],
      ["04 · CLIENT", "The browser resumes interaction", "Hydration or a client update makes behavior observable."]
    ], "Move one value across the server/client boundary and predict whether serialization succeeds.", "Server logs, payload shape, hydration warnings, bundle size, and interactive behavior.");
  }
  if (lesson.trackId === "react") {
    return flow("react-render", [
      ["01 · INPUT", "Props, state, and context", "One render sees an immutable snapshot of these values."],
      ["02 · RENDER", "Components return elements", "Pure functions describe the next interface tree."],
      ["03 · RECONCILE", "Fiber work compares trees", "Type, position, and key decide preservation."],
      ["04 · COMMIT", "React updates the host UI", "DOM changes, refs, and commit effects become visible."]
    ], "Change one input or key and predict which component state is preserved.", "React DevTools, render count, DOM mutations, focus, and displayed state.");
  }

  if (lesson.trackId === "fastapi" && /depends|dependenc|yield|callable class/.test(title)) {
    return flow("fastapi-dependencies", [
      ["01 · SIGNATURE", "Endpoint declares requirements", "Annotated parameters identify dependency callables."],
      ["02 · GRAPH", "FastAPI solves prerequisites", "Sub-dependencies are ordered before their consumers."],
      ["03 · REQUEST SCOPE", "Values are acquired and cached", "Each node normally runs once for this request."],
      ["04 · UNWIND", "Yield resources close in reverse", "Cleanup runs after the response path completes."]
    ], "Nest two yield dependencies, raise inside the endpoint, and predict cleanup order.", "Dependency call log, cache reuse, exception path, and resource-close events.");
  }
  if (lesson.trackId === "fastapi" && /pydantic|parameter|request bod|form|file|validation/.test(title)) {
    return flow("fastapi-validation", [
      ["01 · WIRE", "Untrusted HTTP values arrive", "Path, query, headers, cookies, or body carry text and bytes."],
      ["02 · PARSE", "Protocol representation is decoded", "Content type and parameter source determine parsing."],
      ["03 · VALIDATE", "Pydantic applies the schema", "Conversion, constraints, and validators produce data or errors."],
      ["04 · ARGUMENT", "Endpoint receives a typed value", "Invalid input instead becomes a structured 422 response."]
    ], "Send one valid payload and three malformed boundary cases.", "Parsed types, validation error locations, status code, and generated schema.");
  }
  if (lesson.trackId === "fastapi" && /sqlalchemy|transaction|database|unit of work/.test(title)) {
    return flow("fastapi-database", [
      ["01 · REQUEST", "Validated command enters", "The endpoint hands business intent to the service."],
      ["02 · SESSION", "One unit owns DB conversation", "Session and transaction state stay request-scoped."],
      ["03 · DATABASE", "Statements enforce invariants", "Locks, constraints, and the pool shape behavior."],
      ["04 · OUTCOME", "Commit or rollback completes", "Only then should the API publish success or failure."]
    ], "Force the second database operation to fail and verify nothing partially commits.", "SQL log, transaction boundaries, pool checkout, persisted rows, and response.");
  }
  if (lesson.trackId === "fastapi" && /oauth|security scope|authorization|cookie|cors|trusted host|security hardening/.test(title)) {
    return flow("fastapi-security", [
      ["01 · CREDENTIAL", "Request presents identity evidence", "Token, cookie, certificate, or trusted proxy data arrives."],
      ["02 · AUTHENTICATE", "Server verifies the principal", "Check integrity, expiry, issuer, audience, and session state."],
      ["03 · AUTHORIZE", "Policy evaluates this resource", "Tenant, ownership, role, and scope rules decide access."],
      ["04 · DECISION", "Allow or reject safely", "Return minimal data and a stable denial response."]
    ], "Replay the request as another tenant and with an expired credential.", "Principal fields, policy decision, audit event, response status, and leaked fields.");
  }
  if (lesson.trackId === "fastapi" && /websocket|server-sent|streaming/.test(title)) {
    return flow("fastapi-stream", [
      ["01 · CONNECT", "Client opens a long-lived channel", "Handshake metadata establishes the connection."],
      ["02 · ACCEPT", "Application owns connection state", "Authentication and resource limits must already be clear."],
      ["03 · FLOW", "Messages or chunks move", "Backpressure and cancellation govern slow consumers."],
      ["04 · DISCONNECT", "Resources are released", "Tasks, generators, subscriptions, and sockets stop."]
    ], "Slow or disconnect the client mid-stream and predict which cleanup runs.", "Handshake, chunk timing, queue depth, disconnect event, and active resource count.");
  }
  if (lesson.trackId === "fastapi" && /container|deployment|worker|lifespan|readiness/.test(title)) {
    return flow("fastapi-process", [
      ["01 · START", "Process imports the application", "Configuration and route registration happen per worker."],
      ["02 · LIFESPAN", "Shared resources are acquired", "Pools and clients become owned by this process."],
      ["03 · SERVE", "Readiness admits requests", "The worker handles bounded concurrent traffic."],
      ["04 · DRAIN", "Shutdown stops and cleans up", "Readiness drops, requests finish, then resources close."]
    ], "Send a termination signal during a slow request and observe the drain sequence.", "Process log, readiness state, in-flight count, exit code, and resource cleanup.");
  }
  if (lesson.trackId === "fastapi") {
    return flow("fastapi-request", [
      ["01 · SOCKET", "HTTP bytes reach Uvicorn", "The server parses protocol data and creates an ASGI scope."],
      ["02 · ASGI", "Events enter the application", "Middleware wraps receive, routing, and endpoint handling."],
      ["03 · ENDPOINT", "Dependencies and business logic run", "Typed inputs become a return value or exception."],
      ["04 · RESPONSE", "ASGI send emits wire events", "Status, headers, and body become observable to the client."]
    ], "Trace one valid request and one failure while recording every ASGI event.", "Scope fields, middleware order, dependency calls, send events, and client response.");
  }

  if (lesson.trackId === "python" && /module|package|import|sys\.modules/.test(title)) {
    return flow("python-import", [
      ["01 · STATEMENT", "Code requests a module", "The import name and current package define the search."],
      ["02 · CACHE", "sys.modules is checked", "An existing module object can satisfy the import immediately."],
      ["03 · FIND + LOAD", "A spec chooses the loader", "The module is created, cached early, then executed."],
      ["04 · BIND", "A name receives the module", "Callers observe exports or a partially initialized cycle."]
    ], "Import the same module twice, then create a small circular import.", "sys.modules identity, module spec, execution log, bound names, and failure traceback.");
  }
  if (lesson.trackId === "python" && /iterator|generator|comprehension|itertools/.test(title)) {
    return flow("python-iteration", [
      ["01 · ITERABLE", "A source can produce traversal", "Calling iter asks for an iterator."],
      ["02 · ITERATOR", "State tracks the current position", "The iterator is normally single-use."],
      ["03 · NEXT / YIELD", "One value crosses at a time", "A generator frame suspends after yielding."],
      ["04 · STOP", "Traversal ends explicitly", "StopIteration, close, or an exception completes the flow."]
    ], "Consume only three values from a very large source, then close it early.", "next calls, yielded values, generator state, cleanup log, and peak memory.");
  }
  if (lesson.trackId === "python" && /attribute|descriptor|special method|data model|class|mro|super/.test(title)) {
    return flow("python-object-protocol", [
      ["01 · SYNTAX", "Code performs an operation", "Attribute access, len, iteration, comparison, or a call begins."],
      ["02 · TYPE LOOKUP", "Python selects a protocol", "MRO and descriptor precedence locate behavior."],
      ["03 · METHOD", "The special method executes", "Bound objects and arguments determine the result."],
      ["04 · VALUE", "A value or exception returns", "Caller-visible behavior proves which path won."]
    ], "Shadow one attribute or return NotImplemented and predict the fallback path.", "MRO, descriptor calls, bound-method fields, return value, and exception.");
  }
  if (lesson.trackId === "python" && /asyncio|taskgroup|thread|multiprocessing|concurrency/.test(title)) {
    return flow("python-concurrency", [
      ["01 · WORK", "A callable or coroutine is created", "Its wait pattern and CPU cost determine a boundary."],
      ["02 · SCHEDULE", "Loop, thread, or process owns it", "The scheduler decides when execution can progress."],
      ["03 · SUSPEND / RUN", "Work waits or consumes CPU", "Cancellation and synchronization shape interleaving."],
      ["04 · JOIN", "Result, error, or cancellation returns", "The owner waits for cleanup before continuing."]
    ], "Run the workload once normally and once with blocking, cancellation, or worker failure.", "Timeline, task/thread/process identity, queue depth, exception, and elapsed time.");
  }
  if (lesson.trackId === "python" && /memory|garbage|reference count|weak reference|copying|serialization|pickle/.test(title)) {
    return flow("python-object-lifetime", [
      ["01 · CREATE", "Objects and references appear", "Names and containers form an object graph."],
      ["02 · SHARE", "Aliases preserve reachability", "Shallow copies may still point to the same children."],
      ["03 · RELEASE", "Strong references disappear", "Reference counting and cycle detection evaluate reachability."],
      ["04 · OBSERVE", "Object remains or is reclaimed", "Weak references and memory traces expose the outcome."]
    ], "Create an alias or cycle, delete roots, and predict which objects remain reachable.", "Object IDs, weak references, GC statistics, allocation trace, and cleanup events.");
  }
  if (lesson.trackId === "python" && /packaging|pyproject|wheel|source distribution|virtual environment|lock file|dependenc/.test(title)) {
    return flow("python-packaging", [
      ["01 · SOURCE", "Project and pyproject.toml", "Code, metadata, and build requirements define inputs."],
      ["02 · BUILD", "Frontend calls the backend", "An isolated build produces an sdist or wheel."],
      ["03 · RESOLVE", "Installer selects artifacts", "Environment markers, tags, versions, and hashes constrain choice."],
      ["04 · INSTALL", "A clean environment is populated", "Imports and metadata prove what is actually installed."]
    ], "Build once, inspect the wheel, then install it into an empty environment.", "Artifact contents, wheel tags, dependency graph, interpreter path, and import result.");
  }
  if (lesson.trackId === "python") {
    return flow("python-execution", [
      ["01 · SOURCE", "Python syntax enters a code block", "The compiler determines names and produces executable code."],
      ["02 · FRAME", "A runtime namespace is created", "Names bind to objects while instructions execute."],
      ["03 · PROTOCOL", "Objects perform the operation", "Type-defined behavior controls conversion and dispatch."],
      ["04 · RESULT", "State, value, or exception emerges", "Tests and inspection make the behavior observable."]
    ], "Change one binding, type, or mutable object and predict the resulting behavior.", "Object identity, type, frame locals, return value, exception, and timing.");
  }

  if (lesson.trackId === "nodejs" && /buffer|arraybuffer|typedarray|dataview|binary/.test(title)) {
    return flow("node-binary", [
      ["01 · BYTES", "Input enters a bounded buffer", "Length, allocation, encoding, and ownership must be explicit."],
      ["02 · VIEW", "Code reads through one typed view", "Offsets, endianness, aliases, and pooled backing storage shape access."],
      ["03 · VALIDATE", "Protocol bounds are enforced", "Lengths, versions, and allowed representations reject malformed data."],
      ["04 · TRANSFER", "Owned output crosses the boundary", "A copy, view, clone, or transfer determines later mutation."]
    ], "Mutate a sliced Buffer and compare it with an explicit copy and transferred ArrayBuffer.", "byte dump, byteOffset, byteLength, backing identity, decoded value, allocation, and rejection.");
  }
  if (lesson.trackId === "nodejs" && /stream|backpressure/.test(title)) {
    return flow("node-stream", [
      ["01 · SOURCE", "Bytes arrive in chunks", "A file, socket, or producer controls chunk timing."],
      ["02 · BUFFER", "Readable state holds data", "High-water marks limit eager production."],
      ["03 · CONSUMER", "Transform or destination pulls", "Backpressure pauses upstream when writes cannot keep up."],
      ["04 · FINISH", "Pipeline completes or destroys", "Errors and close events release every handle."]
    ], "Slow the destination and confirm memory stays bounded.", "Chunk sizes, writable return values, drain events, RSS, and close/error order.");
  }
  if (lesson.trackId === "nodejs" && /event loop|libuv|thread pool|worker thread|child process/.test(title)) {
    return flow("node-runtime", [
      ["01 · CALLBACK", "JavaScript schedules work", "The main thread initiates I/O, timers, or CPU work."],
      ["02 · RUNTIME", "Node delegates eligible work", "OS readiness, libuv, workers, or another process executes it."],
      ["03 · QUEUE", "Completion becomes ready", "Loop phases and microtasks determine callback order."],
      ["04 · JS", "Main thread handles completion", "Latency and event-loop delay become observable."]
    ], "Add one blocking CPU loop and compare callback timing before and after.", "Event-loop delay, async trace, worker identity, callback order, and latency.");
  }
  if (lesson.trackId === "nodejs" && /http|fetch|undici|tcp|dns|tls/.test(title)) {
    return flow("node-network", [
      ["01 · CONNECT", "Name and transport establish a channel", "Resolution, pooling, TCP, TLS, or an accepted socket creates connectivity."],
      ["02 · PARSE", "Protocol bytes become messages", "Framing, headers, body limits, and stream state define input."],
      ["03 · HANDLE", "Application performs bounded work", "Validation, cancellation, deadlines, and dependencies shape the outcome."],
      ["04 · RELEASE", "Response or failure closes ownership", "Bodies, sockets, sessions, streams, and pool capacity become reusable or end."]
    ], "Slow, abort, or fragment one request and predict which timeout and cleanup path owns it.", "DNS result, socket state, TLS parameters, headers, body bytes, pool state, response, and close event.");
  }
  if (lesson.trackId === "nodejs" && /ecmascript module|commonjs|package|runtime typescript|resolution/.test(title)) {
    return flow("node-modules", [
      ["01 · SPECIFIER", "Code requests one module", "Syntax, package type, URL, and conditions choose the loader model."],
      ["02 · RESOLVE", "Node selects an exact resource", "Extensions, exports, imports, URLs, or CommonJS search rules produce identity."],
      ["03 · LOAD", "Format is parsed and evaluated", "Cache insertion, linking, interop, cycles, and type stripping affect initialization."],
      ["04 · EXPORT", "Consumer observes the public surface", "Namespace shape, shared state, errors, and packed artifacts prove behavior."]
    ], "Load one packed entry from ESM and CommonJS consumers and compare resolved files and state identity.", "import.meta URL, require.resolve, cache entries, evaluation log, exports, package contents, and runtime error.");
  }
  if (lesson.trackId === "nodejs" && /process lifecycle|signal|uncaught|unhandled|cluster|background job|durable queue/.test(title)) {
    return flow("node-process", [
      ["01 · ADMIT", "A ready process accepts work", "Listeners, connections, jobs, and queues create owned in-flight state."],
      ["02 · EXECUTE", "Runtime coordinates work", "Errors, retries, signals, and health state can change the path."],
      ["03 · DRAIN", "Admission stops before cleanup", "Readiness drops, connections or jobs finish, and deadlines bound waiting."],
      ["04 · EXIT", "Supervisor observes termination", "Exit code, report, remaining handles, and restart policy expose the result."]
    ], "Send SIGTERM or inject an uncaught failure during a slow operation and observe bounded termination.", "readiness, in-flight count, handles, signal log, cleanup, exit code, diagnostic report, and supervisor restart.");
  }
  if (lesson.trackId === "nodejs" && /worker_threads|native addon|node-api|webassembly|cpu work/.test(title)) {
    return flow("node-parallel", [
      ["01 · SUBMIT", "Main thread packages CPU work", "Input size, clone, transfer, or shared memory defines handoff cost."],
      ["02 · EXECUTE", "Another isolate or native boundary runs", "CPU time no longer blocks the main JavaScript loop."],
      ["03 · RETURN", "Message, value, or failure crosses back", "Serialization, ownership, ABI, and cancellation shape the result."],
      ["04 · REUSE", "Bounded capacity handles the next item", "Worker lifetime, queue depth, crashes, and responsiveness remain observable."]
    ], "Compare inline CPU work with one reused worker while measuring transfer and loop delay separately.", "queue depth, clone or transfer time, worker identity, CPU time, event-loop delay, result, error, and termination.");
  }
  if (lesson.trackId === "nodejs" && /diagnostic|perf_hooks|memory|heap|cpu profile|observability/.test(title)) {
    return flow("node-diagnostics", [
      ["01 · SYMPTOM", "Production signal crosses a threshold", "Latency, errors, loop delay, memory, or throughput indicates a problem."],
      ["02 · CORRELATE", "Context connects related operations", "Logs, metrics, traces, async context, and deployment identity narrow scope."],
      ["03 · PROFILE", "Runtime evidence tests the cause", "CPU samples, heap paths, traces, reports, and handles expose actual work."],
      ["04 · VERIFY", "One change alters the measured signal", "Representative load and before-after evidence confirm or reject the hypothesis."]
    ], "Inject one block or leak, capture the smallest profile, fix its cause, and repeat the same load.", "latency percentiles, loop utilization and delay, CPU stacks, heap retaining path, RSS, handles, trace, and report.");
  }
  if (lesson.trackId === "nodejs" && /security|configuration|path|shell injection|ssrf/.test(title)) {
    return flow("node-boundary", [
      ["01 · UNTRUSTED", "External text or authority enters", "HTTP, environment, path, URL, command, package, or file input is unproven."],
      ["02 · VALIDATE", "Parser establishes a narrow contract", "Format, size, destination, permissions, and policy reject unsafe cases."],
      ["03 · EXECUTE", "Least-authority API performs work", "Argument arrays, direct opens, AbortSignal, and permission controls constrain impact."],
      ["04 · AUDIT", "Safe output or denial is recorded", "Redacted evidence proves both allowed and adversarial paths."]
    ], "Send one traversal, private URL, or shell metacharacter and verify denial before the privileged API.", "parsed value, resolved path or address, permission decision, spawned argv, error, audit record, and changed resources.");
  }
  if (lesson.trackId === "nodejs") {
    return flow("node-request", [
      ["01 · EVENT", "Input reaches the Node process", "A request, timer, signal, or message creates work."],
      ["02 · JAVASCRIPT", "Handler coordinates the operation", "Promises and callbacks describe continuation."],
      ["03 · SYSTEM", "Runtime performs external work", "Sockets, files, workers, or child processes progress."],
      ["04 · COMPLETION", "Result returns to JavaScript", "Response, log, exit state, or error becomes visible."]
    ], "Trace one operation with async hooks and inject a timeout or shutdown.", "Async IDs, handle count, event-loop delay, response, and exit sequence.");
  }

  if (lesson.trackId === "javascript" && /declaration|lexical|execution context|hoisting|closure|function/.test(title)) {
    return flow("javascript-bindings", [
      ["01 · CREATE", "Code establishes bindings", "Declaration instantiation creates and sometimes initializes names."],
      ["02 · RESOLVE", "A reference searches environments", "Outer links select the nearest matching binding."],
      ["03 · EVALUATE", "The running context uses it", "Calls, closures, and blocks read or update the binding."],
      ["04 · OBSERVE", "Value, error, or retention appears", "Output and heap evidence reveal the selected environment."]
    ], "Shadow or capture one binding and predict every lookup and lifetime.", "Debugger scopes, call stack, console values, ReferenceError, and heap retaining path.");
  }
  if (lesson.trackId === "javascript" && /object|prototyp|class|descriptor|property|proxy|reflect|symbol/.test(title)) {
    return flow("javascript-property", [
      ["01 · KEY", "An operation produces a property key", "Names become strings or symbols before lookup."],
      ["02 · OWN", "Own descriptors are inspected", "Data, accessor, and configuration flags constrain behavior."],
      ["03 · DELEGATE", "The prototype or trap participates", "Lookup continues, invokes an accessor, or crosses a Proxy."],
      ["04 · RESULT", "Value or invariant failure returns", "Ownership, receiver, and mutation become observable."]
    ], "Shadow one inherited property and then repeat through a forwarding Proxy.", "Descriptors, prototype chain, trap log, receiver identity, value, and TypeError.");
  }
  if (lesson.trackId === "javascript" && /iteration|iterator|generator/.test(title)) {
    return flow("javascript-iteration", [
      ["01 · ITERABLE", "Consumer asks for traversal", "Symbol.iterator returns an iterator object."],
      ["02 · NEXT", "Iterator advances once", "State produces one value and a done flag."],
      ["03 · SUSPEND", "Lazy work preserves position", "A generator pauses its execution context at yield."],
      ["04 · CLOSE", "Completion releases traversal", "Return, throw, break, or exhaustion finishes the protocol."]
    ], "Break from a generator-backed for-of loop and verify its finally block runs.", "next inputs, iterator results, generator state, return call, and cleanup log.");
  }
  if (lesson.trackId === "javascript" && /module|dynamic import|tree shaking|code splitting/.test(title)) {
    return flow("javascript-modules", [
      ["01 · RESOLVE", "Host identifies each module", "Specifiers become module records under host rules."],
      ["02 · LINK", "The dependency graph connects", "Environments and live import bindings are initialized."],
      ["03 · EVALUATE", "Modules execute in graph order", "Cycles and top-level await can delay or expose early reads."],
      ["04 · CONSUME", "Importer observes live exports", "Loaded chunks, values, or failures prove the boundary."]
    ], "Create a two-module cycle and move one early read across initialization.", "Resolution trace, network chunk, evaluation log, live value, TDZ error, and bundle graph.");
  }
  if (lesson.trackId === "javascript" && /promise|async|event loop|microtask|abort|concurrency|backpressure|retry/.test(title)) {
    return flow("javascript-jobs", [
      ["01 · STACK", "Synchronous code runs", "Calls execute until the stack becomes empty."],
      ["02 · SCHEDULE", "Async work registers continuation", "Promise reactions and tasks enter different queues."],
      ["03 · CHECKPOINT", "Event loop chooses ready work", "Microtasks drain before the next task and render opportunity."],
      ["04 · CALLBACK", "Continuation observes state", "Order, errors, and UI timing expose the scheduling model."]
    ], "Mix a timer, resolved promise, and synchronous log; predict exact output order.", "Console order, task timestamps, unhandled rejection, and render timing.");
  }
  if (lesson.trackId === "javascript" && /arraybuffer|typedarray|sharedarraybuffer|atomics|binary data|memory ordering/.test(title)) {
    return flow("javascript-memory-data", [
      ["01 · STORAGE", "Bytes occupy a data block", "An ArrayBuffer or SharedArrayBuffer owns raw memory."],
      ["02 · VIEW", "A typed interpretation is applied", "Offset, length, element type, and endianness shape access."],
      ["03 · COORDINATE", "Agents transfer or synchronize", "Messages, ownership transfer, or Atomics define visibility."],
      ["04 · DECODE", "A validated value emerges", "Bounds, schema, state, and worker evidence prove correctness."]
    ], "Decode one buffer with the wrong endianness, then coordinate one shared state transition.", "Byte dump, offsets, detached state, atomic values, worker messages, and decoded result.");
  }
  if (lesson.trackId === "javascript" && /reachability|garbage collection|weak reference|finalization|engine pipeline|hidden class|inline cache|benchmark|performance|measurement/.test(title)) {
    return flow("javascript-engine", [
      ["01 · SOURCE", "Program creates executable work", "Parsing and object allocation establish runtime inputs."],
      ["02 · FEEDBACK", "Execution records observed behavior", "Types, shapes, calls, allocations, and timing form evidence."],
      ["03 · ADAPT", "Engine optimizes or collects", "Guards, tiers, deoptimization, and GC respond to reality."],
      ["04 · MEASURE", "Profiles expose the outcome", "Latency, CPU, heap, and retaining paths test the explanation."]
    ], "Warm a representative workload, change one object shape or retaining edge, and profile both runs.", "Bytecode or optimization log, CPU profile, heap snapshot, GC events, percentiles, and output.");
  }
  if (lesson.trackId === "javascript" && /security|serialization|json|structured clone|regular expression|redos|trust boundar/.test(title)) {
    return flow("javascript-boundary", [
      ["01 · UNTRUSTED", "External data reaches code", "Text, keys, URLs, modules, or bytes carry attacker-controlled shape."],
      ["02 · PARSE", "One explicit format is decoded", "Size, grammar, schema, and version constrain interpretation."],
      ["03 · VALIDATE", "Policy creates trusted data", "Unsafe keys, authority, executable sinks, and limits are rejected."],
      ["04 · USE", "A bounded operation proceeds", "Output, denial, timing, and mutation evidence expose safety."]
    ], "Send a malicious key or pathological string and verify rejection before the dangerous operation.", "Validated representation, prototype state, regex timing, error, audit event, and dependency provenance.");
  }
  if (lesson.trackId === "javascript") {
    return flow("javascript-evaluation", [
      ["01 · EXPRESSION", "Source code requests an operation", "Values and references enter the evaluation."],
      ["02 · COERCE", "Language rules select conversions", "Type, equality, property, or call semantics apply."],
      ["03 · EXECUTE", "The operation changes control or state", "Scopes, prototypes, and closures affect behavior."],
      ["04 · OBSERVE", "A value or exception appears", "A focused example reveals the specification path."]
    ], "Change one operand type or binding and predict the exact value and type.", "Console value, typeof, identity checks, property descriptors, and exception.");
  }

  if (lesson.trackId === "typescript" && /compiler pipeline|compiler api|type-checker performance|language service/.test(title)) {
    return flow("typescript-compiler", [
      ["01 · PROGRAM", "Compiler discovers source graph", "Configuration and resolution select files and libraries."],
      ["02 · BIND", "Declarations become symbols", "Scopes and named identities connect syntax across files."],
      ["03 · CHECK", "Types and relationships are computed", "Control flow, instantiation, and assignability create diagnostics."],
      ["04 · OUTPUT", "Emit or editor answer returns", "JavaScript, declarations, traces, or language-service data become evidence."]
    ], "Change one compiler option or expensive type and compare diagnostics and phase timings.", "showConfig, explainFiles, AST, symbols, inferred types, diagnostics, emitted files, and trace.");
  }
  if (lesson.trackId === "typescript" && /union|intersection|narrow|control-flow|type guard|assertion function|exhaust|state machine/.test(title)) {
    return flow("typescript-narrowing", [
      ["01 · DECLARED", "A value begins with a possible type", "Its declaration describes every permitted variant."],
      ["02 · EVIDENCE", "Control flow tests the runtime value", "A discriminant, guard, equality, or reachability fact is learned."],
      ["03 · NARROW", "Checker removes impossible cases", "Only operations valid for the remaining variants are allowed."],
      ["04 · PROVE", "Branch returns or reaches never", "Diagnostics and type tests expose missing or unsafe paths."]
    ], "Add one new discriminated variant and observe every non-exhaustive consumer.", "Hover type at each branch, diagnostic, never assertion, runtime guard test, and output.");
  }
  if (lesson.trackId === "typescript" && /generic|keyof|mapped type|conditional type|template literal|utility type|variance/.test(title)) {
    return flow("typescript-instantiation", [
      ["01 · RELATION", "API declares type parameters", "Positions and constraints state information to preserve."],
      ["02 · INFER", "Call sites contribute candidates", "Arguments, context, constraints, and variance shape inference."],
      ["03 · INSTANTIATE", "Type expressions substitute arguments", "Mapped, conditional, indexed, and template operations compute a result."],
      ["04 · CHECK", "Concrete relationship is tested", "Inferred output, errors, and checker cost make the design observable."]
    ], "Change one inference site or union input and predict the instantiated result and cost.", "Quick Info, type assertion tests, diagnostic, declaration output, instantiation count, and check time.");
  }
  if (lesson.trackId === "typescript" && /module|declaration file|library author|tsconfig|project reference|javascript interop|upgrade/.test(title)) {
    return flow("typescript-project", [
      ["01 · CONFIG", "Host and project rules are selected", "Target, libraries, modules, resolution, and inputs define the program."],
      ["02 · RESOLVE", "Imports connect source and declarations", "Specifiers, package conditions, and references form a graph."],
      ["03 · BUILD", "Projects check and emit in order", "Caches, declarations, JavaScript, and maps cross boundaries."],
      ["04 · CONSUME", "Real host loads the artifact", "A clean consumer proves runtime and type surfaces agree."]
    ], "Pack or build one module and consume it from a clean project using the real host rules.", "traceResolution, explainFiles, build log, package contents, emitted specifier, declaration, and runtime import.");
  }
  if (lesson.trackId === "typescript" && /runtime validation|type boundar|ai-assisted|security|trusted domain|type erasure/.test(title)) {
    return flow("typescript-boundary", [
      ["01 · UNKNOWN", "External value crosses into code", "HTTP, environment, database, file, queue, or model output is untrusted."],
      ["02 · PARSE", "Runtime logic validates structure", "Types, limits, formats, versions, and policy produce errors or data."],
      ["03 · DOMAIN", "Trusted representation is created", "Checked code can now rely on explicit invariants."],
      ["04 · OPERATE", "Use and serialization stay controlled", "Tests and runtime evidence prove the contract beyond type erasure."]
    ], "Pass malformed but cast-compatible input and verify it fails before domain logic.", "Parser result, validation errors, inferred trusted type, test, serialized output, and audit evidence.");
  }
  if (lesson.trackId === "typescript" && /react with|node\.js with|async typing|production architecture|typescript architecture/.test(title)) {
    return flow("typescript-integration", [
      ["01 · CONTRACT", "Domain types describe intent", "Commands, states, results, and ports exclude known-invalid combinations."],
      ["02 · ADAPTER", "Framework or host values are translated", "React, Node, async, storage, and model details stay at boundaries."],
      ["03 · RUNTIME", "JavaScript performs the operation", "Scheduling, I/O, cancellation, and errors remain real behavior."],
      ["04 · EVIDENCE", "Types and operation agree", "Type tests, runtime tests, telemetry, and failure paths verify the design."]
    ], "Inject one malformed input, cancellation, or dependency failure and trace both static and runtime evidence.", "Type diagnostic, parser output, async result, cleanup, telemetry, declaration, and runtime test.");
  }
  if (lesson.trackId === "typescript" && /type testing|test/.test(title)) {
    return flow("typescript-contract-test", [
      ["01 · EXPECT", "Contract states accepted and rejected use", "Positive and negative examples define the public relationship."],
      ["02 · CHECK", "Compiler evaluates assignability", "Expected errors and type equalities verify static behavior."],
      ["03 · RUN", "JavaScript exercises real behavior", "Boundary, success, failure, and cleanup tests verify runtime behavior."],
      ["04 · REGRESS", "A change must satisfy both suites", "Declarations and implementation cannot drift silently."]
    ], "Change the API so one negative type test becomes valid and verify the test suite catches it.", "ts-expect-error status, type assertions, emitted code, runtime assertions, and consumer declarations.");
  }
  if (lesson.trackId === "typescript") {
    return flow("typescript-check", [
      ["01 · SOURCE", "JavaScript plus type syntax", "Declarations describe values and relationships."],
      ["02 · CHECKER", "Control flow builds a type model", "Inference, narrowing, generics, and assignability interact."],
      ["03 · DIAGNOSTIC", "Unsafe relationships are reported", "Compiler options decide which uncertainty is rejected."],
      ["04 · EMIT", "Types disappear from JavaScript", "Runtime behavior still needs real boundary validation."]
    ], "Introduce one unsafe assignment and compare strict checker output with emitted JavaScript.", "Type diagnostic, inferred type, declaration output, runtime value, and validation result.");
  }

  if (lesson.trackId === "web-platform" && /url|dns|tcp|tls|http|proxy|cdn/.test(title)) {
    return flow("web-request", [
      ["01 · URL", "Browser resolves request intent", "Scheme, host, port, path, and cache policy are known."],
      ["02 · CONNECTION", "DNS and transport establish reachability", "TCP or QUIC plus TLS creates a secure channel."],
      ["03 · HTTP", "Request crosses proxies and server", "Headers, caching, routing, and content negotiation apply."],
      ["04 · BROWSER", "Response affects the page", "Status, bytes, timing, and security policy become visible."]
    ], "Disable cache and compare one cold request with a repeated request.", "DNS, connection, TLS, server, transfer timings, headers, and status.");
  }
  if (lesson.trackId === "web-platform") {
    return flow("browser-pipeline", [
      ["01 · BYTES", "HTML, CSS, or events arrive", "The browser receives source and user input."],
      ["02 · PARSE", "Browser builds structured models", "DOM, CSSOM, and accessibility semantics emerge."],
      ["03 · COMPUTE", "Style, layout, and event rules run", "Dependencies decide what work must repeat."],
      ["04 · PRESENT", "Pixels and semantics become usable", "Paint, focus, announcements, and interaction are observable."]
    ], "Change one semantic or layout input and inspect which browser stages repeat.", "DevTools timeline, DOM, accessibility tree, computed style, layout, and paint.");
  }

  if (lesson.trackId === "data-systems" && /redis architecture|resp|strings|lists|bitmaps|ttl|atomic commands|pipelining/.test(title)) {
    return flow("redis-command", [
      ["01 · CLIENT", "Client frames one or more commands", "Connection, identity, key, arguments, and deadlines enter."],
      ["02 · EVENT LOOP", "Redis parses and schedules work", "Protocol, client buffers, expiration, and command complexity apply."],
      ["03 · COMMAND", "Data structure changes atomically", "The selected encoding and algorithm determine CPU and memory work."],
      ["04 · REPLY", "Ordered evidence returns", "Reply, latency, memory, key state, and errors expose the result."]
    ], "Increase one value or batch size and predict event-loop occupancy and buffer growth.", "RESP frame, command complexity, reply order, latency percentiles, memory usage, and key state.");
  }
  if (lesson.trackId === "data-systems" && /redis rdb|redis replication|redis cluster/.test(title)) {
    return flow("redis-durability", [
      ["01 · WRITE", "Primary accepts a state change", "Command atomicity finishes before durability and replica guarantees are assumed."],
      ["02 · RECORD / STREAM", "Persistence or replication advances", "RDB, AOF, offsets, backlog, and asynchronous delivery create explicit windows."],
      ["03 · FAILURE", "Process or primary becomes unavailable", "Restart, resynchronization, quorum, promotion, and client routing decide progress."],
      ["04 · VERIFY", "Recovered topology serves data", "Acknowledged writes, offsets, files, slots, and client behavior prove the outcome."]
    ], "Fail the primary immediately after an acknowledged write and inventory what survives where.", "AOF or RDB state, replication IDs and offsets, slot owner, promoted node, client redirect, and key value.");
  }
  if (lesson.trackId === "data-systems" && /redis streams|distributed locks|cache-aside/.test(title)) {
    return flow("redis-coordination", [
      ["01 · INTENT", "Application names a cache or coordination operation", "Key design, event identity, owner token, TTL, and source of truth enter."],
      ["02 · REDIS", "Atomic primitive changes shared state", "Entry, pending owner, lease, counter, or cached value becomes visible."],
      ["03 · FAILURE WINDOW", "Delay, duplicate, expiry, or outage occurs", "Old owners, missed acknowledgements, stale values, and retries challenge correctness."],
      ["04 · AUTHORITY", "Durable system accepts or rejects effect", "Idempotency, fencing, version, fallback, and business state close the proof."]
    ], "Pause one worker beyond its lease or acknowledgement window, then let another worker proceed.", "Owner token, fencing value, stream PEL, delivery count, cache version, database row, and duplicate effects.");
  }
  if (lesson.trackId === "data-systems" && /wal|checkpoint|crash recovery|physical streaming|logical replication|backup|pitr/.test(title)) {
    return flow("postgres-durability", [
      ["01 · CHANGE", "Backend creates a database change", "Transaction identity and modified buffers define the candidate outcome."],
      ["02 · WAL", "Log record reaches required durability", "LSNs, flush policy, checkpoints, archive, and sender positions advance."],
      ["03 · REPLAY", "Recovery or replica reapplies history", "Redo, timelines, slots, targets, and schema compatibility govern progress."],
      ["04 · PROVE", "Restored state serves invariants", "Committed rows, missing uncommitted rows, lag, RPO, and RTO make recovery testable."]
    ], "Stop the relevant process at one precise point and predict the last recoverable commit.", "Commit LSN, flushed and replayed LSNs, archived segment, recovery log, restored rows, RPO, and RTO.");
  }
  if (lesson.trackId === "data-systems" && /heap pages|toast|vacuum|autovacuum|freezing|bloat/.test(title)) {
    return flow("postgres-maintenance", [
      ["01 · VERSIONS", "Writes leave current and dead tuple versions", "Pages, indexes, TOAST, HOT eligibility, and old snapshots retain physical state."],
      ["02 · DISCOVER", "Autovacuum selects maintenance work", "Thresholds, worker availability, wraparound age, and cost settings control timing."],
      ["03 · CLEAN", "Vacuum prunes and freezes safely", "Visibility horizons prevent removal of versions another snapshot still needs."],
      ["04 · REUSE", "Space and visibility metadata improve", "Dead tuples, page reuse, index cleanup, all-visible bits, and query plans reveal impact."]
    ], "Hold an old snapshot while updating rows, then compare cleanup before and after it ends.", "Tuple versions, n_dead_tup, xmin horizon, relfrozenxid age, visibility map, sizes, and vacuum log.");
  }
  if (lesson.trackId === "data-systems" && /modeling|constraints|data types|schema migrations/.test(title)) {
    return flow("database-invariant", [
      ["01 · FACT", "Business rule becomes a data model", "Entities, keys, types, cardinality, and lifecycle state the meaning."],
      ["02 · ENCODE", "Schema records the invariant", "Columns, constraints, relations, indexes, and compatible migrations make it executable."],
      ["03 · CONTEND", "Concurrent writes challenge the rule", "Database enforcement decides which outcomes may commit."],
      ["04 · EVOLVE", "Old and new code share the data", "Lock time, validation, backfill progress, rejected cases, and final shape prove safety."]
    ], "Submit two individually valid writes that violate the invariant only when combined.", "Constraint result, lock wait, committed rows, migration lock time, backfill checkpoint, and compatibility test.");
  }
  if (lesson.trackId === "data-systems" && /\bsql\b|query|index|join|plan|aggregate|window|subquer|cte|scan/.test(title)) {
    return flow("database-query", [
      ["01 · SQL", "Application submits a query", "Parameters and transaction context define the request."],
      ["02 · PLAN", "Optimizer chooses operations", "Statistics and indexes shape scans, joins, and order."],
      ["03 · EXECUTE", "Engine reads and transforms rows", "Buffers, locks, and I/O determine actual cost."],
      ["04 · RESULT", "Rows and metrics return", "The plan and timing reveal whether the model was correct."]
    ], "Change one index or predicate and compare estimated versus actual work.", "EXPLAIN plan, row estimates, buffers, locks, duration, and result correctness.");
  }
  if (lesson.trackId === "data-systems" && /transaction|mvcc|isolation|lock|deadlock/.test(title)) {
    return flow("database-transaction", [
      ["01 · BEGIN", "Transaction captures a database view", "Isolation level defines which changes are visible."],
      ["02 · READ / WRITE", "Statements acquire versions or locks", "Concurrent transactions may conflict."],
      ["03 · DECIDE", "Constraints and conflicts resolve", "The engine can wait, abort, commit, or require retry."],
      ["04 · COMMIT", "One atomic outcome becomes visible", "Other transactions observe the durable result."]
    ], "Run two conflicting transactions and predict the wait, error, or visible value.", "Transaction IDs, locks, snapshots, error code, retry, and final rows.");
  }
  if (lesson.trackId === "data-systems") {
    return flow("data-boundary", [
      ["01 · MODEL", "Application expresses an invariant", "Schema and access patterns turn meaning into constraints."],
      ["02 · STORAGE", "Database organizes durable state", "Indexes, pages, logs, and caches support access."],
      ["03 · COORDINATE", "Concurrency rules protect changes", "Transactions and locks define legal interleavings."],
      ["04 · RECOVER", "State survives failure", "Backups, logs, replicas, and checks prove durability."]
    ], "Break one assumption with concurrent or failed work and verify the invariant survives.", "Constraints, query plan, lock state, log position, replica state, and restored data.");
  }

  if (lesson.trackId === "api-distributed-systems" && title.startsWith("layer 4 and layer 7 load balancing")) {
    return flow("load-balancer-path", [
      ["01 · FLOW", "Client opens a transport connection", "Source and destination addresses, ports, protocol, TLS intent, and connection lifetime enter."],
      ["02 · CLASSIFY", "Balancer chooses Layer 4 or Layer 7 data", "A transport balancer maps flows; an HTTP balancer terminates and parses requests for content routing."],
      ["03 · SELECT", "Policy chooses a healthy target", "Round robin, least work, hashing, locality, affinity, capacity, and draining constrain selection."],
      ["04 · FORWARD", "Target response returns through the path", "Connection reuse, headers, retries, source identity, logs, metrics, and failures expose behavior."]
    ], "Hold one connection open, drain its target, fail a health check, and compare packet and HTTP evidence through L4 and L7 balancers.", "Five-tuple, connection table, TLS endpoint, HTTP route, target choice, health state, outstanding work, latency, retry, headers, and logs.");
  }
  if (lesson.trackId === "api-distributed-systems") {
    return flow("distributed-message", [
      ["01 · INTENT", "A client starts an operation", "Identity, deadline, and idempotency context are attached."],
      ["02 · NETWORK", "Message crosses an uncertain boundary", "It may be delayed, duplicated, reordered, or lost."],
      ["03 · SERVICE", "Receiver applies guarded state change", "Transactions, deduplication, and retries protect invariants."],
      ["04 · OUTCOME", "Caller sees success or uncertainty", "Logs and state must distinguish response loss from work loss."]
    ], "Drop the response after committing, then retry the same logical command.", "Correlation ID, attempt count, idempotency record, state change, and final response.");
  }

  if (lesson.trackId === "service-architecture-events" && /kafka/.test(title)) {
    return flow("kafka-record", [
      ["01 · PRODUCE", "Producer forms a keyed batch", "Serializer, partition metadata, compression, acknowledgement, idempotence, and deadline configure the write."],
      ["02 · APPEND", "Partition leader writes its log", "Offset, segment, sparse index, follower replication, ISR, and commit position govern durability."],
      ["03 · FETCH", "Consumer group owns partitions", "Assignment, fetch position, batching, rebalancing, and backpressure control parallel processing."],
      ["04 · SETTLE", "Effect and position become recoverable", "Idempotency, transaction scope, offset commit, retry, quarantine, lag, trace, and replay reveal correctness."]
    ], "Crash leader, producer, and consumer at different boundaries for one keyed event and inspect whether it is lost, repeated, reordered, or delayed.", "Key and partition, producer ID and sequence, leader/ISR, offset, segment, group assignment, committed position, duplicate effect, lag, and business outcome.");
  }
  if (lesson.trackId === "service-architecture-events" && /domain-driven|commands,|microservices/.test(title)) {
    return flow("domain-boundary", [
      ["01 · LANGUAGE", "Business capability defines meaning", "Domain experts and engineers name the subdomain, rules, actors, and ambiguous terms."],
      ["02 · MODEL", "Bounded context protects one model", "Entities, values, aggregates, invariants, services, and owned data express local policy."],
      ["03 · COMMIT", "Use case changes authoritative state", "Application orchestration and one transaction persist domain state plus outgoing intent."],
      ["04 · INTEGRATE", "Versioned contract crosses boundaries", "API or events carry limited meaning through translation, idempotency, observability, and team ownership."]
    ], "Change the meaning of one shared business term and prove only its owning context plus explicit integrations need modification.", "Context map, language definitions, aggregate test, transaction record, outbox event, integration contract, affected services, and deployment evidence.");
  }
  if (lesson.trackId === "service-architecture-events") {
    return flow("event-driven-workflow", [
      ["01 · FACT", "Producer commits a business event", "Stable identity, type, version, subject, time, and payload express a completed fact."],
      ["02 · BROKER", "Durable channel stores and fans out", "Partition, ordering, retention, delivery position, and flow control define transport behavior."],
      ["03 · REACT", "Independent consumer applies local policy", "Validation, authorization, idempotency, retry, and transaction ownership protect its effect."],
      ["04 · OPERATE", "Outcome and failure remain visible", "Correlation, lag, quarantine, replay, schema governance, and business metrics support recovery."]
    ], "Publish one valid event twice, one incompatible event, and one out-of-order event while a consumer is unavailable.", "Event ID/version, broker position, delivery attempts, consumer state, business effect count, lag, quarantine, trace, replay result, and final outcome.");
  }

  if (lesson.trackId === "retrieval-rag" && title.startsWith("vector database data model")) {
    return flow("vector-query", [
      ["01 · WRITE", "Vector and payload enter", "Dimension, model identity, point ID, metadata, and durability rules are validated."],
      ["02 · PLAN", "Query and filter become a plan", "Metric, tenant predicate, exact or approximate index, and search parameters select work."],
      ["03 · SEARCH", "Candidates receive distances", "The engine visits vectors, applies filters, computes scores, and keeps top-k."],
      ["04 · RETURN", "Current records become results", "Payload fetch, update or delete visibility, ordering, and consistency shape the response."]
    ], "Run the same query with three distance metrics and a selective tenant filter, then update and delete a winning point.", "Validated dimensions, query plan, visited candidates, distances, result IDs, filter selectivity, and update/delete visibility.");
  }
  if (lesson.trackId === "retrieval-rag" && title.startsWith("vector index internals")) {
    return flow("vector-index", [
      ["01 · BUILD", "Vectors become an index", "A full scan, graph links, centroids, or compressed codes trade build work and memory for search speed."],
      ["02 · ENTER", "Query chooses an entry region", "HNSW starts high in the graph; IVF selects the nearest centroid lists."],
      ["03 · EXPLORE", "A bounded candidate search runs", "ef_search, probes, and compressed estimates decide which true neighbors are never examined."],
      ["04 · MEASURE", "Candidates are ranked and checked", "Exact ground truth reveals recall while timing and memory reveal the price."]
    ], "Sweep one search parameter on fixed labeled queries and explain a missed neighbor from the visited graph nodes or centroid lists.", "Index parameters, build time, bytes per vector, visited candidates, exact IDs, approximate IDs, recall@k, and latency percentiles.");
  }
  if (lesson.trackId === "retrieval-rag" && title.startsWith("vector database storage")) {
    return flow("vector-storage", [
      ["01 · LOG", "Accepted mutation enters the WAL", "A sequence number makes acknowledged changes replayable after a crash."],
      ["02 · SEGMENT", "Mutable storage applies the version", "Vector, payload, ID mapping, and indexes expose the newest point state."],
      ["03 · MAINTAIN", "Tombstones and segments are rebuilt", "Vacuum, merge, indexing, and copy-on-write reclaim space without stopping reads."],
      ["04 · DISTRIBUTE", "Shards and replicas preserve service", "Routing, acknowledgements, snapshots, and restore tests define failure behavior."]
    ], "Create update/delete churn, interrupt a writer, compact, and restore a snapshot while checking the same tenant-scoped queries.", "WAL sequence, segment versions, tombstone count, optimizer state, shard/replica status, recall, p95 latency, and restored point IDs.");
  }
  if (lesson.trackId === "retrieval-rag") {
    return flow("rag-query", [
      ["01 · QUESTION", "User asks with implicit intent", "Rewrite and filters make the retrieval need explicit."],
      ["02 · RETRIEVE", "Search selects candidate evidence", "Lexical and vector signals trade recall and precision."],
      ["03 · ASSEMBLE", "Reranking builds grounded context", "Relevant, diverse passages fit the context budget."],
      ["04 · ANSWER", "Model responds from evidence", "Citations and evaluation reveal support or hallucination."]
    ], "Remove the best passage or change top-k and predict answer support.", "Retrieved IDs, scores, context text, citations, answer metric, and latency.");
  }
  if (lesson.trackId === "agents" && title.startsWith("langchain")) {
    return flow("langchain-agent", [
      ["01 · MESSAGE", "Typed request enters agent state", "System and user messages define the current task."],
      ["02 · MODEL", "Agent asks the model for a decision", "The compiled loop exposes allowed tools and structured output."],
      ["03 · CONTROL", "Tools and middleware handle the step", "Validation, retries, permissions, streaming, and errors stay in application control."],
      ["04 · RESULT", "State returns a validated response", "Messages, structured output, updates, and traces expose the run."]
    ], "Return a malformed tool result, then verify validation or middleware handles it without inventing state.", "Message objects, tool arguments and result, streamed step updates, structured response, error, latency, and trace.");
  }
  if (lesson.trackId === "agents" && title.startsWith("llm system blueprint")) {
    return flow("llm-system-react", [
      ["01 · CONTEXT", "System assembles bounded model input", "Instructions, user input, selected memory, evidence, tools, identity, and budgets enter."],
      ["02 · REASON / ACT", "Model answers or proposes a tool", "Application validates the structured proposal and authorizes its requested capability."],
      ["03 · OBSERVE", "Tool result returns to controlled state", "Typed errors, audit data, and observations become context for the next decision."],
      ["04 · STOP", "Loop returns output or reaches a limit", "Schema checks, step and cost budgets, traces, and evaluations make the result inspectable."]
    ], "Give the model an unknown tool and then exhaust the step budget; verify both failures stop safely.", "Messages, selected context, tool proposal, authorization, observation, state update, step count, stop reason, latency, cost, and trace.");
  }
  if (lesson.trackId === "agents" && title.startsWith("langgraph")) {
    return flow("langgraph-execution", [
      ["01 · STATE", "Invocation loads typed graph state", "Thread identity selects the checkpoint history."],
      ["02 · NODE", "One node returns a state update", "Reducers combine updates according to the declared state contract."],
      ["03 · ROUTE", "An edge selects the next node", "A condition, Command, or interrupt controls progress."],
      ["04 · CHECKPOINT", "Runtime saves or resumes execution", "Durable state makes pause, recovery, and replay observable."]
    ], "Interrupt before a sensitive action, restart the worker, then resume with the same thread ID twice.", "Checkpoint versions, pending interrupt, state before and after resume, routed node, idempotency key, side-effect count, and final status.");
  }
  if (lesson.trackId === "agents" && /model context protocol|mcp transports/.test(title)) {
    return flow("mcp-session", [
      ["01 · CONNECT", "Host creates one MCP client", "A local stdio process or remote HTTP endpoint supplies the transport and trust boundary."],
      ["02 · NEGOTIATE", "Client and server initialize", "Protocol version, identities, and capabilities determine legal later requests."],
      ["03 · OPERATE", "JSON-RPC carries MCP primitives", "Tools, resources, prompts, notifications, cancellation, authorization, and consent govern work."],
      ["04 · OBSERVE", "Result or failure returns to host", "Request IDs, session state, traces, audit events, and shutdown expose the complete lifecycle."]
    ], "Capture every frame for initialize, discovery, one successful call, one unsupported request, cancellation, and shutdown.", "Transport bytes, JSON-RPC IDs, negotiated capabilities, auth decision, tool arguments, result or error, cancellation, and correlated trace.");
  }
  if (lesson.trackId === "agents") {
    return flow("agent-step", [
      ["01 · STATE", "Goal and current context", "The loop sees messages, memory, permissions, and budget."],
      ["02 · DECIDE", "Model proposes the next action", "Tool schema and policy constrain available choices."],
      ["03 · EXECUTE", "Tool changes or observes reality", "Failures, approvals, retries, and idempotency matter."],
      ["04 · UPDATE", "Result returns to controlled state", "The loop stops, recovers, or plans another step."]
    ], "Make the tool fail after a partial effect and verify recovery does not duplicate work.", "State transition, tool arguments, approval, side effect, retry count, and stop reason.");
  }
  if (lesson.trackId === "ai-quality-safety" && title.startsWith("llm benchmarking")) {
    return flow("llm-benchmark", [
      ["01 · SUITE", "Versioned cases and slices are frozen", "Inputs, references, rubrics, and product risks define fair comparison."],
      ["02 · CANDIDATES", "Configurations run under equal controls", "Models, prompts, tools, budgets, and concurrency are recorded."],
      ["03 · REPEAT", "Trials collect quality and operations data", "Repetitions expose output variance, latency, tokens, errors, and cost."],
      ["04 · COMPARE", "Evidence is compared with the baseline", "Slice regressions, uncertainty, and practical thresholds decide the result."]
    ], "Repeat both candidates on the same cases, then change the dataset order and concurrency without changing the scoring rules.", "Dataset and code versions, per-case scores, slice means, variance, latency percentiles, token use, cost, errors, and baseline deltas.");
  }
  if (lesson.trackId === "ai-quality-safety") {
    return flow("ai-evaluation", [
      ["01 · CASE", "Versioned input and expectation", "Dataset slices represent important users and failures."],
      ["02 · RUN", "System produces an output", "Model, prompt, tools, retrieval, and configuration are recorded."],
      ["03 · SCORE", "Checks apply a rubric", "Deterministic rules, model graders, and humans cover different risks."],
      ["04 · DECIDE", "Evidence gates a change", "Regressions, uncertainty, cost, and safety shape release."]
    ], "Change one system component and compare results on the same frozen cases.", "Version IDs, per-slice scores, grader rationale, disagreement, latency, and cost.");
  }
  if (lesson.trackId === "llm-internals") {
    return flow("llm-computation", [
      ["01 · TEXT", "Input becomes token IDs", "Tokenizer choices define the model's discrete symbols."],
      ["02 · REPRESENT", "Embeddings carry token and position", "Vectors enter repeated transformer blocks."],
      ["03 · TRANSFORM", "Attention and MLP layers mix information", "Weights and activations produce next-token logits."],
      ["04 · DECODE", "A token is selected and appended", "Sampling settings turn logits into observable output."]
    ], "Change tokenization or decoding settings while holding the prompt fixed.", "Token IDs, attention or logits where available, selected token, latency, and output variance.");
  }
  if (lesson.trackId === "ai-application-engineering" && /ai frontend streaming|generative ui|conversation persistence/.test(title)) {
    return flow("ai-frontend", [
      ["01 · INTENT", "User action becomes a durable request", "Authentication, chat ownership, message ID, idempotency key, and abort signal cross to the server."],
      ["02 · STREAM", "Typed events cross incrementally", "Framing reconstructs text, data, citation, tool, error, and completion parts from arbitrary byte chunks."],
      ["03 · RECONCILE", "UI state applies each event", "A typed state machine handles approval, optimistic state, accessible status, cancellation, and errors."],
      ["04 · RESUME", "Server truth repairs interruption", "Persisted sequence IDs let reconnection replay missing events without duplicating messages or effects."]
    ], "Disconnect halfway through a tool call, reload, resume from the last committed event, and attempt access as another user.", "Request/message/stream IDs, raw frames, event sequence, render count, focus and announcements, auth denial, persisted state, and final evaluation.");
  }
  if (lesson.trackId === "ai-application-engineering") {
    return flow("model-request", [
      ["01 · CONTRACT", "Application builds model input", "Instructions, messages, schemas, and permissions are explicit."],
      ["02 · PROVIDER", "Request crosses an API boundary", "Rate limits, latency, caching, and failure modes apply."],
      ["03 · VALIDATE", "Output is parsed and checked", "Schema, policy, and grounding decide whether it is usable."],
      ["04 · ACT", "Product publishes or executes", "Fallbacks and observability control user-visible impact."]
    ], "Return malformed or delayed model output and verify the product fails safely.", "Request version, raw response, parse error, retry/fallback, latency, cost, and final action.");
  }
  if (lesson.trackId === "ml-foundations") {
    return flow("ml-experiment", [
      ["01 · DATA", "Examples define the observed world", "Splits and features determine what the model may learn."],
      ["02 · TRAIN", "Optimization adjusts parameters", "Loss and regularization encode what counts as better."],
      ["03 · PREDICT", "Model maps features to output", "Inference applies the fitted representation to new data."],
      ["04 · EVALUATE", "Metrics test generalization", "Slices and baselines reveal useful and harmful behavior."]
    ], "Change one feature or split while holding the evaluation protocol fixed.", "Dataset version, loss curve, parameters, predictions, slice metrics, and baseline.");
  }

  if (lesson.trackId === "cloud-aws" && /IAM|STS|KMS|Secrets/.test(lesson.title)) {
    return flow("aws-authorization", [
      ["01 · PRINCIPAL", "A signed AWS request arrives", "Identity, session, action, resource, and context are known."],
      ["02 · POLICY", "Authorization policies combine", "Identity, resource, boundary, session, and SCP rules apply."],
      ["03 · DECISION", "Explicit deny or effective allow", "The service accepts or rejects the requested action."],
      ["04 · AUDIT", "The API outcome is recorded", "Caller, request, resource, and error become inspectable."]
    ], "Run one allowed and one explicitly denied request with the same role.", "Caller identity, policy simulator, encoded denial, service response, and CloudTrail.");
  }
  if (lesson.trackId === "cloud-aws" && /VPC|gateway|Security groups|Load Balancing|Route 53|CloudFront/.test(lesson.title)) {
    return flow("aws-network-request", [
      ["01 · NAME / ROUTE", "Client selects an endpoint", "DNS, address family, and route tables choose a path."],
      ["02 · FILTER", "Network controls admit traffic", "Gateways, security groups, NACLs, and firewalls decide."],
      ["03 · SERVICE", "Edge or load balancer selects target", "Health, listener, cache, and target policy apply."],
      ["04 · RESPONSE", "Return traffic reaches the client", "State, latency, headers, and logs expose the path."]
    ], "Break one route or rule, predict the failure layer, then prove it from network evidence.", "DNS answer, routes, reachability, flow logs, listener decision, target health, and timing.");
  }
  if (lesson.trackId === "cloud-aws" && /S3|EBS|EFS|FSx|RDS|DynamoDB|ElastiCache/.test(lesson.title)) {
    return flow("aws-data-request", [
      ["01 · ACCESS", "Workload requests data", "Identity, endpoint, key or query, and consistency need are explicit."],
      ["02 · AUTHORIZE", "Service checks the boundary", "Policies, encryption keys, network path, and resource state apply."],
      ["03 · STORE / READ", "Managed data plane performs work", "Partitions, replicas, caches, locks, and capacity shape behavior."],
      ["04 · OUTCOME", "Data or a typed failure returns", "Latency, capacity, durability, and audit signals are observable."]
    ], "Change consistency, capacity, or failure state and predict the returned data and latency.", "Request metrics, throttles, query or key, replica state, audit event, and restored data.");
  }
  if (lesson.trackId === "cloud-aws" && /SQS|SNS|EventBridge|Step Functions|Kinesis|MSK/.test(lesson.title)) {
    return flow("aws-event-delivery", [
      ["01 · PUBLISH", "Producer emits a command or event", "Schema, partition or group key, identity, and trace context enter."],
      ["02 · BUFFER / ROUTE", "Managed service stores or matches", "Durability, ordering, retention, and rules define the path."],
      ["03 · CONSUME", "Worker handles a delivery", "Visibility, checkpoints, retries, and idempotency control progress."],
      ["04 · SETTLE", "Acknowledge, retry, or dead-letter", "Lag, duplicate effects, and failure state become evidence."]
    ], "Fail a consumer after its side effect and verify redelivery does not duplicate the outcome.", "Message ID, receive count, offset, queue age, workflow history, DLQ, and business state.");
  }
  if (lesson.trackId === "cloud-aws" && /CloudFormation|CDK|production architecture|Well-Architected|cost models/.test(lesson.title)) {
    return flow("aws-architecture-change", [
      ["01 · REQUIREMENT", "Workload constraint becomes design", "Security, reliability, performance, cost, and operations are stated."],
      ["02 · PLAN", "IaC forms a dependency graph", "Accounts, Regions, services, quotas, and replacement risk become explicit."],
      ["03 · APPLY", "AWS APIs change real resources", "Partial failure and rollback behavior must be observed."],
      ["04 · OPERATE", "Telemetry and cost test the design", "Review, game days, drift, and incidents drive the next change."]
    ], "Review a destructive or failing change and verify recovery without console drift.", "Change set, API events, stack state, alarms, cost allocation, recovery time, and drift.");
  }
  if (lesson.trackId === "cloud-aws") {
    return flow("aws-service-request", [
      ["01 · CALLER", "A workload requests AWS capability", "Account, role, Region, endpoint, and parameters identify intent."],
      ["02 · CONTROL PLANE", "AWS validates and configures", "Authorization, quotas, desired state, and service scope apply."],
      ["03 · DATA PLANE", "Managed resources perform work", "Compute, storage, network, and scaling boundaries execute."],
      ["04 · EVIDENCE", "Outcome enters operations", "Response, telemetry, audit, cost, and failure behavior prove reality."]
    ], "Change one identity, Region, quota, or dependency and predict the API and workload outcome.", "AWS API response, resource state, CloudTrail, CloudWatch, quota, cost, and client behavior.");
  }
  if (lesson.trackId === "devops") {
    return flow("delivery-change", [
      ["01 · SOURCE", "Reviewed change identifies intent", "Code, configuration, and dependencies are versioned."],
      ["02 · BUILD", "CI creates an immutable artifact", "Tests and scans attach evidence to one identity."],
      ["03 · DEPLOY", "Platform rolls out that artifact", "Health, capacity, secrets, and strategy control exposure."],
      ["04 · OPERATE", "Telemetry confirms behavior", "Rollback or progression follows production evidence."]
    ], "Fail readiness during a staged rollout and verify traffic and rollback behavior.", "Commit, artifact digest, test result, rollout state, health, metrics, and rollback event.");
  }
  if (lesson.trackId === "docker" && /Dockerfile|Build context|BuildKit|image|registr/.test(lesson.title)) {
    return flow("docker-image-build", [
      ["01 · CONTEXT", "Builder receives declared inputs", "Dockerfile, context, base digests, args, and mounts enter."],
      ["02 · BUILD GRAPH", "BuildKit evaluates dependencies", "Cache keys decide which operations execute or reuse output."],
      ["03 · IMAGE", "Layers and config form a manifest", "Content digests identify immutable platform artifacts."],
      ["04 · VERIFY", "Registry and policy inspect output", "SBOM, provenance, signature, scan, and test attach evidence."]
    ], "Change one dependency and predict exactly which build nodes invalidate.", "Context size, build log, cache hits, layer history, digest, SBOM, and signature.");
  }
  if (lesson.trackId === "docker" && /network/.test(lesson.title)) {
    return flow("docker-network-packet", [
      ["01 · PROCESS", "Container opens a socket", "Its network namespace owns interfaces, routes, and localhost."],
      ["02 · BRIDGE / DNS", "Docker resolves and forwards", "Embedded DNS and bridge networking locate the peer."],
      ["03 · NAT / HOST", "Published or outbound traffic crosses", "Host firewall and translation select external paths."],
      ["04 · PEER", "Destination returns traffic", "Connection state, packet path, and application response are visible."]
    ], "Break DNS, route, or published-port configuration one at a time.", "Container routes, resolv.conf, network inspect, host sockets, packets, and response.");
  }
  if (lesson.trackId === "docker" && /volume|mount|filesystem|storage/.test(lesson.title)) {
    return flow("docker-storage", [
      ["01 · IMAGE", "Read-only layers provide files", "Overlay storage exposes the packaged filesystem."],
      ["02 · WRITABLE", "Container creates runtime changes", "Copy-on-write state belongs to this container."],
      ["03 · MOUNT", "External storage replaces a path", "Volume, bind, or tmpfs ownership and lifetime apply."],
      ["04 · RECOVER", "Data survives or disappears", "Removal and restore tests prove the chosen lifecycle."]
    ], "Write the same file to layer, volume, bind mount, and tmpfs, then remove the container.", "Mount metadata, host path, layer diff, volume content, permissions, and restored data.");
  }
  if (lesson.trackId === "docker") {
    return flow("docker-container-run", [
      ["01 · IMAGE + CONFIG", "Docker resolves runtime intent", "Digest, command, user, mounts, network, and limits enter."],
      ["02 · DAEMON", "Docker creates runtime objects", "Filesystem snapshot, namespaces, cgroups, and interfaces form."],
      ["03 · PROCESS", "Runtime starts container PID 1", "Kernel isolation and application lifecycle govern execution."],
      ["04 · EXIT", "State and evidence remain", "Logs, health, metrics, exit code, events, and persistent mounts explain outcome."]
    ], "Run once with one incorrect user, signal, or resource limit and diagnose it.", "Inspect output, namespace and cgroup state, logs, health, stats, events, and exit code.");
  }
  if (lesson.trackId === "kubernetes" && /Service|Ingress|Gateway|DNS|network model|CNI/.test(lesson.title)) {
    return flow("kubernetes-network", [
      ["01 · CLIENT POD", "A connection targets a name", "DNS resolves a Service or external route."],
      ["02 · SERVICE", "Stable identity selects endpoints", "Selectors and readiness produce EndpointSlices."],
      ["03 · DATA PLANE", "CNI and proxy route packets", "NetworkPolicy and node routing admit the flow."],
      ["04 · SERVER POD", "Application handles traffic", "Response, policy logs, endpoint state, and latency prove the path."]
    ], "Break selector, readiness, DNS, and policy separately and predict each symptom.", "DNS answer, Service, EndpointSlice, routes, policies, packets, and application response.");
  }
  if (lesson.trackId === "kubernetes" && /Security|ServiceAccounts|RBAC|Secrets|ConfigMaps/.test(lesson.title)) {
    return flow("kubernetes-policy", [
      ["01 · IDENTITY", "User or workload calls the API", "TLS, token, verb, resource, namespace, and object enter."],
      ["02 · AUTHORIZE", "RBAC evaluates allowed actions", "Bindings connect subjects to additive role rules."],
      ["03 · ADMIT", "Policy validates or mutates object", "Security and organizational constraints apply before persistence."],
      ["04 · ENFORCE", "Node runtime applies the spec", "Identity, secret projection, and kernel controls become observable."]
    ], "Attempt one forbidden API action and one policy-violating Pod.", "auth can-i, audit event, admission response, stored object, runtime identity, and denial.");
  }
  if (lesson.trackId === "kubernetes" && /PersistentVolume|StatefulSet|storage/.test(lesson.title)) {
    return flow("kubernetes-storage", [
      ["01 · CLAIM", "Workload requests storage", "Capacity, class, access mode, and topology describe need."],
      ["02 · PROVISION", "Controller binds or creates volume", "CSI and scheduler coordinate suitable infrastructure."],
      ["03 · ATTACH + MOUNT", "Node exposes storage to Pod", "Kubelet and CSI complete device and filesystem steps."],
      ["04 · RETAIN / RESTORE", "Lifecycle outlives the Pod", "Reclaim, snapshot, backup, and recovery determine data safety."]
    ], "Delete and reschedule the Pod, then snapshot and restore its data.", "PVC/PV status, events, VolumeAttachment, mount, reclaim policy, snapshot, and data.");
  }
  if (lesson.trackId === "kubernetes" && /Deployment|DaemonSet|Job|autoscal|Affinity|Cluster operations/.test(lesson.title)) {
    return flow("kubernetes-workload-reconcile", [
      ["01 · SPEC", "Desired workload enters the API", "Template, replicas, resources, placement, and strategy are stored."],
      ["02 · CONTROLLERS", "Reconcilers create child objects", "ReplicaSets, Jobs, autoscalers, and ownership update desired work."],
      ["03 · SCHEDULE + RUN", "Pods bind to nodes and start", "Scheduler, kubelet, runtime, CNI, and CSI cooperate."],
      ["04 · STATUS", "Health drives the next reconcile", "Conditions, events, metrics, and failures change controller action."]
    ], "Break readiness or capacity during a rollout and follow every controller decision.", "Spec/status, owner tree, events, scheduler result, kubelet state, readiness, and rollout.");
  }
  if (lesson.trackId === "kubernetes") {
    return flow("kubernetes-api-reconcile", [
      ["01 · APPLY", "Client submits desired API state", "Identity, object version, spec, and field ownership enter."],
      ["02 · API SERVER", "Request is authorized and stored", "Admission, validation, conversion, etcd, and watch events apply."],
      ["03 · RECONCILE", "Controller or node agent acts", "Observed state is moved toward the declared spec."],
      ["04 · STATUS", "Reality is reported through the API", "Conditions, events, resources, and data-plane behavior show progress."]
    ], "Change one spec field and watch API, controller, scheduler, and node evidence.", "Audit event, resourceVersion, watch stream, owners, conditions, events, Pod state, and traffic.");
  }
  if (lesson.trackId === "quality-security" && title.startsWith("production webhooks")) {
    return flow("webhook-delivery", [
      ["01 · COMMIT", "Provider records event and delivery", "A stable event ID and version connect the business transaction to an outbox or delivery record."],
      ["02 · SIGN + SEND", "Raw body crosses HTTP", "Timestamped HMAC, timeout, attempt number, and secret version travel with the request."],
      ["03 · VERIFY + STORE", "Consumer authenticates and persists", "Raw-byte verification, freshness, schema checks, unique event ID, and transaction precede acknowledgment."],
      ["04 · PROCESS", "Worker applies effect once", "Retries, duplicates, disorder, dead letters, and rotation are visible without pretending exactly-once transport."]
    ], "Commit the event, lose the first response, alter one byte, replay an old request, and rotate from the old secret to the new one.", "Event and delivery IDs, raw digest, timestamp, signature decision, attempts, stored receipt, job state, business effect count, and dead letter.");
  }
  if (lesson.trackId === "quality-security" && title.startsWith("application file storage")) {
    return flow("file-lifecycle", [
      ["01 · AUTHORIZE", "Server creates a narrow upload grant", "Owner, object key, byte limit, media policy, checksum, and short expiry constrain capability."],
      ["02 · TRANSFER", "Client sends bytes to storage", "Multipart parts, retry, checksum, encryption, and private access avoid proxying large files through the app."],
      ["03 · QUARANTINE", "Server validates stored content", "Size, magic bytes, parser limits, malware scan, and metadata determine promotion or rejection."],
      ["04 · SERVE / DELETE", "Authorized lifecycle continues", "Safe download headers, versions, retention, cleanup, and audit evidence govern every later operation."]
    ], "Upload a valid file, a mislabeled executable, an oversized multipart file, and an abandoned upload; then revoke download access.", "Grant conditions, object checksum and size, multipart state, scanner result, metadata transition, authorization decision, lifecycle action, and bytes removed.");
  }
  if (lesson.trackId === "quality-security" && title.startsWith("background jobs")) {
    return flow("background-job", [
      ["01 · ENQUEUE", "Transaction makes work durable", "Payload reference, idempotency key, schedule, attempt budget, and trace context become a job."],
      ["02 · LEASE", "One worker reserves delivery", "A visibility deadline or database lock prevents normal concurrent handling without guaranteeing uniqueness."],
      ["03 · EXECUTE", "Handler applies an idempotent effect", "Heartbeats, deadlines, cancellation, and graceful shutdown manage long work."],
      ["04 · SETTLE", "Acknowledge, retry, or dead-letter", "Crash recovery, exponential backoff, poison work, lag, and business outcome remain inspectable."]
    ], "Crash after the business effect but before acknowledgment, wait for the lease to expire, and let another worker receive the same job.", "Job and idempotency IDs, enqueue commit, lease owner/deadline, attempts, heartbeat, business effect count, retry time, dead letter, and queue lag.");
  }
  if (lesson.trackId === "quality-security" && /audit logs|admin systems/.test(title)) {
    return flow("privileged-control", [
      ["01 · REQUEST", "Authenticated actor asks for change", "Role, recent authentication, scope, target, reason, correlation, and idempotency state are explicit."],
      ["02 · GUARD", "Server evaluates safety policy", "Deny-by-default authorization, preview, confirmation, approval, rate limit, and conflict checks run."],
      ["03 · APPLY", "Bounded privileged operation commits", "A transaction and reversible design contain partial work, retries, mistakes, or abuse."],
      ["04 · EVIDENCE", "Append-only audit event supports review", "Actor, action, target, outcome, changes, hash linkage, restricted access, and retention enable investigation."]
    ], "Preview a bulk action, deny an out-of-scope operator, repeat the approved request, impersonate with a reason, and verify the audit chain.", "Actor/session, policy decision, approval and reason, target set, idempotency record, state diff, outcome, audit hash, alert, and rollback result.");
  }
  if (lesson.trackId === "quality-security") {
    return flow("quality-security", [
      ["01 · CLAIM", "Requirement or trust assumption", "State the behavior or protection that must hold."],
      ["02 · STIMULUS", "Test or attacker exercises boundary", "Valid, invalid, concurrent, and hostile inputs differ."],
      ["03 · CONTROL", "Code and infrastructure respond", "Validation, authorization, isolation, and recovery apply."],
      ["04 · EVIDENCE", "Result supports or rejects claim", "A reproducible failure is more useful than reassurance."]
    ], "Construct the smallest adversarial case that could disprove the claim.", "Test result, security event, state before/after, error path, and reproducible steps.");
  }
  if (lesson.trackId === "lld-machine-coding") {
    return flow("machine-coding-slice", [
      ["01 · CLARIFY", "Prompt becomes executable requirements", "Actors, use cases, constraints, invariants, assumptions, and omissions bound the work."],
      ["02 · MODEL", "Responsibilities and ownership become code", "Entities, values, relationships, interfaces, and state transitions represent the domain."],
      ["03 · SLICE", "One end-to-end behavior runs", "The smallest implementation crosses policy and adapters while keeping state valid."],
      ["04 · PROVE + EVOLVE", "Tests and a changed requirement challenge it", "Acceptance evidence, edge cases, complexity, and a real extension expose design quality."]
    ], "Add one realistic requirement after the first working slice and predict the smallest safe change.", "Passing assertions, invariant state, public call trace, changed files or methods, failure behavior, and stated omissions.");
  }
  if (lesson.trackId === "systems-foundations" && /request to wire|ipv4|routing tables|udp, tcp|tcp flow control|dns resolution/.test(title)) {
    return flow("network-packet-path", [
      ["01 · APP", "Application creates a message", "A URL, payload, and protocol semantics define the intended exchange."],
      ["02 · RESOLVE + CONNECT", "Names and peers become addresses", "DNS, routes, neighbors, sockets, and security establish a reachable endpoint."],
      ["03 · TRANSPORT + ROUTE", "Bytes cross layered networks", "TCP or UDP, IP forwarding, link frames, and congestion controls move bounded units."],
      ["04 · PEER", "The destination observes the request", "Acknowledgments, responses, packet captures, and errors expose the outcome."]
    ], "Change one address, route, MTU, or loss condition and predict where the exchange changes.", "Socket state, route and neighbor tables, packet capture fields, latency, retransmissions, and response status.");
  }
  if (lesson.trackId === "systems-foundations") {
    return flow("kernel-resource-path", [
      ["01 · PROCESS", "User code requests an operation", "A thread supplies arguments through a library or runtime boundary."],
      ["02 · SYSCALL + KERNEL", "The kernel validates and coordinates", "Permissions, descriptors, scheduling, memory, and isolation rules apply."],
      ["03 · RESOURCE", "A CPU, page, file, or device changes", "Kernel subsystems perform work while preserving ownership and concurrency invariants."],
      ["04 · OBSERVE", "Control and evidence return", "A value, error, signal, trace, metric, or durable state makes the result visible."]
    ], "Constrain or fail one resource and predict the syscall result and kernel evidence.", "Return values, errno, process state, scheduler events, memory counters, file metadata, and resource limits.");
  }
  if (lesson.trackId === "computer-science") {
    return flow("algorithm-execution", [
      ["01 · INPUT", "Problem instance and constraints", "Size, ordering, duplicates, and limits shape the choice."],
      ["02 · STRUCTURE", "Representation enables operations", "Invariants determine which transitions are legal."],
      ["03 · ALGORITHM", "Steps transform state", "Time and space accumulate across the execution."],
      ["04 · OUTPUT", "Result and cost are checked", "Examples and growth measurements test correctness and complexity."]
    ], "Double input size and predict both the result and resource growth.", "Invariant checks, operation count, output, runtime samples, and peak memory.");
  }
  if (lesson.trackId === "software-design" && /pattern literacy|creational patterns|structural patterns|behavioral patterns/.test(title)) {
    return flow("pattern-decision", [
      ["01 · PROBLEM", "A repeated design pressure appears", "Current requirements, change axes, constraints, and direct-design pain are observable."],
      ["02 · FORCES", "Competing needs shape the choice", "Simplicity, coupling, lifetime, state, failure, performance, and team understanding conflict."],
      ["03 · STRUCTURE", "A named pattern assigns responsibilities", "Objects, functions, messages, and dependencies cooperate for a stated intent."],
      ["04 · CONSEQUENCE", "Evidence tests the added indirection", "Change cost, tests, traces, failure behavior, and alternatives show whether the pattern earns its complexity."]
    ], "Implement the direct design first, add one real variation, then compare it with the smallest suitable pattern.", "Requirement delta, dependency graph, files changed, test cases, runtime trace, failure path, and deleted or added code.");
  }
  if (lesson.trackId === "software-design" && /code smells|refactoring/.test(title)) {
    return flow("safe-refactoring", [
      ["01 · OBSERVE", "Current behavior is captured", "Characterization tests and runtime evidence define what must remain unchanged."],
      ["02 · SEAM", "One dependency becomes controllable", "A small extraction or parameter creates a place to test and change safely."],
      ["03 · TRANSFORM", "One refactoring changes structure", "A named small step keeps the program executable and avoids mixing new behavior."],
      ["04 · VERIFY", "Behavior and design are compared", "Tests, diff, complexity, dependencies, and reader explanation confirm or reject improvement."]
    ], "Refactor one smell through separate executable commits and deliberately break a characterization test between two steps.", "Baseline outputs, test result per commit, diff, complexity, dependency count, runtime profile, and review explanation.");
  }
  if (lesson.trackId === "software-design" && /architecture patterns/.test(title)) {
    return flow("architecture-boundary", [
      ["01 · INTENT", "A use case enters one application boundary", "Validated input, identity, transaction need, and expected outcome are explicit."],
      ["02 · POLICY", "Domain and application rules decide", "Stable business logic depends on owned ports rather than frameworks or vendors."],
      ["03 · ADAPTER", "Infrastructure performs external work", "HTTP, database, queue, clock, and model details translate at the edge."],
      ["04 · COMMIT", "One observable outcome completes", "Transaction state, response, events, tests, and telemetry prove boundary behavior."]
    ], "Replace one database adapter and move one feature between folders without changing the domain or application contract.", "Import graph, use-case test, transaction trace, adapter contract test, changed files, deployment boundary, and response.");
  }
  if (lesson.trackId === "software-design") {
    return flow("design-change", [
      ["01 · CHANGE", "A concrete requirement creates pressure", "The requested behavior and likely reasons to change identify the real design problem."],
      ["02 · LOCATE", "Code ownership and dependencies are traced", "Names, cohesion, coupling, state, contracts, and boundaries reveal the affected area."],
      ["03 · MODIFY", "The smallest clear design changes", "Simple control flow, narrow capabilities, composition, tests, and explicit tradeoffs contain impact."],
      ["04 · COMPARE", "Evidence measures the result", "Behavior, files changed, dependency direction, complexity, readability, and failure handling test the claim."]
    ], "Apply one realistic change before and after the refactor and compare how much unrelated code must be understood or edited.", "Passing behavior tests, dependency graph, affected files, mutation points, complexity, reader explanation, and review feedback.");
  }
  if (lesson.trackId === "engineering-foundations") {
    return flow("engineering-change", [
      ["01 · INTENT", "Developer states the desired change", "Constraints and acceptance evidence make it testable."],
      ["02 · TOOL", "System transforms local state", "Shell, Git, dependencies, or documentation records work."],
      ["03 · VERIFY", "Checks inspect the result", "Diffs, tests, commands, and review challenge assumptions."],
      ["04 · SHARE", "Reproducible evidence travels", "Another engineer can understand, run, and reverse the change."]
    ], "Repeat the change from a clean state and deliberately violate one assumption.", "Command, diff, object identity, test output, environment, and recovery steps.");
  }
  if (lesson.trackId === "portfolio-capstone") {
    return flow("portfolio-journey", [
      ["01 · USER", "A real need initiates the journey", "Success criteria connect product value to engineering."],
      ["02 · PRODUCT", "Interface captures intent", "Validation and accessibility protect the interaction."],
      ["03 · SYSTEM", "Services, data, and AI coordinate", "Boundaries and failure handling preserve invariants."],
      ["04 · EVIDENCE", "Outcome proves capability", "Demo, tests, evaluation, telemetry, and case study support claims."]
    ], "Demonstrate the happy path and one production failure without hiding the evidence.", "User outcome, trace, test, evaluation score, operational metric, and architecture decision.");
  }
  if (lesson.trackId === "international-interviews") {
    if (/role targeting|resume architecture|linkedin profile|github profile|portfolio presentations/.test(title)) {
      return flow("career-evidence", [
        ["01 · TARGET", "Choose the role signal", "Extract repeated responsibilities, level, location, and hiring constraints."],
        ["02 · PROVE", "Select truthful evidence", "A bullet, repository, demo, or story supports each important claim."],
        ["03 · PUBLISH", "Make evidence discoverable", "Resume, LinkedIn, GitHub, and portfolio tell one consistent narrative."],
        ["04 · VERIFY", "A reviewer can inspect it", "Text extraction, links, metrics, and live questions test credibility."]
      ], "Ask another engineer to assess role fit in five minutes using only the published artifacts.", "Requirement matrix, extracted resume text, profile preview, repository links, demo, and reviewer notes.");
    }
    if (/job portals|application tracking|safe automation|networking|open source|referrals|communities|outreach/.test(title)) {
      return flow("job-search-pipeline", [
        ["01 · DISCOVER", "Permitted sources reveal roles", "Official career pages, alerts, portals, communities, and contacts widen coverage."],
        ["02 · VERIFY", "Human checks role and employer", "Official domains, fit, eligibility, freshness, and fraud signals gate action."],
        ["03 · APPLY", "Evidence is tailored truthfully", "A person reviews every application, message, and referral request."],
        ["04 · LEARN", "Local records improve the search", "Stages, replies, deadlines, and conversion rates guide the next action."]
      ], "Import one permitted alert into the local tracker, deduplicate it, verify the employer, and schedule a human-reviewed action.", "Source URL, employer domain, dedupe key, fit score, consent, stage history, reminder, and conversion metric.");
    }
    if (/coding interview method|javascript and python coding/.test(title)) {
      return flow("coding-interview", [
        ["01 · CONTRACT", "Clarify inputs and constraints", "Examples, edge cases, scale, and allowed tools define correctness."],
        ["02 · REASON", "State invariant and approach", "Brute force creates a baseline before justified optimization."],
        ["03 · IMPLEMENT", "Write executable code aloud", "Readable language primitives preserve the reasoning trail."],
        ["04 · TEST", "Evidence challenges the solution", "Boundary cases, dry runs, complexity, and debugging expose errors."]
      ], "Solve one problem under time, then replay the recording and locate the first reasoning error.", "Clarifications, invariant, examples, executable code, failing case, fix, and complexity.");
    }
    if (/full-stack technical|system-design interviews|ai engineering interviews/.test(title)) {
      return flow("technical-interview", [
        ["01 · FRAME", "Define the system and constraints", "Users, scale, quality, security, latency, cost, and success become explicit."],
        ["02 · TRACE", "Follow the critical mechanism", "Control, state, data, model, network, and resource ownership connect."],
        ["03 · STRESS", "Failures test the design", "Concurrency, overload, bad data, attacks, and partial failure reveal tradeoffs."],
        ["04 · EVIDENCE", "Measurements support the claim", "Tests, traces, evaluations, estimates, and incidents make it credible."]
      ], "Change one dominant constraint mid-answer and evolve the design while preserving its key invariant.", "Requirements, estimate, diagram, invariant, failure path, metric, evaluation, and decision.");
    }
    if (/situational interview questions/.test(title)) {
      return flow("situational-answer", [
        ["01 · CLARIFY", "Expose missing scenario constraints", "Impact, urgency, authority, facts, reversibility, policy, and stakeholders turn a vague prompt into a decision."],
        ["02 · PRINCIPLES", "State what the response protects", "Safety, customers, truth, ownership, inclusion, quality, and escalation rules guide the options."],
        ["03 · DECIDE", "Compare options and choose conditionally", "Tradeoffs, mitigation, decision owner, and changed assumptions show concrete judgment."],
        ["04 · VERIFY", "Define action, communication, and evidence", "Owner, timeline, monitoring, rollback, follow-up, and learning make the answer operational."]
      ], "Answer one scenario, then change urgency, authority, or customer impact and revise the decision without abandoning the governing principles.", "Clarifying questions, assumptions, principles, options, tradeoff, decision, owner, escalation condition, evidence, and follow-up.");
    }
    if (/technical storytelling|influence without authority|ethical persuasion/.test(title)) {
      return flow("ethical-influence", [
        ["01 · LISTEN", "Understand audience and stakeholders", "Goals, knowledge, concerns, incentives, authority, culture, and ability to decline are explicit."],
        ["02 · FRAME", "Tell the shared truthful problem", "Context, stakes, tension, material facts, and evidence make the decision understandable."],
        ["03 · PROPOSE", "Offer options without coercion", "Consequences, uncertainties, alternatives, consent, and a clear refusal path preserve autonomy."],
        ["04 · ALIGN", "Decision and disagreement stay visible", "Owner, dissent, commitments, escalation, outcome, and reflection create durable influence."]
      ], "Present the same proposal to four audiences, invite a real decline, and remove any hidden fact, manufactured urgency, or punishment for disagreement.", "Stakeholder map, listener summary, story versions, evidence, options, disclosed risks, decline path, dissent, decision record, and follow-up.");
    }
    if (/^behavioral story bank|^leadership/.test(title)) {
      return flow("behavioral-interview", [
        ["01 · CONTEXT", "A specific difficult situation", "Enough scope and stakes explain why judgment mattered."],
        ["02 · OWNERSHIP", "Personal decision and action", "Separate individual contribution from the team's work."],
        ["03 · RESULT", "Observable outcome appears", "Metrics, artifacts, feedback, or consequences support the account."],
        ["04 · REFLECT", "Learning changes later behavior", "Limits, repair, and the next decision show honest growth."]
      ], "Answer one prompt at three lengths and remove every claim that cannot be traced to a real event.", "Prompt mapping, timing, decisions, personal actions, result evidence, limitation, and reflection.");
    }
    if (/salary negotiation/.test(title)) {
      return flow("salary-negotiation", [
        ["01 · RESEARCH", "Build comparable role evidence", "Level, scope, location, currency, market ranges, complete compensation, and risk define a defensible comparison."],
        ["02 · PRIORITIZE", "Set target, interests, and BATNA", "Base, equity, sign-on, benefits, relocation, review timing, flexibility, and a real alternative guide choices."],
        ["03 · EXCHANGE", "Ask and counter with reasons", "Appreciation, evidence, a specific proposal, silence, and multiple options keep the conversation collaborative."],
        ["04 · VERIFY", "Compare written final terms", "Conditions, vesting, targets, clawbacks, dates, authorization, tax assumptions, and decision deadline prevent surprises."]
      ], "Counter the same offer with base flexible, base fixed, and relocation-risk scenarios without inventing leverage.", "Market sources, compensation model, priorities, target, BATNA, scripts, employer response, revised terms, conditions, and written offer.");
    }
    if (/relocation readiness|work authorization|sponsorship|offer evaluation|negotiation/.test(title)) {
      return flow("relocation-decision", [
        ["01 · FACTS", "State current constraints", "Location, authorization, sponsorship need, notice, and family needs stay factual."],
        ["02 · VERIFY", "Use current official sources", "Country rules and employer willingness are separate questions."],
        ["03 · COMPARE", "Model the complete offer", "Compensation, tax assumptions, benefits, support, timing, and downside enter."],
        ["04 · DECIDE", "Negotiate and record terms", "Written terms, evidence, risks, and fallback options support the choice."]
      ], "Compare two hypothetical offers, then identify every assumption that requires an official or professional answer.", "Dated official links, recruiter answers, written terms, total-offer matrix, risks, and decision rationale.");
    }
    if (/mock interview loops|scorecards|recordings|error logs|spaced retrieval|improvement cycles/.test(title)) {
      return flow("mock-improvement", [
        ["01 · ATTEMPT", "Run a realistic interview", "Time, prompts, tools, and interruptions resemble the target loop."],
        ["02 · OBSERVE", "Capture comparable behavior", "Recording and scorecard replace vague confidence."],
        ["03 · DIAGNOSE", "Find the first root error", "Knowledge, framing, execution, communication, and recovery differ."],
        ["04 · RETRY", "Focused practice tests change", "A scheduled drill and repeated mock show whether the signal improved."]
      ], "Repeat the weakest interview section after one targeted drill and compare the same scorecard fields.", "Recording, timestamps, scores, error category, drill result, retry score, and next review date.");
    }
    return flow("interview-answer", [
      ["01 · QUESTION", "Interviewer presents ambiguity", "Clarify goals, inputs, constraints, and success."],
      ["02 · MODEL", "Candidate structures the problem", "Define terms and trace the governing mechanism."],
      ["03 · TRADEOFF", "Alternatives meet real constraints", "Failure modes and operational cost shape the choice."],
      ["04 · VERIFY", "Evidence closes the answer", "Tests, metrics, diagrams, and examples make claims credible."]
    ], "Answer once from memory, then compare it with a concise evidence-backed structure.", "Clarifying questions, mechanism trace, tradeoff, failure mode, evidence, and timing.");
  }

  return flow("concrete-mechanism", [
    ["01 · INPUT", "A concrete value or event enters", "State the boundary and trusted assumptions."],
    ["02 · TRANSFORM", "One mechanism performs work", "Trace control, state, and resource ownership."],
    ["03 · DECIDE", "Rules select an outcome", "Include the failure branch, not only success."],
    ["04 · OBSERVE", "External evidence appears", "Measure something that could disprove the explanation."]
  ], "Change one input or failure condition and predict the full path.", "Trace, test, state change, error, timing, and cleanup.");
}

function diagramStagesMarkup(diagram) {
  return diagram.stages.map((stage, index) =>
    '<li class="trace-stage">' +
      '<span>' + escapeHtml(stage.label) + '</span>' +
      '<strong>' + escapeHtml(stage.name) + '</strong>' +
      '<small>' + escapeHtml(stage.detail) + '</small>' +
      (index < diagram.stages.length - 1 ? '<i aria-hidden="true">↓</i>' : '') +
    '</li>'
  ).join("");
}

function diagramAriaLabel(diagram) {
  const stages = diagram.stages.map((stage) => stage.name).join(" then ");
  return "Mechanism trace: " + stages + ". Experiment: " + diagram.probe;
}

function traceSubjectFor(lesson) {
  const title = lesson.title.toLowerCase();

  if (lesson.trackId === "lld-machine-coding") return "a machine-coding use case";
  if (lesson.trackId === "systems-foundations") return /request to wire|ipv4|routing tables|udp, tcp|tcp flow control|dns resolution/.test(title) ? "a request from application to wire" : "a process crossing a kernel boundary";
  if (/layer 4 and layer 7 load balancing/.test(title)) return "a load-balanced connection and request";
  if (lesson.trackId === "service-architecture-events") return "a domain command and event";
  if (/model context protocol|mcp transports/.test(title)) return "an MCP session";
  if (/vector database|vector index internals/.test(title)) return "a vector write and query";
  if (/ai frontend streaming|generative ui|conversation persistence/.test(title)) return "a streamed AI interaction";
  if (/production webhooks/.test(title)) return "a webhook event delivery";
  if (/application file storage/.test(title)) return "a file upload lifecycle";
  if (/background jobs/.test(title) && lesson.trackId === "quality-security") return "a background job delivery";
  if (/audit logs|admin systems/.test(title)) return "a privileged operation";
  if (/import|module resolution|packages/.test(title)) return "a module import";
  if (/iterator|generator|comprehension|streaming pipeline/.test(title)) return "an iteration step";
  if (/descriptor|attribute lookup|special method|data model/.test(title)) return "an attribute or protocol operation";
  if (/asyncio|taskgroup|coroutine|thread|multiprocessing|concurrency/.test(title)) return "a concurrent task";
  if (/memory|garbage collection|reference counting|weak reference|copying/.test(title)) return "an object's lifetime";
  if (/packaging|wheel|source distribution|virtual environment|lock file|dependency/.test(title)) return "a build and installation";
  if (/security|injection|untrusted|deserialization/.test(title)) return "untrusted input crossing a boundary";
  if (/testing|debugging|profiling|benchmark|observability|diagnostic/.test(title)) return "a diagnostic experiment";
  if (/effect|external synchronization/.test(title) && lesson.trackId === "react") return "an external synchronization cycle";
  if (/state|reducer|batching|transition|optimistic/.test(title) && lesson.trackId === "react") return "a state update";
  if (/server component|hydration|server rendering/.test(title) && lesson.trackId === "react") return "a server-to-client render";
  if (/websocket|server-sent|streamingresponse/.test(title) && lesson.trackId === "fastapi") return "a connection event";
  if (/background|queue|outbox|webhook/.test(title) && lesson.trackId === "fastapi") return "a job or event delivery";
  if (/container|deployment|worker|lifespan/.test(title) && lesson.trackId === "fastapi") return "an application process lifecycle";
  if (/transaction|commit|rollback|unit of work/.test(title)) return "a database transaction";
  if (/sql|query plan|index|join/.test(title)) return "a database query";
  if (/retrieval|\brag\b|reranking|context assembly/.test(title)) return "a retrieval query";
  if (/evaluation|dataset|rubric|grader/.test(title)) return "an evaluation case";
  if (/token|embedding|attention|decoding|inference/.test(title)) return "a token sequence";

  const byTrack = {
    "engineering-foundations": "an engineering change",
    "software-design": "a requirement-driven code change",
    "computer-science": "an algorithm execution",
    "systems-foundations": "a request or kernel operation",
    "lld-machine-coding": "a machine-coding use case",
    "web-platform": "a browser request or event",
    javascript: "a JavaScript evaluation",
    typescript: "a type-checking decision",
    react: "a render and commit cycle",
    nodejs: "an event-loop operation",
    python: "a Python operation",
    fastapi: "an HTTP request",
    "data-systems": "a data operation",
    "api-distributed-systems": "a distributed request or message",
    "service-architecture-events": "a domain command and event",
    "quality-security": "a test or attack path",
    "cloud-aws": "an AWS service request",
    devops: "a delivery change",
    docker: "a container lifecycle",
    kubernetes: "a reconciliation cycle",
    "ml-foundations": "a training or inference example",
    "llm-internals": "a model computation",
    "ai-application-engineering": "a model request",
    "retrieval-rag": "a retrieval query",
    agents: "an agent step",
    "ai-quality-safety": "an evaluation case",
    "portfolio-capstone": "a user journey",
    "international-interviews": "an interview scenario"
  };
  return byTrack[lesson.trackId] || "a concrete mechanism";
}

const SIMPLE_CONCEPTS = {
  "international-interviews": [
    ["role targeting", "Role targeting selects a narrow family of jobs whose responsibilities, level, location, and hiring constraints match the evidence you can honestly build and present."],
    ["job-description analysis", "Job-description analysis extracts recurring responsibilities and signals across many postings instead of treating one employer's wording as a complete curriculum."],
    ["gap mapping", "Gap mapping compares role evidence requirements with demonstrated proof and identifies whether to learn, build, reframe, or deliberately skip a requirement."],
    ["evidence selection", "Evidence selection chooses the smallest credible artifact, metric, story, or demonstration that supports a claim relevant to this role."],
    ["resume architecture", "Resume architecture orders truthful evidence so a parser and a hurried human can identify role, scope, ownership, skills, chronology, and impact quickly."],
    ["ats parsing", "ATS parsing extracts text and structured fields from a resume. Plain headings, conventional chronology, selectable text, and consistent dates reduce avoidable parsing failures."],
    ["achievement bullets", "An achievement bullet connects a specific action you owned to its context and measured or observable result."],
    ["tailoring", "Tailoring selects and reorders true evidence for the target role; it does not rename experience, invent metrics, or stuff hidden keywords."],
    ["linkedin profile", "A LinkedIn profile is a professional landing page and recruiter-search document whose headline, About, experience, skills, location, and preferences should tell one consistent story."],
    ["open to work", "Open to Work records target titles, locations, work models, availability, and chosen visibility so LinkedIn can use them in recommendations and recruiter search."],
    ["discoverability", "Discoverability means the right reviewer can find and understand your role fit through accurate vocabulary, location preferences, evidence, and a clear contact path."],
    ["github profile", "A GitHub profile is a public evidence index. Pinned repositories and the profile README should route reviewers to a few inspectable examples of real engineering work."],
    ["engineering credibility", "Engineering credibility comes from reproducible code, tests, measurements, decisions, operational evidence, contribution history, and honest limitations rather than visual polish alone."],
    ["job portals", "Job portals aggregate opportunities and recommendations but may contain duplicates, stale roles, misleading eligibility signals, or fraud. Verify important facts on the employer's official site."],
    ["company career pages", "A company career page is the employer-controlled source for the current posting, location, application path, and often role-specific hiring information."],
    ["alerts", "A job alert is a platform-supported saved search that sends new matching postings. It automates discovery without automating platform access or applications."],
    ["fraud checks", "Fraud checks verify the employer domain, posting, recruiter identity, communication channel, and absence of candidate payment or sensitive-data pressure."],
    ["application tracking", "Application tracking records each real role, source, fit, evidence, stage, contacts, deadlines, outcomes, and next action so the search produces usable feedback."],
    ["prioritization", "Prioritization directs limited research and preparation time toward roles with strong responsibility fit, credible evidence, workable location constraints, and clear interest."],
    ["safe automation", "Safe job-search automation processes data you own or receive through permitted features and prepares human-reviewed reminders or drafts. It does not scrape, spam, impersonate, or auto-submit."],
    ["recruiter screens", "A recruiter screen checks the broad fit, motivation, communication, logistics, level, compensation alignment, availability, and location or authorization constraints before deeper interviews."],
    ["career narrative", "A career narrative is the short causal thread connecting past experience, present strengths, target direction, and why this role is a logical next step."],
    ["coding interview method", "A coding interview method is a repeatable collaboration loop: clarify, test examples, establish a correct baseline and invariant, optimize, implement, verify, and reflect."],
    ["invariants", "An invariant is a statement that remains true before and after each relevant step. Saying it aloud makes the algorithm and debugging path easier to verify."],
    ["language fluency", "Language fluency is the ability to express and debug a solution accurately with core syntax, collections, iteration, functions, errors, and standard-library tools under time pressure."],
    ["full-stack technical interviews", "A full-stack technical interview tests whether you can connect framework behavior to language, runtime, browser, network, database, security, deployment, and operational mechanisms."],
    ["system-design interviews", "A system-design interview is a collaborative exercise in clarifying constraints, defining guarantees, estimating scale, tracing critical paths, and evolving a defensible design."],
    ["ai engineering interviews", "An AI engineering interview tests product and systems judgment around probabilistic behavior, data, retrieval, tools, evaluations, safety, serving, latency, cost, and monitoring."],
    ["behavioral story bank", "A behavioral story bank is a small indexed set of true experiences that can answer many competency questions without inventing or memorizing one script per prompt."],
    ["star", "STAR structures a story as Situation, Task, Action, and Result. Strong answers also expose decisions, evidence, personal ownership, tradeoffs, and reflection."],
    ["reflection", "Reflection identifies what changed in your judgment, system, or future behavior after the outcome rather than adding a generic lesson at the end."],
    ["leadership", "Leadership is creating clarity, decisions, safety, progress, and learning with others, including when you lack formal authority."],
    ["cross-cultural collaboration", "Cross-cultural collaboration avoids assumptions, makes context and decisions explicit, checks understanding, respects communication differences, and adapts from feedback."],
    ["portfolio presentations", "A portfolio presentation is an evidence-led project narrative that moves from user outcome through architecture and one deep mechanism to proof, failure, tradeoffs, and future work."],
    ["architecture diagrams", "An interview architecture diagram shows a readable critical path, ownership boundaries, state, and failure points; it is a communication aid rather than a logo inventory."],
    ["networking", "Professional networking builds mutual context and trust through useful, specific, respectful interactions over time rather than requesting favors from strangers at scale."],
    ["open source", "Open-source work provides public evidence of understanding an unfamiliar codebase, scoping changes, testing, review response, documentation, and asynchronous collaboration."],
    ["referrals", "A referral is a person's informed introduction or endorsement. Ask only when they have enough context to judge your fit and make declining easy."],
    ["international communication", "International communication makes time zones, deadlines, decisions, uncertainty, tone, and handoffs explicit so collaboration does not depend on shared local context."],
    ["relocation readiness", "Relocation readiness separates your employability and preferences from employer sponsorship policy and current legal work-authorization requirements."],
    ["work authorization", "Work authorization is a legal permission to work in a jurisdiction under specific conditions. State only verified current facts and use official authorities or qualified advisers."],
    ["sponsorship", "Employer sponsorship is a company's willingness and ability to support a particular immigration route; it is separate from whether the role is remote or the candidate is qualified."],
    ["offer evaluation", "Offer evaluation compares the full written package, role and level, location costs, benefits, equity terms, relocation conditions, risk, growth, and personal constraints."],
    ["negotiation", "Negotiation is a respectful evidence-based discussion of role level, compensation, support, timing, and terms after enough information exists to compare the complete offer."],
    ["situational interview questions", "Situational questions ask what you would do in a hypothetical work problem. A strong answer clarifies missing facts, names priorities and stakeholders, chooses a safe action, communicates, and explains how success will be checked."],
    ["hypothetical scenarios", "A hypothetical scenario is an incomplete future situation used to observe judgment. State reasonable assumptions instead of pretending the prompt contains every required fact."],
    ["model answers", "A model answer demonstrates a reusable reasoning structure and credible language; adapt it to the actual scenario instead of memorizing it as a script."],
    ["technical storytelling", "Technical storytelling explains a real engineering change as a causal sequence of context, stakes, decision, action, evidence, and learning."],
    ["audience", "The audience determines which context, vocabulary, mechanism, and evidence an explanation must include."],
    ["stakes", "Stakes describe why the problem mattered to users, the business, reliability, security, cost, or the team."],
    ["tension", "Tension is the constraint, uncertainty, disagreement, or failure that made a decision necessary."],
    ["clarity", "Clarity uses a direct structure, concrete terms, explicit ownership, and evidence so a listener can follow the reasoning once."],
    ["brevity", "Brevity removes details that do not help this audience evaluate the decision while preserving the causal explanation and proof."],
    ["influence without authority", "Influence without authority aligns people through listening, credible evidence, shared goals, useful framing, and low-risk progress rather than positional control."],
    ["stakeholder mapping", "Stakeholder mapping identifies who is affected, who decides, who has expertise, what each person values, and how they prefer to receive information."],
    ["listening", "Listening tests your understanding of another person's goals, evidence, constraints, and concerns before you propose a solution."],
    ["incentives", "Incentives are the outcomes, risks, measures, and pressures that make an option attractive or costly to a stakeholder."],
    ["framing", "Framing presents a choice in terms of the shared problem, decision criteria, evidence, and tradeoffs without hiding material facts."],
    ["credibility", "Credibility grows when claims are accurate, uncertainty is visible, commitments are kept, and evidence can be checked."],
    ["coalition building", "Coalition building creates informed support among affected people through shared understanding and voluntary agreement."],
    ["disagreement", "Productive disagreement challenges ideas with evidence and criteria while protecting respect, psychological safety, and the ability to work together."],
    ["escalation", "Escalation asks the correct decision owner to resolve a material risk or deadlock after direct, documented attempts have not worked."],
    ["ethical persuasion", "Ethical persuasion helps a person make an informed voluntary choice using truthful evidence, transparent intent, and respect for refusal."],
    ["transparency", "Transparency makes the purpose, important facts, incentives, alternatives, and consequences visible to the decision maker."],
    ["consent", "Consent is a specific, informed, voluntary, and reversible agreement from a person who has a real choice."],
    ["autonomy", "Autonomy is a person's ability to understand options and choose without deception, coercion, or hidden obstruction."],
    ["nudges", "A nudge changes how choices are presented while leaving meaningful alternatives available; it must still be evaluated for transparency and user benefit."],
    ["dark patterns", "Dark patterns are interface or communication designs that trick or pressure people into choices they did not intend or make refusal unreasonably difficult."],
    ["coercion", "Coercion uses threats, disproportionate pressure, or withheld necessities to remove a meaningful voluntary choice."],
    ["deception", "Deception creates or exploits a false belief by hiding, inventing, or misrepresenting material information."],
    ["manipulation boundaries", "Manipulation boundaries reject deception, coercion, hidden pressure, exploitation of vulnerability, and designs that undermine informed choice."],
    ["salary negotiation", "Salary negotiation is a professional discussion about role scope and the full offer using market evidence, priorities, alternatives, and written terms."],
    ["market evidence", "Market evidence is current role-, level-, skill-, company-, and location-relevant compensation information from credible sources."],
    ["total compensation", "Total compensation combines fixed pay, variable pay, equity under its actual terms, benefits, retirement, leave, relocation support, and other material value."],
    ["ranges", "A compensation range is an interval supported by role and market evidence; ask how the employer maps experience and level within it."],
    ["anchors", "An anchor is an early reference number that can influence later discussion; support it with evidence and avoid false precision."],
    ["batna", "BATNA is your best alternative if no agreement is reached. It sets a practical walk-away comparison rather than a threat."],
    ["priorities", "Negotiation priorities rank the terms that matter most so you can trade across salary, level, equity, start date, relocation, flexibility, and development support."],
    ["scripts", "A negotiation script is a short prepared structure for appreciation, evidence, request, question, pause, and response under pressure."],
    ["counteroffers", "A counteroffer proposes specific revised terms with a reason and leaves room for the employer to respond with alternatives."],
    ["written terms", "Written terms are the authoritative offer details to review before acceptance, including conditions, deadlines, equity documents, location, and relocation obligations."],
    ["mock interview loops", "A mock loop reproduces several interview modes and timing so strengths, recurring errors, communication, recovery, and stamina can be observed together."],
    ["scorecards", "A scorecard defines observable behaviors before the session so feedback is comparable and does not collapse into confidence, personality, or vague impressions."],
    ["error logs", "An error log records the symptom, root category, missed signal, corrected model, targeted drill, and later retrieval result for each meaningful mistake."],
    ["spaced retrieval", "Spaced retrieval revisits a skill after increasing delays and on varied prompts, strengthening long-term recall beyond immediate familiarity." ]
  ],
  "api-distributed-systems": [
    ["layer 4 and layer 7 load balancing", "Layer 4 load balancing routes connections from transport information such as IP address and port. Layer 7 load balancing understands application messages such as HTTP host, path, headers, and cookies and can route individual requests."],
    ["transport flows", "A transport flow is a connection identified by network and transport addresses whose packets must reach a consistent backend while that connection is active."],
    ["http routing", "HTTP routing selects a backend from application data such as host, path, method, header, or cookie after TLS is terminated where inspection is required."],
    ["algorithms", "A load-balancing algorithm selects an eligible target using rules such as round robin, least outstanding work, hashing, or weighted capacity."],
    ["health checks", "A health check tests whether a target should receive new traffic. It must represent readiness without causing synchronized overload or hiding dependency failure."],
    ["affinity", "Affinity attempts to keep related connections or requests on the same target, which can help local session state but creates uneven load and failover limits."],
    ["tls", "TLS placement decides where traffic is decrypted, which identity is authenticated, which routing data becomes visible, and whether encryption continues to the backend."],
    ["failure modes", "Load-balancer failure modes include unhealthy targets, stale health, overload, connection resets, retry amplification, uneven hashing, proxy timeout mismatch, and loss of a balancing tier."],
    ["system boundaries", "A system boundary says which component owns a decision and its authoritative state. Crossing it requires an explicit contract and failure model."],
    ["domain invariants", "A domain invariant is a business rule that every committed state must satisfy, even when requests race, repeat, or partially fail."],
    ["api contracts", "An API contract is the observable agreement between producer and consumer: accepted inputs, returned outcomes, semantics, compatibility, security, limits, and failure behavior."],
    ["http architecture", "HTTP is a stateless application protocol with uniform request and response semantics that can pass through caches, proxies, gateways, and different transport versions."],
    ["intermediaries", "An HTTP intermediary handles messages between client and origin. It may route, cache, transform, authenticate, or observe traffic within protocol and policy limits."],
    ["safety", "A safe method asks only to retrieve or observe and is not intended to change server state, although logging and accounting side effects may still occur."],
    ["idempotency", "An operation is idempotent when repeating the same intended request has the same intended effect as applying it once."],
    ["cacheability", "Cacheability defines whether and how a response may be stored and reused for later requests without consulting the origin."],
    ["resource modeling", "Resource modeling gives stable client-visible identities to important things and state transitions without exposing controller methods or storage layout."],
    ["representations", "A representation is one transferable encoding of a resource's current or intended state, such as JSON, HTML, or an event stream."],
    ["content negotiation", "Content negotiation selects a representation using request preferences and available server variants. Caches must include the varying dimensions in their key."],
    ["problem details", "Problem Details is a standard HTTP error document with a machine-identifiable type, human title, status, occurrence identifier, and safe extensions."],
    ["stable error codes", "A stable error code gives clients a documented machine branch that can evolve independently from human-readable explanation text."],
    ["boundary validation", "Boundary validation turns untrusted external input into a bounded trusted representation before domain logic or dangerous interpreters use it."],
    ["normalization", "Normalization converts explicitly equivalent input forms into one canonical form. It must not silently change meaning or erase security-significant differences."],
    ["idempotency keys", "An idempotency key names one client operation so retries and concurrent attempts can find the same durable claim and result."],
    ["request fingerprints", "A request fingerprint is a canonical digest used to reject reuse of one idempotency key for different operation input."],
    ["etags", "An ETag is a server-selected validator for a representation. Clients use it to revalidate cached data or require that an update still targets the version they read."],
    ["preconditions", "An HTTP precondition makes a request proceed only if a validator or modification condition still holds, preventing stale reads or writes from acting blindly."],
    ["pagination", "Pagination returns a bounded part of an ordered collection plus enough continuation state to request the next part."],
    ["keyset", "Keyset pagination continues after the last ordered values already seen, avoiding the growing scan and shifting offsets of offset pagination."],
    ["cursor", "A cursor is an opaque continuation token that binds position to ordering, filters, version, authorization scope, and sometimes a snapshot or expiry."],
    ["api versioning", "API versioning creates an explicit compatibility boundary when old and new meanings cannot safely coexist under one contract."],
    ["deprecation", "Deprecation announces that supported behavior will be removed, supplies a replacement and deadline, and measures remaining consumers before shutdown."],
    ["http caching", "HTTP caching reuses stored responses according to freshness, validation, privacy, and variant metadata carried in standard headers."],
    ["cache-control", "Cache-Control directives define who may store a response, how long it is fresh, and which stale or revalidation behavior is allowed."],
    ["rest constraints", "REST is an architectural style whose constraints include client-server separation, stateless requests, cacheability, layered systems, a uniform interface, and optional downloaded code."],
    ["hypermedia", "Hypermedia places typed links and valid next actions in representations so clients can discover transitions instead of constructing every URI from private knowledge."],
    ["openapi", "OpenAPI is a machine-readable description of HTTP operations, parameters, representations, responses, security, and reusable schemas."],
    ["json schema", "JSON Schema describes and validates JSON structure and values through a declared dialect. Domain semantics and authorization still require runtime logic."],
    ["protocol buffers", "Protocol Buffers encodes typed fields by numeric tags. Compatibility depends on preserving tag identity and adding or removing fields according to evolution rules."],
    ["grpc", "gRPC maps typed service methods onto HTTP/2-based calls with generated stubs, metadata, streaming, deadlines, cancellation, and structured status."],
    ["graphql", "GraphQL lets clients select fields from a typed graph. The server resolves that selection while enforcing authorization, batching, and query-cost limits."],
    ["n+1", "N+1 occurs when resolving one list causes a separate downstream call per item. Request-scoped batching combines compatible lookups."],
    ["webhooks", "A webhook is an outbound HTTP event delivery. Providers retry; consumers authenticate raw bytes, deduplicate event identity, and process asynchronously."],
    ["replay protection", "Replay protection rejects an otherwise authentic message when its timestamp or unique identity shows that it is too old or already accepted."],
    ["sse", "Server-Sent Events is a browser-friendly one-way text event stream over HTTP with event IDs and automatic reconnection semantics."],
    ["websockets", "WebSocket upgrades an HTTP connection to persistent bidirectional framed messages. The application must define message schema, bounds, heartbeats, recovery, and authorization."],
    ["backpressure", "Backpressure makes a fast producer slow, wait, shed, or reject when a consumer cannot safely keep up."],
    ["authentication", "Authentication establishes which principal or client is making a request and how strongly that identity was proven."],
    ["authorization", "Authorization decides whether an authenticated principal may perform one action on one resource in the current context."],
    ["api gateways", "An API gateway is an intermediary for routing and coarse cross-cutting policy. It should not become the hidden owner of every service's domain rules."],
    ["rate limits", "A rate limit bounds admitted operations over time for a chosen identity or resource. Burst, fairness, failure, and distributed coordination are part of the contract."],
    ["threat modeling", "Threat modeling identifies assets, actors, trust boundaries, abuse paths, controls, and residual risks before security work becomes a checklist."],
    ["ssrf", "Server-side request forgery tricks a server into making attacker-chosen network requests with the server's reachability or credentials."],
    ["mass assignment", "Mass assignment binds untrusted fields directly onto a domain object, allowing clients to set properties they were never authorized to control."],
    ["trace context", "Trace context carries a trace and parent identity across process boundaries so independently recorded spans can form one causal request path."],
    ["contract tests", "A contract test executes a consumer expectation or provider promise so independent deployments can detect incompatible observable behavior."],
    ["fuzzing", "Fuzzing generates or mutates many inputs to discover parser, validation, security, and state-machine behavior that hand-written examples missed."],
    ["distributed system model", "A distributed-system model states the nodes, messages, local state, timing, durability, trust, and faults an algorithm assumes."],
    ["safety", "Safety means that a forbidden outcome never happens, regardless of how long the system runs."],
    ["liveness", "Liveness means that desired progress eventually happens when the model's required conditions hold."],
    ["partial failure", "Partial failure means one component or link can fail while other parts continue, leaving observers with incomplete and sometimes contradictory evidence."],
    ["byzantine", "A Byzantine component may behave arbitrarily or maliciously rather than merely stopping or omitting messages. It requires a stronger fault model and protocol."],
    ["network partitions", "A network partition prevents some groups of nodes from communicating while each group may remain alive and able to serve local work."],
    ["monotonic time", "A monotonic clock moves forward for duration measurement and is not adjusted to match civil time, making it safer for timeouts and latency."],
    ["clock skew", "Clock skew is the difference between clocks on separate machines. It makes cross-node timestamp ordering and lease expiry uncertain."],
    ["happens-before", "Happens-before is a causal partial order built from local program order and message send-before-receive relationships."],
    ["lamport clocks", "A Lamport clock assigns scalar numbers that respect known causal order, but comparing two numbers cannot prove the events were causally related."],
    ["vector clocks", "A vector clock tracks logical progress per participant and can distinguish one version causally following another from concurrent versions."],
    ["latency distributions", "A latency distribution preserves variation across requests. Percentiles expose the slow tail that an average hides."],
    ["tail amplification", "Tail amplification occurs when a request waits for many dependencies and is likely to encounter at least one slow result."],
    ["deadlines", "A deadline is the absolute point when the caller no longer values completion. Downstream work should receive only the remaining budget."],
    ["retry budgets", "A retry budget limits extra attempts relative to healthy traffic so retries cannot turn a small failure into uncontrolled load."],
    ["hedged requests", "A hedged request starts a duplicate after a delay to reduce tail latency, at the cost of added work and duplicate side-effect risk."],
    ["load shedding", "Load shedding rejects selected work early when serving it would push the system beyond safe capacity and harm more requests."],
    ["admission", "Admission control decides whether new work may consume limited capacity using concurrency, queue, priority, quota, or resource budgets."],
    ["circuit breakers", "A circuit breaker temporarily suppresses calls to a failing dependency, then admits limited probes before restoring normal traffic."],
    ["bulkheads", "Bulkheads reserve separate resource pools so one dependency, tenant, or work class cannot consume every thread, connection, or queue slot."],
    ["exactly-once claims", "An exactly-once claim is meaningful only inside a named transactional boundary. Networks and external effects still require identities and reconciliation."],
    ["queues", "A queue normally assigns each work item to one competing consumer and uses acknowledgement or visibility state to decide completion and redelivery."],
    ["publish-subscribe", "Publish-subscribe gives independent subscriptions their own copy or position for each publication."],
    ["logs", "A distributed log retains ordered records in partitions and lets consumers manage replayable positions independently."],
    ["acknowledgements", "An acknowledgement tells the broker that a delivery may stop being considered in flight; its placement relative to the side effect defines a failure window."],
    ["offsets", "An offset is a consumer position in an ordered log partition. Committing it records progress, not proof that every external effect is durable."],
    ["at-most-once", "At-most-once processing avoids duplicates by acknowledging before or instead of retrying, which allows loss when failure occurs."],
    ["at-least-once", "At-least-once delivery retries until acknowledged, preventing silent broker-level loss while allowing duplicate processing."],
    ["consumer groups", "A consumer group divides topic partitions among members so each partition has one active owner within that group."],
    ["dead-letter queues", "A dead-letter queue stores deliveries the normal path stopped retrying. It needs ownership, diagnosis, retention, and a safe replay procedure."],
    ["transactional outbox", "A transactional outbox commits the business change and an event record in the same local database transaction, closing the dual-write loss gap."],
    ["inbox", "An inbox records an incoming event identity in the same transaction as the consumer's local effect, making redelivery locally duplicate-safe."],
    ["sagas", "A saga coordinates local transactions using durable forward actions and business compensations instead of one global atomic commit."],
    ["two-phase commit", "Two-phase commit first makes every participant durably prepare, then records one commit or abort decision. In-doubt participants may block when the coordinator is unavailable."],
    ["single-leader replication", "Single-leader replication orders writes through one leader and replays its log on followers that may serve reads with explicit freshness limits."],
    ["multi-leader replication", "Multi-leader replication accepts writes at several leaders and must detect or resolve concurrent changes when their logs meet."],
    ["leaderless replication", "Leaderless replication sends reads and writes to multiple replicas and resolves versioned responses without a permanent write leader."],
    ["linearizability", "Linearizability makes each operation appear atomic between its call and return, preserving real-time order for non-overlapping operations."],
    ["serializability", "Serializability makes committed transactions equivalent to some serial order, but that order need not follow external real time."],
    ["causal consistency", "Causal consistency preserves the order of effects that could have influenced one another while allowing independent events to appear in different orders."],
    ["eventual consistency", "Eventual consistency promises replicas converge when updates and failures stop; it says little by itself about intermediate reads or conflict resolution."],
    ["cap theorem", "CAP says that during a network partition a system cannot guarantee both linearizable consistency and a successful response from every non-failing node."],
    ["pacelc", "PACELC adds the normal-operation choice between latency and consistency to CAP's partition-time consistency and availability choice."],
    ["sharding", "Sharding partitions a dataset across owners so storage and traffic scale horizontally, while cross-shard operations become explicit distributed work."],
    ["consistent hashing", "Consistent hashing maps keys and nodes onto a ring so membership changes move only nearby key ranges rather than nearly every key."],
    ["consensus", "Consensus lets fault-tolerant nodes choose one ordered history or value without two successful groups deciding conflicting results."],
    ["raft", "Raft uses terms, leader election, replicated logs, majority commit, and deterministic application to implement a replicated state machine."],
    ["failure detection", "Failure detection turns missing evidence into suspicion. In an asynchronous network it cannot always distinguish a dead node from a delayed one."],
    ["leases", "A lease grants authority until a time bound under clock assumptions. A paused former holder may still act late unless the resource checks fencing."],
    ["fencing", "A fencing token is monotonically increasing authority that the protected resource uses to reject writes from stale owners."],
    ["service discovery", "Service discovery maintains the changing set of endpoints for a logical service and feeds it into connection and load-balancing policy."],
    ["multi-region architecture", "Multi-region architecture places traffic, compute, and data across geographic failure and legal domains with explicit write, consistency, routing, and failover authority."],
    ["cqrs", "CQRS separates the model that validates commands from models optimized for queries. It adds synchronization and operational work between those views."],
    ["event sourcing", "Event sourcing stores an ordered event history as authoritative state and rebuilds current state by replay, often with snapshots and projections."],
    ["little's law", "Little's Law relates average work in a stable system to arrival rate multiplied by average time in the system, connecting latency, throughput, and concurrency."],
    ["system design", "System design turns requirements into explicit invariants, interfaces, data ownership, critical paths, capacity, failure behavior, observability, security, and evolution choices."],
    ["distributed systems production architecture capstone", "The capstone combines contract evolution, durable state, messaging, bounded resilience, consistency, recovery, security, and operational evidence in one defensible system." ]
  ],
  "data-systems": [
    ["postgresql setup", "PostgreSQL setup establishes one reproducible server environment, a known client identity, and a safe namespace before experiments begin."],
    ["psql", "psql is PostgreSQL's command-line client. It sends SQL and meta-commands, exposes connection state, and can stop scripts on the first error."],
    ["clusters", "A PostgreSQL cluster is one running server instance and its shared data directory. It can contain multiple databases but does not mean a distributed cluster."],
    ["databases", "A database is an isolated catalog and object namespace inside a PostgreSQL cluster. Normal SQL connections operate inside exactly one database."],
    ["schemas", "A schema is a namespace inside a database. It groups objects and participates in name lookup, but it is not a separate storage or compute server."],
    ["roles", "A role is PostgreSQL's unified identity and privilege object. A role may log in, own objects, inherit memberships, or act as a permission group."],
    ["search_path", "search_path is the ordered list of schemas used to resolve unqualified object names. Writable schemas early in the path can turn name lookup into a security boundary."],
    ["postgresql architecture", "PostgreSQL uses a supervising server process, per-connection backend processes, shared memory, WAL, and background maintenance processes to coordinate durable work."],
    ["postmaster", "The postmaster is the main PostgreSQL server process. It accepts connections, starts backend processes, supervises children, and coordinates recovery after a child failure."],
    ["shared memory", "Shared memory holds cross-process structures such as cached data pages, WAL buffers, and coordination metadata. Locks protect concurrent access to it."],
    ["pages", "A page is PostgreSQL's fixed-size unit of table and index storage and I/O. It contains headers, item pointers, tuples or index entries, and free space."],
    ["tuples", "A tuple is PostgreSQL's physical representation of one row version. Its header carries visibility and storage metadata in addition to user columns."],
    ["catalogs", "System catalogs are ordinary-looking PostgreSQL tables that describe databases, types, relations, columns, privileges, indexes, and other database objects."],
    ["null", "NULL means a value is unknown or absent, not zero or an empty string. Most comparisons with NULL return UNKNOWN and require IS NULL or null-safe operators."],
    ["normalization", "Normalization separates facts according to keys and dependencies so one fact has one authoritative update location, reducing insertion, update, and deletion anomalies."],
    ["constraints", "A constraint is a database-enforced invariant. PostgreSQL checks it against concurrent transactions so invalid states cannot commit merely because two requests raced."],
    ["schema migrations", "A schema migration is a controlled transition between compatible data contracts. Safe production changes account for locks, rewrites, application versions, backfills, validation, and rollback."],
    ["expand-contract", "Expand-contract first adds a compatible new shape, lets old and new code coexist, migrates data and traffic, and removes the old shape only after evidence says it is unused."],
    ["logical query processing", "Logical query processing is the relational meaning of a SQL query. The optimizer may choose a different physical order when it can prove the same result."],
    ["joins", "A join combines row sets according to a predicate. Join type decides whether unmatched rows disappear, survive with NULLs, or are tested only for existence."],
    ["lateral", "LATERAL lets a FROM item refer to columns from items on its left, enabling a parameterized subquery such as the latest child for each parent."],
    ["ctes", "A common table expression names a query for one statement. PostgreSQL may fold it into the outer query, materialize it, or repeatedly evaluate it when recursive."],
    ["window functions", "A window function computes across related rows while preserving one result row per input row. Its partition, ordering, and frame define exactly which peers it sees."],
    ["transactions", "A transaction groups database statements into one outcome: all durable effects commit together or none become visible after rollback."],
    ["acid", "ACID summarizes transaction guarantees: atomic outcome, preserved invariants, controlled concurrent visibility, and survival of acknowledged commits."],
    ["mvcc", "MVCC keeps multiple row versions and lets each statement or transaction read a snapshot. Ordinary readers and writers therefore need not block each other, but old versions need cleanup."],
    ["snapshots", "A snapshot records which transaction effects are visible to a query. The isolation level decides when PostgreSQL obtains and reuses that snapshot."],
    ["isolation levels", "An isolation level defines which concurrent histories a transaction may observe. Stronger levels prevent more anomalies but can abort work that must be retried."],
    ["locks", "A lock coordinates incompatible operations on a named resource. Its mode, owner, scope, acquisition order, and wait policy determine blocking and deadlock behavior."],
    ["deadlocks", "A deadlock is a cycle in which every transaction waits for another in the same cycle. PostgreSQL detects the cycle and aborts one participant so progress can resume."],
    ["b-tree", "A B-tree keeps ordered keys in a balanced page hierarchy. It supports equality, range, prefix ordering, and ordered scans with logarithmic navigation plus matching leaf work."],
    ["operator classes", "An operator class tells an index access method which operators and ordering rules it can support for a data type. Index choice follows operations, not type names alone."],
    ["covering", "A covering index includes payload columns needed by a query. PostgreSQL can avoid heap reads only when tuple visibility is also known from the visibility map."],
    ["planner statistics", "Planner statistics are sampled summaries of value distribution and relationships. The optimizer uses them to estimate rows and compare candidate plans."],
    ["explain", "EXPLAIN shows the plan PostgreSQL chose. ANALYZE executes it and adds actual rows and timing; BUFFERS and WAL expose storage work."],
    ["sequential scans", "A sequential scan reads a table's pages in physical order. It is often cheaper than many random index lookups when a large fraction of rows is needed."],
    ["toast", "TOAST compresses or stores oversized values out of line so normal heap tuples fit on pages. Updating wide values can create extra storage and WAL work."],
    ["hot updates", "A HOT update keeps a new row version on the same heap page and avoids new entries in unaffected indexes when no indexed column changes and space is available."],
    ["vacuum", "VACUUM makes dead tuple space reusable, maintains visibility information, and freezes old transaction IDs. It normally does not shrink the table file."],
    ["wal", "Write-ahead logging records a change durably before the corresponding data page is allowed to reach storage. Recovery replays WAL after the last safe checkpoint."],
    ["connections", "A PostgreSQL connection normally owns a backend process and session state. A pool bounds that finite resource and queues excess demand instead of overwhelming the server."],
    ["partitioning", "Partitioning represents one logical table as separate physical child tables chosen by a key. Pruning helps only when queries constrain that key."],
    ["physical streaming replication", "Physical streaming replication sends WAL bytes to a compatible standby, which writes and replays them to reproduce the whole database cluster."],
    ["logical replication", "Logical replication decodes committed row changes and publishes selected tables to subscribers. Schema evolution and duplicate-safe consumption remain explicit responsibilities."],
    ["backups", "A backup is an independently retained copy that can restore data after loss or corruption. Its value is proven by recovery drills against stated RPO and RTO targets."],
    ["row-level security", "Row-level security adds table policies that filter which rows a role may read or change. Object owners and privileged roles require special attention because they may bypass policies."],
    ["pg_stat_statements", "pg_stat_statements groups structurally similar SQL and accumulates calls, time, rows, I/O, WAL, and other evidence so high-impact query families can be ranked."],
    ["jsonb", "JSONB stores parsed binary JSON and supports containment and path operators plus GIN indexing. It offers flexible attributes but does not remove the need for relational invariants."],
    ["pgvector", "pgvector adds vector values, distance operators, and exact or approximate indexes to PostgreSQL. Approximate search trades recall for lower latency and must be evaluated on real queries."],
    ["optimistic concurrency", "Optimistic concurrency updates a row only if its version is still the one previously read. A zero-row update exposes a conflict without holding a long lock."],
    ["outbox", "A transactional outbox stores a business change and its event record in the same database transaction. A separate publisher may retry delivery without losing the committed intent."],
    ["redis architecture", "Redis accepts client commands, parses them, and executes most keyspace operations serially on an event loop while background threads or processes handle selected I/O and persistence work."],
    ["resp", "RESP is Redis's length-framed wire protocol for commands and typed replies. Correct framing lets binary values and pipelines share persistent connections unambiguously."],
    ["pipelining", "Pipelining sends several Redis commands before waiting for replies, reducing network round trips. Commands still execute separately and replies remain ordered."],
    ["redis strings", "A Redis string is a binary-safe value associated with a key. Atomic string commands support counters, flags, serialized objects, and conditional writes."],
    ["sorted sets", "A sorted set maps unique members to numeric scores and maintains score order, enabling rank, range, priority, and leaderboard operations."],
    ["hyperloglog", "HyperLogLog estimates distinct counts in fixed small memory. It deliberately accepts a bounded statistical error instead of storing every member exactly."],
    ["ttl", "A TTL schedules a key to expire after a duration. Expiration is lifecycle policy; it is distinct from eviction caused by reaching the memory limit."],
    ["eviction", "Eviction removes keys under maxmemory pressure according to a configured sampled policy. Correct systems assume any cache entry can disappear."],
    ["multi", "MULTI queues Redis commands and EXEC runs the queue without other client commands interleaving. It does not provide relational rollback after runtime command errors."],
    ["watch", "WATCH provides optimistic locking by making EXEC abort if a watched key changed before the transaction executes."],
    ["lua", "A Redis Lua script runs atomically on the server and can combine reads and writes without races. Long scripts block other command execution."],
    ["rdb", "RDB persistence writes point-in-time snapshots. It produces compact backups and fast restarts but can lose writes since the last completed snapshot."],
    ["aof", "AOF persistence records write commands for replay. Fsync policy controls the tradeoff among acknowledged-write loss, latency, and storage work."],
    ["redis replication", "Redis replication streams the primary's write effects to replicas and tracks history with replication IDs and offsets. Normal replication is asynchronous."],
    ["sentinel", "Redis Sentinel monitors a primary and replicas, reaches quorum about failure, elects a leader for failover, promotes a replica, and announces the new topology."],
    ["redis cluster", "Redis Cluster partitions keys across 16384 hash slots and redirects slot-aware clients. Replicas and quorum-based failover improve availability but do not eliminate asynchronous write-loss windows."],
    ["redis streams", "A Redis Stream is an append-oriented sequence of ID-addressed entries. Consumer groups track delivery progress and pending ownership for retryable processing."],
    ["cache-aside", "Cache-aside reads the cache first, loads a miss from the authoritative store, and writes the result back. The application owns invalidation, stampede control, and outage fallback."],
    ["distributed locks", "A distributed lock is a time-limited claim observed through a shared system. A lease alone cannot stop a paused former owner, so critical resources need fencing or another authoritative check."],
    ["fencing tokens", "A fencing token is a monotonically increasing ownership number that the protected resource rejects when stale, preventing an expired lock holder from writing late."],
    ["rate limiting", "Rate limiting admits work according to an explicit budget over time. Its algorithm determines burst allowance, fairness, accuracy, memory, and failure behavior."],
    ["data systems production architecture capstone", "The capstone combines PostgreSQL as authoritative state with Redis as optional acceleration, then proves consistency, recovery, security, and capacity through failure experiments." ]
  ],
  react: [
    ["server functions", "A Server Function is an async function that client-side React can ask the server to run. Treat it like a public network mutation: validate its arguments, authenticate the caller, authorize the action, and handle failure."],
    ["server components", "A Server Component renders before the client bundle, in a server-only environment. It can read server data and use server-only packages, but it cannot hold interactive browser state."],
    ["client components", "A Client Component is included in the browser bundle and may use state, effects, event handlers, and browser APIs. The client boundary also becomes a serialization and bundle-size boundary."],
    ["useimperativehandle", "useImperativeHandle controls the small imperative API exposed through a ref. Use it sparingly when a parent truly needs actions such as focus or scroll, not as a replacement for props."],
    ["useinsertioneffect", "useInsertionEffect is a library-level hook for inserting styles before layout effects need them. Application code almost never needs it because it runs in a sensitive part of the commit sequence."],
    ["uselayouteffect", "useLayoutEffect runs after DOM mutations but before the browser paints. It is useful for measuring and correcting layout without visible flicker, but its synchronous work delays painting."],
    ["useeffectevent", "useEffectEvent defines non-reactive logic that an Effect may call while still reading the latest committed values. It helps separate synchronization dependencies from event-like work inside an Effect."],
    ["usesyncexternalstore", "useSyncExternalStore is the safe bridge from React to mutable state owned outside React. Its snapshot contract lets React detect changes consistently and avoid tearing during concurrent rendering."],
    ["useactionstate", "useActionState connects an action to its latest returned state and pending status. It is designed for form and mutation workflows where the server or action returns validation or success data."],
    ["useoptimistic", "useOptimistic shows an expected result before the authoritative operation finishes. The optimistic value must be reconciled with success or rolled back when the real operation fails."],
    ["useformstatus", "useFormStatus reads the submission state of the nearest parent form. Put it in a child such as a submit button so pending feedback stays attached to the correct form."],
    ["usedeferredvalue", "useDeferredValue lets a slower part of the screen temporarily use an older value while urgent UI, such as typing, updates immediately. It changes render priority; it is not a network debounce."],
    ["usetransition", "useTransition marks selected state updates as non-urgent and exposes whether transition work is pending. React may interrupt and restart that render so urgent input remains responsive."],
    ["usecallback", "useCallback keeps a function reference stable until its dependencies change. It is useful only when that stable identity enables a measured optimization or a correct dependency contract."],
    ["usememo", "useMemo caches a calculated value until its dependencies change. It is a performance hint, not a correctness tool, so profile the work before adding the cache."],
    ["usedebugvalue", "useDebugValue gives a custom Hook a readable label in React DevTools. It improves diagnosis without changing the hook's runtime behavior or causing a render."],
    ["useid", "useId creates IDs that remain consistent between server rendering and client hydration. Use them to connect accessibility attributes, not as database IDs or list keys."],
    ["usereducer", "useReducer stores state whose changes are described by actions. React queues the actions and calls a pure reducer so complex transitions stay explicit and testable."],
    ["usestate", "useState gives one component instance a remembered value. Calling its setter queues a future render; it does not change the value captured by the render currently running."],
    ["usecontext", "useContext reads the closest matching provider above the component and subscribes to its value. A changed provider value can re-render every consumer, so ownership and value identity matter."],
    ["useref", "useRef keeps a mutable value across renders without scheduling a render when it changes. It is suitable for DOM nodes and operational handles, not information that should appear on screen."],
    ["useeffect", "useEffect synchronizes committed React state with an external system such as a connection, timer, or browser API. Setup and cleanup form one repeatable synchronization process."],
    ["strict mode", "Strict Mode adds development-only checks and deliberately replays selected work to reveal impure rendering and missing cleanup. It does not double-run production work."],
    ["rules of hooks", "The Rules of Hooks keep hook calls in the same order on every render. React relies on that order to match each call with its stored state slot."],
    ["reconciliation", "Reconciliation compares the previous and next element descriptions and decides which fibers can be reused. Element type, position, and key guide preservation or replacement."],
    ["keys", "A key gives a child stable identity among siblings. Stable data keys let React preserve the correct state when items move, while index keys can attach state to the wrong item."],
    ["render snapshots", "A render snapshot is the fixed set of props, state, and closures seen during one component call. Later state updates schedule another snapshot instead of mutating the current one."],
    ["batching", "Batching groups several queued state updates before React renders. It reduces redundant work, while functional updates preserve the intended order when updates depend on earlier state."],
    ["fiber", "A fiber is React's internal work record for a component or host element. Fiber trees let React pause and resume render work while keeping DOM mutations inside an atomic commit."],
    ["lanes", "Lanes are internal priority buckets for pending React updates. They help the scheduler work on urgent updates first and defer or restart less urgent rendering."],
    ["hydration", "Hydration attaches React behavior to HTML that a server already produced. The first client tree must match the server output closely enough for React to reuse it safely."],
    ["suspense", "Suspense coordinates what React shows while a child cannot finish rendering yet. A promise or lazy module can suspend, the nearest boundary shows fallback UI, and React retries later."],
    ["error boundaries", "An Error Boundary catches render failures below it and replaces that subtree with recovery UI. It defines a failure domain; it does not automatically catch event-handler or arbitrary async errors."],
    ["portals", "A portal renders DOM into another container while preserving React-tree context and event ancestry. It solves physical placement problems such as clipping, but accessibility still needs explicit work."],
    ["react compiler", "React Compiler analyzes components and hooks at build time and can add safe memoization automatically. Its correctness depends on code following the Rules of React."],
    ["jsx", "JSX is syntax for describing a React element tree. A build transform turns it into JavaScript calls; the result is a description of UI, not a DOM node."],
    ["props", "Props are read-only inputs supplied by a parent. A component should derive its output from them without mutating the parent's data."],
    ["components", "A component is a function React calls to describe part of the interface. Its public API is its props and composition behavior, not its internal DOM structure."],
    ["accessibility", "Accessibility means the rendered DOM has correct semantics, focus behavior, keyboard interaction, names, relationships, and announcements for different users and tools."],
    ["react devtools", "React DevTools exposes the component tree, props, state, hooks, render causes, and profiling data. It turns a vague UI symptom into inspectable React evidence."],
    ["class components", "A class component stores state on an instance and uses lifecycle methods around rendering and commits. Modern code usually uses functions and hooks, but error boundaries and legacy systems still require class fluency."],
    ["controlled", "A controlled input gets its current value from React state and reports edits through an event handler. React owns the value, so updates must stay synchronous enough to preserve typing behavior."],
    ["uncontrolled", "An uncontrolled input keeps its current value in the DOM. React provides an initial value, and code reads the value when needed, often through form submission or a ref."],
    ["openapi", "OpenAPI does not belong to React itself; in a React product it is a machine-readable API contract used to generate clients and keep frontend assumptions aligned with backend behavior."]
  ],
  fastapi: [
    ["dependency graph solving", "FastAPI reads endpoint and dependency signatures, builds a directed graph, resolves prerequisites in order, and injects each result into the function that requested it."],
    ["dependency caching", "Dependency caching means FastAPI normally calls the same dependency node once per request and reuses its result. This is request-local reuse, not an application-wide cache."],
    ["yield dependencies", "A yield dependency acquires a resource before yield and releases it afterward. Nested cleanup runs in reverse order, which makes ownership of sessions, locks, and clients explicit."],
    ["security scopes", "Security scopes are named permissions requested by an operation and checked while building the current principal. They help document broad capabilities but do not replace resource-level authorization."],
    ["proxy headers", "Proxy headers report the original client, host, and scheme after a trusted proxy forwards a request. Trust them only from known infrastructure or clients can forge security-sensitive metadata."],
    ["trusted hosts", "Trusted-host checking rejects unexpected Host headers. It protects URL generation and routing assumptions from host-header attacks."],
    ["backgroundtasks", "BackgroundTasks runs small in-process work after the response is sent. The work is lost if the process crashes, so durable or retryable jobs belong in a queue-backed worker."],
    ["streamingresponse", "StreamingResponse sends chunks as an iterator produces them instead of building the whole body first. The generator must handle cancellation, cleanup, and slow clients."],
    ["uploadfile", "UploadFile wraps an uploaded file with a spooled file object and async-friendly methods. It avoids forcing every upload into memory, but size, content, cleanup, and trust still need limits."],
    ["httpexception", "HTTPException is FastAPI's explicit escape for an expected HTTP failure. Raising it stops normal endpoint work and lets the exception layer build the declared error response."],
    ["custom apiroute", "A custom APIRoute changes how selected operations build or wrap their request handlers. It is a precise extension point, but middleware or dependencies are simpler for most cross-cutting behavior."],
    ["apirouter", "APIRouter groups related operations, prefixes, tags, and dependencies before they are included in an application. Inclusion copies routes into the same app; mounting delegates to another ASGI app."],
    ["testclient", "TestClient drives the ASGI application in process through a synchronous HTTP-style interface. It is fast and deterministic, but it does not reproduce a real network, proxy, or multi-process deployment."],
    ["asgi", "ASGI is the async server-to-application protocol. The server provides a connection scope and two callables: receive brings events in, and send emits response or WebSocket events."],
    ["scope", "An ASGI scope is an immutable-looking dictionary that describes one connection, including protocol type, path, method, headers, client, server, and proxy root path."],
    ["receive", "receive is the ASGI callable an application awaits for incoming body, WebSocket, lifespan, or disconnect events. It makes the protocol event-driven instead of hiding the connection."],
    ["send", "send is the ASGI callable used to emit response-start, response-body, WebSocket, and lifespan events. Correct event order is part of the protocol contract."],
    ["uvicorn", "Uvicorn is the ASGI server process that owns sockets, parses protocol traffic, creates scopes and events, and calls the FastAPI application."],
    ["starlette", "Starlette supplies the ASGI web layer beneath FastAPI: routing, requests, responses, middleware, WebSockets, static files, and test infrastructure."],
    ["pydantic", "Pydantic turns untrusted input into validated Python objects from declared schemas. It also produces JSON Schema that FastAPI uses when building OpenAPI."],
    ["path operations", "A path operation connects an HTTP method and path pattern to an endpoint function. FastAPI inspects the function signature to build validation, dependencies, responses, and documentation."],
    ["routing order", "Routes are checked in registration order. A broad dynamic path can capture traffic intended for a later fixed path, so specific routes must be designed and ordered deliberately."],
    ["path parameters", "Path parameters come from matched URL segments. FastAPI then converts and validates those strings using the declared Python annotation and constraints."],
    ["query parameters", "Query parameters are optional or repeated values after the question mark in a URL. Their defaults and annotations define absence, validation, and generated documentation."],
    ["headers", "Headers carry request or response metadata rather than the main representation. Names are case-insensitive on the wire, and trust depends on which client or proxy set them."],
    ["cookies", "Cookies are name-value data a browser can attach automatically to matching requests. Their domain, path, Secure, HttpOnly, SameSite, and expiry rules shape both security and behavior."],
    ["request bodies", "A request body is the main representation sent by a client. FastAPI parses its content type and gives the decoded value to Pydantic for validation."],
    ["response models", "A response model validates and filters what an endpoint sends. This makes the outbound schema an enforcement boundary that can prevent private fields from leaking."],
    ["serialization", "Serialization converts Python values into bytes that follow the response media type. It can add measurable CPU cost and can fail when return values violate the declared output contract."],
    ["depends", "Depends declares that a function needs another callable's result. FastAPI inspects that callable too, so dependencies compose into a request-scoped graph."],
    ["annotated", "Annotated keeps the real Python type while attaching FastAPI metadata such as Depends, Query, Header, or validation constraints. It makes contracts reusable without losing type information."],
    ["lifespan", "Lifespan is the ASGI startup-and-shutdown context for one application process. Code before yield acquires shared resources; code after yield closes them even during shutdown."],
    ["thread pools", "A thread pool lets synchronous functions wait without blocking the event-loop thread. It has finite capacity and does not make CPU-bound Python work scale freely."],
    ["event-loop", "The event loop runs many coroutines cooperatively on one thread. Each coroutine must reach await points quickly or one blocking call can delay every request in that worker."],
    ["cancellation", "Cancellation asks in-flight async work to stop at an await point. Correct code lets it propagate, releases resources in finally blocks, and avoids publishing partial results."],
    ["task groups", "A task group gives parallel child tasks one lifetime. If one fails or the parent is cancelled, the group coordinates cancellation and waits for cleanup before leaving."],
    ["sqlalchemy sessions", "An AsyncSession is a unit of database conversation with an identity map and transaction state. It should normally belong to one request or one explicit unit of work."],
    ["connection pools", "A connection pool keeps a bounded set of database connections ready for reuse. Requests wait when the pool is full, so long transactions turn concurrency into queueing."],
    ["transactions", "A transaction groups database changes into one atomic outcome. Commit makes them durable together; rollback removes the uncommitted work after failure."],
    ["unit of work", "A unit of work owns one transaction across all repositories used by a business operation. This keeps multi-step invariants inside one commit or rollback boundary."],
    ["idempotency", "Idempotency makes repeating the same logical command produce one effect. Servers usually record a client key with the original result and return it for safe retries."],
    ["outbox", "A transactional outbox stores an event in the same database transaction as the business change. A worker publishes it later, preventing the database and message broker from disagreeing silently."],
    ["oauth2", "OAuth2 defines how a client obtains and presents delegated authorization. FastAPI provides helpers and OpenAPI integration, but your identity, token, and policy design still determine security."],
    ["jwt", "A JWT is a signed set of claims. A valid signature protects integrity, not secrecy; the API must also check issuer, audience, expiry, subject, and current authorization state."],
    ["csrf", "CSRF is an attack where a browser is tricked into sending an authenticated state-changing request. It matters when credentials such as cookies are attached automatically."],
    ["cors", "CORS is a browser rule controlling whether JavaScript from one origin may read a response from another. It is not authentication and does not block non-browser clients."],
    ["middleware", "Middleware wraps the ASGI application around many requests. It is suitable for app-wide protocol concerns, but ordering, streaming, body consumption, and error layers affect correctness."],
    ["openapi", "OpenAPI is the machine-readable description of paths, parameters, bodies, responses, and security. FastAPI builds it from route metadata and Pydantic schemas, then caches the result."],
    ["webhooks", "A webhook is an outbound event delivered to a subscriber's URL. Delivery must handle signing, retries, duplicate events, ordering limits, and secret rotation."],
    ["websockets", "A WebSocket upgrades one HTTP connection into a long-lived two-way message channel. Each connection holds state and resources, so disconnects, slow consumers, and horizontal scaling matter."],
    ["server-sent events", "Server-sent events keep an HTTP response open so the server can push text events to the browser. The channel is one-way and needs heartbeats and proxy-buffering controls."],
    ["structured logging", "Structured logging records named fields such as request ID, route, status, and duration. Machines can query those fields reliably without parsing human-formatted sentences."],
    ["metrics", "Metrics are aggregated numeric signals such as request count, latency, errors, and pool waits. Keep labels bounded so monitoring itself does not become expensive."],
    ["tracing", "Tracing follows one request across internal work and downstream calls using connected spans. It is most useful when context propagation is consistent."],
    ["readiness", "Readiness answers whether this process should receive traffic now. It may depend on required resources and should turn false before graceful shutdown drains requests."],
    ["workers", "Workers are separate processes running copies of the application. They add CPU parallelism and failure isolation but duplicate memory, pools, lifespan resources, and in-process state."],
    ["containers", "A container packages the application and dependencies into an image and runs it as an isolated process. It does not choose your migration, replication, secrets, or graceful-shutdown strategy."],
    ["api versioning", "API versioning manages incompatible client expectations over time. A URL version is only one tool; compatibility also depends on fields, enums, errors, behavior, and rollout order."]
  ],
  python: [
    ["python setup", "Python setup means choosing and recording the interpreter and tools that execute the project. The important evidence is the executable path, version, environment prefix, and reproducible project command."],
    ["interpreters", "An interpreter is the concrete Python implementation and process that compiles and executes code. Language rules are portable, while details such as reference counting or bytecode are implementation-specific."],
    ["repl", "The REPL reads one input, evaluates it, prints the result, and repeats. It is excellent for small experiments, but a repeatable script or test should preserve important evidence."],
    ["virtual environments", "A virtual environment gives a project its own interpreter prefix and package installation location. It isolates installed packages, but it does not lock exact dependency versions by itself."],
    ["execution model", "The execution model defines how Python runs code blocks, binds names, resolves scopes, creates frames, and handles exceptions. It explains behavior that surface syntax alone cannot."],
    ["frames", "A frame is the runtime record for one executing code block. It connects bytecode, local and global namespaces, the instruction position, and the caller frame."],
    ["namespaces", "A namespace maps names to objects. Modules, classes, functions, and builtins use different namespaces with different creation and lookup rules."],
    ["scopes", "A scope is the region where a name binding is visible directly. Python determines local names while compiling a function, then performs the corresponding lookup while the frame runs."],
    ["name resolution", "Name resolution searches the applicable local, enclosing, global, and builtins scopes. Assignment inside a function normally makes that name local unless global or nonlocal says otherwise."],
    ["objects", "Every Python value is represented by an object or a relationship between objects. Each object has an identity, a type, and a value."],
    ["identity", "Identity answers whether two references point to the same object. Use is for singleton identity such as None, and equality for value comparison."],
    ["references", "A Python variable stores a reference binding rather than a box that contains a copied value. Assignment rebinds a name, while mutation changes the referenced object."],
    ["mutability", "A mutable object's value can change after creation; an immutable object's direct contents cannot. Immutability does not prevent an immutable container from referencing a mutable child."],
    ["aliasing", "Aliasing occurs when multiple names or containers reference the same object. A mutation through one path is then visible through every other alias."],
    ["floating point", "A float stores a binary approximation of a real number, so many decimal fractions cannot be represented exactly. Comparisons should use a tolerance when approximation is intended."],
    ["decimal", "Decimal represents base-ten values under an explicit precision and rounding context. It suits decimal business rules but still requires a documented rounding policy."],
    ["truthiness", "Truthiness is the result of an object's truth-value protocol. Python checks __bool__, then nonzero __len__, and otherwise considers the object true."],
    ["unicode", "Unicode assigns abstract code points to text. A Python str stores text, while an encoding such as UTF-8 converts it to or from bytes at a system boundary."],
    ["bytes", "bytes is an immutable sequence of integers from zero through 255. It represents encoded text or arbitrary binary data, not characters until decoded with an agreed encoding."],
    ["encoding", "Encoding converts text code points into bytes; decoding converts bytes back into text. Both sides must agree on the encoding and malformed-input policy."],
    ["lists", "A list is a mutable sequence commonly implemented by CPython as a resizable array of object references. Appending is usually cheap, while front insertion shifts existing references."],
    ["tuples", "A tuple is an immutable sequence of object references. The tuple cannot replace its direct references, though a referenced mutable object can still change."],
    ["slicing", "Slicing selects a range using start, stop, and step. For built-in sequences it normally creates a new outer container, not a recursive copy of nested values."],
    ["copying", "A shallow copy creates a new outer object while retaining references to nested objects. A deep copy recursively recreates much of an object graph and needs explicit semantic justification."],
    ["dictionaries", "A dictionary maps hashable keys to values and preserves insertion order. Lookup uses a key's hash to find candidates and equality to confirm the match."],
    ["sets", "A set is a hash-based collection of unique values. It is useful for membership and set algebra when elements obey stable equality and hash rules."],
    ["hashing", "Hashing reduces a key to an integer used to locate a candidate table slot. Equal objects must have equal hashes, and a key's hash must remain stable while stored."],
    ["pattern matching", "Structural pattern matching checks the shape and contents of a value and may bind names. Guards add conditions after a structural pattern succeeds."],
    ["comprehensions", "A comprehension declaratively builds a collection from iteration, filtering, and transformation. In Python 3 it has its own implicit scope for loop variables."],
    ["functions", "A function is a callable object containing code, defaults, annotations, globals, and possibly closure cells. Calling it first binds arguments to its declared parameters."],
    ["defaults", "Function default objects are evaluated once when the definition executes. A mutable default therefore retains changes across later calls."],
    ["positional-only", "A positional-only parameter must be supplied by position. It lets an API keep parameter names private and prevents collisions with collected keyword arguments."],
    ["keyword-only", "A keyword-only parameter must be named by callers. It makes ambiguous calls clearer and allows safer API evolution."],
    ["closures", "A closure is a function that retains cells for names from an enclosing function after that outer call returns. The cell holds the current binding, which explains late-binding surprises."],
    ["callable objects", "An instance becomes callable when its type defines __call__. This is useful when the operation needs explicit state, configuration, or richer introspection."],
    ["exceptions", "An exception is an object that transfers control up the call stack until a matching handler is found. Catch only where code can add context, recover, translate, or clean up."],
    ["chaining", "Exception chaining preserves the relationship between a low-level cause and a higher-level error. raise new_error from cause makes that relationship explicit."],
    ["exception groups", "An ExceptionGroup contains multiple independent failures, often from concurrent children. except* selects matching subgroups without discarding the other failures."],
    ["modules", "A module is an object with a namespace, usually initialized by executing one source file. Import normally creates it once per interpreter and caches it in sys.modules."],
    ["packages", "A package organizes modules under a dotted import namespace. Its filesystem layout, distribution metadata, and public import API are related but separate concerns."],
    ["imports", "Import searches for a module, creates its object, places it in sys.modules, and asks a loader to execute it. Early cache insertion is why cycles see partially initialized modules."],
    ["classes", "A class is an object created by executing a class body and passing its namespace to a metaclass. Calling the class normally creates and initializes an instance."],
    ["methods", "A function found on a class is a descriptor. Access through an instance produces a bound method that supplies that instance as the first argument."],
    ["mro", "The method resolution order is the deterministic class sequence Python searches for attributes in multiple inheritance. C3 linearization preserves local precedence and monotonicity."],
    ["super", "super returns a proxy that continues attribute lookup after a chosen class in the MRO. Cooperative methods call the same next protocol rather than naming one parent directly."],
    ["special methods", "Special methods connect Python syntax and built-ins to type-defined behavior. For implicit operations, Python generally looks them up on the type rather than the instance."],
    ["protocols", "A protocol is a set of supported operations rather than a requirement to inherit one concrete implementation. Python's iteration, context-manager, numeric, and container behavior is protocol-driven."],
    ["descriptors", "A descriptor is an attribute object defining __get__, __set__, or __delete__. Functions, properties, class methods, slots, and many framework fields use this attribute protocol."],
    ["properties", "A property is a data descriptor that turns attribute access into method calls. It can preserve a clean public API while computing or validating a value."],
    ["slots", "__slots__ declares descriptor-backed instance fields and can omit a per-instance dictionary. It may save memory but restricts dynamic attributes and complicates inheritance."],
    ["dataclasses", "A dataclass generates common methods from annotated fields. It reduces boilerplate but does not perform general runtime type validation."],
    ["enums", "An Enum defines a closed set of named singleton members. It communicates domain choices more clearly than scattered strings or integers."],
    ["iterables", "An iterable can produce an iterator when iter is called. A reusable iterable normally creates a fresh iterator for each traversal."],
    ["iterators", "An iterator returns itself from __iter__ and produces successive values from __next__ until StopIteration. It is stateful and usually single-use."],
    ["generators", "A generator is an iterator backed by a suspended Python frame. Each next resumes execution until yield, return, or an exception."],
    ["yield", "yield emits a value and suspends the generator while preserving its local state and instruction position. Calling the generator function creates the generator without running its body."],
    ["decorators", "A decorator receives the object just defined and replaces the bound name with its return value. Function decorators commonly wrap behavior or register metadata at definition time."],
    ["context managers", "A context manager brackets work with deterministic enter and exit behavior. It makes resource ownership and cleanup visible even when the body raises an exception."],
    ["exitstack", "ExitStack dynamically owns an arbitrary number of cleanup callbacks and context managers. On exit it unwinds them in last-in, first-out order."],
    ["type hints", "Type hints describe intended relationships for static tools and readers. Ordinary Python execution does not automatically enforce most annotations."],
    ["narrowing", "Type narrowing uses control-flow evidence such as isinstance or a literal comparison to refine a checker's view of a value inside one branch."],
    ["generics", "Generics preserve relationships between input and output types using parameters instead of throwing information away into one broad type."],
    ["variance", "Variance describes how subtype relationships transfer through a generic type. Mutable containers are usually invariant because they both consume and produce their element type."],
    ["paramspec", "ParamSpec captures a callable's full parameter list so a wrapper can preserve which arguments it accepts."],
    ["runtime validation", "Runtime validation checks real external values while the program runs. It should turn untrusted input into an explicit trusted representation or a structured failure."],
    ["serialization", "Serialization converts in-memory values into a transport or storage representation. The format loses or transforms some type, identity, and behavior information."],
    ["pathlib", "pathlib represents filesystem paths as objects with explicit joining, traversal, and file operations. Paths remain untrusted input when they originate outside the program."],
    ["datetime", "A datetime may be naive or aware. Production boundaries should normally use aware instants and explicit IANA zones for human-local rules."],
    ["subprocesses", "A subprocess is a separate OS process with arguments, environment, standard streams, exit status, and signals. Passing an argument list avoids accidental shell interpretation."],
    ["signals", "A signal is an asynchronous OS notification delivered to a process. Handlers should perform minimal work and coordinate an orderly shutdown path."],
    ["event loop", "An event loop waits for I/O readiness and timers, then resumes ready callbacks and tasks on its thread. Cooperative code must suspend promptly at await points."],
    ["coroutines", "Calling an async function produces a coroutine object. Its body runs only when an event loop or another coroutine drives it by awaiting or scheduling it."],
    ["tasks", "A Task schedules one coroutine on an event loop and stores its eventual result, exception, or cancellation state."],
    ["futures", "A Future is a low-level placeholder for a result that will arrive later. Tasks are specialized futures that drive coroutine execution."],
    ["taskgroup", "TaskGroup owns a set of child tasks as one structured lifetime. It waits for cleanup and combines independent failures before the block exits."],
    ["cancellation", "Async cancellation injects CancelledError at a suspension point. Code should release resources in finally and usually propagate cancellation after cleanup."],
    ["backpressure", "Backpressure makes producers slow down when consumers or resources reach capacity. Bounded queues and semaphores turn overload into controlled waiting or rejection."],
    ["threads", "Threads share one process and memory while the OS schedules them independently. Shared mutable invariants still require synchronization."],
    ["gil", "In standard CPython builds, the GIL allows one thread at a time to execute Python bytecode. It does not prevent every race and does not block native code from running in parallel when the lock is released."],
    ["free-threaded builds", "A free-threaded CPython build can disable the GIL. It enables more Python-level parallelism while increasing the importance of thread-safe extension and application code."],
    ["multiprocessing", "Multiprocessing uses separate processes for isolation and CPU parallelism. Inputs and results normally cross serialization and inter-process communication boundaries."],
    ["process pools", "A process pool reuses worker processes for submitted callables. Startup, serialization, data copying, failure recovery, and shutdown can outweigh small tasks."],
    ["memory management", "Memory management decides when storage for Python objects can be reclaimed. The language specifies reachability behavior broadly; concrete collectors differ by implementation."],
    ["reference counting", "CPython reference counting tracks strong references and often finalizes unreachable non-cyclic objects promptly. It cannot by itself reclaim cycles."],
    ["cyclic gc", "The cyclic garbage collector finds unreachable reference cycles that reference counts alone cannot release. It supplements, rather than replaces, CPython reference counting."],
    ["weak references", "A weak reference observes an object without keeping it alive. It is useful for caches and registries whose entries should disappear with their real owners."],
    ["pickle", "pickle serializes Python-specific object graphs using executable reconstruction instructions. Loading untrusted pickle data can execute arbitrary code."],
    ["profiling", "Profiling measures where representative execution spends time or allocations. It guides optimization toward observed bottlenecks instead of intuition."],
    ["benchmarking", "Benchmarking compares behavior under controlled, repeated conditions. Inputs, warmup, variance, system load, and the measured boundary all affect conclusions."],
    ["testing", "Testing runs controlled examples to detect regressions and provide design feedback. Strong suites cover success, boundary, failure, and invariant behavior at appropriate layers."],
    ["fixtures", "A fixture supplies test state with a defined setup, lifetime, and cleanup. Broad fixture scope increases speed but also increases coupling and contamination risk."],
    ["mocking", "A mock records and controls interactions at a dependency boundary. Over-mocking internal details makes tests brittle and can validate an imaginary system."],
    ["debugging", "Debugging is the process of reducing a symptom to a tested causal explanation. Tracebacks, breakpoints, logs, metrics, profiles, and minimal reproductions provide evidence."],
    ["logging", "Logging creates event records that handlers format and send to outputs. Logger hierarchy, propagation, levels, context, and secret redaction shape production usefulness."],
    ["packaging", "Packaging turns source and metadata into installable distribution artifacts. It is separate from importing a package and from deploying an application."],
    ["pyproject.toml", "pyproject.toml declares build-system requirements and standardized project metadata, with tool-specific configuration in namespaced tables."],
    ["source distributions", "A source distribution is an archive of source and build metadata from which an installer can build a project. Installing it may require a compatible build environment."],
    ["wheels", "A wheel is a built distribution designed for direct installation. Its filename tags state which Python, ABI, and platform combinations it supports."],
    ["lock files", "A lock file records a resolved dependency graph for repeatable installation within its supported environments. It complements rather than replaces environment isolation."],
    ["native extensions", "A native extension crosses from Python into compiled code. It can reduce hot-path overhead or access system libraries, but memory bugs can crash the interpreter."],
    ["stable abi", "Python's stable ABI lets compatible extension binaries work across multiple Python 3 releases. It improves distribution compatibility while limiting access to some implementation-specific APIs."],
    ["ffi", "A foreign-function interface describes how Python calls a compiled library and converts arguments and results. Ownership, lifetimes, errors, thread behavior, and ABI compatibility must be explicit."],
    ["architecture", "Architecture assigns responsibilities and controls dependency direction. A maintainable Python service keeps domain rules independent from framework, storage, vendor, and process details."],
    ["dependency inversion", "Dependency inversion makes policy depend on abstractions while outer adapters implement them. A composition root selects concrete implementations at the application edge."],
    ["python security", "Python security begins at trust boundaries: parse input, parameterize interpreters, authorize actions, bound resource use, protect secrets, and avoid executable data formats."],
    ["production architecture capstone", "The capstone connects language mechanics to one operated system. Its quality is demonstrated by contracts, measurements, failure tests, build artifacts, security review, and a usable runbook."]
  ]
};

Object.assign(SIMPLE_CONCEPTS, {
  javascript: [
    ["javascript setup", "A JavaScript setup records the host, engine version, module mode, strictness, and repeatable command so an observation can be reproduced instead of guessed."],
    ["strict mode", "Strict mode selects safer language semantics: silent mistakes become errors, accidental globals are rejected, and ordinary function calls do not substitute the global object for this."],
    ["runtimes", "A runtime combines a JavaScript engine with host capabilities such as timers, networking, files, the DOM, and an event loop. Those host APIs are not all part of ECMAScript."],
    ["ecmascript specification", "The ECMAScript specification is the normative language contract. It defines observable semantics with algorithms and abstract machinery while allowing engines to implement them differently."],
    ["abstract operations", "An abstract operation is a specification algorithm used to describe behavior such as ToPrimitive or ToPropertyKey. JavaScript code cannot call most of them directly."],
    ["completion records", "A Completion Record models how evaluation finishes: normally with a value, or abruptly through throw, return, break, or continue."],
    ["primitive values", "A primitive is an immutable non-object value: undefined, null, Boolean, Number, BigInt, String, or Symbol. A variable stores that value directly."],
    ["identity", "Object identity answers whether two references designate the same object. Two separately created objects remain different even when their visible properties match."],
    ["typeof", "typeof returns a standardized category string with historical quirks, notably typeof null being object. It is useful but not a complete runtime validator."],
    ["ieee-754", "JavaScript Number normally uses IEEE-754 binary64 floating point. Many decimal fractions lack an exact binary representation, so arithmetic can contain small rounding errors."],
    ["nan", "NaN is a Number value representing an invalid numeric result. It is the only JavaScript value not strictly equal to itself; Number.isNaN tests it without coercion."],
    ["signed zero", "Number has positive and negative zero. They compare strictly equal, but Object.is and operations such as reciprocal division can distinguish them."],
    ["bigint", "BigInt represents integers of arbitrary magnitude within available memory. Its arithmetic is exact for integers but it cannot mix implicitly with Number arithmetic."],
    ["unicode", "Unicode assigns code points to text symbols, while JavaScript strings store UTF-16 code units. Encoding units, code points, and visible grapheme clusters are different counting boundaries."],
    ["graphemes", "A grapheme cluster is a user-perceived character that may contain several Unicode code points, such as an emoji sequence or base letter plus combining mark."],
    ["normalization", "Unicode normalization converts canonically equivalent code-point sequences into a chosen standard form so comparison and indexing can treat them consistently."],
    ["type coercion", "Type coercion converts a value because an operation expects another type. The selected conversion depends on the operator and follows explicit abstract algorithms."],
    ["toprimitive", "ToPrimitive asks an object for a primitive representation using Symbol.toPrimitive or an ordered valueOf and toString fallback determined by a hint."],
    ["truthiness", "Truthiness is the Boolean conversion used by conditions. Only false, 0, negative zero, 0n, empty string, null, undefined, and NaN are falsy; objects are truthy."],
    ["strict equality", "Strict equality compares without type conversion. It compares primitives mostly by value and objects by identity, while treating NaN as unequal to itself and both zeros as equal."],
    ["object.is", "Object.is implements SameValue comparison. Unlike strict equality, it treats NaN as equal to itself and positive and negative zero as different."],
    ["samevaluezero", "SameValueZero treats NaN as equal to itself and both zeros as equal. Map, Set, and Array includes use this equality model."],
    ["lexical environments", "A Lexical Environment connects an Environment Record holding bindings to an outer environment. Identifier resolution follows these lexical links."],
    ["environment records", "An Environment Record is a specification structure that creates, initializes, reads, and updates bindings for blocks, functions, modules, and global code."],
    ["execution contexts", "An execution context tracks the currently evaluated code, Realm, function, module or script, and its lexical environments. It is a specification device, not a directly accessible object."],
    ["realms", "A Realm owns a global object and a distinct set of intrinsic objects such as Array and Error. Values from another iframe or VM realm can fail same-realm instanceof checks."],
    ["hoisting", "Hoisting is shorthand for declaration-instantiation effects before statement execution. Different declarations create and initialize their bindings at different times."],
    ["temporal dead zone", "A lexical binding is in its temporal dead zone from scope entry until initialization. Access during that interval throws ReferenceError."],
    ["closures", "A closure is a function together with access to the lexical environment where it was created. It captures bindings, so later updates to those bindings remain observable."],
    ["stale state", "Stale state occurs when deferred code uses a value or assumption from an older logical snapshot. The fix is to make current input or ownership explicit, not to abandon closures."],
    ["arrow functions", "An arrow function has lexical this, arguments, super, and new.target behavior and cannot be used as a constructor. It is more than shortened function syntax."],
    ["this binding", "For an ordinary function, this is determined mainly by how the function is called: constructor, explicit call/apply/bind, method reference, or plain call."],
    ["new.target", "new.target reports which constructor was directly invoked with new and is undefined in an ordinary call. It helps distinguish construction paths."],
    ["property descriptors", "A property descriptor defines either a stored value with writable state or getter/setter functions, plus enumerable and configurable flags."],
    ["enumerability", "Enumerability controls whether common traversal operations include a property. It does not decide whether lookup can read the property."],
    ["prototypes", "An object's prototype is another object consulted when an own property is absent. This delegation chain supports shared methods and ends at null."],
    ["classes", "JavaScript class syntax defines constructor and prototype methods while adding semantics for strict execution, fields, private names, static blocks, inheritance, and derived construction."],
    ["private elements", "A private element uses a lexically scoped private name and brand check. It is not a string property and cannot be accessed through reflection or a Proxy trap."],
    ["structural sharing", "Structural sharing creates new objects only along a changed path while reusing unchanged subobjects. Identity then communicates precisely which branches changed."],
    ["array holes", "An array hole is an absent indexed property within the length, not a property containing undefined. Array operations differ in whether they skip or materialize holes."],
    ["map", "Map stores arbitrary keys without string coercion, preserves insertion order, uses SameValueZero, and exposes explicit size and iteration operations."],
    ["weakmap", "WeakMap associates data with garbage-collectable keys without keeping those keys alive. It cannot be enumerated because reachability and collection timing are nondeterministic."],
    ["iteration protocols", "The iterable protocol supplies an iterator through Symbol.iterator. The iterator protocol returns successive result objects with value and done fields."],
    ["iteratorclose", "IteratorClose invokes an iterator's return method when a consumer exits abruptly, allowing a generator or custom iterator to release resources."],
    ["generators", "A generator object is both iterator and suspended computation. Calling next, throw, or return resumes it until another yield or completion."],
    ["symbols", "A Symbol is a unique primitive often used as a collision-resistant property key or protocol hook. Symbol-keyed state remains discoverable and is not private."],
    ["proxy", "A Proxy intercepts internal object operations through traps. Its handler must preserve invariants required by non-configurable properties and non-extensible targets."],
    ["reflect", "Reflect exposes ordinary object internal operations as functions and is the safest default forwarding mechanism inside Proxy traps."],
    ["error cause", "The cause option links a translated higher-level Error to its original failure without replacing the public error message or taxonomy."],
    ["aggregateerror", "AggregateError represents several failures as one error object and is used when independent operations can fail together, including Promise.any exhaustion."],
    ["ecmascript modules", "An ECMAScript module is parsed in strict mode, declares imports and exports, and participates in a resolved, linked, then evaluated dependency graph."],
    ["live bindings", "A live import binding reads the exporter's current binding value. The importer cannot reassign it, and it is not a one-time property copy."],
    ["top-level await", "Top-level await makes a module's evaluation asynchronous and can delay dependent modules. Cycles involving asynchronous evaluation require particular care."],
    ["dynamic import", "Dynamic import asks the host to load a module and returns a promise for its namespace. It provides a runtime loading boundary and failure path."],
    ["promises", "A Promise is a placeholder for eventual completion. Reactions are scheduled as Jobs after settlement rather than invoked synchronously in the current stack."],
    ["thenables", "A thenable is an object with a callable then property. Promise resolution assimilates it defensively so foreign promise-like values adopt one eventual fate."],
    ["async functions", "Calling an async function immediately returns a Promise. await can suspend that function's evaluation, but it does not create a thread or make CPU-heavy code non-blocking."],
    ["event loop", "An event loop is host machinery that selects tasks and performs checkpoints where Promise Jobs can run. ECMAScript defines Jobs; browsers and Node define their loop details."],
    ["microtasks", "Microtask is common host terminology for queued Promise reactions and queueMicrotask callbacks. A checkpoint normally drains them before selecting another task."],
    ["bounded concurrency", "Bounded concurrency limits how many operations may be in flight. It protects memory, sockets, rate limits, downstream capacity, and tail latency."],
    ["backpressure", "Backpressure makes producers slow down or reject work when consumers reach capacity. A queue without a meaningful bound merely postpones overload."],
    ["abortcontroller", "AbortController owns an AbortSignal and broadcasts one abort reason. Cooperating APIs must observe the signal and perform their own prompt cleanup."],
    ["deadlines", "A deadline limits the total time available to an operation tree. Each child should receive the remaining budget rather than starting a fresh full timeout."],
    ["explicit resource management", "Explicit resource management binds a disposable resource's cleanup to lexical control flow using using or await using and well-known disposal symbols."],
    ["disposablestack", "DisposableStack owns multiple resources and callbacks and disposes them in reverse order. It supports dynamic ownership while preserving deterministic cleanup."],
    ["structured clone", "Structured clone copies supported JavaScript graphs including cycles and many built-ins. It preserves more types than JSON but still does not clone functions or arbitrary platform resources."],
    ["serialization", "Serialization maps runtime data to a transport or storage representation. Types, identity, compatibility, schema versions, and trust must be handled explicitly."],
    ["time zones", "A time zone maps instants to local calendar fields through rules that change historically and around daylight-saving transitions. It is not just a fixed UTC offset."],
    ["intl", "Intl exposes locale-aware formatting, collation, segmentation, and plural rules backed by host internationalization data. Formatting should stay separate from stored domain values."],
    ["regular expressions", "A regular expression describes a pattern over text. Backtracking engines may explore many alternatives, so ambiguous nested repetition on untrusted input can become a denial of service."],
    ["arraybuffer", "ArrayBuffer owns a fixed raw byte region. TypedArray and DataView objects interpret slices of that storage without owning separate copies."],
    ["dataview", "DataView reads and writes multiple numeric formats at arbitrary byte offsets with explicit endianness, making binary protocols portable."],
    ["sharedarraybuffer", "SharedArrayBuffer exposes the same bytes to multiple agents. Correctness requires a synchronization protocol rather than ordinary unsynchronized reads and writes."],
    ["atomics", "Atomics performs indivisible operations with defined ordering on supported shared typed arrays and supplies wait and notification primitives."],
    ["reachability", "An object is reachable when a chain of strong references leads to it from a runtime root. Garbage collectors may reclaim objects only after they become unreachable."],
    ["weak references", "WeakRef can observe an object without preserving its lifetime. Its result is inherently timing-sensitive and unsuitable for correctness-critical logic."],
    ["finalizationregistry", "FinalizationRegistry may report after a registered target is collected. The callback is nondeterministic and may never run, so it is diagnostic rather than resource ownership."],
    ["engine pipeline", "A JavaScript engine parses source and executes it through implementation-specific interpreter and compiler tiers. Optimization is adaptive and must preserve ECMAScript behavior."],
    ["hidden classes", "V8 hidden classes, also called shapes or maps, record recurring object layouts so property access feedback can be specialized. They are an implementation detail, not a language feature."],
    ["inline caches", "An inline cache records the shapes and targets seen at an operation and can speed repeated compatible access. Too many incompatible cases reduce specialization."],
    ["benchmarking", "Benchmarking measures a controlled workload repeatedly. Warmup, variance, input realism, garbage collection, system load, and the chosen boundary affect the conclusion."],
    ["prototype pollution", "Prototype pollution occurs when untrusted property paths modify shared prototypes or special keys, changing behavior of unrelated objects."],
    ["testing", "JavaScript testing should verify observable contracts across normal, boundary, failure, async, and cleanup paths while avoiding implementation-coupled mocks."],
    ["source maps", "A source map relates generated code locations to original source. Debuggers and error systems need the exact deployed map and artifact to reconstruct reliable stacks."],
    ["javascript architecture", "JavaScript architecture assigns domain rules, effects, validation, and resource ownership to explicit module boundaries with dependencies pointing toward stable policy."],
    ["production architecture capstone", "The JavaScript capstone joins language semantics with bounded async execution, cancellation, validation, errors, testing, telemetry, security, performance evidence, and operational recovery."]
  ],
  typescript: [
    ["typescript setup", "A TypeScript setup pins the compiler and makes the command-line project, configuration, host assumptions, and diagnostics reproducible outside one editor."],
    ["compiler versions", "The TypeScript compiler is a project dependency whose version changes syntax, library declarations, inference, resolution, and diagnostics. Record and upgrade it deliberately."],
    ["tsconfig", "A tsconfig file defines a TypeScript project: its inputs, checking rules, host libraries, module model, transformations, output, and referenced projects."],
    ["strict mode", "The strict compiler family enables checks that preserve more uncertainty instead of silently accepting it. Individual strict flags still deserve explicit understanding."],
    ["compiler pipeline", "The compiler parses files, binds declarations into symbols, checks types and relationships, transforms syntax when necessary, and emits JavaScript or declarations."],
    ["scanner", "The scanner turns source characters into tokens while tracking trivia and positions. Parsing consumes those tokens to construct syntax nodes."],
    ["parser", "The parser creates a syntax tree from tokens. A valid AST does not imply the program's names or types are semantically valid."],
    ["binder", "The binder walks syntax and creates symbols, scopes, and declaration relationships. It establishes named identity before the checker computes most types."],
    ["checker", "The checker computes types at program locations and evaluates relationships such as assignability, inference, narrowing, and overload selection."],
    ["emitter", "The emitter prints JavaScript, declaration files, and source maps from the transformed program. Most type information is erased before runtime."],
    ["language service", "The language service incrementally answers editor queries such as diagnostics, Quick Info, navigation, refactoring, and completion through a host-managed project view."],
    ["design goals", "TypeScript aims to model JavaScript with a consistent erasable structural system and useful tooling, while explicitly not promising complete soundness or runtime type metadata."],
    ["type erasure", "Type erasure means most TypeScript-only syntax and relationships disappear from emitted JavaScript. Runtime values therefore cannot rely on interfaces or assertions for validation."],
    ["structural typing", "Structural typing compares required members and their types rather than requiring values to declare one nominal lineage. Compatible shapes can substitute for one another."],
    ["soundness tradeoffs", "TypeScript accepts selected unsafe patterns to remain compatible and productive with JavaScript. Checked code reduces risk but does not mathematically prove runtime correctness."],
    ["type annotations", "An annotation states a contract the checker must enforce. Good annotations stabilize public boundaries; redundant local annotations can obscure useful inference."],
    ["inference", "Inference derives a type from initializers, arguments, returns, constraints, and context. It preserves relationships only when the program supplies enough evidence."],
    ["contextual typing", "Contextual typing pushes an expected type into an expression, especially callbacks and object literals, so parameters and members can be inferred from their use."],
    ["widening", "Widening replaces a fresh literal such as one string with a broader mutable type such as string when later assignment is expected."],
    ["any", "any disables most checking for operations involving that value and can contaminate surrounding inference. Treat it as an explicit unsafe boundary, not a convenient unknown."],
    ["unknown", "unknown can contain any runtime value but permits no unsafe operation until control flow or parsing supplies evidence of a narrower type."],
    ["never", "never represents values that cannot occur. It appears for non-returning functions, impossible intersections, and branches eliminated by exhaustive analysis."],
    ["void", "void describes a return value callers are expected to ignore. It is not a general absence type and differs from never and undefined."],
    ["strict null", "Strict null checking keeps null and undefined outside ordinary types unless a contract includes them, forcing absence to be handled deliberately."],
    ["assignability", "Assignability asks whether a source type can safely be used where a target type is expected under TypeScript's compatibility rules."],
    ["freshness", "Freshness is the temporary exactness-like check applied to newly written object literals, which catches likely misspelled or unintended excess properties."],
    ["excess property checks", "An excess property check rejects unexpected keys on a fresh object literal. It does not turn TypeScript object types into exact closed schemas."],
    ["optional properties", "An optional property may be absent. With exactOptionalPropertyTypes, explicitly assigning undefined is different unless undefined is part of the value type."],
    ["nouncheckedindexedaccess", "noUncheckedIndexedAccess adds undefined to uncertain array and index-signature reads, exposing that a syntactically valid key may be missing at runtime."],
    ["union types", "A union means the runtime value belongs to at least one member type. Only operations safe for every currently possible member are immediately available."],
    ["intersection types", "An intersection requires one value to satisfy all member types simultaneously. Conflicting primitive properties can reduce parts or the entire result to never."],
    ["discriminated unions", "A discriminated union gives every variant a shared literal property, allowing control flow to correlate the discriminant with the correct remaining fields."],
    ["state machines", "A typed state machine represents each legal state as a variant and each transition as an explicit function, preventing unrelated booleans and nullable fields from drifting."],
    ["exhaustiveness", "Exhaustiveness proves every currently possible variant is handled. Assigning the remainder to never turns a new variant into compile-time change feedback."],
    ["control-flow analysis", "Control-flow analysis tracks conditions, assignments, aliases, returns, and reachability to compute a more precise type at each program point."],
    ["narrowing", "Narrowing removes possibilities from a union using runtime evidence such as typeof, a discriminant, equality, property presence, or a trusted predicate."],
    ["type guards", "A user-defined type guard returns a predicate type that tells the checker what a true result proves. Its implementation must be tested because TypeScript trusts the claim."],
    ["assertion functions", "An assertion function throws when a condition fails and tells the checker what is true after a successful return."],
    ["function types", "A function type describes parameters, this context, return value, and possibly call or construction behavior. Parameter compatibility depends on variance and compiler options."],
    ["overloads", "Overloads expose several caller-visible signatures above one implementation. The implementation must handle all of them but is not itself an extra public overload."],
    ["interfaces", "An interface names an extendable structural object contract and supports declaration merging. It cannot directly alias arbitrary unions or primitive type expressions."],
    ["type aliases", "A type alias names any type expression, including unions, tuples, primitives, and mapped types. Repeating the alias does not create a nominal identity."],
    ["declaration merging", "Declaration merging combines compatible declarations with the same supported name. It enables augmentation but can also make ownership and global effects less obvious."],
    ["index signatures", "An index signature describes values available through a broad key type. Explicit properties must remain compatible with that indexed value contract."],
    ["readonly", "readonly blocks writes through a checked reference. It is normally shallow and emits no runtime freeze, so another mutable alias may still change the object."],
    ["const assertions", "A const assertion preserves literal values, makes object properties readonly, and turns array literals into readonly tuples without asserting one unrelated target type."],
    ["satisfies", "The satisfies operator checks an expression against a target while retaining the expression's more specific inferred type. It emits no runtime operation."],
    ["tuples", "A tuple describes a fixed sequence of element positions, optional slots, and rest portions. It carries more positional information than a general array."],
    ["generics", "Generics use type parameters to preserve relationships among inputs, outputs, containers, and callbacks across many concrete types."],
    ["constraints", "A generic constraint states the minimum capability a type argument must have. It should not erase additional specific information the caller provides."],
    ["generic inference", "Generic inference collects candidate types from argument and contextual positions, reconciles them through constraints and variance, and chooses type arguments."],
    ["const type parameters", "A const type parameter asks inference to retain literal structure from inline arguments when doing so satisfies its constraint."],
    ["noinfer", "NoInfer blocks one location from contributing inference candidates while still checking it against the final inferred type."],
    ["keyof", "keyof produces a union of permitted property-key types from an object type. Index signatures can broaden it to string, number, or symbol."],
    ["type-query typeof", "typeof in a type position captures the static type of a permitted value expression. Runtime typeof remains a JavaScript operation returning category strings."],
    ["indexed access types", "An indexed access type T[K] looks up the property type or union of property types named by K without reading a runtime value."],
    ["mapped types", "A mapped type iterates over a key union at compile time to derive properties, optionally changing modifiers, names, or value types."],
    ["key remapping", "Key remapping uses an as clause inside a mapped type to rename or filter keys. Producing never removes a key from the result."],
    ["conditional types", "A conditional type chooses one type or another according to an assignability test after type arguments become known."],
    ["infer", "infer introduces a type variable from a matched position inside the true branch of a conditional type, such as extracting a function return or array element."],
    ["distributivity", "A conditional type with a naked type parameter distributes over union members. Wrapping both sides in tuples suppresses that behavior."],
    ["template literal types", "Template literal types combine string literal unions and can infer substrings. Their cross products can grow rapidly and slow the checker."],
    ["utility types", "Built-in utility types are reusable mapped and conditional transformations. Most are shallow mechanical operations rather than complete domain models."],
    ["variance", "Variance describes how subtyping of type arguments affects subtyping of a generic container or function, based on whether values are produced, consumed, or mutated."],
    ["covariance", "Covariance preserves direction: a producer of Dog can act as a producer of Animal because it only returns values."],
    ["contravariance", "Contravariance reverses direction: a consumer accepting any Animal can safely stand in for one asked to consume Dogs."],
    ["invariance", "Invariance permits neither direction because a type position both consumes and produces mutable values, making either substitution potentially unsafe."],
    ["bivariance", "Bivariance accepts both parameter directions in selected compatibility cases for practical JavaScript patterns, trading soundness for convenience."],
    ["classes", "A TypeScript class has a runtime JavaScript constructor and prototype plus compile-time instance and static types. Its compatibility is mostly structural."],
    ["abstract classes", "An abstract class can provide runtime implementation and require subclasses to implement abstract members, but cannot be directly constructed in checked code."],
    ["branded types", "A branded type intersects a value with an inaccessible marker to distinguish otherwise identical structures. The brand erases and should follow runtime parsing."],
    ["unique symbols", "A unique symbol type represents the identity of one symbol declaration and can create non-colliding keys or compile-time brands."],
    ["decorators", "Current decorators can observe or replace classes and elements and schedule initialization through typed context objects. They are runtime metaprogramming, not type-only syntax."],
    ["enums", "An enum creates a named type and normally a runtime object. Numeric enums also emit reverse mappings, while const enums may inline values."],
    ["literal unions", "A literal union is erased but precisely limits values during checking. Pair it with a runtime as-const object or parser when enumeration is required at runtime."],
    ["type-only imports", "A type-only import states that an edge exists solely for checking and must be erased, preventing an accidental runtime dependency."],
    ["verbatimmodulesyntax", "verbatimModuleSyntax preserves non-type import and export syntax while erasing explicitly type-only edges, making module emit easier to predict."],
    ["isolatedmodules", "isolatedModules reports constructs unsafe for single-file transpilation because no cross-file type analysis is available to that transformer."],
    ["module resolution", "Module resolution is the compiler's host model for mapping an import specifier to source or declaration files. It must agree with the actual runtime or bundler."],
    ["nodenext", "NodeNext models the current Node ESM and CommonJS rules using file extensions, package type, exports conditions, and matching runtime syntax."],
    ["paths", "The paths option redirects TypeScript's lookup for selected specifiers but does not rewrite emitted imports or configure the runtime."],
    ["declaration files", "A declaration file describes the static surface of existing runtime code without implementing it. An inaccurate declaration makes unsafe code appear checked."],
    ["ambient declarations", "An ambient declaration tells TypeScript a value, module, or global exists elsewhere. It emits no code to create that runtime value."],
    ["module augmentation", "Module augmentation merges additional declarations into an existing module's types. Runtime implementation must still supply the augmented behavior."],
    ["lib selection", "The lib option chooses standard declaration sets assumed available, such as ECMAScript, DOM, or WebWorker APIs. It does not install those APIs at runtime."],
    ["declaration emit", "Declaration emit turns exported TypeScript contracts into d.ts artifacts for consumers while implementation details and private non-exported names remain hidden where possible."],
    ["package exports", "Package exports define runtime entry points and conditions. Type declarations must mirror every supported public entry so checker and host select compatible files."],
    ["typesversions", "typesVersions can route declaration files according to a consumer compiler version, supporting syntax or library compatibility across TypeScript releases."],
    ["allowjs", "allowJs includes JavaScript files in a TypeScript project. checkJs determines whether diagnostics are reported for those JavaScript sources."],
    ["jsdoc types", "JSDoc annotations add contracts to JavaScript without changing runtime syntax and provide an incremental migration path toward TypeScript."],
    ["runtime validation", "Runtime validation examines actual external values after types have erased and produces trusted data or structured errors."],
    ["parsing", "Parsing should accept unknown input and return a domain representation only after checking shape, values, limits, versions, and invariants."],
    ["schemas", "A runtime schema is executable validation metadata that can sometimes also infer a static type. The two surfaces must be kept from drifting."],
    ["type boundaries", "A type boundary is where values enter from or leave for systems not guaranteed by the current checker, such as HTTP, environment, storage, queues, files, and models."],
    ["async typing", "Async typing models eventual and streamed values through Promise, AsyncIterable, and AsyncGenerator contracts. It does not model event-loop scheduling or guarantee cancellation."],
    ["awaited", "Awaited recursively models how await unwraps promises and thenables and distributes through null or undefined according to the built-in utility definition."],
    ["react with typescript", "React typing connects component props, JSX elements, events, refs, reducer states, and generic component inference while preserving usable caller APIs."],
    ["node.js with typescript", "Node TypeScript code must align compile-time resolution and platform types with Node's actual ESM or CommonJS loader, process lifecycle, and runtime input."],
    ["type testing", "Type testing compiles examples expected to succeed or fail and asserts inferred relationships. It complements but cannot replace runtime behavior tests."],
    ["ts-expect-error", "ts-expect-error requires the next line to produce a diagnostic and itself fails when the expected error disappears, making negative type behavior testable."],
    ["project references", "Project references connect composite TypeScript projects in a directed graph. Consumers use declarations and build mode rebuilds dependencies in order."],
    ["incremental builds", "Incremental builds store information about prior program structure and outputs so later checks or emits can avoid unaffected work."],
    ["compiler api", "The compiler API exposes programs, source files, AST nodes, symbols, semantic types, transforms, diagnostics, and printing for custom analysis and tooling."],
    ["ast traversal", "AST traversal visits syntax nodes and their children. Semantic questions usually also require a Program and TypeChecker rather than syntax alone."],
    ["extendeddiagnostics", "extendedDiagnostics reports file counts, memory, type counts, instantiations, and time spent parsing, binding, checking, transforming, and emitting."],
    ["generatetrace", "generateTrace records detailed compiler work for locating expensive type relationships and instantiations after broad diagnostics identify a check-time problem."],
    ["typescript upgrades", "A TypeScript upgrade can change syntax, inference, standard declarations, module modeling, diagnostics, and output, so it needs release-note review and compatibility tests."],
    ["ai-assisted typescript", "AI-generated TypeScript should be treated as an untrusted change: types constrain it, while validation, tests, security review, dependency provenance, and measurements establish evidence."],
    ["typescript architecture", "TypeScript architecture keeps precise domain contracts inward and translates framework, vendor, and wire types at adapters around a dependency-injected core."],
    ["production architecture capstone", "The capstone joins compiler configuration, domain types, runtime validation, packaging, async ownership, tests, telemetry, compatibility, and operational evidence in one system."]
  ],
  nodejs: [
    ["node.js setup", "A Node.js setup pins a supported runtime line and records the executable, package manager, platform, native-library versions, module format, and repeatable command."],
    ["release lines", "Node release lines move through current, active LTS, maintenance, and end-of-life phases. Production support and upgrade policy should follow an explicit supported line."],
    ["version management", "Version management makes the repository, developer shell, CI, container, and production run the intended Node binary rather than relying on ambient installation."],
    ["cli", "The Node CLI selects entry code, module input, permissions, diagnostics, memory limits, preload hooks, and runtime behavior through explicit flags."],
    ["repl", "The REPL evaluates interactive JavaScript in a persistent process context. It is useful for experiments but differs from a normal module in loading and scope details."],
    ["node.js architecture", "Node.js embeds V8 and adds native bindings, libuv integration, system APIs, module loaders, diagnostics, and process lifecycle to host JavaScript outside a browser."],
    ["v8", "V8 parses, compiles, executes, optimizes, and garbage-collects JavaScript. Node supplies host APIs around it but does not replace JavaScript semantics."],
    ["native bindings", "Native bindings connect JavaScript APIs to Node's C or C++ implementation and operating-system capabilities, crossing type, lifetime, and failure boundaries."],
    ["libuv", "libuv supplies Node's cross-platform event loop, asynchronous handles, and shared worker pool while adapting different operating-system I/O mechanisms."],
    ["event loop phases", "A libuv loop iteration processes categories of ready callbacks, including timers, polling, check work, and close callbacks. Exact ordering depends on scheduling context."],
    ["poll", "The poll phase processes eligible I/O callbacks and may wait for new events when no earlier constraint requires immediate progress."],
    ["check", "The check phase is where setImmediate callbacks run after polling in the same loop iteration."],
    ["process.nexttick", "process.nextTick queues work for Node's next-tick queue, which runs before the event loop continues and can starve I/O when recursively refilled."],
    ["promise microtasks", "Promise reactions run through V8's microtask mechanism at Node-defined checkpoints after current JavaScript work and next-tick processing."],
    ["queuemicrotask", "queueMicrotask schedules a microtask without creating a Promise. Repeated self-scheduling can delay tasks and I/O just like Promise reactions."],
    ["setimmediate", "setImmediate schedules a callback for the check phase. From an I/O callback it normally runs before a newly scheduled zero-delay timer."],
    ["timers", "Node timers schedule callbacks after a minimum delay threshold. Event-loop work, operating-system scheduling, and clock behavior can make actual execution later."],
    ["starvation", "Starvation occurs when one queue or synchronous computation continually prevents other ready work from progressing, increasing latency despite nominal concurrency."],
    ["libuv worker pool", "The shared libuv worker pool performs selected filesystem, DNS, crypto, and compression operations that cannot use ordinary readiness notification."],
    ["uv_threadpool_size", "UV_THREADPOOL_SIZE configures the shared libuv pool before it initializes. Increasing it changes capacity and memory use but does not replace admission control."],
    ["saturation", "Saturation means a constrained resource has no spare capacity, so new work queues and tail latency rises. Queue depth and wait time reveal it."],
    ["error-first callbacks", "An error-first callback receives an error in its first argument and a result later. APIs must call it exactly once and callers must handle both paths."],
    ["promisify", "util.promisify adapts conventional error-first callback APIs into Promises. Nonstandard callback layouts need an explicit adapter."],
    ["error propagation", "Node errors travel through synchronous throws, callback arguments, EventEmitter error events, Promise rejection, streams, workers, and process exit; each boundary needs ownership."],
    ["eventemitter", "EventEmitter invokes registered listeners synchronously in order when emit is called. Emission itself is ordinary JavaScript, not an event-loop phase."],
    ["capturerejections", "captureRejections observes rejected Promises returned by async listeners and routes them toward a rejection handler or error event instead of silently losing them."],
    ["listeners", "A listener registration holds a strong function reference until removed. Unbounded or repeated registration can retain request state and produce duplicate work."],
    ["async_hooks", "async_hooks exposes lifecycle events for asynchronous resources and their trigger relationships. Direct hooks are low-level and can add overhead or recursion risk."],
    ["asynclocalstorage", "AsyncLocalStorage associates a store with an asynchronous execution chain so request context can be read without unsafe process-global mutation."],
    ["asyncresource", "AsyncResource lets a custom async abstraction create a resource boundary and invoke callbacks within the correct async context."],
    ["request correlation", "Request correlation carries a bounded identifier through logs, metrics, traces, and downstream calls so events from one operation can be connected."],
    ["abortsignal", "AbortSignal is cooperative cancellation evidence. APIs must observe it, stop underlying work, and release resources; rejecting a wrapper alone is insufficient."],
    ["ref", "A referenced Node handle keeps the event loop alive. Calling unref lets the process exit naturally when no other referenced work remains."],
    ["unref", "unref removes one handle's ability to keep the process alive without cancelling it. It suits optional background timing, not correctness-critical cleanup."],
    ["drift", "Timer drift is the gap between intended and actual schedule caused by loop work, OS timing, and repeated delay calculation. Periodic jobs need explicit drift policy."],
    ["buffer", "Buffer is Node's byte-oriented Uint8Array subclass for binary I/O. Encoding converts bytes to text; the Buffer itself is not a string."],
    ["allocation", "Buffer allocation must choose initialized or unsafe memory and a bounded size. Unsafe allocation can expose prior process memory if bytes are read before overwrite."],
    ["pooling", "Small Buffer allocations may use slices of an internal slab. The visible view can have a nonzero byte offset inside a larger underlying ArrayBuffer."],
    ["slices", "Buffer subarray and modern slice behavior create views sharing storage. Mutating either view affects the same bytes unless an explicit copy is made."],
    ["arraybuffer", "ArrayBuffer owns a raw byte region while Buffer, TypedArray, and DataView interpret a view with an offset and length over that storage."],
    ["transfer", "Transferring an ArrayBuffer moves ownership to another agent and detaches the sender's buffer. Pooled backing storage requires exact-range care."],
    ["endianness", "Endianness specifies byte order for multi-byte numeric values. Network and file protocols must choose it explicitly rather than relying on machine defaults."],
    ["stream architecture", "Node streams implement incremental readable and writable protocols with internal queues, lifecycle state, errors, destruction, and flow control."],
    ["readable", "A Readable produces chunks on demand or from an underlying source and tracks queued data, consumption mode, end, error, and destruction state."],
    ["writable", "A Writable accepts chunks into an internal queue and reports completion after its sink handles them. Its write return value communicates pressure."],
    ["duplex", "A Duplex combines independent readable and writable sides, as in a TCP socket. Ending one side need not immediately end the other."],
    ["transform", "A Transform is a Duplex whose output derives from input chunks. Its callback controls when each input is complete and may return data or failure."],
    ["flowing mode", "A flowing Readable pushes data through data events or pipe as fast as consumers allow. Adding or removing listeners changes mode and must be deliberate."],
    ["paused mode", "A paused Readable exposes data through read, readable events, or async iteration according to consumer demand."],
    ["async iteration", "for-await-of consumes a Readable through its async iterator and gives structured early-exit cleanup with normal loop control."],
    ["object mode", "Object-mode streams count arbitrary JavaScript values rather than byte length, so highWaterMark represents object count rather than bytes."],
    ["highwatermark", "highWaterMark is an internal queue threshold that triggers backpressure signals. It is not a strict total-memory limit for the process."],
    ["drain", "A Writable emits drain after its queue falls below the pressure threshold, telling a paused producer it may resume."],
    ["cork", "Writable corking batches small writes until uncork or next tick, potentially reducing system calls when the implementation supports vectorized output."],
    ["backpressure", "Backpressure makes an upstream producer slow down when downstream capacity is full, preventing queues and memory from growing with total input."],
    ["pipeline", "stream.pipeline owns a connected chain, propagates errors and cancellation, destroys affected stages, and provides one completion signal."],
    ["finished", "stream.finished waits for a stream's completion or premature close and helps make lifecycle ownership explicit."],
    ["web streams", "WHATWG Web Streams use readers, writers, controllers, locking, and queuing strategies. Node provides adapters, but lifecycle details differ from classic Node streams."],
    ["file descriptors", "A file descriptor is a process handle for an open kernel file description. It must be closed deterministically on success and failure."],
    ["atomic writes", "An atomic replacement writes and flushes a temporary file before renaming it over the target on the same filesystem, avoiding partially visible content."],
    ["watching", "Filesystem watch reports platform-dependent change notifications that may be coalesced, duplicated, missing, or refer to renamed paths. It is a hint, not a durable log."],
    ["race conditions", "A filesystem race occurs when path state changes between separate checks and operations. Open directly with required flags and validate the resulting handle."],
    ["file urls", "File URLs identify resources using URL encoding and platform conversion rules. Use URL and fileURLToPath APIs instead of manual pathname surgery."],
    ["path traversal", "Path traversal escapes an authorized root through parent segments, absolute paths, links, or encoding. Authorization must validate the resolved filesystem target and operation."],
    ["tcp sockets", "A TCP socket is a reliable ordered byte stream, not a message stream. Application framing must handle messages split or combined across data events."],
    ["framing", "Framing defines where application messages start and end using lengths, delimiters, or a self-describing protocol with strict size bounds."],
    ["half-close", "TCP half-close means one direction has ended while the other may still transmit. Duplex lifecycle policy decides whether to allow or destroy it."],
    ["dns", "Node exposes OS-backed address lookup and direct DNS protocol queries with different caching, worker-pool, ordering, and configuration behavior."],
    ["lookup", "dns.lookup uses operating-system name resolution semantics and can consume the libuv worker pool because common system resolver APIs are blocking."],
    ["resolve", "dns.resolve methods send DNS queries through the c-ares integration and return record-specific data rather than mirroring OS address lookup."],
    ["tls", "TLS authenticates peers and protects transport bytes when certificate chains, hostnames, protocols, trust roots, and keys are configured correctly."],
    ["sni", "Server Name Indication sends the intended hostname during the TLS handshake so a server can select the appropriate certificate and configuration."],
    ["alpn", "ALPN negotiates an application protocol such as HTTP/2 or HTTP/1.1 inside the TLS handshake."],
    ["http server", "Node's HTTP server parses requests from sockets and exposes streaming IncomingMessage and ServerResponse objects while the application owns validation, limits, and errors."],
    ["keep-alive", "HTTP keep-alive reuses a connection across requests, reducing setup cost while requiring idle limits, correct framing, and bounded connection ownership."],
    ["fetch", "Node fetch provides a Web-standard client implemented on Undici, including streaming bodies and AbortSignal while hiding lower dispatcher and pool details."],
    ["undici", "Undici is Node's HTTP client implementation underlying fetch. Dispatchers and pools manage connection reuse, queuing, and origin capacity."],
    ["response consumption", "A response body must be consumed, cancelled, or otherwise released so its connection and buffers can be reclaimed or safely reused."],
    ["http/2", "HTTP/2 multiplexes independent streams over one session with binary framing, header compression, and connection plus stream flow control."],
    ["goaway", "An HTTP/2 GOAWAY frame tells a peer no new streams should begin beyond a last accepted identifier while existing streams may drain."],
    ["ecmascript modules", "Node ESM uses URL-based resolution, linking, live bindings, package rules, and asynchronous evaluation compatible with the ECMAScript module model."],
    ["commonjs", "CommonJS wraps each file in a function and loads modules synchronously through require, inserting them into a cache before evaluation completes."],
    ["module cache", "A module cache keys loaded module identity and reuses its exports. Cycles can observe partial initialization, and multiple resolved identities can duplicate state."],
    ["dual-package hazards", "A dual-package hazard occurs when ESM and CommonJS consumers load separate implementations of one logical package and observe different singleton state or identity."],
    ["runtime typescript", "Node can strip erasable TypeScript syntax and execute the remaining JavaScript, but it does not type-check or honor general tsconfig transformations."],
    ["type stripping", "Type stripping replaces erasable type syntax without producing transformed JavaScript for features that require runtime generation."],
    ["packages", "A Node package is a folder tree controlled by package.json boundaries, module type, entry points, metadata, and the files actually distributed."],
    ["package-lock", "package-lock records an exact resolved npm dependency graph and integrity values for a supported install model. It complements package.json ranges."],
    ["semantic versioning", "Semantic versioning communicates compatibility intent through major, minor, and patch changes; a range states which future versions installation may select."],
    ["lifecycle scripts", "npm lifecycle scripts execute package-defined commands during selected install, pack, publish, and run phases and therefore cross a code-execution trust boundary."],
    ["configuration", "Node configuration should parse environment, arguments, or files once during startup into an immutable trusted object before the process reports readiness."],
    ["process.env", "process.env exposes string-like environment input inherited by the process. Types, formats, presence, precedence, and secret handling require runtime validation."],
    ["node errors", "Node errors may include stable name, code, syscall, path, address, and cause fields. Branch on documented structured fields rather than message text."],
    ["operational failures", "An operational failure is an expected external condition such as timeout or unavailable dependency that can be translated, retried under policy, or reported."],
    ["programmer bugs", "A programmer bug violates an internal invariant or uses an API incorrectly. Continuing the same process may preserve corrupted application state."],
    ["uncaughtexception", "uncaughtException is a last-resort process event after an exception reaches the event loop. Perform synchronous emergency cleanup and exit rather than resuming normal service."],
    ["unhandledrejection", "unhandledRejection reports a Promise rejected without a handler in time. Treat it as a lost ownership path and make crash policy explicit."],
    ["process lifecycle", "A production Node process initializes resources, becomes ready, admits bounded work, stops admission on termination, drains, cleans up, and exits under a deadline."],
    ["readiness", "Readiness answers whether this instance should receive new traffic. It should fall before draining starts."],
    ["liveness", "Liveness answers whether a stuck instance needs replacement. It should not fail merely because a temporary dependency is unavailable."],
    ["graceful shutdown", "Graceful shutdown stops new work, allows bounded completion, cancels or closes remaining resources, and exits before the platform's termination deadline."],
    ["child_process", "child_process starts an isolated operating-system process with arguments, environment, standard streams, exit status, signals, and optional IPC."],
    ["spawn", "spawn starts a command directly and exposes streaming stdio. With shell false and an argument array, shell metacharacters are not interpreted."],
    ["execfile", "execFile runs an executable without a shell by default and buffers output for callback or Promise completion, requiring strict output limits."],
    ["exec", "exec runs a command string through a shell and buffers output, making untrusted interpolation dangerous and large output expensive."],
    ["worker_threads", "Worker threads run JavaScript in separate V8 isolates within one process, enabling CPU parallelism while sharing process fate and optional memory."],
    ["structured clone", "Worker messages use structured clone for supported JavaScript graphs unless transferable objects move ownership or shared memory is used."],
    ["sharedarraybuffer", "SharedArrayBuffer exposes the same memory across isolates and requires an Atomics-based synchronization protocol for visibility and coordination."],
    ["cluster", "Cluster manages multiple Node processes that may share a listening port and communicate by IPC. Each worker has isolated memory and failure state."],
    ["replicas", "Independent replicas are separate service processes usually load-balanced and supervised by an external platform, keeping replication ownership outside application code."],
    ["background jobs", "A background job moves work outside the request's immediate response path. In-process background execution is not durable across crashes or deployments."],
    ["durable queues", "A durable queue persists delivery state outside one process and requires idempotency, attempt budgets, visibility, dead-letter handling, and recovery operations."],
    ["node test runner", "The built-in node:test runner discovers and executes tests with assertions, mocking, concurrency controls, coverage, watch behavior, and process or thread isolation options."],
    ["permission model", "Node's permission model restricts selected filesystem, network, child-process, worker, and addon capabilities as defense in depth; it is not a security sandbox."],
    ["ssrf", "Server-side request forgery tricks a service into making attacker-chosen network requests. Defenses validate scheme and destination, resolve addresses, block private ranges, and recheck redirects."],
    ["least privilege", "Least privilege grants a process only the filesystem, network, command, credential, and platform authority required for its current responsibility."],
    ["diagnostics_channel", "diagnostics_channel provides named in-process publication points so instrumentation can observe operations without monkey-patching application or library methods."],
    ["structured logging", "Structured logging emits bounded machine-readable event fields with stable names, correlation, and redaction rather than unsearchable prose or arbitrary objects."],
    ["perf_hooks", "perf_hooks exposes high-resolution timing, marks, measures, event-loop utilization, delay histograms, and performance observers for measured experiments."],
    ["eventlooputilization", "Event-loop utilization compares time the loop was active with elapsed time. High utilization indicates little idle capacity but not the exact cause."],
    ["monitoreventloopdelay", "monitorEventLoopDelay samples scheduling delay into a histogram, exposing percentile responsiveness degradation from blocking or saturation."],
    ["v8 heap", "The V8 heap stores garbage-collected JavaScript objects across managed spaces. It excludes substantial Buffer, native, stack, and other process memory."],
    ["external memory", "External memory includes allocations associated with JavaScript objects but owned outside the V8 heap, notably Buffer and native resources."],
    ["rss", "Resident set size estimates physical memory currently mapped into the process, including heap, native allocations, code, stacks, libraries, and allocator fragmentation."],
    ["heap snapshots", "A heap snapshot records objects and reference edges so retaining paths can identify which live root prevents expected collection."],
    ["cpu profiles", "A CPU profile samples executing stacks over time and estimates where representative CPU time is spent across JavaScript and visible native frames."],
    ["diagnostic reports", "A diagnostic report captures process, JavaScript, native stack, resource, OS, and runtime information during a signal, fatal error, or explicit request."],
    ["native addons", "A native addon loads compiled code into the Node process, gaining performance or system access while adding memory-safety, ABI, blocking, and crash risk."],
    ["node-api", "Node-API is an ABI-stable C interface for addons that avoids direct dependency on changing V8 APIs across supported Node versions."],
    ["webassembly", "WebAssembly executes validated portable bytecode in a managed instance with explicit imports and linear memory, but host calls and resource limits still require design."],
    ["node.js service architecture", "Node service architecture keeps domain policy independent while adapters own HTTP, storage, queues, telemetry, configuration, and process lifecycle."],
    ["concurrency budgets", "A concurrency budget caps in-flight work for each constrained dependency or execution boundary, turning overload into bounded waiting or rejection."],
    ["overload", "Overload occurs when admitted work exceeds sustainable capacity. Queue growth increases latency until memory, timeouts, or dependencies fail unless the service sheds load."],
    ["production architecture capstone", "The Node capstone connects runtime scheduling, streaming, network protocols, workers, validation, security, diagnostics, tests, shutdown, and recovery in one operated service."]
  ],
  "cloud-aws": [
    ["shared responsibility", "Shared responsibility divides security and operations between AWS and the customer. The exact line moves by service, but the customer always owns data, identities, configuration, and workload behavior."],
    ["regions", "A Region is a geographic AWS service area containing multiple isolated Availability Zones. Region choice affects latency, sovereignty, price, service availability, and disaster-recovery design."],
    ["availability zones", "An Availability Zone is a distinct infrastructure fault domain within one Region. Multi-AZ design reduces dependence on one facility but does not automatically make an application resilient."],
    ["accounts", "An AWS account is a strong boundary for identity, quotas, billing, API ownership, and blast radius. Organizations connect accounts while service control policies constrain their maximum permissions."],
    ["iam", "IAM evaluates whether a principal may perform an action on a resource in a context. Identity, resource, session, boundary, and organization policies can all participate, and explicit deny wins."],
    ["sts", "AWS STS issues short-lived credentials for an assumed role or federated identity. The resulting session is limited by the role, trust policy, session policy, and organization controls."],
    ["kms", "KMS protects cryptographic keys and performs controlled cryptographic operations. Envelope encryption uses a KMS-protected data key while bulk data is encrypted outside KMS."],
    ["vpc", "A VPC is a regional virtual network boundary with address space, subnets, routes, filtering, and service connectivity. It does not itself make every resource private."],
    ["subnets", "A subnet is an Availability-Zone-scoped portion of a VPC CIDR. Its effective connectivity comes from routes, addresses, gateways, and resource configuration."],
    ["security groups", "A security group is a stateful allow-list attached to network interfaces. Return traffic for an allowed connection is recognized automatically."],
    ["network acls", "A network ACL is a stateless ordered allow-and-deny filter at the subnet boundary. Both directions and ephemeral ports must be modeled."],
    ["route 53", "Route 53 provides authoritative DNS and routing policies. Resolver and TTL caches mean a changed record does not instantly change every client's destination."],
    ["cloudfront", "CloudFront serves content through edge caches. Cache keys, origin policies, TTLs, invalidation, and authorization determine both correctness and performance."],
    ["ec2", "EC2 supplies virtual machines whose customer owns guest OS, runtime, patching, process health, and much of scaling behavior."],
    ["s3", "S3 stores objects under bucket and key names with versioning, policy, lifecycle, encryption, and replication controls. It is object storage rather than a mounted disk."],
    ["lambda", "Lambda admits an invocation to an execution environment, initializes code when needed, runs the handler, and applies event-source-specific retry and concurrency behavior."],
    ["ecs", "ECS reconciles task definitions and service desired count into running tasks on Fargate or EC2 capacity. Task networking, roles, health, and deployment policy remain explicit."],
    ["rds", "RDS manages database infrastructure tasks while the customer still owns schema, queries, connections, access, migrations, performance, and recovery verification."],
    ["dynamodb", "DynamoDB routes items using partition-key hashes. Key distribution and access patterns determine scalability, index design, consistency choices, and hot partitions."],
    ["sqs", "SQS durably buffers messages between producers and consumers. Standard queues deliver at least once, so visibility timeouts and idempotent consumers are central."],
    ["eventbridge", "EventBridge matches events to targets using rules. It decouples publishers from subscribers but requires schema, retry, archive, and authorization design."],
    ["cloudwatch", "CloudWatch stores AWS metrics, logs, alarms, and dashboards. Dimensions and retention affect diagnostic value, cardinality, and cost."],
    ["cloudformation", "CloudFormation turns a template into ordered AWS API changes and records stack state. A failed update may roll back, while replacements can destroy and recreate resources."],
    ["well-architected", "The AWS Well-Architected Framework reviews operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability as interacting design concerns."],
    ["bedrock", "Amazon Bedrock provides managed access to foundation models and related AI capabilities. Application identity, data boundaries, evaluation, safety, latency, and cost still belong to the workload."]
  ],
  devops: [
    ["devops", "DevOps is a socio-technical operating model that improves the flow of changes and feedback across development and operations. Automation supports it but does not create shared ownership by itself."],
    ["calms", "CALMS summarizes culture, automation, lean flow, measurement, and sharing. It is a diagnostic lens rather than a product checklist."],
    ["continuous integration", "Continuous integration means merging small changes frequently and verifying the shared main line automatically so integration risk is discovered early."],
    ["continuous delivery", "Continuous delivery keeps every verified change releasable through an automated path. Deployment may still require an explicit business decision."],
    ["pipeline", "A delivery pipeline is a dependency graph of isolated jobs, evidence, artifacts, approvals, and environment changes triggered by an event."],
    ["artifacts", "An artifact is an immutable build output identified by version and preferably digest. The same artifact should be promoted rather than rebuilt per environment."],
    ["oidc", "OIDC federation lets a workflow exchange signed identity claims for short-lived cloud credentials. Trust rules should bind repository, branch, environment, and intended audience."],
    ["sboms", "An SBOM inventories components contained in an artifact. It helps exposure analysis but does not prove that the build or components are trustworthy."],
    ["provenance", "Build provenance records how an artifact was produced, including source, builder, inputs, and process. Verification connects the deployed digest to that evidence."],
    ["canary", "A canary exposes a candidate release to limited traffic, compares health and business signals, and promotes or aborts based on predefined gates."],
    ["expand-contract", "Expand-contract changes a schema in compatible phases: add the new shape, support both versions, migrate data and traffic, then remove the old shape later."],
    ["slis", "An SLI is a measured indicator of user-relevant service behavior, such as successful request ratio or latency under a threshold."],
    ["slos", "An SLO is a target for an SLI over a time window. Its error budget creates room for normal failure while making reliability tradeoffs explicit."],
    ["incident", "An incident is managed by stabilizing impact, assigning clear roles, testing hypotheses from evidence, communicating, recovering, and learning without blame."],
    ["infrastructure as code", "Infrastructure as code represents desired infrastructure in versioned configuration and applies it through reviewed plans and provider APIs."],
    ["platform engineering", "Platform engineering treats reusable internal capabilities as a product. Golden paths reduce cognitive load while escape hatches preserve legitimate variation."]
  ],
  docker: [
    ["docker architecture", "The Docker client sends API requests to a daemon that manages images, containers, networks, and volumes and delegates container execution to lower-level runtimes."],
    ["images", "A container image is immutable configuration plus content-addressed filesystem layers and metadata. A digest identifies content; a tag is a movable name."],
    ["containers", "A container is a running or stopped process configuration created from an image, with a writable layer, namespaces, cgroups, mounts, and networking."],
    ["layers", "Image layers store filesystem changes and are shared by content digest. Build instruction inputs determine when a cached layer can be reused."],
    ["build context", "The build context is the set of files the builder may read. Keeping it small improves speed and prevents accidental secret or irrelevant-data transfer."],
    ["buildkit", "BuildKit evaluates a build dependency graph, parallelizes independent work, and supports ephemeral cache, secret, SSH, and bind mounts."],
    ["multi-stage builds", "A multi-stage Dockerfile builds in several named stages and selectively copies final artifacts into a smaller runtime stage."],
    ["entrypoint", "ENTRYPOINT defines the executable a container normally runs. Exec form preserves argument boundaries and lets that process receive signals directly."],
    ["cmd", "CMD supplies default command or arguments that docker run may replace. When combined with exec-form ENTRYPOINT, it commonly provides overridable defaults."],
    ["pid 1", "The first process in a container has special signal and orphan-reaping responsibilities. Shell wrappers can accidentally prevent the application from receiving termination."],
    ["namespaces", "Linux namespaces give a process isolated views of IDs, mounts, networking, hostnames, users, and other kernel resources."],
    ["cgroups", "Control groups account for and limit CPU, memory, process, and I/O resources. They control consumption rather than filesystem or identity visibility."],
    ["capabilities", "Linux capabilities divide root privilege into smaller powers. Dropping all and adding only a proven need reduces container impact."],
    ["rootless", "Rootless Docker runs daemon and containers without host root authority by using user namespaces and other constraints."],
    ["bridge", "A Docker bridge connects container interfaces on one host and normally uses address translation for published ports and outbound traffic."],
    ["volumes", "A Docker volume has a lifecycle independent from one container and is managed through Docker's storage interface."],
    ["bind mounts", "A bind mount exposes an explicit host path inside a container. Its host coupling and permissions increase both convenience and risk."],
    ["compose", "Docker Compose turns a multi-service model into related Docker objects for local or single-host workflows. It does not provide a distributed control plane."],
    ["registries", "A registry stores image manifests and blobs and controls push and pull access. Deployments should identify immutable digests rather than mutable tags."],
    ["sboms", "A container SBOM describes packaged components and versions. Pair it with scanning, provenance, signatures, and runtime policy for broader supply-chain assurance."]
  ],
  kubernetes: [
    ["desired state", "Desired state is the spec stored through the Kubernetes API. Controllers repeatedly compare it with observed state and act to reduce differences."],
    ["control plane", "The control plane exposes and stores the API, schedules Pods, and runs controllers. Worker nodes execute the actual application data plane."],
    ["api server", "The API server authenticates, authorizes, admits, validates, converts, persists, and audits Kubernetes API requests."],
    ["etcd", "etcd is the strongly consistent key-value store backing Kubernetes API state. Cluster recovery depends on protected, tested etcd backups or managed-provider equivalents."],
    ["controllers", "A controller is a level-triggered reconciliation loop that watches objects and makes idempotent changes toward desired state."],
    ["scheduler", "The scheduler assigns unscheduled Pods to feasible nodes by filtering constraints, scoring choices, and binding the result."],
    ["kubelet", "The kubelet watches assigned Pod specs on one node and asks the container runtime and other node plugins to make them real."],
    ["pods", "A Pod is the smallest schedulable Kubernetes workload unit. Its containers share a network namespace and can share declared volumes."],
    ["readiness", "Readiness indicates whether a Pod should receive Service traffic. Failure removes its endpoint without necessarily restarting the container."],
    ["liveness", "Liveness indicates whether a stuck container should be restarted. A probe that measures dependencies incorrectly can amplify an outage."],
    ["deployments", "A Deployment manages ReplicaSets and performs declarative stateless rollouts while respecting availability and surge settings."],
    ["statefulsets", "A StatefulSet gives Pods stable ordinal identity and coordinated storage and rollout behavior. The application still owns replication and data correctness."],
    ["services", "A Service provides stable virtual access to a dynamic set of ready endpoints selected from Pods."],
    ["endpointslices", "EndpointSlices hold scalable groups of Service backends and readiness information consumed by the network data plane."],
    ["ingress", "Ingress is an API for HTTP routing that requires an ingress controller to implement it. Gateway API offers more expressive role-oriented traffic APIs."],
    ["cni", "CNI plugins configure Pod network interfaces, addresses, routes, and sometimes NetworkPolicy enforcement when the runtime creates a sandbox."],
    ["networkpolicy", "NetworkPolicy selects Pods and declares allowed ingress or egress. Enforcement depends on a network plugin that supports the policy API."],
    ["configmaps", "A ConfigMap stores non-secret configuration that can be projected into Pods. Applications must define how and whether updated values are reloaded."],
    ["secrets", "A Kubernetes Secret is an API object for sensitive bytes, not automatic encryption or least privilege. Storage, RBAC, projection, rotation, and logging need hardening."],
    ["requests", "A resource request is the amount used for scheduling and relative resource guarantees. Incorrect requests distort placement and autoscaling."],
    ["limits", "A resource limit is enforced at runtime through cgroups. CPU is throttled, while exceeding a hard memory limit can terminate a container."],
    ["persistentvolumes", "A PersistentVolume represents cluster storage capacity; a PVC is a workload's namespaced claim to compatible capacity."],
    ["rbac", "Kubernetes RBAC grants additive API verbs over resources through Roles or ClusterRoles and their bindings."],
    ["securitycontext", "SecurityContext declares runtime identity and kernel restrictions such as non-root users, capabilities, filesystem behavior, and seccomp."],
    ["hpa", "The Horizontal Pod Autoscaler is a feedback controller that calculates desired replicas from metrics and target utilization or values."],
    ["taints", "A taint repels Pods unless they tolerate it. Affinity and topology rules express placement attraction, separation, and spread."],
    ["helm", "Helm renders parameterized charts and records releases. Template power can hide the final API objects, so rendering and schema tests matter."],
    ["gitops", "GitOps uses a pull-based controller to reconcile versioned desired state into clusters and report drift and health."],
    ["crds", "A CustomResourceDefinition adds a new API type. A controller or other consumer must give that stored declarative data behavior."]
  ]
});

function lessonSubtopics(title) {
  return title
    .replace(/\s+—\s+/g, ", ")
    .split(/,\s+|\s+and\s+|\s+versus\s+/i)
    .map((part) => part.trim().replace(/^(and|or)\s+/i, ""))
    .filter((part, index, values) => part && values.indexOf(part) === index);
}

const BEGINNER_TRACK_CONTEXT = {
  "engineering-foundations": ["software engineering work", "Software engineering uses repeatable tools and records to change software safely."],
  "software-design": ["software design", "Software design arranges code, state, and dependencies so correct behavior is clear and future changes remain safe and reasonably small."],
  "computer-science": ["computer science", "Computer science explains how data structures and algorithms use time, memory, and rules to solve problems."],
  "systems-foundations": ["networking and operating systems", "Networking moves messages between programs and machines. An operating system manages processes, memory, files, devices, and protected access to hardware."],
  "lld-machine-coding": ["low-level design and machine coding", "Low-level design assigns behavior and state to small software parts. Machine coding turns that model into a working, tested program under a time limit."],
  "web-platform": ["the web platform", "A browser receives network data and converts that data into an interactive and secure page."],
  javascript: ["JavaScript", "JavaScript is a programming language. A JavaScript engine reads the program and performs its operations."],
  typescript: ["TypeScript", "TypeScript checks information about JavaScript code before the JavaScript program runs."],
  react: ["React", "React converts component data into a user interface. React updates the interface when relevant data changes."],
  nodejs: ["Node.js", "Node.js runs JavaScript outside a browser. It connects JavaScript to files, networks, processes, and operating-system services."],
  python: ["Python", "Python is a programming language. The Python runtime creates objects and performs the operations in a Python program."],
  fastapi: ["FastAPI", "FastAPI receives an HTTP request, validates data, runs application code, and creates an HTTP response."],
  "data-systems": ["data systems", "A data system stores information and returns correct information when programs read or change that information."],
  "api-distributed-systems": ["APIs and distributed systems", "An API defines communication rules. A distributed system coordinates work across processes and computers."],
  "service-architecture-events": ["microservices, domain-driven design, and event-driven systems", "These approaches divide business responsibilities, define ownership, and move changes between components through explicit contracts and events."],
  "quality-security": ["software quality, security, and SaaS operations", "Quality checks expected behavior. Security controls access. SaaS operations move files, events, jobs, and privileged changes through durable and observable workflows."],
  "cloud-aws": ["cloud computing and AWS", "Cloud services provide computing resources through network APIs. AWS groups these resources by account, Region, and service."],
  devops: ["DevOps", "DevOps connects software changes to build, test, release, operation, and feedback activities."],
  docker: ["Docker", "Docker packages a program and its files in an image. A container runtime starts an isolated process from that image."],
  kubernetes: ["Kubernetes", "Kubernetes stores desired state in API objects. Controllers work continuously to make actual state match desired state."],
  "ml-foundations": ["machine learning", "Machine learning uses data and mathematical models to produce predictions or useful representations."],
  "llm-internals": ["large language models", "A large language model processes tokens and estimates a probability for possible next tokens."],
  "ai-application-engineering": ["AI application engineering", "An AI application sends controlled input to a model and checks the model output before the application uses it."],
  "retrieval-rag": ["retrieval and RAG", "A retrieval system finds relevant information. A RAG system gives that information to a language model."],
  agents: ["AI agents", "An agent selects actions in a control loop. The application limits tools, state, cost, and stopping conditions."],
  "ai-quality-safety": ["AI quality and safety", "AI quality tests model behavior with defined examples and measures. Safety controls reduce harmful or unauthorized behavior."],
  "portfolio-capstone": ["production project work", "A production project connects a user need to software, evidence, operation, and a clear technical explanation."],
  "international-interviews": ["international job search and interviews", "A hiring process compares role needs with truthful evidence of your knowledge, decisions, work, and communication."]
};

const BEGINNER_GLOSSARY = {
  "engineering-foundations": {
    "terminal": "A terminal is a text interface that sends commands to a shell and shows the output from programs.",
    "processes": "A process is a running instance of a program. The operating system gives each process memory, resources, and an identifier.",
    "files": "A file is a named sequence of bytes stored by a file system. Programs use paths and file descriptors to access files.",
    "permissions": "Permissions are rules that state which users and processes can read, change, or execute a file or resource.",
    "environment variables": "Environment variables are named text values that a parent process gives to a child process at startup.",
    "signals": "A signal is an operating-system notification that asks a process to handle an event such as termination or interruption.",
    "exit codes": "An exit code is an integer that a process returns when it ends. Zero usually means success, and other values identify failures.",
    "git object model": "The Git object model stores file content, directory trees, commits, and annotated tags as content-addressed objects.",
    "collaborative workflows": "A collaborative workflow defines how people create branches, review changes, resolve conflicts, integrate commits, and release shared work.",
    "dependency management": "Dependency management records the external packages that a project needs and selects compatible package versions.",
    "reproducible environments": "A reproducible environment gives different users the same tools, dependency versions, configuration, and build result from recorded inputs.",
    "debugging as hypothesis testing": "Debugging as hypothesis testing means that you state a possible cause and run a focused test that can disprove it.",
    "technical writing": "Technical writing explains a system, decision, or procedure with precise terms, evidence, and a structure that the reader can follow.",
    "architecture decisions": "An architecture decision records a significant choice, its context, alternatives, consequences, and the evidence that supports it."
  },
  "software-design": {
    "clean code": "Clean code communicates its behavior, intent, state changes, boundaries, and failures clearly enough that another engineer can change it safely. It is not a fixed formatting style or a contest for the fewest lines.",
    "naming": "Naming selects precise, consistent words for domain concepts, operations, units, and state so readers do not need to decode abbreviations or guess intent.",
    "functions": "A well-designed function performs one coherent operation at one abstraction level, makes inputs and outputs visible, and limits hidden state changes.",
    "control flow": "Control flow is the order in which branches, loops, calls, errors, and returns execute. Direct flow makes normal and failure paths easy to trace.",
    "comments": "A useful comment records why a surprising decision, constraint, risk, or workaround exists. It does not repeat what clear code already states.",
    "formatting": "Formatting presents code with consistent spacing and grouping so structure is visible. Automated formatters settle style without replacing design judgment.",
    "local reasoning": "Local reasoning means a reader can understand and change one area from its explicit inputs, state, contracts, and nearby dependencies without loading the whole system into memory.",
    "dry": "DRY means every important piece of knowledge should have one authoritative representation. It does not require combining code that only happens to look similar.",
    "knowledge duplication": "Knowledge duplication occurs when the same business rule or fact has multiple owners that must be updated together to remain correct.",
    "accidental duplication": "Accidental duplication is similar-looking code that represents different concepts or changes for different reasons. Combining it can create harmful coupling.",
    "kiss": "KISS asks for the simplest design that correctly meets current constraints. Simple means fewer ideas and dependencies to understand, not merely shorter syntax.",
    "yagni": "YAGNI means do not build a capability until a current requirement needs it. It prevents paying implementation and maintenance cost for predicted futures.",
    "simplicity": "Simplicity minimizes the concepts, states, dependencies, and exceptional paths required to solve the present problem while preserving correctness and safety.",
    "premature abstraction": "A premature abstraction generalizes code before its true variations are known, forcing unrelated cases through a guessed shared contract.",
    "cohesion": "Cohesion measures how strongly the responsibilities inside a module belong together and change for related reasons. High cohesion gives a module a clear purpose.",
    "coupling": "Coupling is the knowledge or dependency one part has about another. Coupling is necessary, but broad, unstable, or hidden coupling increases change cost.",
    "encapsulation": "Encapsulation places data and the operations that protect its valid state behind a controlled interface.",
    "information hiding": "Information hiding keeps likely-to-change design decisions private so callers depend on a stable contract rather than a volatile implementation.",
    "dependency direction": "Dependency direction states which module imports or knows another. Directing dependencies toward stable policy protects domain rules from framework and vendor changes.",
    "boundaries": "A software boundary separates responsibilities, ownership, trust, or change rates and defines the data and failures allowed to cross.",
    "change cost": "Change cost is the time, risk, coordination, testing, deployment work, and cognitive effort required to modify behavior safely.",
    "single responsibility principle": "The Single Responsibility Principle says a module should be responsible to one actor or cohesive reason to change, not that every function must contain one line.",
    "open-closed principle": "The Open-Closed Principle says a stable unit can support a proven kind of variation through extension without repeatedly modifying its trusted core.",
    "reasons to change": "Reasons to change are independent actors, policies, technologies, or requirements that can evolve on different schedules.",
    "extension points": "An extension point is a deliberate contract where known variation can be added. It earns its cost only when real alternatives exist.",
    "plugin boundaries": "A plugin boundary loads independently implemented behavior through a stable contract while controlling compatibility, authority, lifetime, and failure isolation.",
    "liskov substitution principle": "The Liskov Substitution Principle requires every implementation of a contract to preserve behavior that callers rely on, including valid inputs, results, invariants, and failures.",
    "interface segregation principle": "The Interface Segregation Principle gives each consumer a small capability contract so it does not depend on operations it never uses.",
    "dependency inversion principle": "The Dependency Inversion Principle makes high-level policy own and depend on abstractions while low-level details implement those abstractions.",
    "contracts": "A contract defines accepted inputs, returned outputs, state changes, invariants, failures, timing, and other caller-visible guarantees.",
    "substitutability": "Substitutability means one implementation can replace another without breaking the reasonable expectations encoded in the shared contract.",
    "capability interfaces": "A capability interface describes the smallest operation a consumer needs, such as reading a clock or saving an order, without exposing an entire service.",
    "composition": "Composition builds behavior by assembling smaller objects or functions with explicit roles and lifetimes.",
    "inheritance": "Inheritance lets a subtype reuse or specialize a base type. It also couples the subtype to base behavior and is safe only when the subtype remains substitutable.",
    "delegation": "Delegation forwards a responsibility to another object or function that owns the operation.",
    "polymorphism": "Polymorphism lets callers use one contract while different implementations provide contract-compatible behavior.",
    "data-oriented design": "Data-oriented design organizes explicit data and transformations around access and processing needs instead of requiring behavior to live in object hierarchies.",
    "functional cores": "A functional core contains deterministic rules that transform input into output without hidden I/O, while an imperative shell handles external effects.",
    "design pattern literacy": "Design pattern literacy is the ability to recognize a recurring problem and discuss a named design with its context, forces, consequences, and alternatives.",
    "context": "Pattern context is the situation in which a design problem occurs, including the current structure and constraints.",
    "forces": "Pattern forces are competing requirements or constraints that prevent one solution from being best in every dimension.",
    "intent": "Pattern intent is the specific design problem and purpose that the pattern addresses.",
    "consequences": "Pattern consequences are the benefits, liabilities, new dependencies, runtime behavior, and future changes created by adopting it.",
    "implementation variants": "Implementation variants preserve a pattern's intent while using different language features, object structures, or functional techniques.",
    "anti-patterns": "An anti-pattern is a recurring response that appears useful but commonly creates predictable harm in its context. The label still requires evidence, not taste.",
    "creational patterns": "Creational patterns control how objects are selected, configured, assembled, copied, and given a lifetime when direct construction is no longer sufficient.",
    "factory method": "Factory Method defers selection of a created product to an overridable operation or supplied creator while callers use the product contract.",
    "abstract factory": "Abstract Factory creates a compatible family of related products without exposing their concrete classes to consumers.",
    "builder": "Builder collects and validates construction steps before producing a complete object, especially when valid creation has many optional or ordered inputs.",
    "prototype": "Prototype creates a new object by copying a configured exemplar while defining how identity and nested mutable state are handled.",
    "singleton": "Singleton restricts a type to one process-wide instance and provides global access. It often hides dependencies and shared mutable state, so explicit ownership is usually safer.",
    "dependency injection": "Dependency injection gives an object or function its collaborators from outside instead of constructing or locating them secretly.",
    "structural patterns": "Structural patterns arrange objects and interfaces to adapt contracts, wrap behavior, form hierarchies, control access, separate variation, or share state.",
    "adapter": "Adapter translates one existing interface and data model into the contract a consumer expects.",
    "facade": "Facade exposes a small task-oriented interface over a more complex subsystem without necessarily changing the subsystem's internal contracts.",
    "decorator": "Decorator wraps an object through the same contract to add behavior before or after delegation without changing the wrapped implementation.",
    "composite": "Composite represents individual objects and groups through one part-whole contract so clients can traverse or operate on a tree uniformly.",
    "proxy": "Proxy stands in for another object to control access, location, loading, caching, or lifecycle while preserving its interface.",
    "bridge": "Bridge separates an abstraction from an implementation so two independent variation axes can evolve without a subclass for every combination.",
    "flyweight": "Flyweight shares immutable intrinsic state between many logical objects while callers supply varying extrinsic state separately.",
    "behavioral patterns": "Behavioral patterns make algorithms, requests, transitions, notifications, traversal, coordination, snapshots, or operations explicit.",
    "strategy": "Strategy represents interchangeable algorithms behind one contract and lets a caller or policy select one explicitly.",
    "observer": "Observer lets subscribers receive notifications from a subject and requires clear delivery order, error, reentrancy, and unsubscribe behavior.",
    "command": "Command represents a request as data or an object so it can be queued, logged, authorized, retried, undone, or dispatched separately from its sender.",
    "state": "The State pattern moves behavior that varies by lifecycle state into explicit state-specific transitions or handlers.",
    "chain of responsibility": "Chain of Responsibility passes a request through ordered handlers until one handles it or the chain ends.",
    "template method": "Template Method fixes an algorithm skeleton in a base operation while selected steps are supplied or overridden.",
    "iterator": "Iterator exposes sequential access to a collection without revealing its storage representation.",
    "mediator": "Mediator centralizes a defined interaction between peers so they do not all depend directly on one another.",
    "memento": "Memento captures restorable state without exposing private representation beyond an authorized owner.",
    "visitor": "Visitor adds operations across a stable set of element variants through double dispatch, trading easy new operations for difficult new element types.",
    "code smells": "Code smells are quick signals that may indicate a deeper design problem. A smell starts investigation; it does not prove that code is wrong.",
    "characterization tests": "Characterization tests record the observable behavior of existing code, including surprising behavior, before risky restructuring begins.",
    "refactoring": "Refactoring changes internal code structure through small behavior-preserving steps to make future work safer or cheaper.",
    "seams": "A seam is a place where behavior or a dependency can be changed or controlled without editing the code that uses it.",
    "small steps": "Small refactoring steps keep each transformation easy to review, test, diagnose, and reverse.",
    "behavior preservation": "Behavior preservation means refactoring keeps the externally required outputs, side effects, failures, and contracts unchanged.",
    "review evidence": "Review evidence is the focused test, diff, dependency graph, measurement, or explanation that supports a claim that design improved without breaking behavior.",
    "architecture patterns": "Architecture patterns organize major responsibilities and dependency relationships across an application; their names matter less than enforced boundaries.",
    "layered architecture": "Layered architecture groups technical responsibilities such as presentation, application, domain, and data access with defined dependency rules.",
    "hexagonal architecture": "Hexagonal architecture places application policy inside and connects external actors and infrastructure through owned ports and adapters.",
    "clean architecture": "Clean architecture directs source dependencies inward toward enterprise and application policy while outer frameworks implement boundary interfaces.",
    "vertical slices": "A vertical slice groups the endpoint, use case, validation, and related adapters for one feature so a change stays near its user behavior.",
    "repository": "A repository provides a collection-like domain interface for loading and saving aggregates while hiding persistence queries and mappings.",
    "unit of work": "A unit of work owns one transaction boundary, tracks intended changes, and commits or rolls them back as one consistency decision.",
    "modular monoliths": "A modular monolith deploys as one application but enforces internal module ownership and contracts so features do not share arbitrary state."
  },
  "computer-science": {
    "complexity analysis": "Complexity analysis describes how an algorithm's time or memory use grows when the input size grows.",
    "cost models": "A cost model states which operations the analysis counts and how expensive each operation is in the target system.",
    "arrays": "An array stores ordered elements in indexed positions. Fixed-size arrays place elements in contiguous memory.",
    "strings": "A string represents an ordered sequence of text units. Its indexing behavior depends on the language and character encoding.",
    "hash tables": "A hash table uses a hash function to select storage locations for keys and supports fast average lookup.",
    "stacks": "A stack removes the most recently added item first. Push adds an item, and pop removes the top item.",
    "queues": "A queue removes the earliest added item first. Enqueue adds an item, and dequeue removes the front item.",
    "linked structures": "A linked structure stores elements in separate nodes. Each node contains links to other nodes.",
    "trees": "A tree is a connected hierarchy of nodes with one root and no cycles between parent-child links.",
    "heaps": "A heap is a tree-based structure that keeps the smallest or largest priority at its root.",
    "tries": "A trie stores keys by shared prefixes. Each path from the root represents a sequence of key parts.",
    "graphs": "A graph contains vertices and edges. It represents relationships such as roads, dependencies, or network links.",
    "disjoint sets": "A disjoint-set structure tracks separate groups and efficiently joins groups or finds the group for an item.",
    "recursion": "Recursion occurs when a function solves a problem by calling itself with a smaller or simpler input.",
    "backtracking": "Backtracking builds a candidate solution, abandons an invalid choice, and returns to try another choice.",
    "greedy methods": "A greedy method selects the best local choice at each step without revisiting earlier choices.",
    "dynamic programming": "Dynamic programming stores results for overlapping subproblems and combines them to solve a larger problem.",
    "interview execution": "Interview execution is the repeatable process of clarifying a problem, explaining an approach, writing code, and communicating changes.",
    "verification": "Verification checks that an algorithm gives the required result for normal, boundary, and failure cases.",
    "sorting": "Sorting places values in a defined order so later searching, grouping, merging, or comparison becomes easier.",
    "comparison bounds": "A comparison bound proves how many pairwise comparisons an algorithm needs in the best, average, or worst case.",
    "stability": "A stable sort keeps records with equal keys in their original relative order.",
    "merge sort": "Merge sort recursively sorts two halves and merges them in linear time, using extra storage for a predictable O(n log n) bound.",
    "quicksort": "Quicksort partitions values around a pivot and recursively sorts the partitions; good pivots are fast, while repeated poor pivots can cause quadratic work.",
    "heapsort": "Heapsort builds a heap and repeatedly removes its extreme value, giving O(n log n) time with small auxiliary storage.",
    "counting sort": "Counting sort counts values in a small known integer range and avoids comparison sorting's lower bound by using the values as indexes.",
    "selection": "Selection finds an item of a requested rank, such as the kth smallest, without necessarily sorting every item.",
    "binary search": "Binary search repeatedly discards half of an ordered or monotonic candidate space while preserving a boundary invariant.",
    "boundary invariants": "A boundary invariant states what is known about the kept and discarded sides of a binary-search interval after every step.",
    "lower bound": "Lower bound is the first position where a value is not less than the target.",
    "upper bound": "Upper bound is the first position where a value is greater than the target.",
    "monotonic predicates": "A monotonic predicate changes truth value at most once across the searched order, which lets binary search locate the boundary.",
    "rotated arrays": "A rotated sorted array has two ordered runs separated at a pivot; comparisons identify which run can contain the target.",
    "answer search": "Answer search applies binary search to candidate results when feasibility changes monotonically from false to true or true to false.",
    "array and string patterns": "Array and string patterns reuse index movement or maintained summaries instead of repeating work for every range.",
    "array": "An array stores values in ordered indexed positions and supports direct access by index.",
    "string patterns": "String patterns apply maintained indexes, counts, and ranges to sequences of text units.",
    "two pointers": "Two pointers move two indexes under an invariant to inspect pairs, partitions, or ranges efficiently.",
    "sliding windows": "A sliding window maintains information for one contiguous range while its left and right boundaries move.",
    "prefix sums": "A prefix sum stores the total before each position so any range sum is the difference of two stored totals.",
    "difference arrays": "A difference array records changes at range boundaries and reconstructs final values with one prefix pass.",
    "frequency maps": "A frequency map records how many times each value occurs and supports count-based comparisons and constraints.",
    "intervals": "An interval represents a continuous range with defined endpoint rules; sorting endpoints exposes overlap and gaps.",
    "linked-list patterns": "Linked-list patterns preserve reachability while pointers are redirected, advanced at different speeds, or merged.",
    "sentinel nodes": "A sentinel node is a temporary fixed node that removes special handling for an empty head or first insertion.",
    "fast and slow pointers": "Fast and slow pointers advance at different rates to find a midpoint, cycle, or relative position without extra storage.",
    "fast": "The fast pointer advances more steps per iteration so its position reveals structure relative to another pointer.",
    "slow pointers": "The slow pointer advances at the reference rate and meets or trails the fast pointer under a stated invariant.",
    "reversal": "Linked-list reversal saves the next link before redirecting the current node toward the already reversed prefix.",
    "deques": "A deque supports insertion and removal at both ends, normally in constant time.",
    "monotonic structures": "A monotonic stack or deque removes values that can no longer answer a future query and keeps the remaining values ordered.",
    "tree algorithms": "Tree algorithms process hierarchical nodes through recursive calls or an explicit frontier while preserving parent-child relationships.",
    "depth-first traversal": "Depth-first traversal follows one branch before returning to explore another branch.",
    "breadth-first traversal": "Breadth-first traversal processes nodes by distance from the start using a queue.",
    "binary search trees": "A binary search tree keeps smaller keys on one side and larger keys on the other according to its duplicate policy.",
    "lowest common ancestors": "A lowest common ancestor is the deepest node whose subtree contains both requested nodes.",
    "serialization": "Serialization converts a structure into bytes or text; deserialization must reconstruct the same structure and values.",
    "graph algorithms": "Graph algorithms process vertices and edges to answer reachability, order, path, connection, or component questions.",
    "representations": "A graph representation stores edges as adjacency lists, matrices, or edge lists with different time and memory costs.",
    "bfs": "BFS explores an unweighted graph in distance layers and therefore finds a shortest path by edge count.",
    "dfs": "DFS follows one path before backtracking and supports reachability, cycle, component, and ordering work.",
    "topological sorting": "Topological sorting orders a directed acyclic graph so every dependency appears before the work that depends on it.",
    "shortest paths": "A shortest-path algorithm minimizes a defined path cost; the correct algorithm depends on edge weights and negative cycles.",
    "minimum spanning trees": "A minimum spanning tree connects all vertices in a weighted undirected graph with minimum total edge weight and no cycles.",
    "union-find": "Union-find maintains disjoint components with near-constant amortized union and representative lookup.",
    "decision trees": "A decision tree represents each available choice as a branch and each partial solution as a node.",
    "permutations": "A permutation is an ordering of selected items, so changing position creates a different result.",
    "combinations": "A combination selects items without treating different orders as different results.",
    "subsets": "A subset contains any selection of the input items, including the empty set and the complete set.",
    "constraint propagation": "Constraint propagation applies a choice's consequences immediately so impossible later choices disappear early.",
    "pruning": "Pruning stops exploring a branch after proof that it cannot produce a valid or better result.",
    "branch and bound": "Branch and bound uses an optimistic bound to discard branches that cannot beat the best complete solution found so far.",
    "branch": "A branch is one possible next choice and all partial solutions reachable after taking it.",
    "bound": "A bound estimates the best result a branch could still achieve so provably inferior work can stop.",
    "state": "A dynamic-programming state is the smallest information that uniquely identifies one reusable subproblem.",
    "transitions": "A transition expresses a state's result from already solved neighboring or smaller states.",
    "base cases": "Base cases provide direct results for the smallest states and stop recursive expansion.",
    "memoization": "Memoization caches results when recursive states are first requested.",
    "tabulation": "Tabulation evaluates states iteratively in an order where every dependency is already available.",
    "reconstruction": "Reconstruction follows stored choices or predecessor state to recover the actual solution, not only its score.",
    "space optimization": "Space optimization discards older dynamic-programming states after proving that future transitions cannot need them.",
    "greedy algorithms": "A greedy algorithm makes an irreversible locally preferred choice and is correct only when a proof connects those choices to a global optimum.",
    "exchange arguments": "An exchange argument transforms an optimal solution to include the greedy choice without making that solution worse.",
    "stays-ahead proofs": "A stays-ahead proof shows that after every choice the greedy partial solution is at least as good as any competitor's partial solution.",
    "scheduling": "Scheduling assigns ordered work to limited time or resources while optimizing a stated objective.",
    "counterexamples": "A counterexample is one valid input that disproves a claimed algorithm or proof.",
    "bit manipulation": "Bit manipulation reads or changes individual binary positions with masks and bitwise operators.",
    "binary representation": "Binary representation stores an integer as powers of two under a fixed-width or language-specific numeric model.",
    "masks": "A mask uses selected one bits to test, set, clear, or toggle corresponding positions in another value.",
    "shifts": "A bit shift moves a bit pattern left or right, with signedness and width determining the filled bits and overflow behavior.",
    "xor": "XOR produces one where two input bits differ and can toggle bits or cancel identical paired values.",
    "integer limits": "Integer limits define the representable range and the overflow, truncation, or conversion behavior outside that range.",
    "practical bitsets": "A bitset stores many Boolean membership flags compactly by assigning each flag to one bit."
  },
  "service-architecture-events": {
    "microservices": "Microservices are independently deployable services organized around business capabilities, with explicit network and data ownership boundaries.",
    "modular monoliths": "A modular monolith runs as one deployable application but enforces internal module ownership and contracts.",
    "service boundaries": "A service boundary defines the business responsibility, data, API, team, and changes one service owns.",
    "independent deployment": "Independent deployment means one service can be released without coordinating a lockstep release of every consumer and provider.",
    "team ownership": "Team ownership gives one accountable team authority and operational responsibility for a service through its full lifecycle.",
    "data ownership": "Data ownership means one service is the authority that validates and changes its data; other services use its contract or published events.",
    "distributed costs": "Distributed costs include network latency, partial failure, duplicated data, eventual consistency, deployment coordination, and harder operation.",
    "strategic domain-driven design": "Strategic DDD divides a business problem into models and ownership boundaries before choosing classes or infrastructure.",
    "domains": "A domain is the real business problem area that the software supports.",
    "subdomains": "A subdomain is a smaller business capability inside the wider domain.",
    "core domains": "A core domain is a capability that creates important competitive value and deserves focused design investment.",
    "supporting domains": "A supporting domain is necessary for the business but is not its main competitive difference.",
    "generic domains": "A generic domain solves a common problem that can often use a standard product or service.",
    "ubiquitous language": "A ubiquitous language is the precise shared vocabulary used by domain experts and engineers inside one model boundary.",
    "bounded contexts": "A bounded context is the explicit boundary within which one domain model and its terms have a consistent meaning.",
    "context maps": "A context map records how bounded contexts depend on, translate, or protect themselves from one another.",
    "tactical ddd": "Tactical DDD uses entities, value objects, aggregates, repositories, and services to implement rules inside a bounded context.",
    "tactical domain-driven design": "Tactical domain-driven design uses entities, value objects, aggregates, repositories, and services to implement rules inside a bounded context.",
    "entities": "An entity has a stable identity that continues while its attributes change.",
    "value objects": "A value object is defined by its values, is normally immutable, and compares by content instead of identity.",
    "aggregates": "An aggregate is a consistency boundary containing related entities and value objects changed through one root.",
    "aggregate roots": "An aggregate root is the only public entry point for changes that must preserve an aggregate's invariants.",
    "invariants": "An invariant is a business rule that must be true after every accepted state change.",
    "repositories": "A repository loads and saves aggregates through a domain-facing collection contract while hiding persistence details.",
    "domain services": "A domain service holds a business operation that does not naturally belong to one entity or value object.",
    "application services": "An application service coordinates one use case, transaction, authorization, repositories, and external effects without owning core business rules.",
    "commands": "A command asks an identified owner to perform a state-changing action and can be accepted or rejected.",
    "domain events": "A domain event records a business fact that already occurred inside one bounded context.",
    "integration events": "An integration event is a stable published contract that informs other contexts about a completed change.",
    "transactional outbox": "A transactional outbox stores the business change and an event record in the same local database transaction.",
    "idempotent consumers": "An idempotent consumer records event identity or applies a naturally repeatable operation so redelivery does not duplicate the effect.",
    "eventual consistency": "Eventual consistency allows observers to temporarily see older state while delivery and processing converge under stated conditions.",
    "process managers": "A process manager keeps durable state for a multi-step business process and sends the next command after each event.",
    "event-driven architecture": "Event-driven architecture connects components through durable facts about completed changes rather than direct knowledge of every downstream action.",
    "producers": "A producer creates and publishes a message under a declared schema, key, identity, and delivery policy.",
    "consumers": "A consumer reads messages, validates them, applies local work, records progress, and handles retries and duplicates.",
    "brokers": "A broker stores or routes messages between producers and consumers and applies retention and delivery rules.",
    "publish-subscribe": "Publish-subscribe gives each independent subscription its own delivery or position for a publication.",
    "event notification": "Event notification announces that something changed and expects consumers to obtain any extra state separately.",
    "event-carried state transfer": "Event-carried state transfer includes enough changed state for consumers to update a local view without calling the producer.",
    "choreography": "Choreography lets services react to events without one central coordinator, which reduces central coupling but can hide the overall workflow.",
    "orchestration": "Orchestration uses an explicit coordinator to direct steps and recovery in a multi-service workflow.",
    "kafka architecture": "Kafka is a distributed event log whose brokers store topic partitions and whose clients produce records or consume ordered partition positions.",
    "topics": "A Kafka topic is a named record stream divided into partitions.",
    "partitions": "A partition is an ordered append-only sequence that is the unit of Kafka storage, replication, and consumer-group assignment.",
    "keys": "A Kafka record key commonly selects the partition so related records can keep partition order.",
    "append-only logs": "An append-only log writes new records at increasing positions and does not update earlier records in place.",
    "segments": "Kafka stores a partition as bounded segment files so retention, lookup, and compaction can operate incrementally.",
    "indexes": "Kafka indexes map approximate offsets or timestamps to positions in segment files, then scans locally to the requested record.",
    "retention": "Retention removes old log segments by time or size according to topic policy.",
    "compaction": "Log compaction retains the latest record for each key while preserving record order and tombstone rules.",
    "kafka replication": "Kafka replication keeps partition copies on multiple brokers while one leader handles reads and writes for the partition.",
    "leaders": "A partition leader receives client operations and defines the ordered log that followers copy.",
    "followers": "Followers fetch the leader's records and may become leader after a valid election.",
    "in-sync replicas": "In-sync replicas are copies that meet Kafka's configured lag requirements and may participate in durable acknowledgement and safe election.",
    "acknowledgements": "Producer acknowledgements define how many replication conditions must be met before a send reports success.",
    "min.insync.replicas": "min.insync.replicas is the minimum number of in-sync copies required for writes using all-replica acknowledgement.",
    "controllers": "Kafka controllers coordinate cluster metadata, broker state, and partition leadership.",
    "elections": "A leader election selects a replica to serve a partition after assignment or failure.",
    "failure recovery": "Failure recovery elects leaders, catches replicas up, restarts processing, and verifies durability and consumer progress after faults.",
    "kafka producers": "Kafka producers choose partitions, batch and compress records, retry sends, and report broker acknowledgements.",
    "batching": "Batching groups records into fewer network requests to improve throughput at the cost of bounded waiting and memory.",
    "compression": "Compression reduces network and storage bytes for a record batch while using producer and consumer CPU.",
    "idempotence": "Kafka producer idempotence uses producer identity and sequence numbers to prevent retry duplicates within its supported session guarantees.",
    "transactions": "Kafka transactions atomically publish records and consumed-offset updates across supported Kafka partitions.",
    "consumer groups": "A consumer group divides topic partitions between active members so one member owns a partition at a time within that group.",
    "rebalancing": "Rebalancing changes partition ownership when membership or subscription changes and requires safe pause, handoff, and offset behavior.",
    "offsets": "An offset is a record position in one Kafka partition; a committed offset records where a consumer group plans to resume.",
    "ordering": "Kafka guarantees record order inside one partition, not one global order across all partitions.",
    "event schemas": "An event schema defines field names, types, meaning, optionality, and evolution rules for a published contract.",
    "compatibility": "Schema compatibility states whether old and new producers and consumers can safely exchange evolved records.",
    "schema registries": "A schema registry stores versioned schemas and can enforce compatibility before a producer publishes a new version.",
    "poison events": "A poison event repeatedly fails normal processing because its data, schema, or business state is invalid for the consumer.",
    "retry topics": "Retry topics delay and isolate failed events between bounded attempts instead of blocking a main partition indefinitely.",
    "replay": "Replay starts reading retained events from an earlier offset to rebuild state, recover work, or test changed logic.",
    "observability": "Event observability connects producer, broker record, consumer attempt, offset, lag, result, and retry without exposing sensitive payloads.",
    "testing": "Event-system testing verifies schemas, handlers, duplicates, ordering assumptions, retries, replay, failure recovery, and representative broker integration.",
    "operations": "Event operations manage capacity, partitions, retention, lag, upgrades, failures, security, and safe replay in production."
  },
  "web-platform": {
    "urls": "A URL identifies a resource and includes parts such as the scheme, host, port, path, query, and fragment.",
    "dns": "DNS converts a host name into network records such as IP addresses and caches answers for a limited time.",
    "tcp": "TCP provides an ordered and reliable byte stream between two network endpoints.",
    "tls": "TLS authenticates a server and encrypts data sent between network peers.",
    "http": "HTTP is a request-response protocol that defines methods, headers, status codes, and message bodies.",
    "proxies": "A proxy receives a network request and forwards it to another server while applying routing or policy.",
    "cdns": "A content delivery network serves cached content from locations near users and protects or accelerates origin servers.",
    "html semantics": "HTML semantics use elements according to their meaning so browsers and assistive technologies can understand the document structure.",
    "parsing": "Parsing reads text according to grammar rules and creates structured tokens or nodes.",
    "dom construction": "DOM construction converts parsed HTML tokens into a tree of document nodes that scripts and rendering can use.",
    "accessibility trees": "An accessibility tree exposes relevant names, roles, states, and relationships to assistive technology.",
    "css cascade": "The CSS cascade selects the winning property value from origins, layers, importance, specificity, scope, and source order.",
    "layout": "Layout calculates the size and position of each rendered box.",
    "stacking": "Stacking rules determine which painted elements appear in front of other elements.",
    "painting": "Painting converts styled boxes into drawing operations such as text, backgrounds, borders, and shadows.",
    "compositing": "Compositing combines painted layers into the final pixels shown on the screen.",
    "browser event loop": "The browser event loop selects ready tasks and coordinates script execution, microtasks, rendering, and user input.",
    "tasks": "A task is a scheduled unit of browser work such as a timer callback, event callback, or initial script.",
    "microtasks": "A microtask is high-priority follow-up work that the browser drains after current JavaScript and before the next task.",
    "rendering": "Rendering converts document state and styles into pixels that the user can see.",
    "input": "Browser input is a user or device event such as a click, key press, touch, or pointer movement.",
    "browser security": "Browser security isolates origins and limits how documents, scripts, networks, devices, and stored data can interact.",
    "storage": "Browser storage keeps data on the user's device through mechanisms with different capacity, lifetime, and security rules."
  },
  "quality-security": {
    "test strategy": "A test strategy states which risks need tests, which test layers to use, and which evidence permits release.",
    "boundaries": "A boundary is a point where data, control, trust, or ownership moves between parts of a system.",
    "contracts": "A contract defines valid inputs, outputs, errors, side effects, and guarantees between system parts.",
    "test doubles": "A test double replaces a real collaborator with a controlled substitute such as a stub, fake, spy, or mock.",
    "property-based": "Property-based testing generates many inputs and checks that a general invariant holds for every generated case.",
    "concurrency": "Concurrency means that multiple operations can make progress during overlapping periods and can interact through shared resources.",
    "load": "Load testing applies expected or extreme traffic and measures capacity, latency, errors, and resource use.",
    "chaos": "Chaos testing injects controlled failures to check system resilience and recovery assumptions.",
    "regression testing": "Regression testing reruns stable checks to detect behavior that a later change breaks.",
    "threat modeling": "Threat modeling identifies assets, trust boundaries, possible attackers, attack paths, and suitable controls before implementation.",
    "secure design": "Secure design limits authority, validates untrusted data, isolates failures, and uses safe defaults from the start.",
    "authentication": "Authentication verifies the identity of a user, service, or device.",
    "authorization": "Authorization decides whether an authenticated principal can perform a specified action on a specified resource.",
    "secrets": "Secrets are sensitive values such as passwords, private keys, and tokens that require controlled storage, access, and rotation.",
    "web": "Web security protects browser-facing pages and interactions from attacks across content, origins, sessions, and user input.",
    "api": "API security protects service operations through identity, authorization, validation, limits, safe errors, and monitoring.",
    "dependency": "Dependency security controls risk from external packages, their maintainers, their build process, and their transitive code.",
    "supply-chain security": "Supply-chain security protects source, dependencies, build systems, artifacts, registries, and deployment records from unauthorized change.",
    "reliability targets": "Reliability targets define the acceptable success rate, latency, freshness, or durability for a user-visible service.",
    "observability": "Observability uses system outputs such as metrics, logs, and traces to explain internal behavior.",
    "incidents": "An incident is an unplanned service event that harms users or creates a serious risk.",
    "postmortems": "A postmortem records an incident's impact, timeline, causes, response, and corrective actions without personal blame.",
    "production webhooks": "A production webhook is an authenticated HTTP delivery from one system to another after an event. The receiver must expect delay, duplication, disorder, retries, and version changes.",
    "event contracts": "An event contract defines the event ID, type, version, time, subject, payload schema, and compatibility rules that providers and consumers share.",
    "signatures": "A webhook signature is a cryptographic authenticator calculated over the exact request bytes and trusted context. The consumer recomputes it with a secret and compares it in constant time.",
    "timestamps": "A signed webhook timestamp states when the provider created the delivery. A narrow acceptance window helps reject captured requests that are replayed later.",
    "replay defense": "Replay defense combines a signed timestamp, a freshness limit, and durable event-ID deduplication so an old valid request cannot repeat an effect.",
    "idempotency": "Idempotency makes repeated execution of one logical operation produce no additional unintended effect. A durable unique key usually protects the business state.",
    "retries": "Retries repeat a failed delivery under a bounded schedule. Safe retries need timeouts, exponential backoff, jitter, idempotency, and a final failure destination.",
    "ordering": "Ordering describes which events are observed before others. Independent delivery attempts can complete out of order, so consumers use entity versions or current-state reads when order matters.",
    "secret rotation": "Secret rotation replaces signing credentials without interrupting delivery. A receiver temporarily accepts the active and previous secrets while recording which version verified each request.",
    "application file storage": "Application file storage keeps user-supplied bytes in an object store and stores ownership, state, policy, and display metadata separately in a database.",
    "direct uploads": "A direct upload sends file bytes from the client to object storage using a narrowly scoped temporary grant, so the application server does not relay the large body.",
    "presigned urls": "A presigned URL is a time-limited capability to perform a specific storage request. Anyone holding it can use its allowed operation until expiry, so scope and lifetime must be narrow.",
    "multipart transfer": "Multipart transfer divides a large object into independently retriable parts and completes them as one object. Abandoned part sets require lifecycle cleanup.",
    "validation": "File validation checks declared size and type, actual magic bytes, parser limits, checksums, ownership, and policy before the application trusts or serves content.",
    "malware scanning": "Malware scanning examines quarantined bytes with current detection tools before promotion. A clean result reduces risk but does not replace safe parsing and isolation.",
    "metadata": "File metadata records the stable object key, owner, original display name, media type, size, checksum, state, and retention dates without putting file bytes in normal relational rows.",
    "lifecycle": "A file lifecycle defines pending upload, quarantine, clean or rejected state, versions, retention, archival, expiration, and complete deletion of bytes and metadata.",
    "delivery": "File delivery authorizes every read and returns a short-lived private URL or controlled response with safe content type, disposition, caching, and range behavior.",
    "background jobs": "A background job is durable work executed outside the request that created it. The user-facing request stores intent, while workers process that intent later.",
    "queues": "A queue stores ready work between producers and consumers, absorbs bursts, and exposes lag, delivery, retry, and dead-letter state.",
    "leases": "A lease temporarily assigns a job to one worker until a deadline. If the worker disappears, expiry makes the unacknowledged job available again.",
    "acknowledgements": "An acknowledgement tells the queue that processing completed and the delivery can be removed. A crash before acknowledgement normally causes redelivery.",
    "scheduling": "Job scheduling makes work eligible at a future time while preserving durable identity, cancellation, and behavior after downtime.",
    "dead letters": "A dead-letter store isolates jobs that exhausted attempts or cannot succeed, preserving error context for inspection, repair, replay, or deliberate discard.",
    "worker shutdown": "Worker shutdown stops claiming new jobs, gives in-flight work a deadline to finish, and safely releases or lets leases expire before the process exits.",
    "audit logs": "An audit log is structured security evidence about an attempted important action. It records who did what to which target, when, from where, and with what outcome.",
    "actors": "An audit actor is the authenticated human, service, or delegated identity that attempted an action, including impersonator and effective user when both exist.",
    "actions": "An audit action is a stable machine-readable operation name such as user.disable, not only a free-form sentence.",
    "targets": "An audit target identifies the resource type and stable identifier affected or inspected by an action.",
    "outcomes": "An audit outcome records whether an attempt was allowed, denied, failed, or partially completed; denied attempts are important evidence too.",
    "correlation": "Correlation links audit events with the request, trace, job, approval, or provider event that caused them so an investigation can reconstruct one chain of work.",
    "tamper evidence": "Tamper evidence makes unauthorized changes detectable through append-only controls, hash links, signatures, or separately controlled immutable copies. It is not the same as making tampering impossible.",
    "retention": "Retention policy defines how long evidence remains searchable or archived, when it is deleted, and which legal, security, privacy, and cost rules govern that time.",
    "privacy": "Audit privacy minimizes or redacts secrets and personal data, restricts readers, logs access to evidence, and applies approved retention and deletion rules.",
    "investigation": "An investigation uses filtered, time-ordered, correlated evidence to answer which identity attempted which changes and what system state resulted.",
    "admin systems": "An admin system is a privileged control plane for support and operations. It needs stronger authorization, confirmation, evidence, and failure containment than ordinary product UI.",
    "privileged workflows": "A privileged workflow changes sensitive data or authority through explicit states such as draft, previewed, approved, applied, rejected, and rolled back.",
    "rbac": "Role-based access control assigns narrow permissions to job roles. The server still checks each action and resource scope and denies access by default.",
    "impersonation": "Impersonation lets an authorized operator view or act in a user's context while preserving the operator identity, reason, visible banner, time limit, restrictions, and audit trail.",
    "approvals": "Approvals require a separate authorized person or policy decision before a high-impact operation can execute, with the exact proposed change bound to the decision.",
    "bulk operations": "A bulk operation applies one intent to many targets. Preview, bounded batches, per-item outcomes, rate limits, cancellation, and rollback contain large mistakes.",
    "safety rails": "Safety rails are enforced limits such as protected targets, dry run, exact confirmation, step-up authentication, change caps, dual approval, and reversible execution.",
    "observability": "Admin observability exposes privileged-action volume, denials, failures, latency, unusual targets, impersonation, bulk impact, alerts, and correlated audit evidence."
  },
  "ml-foundations": {
    "vectors": "A vector is an ordered list of numbers that can represent a point, direction, feature set, or model state.",
    "matrices": "A matrix is a rectangular table of numbers that can transform vectors or store related values.",
    "similarity": "Similarity is a numerical measure of how close two representations are under a selected rule.",
    "projections": "A projection maps data onto a selected direction or lower-dimensional space.",
    "probability": "Probability assigns a value from zero to one to represent uncertainty about an event.",
    "optimization": "Optimization searches for parameter values that reduce or increase a defined objective.",
    "gradients": "A gradient contains the rate and direction of objective change for each parameter.",
    "loss functions": "A loss function converts prediction error into a number that training tries to reduce.",
    "regularization": "Regularization adds constraints or penalties that reduce overfitting and limit model complexity.",
    "generalization": "Generalization is a model's ability to perform well on relevant examples that it did not see during training.",
    "data splits": "Data splits separate examples into training, validation, and test sets with distinct purposes.",
    "leakage": "Data leakage occurs when training uses information that would not be available for a real future prediction.",
    "imbalance": "Class imbalance occurs when some outcomes have far fewer examples than other outcomes.",
    "metrics": "A metric is a defined numerical measure of model behavior for a dataset or data slice.",
    "experiment design": "Experiment design defines the hypothesis, controlled variables, data, baseline, metric, and decision rule before evaluation.",
    "classical ml": "Classical machine learning includes statistical models and algorithms such as regression, trees, nearest neighbors, and clustering.",
    "embeddings": "An embedding is a learned numeric vector that represents an item so useful relationships become measurable.",
    "clustering": "Clustering groups examples by similarity without using a target label for each example.",
    "ranking": "Ranking orders candidate items by an estimated relevance or utility score.",
    "recommendation intuition": "Recommendation intuition explains how user, item, context, and feedback signals can predict useful items."
  },
  "llm-internals": {
    "tokenization": "Tokenization converts text or other input into token identifiers that a model can process.",
    "vocabulary": "A model vocabulary is the fixed set of token units that its tokenizer can produce.",
    "embeddings": "Token embeddings convert token identifiers into learned vectors that the model can transform.",
    "positional information": "Positional information lets the model distinguish token order and relative or absolute positions.",
    "context windows": "A context window is the maximum token region that a model can use for one request or generation step.",
    "attention": "Attention computes weighted combinations of token representations based on learned query, key, and value relationships.",
    "transformer blocks": "A transformer block applies attention, feed-forward transformations, normalization, and residual connections in repeated layers.",
    "residual streams": "A residual stream carries the evolving token representation through model layers while each sublayer adds an update.",
    "normalization": "Normalization rescales activations to keep model computation stable and trainable.",
    "feed-forward layers": "A feed-forward layer applies learned nonlinear transformations independently to each token position.",
    "pretraining": "Pretraining learns broad statistical patterns from a large dataset before task-specific adaptation.",
    "next-token prediction": "Next-token prediction trains a model to estimate the next token from earlier tokens.",
    "fine-tuning": "Fine-tuning continues model training on a smaller dataset for a task, domain, or behavior.",
    "instruction tuning": "Instruction tuning trains a model on instructions and desired responses so it follows user tasks more reliably.",
    "preference optimization": "Preference optimization adjusts model behavior using comparisons or scores that represent preferred responses.",
    "decoding": "Decoding selects output tokens from the probability distribution that the model produces.",
    "temperature": "Temperature rescales token logits before sampling. Higher values usually produce a flatter and less predictable distribution.",
    "top-p": "Top-p sampling limits selection to the smallest token set whose cumulative probability reaches a threshold.",
    "determinism": "Determinism means that the same controlled inputs and system state produce the same output.",
    "caching": "Model caching reuses prior computation or prior responses to reduce repeated latency and cost.",
    "batching": "Batching processes multiple model inputs together to use hardware more efficiently.",
    "quantization": "Quantization stores or computes model values with lower numerical precision to reduce memory or increase speed.",
    "hallucination": "A hallucination is model output that states unsupported or incorrect information as if it were reliable.",
    "calibration": "Calibration measures whether confidence values correspond to actual correctness rates.",
    "long-context limits": "Long-context limits are quality, attention, memory, and cost problems that appear as context size increases.",
    "reasoning claims": "Reasoning claims are statements about a model's internal reasoning ability that require behavioral evidence and careful limits.",
    "failure analysis": "Failure analysis groups incorrect model behavior by cause, data slice, symptom, and corrective action."
  },
  "ai-application-engineering": {
    "ai frontend streaming": "AI frontend streaming displays typed output events while generation is still running. The frontend must parse a protocol, update state incrementally, and handle cancellation and partial failure.",
    "fetch streams": "A fetch response stream is a ReadableStream of byte chunks. Chunk boundaries follow network buffering and are not application-message boundaries.",
    "sse": "Server-Sent Events is a text event format over an HTTP response. Blank lines separate events, data may span lines, and an event ID can support reconnection.",
    "event framing": "Event framing defines how arbitrary transport bytes are buffered and separated into complete typed messages before parsing.",
    "incremental state": "Incremental state applies ordered stream events to a current UI state without rebuilding or overwriting already confirmed information incorrectly.",
    "cancellation": "Cancellation propagates a user stop or disconnected request through the browser, application server, model call, tools, and persistence path.",
    "reconnection": "Reconnection creates a new transport after interruption and asks for events after the last durably applied sequence rather than starting the operation twice.",
    "backpressure": "Backpressure prevents a fast producer from creating unbounded buffered data when the network or consumer processes output more slowly.",
    "generative ui": "Generative UI renders typed model and tool events as controlled application components instead of treating arbitrary generated text as executable interface code.",
    "structured message parts": "Structured message parts represent text, citations, data, tool calls, status, and errors as a tagged union that the renderer handles exhaustively.",
    "tool calls": "A frontend tool call is a displayed proposal or state update for a named server-controlled operation. Rendering or approval does not itself grant execution authority.",
    "optimistic state": "Optimistic state immediately shows an expected result before server confirmation, then reconciles, replaces, or rolls it back when canonical server state arrives.",
    "errors": "AI frontend errors are typed failures from transport, parsing, model, tool, authorization, or persistence layers and need recoverable user-visible states.",
    "accessibility": "AI frontend accessibility preserves keyboard operation, focus, readable status, reduced motion, contrast, and restrained live-region announcements during rapid updates.",
    "conversation persistence": "Conversation persistence stores canonical messages and stream events so authorized users can reload, continue, delete, and investigate a chat across processes and devices.",
    "message identity": "Message identity is a stable server-recognized ID that distinguishes user intent and assistant output across retries, replay, and concurrent browser tabs.",
    "server authority": "Server authority means the server authenticates ownership, validates stored or submitted parts, assigns canonical state, and authorizes effects instead of trusting client claims.",
    "resumable streams": "A resumable stream stores ordered events and lets a client continue after its last applied event ID without duplicating earlier output or starting a second generation.",
    "authentication": "AI frontend authentication proves which user owns a conversation before every message, resume, tool decision, read, export, or delete operation.",
    "privacy": "AI frontend privacy minimizes collected prompts and outputs, limits access and retention, redacts telemetry, protects browser storage, and gives users clear deletion controls.",
    "testing": "AI frontend testing checks deterministic protocol parsing and UI states under split chunks, duplicate events, errors, cancellation, reconnection, races, and accessibility tools.",
    "evaluation": "AI frontend evaluation measures the complete user experience, including task success, correctness, interaction recovery, time to useful output, tool completion, and accessibility.",
    "model apis": "A model API is a network contract for sending model inputs and receiving generated outputs or events.",
    "messages": "Messages are ordered role-labeled content units that form the conversational input to a model.",
    "instructions": "Instructions state the task, rules, priorities, and output requirements that the model should follow.",
    "multimodal inputs": "Multimodal inputs combine data types such as text, images, audio, or video in one model request.",
    "streaming": "Streaming sends partial model output as it becomes available instead of waiting for the complete response.",
    "provider abstraction": "A provider abstraction gives application code one internal interface for multiple model service contracts.",
    "prompt design": "Prompt design creates clear instructions, context, examples, and output rules for a model task.",
    "context engineering": "Context engineering selects, orders, limits, and labels all information that enters a model request.",
    "examples": "Prompt examples show the model representative inputs and desired outputs.",
    "delimiters": "Delimiters mark boundaries between instructions, data, examples, and untrusted content.",
    "prompt versioning": "Prompt versioning gives each prompt change a stable identity that can link to evaluations and releases.",
    "structured outputs": "Structured outputs require model output to follow a machine-readable shape such as a JSON schema.",
    "schemas": "A schema defines allowed fields, types, required values, and structural constraints for data.",
    "parsing": "Parsing converts model output text or bytes into a structured value according to grammar rules.",
    "validation": "Validation checks whether a parsed value follows the required schema and domain rules.",
    "repair": "Repair handles invalid output through a bounded correction step, a retry, or a deterministic fallback.",
    "tool calling": "Tool calling lets a model request a named application function with structured arguments.",
    "execution boundaries": "Execution boundaries separate model suggestions from code that has authority to perform real actions.",
    "permissions": "Permissions define which actions a tool or principal can perform on specified resources.",
    "human approval": "Human approval requires a person to review and authorize a sensitive action before execution.",
    "latency": "Latency is the elapsed time between starting a request and receiving a specified result.",
    "cost": "Cost is the measurable resource or financial expense of model input, output, storage, and supporting services.",
    "caching": "Caching stores a reusable result so the application can avoid repeated model work.",
    "fallbacks": "A fallback is a defined alternative path used when the preferred model or operation is unavailable or unsuitable.",
    "rate limits": "Rate limits restrict request frequency, token volume, or concurrency during a time interval.",
    "model routing": "Model routing selects a model or provider according to task needs, quality, latency, availability, and cost."
  },
  "retrieval-rag": {
    "vector database data model": "A vector database data model stores a stable point ID, one or more numeric vectors, searchable metadata or payload, and versioned relationships to the source content.",
    "embeddings": "Embeddings are numeric vectors created by a particular model. Vectors from incompatible models, dimensions, or preprocessing rules do not share a reliable space.",
    "dimensions": "Dimensions are the number of numeric coordinates in each vector. An index normally requires a fixed dimension and rejects a different-sized vector.",
    "distance metrics": "A distance metric defines how vectors are compared. Cosine, inner product, and Euclidean distance express different geometry and require matching normalization and index configuration.",
    "upserts": "An upsert inserts a point when its ID is absent or replaces the current point version when that ID already exists.",
    "deletes": "A vector delete makes a point unavailable to queries and later reclaims its storage through maintenance; distributed replicas may observe the change under stated consistency rules.",
    "query execution": "Vector query execution validates the query, plans filters, obtains candidates from exact or approximate search, computes distances, keeps top-k, and fetches current payloads.",
    "vector index internals": "Vector index internals are the data structures and search procedures that reduce distance calculations while accepting measurable build, memory, update, or recall costs.",
    "exact search": "Exact search calculates the selected distance to every eligible vector and returns the true top-k for that stored data. It provides the ground truth used to measure approximate recall.",
    "hnsw graphs": "HNSW stores proximity links in multiple graph layers. Search descends from sparse upper layers and explores a bounded candidate set in the dense bottom layer.",
    "ivf lists": "IVF trains centroids, assigns each vector to a nearby inverted list, and searches only a selected number of query-nearest lists called probes.",
    "product quantization": "Product quantization splits vectors into subvectors and stores a short centroid code for each part. Approximate table lookups save memory and compute but add distance error.",
    "recall": "Recall@k is the fraction of exact top-k neighbors that an approximate top-k result returns on representative queries.",
    "memory": "Vector-index memory includes vector bytes, graph links or list entries, quantization codes, payload indexes, working candidate sets, and process overhead.",
    "build cost": "Build cost is the time, CPU, memory, I/O, training, and temporary storage needed to construct or rebuild an index.",
    "vector database storage internals": "Vector database storage internals turn accepted mutations into recoverable vector, payload, ID, and index state while reads and background maintenance continue.",
    "segments": "A segment is a bounded group of vector data, payload data, ID mappings, and indexes that can be searched independently and later merged or rebuilt.",
    "write-ahead logs": "A write-ahead log records ordered changes durably before mutable data structures apply them, allowing recovery to replay acknowledged operations after a crash.",
    "tombstones": "A tombstone marks a deleted point so searches ignore it before background maintenance physically removes its stored entries.",
    "compaction": "Compaction rewrites segments to remove obsolete versions and tombstones, merge small files, and rebuild efficient indexes at the cost of background I/O and write amplification.",
    "filtering plans": "A filtering plan chooses whether metadata constraints run before, during, or after approximate candidate search according to selectivity and index support.",
    "sharding": "Sharding assigns points and queries to partitions by a routing rule so data and load can spread across machines.",
    "replication": "Replication stores shard copies on separate failure domains and defines how many acknowledgements a write or read needs before returning.",
    "recovery": "Vector database recovery replays durable logs or restores snapshots, rejoins replicas, rebuilds indexes if needed, and verifies point versions, deletions, and query results.",
    "information retrieval fundamentals": "Information retrieval finds and orders stored items that can answer a user's information need.",
    "lexical search": "Lexical search matches query words or word forms with terms stored in an index.",
    "dense retrieval": "Dense retrieval compares learned query and document vectors to find semantic similarity.",
    "hybrid search": "Hybrid search combines lexical and dense retrieval signals to use their different strengths.",
    "ingestion": "Ingestion receives source data and moves it through parsing, cleaning, metadata, chunking, and indexing steps.",
    "parsing": "Parsing converts a source format into structured text, fields, and document elements.",
    "cleaning": "Cleaning removes or repairs content that would reduce retrieval quality while preserving important meaning.",
    "metadata": "Metadata is structured information about content, such as its source, owner, date, language, or access policy.",
    "chunking": "Chunking divides content into retrieval units that have useful meaning and manageable size.",
    "indexing": "Indexing builds data structures that let a search system find candidate content efficiently.",
    "query rewriting": "Query rewriting changes or expands a user query to improve retrieval while preserving the user's information need.",
    "filtering": "Filtering removes candidates that fail required metadata, permission, date, or product conditions.",
    "reranking": "Reranking applies a more expensive relevance model to a small candidate set and produces a better order.",
    "context assembly": "Context assembly selects, orders, labels, and limits retrieved content before a model request.",
    "citations": "Citations connect generated statements to exact source locations that a user can inspect.",
    "rag evaluation": "RAG evaluation measures retrieval and answer behavior with representative questions and expected evidence.",
    "golden sets": "A golden set is a reviewed collection of evaluation inputs, expected evidence, and acceptable outcomes.",
    "retrieval metrics": "Retrieval metrics measure whether relevant items appear and where they appear in ranked results.",
    "answer metrics": "Answer metrics measure properties such as correctness, grounding, completeness, relevance, and citation quality.",
    "regression testing": "RAG regression testing compares a new system version with a stable dataset and release thresholds.",
    "advanced retrieval": "Advanced retrieval uses multiple stages, representations, indexes, or query strategies for difficult information needs.",
    "freshness": "Freshness states how current indexed content must be and how quickly source changes must become searchable.",
    "permissions": "Retrieval permissions ensure that a user can receive only content that the user is authorized to access.",
    "operational failure modes": "Operational failure modes are production problems such as stale indexes, missing sources, slow queries, or unavailable dependencies.",
    "portfolio project 2": "Portfolio Project 2 is the curriculum project that demonstrates a complete evaluated retrieval product.",
    "evaluated knowledge product": "An evaluated knowledge product retrieves controlled sources, generates useful output, cites evidence, and reports measured quality."
  },
  agents: {
    "llm system blueprint": "An LLM system blueprint maps input, identity, context assembly, model calls, schemas, tools, state, memory, control flow, output validation, evaluation, telemetry, and operational limits as explicit trust boundaries.",
    "react": "ReAct means reasoning and acting in a bounded loop: the model proposes a tool action, the application executes it under policy, and the observation informs the next model decision until a stop condition is reached.",
    "model context protocol architecture": "Model Context Protocol architecture connects an AI application host to capability servers through one isolated client connection per server and a shared JSON-RPC-based protocol.",
    "hosts": "An MCP host is the user-facing AI application. It creates clients, controls model access and consent, coordinates context, and enforces the product's security policy.",
    "clients": "An MCP client is the host-side endpoint for one server connection. It negotiates capabilities, sends requests, receives notifications, and maintains that session.",
    "servers": "An MCP server exposes bounded context capabilities such as tools, resources, and prompts through local or remote transports. It must validate and authorize every operation.",
    "json-rpc": "JSON-RPC is the envelope format MCP uses for requests, responses, errors, and notifications. Request IDs correlate responses; notifications have no response.",
    "initialization": "MCP initialization is the first request-response exchange where both sides agree on a protocol version, identify themselves, and advertise supported capabilities.",
    "capabilities": "MCP capabilities declare optional protocol features that a client or server supports. A peer must not assume a feature that was not negotiated.",
    "resources": "MCP resources are server-addressed context values identified by URIs. Clients discover or read them, while the host decides whether their content enters model context.",
    "prompts": "MCP prompts are server-provided reusable message templates with declared arguments. They are user-selectable context, not hidden instructions with automatic authority.",
    "lifecycle": "The MCP lifecycle covers connection, initialization, normal requests and notifications, cancellation or progress, and orderly transport shutdown.",
    "mcp transports": "MCP transports carry JSON-RPC messages between a client and server. Standard input/output suits local child processes; Streamable HTTP supports remote requests and optional event streams.",
    "streamable http": "Streamable HTTP is MCP's remote transport using HTTP POST and GET behavior, protocol headers, optional session identity, and SSE streams where supported.",
    "sessions": "An MCP session is server-associated transport state identified by a server-issued opaque ID. The server binds it to the correct principal and never treats it as authentication by itself.",
    "authorization": "MCP authorization protects remote HTTP resources and scopes which principal can use which server capability. The server validates token issuer, audience, expiry, and scopes.",
    "consent": "MCP consent keeps the user informed and in control before exposing data or performing sensitive tool actions; protocol connectivity alone does not imply permission.",
    "testing": "MCP testing checks negotiation, schemas, errors, cancellation, transport disconnects, authorization, hostile inputs, output limits, and duplicate or long-running work.",
    "observability": "MCP observability correlates host request, JSON-RPC ID, server method, tool call, session, authorization decision, timing, result, error, and cancellation without logging secrets.",
    "langchain v1 agents": "LangChain v1 provides a high-level create_agent API that joins a chat model, tools, middleware, message state, and output handling. The returned agent runs on the LangGraph runtime.",
    "models": "Models are provider-backed language-model interfaces that receive messages and return model messages, tool calls, usage data, or errors.",
    "messages": "Messages are typed conversation records with roles and content. Agent state keeps them in order so each model step can see the required history.",
    "tools": "Tools are narrow callable operations with a name, description, input schema, controlled execution, typed errors, and limited output. A model proposal never replaces application authorization.",
    "middleware": "LangChain middleware runs around model or tool steps. It can add logging, retries, fallbacks, limits, guardrails, dynamic tools, or human approval.",
    "structured output": "Structured output asks the agent for data that matches a declared schema. LangChain validates the result and returns it in the agent state instead of requiring fragile text parsing.",
    "streaming": "Streaming exposes model tokens, agent steps, tool activity, or custom updates before the complete run finishes.",
    "tracing": "Tracing records the nested model, tool, and workflow operations with their inputs, outputs, timing, errors, and metadata.",
    "langgraph stategraph": "LangGraph StateGraph is a builder for a directed workflow whose nodes read shared typed state and return state updates.",
    "pydantic state schemas": "A Pydantic state schema gives LangGraph runtime validation for graph input and nested values, with more overhead and narrower validation guarantees than many learners initially expect.",
    "typed state": "Typed state declares the fields that graph nodes may read or update. It makes the workflow contract visible to tools, reviewers, and static checkers.",
    "nodes": "Nodes are functions or subgraphs that perform one bounded operation and return an update instead of mutating hidden shared state.",
    "edges": "Edges connect nodes and determine which operation can run next. Conditional edges and Command values can choose a route from current state.",
    "reducers": "Reducers define how multiple updates to one state field combine, such as replacing a value or appending messages.",
    "interrupts": "An interrupt pauses graph execution, saves state through a checkpointer, exposes a request to the caller, and waits for a later resume value.",
    "durable execution": "Durable execution stores progress outside the worker process so a workflow can resume after waiting, failure, restart, or redeployment.",
    "workflows": "A workflow follows a predefined sequence of steps and branches that application code controls.",
    "agents": "An agent uses model output to select actions while the application controls authority, state, limits, and stopping.",
    "state machines": "A state machine defines allowed states, events, transitions, and terminal outcomes for a process.",
    "planners": "A planner proposes an ordered set of actions that can move the current state toward a goal.",
    "control loops": "A control loop observes state, selects an action, applies the action, checks the result, and decides whether to continue.",
    "tool design": "Tool design creates narrow operations with clear names, schemas, permissions, errors, and idempotency behavior.",
    "descriptions": "Tool descriptions tell the model when a tool is suitable and which result the tool provides.",
    "schemas": "Tool schemas define valid argument names, types, required fields, and structural limits.",
    "state": "Agent state is the durable information that describes current progress, decisions, results, and pending work.",
    "memory": "Agent memory is selected information from earlier work that the system makes available for later decisions.",
    "context management": "Context management selects which instructions, state, history, evidence, and tool results enter each model call.",
    "checkpoints": "A checkpoint stores durable progress so execution can resume after interruption or failure.",
    "retries": "A retry repeats a failed operation under a defined limit and delay policy.",
    "idempotency": "Idempotency ensures that a repeated logical action does not create unintended duplicate effects.",
    "human-in-the-loop": "Human-in-the-loop control pauses automation so a person can review, edit, approve, or reject an action.",
    "recovery": "Recovery restores a valid execution state after a process, dependency, tool, or model failure.",
    "multi-agent patterns": "A multi-agent pattern divides work between multiple model-driven participants with defined roles and communication.",
    "coordination costs": "Coordination costs are the extra latency, tokens, state, errors, and conflict created when participants communicate.",
    "failure containment": "Failure containment limits how far one incorrect action, message, or compromised agent can affect the system.",
    "agent evaluation": "Agent evaluation measures complete trajectories, tool choices, state changes, outcomes, costs, and safety behavior.",
    "traces": "Agent traces are ordered records of model calls, tool requests, tool results, state changes, and decisions.",
    "budgets": "Agent budgets limit resources such as steps, time, tokens, cost, retries, and tool calls.",
    "security": "Agent security restricts tool authority, validates untrusted content, protects secrets, and records sensitive actions.",
    "stopping conditions": "Stopping conditions define when an agent must return success, return failure, request help, or stop because a limit is reached."
  },
  "ai-quality-safety": {
    "llm benchmarking": "LLM benchmarking compares model or application configurations on the same versioned cases, controls, and measures instead of relying on unrelated leaderboard scores or demos.",
    "representative datasets": "A representative dataset contains the important user tasks, normal cases, difficult boundaries, and costly failures in proportions or slices that support the product decision.",
    "repetitions": "Repetitions run the same case more than once to measure variation from non-deterministic model output and changing service latency.",
    "quality metrics": "Quality metrics turn product requirements into defined measurements such as exact correctness, rubric scores, groundedness, tool success, or task completion.",
    "latency": "Benchmark latency measures how long users wait, including useful percentiles and time to first output rather than only an average.",
    "cost": "Benchmark cost records comparable token, request, tool, infrastructure, and review costs for each successful or attempted task.",
    "statistical uncertainty": "Statistical uncertainty describes how much a measured result can change because the dataset is limited or repeated runs vary.",
    "evaluation objectives": "Evaluation objectives state the product behavior, risk, or decision that an evaluation must measure.",
    "datasets": "Evaluation datasets contain representative inputs, relevant context, and reviewed expected behavior.",
    "rubrics": "A rubric defines observable criteria and score meanings for judging an output.",
    "baselines": "A baseline is a stable reference result used to decide whether a new system is better or worse.",
    "slices": "A data slice is a meaningful subset evaluated separately to expose hidden strengths or failures.",
    "deterministic checks": "A deterministic check gives the same result for the same input and is suitable for exact rules.",
    "model graders": "A model grader uses another model call to score or classify output according to a rubric.",
    "human review": "Human review uses trained people to judge examples, resolve ambiguity, and calibrate automated evaluation.",
    "judge calibration": "Judge calibration compares grader decisions with trusted human decisions and measures disagreement or bias.",
    "prompt injection": "Prompt injection is untrusted content that attempts to change model instructions or gain unauthorized control.",
    "data exfiltration": "Data exfiltration is the unauthorized transfer or disclosure of sensitive information.",
    "tool abuse": "Tool abuse occurs when a model or user invokes an authorized tool for an unauthorized or harmful purpose.",
    "untrusted content": "Untrusted content is data that can contain false claims, malicious instructions, unsafe links, or hidden payloads.",
    "ai traces": "AI traces record model input, configuration, output, tool activity, timing, cost, and evaluation identifiers.",
    "quality monitoring": "Quality monitoring tracks production signals that can reveal changes in model usefulness or failure rates.",
    "drift": "Drift is a change in input data, user behavior, sources, labels, or system behavior over time.",
    "feedback": "Feedback is information from users, reviewers, incidents, or measurements that can guide system improvement.",
    "incident response": "AI incident response detects harm, limits impact, preserves evidence, communicates status, and applies corrective actions.",
    "privacy": "Privacy controls how personal or sensitive data is collected, used, stored, shared, and removed.",
    "fairness": "Fairness evaluates whether system behavior creates unjustified differences between relevant groups or cases.",
    "compliance": "Compliance means that the product follows applicable laws, contracts, standards, and internal policies.",
    "model risk": "Model risk is the possibility that model limits, misuse, change, or failure will harm users or the business.",
    "product boundaries": "Product boundaries state which uses the AI system supports and which uses the system must reject or escalate."
  },
  "portfolio-capstone": {
    "product discovery": "Product discovery tests whether a real user problem exists and which outcome is valuable.",
    "users": "Users are the people or systems whose needs, abilities, permissions, and constraints shape the product.",
    "success metrics": "Success metrics are defined measurements that show whether the product creates the intended outcome.",
    "constraints": "Constraints are fixed limits such as time, budget, policy, latency, data, compatibility, or team capacity.",
    "architecture": "Software architecture defines major components, responsibilities, data paths, trust boundaries, and operating decisions.",
    "end-to-end implementation across react": "End-to-end React implementation connects the user interface to real application data, errors, loading, and accessible interaction.",
    "node.js or fastapi": "Node.js or FastAPI provides the server boundary that validates requests, runs application rules, and coordinates dependencies.",
    "data": "The data layer stores product state and enforces important consistency and access rules.",
    "ai": "The AI layer performs a bounded model task with controlled input, output validation, evaluation, and fallback behavior.",
    "quality": "Product quality is the degree to which the complete system meets defined user and engineering requirements.",
    "security": "Product security protects identities, data, operations, dependencies, and infrastructure from unauthorized use.",
    "evaluation": "Product evaluation measures deterministic software behavior and probabilistic AI behavior with suitable methods.",
    "observability": "Product observability connects user outcomes to metrics, logs, traces, evaluations, and deployment versions.",
    "deployment": "Deployment moves a tested artifact and configuration into an environment where users can access it.",
    "operations": "Operations keeps the deployed product reliable through monitoring, response, recovery, capacity, and maintenance.",
    "portfolio narrative": "A portfolio narrative explains the user problem, your ownership, major decisions, evidence, failures, and learning.",
    "demo": "A demo is a prepared and recoverable demonstration of a real user path and one important engineering behavior.",
    "case study": "A case study is a structured written account of the problem, constraints, implementation, evidence, tradeoffs, and result.",
    "architecture defense": "Architecture defense is the ability to justify design choices and adapt them when an interviewer changes a constraint."
  },
  fastapi: {
    "fastapi setup": "FastAPI setup creates a Python environment, installs the server and framework, and defines a command that starts the application.",
    "project anatomy": "Project anatomy is the arrangement of application entry points, routers, schemas, services, data access, configuration, tests, and deployment files.",
    "typing": "Typing uses Python annotations to describe expected values. FastAPI also uses annotations to build runtime request and response contracts.",
    "development workflow": "A development workflow is the repeatable process for editing code, starting the server, running checks, and reviewing generated API documentation.",
    "request lifecycle": "The request lifecycle is the ordered path from accepted network data through routing, validation, dependencies, endpoint work, response sending, and cleanup.",
    "fastapi application configuration": "FastAPI application configuration sets application-wide values such as metadata, documentation URLs, dependencies, exception behavior, and OpenAPI settings.",
    "metadata": "API metadata describes the service with values such as its title, version, summary, contact details, license, and tags.",
    "docs": "FastAPI docs are interactive documentation pages generated from the application's OpenAPI schema.",
    "http methods": "HTTP methods identify the requested operation type. Common methods include GET, POST, PUT, PATCH, and DELETE.",
    "status codes": "An HTTP status code is a three-digit result category that tells the client whether a request succeeded or failed.",
    "semantics": "HTTP semantics are the standard meanings and expected properties of methods, status codes, headers, and message content.",
    "converters": "A converter changes a path or input string into a declared Python type before endpoint code uses it.",
    "enums": "An enum defines a closed set of named values that FastAPI can validate and document.",
    "uuids": "A UUID is a 128-bit identifier with a standard text format. FastAPI can parse a UUID string into a Python UUID object.",
    "dates": "Date and time types define calendar dates, clock times, durations, or instants that Pydantic can parse and serialize.",
    "validation": "Validation checks whether input has the required type, shape, range, format, and domain properties.",
    "aliases": "An alias gives an external request or response field a different name from the related Python attribute.",
    "lists": "A list parameter accepts multiple ordered values and validates each item against one declared item type.",
    "reusable filters": "A reusable filter groups common query fields and validation rules into one type that multiple endpoints can use.",
    "nested models": "A nested model contains another validated model as a field and represents structured data at multiple levels.",
    "unions": "A union states that a value can match one of several declared types or shapes.",
    "validators": "A validator runs custom checks or transformations while Pydantic creates a validated model.",
    "strict boundaries": "A strict boundary rejects unexpected coercion and converts external data into an explicit trusted representation.",
    "forms": "Form data sends named fields with a form media type instead of a JSON request body.",
    "files": "A file upload is binary request content that requires limits, content checks, safe storage, and cleanup.",
    "multipart parsing": "Multipart parsing separates one request body into fields and file parts by using declared boundary markers.",
    "size boundaries": "Size boundaries reject request parts or bodies that exceed defined byte limits.",
    "filtering": "Response filtering removes fields that are not part of the declared response model.",
    "output contracts": "An output contract defines the response fields, types, status, media type, and error forms that clients can depend on.",
    "response classes": "A response class converts application data into an HTTP status, headers, media type, and body bytes.",
    "redirects": "A redirect response gives the client a status code and a Location header for another URL.",
    "validation errors": "A validation error reports that external data did not satisfy the declared request or response rules.",
    "exception handlers": "An exception handler converts selected Python exceptions into controlled HTTP responses and logs.",
    "stable error contracts": "A stable error contract gives clients a documented error shape, code, message, details, and correlation identifier.",
    "response objects": "A Response object gives direct control of the HTTP status, headers, cookies, media type, and body.",
    "state": "Request or application state is a named place for data that belongs to one request or one application process.",
    "disconnects": "A disconnect occurs when the client closes the connection before the application finishes sending or receiving data.",
    "low-level access": "Low-level access exposes raw request, response, ASGI, or connection details that higher-level parameters normally hide.",
    "exceptions": "An exception interrupts normal Python control flow and moves to a matching handler or cleanup boundary.",
    "resource ownership": "Resource ownership states which scope creates, uses, and closes a database session, file, lock, client, or connection.",
    "callable dependencies": "A callable dependency is a function or object that FastAPI calls to produce a value for another dependency or endpoint.",
    "classes": "A dependency class stores configuration or state and uses its constructor or call method as part of dependency resolution.",
    "factories": "A dependency factory creates and returns a configured dependency callable.",
    "router dependencies": "Router dependencies apply shared dependency checks or side effects to every operation included in a router.",
    "overrides": "A dependency override replaces a registered dependency with another callable, usually for tests or controlled application composition.",
    "dependency injection architecture": "Dependency injection architecture separates application code from the construction of databases, clients, policies, and other collaborators.",
    "service boundaries": "A service boundary groups application rules behind an explicit interface and separates them from HTTP and storage details.",
    "domain isolation": "Domain isolation keeps core business rules independent from FastAPI, databases, networks, and other frameworks.",
    "settings": "Settings are typed application configuration values loaded from controlled sources such as environment variables or secret stores.",
    "environment configuration": "Environment configuration supplies values that differ between development, test, staging, and production without changing application code.",
    "secrets": "Secrets are sensitive configuration values that require restricted storage, access, logging, and rotation.",
    "process boundaries": "A process boundary separates memory and lifecycle. Each worker process has its own settings objects, pools, caches, and application state.",
    "startup": "Startup is the application lifecycle phase that validates configuration and creates shared process resources before traffic begins.",
    "shutdown": "Shutdown is the lifecycle phase that stops new work, drains active work, and closes process resources.",
    "shared resources": "Shared resources are clients, pools, models, or caches reused by requests in one application process.",
    "application state": "Application state stores process-scoped objects that lifespan code creates and later closes.",
    "async def": "An async def function returns a coroutine and can suspend with await while other event-loop work proceeds.",
    "def": "A def function runs synchronously from start to return and cannot use await directly.",
    "blocking calls": "A blocking call keeps its current thread busy while it waits and can stop event-loop progress if used on that thread.",
    "timeouts": "A timeout limits how long an operation may wait before the application cancels or abandons that operation.",
    "structured concurrency": "Structured concurrency keeps child tasks inside a parent scope that owns their completion, failure, cancellation, and cleanup.",
    "engines": "A SQLAlchemy engine owns database connection configuration, dialect behavior, and a connection pool.",
    "commit": "Commit asks the database to make all changes in the current transaction durable and visible according to isolation rules.",
    "rollback": "Rollback discards uncommitted database changes and returns the transaction or session to a usable state.",
    "retries": "A retry repeats an operation after a transient failure under a defined attempt, delay, and idempotency policy.",
    "consistency": "Consistency states which data invariants and visibility guarantees must hold before and after an operation.",
    "durable jobs": "A durable job stores work outside the web process so a worker can retry or resume it after failure.",
    "queues": "A queue stores work or messages until a consumer can process them and records delivery progress.",
    "password hashing": "Password hashing converts a password into a slow salted verifier that does not reveal the original password.",
    "bearer tokens": "A bearer token grants authority to any holder who presents it, so transport and storage must protect it.",
    "identity": "Identity is the verified principal represented by a user, service, device, or workload identifier.",
    "authorization": "Authorization checks whether the current principal can perform a specified action on a specified resource.",
    "tenant boundaries": "Tenant boundaries prevent one customer or organization from reading or changing another tenant's data.",
    "object permissions": "Object permissions apply authorization to one specific record or resource, not only to an endpoint category.",
    "cookie sessions": "A cookie session uses a browser cookie to carry or identify authenticated session state.",
    "samesite": "The SameSite cookie attribute controls when a browser sends a cookie with cross-site requests.",
    "secure attributes": "Secure cookie attributes limit transport, script access, cross-site sending, path, domain, and lifetime.",
    "browser clients": "Browser clients enforce origin and cookie rules that do not apply to general HTTP clients.",
    "https redirects": "An HTTPS redirect changes an HTTP request to an encrypted HTTPS URL before application data is exchanged.",
    "origin policy": "An origin policy defines which browser origins can read responses or send credentialed cross-origin requests.",
    "ordering": "Middleware ordering defines which wrapper sees a request first and which wrapper sees a response or error first.",
    "context": "Request context is data associated with the current request, such as a principal, trace, deadline, or correlation identifier.",
    "request ids": "A request ID is a correlation value used to connect logs, errors, traces, and support reports for one request.",
    "api security hardening": "API security hardening adds layered controls for identity, authorization, validation, limits, secrets, safe errors, and monitoring.",
    "rate limits": "Rate limits restrict request count, data volume, or concurrency for a principal or network source.",
    "body limits": "Body limits reject request content that exceeds a permitted byte size before it exhausts memory or processing capacity.",
    "audit logs": "Audit logs record security-relevant actions, principals, resources, results, and times in a protected format.",
    "abuse controls": "Abuse controls detect and limit harmful but technically valid behavior such as enumeration, scraping, or resource exhaustion.",
    "documentation customization": "Documentation customization changes OpenAPI metadata, examples, tags, operation details, or the presentation of generated docs.",
    "examples": "API examples show representative request and response values that help humans and tools understand the contract.",
    "client generation": "Client generation converts an OpenAPI contract into typed request code for another programming language or platform.",
    "external events": "External events are notifications that cross the service boundary through callbacks, webhooks, queues, or streams.",
    "delivery contracts": "A delivery contract defines event identity, schema, authentication, retry, duplicate, ordering, and acknowledgement behavior.",
    "multi-file applications": "A multi-file application separates related routers, schemas, services, and configuration into focused Python modules.",
    "sub-applications": "A sub-application is a separate ASGI application delegated to a path and given its own routes, middleware, and OpenAPI.",
    "mounts": "A mount delegates all traffic below one path prefix to another ASGI application.",
    "root paths": "A root path describes the external URL prefix removed by a trusted proxy before the request reaches the application.",
    "handshake": "A WebSocket handshake is the initial HTTP upgrade exchange that accepts or rejects a long-lived WebSocket connection.",
    "connection management": "Connection management tracks active clients, owns per-connection resources, sends messages, and removes disconnected clients.",
    "backpressure": "Backpressure limits production when a client or downstream consumer cannot receive data quickly enough.",
    "generators": "A generator produces one value at a time and can preserve local state between values.",
    "buffering": "Buffering stores data temporarily before sending or processing it and can increase memory use and response delay.",
    "static files": "Static files are unchanged assets such as images, style sheets, or browser scripts served from a directory.",
    "templates": "Templates combine a document pattern with application data to create an HTML response.",
    "html responses": "An HTML response sends browser-rendered markup with the text/html media type.",
    "graphql integration boundaries": "GraphQL integration boundaries define where GraphQL parsing and execution meet FastAPI identity, dependencies, errors, and operation limits.",
    "dependency overrides": "Dependency overrides replace production collaborators with controlled test collaborators while preserving the endpoint contract.",
    "fixtures": "Test fixtures create known data, dependencies, resources, or cleanup steps for repeatable tests.",
    "deterministic tests": "A deterministic test gives the same result for the same controlled inputs and does not depend on hidden order or timing.",
    "async integration tests": "Async integration tests call the ASGI application from asynchronous test code and exercise real async dependencies.",
    "httpx transports": "An HTTPX transport controls how a test client sends requests, including direct in-process calls to an ASGI application.",
    "real databases": "A real database test uses the same database engine and important features as production instead of an incompatible substitute.",
    "contract tests": "Contract tests verify that an API implementation and its clients agree on requests, responses, errors, and compatibility.",
    "health": "A health signal reports whether a process is running and can perform its basic internal work.",
    "diagnostics": "Diagnostics are logs, metrics, traces, profiles, health data, and state observations used to identify a failure cause.",
    "performance profiling": "Performance profiling measures where request processing spends CPU time, wait time, memory, or allocations.",
    "validation cost": "Validation cost is the CPU time and memory used to parse, check, copy, and serialize typed data.",
    "proxies": "A proxy receives external traffic and forwards it to application workers while applying routing, TLS, headers, or limits.",
    "migrations": "Database migrations apply versioned schema changes in an order that old and new application versions can tolerate.",
    "health checks": "Health checks are automated requests or commands that decide whether a process should start, receive traffic, or restart.",
    "graceful deployment": "A graceful deployment starts healthy new workers, stops new traffic to old workers, drains work, and closes resources.",
    "deprecation": "Deprecation announces that a supported API feature will be removed or changed after a defined transition period.",
    "compatibility": "Compatibility means that existing valid clients continue to work after an API or behavior change.",
    "schema evolution": "Schema evolution changes fields and types over time while managing old data, old clients, and rollout order.",
    "rollout": "A rollout moves a new application version through environments or traffic groups while checks control progression and rollback.",
    "custom request handling": "Custom request handling changes selected routing or endpoint behavior before or after the standard FastAPI handler.",
    "schema hooks": "Schema hooks modify or extend generated OpenAPI or JSON Schema after FastAPI builds the default representation.",
    "framework internals": "Framework internals are the routing, dependency, validation, handler, response, and ASGI layers that implement FastAPI behavior.",
    "fastapi production architecture capstone": "The FastAPI production architecture capstone combines contracts, services, data, jobs, security, tests, observability, and deployment in one design."
  }
};

function beginnerTrackContext(lesson) {
  return BEGINNER_TRACK_CONTEXT[lesson.trackId] || ["software engineering", "A software system receives input, performs operations, and produces an observable result."];
}

function simpleConceptExplanation(term, lesson) {
  const normalized = term.toLowerCase();
  if (lesson.trackId === "api-distributed-systems" && normalized === "safety") {
    return lesson.title.startsWith("HTTP methods")
      ? "HTTP safety means a method is intended only to observe, so automated clients may invoke it without requesting a state change. Incidental logging or accounting can still occur."
      : "Distributed-systems safety means a forbidden outcome never occurs, regardless of timing, retries, failures, or how long the execution continues.";
  }
  const catalog = SIMPLE_CONCEPTS[lesson.trackId] || [];
  const match = catalog.find(([key]) => normalized.includes(key) || key.includes(normalized));
  if (match) return match[1];
  const beginnerDefinition = BEGINNER_GLOSSARY[lesson.trackId]?.[normalized];
  if (beginnerDefinition) return beginnerDefinition;
  if (lesson.trackId === "react") {
    return `${term} is one responsibility inside React's render-and-commit model. Ask what input it reads, whether it participates in rendering or commit, what identity it preserves, and which observable UI change it can cause.`;
  }
  if (lesson.trackId === "javascript") {
    return `${term} is one part of JavaScript's language, execution, object, or host-interaction model. Ask which values and bindings enter, which ECMAScript rule or host boundary acts, what state or control flow changes, and which focused experiment proves the result.`;
  }
  if (lesson.trackId === "typescript") {
    return `${term} is one part of TypeScript's compiler, type relationship, project, or runtime-boundary model. Ask what static information enters, which checker rule acts, what JavaScript remains after erasure, and which diagnostic plus runtime test proves the contract.`;
  }
  if (lesson.trackId === "nodejs") {
    return `${term} is one part of Node's JavaScript host, asynchronous runtime, system boundary, or process lifecycle. Ask which input and handle enter, whether V8, Node, libuv, a worker, or the OS owns progress, what resource state changes, and which runtime evidence proves the result.`;
  }
  if (lesson.trackId === "data-systems") {
    return `${term} is one part of the data model, execution engine, concurrency rules, durability path, or operational boundary. Ask which state and invariant enter, how PostgreSQL or Redis transforms and coordinates them, which failure can violate the assumption, and which query, metric, log, or recovery test proves the result.`;
  }
  if (lesson.trackId === "api-distributed-systems") {
    return `${term} is one part of the public contract, message path, failure-control mechanism, replicated state, or operational guarantee. Ask which caller intent and state enter, which assumptions allow progress, which failure or concurrent history can break the claim, and which trace, state-machine test, load result, or recovery experiment proves it.`;
  }
  if (lesson.trackId === "international-interviews") {
    return `${term} is one part of converting engineering ability into truthful, discoverable, role-relevant evidence and repeatable interview performance. Ask what signal the reviewer needs, which concrete artifact or behavior proves it, how the result will be measured, and which practice or feedback loop improves it.`;
  }
  if (lesson.trackId === "computer-science") {
    return `${term} is one part of representing a problem or reducing its search work. Ask which state it keeps, which invariant makes each transition safe, what input breaks the assumption, and how measured operations confirm the stated time and space cost.`;
  }
  if (lesson.trackId === "systems-foundations") {
    return `${term} is one part of moving data across a network or managing work across an operating-system boundary. Ask which bytes or resource request enter, which protocol or kernel rule acts, what state changes, and which packet, syscall, process, memory, or file evidence proves the result.`;
  }
  if (lesson.trackId === "lld-machine-coding") {
    return `${term} is one part of turning a product rule into an executable object model. Ask which use case needs it, who owns its state, which invariant or contract it protects, and which focused test plus changed requirement proves the design.`;
  }
  if (lesson.trackId === "python") {
    return `${term} is one part of Python's object, execution, or runtime model. Ask which objects and names participate, which protocol or boundary performs the work, what state or resource changes, and which evidence makes the behavior observable.`;
  }
  if (lesson.trackId === "cloud-aws") {
    return `${term} is one AWS or cloud responsibility. Ask which account, identity, Region, network, service, data, quota, cost, and failure boundary owns it, then identify the AWS API evidence that proves the behavior.`;
  }
  if (lesson.trackId === "devops") {
    return `${term} is one part of the delivery and feedback system. Ask which change enters, which automated or human control acts, which artifact or environment changes, and which flow or reliability signal closes the loop.`;
  }
  if (lesson.trackId === "docker") {
    return `${term} is one part of the image, daemon, runtime, or Linux isolation model. Ask which immutable content and runtime configuration enter, which kernel or Docker boundary acts, and which inspectable container state results.`;
  }
  if (lesson.trackId === "kubernetes") {
    return `${term} is one part of Kubernetes' API and reconciliation model. Ask which desired object enters, which control-plane or node component owns the transition, what status changes, and which event or data-plane behavior proves it.`;
  }
  const [field] = beginnerTrackContext(lesson);
  return `${term} is a technical term in ${field}. It names one part of the lesson topic. The detailed flow shows its input, operation, result, and failure evidence.`;
}

function beginnerFoundationMarkup(lesson) {
  const [field, overview] = beginnerTrackContext(lesson);
  return `<section class="card beginner-foundation" data-writing-standard="ASD-STE100-core-principles">
    <span class="section-label">01 · Beginner foundation</span>
    <p>This topic belongs to ${escapeHtml(field)}. ${escapeHtml(overview)}</p>
    <dl class="foundation-grid">
      <div><dt>Input → output</dt><dd>Something starts the operation. The system returns a value, effect, message, or error.</dd></div>
      <div><dt>Boundary and state</dt><dd>A boundary separates system parts. State is information a part keeps or changes.</dd></div>
      <div><dt>Mechanism and evidence</dt><dd>The mechanism does the work. A test, log, trace, or state change shows what happened.</dd></div>
      <div><dt>Failure and tradeoff</dt><dd>A failure mode describes how it can break. A tradeoff is the cost of choosing one solution over another.</dd></div>
    </dl>
  </section>`;
}

function subtopicBreakdownMarkup(lesson) {
  const items = lessonSubtopics(lesson.title);
  return `<section class="concept-section" data-subtopic-count="${items.length}">
    <span class="section-label">04 · Detailed term guide</span>
    <p class="concept-intro"><strong>How they connect:</strong> ${escapeHtml(sentence(lesson.behind_the_scenes))}</p>
    <div class="concept-grid">
      ${items.map((term, index) => `<article class="concept-card" data-subtopic="${escapeHtml(term)}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(term)}</h3>
        <p><strong>What it means:</strong> ${escapeHtml(simpleConceptExplanation(term, lesson))}</p>
      </article>`).join("")}
    </div>
  </section>`;
}

function mechanismWalkthroughMarkup(diagram) {
  return `<section class="card mechanism-walkthrough">
    <span class="section-label">05 · Detailed mechanism</span>
    <div class="walkthrough-grid">
      ${diagram.stages.map((stage) => `<article>
        <span>${escapeHtml(stage.label)}</span>
        <h3>${escapeHtml(stage.name)}</h3>
        <p>${escapeHtml(stage.detail)}</p>
      </article>`).join("")}
    </div>
    <div class="diagnostic-note"><p><strong>Try to break it:</strong> ${escapeHtml(diagram.probe)}</p><p><strong>Then inspect:</strong> ${escapeHtml(diagram.evidence)}</p></div>
  </section>`;
}

function codeReadingGuideMarkup(lesson, diagram) {
  return `<section class="card code-guide">
    <span class="section-label">07 · Code reading guide</span>
    <ol class="steps">
      <li><span>Find the setup and the input that starts the example.</span></li>
      <li><span>Follow the lines that read state, make a decision, or produce an output.</span></li>
      <li><span>Change one input. Predict the result, run the code, and compare.</span></li>
    </ol>
    <p><strong>Expected flow:</strong> ${escapeHtml(diagram.stages.map((stage) => stage.name).join(" → "))}.</p>
  </section>`;
}

function commonMistakesMarkup(diagram, traceSubject) {
  return `<section class="card common-mistakes">
    <span class="section-label">08 · Common mistakes</span>
    <div class="mistake-grid">
      <article><h3>Memorizing the label</h3><p>A definition is not enough. Trace ${escapeHtml(traceSubject)} from input to output.</p></article>
      <article><h3>Testing only success</h3><p>The happy path can hide a weak design. Try this failure: ${escapeHtml(diagram.probe)}</p></article>
      <article><h3>Changing too much</h3><p>Change one condition at a time. Otherwise, you will not know what caused the result.</p></article>
      <article><h3>Guessing</h3><p>Check the system instead: ${escapeHtml(sentence(diagram.evidence))}</p></article>
    </div>
  </section>`;
}

function lessonHtml(lesson, profile) {
  const d = diagramFor(lesson);
  const traceSubject = traceSubjectFor(lesson);
  const codeComment = profile.commentPrefix || (["python", "fastapi", "cloud-aws", "devops", "docker", "kubernetes"].includes(lesson.trackId) ? "#" : "//");
  const options = [
    "Trace mechanisms and verify evidence",
    "Memorize terminology and skip verification",
    "Trust abstractions and ignore failures"
  ];
  const correctIndex = lesson.index % options.length;
  const rotated = options.map((_, index) => options[(index + options.length - correctIndex) % options.length]);
  const actualCorrectIndex = rotated.indexOf(options[0]);
  const lessonJson = JSON.stringify({
    id: lesson.id,
    title: lesson.title,
    correctIndex: actualCorrectIndex,
    evidenceSummary: `${lesson.title}: traced the mechanism, completed the practical lab, and passed retrieval practice.`
  }).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(lesson.number)} · ${escapeHtml(lesson.title)}</title>
  <style>
    :root{--bg:#080b11;--panel:#101722;--panel2:#0c131d;--text:#dbe7f4;--bright:#f7fbff;--muted:#9babc0;--cyan:#79e8ff;--lime:#b6f36b;--amber:#ffd277;--red:#ff918a;--line:#2f3e53;--font:"IBM Plex Mono Nerd Font","IBM Plex Mono",ui-monospace,SFMono-Regular,Consolas,monospace;color-scheme:dark}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.75 var(--font);font-synthesis:none}button,textarea{font:inherit}button:focus-visible,a:focus-visible,textarea:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}main{max-width:940px;margin:0 auto;padding:42px clamp(20px,6vw,68px) 90px}.eyebrow,.section-label{color:var(--cyan);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.eyebrow{display:flex;justify-content:space-between;gap:20px}.eyebrow span:last-child{color:var(--muted)}h1{max-width:850px;margin:22px 0 18px;color:var(--bright);font-size:clamp(28px,5vw,52px);line-height:1.12;letter-spacing:-.045em}h2{margin:0 0 13px;color:var(--bright);font-size:22px;line-height:1.35}.lede{max-width:790px;color:#c3d0df;font-size:17px;line-height:1.8}.outcome{display:grid;grid-template-columns:46px 1fr;gap:16px;align-items:center;margin:34px 0;padding:20px;border:1px solid #426077;border-radius:10px;background:#0d1721}.outcome b{display:grid;width:46px;height:46px;place-items:center;border-radius:8px;background:#102934;color:var(--cyan)}.outcome p{margin:4px 0 0}.grid{display:grid;grid-template-columns:1.05fr .95fr;gap:18px;margin-top:18px}.card{padding:27px;border:1px solid var(--line);border-radius:11px;background:var(--panel);box-shadow:0 18px 48px #0005}.card p{margin:10px 0;color:#bdcada}.analogy{border-left:3px solid var(--amber);padding:12px 16px;background:#17191d;color:#e7edf5!important}.blackboard{background:#0b1918;border-color:#42736d}.blackboard svg{width:100%;height:auto;margin-top:14px}.blackboard text{font:12px var(--font);fill:#c8f5e8}.blackboard .node{fill:#102925;stroke:#68b8aa;stroke-width:1.4}.blackboard .arrow{stroke:#b6f36b;stroke-width:2;marker-end:url(#arrow)}.mechanism-list{margin:10px 0 0;padding-left:22px}.mechanism-list li{margin:10px 0}.concept-section{margin-top:18px;padding:29px;border:1px solid #3b526c;border-radius:11px;background:#0c131d}.concept-intro{max-width:760px;color:var(--muted)}.concept-grid{display:grid;gap:12px;margin-top:20px}.concept-card{position:relative;padding:22px 22px 22px 62px;border:1px solid var(--line);border-radius:9px;background:var(--panel)}.concept-card>span{position:absolute;left:20px;top:22px;color:var(--lime);font-size:12px}.concept-card h3{margin:0 0 10px;color:var(--bright);font-size:18px}.concept-card p{margin:9px 0;color:#c4d0df}.concept-card strong{color:#f2f7fc}.interview-tip{padding:12px;border-left:3px solid var(--amber);background:#17191d}.lab{margin-top:18px}.steps{counter-reset:step;display:grid;gap:10px;padding:0;list-style:none}.steps li{counter-increment:step;display:grid;grid-template-columns:32px 1fr;gap:10px}.steps li:before{content:counter(step);display:grid;width:28px;height:28px;place-items:center;border:1px solid var(--line);border-radius:6px;color:var(--lime);font-size:12px}pre{overflow:auto;margin:18px 0 0;padding:20px;border:1px solid #33455e;border-radius:8px;background:#070a0f;color:#e2ebf5;font:13px/1.75 var(--font);white-space:pre-wrap}.interview{margin-top:18px;border-color:#5b4e35}.interview .section-label{color:var(--amber)}.interview-questions{margin:16px 0;padding-left:24px}.interview-questions li{margin:11px 0;color:#d7dfeb}.answer-frame{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:17px}.answer-frame span{padding:11px 8px;border:1px solid var(--line);border-radius:6px;color:var(--muted);font-size:12px;text-align:center}.mastery{margin-top:18px;border-color:#40566e}.options{display:grid;gap:9px;margin-top:16px}.option{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:center;padding:13px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);cursor:pointer}.option:hover,.option:has(input:checked){border-color:var(--cyan);color:var(--bright)}.option input{position:absolute;opacity:0}.key{display:grid;width:28px;height:27px;place-items:center;border:1px solid var(--line);border-radius:5px;color:var(--cyan);font-size:12px}.actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}.button{padding:11px 15px;border:1px solid #66883f;border-radius:6px;background:#162313;color:var(--lime);cursor:pointer;font-weight:700}.button:hover{background:var(--lime);color:#081006}.button.secondary{border-color:var(--line);background:var(--panel2);color:var(--muted)}.feedback{min-height:24px;margin:0;color:var(--muted);font-size:13px}.feedback.success{color:var(--lime)}.feedback.error{color:var(--red)}textarea{width:100%;min-height:110px;margin-top:12px;padding:14px;border:1px solid var(--line);border-radius:7px;background:#090e15;color:var(--text);resize:vertical}.source{display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap;margin-top:18px;padding:20px;border:1px solid var(--line);border-radius:10px;background:var(--panel2)}.source a{color:var(--cyan)}.source small{color:var(--muted);font-size:12px}@media(max-width:760px){main{padding-top:28px}.grid{grid-template-columns:1fr}.eyebrow{display:block}.eyebrow span{display:block;margin-bottom:6px}.concept-card{padding:18px}.concept-card>span{position:static;display:block;margin-bottom:6px}.answer-frame{grid-template-columns:1fr 1fr}.source{align-items:flex-start;flex-direction:column}}@media print{body{background:#fff;color:#111;font:11pt/1.5 var(--font)}main{max-width:none;padding:0}.card,.outcome,.source,.concept-card{break-inside:avoid;background:#fff;border-color:#777;box-shadow:none}h1,h2,h3,.card p,.analogy,.concept-card p{color:#111!important}.actions{display:none}}
    h1{font-size:clamp(22px,2.8vw,34px)}
    .blackboard{margin:0}.trace-flow{display:grid;gap:22px;margin:18px 0 0;padding:0;list-style:none}.trace-stage{position:relative;display:grid;gap:5px;padding:14px 15px;border:1px solid #42736d;border-radius:8px;background:#102925}.trace-stage>span{color:var(--lime);font-size:11px;font-weight:700;letter-spacing:.07em}.trace-stage>strong{color:#edfff8;font-size:14px;line-height:1.4}.trace-stage>small{color:#a9c9c2;font-size:12px;line-height:1.55}.trace-stage>i{position:absolute;left:50%;bottom:-22px;transform:translateX(-50%);color:var(--lime);font-style:normal;font-size:17px}.trace-proof{margin-top:18px;padding:15px;border:1px dashed #587a73;border-radius:8px;background:#0a1514}.trace-proof span{display:block;color:var(--cyan);font-size:11px;font-weight:700;letter-spacing:.06em}.trace-proof strong{display:block;margin-top:7px;color:#e9f7f3;font-size:13px;line-height:1.55}.trace-proof small{display:block;margin-top:8px;color:#9fbab5;font-size:11px;line-height:1.55}
    .beginner-foundation{margin-top:18px}.beginner-foundation h3,.mechanism-walkthrough h3,.code-guide h3,.common-mistakes h3{color:var(--bright);font-size:16px}.foundation-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}.foundation-grid>div{padding:14px;border:1px solid var(--line);border-radius:8px;background:var(--panel2)}.foundation-grid dt{color:var(--lime);font-weight:700}.foundation-grid dd{margin:5px 0 0;color:#c4d0df}.beginner-order{padding-left:24px}.beginner-order li{margin:8px 0}.language-note{padding:12px;border-left:3px solid var(--cyan);background:#0c1820}.mechanism-walkthrough,.code-guide,.common-mistakes{margin-top:18px}.walkthrough-grid,.mistake-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.walkthrough-grid article,.mistake-grid article{padding:18px;border:1px solid var(--line);border-radius:8px;background:var(--panel2)}.walkthrough-grid article>span{color:var(--lime);font-size:11px;font-weight:700}.diagnostic-note{margin-top:14px;padding:15px;border:1px dashed #587a73;border-radius:8px;background:#0a1514}.detailed-answer{display:grid;gap:8px;margin-top:18px}.detailed-answer p{margin:0;padding:12px;border:1px solid var(--line);border-radius:7px;background:var(--panel2)}@media(max-width:760px){.foundation-grid,.walkthrough-grid,.mistake-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow"><span>${escapeHtml(lesson.trackTitle)} · ${escapeHtml(lesson.tier)}</span><span>lesson ${escapeHtml(lesson.number)} / ${escapeHtml(lesson.total)}</span></div>
    <h1>${escapeHtml(lesson.title)}</h1>
  </header>

  ${beginnerFoundationMarkup(lesson)}

  <div class="grid">
    <section class="card">
      <span class="section-label">02 · Mental model</span>
      <p>${escapeHtml(sentence(lesson.behind_the_scenes))}</p>
      <p class="analogy"><strong>Analogy:</strong> ${escapeHtml(profile.analogy)}</p>
    </section>

    <aside class="card blackboard">
      <span class="section-label">03 · Blackboard system trace</span>
      <h2>Trace ${escapeHtml(traceSubject)}</h2>
      <ol class="trace-flow" data-flow="${escapeHtml(d.key)}" aria-label="${escapeHtml(diagramAriaLabel(d))}">
        ${diagramStagesMarkup(d)}
      </ol>
      <div class="trace-proof">
        <span>↺ TEST THE MODEL</span>
        <strong>${escapeHtml(d.probe)}</strong>
        <small><b>Inspect:</b> ${escapeHtml(d.evidence)}</small>
      </div>
    </aside>
  </div>

  ${subtopicBreakdownMarkup(lesson)}

  ${mechanismWalkthroughMarkup(d)}

  ${dsaApproachMarkup(lesson)}

  <section class="card lab">
    <span class="section-label">06 · Practical lab</span>
    <p>${escapeHtml(sentence(lesson.practical))}</p>
    <ol class="steps">
      <li><span>Predict the state changes and one likely failure.</span></li>
      <li><span>Run the smallest working example and save the result.</span></li>
      <li><span>Change one condition, then run the same check again.</span></li>
      <li><span>Compare the evidence and explain the tradeoff.</span></li>
    </ol>
    <pre aria-label="Starter code"><code>${escapeHtml(profile.code)}

${codeComment} Lesson focus: ${escapeHtml(lesson.title)}
${codeComment} Prediction: ______________________________________________
${codeComment} Observation: _____________________________________________
${codeComment} Revised model: ___________________________________________</code></pre>
  </section>

  ${codeReadingGuideMarkup(lesson, d)}

  ${commonMistakesMarkup(d, traceSubject)}

  <section class="card interview">
    <span class="section-label">09 · Interview rehearsal</span>
    <ol class="interview-questions">
      <li>${escapeHtml(sentence(lesson.interview))}</li>
      <li>Trace ${escapeHtml(traceSubject)} for this lesson from its initiating input through the underlying mechanism to the observable output.</li>
      <li>How would you ${escapeHtml(lesson.practical.replace(/[.!?]$/, "").replace(/^./, character => character.toLowerCase()))}, and which evidence would prove the result?</li>
      <li>Name one realistic failure mode, the first diagnostic signal you would inspect, and the tradeoff in your proposed fix.</li>
    </ol>
    <div class="answer-frame" aria-label="Suggested interview answer structure"><span>1 · define</span><span>2 · trace</span><span>3 · trade off</span><span>4 · verify</span></div>
    <label for="teachback"><strong>Your 90-second teach-back</strong></label>
    <textarea id="teachback" placeholder="Define the boundary. Trace ${escapeHtml(traceSubject)}. Name a failure mode. Explain the evidence you would inspect."></textarea>
  </section>

  <section class="card mastery">
    <span class="section-label">10 · Retrieval practice</span>
    <h2>Which approach best demonstrates mastery of ${escapeHtml(lesson.title)}?</h2>
    <form id="mastery-form">
      <div class="options">
        ${rotated.map((option, index) => `<label class="option"><input type="radio" name="answer" value="${index}"/><span class="key">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option)}</span></label>`).join("")}
      </div>
      <div class="actions"><button class="button" type="submit">run_mastery_check()</button><p class="feedback" id="feedback" aria-live="polite">Choose one answer, then verify it.</p></div>
    </form>
  </section>

  <footer class="source">
    <div><span class="section-label">Primary source</span><br/><a href="${escapeHtml(profile.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(profile.sourceLabel)} ↗</a></div>
    ${lesson.trackId === "react" ? '<a href="../reference/react-deep-dive-map.html" target="_blank">React coverage map ↗</a>' : ""}
    ${lesson.trackId === "software-design" ? '<a href="../reference/software-design-deep-dive-map.html" target="_blank">Software design coverage map ↗</a>' : ""}
    ${lesson.trackId === "systems-foundations" ? '<a href="../reference/systems-foundations-deep-dive-map.html" target="_blank">Systems foundations coverage map ↗</a>' : ""}
    ${lesson.trackId === "lld-machine-coding" ? '<a href="../reference/lld-machine-coding-deep-dive-map.html" target="_blank">LLD and machine coding coverage map ↗</a>' : ""}
    ${lesson.trackId === "javascript" ? '<a href="../reference/javascript-deep-dive-map.html" target="_blank">JavaScript coverage map ↗</a>' : ""}
    ${lesson.trackId === "typescript" ? '<a href="../reference/typescript-deep-dive-map.html" target="_blank">TypeScript coverage map ↗</a>' : ""}
    ${lesson.trackId === "nodejs" ? '<a href="../reference/nodejs-deep-dive-map.html" target="_blank">Node.js coverage map ↗</a>' : ""}
    ${lesson.trackId === "data-systems" ? '<a href="../reference/data-systems-deep-dive-map.html" target="_blank">Data systems coverage map ↗</a>' : ""}
    ${lesson.trackId === "api-distributed-systems" ? '<a href="../reference/api-distributed-systems-deep-dive-map.html" target="_blank">API &amp; distributed systems coverage map ↗</a>' : ""}
    ${lesson.trackId === "service-architecture-events" ? '<a href="../reference/service-architecture-events-deep-dive-map.html" target="_blank">Service architecture and events coverage map ↗</a>' : ""}
    ${lesson.trackId === "fastapi" ? '<a href="../reference/fastapi-deep-dive-map.html" target="_blank">FastAPI coverage map ↗</a>' : ""}
    ${lesson.trackId === "python" ? '<a href="../reference/python-deep-dive-map.html" target="_blank">Python coverage map ↗</a>' : ""}
    ${lesson.trackId === "cloud-aws" ? '<a href="../reference/cloud-aws-deep-dive-map.html" target="_blank">Cloud &amp; AWS coverage map ↗</a>' : ""}
    ${lesson.trackId === "devops" ? '<a href="../reference/devops-deep-dive-map.html" target="_blank">DevOps coverage map ↗</a>' : ""}
    ${lesson.trackId === "docker" ? '<a href="../reference/docker-deep-dive-map.html" target="_blank">Docker coverage map ↗</a>' : ""}
    ${lesson.trackId === "kubernetes" ? '<a href="../reference/kubernetes-deep-dive-map.html" target="_blank">Kubernetes coverage map ↗</a>' : ""}
    ${lesson.trackId === "international-interviews" ? '<a href="../reference/international-interviews-deep-dive-map.html" target="_blank">International interviews coverage map ↗</a>' : ""}
    <div class="actions"><button class="button secondary" id="copy-handoff" type="button">continue_with_codex()</button><button class="button secondary" type="button" onclick="window.print()">print_lesson()</button></div>
    <small class="followup">Follow-up: revisit this mechanism in 48 hours and reproduce the explanation without notes.</small>
  </footer>
</main>
<script>
(() => {
  const lesson = ${lessonJson};
  const feedback = document.querySelector("#feedback");
  const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;

  function messageParent(type, extra = {}) {
    if (window.parent === window) return;
    window.parent.postMessage({ type, version: 1, lessonId: lesson.id, ...extra }, targetOrigin);
  }

  function reportHeight() {
    messageParent("teach:resize", { height: document.documentElement.scrollHeight });
  }

  document.querySelector("#mastery-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = new FormData(event.currentTarget).get("answer");
    if (selected === null) {
      feedback.textContent = "Select an answer before checking.";
      feedback.className = "feedback error";
      return;
    }
    if (Number(selected) !== lesson.correctIndex) {
      feedback.textContent = "Not yet. Return to the mechanism map, then retry.";
      feedback.className = "feedback error";
      reportHeight();
      return;
    }
    feedback.textContent = "Mastered. You connected the mechanism to observable evidence.";
    feedback.className = "feedback success";
    messageParent("teach:mastery", {
      passed: true,
      score: 100,
      completedAt: new Date().toISOString(),
      evidenceSummary: lesson.evidenceSummary
    });
    reportHeight();
  });

  document.querySelector("#copy-handoff").addEventListener("click", async (event) => {
    const teachback = document.querySelector("#teachback").value.trim();
    const prompt = "I studied “" + lesson.title + "” in the Full Stack AI Engineer roadmap. My teach-back: " + (teachback || "I will explain the boundary, mechanism, failure mode, and evidence.") + " Ask me one deeper follow-up question. If my explanation demonstrates mastery, create a concise learning record.";
    try {
      await navigator.clipboard.writeText(prompt);
      event.currentTarget.textContent = "copied ✓";
    } catch {
      window.prompt("Copy this prompt for Codex:", prompt);
    }
  });

  window.addEventListener("load", reportHeight);
  new ResizeObserver(reportHeight).observe(document.body);
})();
</script>
</body>
</html>`;
}

function reactReferenceHtml(reactLessons) {
  const hookNames = ["useState", "useReducer", "useContext", "useRef", "useImperativeHandle", "useEffect", "useLayoutEffect", "useInsertionEffect", "useEffectEvent", "useDebugValue", "useMemo", "useCallback", "useTransition", "useDeferredValue", "useId", "useSyncExternalStore", "use", "useActionState", "useOptimistic", "useFormStatus"];
  const hookRows = hookNames.map((hook) => {
    const lesson = hook === "use"
      ? reactLessons.find((item) => item.title.startsWith("use, promises"))
      : reactLessons.find((item) => item.title.includes(hook) || (hook === "useContext" && item.title.includes("createContext")));
    const href = lesson ? lesson.path.replace("lessons/", "../lessons/") : "#coverage";
    return `<tr><td><code>${hook}</code></td><td><a href="${escapeHtml(href)}">${escapeHtml(lesson?.title || "Covered in the complete sequence")}</a></td></tr>`;
  }).join("");
  const coverage = reactLessons.map((lesson, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><a href="${escapeHtml(lesson.path.replace("lessons/", "../lessons/"))}">${escapeHtml(lesson.title)}</a></li>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>React Complete Deep Dive · Coverage Map</title><style>:root{color-scheme:dark;--bg:#080b11;--panel:#101722;--text:#dbe7f4;--muted:#9babc0;--cyan:#79e8ff;--lime:#b6f36b;--line:#33445a;--font:"IBM Plex Mono Nerd Font","IBM Plex Mono",monospace}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.65 var(--font)}main{max-width:980px;margin:auto;padding:40px 24px 80px}h1{font-size:clamp(28px,5vw,48px);line-height:1.1}h2{margin-top:42px;color:#fff}.lede{max-width:760px;color:var(--muted);font-size:16px}table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:12px;border:1px solid var(--line);text-align:left}th{color:var(--lime)}code,a{color:var(--cyan)}ol{padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px}li{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}li span{color:var(--lime)}@media(max-width:700px){ol{grid-template-columns:1fr}}@media print{body{background:#fff;color:#111}main{max-width:none}table,li{background:#fff}a,code{color:#111}}</style></head><body><main><p>FULL_STACK_AI_ENGINEER / REFERENCE</p><h1>React Complete Deep Dive</h1><p class="lede">A compact map of all ${reactLessons.length} React lessons. Use it to locate every modern hook, runtime boundary, production concern, and interview-practice unit.</p><h2>Complete hook index</h2><table><thead><tr><th>Hook or resource API</th><th>Lesson with an example</th></tr></thead><tbody>${hookRows}</tbody></table><h2 id="coverage">Full coverage sequence</h2><ol>${coverage}</ol></main></body></html>`;
}

function fastApiReferenceHtml(fastApiLessons) {
  const capabilities = [
    ["ASGI and lifecycle", "ASGI scope"],
    ["Routing and HTTP", "Path operations"],
    ["Typed request boundary", "Pydantic request bodies"],
    ["Files and forms", "Forms, files"],
    ["Response contracts", "Response models"],
    ["Error contracts", "HTTPException"],
    ["Dependency graph", "Depends,"],
    ["Resource cleanup", "Yield dependencies"],
    ["Application lifespan", "Lifespan,"],
    ["Concurrency", "async def,"],
    ["Database pools", "Async SQLAlchemy"],
    ["Transactions", "Transactions,"],
    ["Durable work", "BackgroundTasks"],
    ["Authentication", "OAuth2,"],
    ["Authorization", "Security scopes"],
    ["ASGI middleware", "HTTP middleware"],
    ["OpenAPI governance", "OpenAPI schemas"],
    ["Real-time HTTP", "WebSockets,"],
    ["Testing", "TestClient,"],
    ["Deployment", "Containers,"]
  ];
  const rows = capabilities.map(([capability, prefix]) => {
    const lesson = fastApiLessons.find((item) => item.title.startsWith(prefix));
    const href = lesson ? lesson.path.replace("lessons/", "../lessons/") : "#coverage";
    return `<tr><td>${escapeHtml(capability)}</td><td><a href="${escapeHtml(href)}">${escapeHtml(lesson?.title || "Covered in the complete sequence")}</a></td></tr>`;
  }).join("");
  const coverage = fastApiLessons.map((lesson, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><a href="${escapeHtml(lesson.path.replace("lessons/", "../lessons/"))}">${escapeHtml(lesson.title)}</a></li>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>FastAPI Complete Deep Dive · Coverage Map</title><style>:root{color-scheme:dark;--bg:#080b11;--panel:#101722;--text:#dbe7f4;--muted:#9babc0;--cyan:#79e8ff;--lime:#b6f36b;--line:#33445a;--font:"IBM Plex Mono Nerd Font","IBM Plex Mono",monospace}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.65 var(--font)}main{max-width:980px;margin:auto;padding:40px 24px 80px}h1{font-size:clamp(28px,5vw,48px);line-height:1.1}h2{margin-top:42px;color:#fff}.lede{max-width:760px;color:var(--muted);font-size:16px}table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:12px;border:1px solid var(--line);text-align:left}th{color:var(--lime)}code,a{color:var(--cyan)}ol{padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px}li{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}li span{color:var(--lime)}@media(max-width:700px){ol{grid-template-columns:1fr}}@media print{body{background:#fff;color:#111}main{max-width:none}table,li{background:#fff}a,code{color:#111}}</style></head><body><main><p>FULL_STACK_AI_ENGINEER / REFERENCE</p><h1>FastAPI Complete Deep Dive</h1><p class="lede">A compact map of all ${fastApiLessons.length} FastAPI lessons, from the ASGI event contract to production deployment and incident diagnosis.</p><h2>Capability index</h2><table><thead><tr><th>Capability</th><th>Primary lesson</th></tr></thead><tbody>${rows}</tbody></table><h2 id="coverage">Full coverage sequence</h2><ol>${coverage}</ol></main></body></html>`;
}

function pythonReferenceHtml(pythonLessons) {
  const capabilities = [
    ["Runtime and execution", "Python setup"],
    ["Names and objects", "Objects, identity"],
    ["Core collections", "Dictionaries, sets"],
    ["Functions and failures", "Functions, parameters"],
    ["Imports and packages", "Modules, packages"],
    ["Object model", "Data model, special"],
    ["Descriptors", "Attribute lookup"],
    ["Iteration and generators", "Iterables, iterators"],
    ["Typing and protocols", "Generics, type"],
    ["Validation boundaries", "Runtime validation"],
    ["Async concurrency", "Asyncio event loop"],
    ["Structured concurrency", "TaskGroup"],
    ["Threads and GIL", "Threads, the GIL"],
    ["Process parallelism", "Multiprocessing"],
    ["Memory and collection", "Memory management"],
    ["Performance evidence", "Performance, complexity"],
    ["Testing and debugging", "Testing, unittest"],
    ["Build and packaging", "Packaging, pyproject"],
    ["Security", "Python security"],
    ["Production architecture", "Python production architecture capstone"]
  ];
  const rows = capabilities.map(([capability, prefix]) => {
    const lesson = pythonLessons.find((item) => item.title.startsWith(prefix));
    const href = lesson ? lesson.path.replace("lessons/", "../lessons/") : "#coverage";
    return `<tr><td>${escapeHtml(capability)}</td><td><a href="${escapeHtml(href)}">${escapeHtml(lesson?.title || "Covered in the complete sequence")}</a></td></tr>`;
  }).join("");
  const coverage = pythonLessons.map((lesson, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><a href="${escapeHtml(lesson.path.replace("lessons/", "../lessons/"))}">${escapeHtml(lesson.title)}</a></li>`).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Python Complete Deep Dive · Coverage Map</title><style>:root{color-scheme:dark;--bg:#080b11;--panel:#101722;--text:#dbe7f4;--muted:#9babc0;--cyan:#79e8ff;--lime:#b6f36b;--line:#33445a;--font:"IBM Plex Mono Nerd Font","IBM Plex Mono",monospace}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.65 var(--font)}main{max-width:980px;margin:auto;padding:40px 24px 80px}h1{font-size:clamp(28px,5vw,48px);line-height:1.1}h2{margin-top:42px;color:#fff}.lede{max-width:760px;color:var(--muted);font-size:16px}table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:12px;border:1px solid var(--line);text-align:left}th{color:var(--lime)}code,a{color:var(--cyan)}ol{padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px}li{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}li span{color:var(--lime)}@media(max-width:700px){ol{grid-template-columns:1fr}}@media print{body{background:#fff;color:#111}main{max-width:none}table,li{background:#fff}a,code{color:#111}}</style></head><body><main><p>FULL_STACK_AI_ENGINEER / REFERENCE</p><h1>Python Complete Deep Dive</h1><p class="lede">A compact map of all ${pythonLessons.length} Python lessons, from names, objects, and protocols through concurrency, memory, packaging, security, and production architecture.</p><h2>Capability index</h2><table><thead><tr><th>Capability</th><th>Primary lesson</th></tr></thead><tbody>${rows}</tbody></table><h2 id="coverage">Full coverage sequence</h2><ol>${coverage}</ol></main></body></html>`;
}

function infrastructureReferenceHtml(trackLessons, title, summary) {
  const coverage = trackLessons.map((lesson, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><a href="${escapeHtml(lesson.path.replace("lessons/", "../lessons/"))}">${escapeHtml(lesson.title)}</a></li>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)} · Coverage Map</title><style>:root{color-scheme:dark;--bg:#080b11;--panel:#101722;--text:#dbe7f4;--muted:#9babc0;--cyan:#79e8ff;--lime:#b6f36b;--line:#33445a;--font:"IBM Plex Mono Nerd Font","IBM Plex Mono",monospace}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.65 var(--font)}main{max-width:1060px;margin:auto;padding:40px 24px 80px}h1{font-size:clamp(24px,4vw,38px);line-height:1.12}.lede{max-width:820px;color:var(--muted);font-size:16px}a{color:var(--cyan)}ol{padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px}li{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:7px;background:var(--panel)}li span{color:var(--lime)}@media(max-width:700px){ol{grid-template-columns:1fr}}@media print{body{background:#fff;color:#111}main{max-width:none}li{background:#fff}a{color:#111}}</style></head><body><main><p>DEEPSTEP / REFERENCE</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(summary)} This map links all ${trackLessons.length} lessons in their recommended sequence.</p><ol>${coverage}</ol></main></body></html>`;
}

async function removePreviouslyGeneratedLessons() {
  try {
    const previous = JSON.parse(await readFile(join(lessonsDirectory, "manifest.json"), "utf8"));
    for (const lesson of previous.lessons || []) {
      const filename = String(lesson.path || "").replace(/^(?:\.\.\/\.\.\/)?lessons\//, "");
      const target = resolve(lessonsDirectory, filename);
      if (!filename.endsWith(".html") || !target.startsWith(`${lessonsDirectory}/`)) {
        throw new Error(`Refusing to remove unsafe generated path: ${lesson.path}`);
      }
      try {
        await unlink(target);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function generate() {
  const tracks = parseRoadmap(await readFile(roadmapPath, "utf8"));
  const total = tracks.reduce((sum, track) => sum + track.topics.length, 0);
  const manifest = { version: 1, generatedAt: "2026-09-01", source: "roadmap.yaml", totalLessons: total, tracks: [], lessons: [] };
  const seenIds = new Set();
  let index = 0;

  await mkdir(lessonsDirectory, { recursive: true });
  await mkdir(referenceDirectory, { recursive: true });
  await removePreviouslyGeneratedLessons();

  for (const track of tracks) {
    const manifestTrack = { id: track.id, title: track.title, tier: track.tier, goal: track.goal, lessonIds: [] };
    manifest.tracks.push(manifestTrack);

    for (const topic of track.topics) {
      index += 1;
      const slug = slugify(topic.title);
      const id = `${track.id}--${slug}`;
      if (seenIds.has(id)) throw new Error(`Duplicate lesson id: ${id}`);
      seenIds.add(id);

      const number = String(index).padStart(4, "0");
      const filename = `${number}-${slug}.html`;
      const lesson = {
        ...topic,
        id,
        index: index - 1,
        number,
        total: String(total).padStart(4, "0"),
        trackId: track.id,
        trackTitle: track.title,
        tier: track.tier,
        goal: track.goal,
        duration: Math.min(35, 12 + lessonSubtopics(topic.title).length * 3),
        path: `../../lessons/${filename}`
      };
      const profile = teachingProfileFor(lesson, TRACK_PROFILES[track.id]);
      const html = lessonHtml(lesson, profile);
      const revision = createHash("sha256").update(html).digest("hex").slice(0, 12);
      await writeFile(join(lessonsDirectory, filename), html, "utf8");
      manifestTrack.lessonIds.push(id);
      manifest.lessons.push({
        id,
        number,
        title: topic.title,
        trackId: track.id,
        trackTitle: track.title,
        tier: track.tier,
        goal: track.goal,
        behindTheScenes: topic.behind_the_scenes,
        practical: topic.practical,
        interview: topic.interview,
        duration: lesson.duration,
        path: lesson.path,
        revision,
        sourceLabel: profile.sourceLabel,
        sourceUrl: profile.sourceUrl
      });
    }
  }

  await writeFile(join(lessonsDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(
    join(referenceDirectory, "react-deep-dive-map.html"),
    reactReferenceHtml(manifest.lessons.filter((lesson) => lesson.trackId === "react")),
    "utf8"
  );
  await writeFile(
    join(referenceDirectory, "fastapi-deep-dive-map.html"),
    fastApiReferenceHtml(manifest.lessons.filter((lesson) => lesson.trackId === "fastapi")),
    "utf8"
  );
  await writeFile(
    join(referenceDirectory, "python-deep-dive-map.html"),
    pythonReferenceHtml(manifest.lessons.filter((lesson) => lesson.trackId === "python")),
    "utf8"
  );
  const infrastructureReferences = [
    ["software-design", "software-design-deep-dive-map.html", "Software Design, Clean Code, and Patterns", "Software design from readable code and pragmatic DRY, KISS, and YAGNI decisions through cohesion, coupling, SOLID, composition, pattern families, safe refactoring, and application architecture boundaries."],
    ["systems-foundations", "systems-foundations-deep-dive-map.html", "Networking and Operating Systems Foundations", "Networking from application request, addressing, routing, transport, congestion, DNS, TLS, and HTTP through operating-system syscalls, processes, scheduling, synchronization, memory, storage, containers, and observability."],
    ["lld-machine-coding", "lld-machine-coding-deep-dive-map.html", "Low-Level Design and Machine Coding", "Low-level design from requirements, object modeling, relationships, interfaces, patterns, state, concurrency, persistence, and tests through parking-lot and expense-sharing cases and a timed executable capstone."],
    ["javascript", "javascript-deep-dive-map.html", "JavaScript Complete Deep Dive", "JavaScript from specification semantics, values, bindings, objects, modules, and asynchronous execution through memory, engine internals, security, debugging, architecture, and production operation."],
    ["typescript", "typescript-deep-dive-map.html", "TypeScript Complete Deep Dive", "TypeScript from compiler architecture, inference, narrowing, generics, type transformations, variance, modules, and declarations through runtime validation, framework integration, tooling, performance, upgrades, and production architecture."],
    ["nodejs", "nodejs-deep-dive-map.html", "Node.js Complete Deep Dive", "Node.js from V8, libuv, event-loop and binary-stream internals through networking, modules, processes, workers, security, diagnostics, performance, lifecycle, and production service architecture."],
    ["data-systems", "data-systems-deep-dive-map.html", "PostgreSQL, Redis, and Data Systems Complete Deep Dive", "Data systems from relational modeling, SQL execution, MVCC, indexes, storage, WAL, replication, recovery, security, and operations through Redis structures, persistence, clustering, streams, caching, coordination, and production architecture."],
    ["api-distributed-systems", "api-distributed-systems-deep-dive-map.html", "API Design and Distributed Systems Complete Deep Dive", "API and distributed systems from HTTP semantics, resource and schema contracts, evolution, security, real-time delivery, and developer experience through partial failure, clocks, resilience, messaging, replication, consistency, consensus, placement, multi-region operation, system design, and production architecture."],
    ["service-architecture-events", "service-architecture-events-deep-dive-map.html", "Microservices, Domain-Driven Design, and Event-Driven Systems", "Service architecture from modular monolith and microservice boundaries through strategic and tactical domain-driven design, event workflows, Kafka internals, delivery semantics, schemas, observability, testing, and operations."],
    ["cloud-aws", "cloud-aws-deep-dive-map.html", "Cloud and AWS Complete Deep Dive", "Cloud architecture and AWS services from accounts and identity through networking, data, events, operations, AI, cost, and production design."],
    ["devops", "devops-deep-dive-map.html", "DevOps Complete Deep Dive", "Delivery flow from Linux and source control through CI, artifacts, deployment, observability, incidents, security, and platform engineering."],
    ["docker", "docker-deep-dive-map.html", "Docker Complete Deep Dive", "Container mechanics from images and BuildKit through Linux isolation, networking, storage, security, debugging, distribution, and production operation."],
    ["kubernetes", "kubernetes-deep-dive-map.html", "Kubernetes Complete Deep Dive", "Kubernetes from API and reconciliation internals through workloads, networking, storage, security, scaling, debugging, delivery, and cluster operations."],
    ["international-interviews", "international-interviews-deep-dive-map.html", "International Interviews and Relocation Readiness Complete Module", "A practical hiring system from role targeting, resumes, LinkedIn, GitHub, job portals, ethical local automation, and networking through coding, technical, system-design, AI, behavioral, portfolio, relocation, negotiation, and deliberate interview practice."]
  ];
  for (const [trackId, filename, title, summary] of infrastructureReferences) {
    await writeFile(
      join(referenceDirectory, filename),
      infrastructureReferenceHtml(manifest.lessons.filter((lesson) => lesson.trackId === trackId), title, summary),
      "utf8"
    );
  }
  console.log(`Generated ${manifest.lessons.length} lessons across ${manifest.tracks.length} tracks.`);
}

await generate();
