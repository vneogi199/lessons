import { access, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const lessonsDirectory = join(root, "lessons");
const manifest = JSON.parse(await readFile(join(lessonsDirectory, "manifest.json"), "utf8"));
const failures = [];
const traceHeadings = new Set();
const diagramKeys = new Set();
const requiredFragments = [
  'lang="en-US"',
  "Beginner foundation",
  "Mental model",
  "Blackboard",
  "Detailed term guide",
  "Detailed mechanism",
  "Practical lab",
  "Code reading guide",
  "Common mistakes",
  "Interview rehearsal",
  "Retrieval practice",
  "Primary source",
  "ASD-STE100-core-principles",
  "continue_with_codex",
  "teach:mastery"
];
const forbiddenFluff = [
  "Completion evidence",
  "Use this learning order",
  "The prose applies core",
  'class="detailed-answer"',
  "Why it matters:",
  "How the system works:",
  "Small example:",
  "Common beginner error:",
  "How to verify it:",
  "Interview answer:"
];

if (manifest.version !== 1) failures.push("manifest version must be 1");
if (manifest.totalLessons !== manifest.lessons.length) failures.push("manifest lesson total is inconsistent");
if (new Set(manifest.lessons.map((lesson) => lesson.id)).size !== manifest.lessons.length) failures.push("lesson IDs are not unique");
if (new Set(manifest.lessons.map((lesson) => lesson.path)).size !== manifest.lessons.length) failures.push("lesson paths are not unique");

for (const [index, lesson] of manifest.lessons.entries()) {
  const expectedNumber = String(index + 1).padStart(4, "0");
  if (lesson.number !== expectedNumber) failures.push(`${lesson.id}: expected number ${expectedNumber}`);
  if (!manifest.tracks.some((track) => track.id === lesson.trackId && track.lessonIds.includes(lesson.id))) {
    failures.push(`${lesson.id}: missing from its manifest track`);
  }
  if (lesson.duration < 15 || lesson.duration > 35) failures.push(`${lesson.id}: focused beginner duration is outside 15–35 minutes`);

  const relativePath = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const absolutePath = resolve(lessonsDirectory, relativePath);
  if (!absolutePath.startsWith(`${lessonsDirectory}/`)) {
    failures.push(`${lesson.id}: unsafe lesson path`);
    continue;
  }

  try {
    await access(absolutePath);
    const html = await readFile(absolutePath, "utf8");
    const revision = createHash("sha256").update(html).digest("hex").slice(0, 12);
    if (lesson.revision !== revision) failures.push(`${lesson.id}: lesson revision does not match its content`);
    for (const fragment of requiredFragments) {
      if (!html.includes(fragment)) failures.push(`${lesson.id}: missing ${fragment}`);
    }
    for (const fragment of forbiddenFluff) {
      if (html.includes(fragment)) failures.push(`${lesson.id}: still contains repeated lesson fluff: ${fragment}`);
    }
    if (/<span class="section-label">(?:01|02|04|06|07|08|09) · [^<]+<\/span>\s*<h2>/.test(html)) {
      failures.push(`${lesson.id}: contains a redundant generic section heading`);
    }
    if (html.includes("Follow one unit of work") || html.includes("Trace one unit of work")) {
      failures.push(`${lesson.id}: uses the generic unit-of-work trace wording`);
    }
    if (html.includes("It names one part of the lesson topic")) {
      failures.push(`${lesson.id}: contains a generic beginner definition`);
    }
    if (!html.includes("h1{font-size:clamp(22px,2.8vw,34px)}")) {
      failures.push(`${lesson.id}: missing the compact responsive lesson-title size`);
    }
    if (html.includes('class="lede"') || html.includes("This lesson moves from the underlying mechanism")) {
      failures.push(`${lesson.id}: still contains the repeated lesson introduction`);
    }
    const traceHeading = html.match(/<h2>Trace ([^<]+)<\/h2>/)?.[1];
    if (!traceHeading) failures.push(`${lesson.id}: missing a context-specific trace heading`);
    else traceHeadings.add(traceHeading);
    const diagramKey = html.match(/data-flow="([^"]+)"/)?.[1];
    if (!diagramKey) failures.push(`${lesson.id}: missing a topic-aware blackboard flow key`);
    else diagramKeys.add(diagramKey);
    const diagramStageCount = (html.match(/class="trace-stage"/g) || []).length;
    if (diagramStageCount !== 4) {
      failures.push(`${lesson.id}: expected 4 readable blackboard stages, found ${diagramStageCount}`);
    }
    if (!html.includes("↺ TEST THE MODEL") || !html.includes("<b>Inspect:</b>")) {
      failures.push(`${lesson.id}: blackboard is missing its experiment or evidence guidance`);
    }
    if (html.includes("<svg")) failures.push(`${lesson.id}: still contains the old cramped SVG blackboard`);
    const interviewBank = html.match(/<ol class="interview-questions">([\s\S]*?)<\/ol>/)?.[1] || "";
    const interviewQuestionCount = (interviewBank.match(/<li>/g) || []).length;
    if (interviewQuestionCount !== 4) {
      failures.push(`${lesson.id}: expected 4 interview questions, found ${interviewQuestionCount}`);
    }
    if (!html.includes(`"id":"${lesson.id}"`)) failures.push(`${lesson.id}: embedded ID mismatch`);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    if (scripts.length !== 1) failures.push(`${lesson.id}: expected exactly one inline script`);
    else new Function(scripts[0][1]);
  } catch (error) {
    failures.push(`${lesson.id}: ${error.message}`);
  }
}

const htmlFiles = (await readdir(lessonsDirectory)).filter((name) => name.endsWith(".html"));
if (htmlFiles.length !== manifest.totalLessons) {
  failures.push(`lessons directory has ${htmlFiles.length} HTML files; expected ${manifest.totalLessons}`);
}
if (traceHeadings.size < 12) {
  failures.push(`trace language has only ${traceHeadings.size} distinct subjects; expected at least 12`);
}
if (diagramKeys.size < 25) {
  failures.push(`blackboards have only ${diagramKeys.size} distinct mechanism flows; expected at least 25`);
}

const reactLessons = manifest.lessons.filter((lesson) => lesson.trackId === "react");
const requiredReactSurface = [
  "useState", "useReducer", "useContext", "useRef", "useImperativeHandle", "useEffect",
  "useLayoutEffect", "useInsertionEffect", "useEffectEvent", "useDebugValue", "useMemo",
  "useCallback", "useTransition", "useDeferredValue", "useId", "useSyncExternalStore",
  "useActionState", "useOptimistic", "useFormStatus"
];
for (const name of requiredReactSurface) {
  const lesson = reactLessons.find((item) => item.title.includes(name) || (name === "useContext" && item.title.includes("createContext")));
  if (!lesson) {
    failures.push(`React coverage is missing ${name}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
  if (!code.includes(name)) failures.push(`${lesson.id}: starter code is missing ${name}`);
}
const useResourceLesson = reactLessons.find((lesson) => lesson.title.startsWith("use, promises"));
if (!useResourceLesson) failures.push("React coverage is missing the use resource API");
else {
  const filename = useResourceLesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  if (!html.match(/<pre aria-label="Starter code"><code>[\s\S]*?\buse\(promise\)/)) {
    failures.push(`${useResourceLesson.id}: starter code is missing use(promise)`);
  }
}
if (reactLessons.length !== 43) failures.push(`React deep dive has ${reactLessons.length} lessons; expected 43`);

const fastApiLessons = manifest.lessons.filter((lesson) => lesson.trackId === "fastapi");
const requiredFastApiExamples = [
  ["ASGI scope", "async def app"],
  ["Pydantic request bodies", "BaseModel"],
  ["Depends,", "Depends"],
  ["Yield dependencies", "yield"],
  ["Lifespan,", "@asynccontextmanager"],
  ["async def,", "def sync_library"],
  ["Async SQLAlchemy", "create_async_engine"],
  ["Transactions,", "UnitOfWork"],
  ["BackgroundTasks", "Idempotency-Key"],
  ["OAuth2,", "OAuth2PasswordBearer"],
  ["Security scopes", "SecurityScopes"],
  ["Cookie sessions", "set_cookie"],
  ["CORS,", "CORSMiddleware"],
  ["HTTP middleware", "send_with_id"],
  ["API security hardening", "Rate limit exceeded"],
  ["OpenAPI schemas", "custom_openapi"],
  ["OpenAPI callbacks", "app.webhooks"],
  ["APIRouter,", "include_router"],
  ["WebSockets,", "@app.websocket"],
  ["Server-sent events", "StreamingResponse"],
  ["Static files,", "StaticFiles"],
  ["TestClient,", "TestClient"],
  ["Async integration tests", "ASGITransport"],
  ["Structured logging", "tracer.start_as_current_span"],
  ["Performance profiling", "CapacityLimiter"],
  ["Containers,", "FROM python"],
  ["API versioning", "Deprecation"],
  ["Custom APIRoute", "class TimedRoute"],
  ["FastAPI production architecture capstone", "class ProjectService"]
];
for (const [prefix, expectedCode] of requiredFastApiExamples) {
  const lesson = fastApiLessons.find((item) => item.title.startsWith(prefix));
  if (!lesson) {
    failures.push(`FastAPI coverage is missing ${prefix}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
  if (!code.includes(expectedCode)) failures.push(`${lesson.id}: starter code is missing ${expectedCode}`);
}
if (fastApiLessons.length !== 43) failures.push(`FastAPI deep dive has ${fastApiLessons.length} lessons; expected 43`);

const pythonLessons = manifest.lessons.filter((lesson) => lesson.trackId === "python");
const requiredPythonExamples = [
  ["Python setup", "dis.dis"],
  ["Execution model", "inspect.currentframe"],
  ["Objects, identity", "deepcopy"],
  ["Numbers, booleans", "Decimal"],
  ["Strings, Unicode", "unicodedata.normalize"],
  ["Dictionaries, sets", "@dataclass(frozen=True)"],
  ["Functions, parameters", "signature(search)"],
  ["Exceptions, chaining", "ExceptionGroup"],
  ["Modules, packages", "sys.modules"],
  ["Classes, instances", "classmethod"],
  ["Inheritance, composition", ".mro()"],
  ["Data model, special", "NotImplemented"],
  ["Attribute lookup", "class Positive"],
  ["Iterables, iterators", "iter(iterator)"],
  ["Generators, yield", "yield from"],
  ["Decorators, wrappers", "ParamSpec"],
  ["Context managers", "ExitStack"],
  ["Type hints", "Never"],
  ["Generics, type", "Protocol"],
  ["Runtime validation", "parse_command"],
  ["Asyncio event loop", "asyncio.create_task"],
  ["TaskGroup", "asyncio.TaskGroup"],
  ["Threads, the GIL", "ThreadPoolExecutor"],
  ["Multiprocessing", "ProcessPoolExecutor"],
  ["Memory management", "gc.collect"],
  ["Copying, serialization", "pickle.loads"],
  ["Performance, complexity", "cProfile.Profile"],
  ["Testing, unittest", "create_autospec"],
  ["Packaging, pyproject", "[build-system]"],
  ["Dependencies, virtual", "--require-hashes"],
  ["Native extensions", "CDLL"],
  ["Architecture, modules", "ProjectRepository"],
  ["Python security", "is_relative_to"],
  ["Python production architecture capstone", "class ProjectService"]
];
for (const [prefix, expectedCode] of requiredPythonExamples) {
  const lesson = pythonLessons.find((item) => item.title.startsWith(prefix));
  if (!lesson) {
    failures.push(`Python coverage is missing ${prefix}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
  if (!code.includes(expectedCode)) failures.push(`${lesson.id}: starter code is missing ${expectedCode}`);
}
if (pythonLessons.length !== 43) failures.push(`Python deep dive has ${pythonLessons.length} lessons; expected 43`);

const javascriptLessons = manifest.lessons.filter((lesson) => lesson.trackId === "javascript");
const requiredJavaScriptExamples = [
  ["JavaScript setup", "function observe"],
  ["ECMAScript specification", "specification devices"],
  ["Primitive values", "Arguments are always passed by value"],
  ["Numbers,", "addMoney"],
  ["Strings,", "Intl.Segmenter"],
  ["Type coercion", "Symbol.toPrimitive"],
  ["Equality,", "SameValueZero"],
  ["Closures,", "createCounter"],
  ["this binding", ".bind(account"],
  ["Objects,", "Object.defineProperty"],
  ["Classes,", "#entries"],
  ["Iteration protocols", "Symbol.iterator"],
  ["Proxy,", "Proxy.revocable"],
  ["ECMAScript modules", "live read-only views"],
  ["Promises,", "hostileThenable"],
  ["Event loop", "queueMicrotask"],
  ["Promise combinators", "mapBounded"],
  ["AbortController", "AbortSignal.any"],
  ["Explicit resource management", "Symbol.dispose"],
  ["JSON,", "structuredClone"],
  ["Regular expressions", "safeIdentifier"],
  ["ArrayBuffer,", "DataView"],
  ["SharedArrayBuffer", "Atomics.waitAsync"],
  ["Reachability,", "FinalizationRegistry"],
  ["Engine pipeline", "--print-bytecode"],
  ["JavaScript security", "blockedKeys"],
  ["Testing,", "node:test"],
  ["JavaScript production architecture capstone", "createProcessor"]
];
for (const [prefix, expectedCode] of requiredJavaScriptExamples) {
  const lesson = javascriptLessons.find((item) => item.title.startsWith(prefix));
  if (!lesson) {
    failures.push(`JavaScript coverage is missing ${prefix}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
  if (!code.includes(expectedCode)) failures.push(`${lesson.id}: starter code is missing ${expectedCode}`);
}
if (javascriptLessons.length !== 46) failures.push(`JavaScript deep dive has ${javascriptLessons.length} lessons; expected 46`);

const typescriptLessons = manifest.lessons.filter((lesson) => lesson.trackId === "typescript");
const requiredTypeScriptExamples = [
  ["TypeScript setup", "exactOptionalPropertyTypes"],
  ["Compiler pipeline", "ts.createSourceFile"],
  ["TypeScript design goals", "JSON.parse"],
  ["Type annotations", "satisfies Record"],
  ["any,", "input: unknown"],
  ["Assignability", "noUncheckedIndexedAccess"],
  ["Discriminated unions", "assertNever"],
  ["Control-flow analysis", "isCommand"],
  ["Function types", "function get(id: string)"],
  ["Readonly,", "as const satisfies"],
  ["Generics,", "function indexById"],
  ["keyof,", "type Events"],
  ["Conditional types", "infer Item"],
  ["Variance,", "type Producer"],
  ["Nominal techniques", "unique symbol"],
  ["Decorators,", "ClassMethodDecoratorContext"],
  ["Enums,", "parseProjectStatus"],
  ["Module resolution", "--traceResolution"],
  ["Typed library authoring", "npm pack --dry-run"],
  ["JavaScript interop", "@ts-check"],
  ["Runtime validation", "parseCreateProject"],
  ["Async typing", "AsyncGenerator"],
  ["React with TypeScript", "DataTable"],
  ["Node.js with TypeScript", "NodeJS.ProcessEnv"],
  ["Type testing", "@ts-expect-error"],
  ["tsconfig strictness", "noImplicitOverride"],
  ["Project references", "references"],
  ["Compiler API", "getTypeChecker"],
  ["Type-checker performance", "--extendedDiagnostics"],
  ["Safe AI-assisted TypeScript", "strictDiagnostics"],
  ["TypeScript production architecture capstone", "createProjectService"]
];
for (const [prefix, expectedCode] of requiredTypeScriptExamples) {
  const lesson = typescriptLessons.find((item) => item.title.startsWith(prefix));
  if (!lesson) {
    failures.push(`TypeScript coverage is missing ${prefix}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
  if (!code.includes(expectedCode)) failures.push(`${lesson.id}: starter code is missing ${expectedCode}`);
}
if (typescriptLessons.length !== 45) failures.push(`TypeScript deep dive has ${typescriptLessons.length} lessons; expected 45`);

const nodeLessons = manifest.lessons.filter((lesson) => lesson.trackId === "nodejs");
const requiredNodeExamples = [
  ["Node.js setup", "process.versions"],
  ["Node.js architecture", "pbkdf2"],
  ["Event loop phases", "setImmediate"],
  ["process.nextTick", "unsafeLoop"],
  ["libuv worker pool", "monitorEventLoopDelay"],
  ["Callback APIs", "exactlyOnce"],
  ["EventEmitter", "captureRejections"],
  ["async_hooks", "AsyncLocalStorage"],
  ["Timers,", "setInterval"],
  ["Buffer,", "decodeFrame"],
  ["Stream architecture", "pipeline"],
  ["Writable streams", "drain"],
  ["File system", "atomicWrite"],
  ["Paths,", "safePath"],
  ["TCP sockets", "createServer"],
  ["DNS,", "resolve4"],
  ["TLS,", "getPeerCertificate"],
  ["HTTP server", "readJson"],
  ["Fetch,", "AbortSignal.any"],
  ["HTTP/2", "createSecureServer"],
  ["ECMAScript modules", "import.meta.dirname"],
  ["Runtime TypeScript", "erasableSyntaxOnly"],
  ["Packages,", "npm ci"],
  ["Configuration,", "loadConfig"],
  ["Node errors", "DependencyError"],
  ["Process lifecycle", "shutdown"],
  ["child_process", "spawn"],
  ["worker_threads", "new Worker"],
  ["Background jobs", "LocalQueue"],
  ["Node test runner", "node:test"],
  ["Node security", "safeHttpUrl"],
  ["diagnostics_channel", "diagnostics.channel"],
  ["perf_hooks", "monitorEventLoopDelay"],
  ["Memory,", "process.memoryUsage"],
  ["CPU profiles", "--cpu-prof"],
  ["Native addons", "napi_value"],
  ["Node.js production architecture capstone", "createService"]
];
for (const [prefix, expectedCode] of requiredNodeExamples) {
  const lesson = nodeLessons.find((item) => item.title.startsWith(prefix));
  if (!lesson) {
    failures.push(`Node.js coverage is missing ${prefix}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
  if (!code.includes(expectedCode)) failures.push(`${lesson.id}: starter code is missing ${expectedCode}`);
}
if (nodeLessons.length !== 46) failures.push(`Node.js deep dive has ${nodeLessons.length} lessons; expected 46`);

const infrastructureExpectations = {
  "api-distributed-systems": {
    count: 59,
    examples: [
      ["System boundaries", "const capabilities"],
      ["HTTP architecture", "curl --http2"],
      ["Status codes", "application/problem+json"],
      ["Boundary validation", "const allowed"],
      ["Idempotency keys", "idempotency_records"],
      ["ETags", "createHash"],
      ["Pagination", "const cursor = sign"],
      ["Filtering", "UNSUPPORTED_FILTER"],
      ["API versioning", "compatibilityCases"],
      ["HTTP caching", "stale-while-revalidate"],
      ["OpenAPI", "openapi: 3.1.0"],
      ["Protocol Buffers", "service Jobs"],
      ["GraphQL", "maxComplexity"],
      ["Webhooks", "timingSafeEqual"],
      ["SSE", "Last-Event-ID"],
      ["Authentication", "function authorize"],
      ["API gateways", "rateLimit"],
      ["API security", "outboundPolicy"],
      ["API observability", "traceId"],
      ["API testing", "node:test"],
      ["Distributed system model", "new Map"],
      ["Failure models", "faultPlan"],
      ["Physical clocks", "performance.now"],
      ["Logical clocks", "mergeVector"],
      ["Latency distributions", "percentile"],
      ["Timeouts", "AbortSignal.any"],
      ["Retries", "full jitter"],
      ["Overload control", "class Admission"],
      ["Circuit breakers", "half-open"],
      ["Idempotency, deduplication", "commutative"],
      ["Queues, publish-subscribe", "eventId"],
      ["Broker internals", "consumer.records"],
      ["Delivery semantics", "tx.inbox.insertIfAbsent"],
      ["Ordering, partitions", "stableHash"],
      ["Poison messages", "quarantineRecord"],
      ["Transactional outbox", "INSERT INTO outbox"],
      ["Sagas", "orderSaga"],
      ["Distributed transactions", "PREPARING tx-42"],
      ["Single-leader replication", "replicateToMajority"],
      ["Multi-leader replication", "function reconcile"],
      ["Leaderless replication", "quorumWrite"],
      ["Consistency models", "isLinearizable"],
      ["CAP theorem", "simulatePartition"],
      ["Sharding", "function owner"],
      ["Consensus", "onAppendEntries"],
      ["Membership", "fencing_token_seq"],
      ["Service discovery", "leastOutstanding"],
      ["Layer 4 and Layer 7 load balancing", "leastOutstanding"],
      ["Multi-region architecture", "targetRpoSeconds"],
      ["CQRS", "class JobAggregate"],
      ["System design method", "averageConcurrency"],
      ["System design case studies", "shortener"],
      ["Distributed systems production architecture capstone", "gameDay.run"]
    ]
  },
  "service-architecture-events": {
    count: 9,
    examples: [
      ["Microservices", "shouldExtract"],
      ["Strategic domain-driven design", "const contexts"],
      ["Tactical domain-driven design", "class Order"],
      ["Commands", "placeOrder"],
      ["Event-driven architecture", "InMemoryBroker"],
      ["Kafka architecture", "kafka-topics"],
      ["Kafka replication", "min.insync.replicas"],
      ["Kafka producers", "producerConfig"],
      ["Event schemas", "schemaV2"]
    ]
  },
  "data-systems": {
    count: 51,
    examples: [
      ["PostgreSQL setup", "CREATE ROLE app_owner"],
      ["PostgreSQL architecture", "pg_stat_activity"],
      ["Relations, forks", "pg_relation_filepath"],
      ["Constraints, primary", "EXCLUDE USING gist"],
      ["Schema migrations", "NOT VALID"],
      ["Joins, inner", "JOIN LATERAL"],
      ["MVCC, transaction", "txid_current_snapshot"],
      ["Isolation levels", "SQLSTATE 40001"],
      ["Table locks", "SKIP LOCKED"],
      ["B-tree internals", "CREATE INDEX CONCURRENTLY"],
      ["Planner statistics", "CREATE STATISTICS"],
      ["EXPLAIN, ANALYZE", "BUFFERS, WAL"],
      ["VACUUM, autovacuum", "relfrozenxid"],
      ["WAL, LSNs", "pg_current_wal_lsn"],
      ["Physical streaming replication", "pg_stat_replication"],
      ["Logical replication", "CREATE PUBLICATION"],
      ["Backups, pg_dump", "pg_basebackup"],
      ["Authentication, pg_hba", "ENABLE ROW LEVEL SECURITY"],
      ["JSONB indexing", "vector_cosine_ops"],
      ["Redis architecture", "LATENCY DOCTOR"],
      ["RESP, connections", "redis-cli --pipe"],
      ["Redis TTL", "maxmemory-policy"],
      ["Redis atomic commands", "WATCH balance:42"],
      ["Redis RDB", "BGREWRITEAOF"],
      ["Redis replication", "SENTINEL FAILOVER"],
      ["Redis Cluster", "CLUSTER KEYSLOT"],
      ["Redis Streams", "XAUTOCLAIM"],
      ["Cache-aside", "single-flight"],
      ["Distributed locks", "fencing tokens"],
      ["Redis security", "ACL DRYRUN"],
      ["Data systems production architecture capstone", "make load-test"]
    ]
  },
  "cloud-aws": {
    count: 32,
    examples: [
      ["IAM identities", "simulate-principal-policy"],
      ["VPCs, CIDR", "AWS::EC2::VPC"],
      ["S3 buckets", "put-public-access-block"],
      ["ECR, ECS", "FARGATE"],
      ["Lambda execution", "idempotency.claim"],
      ["SQS, SNS", "VisibilityTimeout"],
      ["CloudWatch metrics", "ErrorBudgetBurnRate"],
      ["CloudFormation, CDK", "create-change-set"],
      ["Amazon Bedrock", "bedrock-runtime"]
    ]
  },
  devops: {
    count: 20,
    examples: [
      ["Shell automation", "set -Eeuo pipefail"],
      ["CI pipeline graphs", "upload-artifact"],
      ["Deployment strategies", "release candidate"],
      ["Database delivery", "ALTER TABLE"],
      ["Observability, SLIs", "AvailabilityFastBurn"],
      ["Infrastructure as code", "terraform plan"]
    ]
  },
  docker: {
    count: 20,
    examples: [
      ["BuildKit, multi-stage", "--mount=type=cache"],
      ["CMD, ENTRYPOINT", "ENTRYPOINT"],
      ["Rootless Docker", "--cap-drop"],
      ["Docker networking", "docker network create"],
      ["Docker Compose", "services:"],
      ["Multi-platform images", "docker buildx"]
    ]
  },
  kubernetes: {
    count: 30,
    examples: [
      ["Deployments, ReplicaSets", "kind: Deployment"],
      ["Services, ClusterIP", "endpointslice"],
      ["Kubernetes network model", "kind: NetworkPolicy"],
      ["ServiceAccounts, RBAC", "kind: Role"],
      ["CPU and memory requests", "requests:"],
      ["Horizontal Pod Autoscaler", "kind: HorizontalPodAutoscaler"],
      ["SecurityContext", "seccompProfile"],
      ["Kubernetes debugging", "kubectl debug"]
    ]
  },
  "international-interviews": {
    count: 23,
    examples: [
      ["Role targeting", "const roles"],
      ["Resume architecture", "const bullet"],
      ["LinkedIn profile", "linkedInProfile"],
      ["GitHub profile", "# Profile README"],
      ["Job portals", "const searches"],
      ["Application tracking", "dedupeKey"],
      ["Recruiter screens", "const introduction"],
      ["Coding interview method", "interviewLoop"],
      ["JavaScript and Python coding", "function topK"],
      ["Full-stack technical", "const answer"],
      ["System-design interviews", "const design"],
      ["AI engineering", "const aiClaim"],
      ["Behavioral story bank", "const story"],
      ["Leadership", "conflictReview"],
      ["Portfolio presentations", "verifyDemo"],
      ["Networking", "const outreach"],
      ["Relocation readiness", "officialImmigrationAuthority"],
      ["Mock interview loops", "const scorecard"],
      ["Situational interview questions", "modelAnswers"],
      ["Technical storytelling", "versionFor"],
      ["Influence without authority", "influencePlan"],
      ["Ethical persuasion", "ethicalCheck"],
      ["Salary negotiation", "counter"]
    ]
  }
};
for (const [trackId, expectation] of Object.entries(infrastructureExpectations)) {
  const trackLessons = manifest.lessons.filter((lesson) => lesson.trackId === trackId);
  if (trackLessons.length !== expectation.count) {
    failures.push(`${trackId} deep dive has ${trackLessons.length} lessons; expected ${expectation.count}`);
  }
  for (const [prefix, expectedCode] of expectation.examples) {
    const lesson = trackLessons.find((item) => item.title.startsWith(prefix));
    if (!lesson) {
      failures.push(`${trackId} coverage is missing ${prefix}`);
      continue;
    }
    const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
    const html = await readFile(join(lessonsDirectory, filename), "utf8");
    const code = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1] || "";
    if (!code.includes(expectedCode)) failures.push(`${lesson.id}: starter code is missing ${expectedCode}`);
  }
}

for (const lesson of manifest.lessons) {
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  const hasBreakdown = html.includes("Detailed term guide");
  if (!hasBreakdown) failures.push(`${lesson.id}: detailed beginner subtopic breakdown is missing`);

  const expectedSubtopics = lesson.title
    .replace(/\s+—\s+/g, ", ")
    .split(/,\s+|\s+and\s+|\s+versus\s+/i)
    .map((part) => part.trim().replace(/^(and|or)\s+/i, ""))
    .filter((part, index, values) => part && values.indexOf(part) === index).length;
  const declared = Number(html.match(/data-subtopic-count="(\d+)"/)?.[1]);
  const cards = (html.match(/class="concept-card"/g) || []).length;
  if (declared !== expectedSubtopics || cards !== expectedSubtopics) {
    failures.push(`${lesson.id}: expected ${expectedSubtopics} subtopic explanations, found ${cards}`);
  }
  const definitions = html.split("What it means:").length - 1;
  if (definitions !== expectedSubtopics) failures.push(`${lesson.id}: What it means: appears ${definitions} times`);
  const connections = html.split("How they connect:").length - 1;
  if (connections !== 1) failures.push(`${lesson.id}: expected one shared mechanism explanation, found ${connections}`);
}

const requiredSoftwareDesignLessons = [
  ["Clean code", "orderTotal", "google.github.io/eng-practices"],
  ["DRY,", "shippingCents", "google.github.io/eng-practices"],
  ["Cohesion,", "reserveAvailable", "learn.microsoft.com"],
  ["Single Responsibility Principle", "memberDiscount", "learn.microsoft.com"],
  ["Liskov Substitution Principle", "readerContract", "learn.microsoft.com"],
  ["Composition,", "composePrice", "learn.microsoft.com"],
  ["Design pattern literacy", "PatternDecision", "pearson.com"],
  ["Creational patterns", "RequestBuilder", "pearson.com"],
  ["Structural patterns", "ProviderAdapter", "pearson.com"],
  ["Behavioral patterns", "transition", "pearson.com"],
  ["Code smells", "characterization tests", "refactoring.com/catalog"],
  ["Architecture patterns", "UnitOfWork", "learn.microsoft.com"]
];
const softwareDesignLessons = manifest.lessons.filter((lesson) => lesson.trackId === "software-design");
if (softwareDesignLessons.length !== 12) failures.push(`Software design track has ${softwareDesignLessons.length} lessons; expected 12`);
for (const [titleStart, codeFragment, sourceFragment] of requiredSoftwareDesignLessons) {
  const lesson = softwareDesignLessons.find((item) => item.title.startsWith(titleStart));
  if (!lesson) {
    failures.push(`Software design coverage is missing ${titleStart}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  if (!html.includes(codeFragment)) failures.push(`${lesson.id}: starter code is missing ${codeFragment}`);
  if (!lesson.sourceUrl.includes(sourceFragment)) failures.push(`${lesson.id}: source is not the expected design reference`);
}

const requiredDsaLessons = [
  ["Arrays and hashing", "groupBySignature"],
  ["Two pointers", "sortedPair"],
  ["Sliding windows", "longestDistinct"],
  ["Stacks", "nextGreater"],
  ["Linked lists", "reverse"],
  ["Heaps", "pushHeap"],
  ["Binary search, boundary invariants, rotated order", "lowerBound"],
  ["Depth-first search", "countRegions"],
  ["Greedy algorithms, local choices", "maximumCompatible"],
  ["Dynamic programming, state, recurrences", "minimumCoins"],
  ["Graphs", "topologicalOrder"],
  ["Backtracking, decision trees, reversible state", "uniquePermutations"],
  ["Breadth-first search", "spreadMinutes"],
  ["Tries", "class Trie"],
  ["Prefix sums", "countTargetSubarrays"],
  ["Matrices", "spiral"],
  ["Intervals", "mergeIntervals"],
  ["Bit manipulation, masks", "countBits32"]
];
const computerScienceLessons = manifest.lessons.filter((lesson) => lesson.trackId === "computer-science");
if (computerScienceLessons.length !== 33) failures.push(`Computer science track has ${computerScienceLessons.length} lessons; expected 33`);
const originalDsaLessons = [
  "Complexity analysis", "Arrays, strings", "Trees, heaps", "Recursion, backtracking",
  "Sorting, comparison", "Binary search, boundary invariants, lower bound", "Array and string patterns",
  "Linked-list patterns", "Tree algorithms", "Graph algorithms", "Backtracking, decision trees, permutations",
  "Dynamic programming, state, transitions", "Greedy algorithms, exchange arguments",
  "Bit manipulation, binary representation", "Interview execution"
];
for (const titleStart of originalDsaLessons) {
  if (!computerScienceLessons.some((lesson) => lesson.title.startsWith(titleStart))) {
    failures.push(`Original DSA lesson was removed: ${titleStart}`);
  }
}
for (const [titleStart, codeFragment] of requiredDsaLessons) {
  const lesson = computerScienceLessons.find((item) => item.title.startsWith(titleStart));
  if (!lesson) {
    failures.push(`DSA coverage is missing ${titleStart}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  if (!html.includes(codeFragment)) failures.push(`${lesson.id}: starter code is missing ${codeFragment}`);
  if (!html.includes('data-dsa-approach="true"')) failures.push(`${lesson.id}: approach ladder is missing`);
  if (!lesson.sourceUrl.includes("ocw.mit.edu")) failures.push(`${lesson.id}: DSA source is not the expected primary course reference`);
}

const requiredSystemsLessons = [
  ["Request to wire", "layers =", "rfc-editor.org"],
  ["IPv4", "ip_network", "rfc-editor.org/rfc/rfc4632"],
  ["Routing tables", "next_hop", "rfc-editor.org/rfc/rfc4632"],
  ["UDP, TCP", "encode_datagram", "rfc-editor.org/rfc/rfc9293"],
  ["TCP flow control", "congestion_trace", "rfc-editor.org/rfc/rfc9293"],
  ["DNS resolution", "request_plan", "rfc-editor.org/rfc/rfc9110"],
  ["System calls", "os.pipe", "man7.org/linux/man-pages/man2/syscalls.2.html"],
  ["Processes, threads", "round_robin", "docs.kernel.org/scheduler"],
  ["Race conditions", "def transfer", "docs.kernel.org/locking"],
  ["Address spaces", "lru_faults", "docs.kernel.org/mm"],
  ["I/O, disks", "durable_replace", "docs.kernel.org/filesystems/vfs.html"],
  ["Namespaces", "def snapshot", "man7.org/linux/man-pages/man7/namespaces.7.html"]
];
const systemsLessons = manifest.lessons.filter((lesson) => lesson.trackId === "systems-foundations");
if (systemsLessons.length !== 12) failures.push(`Systems foundations track has ${systemsLessons.length} lessons; expected 12`);
for (const [titleStart, codeFragment, sourceFragment] of requiredSystemsLessons) {
  const lesson = systemsLessons.find((item) => item.title.startsWith(titleStart));
  if (!lesson) {
    failures.push(`Systems foundations coverage is missing ${titleStart}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  if (!html.includes(codeFragment)) failures.push(`${lesson.id}: starter code is missing ${codeFragment}`);
  if (!lesson.sourceUrl.includes(sourceFragment)) failures.push(`${lesson.id}: primary source is not the expected official specification or kernel documentation`);
}

const requiredAiLessons = [
  ["agents", "LLM system blueprint", "run_react", "docs.langchain.com/oss/python/langchain/agents"],
  ["agents", "Tool design", "build_context", "docs.langchain.com/oss/python/langchain/context-engineering"],
  ["agents", "LangChain v1 agents", "create_agent", "docs.langchain.com/oss/python/langchain/agents"],
  ["agents", "LangGraph StateGraph", "BaseModel", "docs.langchain.com/oss/python/langgraph/graph-api"],
  ["agents", "Model Context Protocol architecture", "tools/list", "modelcontextprotocol.io/specification"],
  ["agents", "MCP transports", "trustedOrigins", "modelcontextprotocol.io/specification"],
  ["retrieval-rag", "Vector database data model", "vector_cosine_ops", "github.com/pgvector/pgvector"],
  ["retrieval-rag", "Vector index internals", "recall_at_k", "github.com/pgvector/pgvector"],
  ["retrieval-rag", "Vector database storage internals", "snapshots", "qdrant.tech/documentation/manage-data/storage"],
  ["ai-application-engineering", "AI frontend streaming", "readSse", "ai-sdk.dev/docs/ai-sdk-ui"],
  ["ai-application-engineering", "Generative UI", "assertNever", "ai-sdk.dev/docs/ai-sdk-ui"],
  ["ai-application-engineering", "Conversation persistence", "idempotency-key", "ai-sdk.dev/docs/ai-sdk-ui"],
  ["ai-application-engineering", "Tool calling", "execute_tool", "developers.openai.com/api/docs"],
  ["quality-security", "Production webhooks", "timingSafeEqual", "docs.stripe.com/webhooks"],
  ["quality-security", "Application file storage", "generate_presigned_post", "docs.aws.amazon.com/AmazonS3"],
  ["quality-security", "Background jobs", "SKIP LOCKED", "docs.aws.amazon.com/AWSSimpleQueueService"],
  ["quality-security", "Audit logs", "previousHash", "cheatsheetseries.owasp.org"],
  ["quality-security", "Admin systems", "fresh authentication required", "cheatsheetseries.owasp.org"],
  ["ai-quality-safety", "LLM benchmarking", "run_candidate", "docs.langchain.com/langsmith/evaluation-types"]
];
for (const [trackId, titleStart, codeFragment, sourceFragment] of requiredAiLessons) {
  const lesson = manifest.lessons.find((item) => item.trackId === trackId && item.title.startsWith(titleStart));
  if (!lesson) {
    failures.push(`AI coverage is missing ${titleStart}`);
    continue;
  }
  const filename = lesson.path.replace(/^\.\.\/\.\.\/lessons\//, "");
  const html = await readFile(join(lessonsDirectory, filename), "utf8");
  if (!html.includes(codeFragment)) failures.push(`${lesson.id}: starter code is missing ${codeFragment}`);
  if (!lesson.sourceUrl.includes(sourceFragment)) failures.push(`${lesson.id}: primary source is not the expected official documentation`);
}
if (manifest.lessons.filter((lesson) => lesson.trackId === "agents").length !== 9) failures.push("Agents track must contain 9 lessons");
if (manifest.lessons.filter((lesson) => lesson.trackId === "retrieval-rag").length !== 9) failures.push("Retrieval and RAG track must contain 9 lessons");
if (manifest.lessons.filter((lesson) => lesson.trackId === "ai-application-engineering").length !== 8) failures.push("AI application engineering track must contain 8 lessons");
if (manifest.lessons.filter((lesson) => lesson.trackId === "quality-security").length !== 10) failures.push("Quality, security, and SaaS operations track must contain 10 lessons");
if (manifest.lessons.filter((lesson) => lesson.trackId === "ai-quality-safety").length !== 6) failures.push("AI quality track must contain 6 lessons");

await access(join(root, "reference", "react-deep-dive-map.html"));
await access(join(root, "reference", "software-design-deep-dive-map.html"));
await access(join(root, "reference", "systems-foundations-deep-dive-map.html"));
await access(join(root, "reference", "javascript-deep-dive-map.html"));
await access(join(root, "reference", "typescript-deep-dive-map.html"));
await access(join(root, "reference", "nodejs-deep-dive-map.html"));
await access(join(root, "reference", "data-systems-deep-dive-map.html"));
await access(join(root, "reference", "api-distributed-systems-deep-dive-map.html"));
await access(join(root, "reference", "service-architecture-events-deep-dive-map.html"));
await access(join(root, "reference", "fastapi-deep-dive-map.html"));
await access(join(root, "reference", "python-deep-dive-map.html"));
await access(join(root, "reference", "cloud-aws-deep-dive-map.html"));
await access(join(root, "reference", "devops-deep-dive-map.html"));
await access(join(root, "reference", "docker-deep-dive-map.html"));
await access(join(root, "reference", "kubernetes-deep-dive-map.html"));
await access(join(root, "reference", "international-interviews-deep-dive-map.html"));

const focusDirectory = root;
const focusHtml = await readFile(join(focusDirectory, "lesson.html"), "utf8");
const focusApp = await readFile(join(focusDirectory, "app.js"), "utf8");
const dashboardHtml = await readFile(join(focusDirectory, "index.html"), "utf8");
const dashboardApp = await readFile(join(focusDirectory, "dashboard.js"), "utf8");
for (const fragment of ["index.html", "export-progress", "import-progress", "progress-file", "progress-feedback"]) {
  if (!focusHtml.includes(fragment)) failures.push(`focus mode is missing ${fragment}`);
}
for (const fragment of ["exportProgress", "importProgress", "normalizeProgress", "1_000_000"]) {
  if (!focusApp.includes(fragment)) failures.push(`focus progress backup is missing ${fragment}`);
}
for (const fragment of ["Overall completion", "Tracks started", "Tracks complete", "track-summary"]) {
  if (!dashboardHtml.includes(fragment)) failures.push(`focus dashboard is missing ${fragment}`);
}
for (const fragment of ["full-stack-ai-roadmap.progress.v1", "calculateProgress", "Next:"]) {
  if (!dashboardApp.includes(fragment)) failures.push(`focus dashboard logic is missing ${fragment}`);
}

const sharedBase = await readFile(join(focusDirectory, "base.js"), "utf8");
for (const removedText of ["// FULL_STACK_AI_ENGINEER", "learn_deeply()", "build_steadily()"]) {
  if (focusHtml.includes(removedText)) failures.push(`focus mode still contains removed text: ${removedText}`);
}
if (!focusHtml.includes('aria-keyshortcuts="Alt+U"') || !focusHtml.includes('id="lesson-status" role="status" aria-live="polite"') || !focusApp.includes('event.code === "KeyU"') || !focusApp.includes('frame.contentWindow.addEventListener("keydown", handleKeyboardShortcut)') || !focusApp.includes("store.markIncomplete(activeLessonId)") || !sharedBase.includes("markIncomplete(lessonId)")) {
  failures.push("focus mode is missing lesson-level mark-incomplete support");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${manifest.lessons.length} lessons across ${manifest.tracks.length} tracks.`);
}
