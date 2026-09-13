import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
import { SENIOR_CASES, REUSE_PURPOSE } from "./senior-content.mjs";
import { typescriptReviewFor, typescriptSourceFor, TYPESCRIPT_EXECUTABLE_LESSONS } from "./typescript-review.mjs";
import { simpleConceptExplanation, diagramFor } from "./generate-lessons.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(await readFile(join(root, "lessons/manifest.json"), "utf8"));
const reviewLedger = JSON.parse(await readFile(join(root, "lesson-review-status.json"), "utf8"));
assert.equal(reviewLedger.version, 1, "Unsupported review ledger version");
assert.ok(reviewLedger.lessons && typeof reviewLedger.lessons === "object" && !Array.isArray(reviewLedger.lessons));
const reviewEvidence = new Map();
const verificationTasks = {
  browser: "Browser behavior and accessibility checks in an available browser environment.",
  frameworkData: "FastAPI/framework and database/broker integration checks; current fakes and syntax checks remain documented in CONTENT-REVIEW.md.",
  cloudProviders: "Cloud, container, orchestration and model-provider experiments in authorized disposable environments; no installation or resource creation is implied.",
  githubPages: "Confirm GitHub Pages serves the current manifest and lesson files; local path checks are not live deployment verification."
};
assert.deepEqual(Object.keys(reviewLedger.verification).sort(), Object.keys(verificationTasks).sort());
for (const evidence of Object.values(reviewLedger.verification)) {
  if (evidence === null) continue;
  assert.match(evidence, /^[a-zA-Z0-9_-]+\.md$/, "Verification completion requires a root Markdown evidence file");
  await readFile(join(root, evidence), "utf8");
}
for (const [number, record] of Object.entries(reviewLedger.lessons)) {
  assert.ok(manifest.lessons.some(lesson => lesson.number === number), `Unknown reviewed lesson ${number}`);
  assert.match(record.revision, /^[a-f0-9]{12}$/, `${number}: revision required`);
  assert.match(record.reviewedOn, /^\d{4}-\d{2}-\d{2}$/, `${number}: review date required`);
  assert.match(record.evidence, /^[a-zA-Z0-9_-]+\.md$/, `${number}: evidence must be a root Markdown file`);
  if (!reviewEvidence.has(record.evidence)) reviewEvidence.set(record.evidence, await readFile(join(root, record.evidence), "utf8"));
  assert.match(reviewEvidence.get(record.evidence), new RegExp(`^## ${number}\\b`, "m"), `${number}: missing individual evidence heading`);
}
function reviewState(lesson, record) {
  if (!record) return "Final review pending";
  return record.revision === lesson.revision ? "Recorded pass" : "Recheck changed content";
}
assert.equal(reviewState({ revision: "a" }), "Final review pending");
assert.equal(reviewState({ revision: "a" }, { revision: "a" }), "Recorded pass");
assert.equal(reviewState({ revision: "b" }, { revision: "a" }), "Recheck changed content");
const decode = text => text.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const cell = text => text.replaceAll("|", "\\|").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", " ");
const codeGroups = new Map();
const rows = [];
const algorithmChecks = [];
const machineCodingChecks = [];
const numericalChecks = [];
const javascriptChecks = [];
const pythonTrackChecks = [];
for (const [term, expected] of [["exact search", /not ground-truth semantic relevance/], ["recall", /Relevance recall/], ["query rewriting", /change intent/], ["reranking", /cannot recover/], ["citations", /does not prove/]]) {
  assert.match(simpleConceptExplanation(term, { trackId: "retrieval-rag", title: "Retrieval" }), expected);
}
for (const [term, expected] of [["interrupts", /restarts its node/], ["checkpoints", /in-memory saver/], ["pydantic state schemas", /create_agent does not support/]]) {
  assert.match(simpleConceptExplanation(term, { trackId: "agents", title: "Workflow recovery" }), expected);
}
for (const [term, expected] of [["data splits", /each training fold/], ["leakage", /model building or selection/], ["metrics", /minority-class/]]) {
  assert.match(simpleConceptExplanation(term, { trackId: "ml-foundations", title: "Evaluation" }), expected);
}
for (const [term, expected] of [["signatures", /public-key/], ["replay defense", /atomically/], ["presigned urls", /not a single-use/], ["tamper evidence", /independent checkpoints/]]) {
  assert.match(simpleConceptExplanation(term, { trackId: "quality-security", title: "Production boundaries" }), expected);
}
for (const [term, expected] of [["compaction", /multiple versions/], ["kafka replication", /followers/], ["min.insync.replicas", /full current ISR/], ["transactions", /read_committed/], ["consumer groups", /stale worker/], ["retry topics", /overtake/], ["idempotent consumers", /atomic boundary/], ["event-driven architecture", /style alone/], ["keys", /partition counts/]]) {
  assert.match(simpleConceptExplanation(term, { trackId: "service-architecture-events", title: "Kafka and event delivery" }), expected);
}
for (const [number, fragment] of [["0465", "unittest.mock"], ["0466", "hypothesis.readthedocs.io"], ["0467", "Threat_Modeling_Cheat_Sheet"], ["0468", "Software_Supply_Chain_Security_Cheat_Sheet"], ["0469", "implementing-slos"]]) {
  assert.ok(manifest.lessons.find(lesson => lesson.number === number).sourceUrl.includes(fragment), `${number}: unrelated primary source`);
}
for (const [term, expected] of [["https redirects", /already unencrypted/], ["origin policy", /not CSRF protection/], ["async def", /async generator/], ["def", /not every helper/]]) {
  assert.match(simpleConceptExplanation(term, {trackId:"fastapi", title:"Security and execution boundaries"}), expected);
}
// Secondary words in a long title must not override its principal mechanism.
for (const [number, key] of Object.entries({
  "0086":"javascript-evaluation", "0106":"javascript-jobs", "0119":"javascript-engine",
  "0121":"javascript-boundary", "0217":"node-runtime", "0222":"node-runtime",
  "0232":"node-network", "0233":"node-network", "0237":"node-network",
  "0247":"node-boundary", "0248":"node-parallel", "0284":"python-data-boundary",
  "0293":"python-data-boundary", "0301":"python-data-boundary", "0326":"fastapi-security",
  "0335":"fastapi-stream", "0527":"docker-container-run", "0535":"docker-container-run",
  "0538":"docker-container-run", "0541":"docker-container-run", "0542":"docker-image-build",
  "0546":"docker-container-run", "0556":"kubernetes-storage", "0567":"kubernetes-policy",
  "0450":"load-balancer-path", "0494":"aws-data-request",
  "0366":"database-query", "0371":"postgres-pool", "0376":"postgres-access",
  "0377":"postgres-diagnostics", "0378":"postgres-diagnostics",
  "0508":"operations-diagnosis", "0509":"operations-diagnosis",
  "0520":"operations-diagnosis", "0522":"operations-diagnosis",
  "0571":"operations-diagnosis", "0572":"operations-diagnosis",
  "0595":"rag-ingestion", "0615":"ai-authority-boundary",
  "0122":"behavior-test", "0200":"behavior-test", "0251":"behavior-test",
  "0295":"behavior-test", "0338":"behavior-test", "0339":"behavior-test",
  "0420":"behavior-test",
  "0319":"fastapi-settings", "0325":"fastapi-delivery", "0333":"fastapi-delivery",
  "0340":"fastapi-diagnostics", "0341":"fastapi-diagnostics",
  "0265":"python-sequence", "0300":"python-use-case", "0302":"python-use-case", "0312":"fastapi-response",
  "0321":"fastapi-execution", "0322":"fastapi-cancellation",
  "0465":"behavior-test", "0466":"behavior-test", "0469":"reliability-feedback",
  "0192":"react-input-ownership", "0209":"react-output-boundary", "0183":"react-layout-timing",
  "0124":"javascript-command", "0125":"javascript-command",
  "0422":"distributed-message", "0424":"distributed-message", "0437":"message-delivery",
  "0445":"replicated-operation", "0452":"event-history-projection"
})) {
  const lesson = manifest.lessons.find(item => item.number === number);
  assert.equal(diagramFor(lesson).key, key, `${number}: incorrect principal diagram`);
}
for (const [title, key] of [["RESP, connections", "resp-byte-framing"], ["Redis Cluster", "redis-cluster-conditional-write"], ["Redis security", "redis-acl-boundary"]]) {
  assert.equal(diagramFor({ trackId: "data-systems", title }).key, key);
}
assert.equal(diagramFor({ trackId: "data-systems", title: "Application data patterns, optimistic concurrency" }).key, "database-command-replay");
assert.equal(diagramFor({ trackId: "data-systems", title: "Data systems production architecture capstone" }).key, "database-command-replay");
const python = process.env.LESSON_PYTHON || "python3";
execFileSync(python, ["-I", "-c", "import sys; assert sys.version_info >= (3, 12), 'Python 3.12+ required; set LESSON_PYTHON to a suitable interpreter'"], { stdio: "pipe" });

// One runnable regression check for the semantic routing bugs found in review.
const js = { trackId: "javascript", title: "Primitive values, objects, typeof, null, undefined, and identity" };
assert.match(simpleConceptExplanation("null", js), /not an object/);
assert.match(simpleConceptExplanation("Set", js), /Set stores unique/);
assert.match(simpleConceptExplanation("WeakSet", js), /WeakSet holds/);
assert.match(simpleConceptExplanation("in", { trackId: "typescript", title: "Control-flow analysis" }), /in operator checks whether a property exists/);
assert.match(simpleConceptExplanation("Parameters", { trackId: "typescript", title: "Built-in utility types" }), /extracts a tuple/);
assert.match(simpleConceptExplanation("top or bottom types", { trackId: "typescript", title: "any, unknown" }), /never has no possible values/);
assert.equal(diagramFor({ trackId: "typescript", title: "any, unknown, never, void, undefined, null, and top or bottom types" }).key, "typescript-unknown-boundary");
assert.match(simpleConceptExplanation("Readonly", { trackId: "typescript", title: "Readonly" }), /readonly/i);
assert.match(simpleConceptExplanation("sessions", { trackId: "nodejs", title: "HTTP/2, sessions" }), /multiple request\/response streams/);
assert.match(simpleConceptExplanation("partitions", { trackId: "api-distributed-systems", title: "Ordering, partitions" }), /message log/);
assert.equal(diagramFor(js).key, "javascript-values-identity");
assert.equal(diagramFor({ trackId: "javascript", title: "Async functions, await, suspension, resumption, errors, and sequential execution" }).key, "javascript-await");
assert.equal(Object.keys(SENIOR_CASES).length, manifest.tracks.length);

const reference = await readFile(join(root, "reference/senior-interview-practice.html"), "utf8");
const tsReport = ["# TypeScript content review", "",
  "All 45 lessons (0126–0170) received a content-review pass: concrete term definitions, plain explanations, senior reasoning checkpoints, and explicit lab scope. This is not certification of every integration or learner mastery.", "",
  "Verification: run `node scripts/check-typescript-lessons.mjs` for 26 generated snippets with compiler checks and runtime assertions/probes. The remaining 19 are intentional counterexamples, configuration/tooling recipes, integration sketches, or project assignments; they were reviewed as content, not executed end-to-end. No React/Node packages were installed for this review.", "",
  "Corrected empty-input generic unsoundness, event-name remapping, declaration/implementation confusion, a declare-only runtime call, missing HTTP status checks, and mouse-only table selection. Integration exercises explicitly identify authorization, cancellation, packaging, and host prerequisites.", "",
  "Use the labs' stated prerequisites. The test runner uses installed TypeScript 5.3.3; newer APIs such as NoInfer require their documented compiler version. Shared snippets now have distinct lesson-specific exercises. They are not complete implementations of every subtopic in the title.", ""];
for (const lesson of manifest.lessons.filter(item => item.trackId === "typescript")) {
  const [model, reasoning, evidence] = typescriptReviewFor(lesson);
  tsReport.push(`## ${lesson.number} · ${lesson.title}`, "",
    `[Lesson](${lesson.path.replace(/^\.\.\/\.\.\//, "")}) · [Primary reference](${typescriptSourceFor(lesson.number)})`, "",
    `Model: ${model}`, "", `Senior checkpoint: ${reasoning}`, "", `Practice: ${evidence}`, "",
    `Verification scope: ${TYPESCRIPT_EXECUTABLE_LESSONS.has(lesson.number) ? "Included in the compiler/runtime check command." : "Content reviewed; requires the described project or exercise-specific verification."}`, "");
}
await writeFile(join(root, "TYPESCRIPT-CONTENT-REVIEW.md"), tsReport.join("\n"));
for (const lesson of manifest.lessons) {
  const path = lesson.path.replace(/^\.\.\/\.\.\//, "");
  const html = await readFile(join(root, path), "utf8");
  const terms = [...html.matchAll(/data-subtopic="([^"]+)"[\s\S]*?<p><strong>What it means:<\/strong> ([\s\S]*?)<\/p>/g)];
  const missing = terms.filter(([, , definition]) => /is one part of|is one responsibility|is a technical term/.test(definition)).map(([, term]) => decode(term));
  const code = (html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code>/)?.[1] || "").trim();
  assert.ok(!/(?:\/\/|#) Lesson focus:/.test(code), `${lesson.id}: practice annotations must not corrupt copied code`);
  assert.ok(html.includes("<strong>Practice notes:</strong>"), `${lesson.id}: retain prediction and observation outside code`);
  assert.ok(html.includes("<strong>Tomorrow, without notes:</strong>"), `${lesson.id}: include delayed recall and corrective practice`);
  assert.ok(!html.includes("Which approach best demonstrates mastery"), `${lesson.id}: orientation is not a knowledge assessment`);
  if (lesson.trackId === "kubernetes") {
    assert.ok(!/^kubectl /m.test(decode(code)) || !/^apiVersion:|^resources:|^spec:/m.test(decode(code)), `${lesson.id}: do not mix executable shell commands with YAML`);
  }
  if (lesson.trackId === "devops" && lesson.title.startsWith("Shell automation")) {
    const guard = decode(code).split("./deploy --artifact")[0];
    const valid = `registry.example/app@sha256:${"a".repeat(64)}`;
    execFileSync("bash", ["-s", "--", valid], { input: guard, stdio: "pipe" });
    for (const invalid of ["image@sha256:", "image@sha256:DIGEST", `image@sha256:${"g".repeat(64)}`, `image@sha256:${"a".repeat(63)}`, `bad image@sha256:${"a".repeat(64)}`]) {
      assert.throws(() => execFileSync("bash", ["-s", "--", invalid], { input: guard, stdio: "pipe" }), `${lesson.id}: reject malformed digest`);
    }
  }
  assert.equal(missing.length, 0, `${lesson.id}: placeholder definitions must be replaced before publishing`);
  if (["0407", "0408", "0416", "0418", "0419", "0420", "0437", "0440", "0442", "0443", "0444", "0445", "0446", "0449", "0452", "0469", "0597"].includes(lesson.number)) {
    const prelude = 'import { ok as check } from "node:assert/strict"; console.assert = check;\n';
    execFileSync(process.execPath, ["--input-type=module", "-e", prelude + decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0410") {
    const representation = JSON.parse(decode(code));
    assert.equal(representation.links.approve.method, "PUT");
    assert.equal(representation.state, "awaiting_approval");
  }
  if (lesson.number === "0614") {
    execFileSync(python, ["-I", "-c", decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.trackId === "data-systems" && lesson.title.startsWith("Deadlocks,")) {
    execFileSync(python, ["-I", "-c", decode(code) + `
class Failure(Exception):
    def __init__(self, state): self.sqlstate = state
calls, sleeps = [], []
def transient():
    calls.append(1)
    if len(calls) < 3: raise Failure("40001")
    return "committed"
assert retry_transaction(transient, pause=sleeps.append) == "committed"
assert len(calls) == 3 and len(sleeps) == 2
assert all(0 <= delay <= 0.5 for delay in sleeps)
for state, count in [("40P01", 4), ("23505", 1), (None, 1)]:
    calls.clear()
    original = Failure(state)
    def fail():
        calls.append(1)
        raise original
    try: retry_transaction(fail, pause=lambda _: None)
    except Failure as error: assert error is original
    else: raise AssertionError("must preserve failure")
    assert len(calls) == count
for attempts in [0, -1, 11, True, 1.5]:
    try: retry_transaction(lambda: None, attempts=attempts)
    except ValueError: pass
    else: raise AssertionError("invalid retry bound")
`], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.trackId === "data-systems" && /^(?:--[^\n]*\n\s*)*(?:SELECT|CREATE|BEGIN|ALTER|EXPLAIN|WITH|REVOKE|SET)\b/.test(decode(code))) {
    assert.ok(!/^#|^psql |^ps |^hostssl /m.test(decode(code)), `${lesson.id}: SQL must not contain shell/INI syntax`);
  }
  if (lesson.trackId === "fastapi") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing FastAPI checkpoint`);
    assert.ok(html.includes("Core: trace the supplied FastAPI example"), `${lesson.id}: missing FastAPI scope`);
  }
  if (lesson.number === "0330") {
    execFileSync(python, ["-I", "-c", `
import ast
from types import SimpleNamespace
source = ${JSON.stringify(decode(code))}
tree = ast.parse(source)
assignments = [node for node in ast.walk(tree) if isinstance(node, ast.Assign)
    and any(isinstance(target, ast.Name) and target.id in {"candidate", "request_id"} for target in node.targets)]
compiled = compile(ast.Module(body=assignments, type_ignores=[]), "request-id-policy", "exec")
for candidate, expected in [("trace-42_A", "trace-42_A"), ("", "generated"), ("a" * 65, "generated"), ("bad\\r\\nheader", "generated"), ("café", "generated")]:
    namespace = {"headers": {"x-request-id": candidate}, "uuid4": lambda: SimpleNamespace(hex="generated")}
    exec(compiled, namespace)
    assert namespace["request_id"] == expected
`], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.trackId === "fastapi" && lesson.number !== "0342") {
    // Syntax only: framework imports and integration adapters are unavailable.
    execFileSync(python, ["-I", "-c", "import ast,sys; ast.parse(sys.stdin.read())"], { input: decode(code), timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0331") {
    execFileSync(python, ["-I", "-c", decode(code) + `
import asyncio
async def check():
    for chunks, headers, expected in [
        ([b"ab", b"cd"], [], 200),
        ([b"ab", b"cde"], [], 413),
        ([b"12345"], [(b"content-length", b"1")], 413),
        ([b"x"], [(b"content-encoding", b"gzip")], 415),
        ([b""], [], 200),
    ]:
        messages = [{"type": "http.request", "body": chunk, "more_body": i < len(chunks)-1}
                    for i, chunk in enumerate(chunks)]
        sent, calls = [], []
        async def receive(): return messages.pop(0)
        async def send(message): sent.append(message)
        async def app(scope, receive, send):
            body = await receive()
            calls.append(body["body"])
            assert not body["more_body"]
            await send({"type": "http.response.start", "status": 200})
        await BodyLimit(app, 4)({"type": "http", "headers": headers}, receive, send)
        assert sent[0]["status"] == expected
        assert calls == ([b"".join(chunks)] if expected == 200 else [])
    sent = []
    async def disconnected(): return {"type": "http.disconnect"}
    async def forbidden(*args): raise AssertionError("must not call downstream or send")
    await BodyLimit(forbidden)({"type": "http"}, disconnected, forbidden)
    for limit in (0, -1, True):
        try: BodyLimit(forbidden, limit)
        except ValueError: pass
        else: raise AssertionError("bad limit accepted")
asyncio.run(check())
`], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.trackId === "python") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing Python checkpoint`);
    assert.ok(html.includes("Core: inspect the supplied Python fixture"), `${lesson.id}: missing Python scope`);
    const definitions = { "0274": "Python containers hold objects", "0276": "Named tuples are tuple subclasses", "0290": "Multiprocessing start methods", "0295": "Testing properties are rules" };
    if (definitions[lesson.number]) assert.ok(html.includes(definitions[lesson.number]), `${lesson.id}: incorrect contextual definition`);
    if (lesson.number === "0286") assert.ok(decode(code).includes('"--no-ext-diff", "--no-textconv"'), "Git fixture must disable external helpers");
    if (!["0297", "0298"].includes(lesson.number)) {
      execFileSync(python, ["-I", "-c", "import ast,sys; ast.parse(sys.stdin.read())"], { input: decode(code), timeout: 10000, stdio: "pipe" });
    }
    // Read through before execution: skip multi-file/native/process/external labs.
    if (!["0271", "0290", "0297", "0298", "0299", "0301", "0302"].includes(lesson.number)) {
      execFileSync(python, ["-I", "-c", decode(code)], { timeout: 10000, stdio: "pipe" });
      pythonTrackChecks.push(lesson.number);
    }
  }
  if (Number(lesson.number) >= 397 && Number(lesson.number) <= 420) {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing API checkpoint`);
    assert.ok(html.includes("Core: predict the supplied contract"), `${lesson.id}: missing API scope`);
    if (lesson.number === "0419") assert.ok(html.includes("Diagnostic logs are timestamped event records"), "API logs must not inherit broker-log definition");
  }
  if (lesson.number === "0430") assert.ok(html.includes("Bounded queues cap waiting work"), "bounded queues must explain capacity, not only competing-consumer delivery");
  if (lesson.number === "0434") assert.ok(html.includes("producer acknowledgement may confirm broker acceptance"), "acknowledgements must distinguish producer and consumer boundaries");
  if (lesson.number === "0435") assert.ok(html.includes("durability, retention and eventual-recovery assumptions"), "at-least-once must retain fault/retention assumptions");
  if (lesson.number === "0440") assert.ok(html.includes("a refusal can trigger abort"), "2PC abort does not require all participants to prepare");
  if (lesson.number === "0446") assert.ok(html.includes("Shard rebalancing moves data"), "shard rebalancing must not inherit consumer-only ownership");
  if (lesson.number === "0447") assert.ok(html.includes("logical election epochs") && html.includes("executions allowed by the stated fault model"), "Raft terms and safety must state protocol scope");
  if (lesson.number === "0469") assert.ok(html.includes("Reliability observability uses metrics"), "reliability must not inherit admin-only observability");
  if (Number(lesson.number) >= 475 && Number(lesson.number) <= 480) assert.ok(!html.includes("is one AWS or cloud responsibility"), "reviewed cloud definitions must explain their mechanism");
  if (lesson.number === "0476") assert.ok(html.includes("independent IAM boundaries"), "AWS partitions must not mean network partitions");
  if (lesson.number === "0431") assert.ok(html.includes("Trace dependency isolation and recovery"), "breaker trace must not describe installation");
  if (Number(lesson.number) >= 381 && Number(lesson.number) <= 395) {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing Redis checkpoint`);
    assert.ok(html.includes("Core: predict the explicitly stated Redis fixture"), `${lesson.id}: missing Redis scope`);
    const terms = { "0381": "Redis logical databases are numbered keyspaces", "0382": "A Redis connection carries an ordered protocol stream", "0385": "not a guaranteed maximum error" };
    if (terms[lesson.number]) assert.ok(html.includes(terms[lesson.number]), `${lesson.id}: incorrect Redis definition`);
  }
  if (Number(lesson.number) >= 346 && Number(lesson.number) <= 380) {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing database checkpoint`);
    assert.ok(html.includes("Core: trace this independent database fixture"), `${lesson.id}: missing database scope`);
    const terms = { "0360": "They do not block writers", "0361": "Atomicity of each attempt alone", "0362": "posting list of tuple locations", "0367": "A hash join builds a hash table", "0372": "Partition routing chooses a child relation", "0375": "A physical base backup copies" };
    if (terms[lesson.number]) assert.ok(html.includes(terms[lesson.number]), `${lesson.id}: wrong contextual database definition`);
  }
  if (lesson.trackId === "systems-foundations") {
    // Twelve offline stdlib experiments; no packets, containers or kernel tuning.
    execFileSync(python, ["-I", "-c", decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (["0589", "0600", "0603", "0604"].includes(lesson.number)) {
    execFileSync(python, ["-I", "-c", decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0607") {
    const requests = [
      "{bad", "[]", JSON.stringify({ jsonrpc: "2.0", id: true, method: "tools/list" }),
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "missing" }),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "explain_term", arguments: { term: 3 } } }),
      JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "explain_term", arguments: { term: "idempotency" } } }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })
    ];
    const output = execFileSync(python, ["-I", "-c", decode(code)], { input: requests.join("\n") + "\n", encoding: "utf8", timeout: 10000 });
    const responses = output.trim().split("\n").map(line => JSON.parse(line));
    assert.equal(responses.length, 6);
    assert.deepEqual(responses.slice(0, 5).map(response => response.error.code), [-32700, -32600, -32600, -32601, -32602]);
    assert.equal(responses[0].id, null);
    assert.match(responses[5].result.content[0].text, /operation identity/);
  }
  if (lesson.number === "0606") {
    // Extract only the node function: no claim that Pydantic/LangGraph executed.
    const probe = `import ast,sys
from types import SimpleNamespace as NS
tree = ast.parse(sys.stdin.read())
node = next(item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == "review")
node.returns = None
for argument in node.args.args: argument.annotation = None
answers = iter([True, False, "false"])
def interrupt(payload):
    assert payload["action"] == "refund"
    return next(answers)
Command = lambda **kwargs: NS(**kwargs)
exec(compile(ast.Module(body=[node], type_ignores=[]), "lesson-node", "exec"))
assert review(NS(action="refund")).goto == "execute"
assert review(NS(action="refund")).goto == "cancel"
try: review(NS(action="refund"))
except ValueError: pass
else: raise AssertionError("truthy string approved")
`;
    execFileSync(python, ["-I", "-c", probe], { input: decode(code), timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0302") {
    execFileSync(python, ["-I", "-c", decode(code) + `
import asyncio
from copy import deepcopy
# Sequential transaction fake: verifies service branching, not database isolation.
state = {"receipts": {}, "projects": []}
fail_commit = False
class FakeUow:
    async def __aenter__(self):
        self.pending = deepcopy(state)
        return self
    async def __aexit__(self, *args): pass
    async def claim(self, key, intent):
        prior = self.pending["receipts"].get(key)
        if prior:
            if prior[0] != intent: raise ValueError("changed intent")
            return prior[1]
        self.pending["receipts"][key] = [intent, None]
    async def add_project(self, project):
        result = dict(project, id=len(self.pending["projects"]) + 1)
        self.pending["projects"].append(result)
        return result
    async def save_result(self, key, project):
        self.pending["receipts"][key][1] = project
    async def commit(self):
        if fail_commit: raise RuntimeError("commit failed")
        state.update(self.pending)
async def check():
    global fail_commit
    service = ProjectService(FakeUow)
    first = await service.create(CreateProject(" Demo ", "k"))
    assert await service.create(CreateProject("Demo", "k")) == first
    assert len(state["projects"]) == 1
    for command in (CreateProject("Other", "k"), CreateProject(" ", "b"), CreateProject("X", "")):
        try: await service.create(command)
        except ValueError: pass
        else: raise AssertionError("invalid command accepted")
    fail_commit = True
    try: await service.create(CreateProject("Other", "new"))
    except RuntimeError: pass
    else: raise AssertionError("commit failure ignored")
    assert len(state["projects"]) == 1 and "new" not in state["receipts"]
    fail_commit = False
    assert (await service.create(CreateProject("Other", "new")))["id"] == 2
asyncio.run(check())
`], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0464") {
    const processEvent = runInNewContext(decode(code) + "\nprocess");
    const calls = [];
    const operations = { quarantine: async () => calls.push("quarantine"), consumeIdempotently: async () => calls.push("consume") };
    await processEvent({}, operations, () => ({ ok: false, errors: ["fixture"] }));
    await processEvent({}, operations, () => ({ ok: true, value: {} }));
    assert.deepEqual(calls, ["quarantine", "consume"]);
    await assert.rejects(processEvent({}, { ...operations, quarantine: async () => { throw new Error("storage unavailable"); } }, () => ({ ok: false, errors: [] })), /storage unavailable/);
    assert.match(decode(code), /default is an annotation/);
    assert.match(decode(code), /old\/new writers/);
  }
  if (lesson.title.startsWith("Kafka producers")) {
    const effects = [], commits = [];
    const batch = runInNewContext(decode(code) + "\nhandleBatch");
    const effect = async (_tx, value) => { if (value === "fail") throw new Error("effect failed"); effects.push(value); };
    const handleBatch = (consumer, database, records) => batch(consumer, database, records, effect);
    const database = { transaction: async fn => fn({ inbox: { insertIfAbsent: async () => true } }) };
    const consumer = { commitOffset: async offset => commits.push(offset) };
    const record = { topic: "jobs", partition: 0, offset: "9007199254740993", value: "ok" };
    await handleBatch(consumer, database, []);
    assert.equal(commits.length, 0);
    await handleBatch(consumer, database, [record]);
    assert.deepEqual(commits, ["9007199254740994"]);
    await assert.rejects(handleBatch(consumer, database, [record, { ...record, partition: 1, offset: "9007199254740994" }]), /one partition/);
    assert.deepEqual(effects, ["ok"]);
    await assert.rejects(handleBatch(consumer, database, [{ ...record, value: "fail" }]), /effect failed/);
    assert.equal(commits.length, 1);
    for (const invalid of [null, [null], [{ ...record, offset: "01" }], [{ ...record, offset: "1\n" }],
      [{ ...record, offset: "9223372036854775807" }], [record, record],
      [record, { ...record, offset: "2" }], [{ ...record, partition: -1 }]]) {
      await assert.rejects(handleBatch(consumer, database, invalid));
    }
    assert.deepEqual(effects, ["ok"]);
    assert.equal(commits.length, 1);
    await handleBatch(consumer, database, [{ ...record, offset: "1" }, { ...record, offset: "3" }]);
    assert.equal(commits.at(-1), "4");
  }
  if (lesson.number === "0439") {
    const order = [];
    let failState = false;
    const advance = runInNewContext(decode(code) + "\nadvance", {
      transition: () => ({ actions: ["ship"] }),
      store: { transaction: async fn => {
        await fn({
          appendHistory: async () => { await Promise.resolve(); order.push("history"); },
          saveState: async () => { await Promise.resolve(); if (failState) throw new Error("state failed"); order.push("state"); },
          enqueueDueActions: async () => { await Promise.resolve(); order.push("actions"); }
        });
        order.push("commit");
      } }
    });
    await advance({ id: "s1", state: "paid" }, {});
    assert.deepEqual(order, ["history", "state", "actions", "commit"]);
    order.length = 0; failState = true;
    await assert.rejects(advance({ id: "s1", state: "paid" }, {}), /state failed/);
    assert.deepEqual(order, ["history"]);
  }
  if (lesson.number === "0435") {
    // Sequential transaction fake tests adapter use, not real isolation/durability.
    const consume = runInNewContext(decode(code) + "\nconsume");
    let receipts = new Map(), effects = 0, acknowledgements = 0;
    let failEffect = false, failAck = false;
    const database = { async transaction(callback) {
      const staged = new Map(receipts);
      let pendingEffects = 0;
      await callback({
        inbox: { async insertIfAbsent(id, data) {
          const intent = JSON.stringify(data);
          if (staged.has(id)) {
            if (staged.get(id) !== intent) throw new Error("changed intent");
            return false;
          }
          staged.set(id, intent);
          return true;
        } },
        async applyBusinessEffect() {
          if (failEffect) throw new Error("effect failed");
          pendingEffects++;
        }
      });
      receipts = staged;
      effects += pendingEffects;
    } };
    const broker = { async ack(record) {
      assert.ok(receipts.has(record.eventId), "ack must follow commit");
      if (failAck) throw new Error("ack failed");
      acknowledgements++;
    } };
    const record = { eventId: "e1", data: { value: 1 } };
    await consume(record, database, broker);
    await consume(record, database, broker);
    assert.equal(effects, 1);
    assert.equal(acknowledgements, 2);
    await assert.rejects(consume({ ...record, data: { value: 2 } }, database, broker), /changed intent/);
    assert.equal(acknowledgements, 2);
    failEffect = true;
    await assert.rejects(consume({ ...record, eventId: "e2" }, database, broker), /effect failed/);
    assert.equal(receipts.has("e2"), false);
    assert.equal(acknowledgements, 2);
    failEffect = false;
    failAck = true;
    await assert.rejects(consume({ ...record, eventId: "e2" }, database, broker), /ack failed/);
    assert.equal(effects, 2);
    failAck = false;
    await consume({ ...record, eventId: "e2" }, database, broker);
    assert.equal(effects, 2);
    assert.equal(acknowledgements, 3);
  }
  if (lesson.number === "0470") {
    const receive = runInNewContext(decode(code) + "\nreceive", { Response });
    const raw = Buffer.from("original bytes");
    let accepted = 0, failVerification = false, failDatabase = false;
    const stripe = { webhooks: { constructEvent(body, signature, secret, tolerance) {
      assert.equal(body, raw); assert.equal(signature, "signed");
      assert.equal(secret, "secret"); assert.equal(tolerance, 300);
      if (failVerification) throw new Error("invalid signature");
      return { id: "evt-1" };
    } } };
    const inbox = { async acceptVerifiedEvent(event) {
      if (failDatabase) throw new Error("database failed");
      assert.equal(event.id, "evt-1"); accepted++;
    } };
    const read = async (_request, limit) => { assert.equal(limit, 1_048_576); return raw; };
    const request = { headers: new Headers({ "stripe-signature": "signed" }) };
    assert.equal((await receive(request, stripe, "secret", inbox, read)).status, 204);
    failVerification = true;
    assert.equal((await receive(request, stripe, "secret", inbox, read)).status, 400);
    assert.equal(accepted, 1);
    failVerification = false; failDatabase = true;
    await assert.rejects(receive(request, stripe, "secret", inbox, read), /database failed/);
    assert.equal((await receive({ headers: new Headers() }, stripe, "secret", inbox, read)).status, 400);
  }
  if (lesson.number === "0471") {
    execFileSync(python, ["-I", "-c", decode(code) + `
from types import SimpleNamespace as NS
from contextlib import nullcontext
record = NS(key="quarantine/key", size=3, checksum="checksum")
queued, transitions = [], []
class Files:
    def require_owner(self, upload_id, owner): return record
    def accept_version(self, *args):
        if transitions: return False
        transitions.append(args)
        return True
class S3:
    version = "v1"
    def head_object(self, **args):
        assert args["ChecksumMode"] == "ENABLED"
        return {"VersionId": self.version, "ContentLength": 3, "ChecksumSHA256": "checksum"}
s3 = S3()
db = NS(files=Files(), transaction=nullcontext)
jobs = NS(insert_once=lambda key, value: queued.append((key, value)))
complete_upload(NS(id="owner"), "upload", s3, db, jobs)
complete_upload(NS(id="owner"), "upload", s3, db, jobs)
assert len(queued) == 1 and queued[0][1]["version_id"] == "v1"
s3.version = "null"
try: complete_upload(NS(id="owner"), "upload", s3, db, jobs)
except ValueError: pass
else: raise AssertionError("unversioned object accepted")
assert len(queued) == 1
`], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0472") {
    execFileSync(python, ["-I", "-c", decode(code) + `
from types import SimpleNamespace as NS
class RetryableError(Exception): pass
class PermanentError(Exception): pass
class LeaseLostError(Exception): pass
safe_error_code = lambda error: type(error).__name__
mode, owners, retried = "ok", [], []
def perform_idempotently(job):
    if mode == "retry": raise RetryableError("sensitive detail")
class DB:
    rowcount = 1
    def fetch_one(self, sql, params):
        owners.append(params["worker"])
        return NS(id="job", attempts=1)
    def execute(self, sql, job, owner):
        assert "lease_until > clock_timestamp()" in sql and owner == owners[-1]
        return NS(rowcount=self.rowcount)
    def retry_after(self, job, owner, delay, error): retried.append((owner, delay, error))
db = DB()
stopping = NS(is_set=lambda: False)
assert run_one(db, "worker", stopping)
assert run_one(db, "worker", stopping)
assert owners[0] != owners[1] and "worker" not in owners
db.rowcount = 0
try: run_one(db, "worker", stopping)
except LeaseLostError: pass
else: raise AssertionError("stale lease acknowledged")
mode = "retry"
run_one(db, "worker", stopping)
assert retried[-1] == (owners[-1], 2, "RetryableError")
assert not run_one(db, "worker", NS(is_set=lambda: True))
`], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0434") {
    const processPartition = runInNewContext(decode(code) + "\nprocessPartition");
    for (const mode of ["success", "handler-error", "commit-error"]) {
      const handled = [], committed = [], routed = [];
      const consumer = {
        async *records() {
          yield { partition: 0, offset: "9007199254740993" };
          yield { partition: 0, offset: "9007199254740994" };
        },
        async commit(partition, offset) {
          assert.equal(partition, 0);
          committed.push(offset);
          if (mode === "commit-error") throw new Error("commit failed");
        }
      };
      const work = processPartition(consumer, async record => {
        handled.push(record.offset);
        if (mode === "handler-error") throw new Error("handler failed");
      }, { route: async record => { routed.push(record.offset); } });
      if (mode === "success") await work;
      else await assert.rejects(work, /failed/);
      assert.equal(handled.length, mode === "success" ? 2 : 1);
      assert.deepEqual(committed, mode === "success" ? ["9007199254740994", "9007199254740995"] : mode === "commit-error" ? ["9007199254740994"] : []);
      assert.equal(routed.length, mode === "success" ? 0 : 1);
    }
  }
  if (lesson.number === "0382") {
    execFileSync(python, ["-I", "-c", decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0393") {
    const loadProject = runInNewContext(decode(code) + "\nloadProject");
    const project = { tenantId: 42, id: 7, version: 3 };
    for (const mode of ["hit", "negative", "miss", "corrupt", "wrong-version", "read-error", "write-error", "db-error", "db-wrong-version"]) {
      let reads = 0, writes = 0;
      const redis = {
        async get(key) {
          assert.equal(key, "project:[42,7,3]");
          if (mode === "read-error") throw new Error("cache unavailable");
          if (mode === "hit") return JSON.stringify(project);
          if (mode === "negative") return "null";
          if (mode === "corrupt") return "{";
          if (mode === "wrong-version") return JSON.stringify({ ...project, version: 2 });
          return null;
        },
        async set(key, value, options) {
          writes++;
          assert.equal(key, "project:[42,7,3]");
          assert.deepEqual(JSON.parse(value), project);
          assert.ok(options.EX >= 300 && options.EX < 360);
          if (mode === "write-error") throw new Error("cache unavailable");
        }
      };
      const database = { async findProjectVersion(...args) {
        reads++;
        assert.deepEqual(args, [42, 7, 3]);
        if (mode === "db-error") throw new Error("database unavailable");
        return mode === "db-wrong-version" ? { ...project, version: 4 } : project;
      } };
      const request = loadProject(42, 7, 3, redis, database);
      if (mode.startsWith("db-")) await assert.rejects(request, /database/);
      else assert.deepEqual(JSON.parse(JSON.stringify(await request)), mode === "negative" ? null : project);
      assert.equal(reads, ["hit", "negative"].includes(mode) ? 0 : 1);
      assert.equal(writes, ["hit", "negative", "db-error", "db-wrong-version"].includes(mode) ? 0 : 1);
    }
  }
  if (lesson.number === "0380") {
    // Adapter-contract checks only: not PostgreSQL execution or lock testing.
    const rename = runInNewContext(decode(code) + "\nrenameProject");
    const input = { tenant: 42, requestId: "r1", projectId: 7, name: "New", version: 1 };
    const result = { id: 7, version: 2 };
    const intent = JSON.stringify(["rename-v1", 7, "New", 1]);
    const scenarios = [
      { replies: [[{ request_id: "r1" }], [result], [], []], verbs: ["INSERT", "UPDATE", "INSERT", "UPDATE"] },
      { replies: [[], [{ intent, result }]], verbs: ["INSERT", "SELECT"] },
      { replies: [[], [{ intent: "changed", result }]], verbs: ["INSERT", "SELECT"], error: /key reused/ },
      { replies: [[{ request_id: "r1" }], []], verbs: ["INSERT", "UPDATE"], error: /version conflict/ },
      { replies: [[], []], verbs: ["INSERT", "SELECT"], error: /receipt unavailable/ }
    ];
    for (const scenario of scenarios) {
      const calls = [];
      const db = { transaction: async callback => callback({ query: async (sql, params) => {
        calls.push(sql.split(" ")[0]);
        assert.ok(params.includes(42), "tenant must be bound in every statement");
        assert.ok(calls.length <= scenario.replies.length, "unexpected write after rejected claim/update");
        return { rows: scenario.replies[calls.length - 1] };
      } }) };
      if (scenario.error) await assert.rejects(rename(db, input), scenario.error);
      else assert.equal(await rename(db, input), result);
      assert.deepEqual(calls, scenario.verbs);
    }
  }
  if (REUSE_PURPOSE[lesson.number]) assert.ok(decode(html).includes(REUSE_PURPOSE[lesson.number]), `${lesson.id}: missing distinct exercise`);
  if (lesson.trackId === "web-platform") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing browser checkpoint`);
    assert.ok(html.includes("Browser-only exercise:"), `${lesson.id}: missing browser scope`);
    if (lesson.number === "0053") {
      assert.match(decode(code), /\.back \{[^}]*height: 4rem/);
      assert.match(decode(code), /\.child \{[^}]*top: 3rem; height: 2rem/);
      assert.match(decode(code), /\.front \{[^}]*margin-top: -1rem; height: 2rem/);
      // Fixture-shape checks only: this does not execute CSS layout or painting.
    }
  }
  if (lesson.trackId === "systems-foundations") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing systems checkpoint`);
    assert.ok(html.includes("Core: run the local Python standard-library fixture"), `${lesson.id}: missing systems scope`);
  }
  if (lesson.trackId === "software-design") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing design checkpoint`);
    assert.ok(html.includes("Core and extension:"), `${lesson.id}: missing design scope`);
    assert.ok(html.includes("Trace a requirement-driven code change</h2>"), `${lesson.id}: unrelated trace subject`);
  }
  if (Number(lesson.number) <= 5) {
    assert.ok(html.includes("Core and extension:"), `${lesson.id}: missing bounded lab scope`);
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing specific interview feedback`);
    assert.ok(!html.includes("Treat the development environment like an airport"), `${lesson.id}: generic analogy returned`);
    if (["0003", "0005"].includes(lesson.number)) assert.ok(html.includes("The specification itself is not executable code."));
  }
  if (["0001", "0002"].includes(lesson.number)) {
    // Reviewed read-only shell experiments; no installs or repository changes.
    execFileSync("bash", ["--noprofile", "--norc", "-c", decode(code)], { cwd: root, timeout: 10000, stdio: "pipe", env: { ...process.env, GIT_PAGER: "cat", GIT_EXTERNAL_DIFF: "" } });
  }
  if (lesson.number === "0004") {
    execFileSync(process.execPath, ["--input-type=commonjs", "-e", decode(code)], { timeout: 1000, stdio: "pipe" });
  }
  if (["0228", "0229"].includes(lesson.number)) {
    const directory = await mkdtemp(join(tmpdir(), "lesson-gzip-"));
    try {
      const probe = `
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
await fs.writeFile("input", "café");
await fs.writeFile("output.gz.tmp", "unrelated");
await gzipFile("input", "output.gz");
assert.equal(gunzipSync(await fs.readFile("output.gz")).toString(), "café");
await assert.rejects(gzipFile("missing", "output.gz"));
await assert.rejects(gzipFile("input", "output.gz", AbortSignal.abort()));
assert.equal(gunzipSync(await fs.readFile("output.gz")).toString(), "café");
assert.equal(await fs.readFile("output.gz.tmp", "utf8"), "unrelated");
await Promise.all([gzipFile("input", "output.gz"), gzipFile("input", "output.gz")]);
assert.deepEqual((await fs.readdir(".")).sort(), ["input", "output.gz", "output.gz.tmp"]);
`;
      execFileSync(process.execPath, ["--input-type=module", "-e", decode(code) + probe], { cwd: directory, timeout: 10000, stdio: "pipe" });
    } finally { await rm(directory, { recursive: true, force: true }); }
  }
  if (lesson.number === "0497") {
    const template = JSON.parse(decode(code));
    assert.equal(template.Resources.Jobs.Type, "AWS::SQS::Queue");
    assert.equal(template.Resources.DeadLetters.Type, "AWS::SQS::Queue");
    assert.deepEqual(template.Resources.Jobs.Properties.RedrivePolicy, {
      deadLetterTargetArn: {"Fn::GetAtt":["DeadLetters", "Arn"]}, maxReceiveCount:5
    });
    assert.equal(template.Resources.Jobs.Properties.ReceiveMessageWaitTimeSeconds, 20);
  }
  if (lesson.number === "0505") {
    const probe = `
import ast
source = ${JSON.stringify(decode(code))}
module = ast.parse(source)
function = next(node for node in module.body if isinstance(node, ast.FunctionDef) and node.name == "text_answer")
exec(compile(ast.Module(body=[function], type_ignores=[]), "bedrock-text-boundary", "exec"))
def response(content, stop="end_turn"):
    return {"stopReason":stop, "output":{"message":{"content":content}}}
assert text_answer(response([{"text":"hello "}, {"text":"world"}])) == "hello world"
for invalid in [None, {}, response([]), response([{"text":" "}]), response([{"toolUse":{}}]), response([{"text":42}]), response([{"text":"partial"}], "max_tokens"), response([{"text":"blocked"}], "guardrail_intervened")]:
    try: text_answer(invalid)
    except ValueError: pass
    else: raise AssertionError("invalid completion accepted")
`;
    execFileSync(python, ["-I", "-c", probe], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0232") {
    const probe = `
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
const socket = new EventEmitter();
const written = [];
let paused = 0, resumed = 0, destroyed;
socket.setTimeout = () => {};
socket.pause = () => { paused++; };
socket.resume = () => { resumed++; };
socket.destroy = error => { destroyed = error; };
socket.write = bytes => { written.push(JSON.parse(bytes)); return written.length !== 1; };
server.emit("connection", socket);
socket.emit("data", Buffer.from("a\\nb\\n"));
assert.deepEqual(written, [{echo:"a"}]);
assert.equal(paused, 1);
socket.emit("drain");
assert.deepEqual(written, [{echo:"a"},{echo:"b"}]);
assert.equal(resumed, 1);
socket.emit("data", Buffer.from("part"));
socket.emit("data", Buffer.from("ial\\n"));
assert.deepEqual(written.at(-1), {echo:"partial"});
socket.emit("data", Buffer.alloc(4097));
assert.match(destroyed.message, /input buffer/);
server.close();
`;
    execFileSync(process.execPath, ["--input-type=module", "-e", decode(code) + probe], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0236") {
    const probe = `
import assert from "node:assert/strict";
const previousFetch = globalThis.fetch;
try {
  for (const [bytes, expected] of [[Buffer.from('{"name":"café"}'), {name:"café"}], [Buffer.from("[]"), null], [Buffer.from("null"), null], [Buffer.from("{"), null], [Buffer.from([255]), null], [Buffer.alloc(65), null]]) {
    globalThis.fetch = async (url, options) => {
      assert.equal(options.redirect, "error");
      return new Response(new ReadableStream({start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); }}));
    };
    if (expected) assert.deepEqual(await fetchJson("https://fixture.invalid", {maxBytes:64}), expected);
    else await assert.rejects(fetchJson("https://fixture.invalid", {maxBytes:64}));
  }
  let cancelled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({cancel(){cancelled=true;}}), {status:503});
  await assert.rejects(fetchJson("https://fixture.invalid"), /HTTP 503/);
  assert.equal(cancelled, true);
  globalThis.fetch = async () => { throw new Error("must not fetch"); };
  await assert.rejects(fetchJson("https://fixture.invalid", {signal:AbortSignal.abort()}), {name:"AbortError"});
  await assert.rejects(fetchJson("https://fixture.invalid", {maxBytes:0}), /byte limit/);
} finally { globalThis.fetch = previousFetch; }
`;
    execFileSync(process.execPath, ["--input-type=module", "-e", decode(code) + probe], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0237") {
    // Local event/callback contract only; no TLS certificates or listening sockets.
    const source = decode(code)
      .replace('import http2 from "node:http2";', `
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
let complete, expire;
const fakeTimeout = callback => { expire = callback; return 1; };
const fakeClearTimeout = () => {};
const http2 = {createSecureServer(options) {
  assert.equal(options.allowHTTP1, false);
  const fixture = new EventEmitter();
  fixture.close = callback => { complete = callback; };
  return fixture;
}};`)
      .replace('import { readFileSync } from "node:fs";', 'const readFileSync = () => "fixture";')
      .replace('setTimeout(', 'fakeTimeout(').replace('clearTimeout(', 'fakeClearTimeout(');
    for (const forced of [false, true]) {
      const probe = `
const session = new EventEmitter();
let closed = 0, destroyed = 0;
session.close = () => { closed++; };
session.destroy = () => { destroyed++; session.emit("close"); };
server.emit("session", session);
assert.equal(activeSessions.size, 1);
const pending = shutdown();
assert.equal(shutdown(), pending);
assert.equal(closed, 1);
if (${forced}) {
  expire();
  await assert.rejects(pending, /deadline/);
  assert.equal(destroyed, 1);
} else {
  session.emit("close"); complete(); await pending;
}
assert.equal(activeSessions.size, 0);
const late = new EventEmitter();
late.destroy = () => { destroyed++; };
const before = destroyed;
server.emit("session", late);
assert.equal(destroyed, before + 1);
`;
      execFileSync(process.execPath, ["--input-type=module", "-e", source + probe], { timeout: 10000, stdio: "pipe" });
    }
  }
  if (lesson.number === "0230") {
    const directory = await mkdtemp(join(tmpdir(), "lesson-atomic-write-"));
    try {
      const checks = '\nimport assert from "node:assert/strict";\nimport { readFile, readdir, mkdir } from "node:fs/promises";\nassert.deepEqual(JSON.parse(await readFile("state.json", "utf8")), { version: 1 });\nawait atomicWrite("state.json", "replacement");\nassert.equal(await readFile("state.json", "utf8"), "replacement");\nawait mkdir("blocked");\nawait assert.rejects(atomicWrite("blocked", "cannot replace directory"));\nassert.deepEqual((await readdir(".")).sort(), ["blocked", "state.json"]);';
      execFileSync(process.execPath, ["--input-type=module", "-e", decode(code) + checks], { cwd: directory, timeout: 10000, stdio: "pipe" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
  if (["0246", "0250", "0251", "0252", "0403", "0405", "0414", "0426", "0427", "0428", "0429", "0430", "0431", "0447", "0453", "0473"].includes(lesson.number)) {
    execFileSync(process.execPath, ["--input-type=module", "-e", decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (["0622", "0623", "0624", "0626", "0627", "0628", "0629", "0630", "0631", "0632", "0633", "0634", "0635", "0636", "0637", "0638", "0639", "0640", "0641", "0642", "0643", "0644"].includes(lesson.number)) {
    execFileSync(process.execPath, ["--input-type=module", "-e", 'import { ok as reviewAssert } from "node:assert/strict"; console.assert = reviewAssert;\n' + decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (["0220", "0222", "0223", "0224", "0225", "0226", "0118", "0119", "0120", "0254"].includes(lesson.number)) {
    execFileSync(process.execPath, ["--input-type=module", "-e", 'import { ok as reviewAssert } from "node:assert/strict"; console.assert = reviewAssert;\n' + decode(code)], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0247") {
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const probe = `
import assert from "node:assert/strict";
assert.ok((await inspectRevision(${JSON.stringify(revision)})).length > 0);
await assert.rejects(inspectRevision("--help"), /invalid/);
await assert.rejects(inspectRevision("abcdef0\\n"), /invalid/);
await assert.rejects(inspectRevision("0".repeat(40)));
await assert.rejects(inspectRevision(${JSON.stringify(revision)}, AbortSignal.abort()), {name:"AbortError"});
`;
    execFileSync(process.execPath, ["--input-type=module", "-e", decode(code) + probe], { cwd: root, timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0248") {
    const directory = await mkdtemp(join(tmpdir(), "lesson-worker-"));
    try {
      await writeFile(join(directory, "worker.mjs"), `
import { parentPort, workerData } from "node:worker_threads";
if (workerData === "success") parentPort.postMessage(42);
if (workerData === "error") throw new Error("worker fixture failure");
if (workerData === "hang") setInterval(() => {}, 1000);
`);
      await writeFile(join(directory, "probe.mjs"), decode(code) + `
import assert from "node:assert/strict";
assert.equal(await runWorker("success", AbortSignal.timeout(5000)), 42);
await assert.rejects(runWorker("error", AbortSignal.timeout(5000)), /worker fixture failure/);
await assert.rejects(runWorker("empty", AbortSignal.timeout(5000)), /before result: 0/);
await assert.rejects(runWorker("hang", AbortSignal.timeout(100)), {name:"TimeoutError"});
`);
      execFileSync(process.execPath, [join(directory, "probe.mjs")], { timeout: 10000, stdio: "pipe" });
    } finally { await rm(directory, { recursive: true, force: true }); }
    // Exercise the wrapper's lifecycle, not real worker scheduling or isolation.
    const source = decode(code).replace('import { Worker } from "node:worker_threads";', `
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
let latest;
class Worker extends EventEmitter {
  constructor() { super(); latest = this; this.stopped = false; }
  async terminate() { this.stopped = true; if (this.failure) throw this.failure; }
}`);
    const probe = `
await assert.rejects(runWorker(1, AbortSignal.abort()));
assert.equal(latest, undefined);
const success = runWorker(1, new AbortController().signal);
latest.emit("message", 42);
assert.equal(await success, 42);
assert.equal(latest.stopped, true);
const exited = runWorker(1, new AbortController().signal);
latest.emit("exit", 0);
await assert.rejects(exited, /before result/);
const controller = new AbortController();
const aborted = runWorker(1, controller.signal);
controller.abort(false);
await assert.rejects(aborted, reason => reason === false);
const failed = runWorker(1, new AbortController().signal);
latest.failure = new Error("termination failed");
latest.emit("message", 42);
await assert.rejects(failed, /termination failed/);
`;
    execFileSync(process.execPath, ["--input-type=module", "-e", source + probe], { timeout: 10000, stdio: "pipe" });
  }
  if (lesson.number === "0235") {
    const probe = `
import assert from "node:assert/strict";
const handler = server.listeners("request")[0];
for (const [bytes, status] of [[Buffer.from('{"name":" Demo "}'),200], [Buffer.from("null"),422], [Buffer.from("[]"),422], [Buffer.from("{bad"),400], [Buffer.from([255]),400], [Buffer.alloc(65537),413]]) {
  let observed;
  await handler({method:"POST",url:"/projects",async *[Symbol.asyncIterator](){yield bytes;}}, {writeHead(code){observed=code;return this;},end(){}});
  assert.equal(observed,status);
}
server.close();
`;
    execFileSync(process.execPath, ["--input-type=module", "-e", decode(code) + probe], { timeout: 10000, stdio: "pipe" });
  }
  if (["0244", "0245"].includes(lesson.number)) {
    assert.throws(() => execFileSync(process.execPath, ["--unhandled-rejections=strict", "--input-type=module", "-e", decode(code)], { timeout: 10000, stdio: "pipe" }), error => error.status === 1 && /controlled fixture failure/.test(String(error.stderr)));
  }
  if (["0111", "0113", "0117", "0118", "0119", "0120", "0121"].includes(lesson.number)) {
    execFileSync(process.execPath, ["--input-type=module", "-e", 'import { ok } from "node:assert/strict"; console.assert = ok;\n' + decode(code)], { timeout: 10000, stdio: "pipe" });
    javascriptChecks.push(lesson.number);
  }
  if (["0080", "0081", "0083", "0084", "0085", "0086", "0087", "0088", "0089", "0090", "0091", "0092", "0093", "0094", "0095", "0096", "0097", "0098", "0099", "0100", "0101", "0102", "0103", "0106", "0107", "0108", "0109", "0112", "0114", "0115", "0122", "0123"].includes(lesson.number)) {
    const prelude = 'import { ok as reviewAssert } from "node:assert/strict"; console.assert = reviewAssert;\n';
    const probe = {
      "0091": `console.assert(account.read.length===0);console.assert(account.read(null)==="null:40");`,
      "0092": `let failed=false;try{detached();}catch(e){failed=e instanceof TypeError;}console.assert(failed);const Bound=Account.bind({balance:0});console.assert(new Bound(7).balance===7);`,
      "0095": `let failed=false;try{AuditedLedger.created;}catch(e){failed=e instanceof TypeError;}console.assert(failed);for(const n of [NaN,1.5,Number.MAX_SAFE_INTEGER]){let rejected=false;try{ledger.add(n);}catch{rejected=true;}console.assert(rejected && ledger.balance===4200);}`,
      "0099": `let cleaned=0;function* owned(){try{yield 1;}finally{cleaned++;}}for(const x of owned()){break;}console.assert(cleaned===1);`,
      "0100": `let entered=false;function* unopened(){try{entered=true;yield 1;}finally{entered=true;}}const u=unopened();console.assert(u.return(7).done && !entered);`
    }[lesson.number] ?? "";
    execFileSync(process.execPath, ["--input-type=module", "-e", prelude + decode(code) + "\n" + probe], { timeout: 10000, stdio: "pipe" });
    javascriptChecks.push(lesson.number);
  }
  if (lesson.trackId === "react") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.number}: missing React feedback`);
    assert.ok(html.includes("not standalone files"), `${lesson.number}: missing integration scope`);
    if (lesson.number === "0177") runInNewContext(decode(code).split("function Wizard")[0] + `
      const answered=reducer(initialState,{type:"answered",value:"yes"});
      if(initialState.answers[0]!==undefined || answered.answers[0]!=="yes" || reducer(answered,{type:"undo"})!==initialState) throw new Error("reducer ownership/undo failed");
    `);
    if (lesson.number === "0178") assert.ok(decode(code).includes("selectedId={selected?.id ?? null}"));
    if (lesson.number === "0183") assert.ok(decode(code).includes('position: "fixed", left: anchorRect.left'));
    if (lesson.number === "0194") assert.ok(decode(code).includes('.catch(() => {})'));
    if (lesson.number === "0203") assert.ok(html.includes("Trace a render and commit cycle</h2>"));
  }
  if (lesson.trackId === "computer-science") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing algorithm checkpoint`);
    assert.ok(html.includes("Trace an algorithm execution</h2>"), `${lesson.id}: unrelated algorithm trace`);
    const probe = {
      "0023": `console.assert(lowerBound([1,2,2,5],6)===4); const huge=new Proxy({length:2**31+2},{get:(target,key)=>key==="length"?target.length:Number(key)}); console.assert(lowerBound(huge,2**31)===2**31);`,
      "0025": `console.assert(reverse(null)===null);const loop={next:null};loop.next=loop;console.assert(hasCycle(loop));const a={value:1,next:{value:2,next:null}};const b=reverse(a);console.assert(b.next===a && a.next===null);`,
      "0026": `console.assert(!isValidBst({value:10,left:{value:5,right:{value:12}}}));console.assert(breadthFirst(null).length===0);`,
      "0027": `console.assert(topologicalOrder(graph,new Map([["a",0],["b",1],["c",1]])).join()==="a,b,c");let failed=false;try{topologicalOrder(new Map([["a",["b"]],["b",["a"]]]),new Map([["a",1],["b",1]]));}catch{failed=true;}console.assert(failed);`,
      "0028": `console.assert(JSON.stringify(uniquePermutations([]))==="[[]]");console.assert(uniquePermutations([2,2]).length===1);`,
      "0029": `console.assert(minimumCoins([2],3)===undefined);console.assert(minimumCoins([],0).count===0);`,
      "0031": `console.assert(countBits32(-1)===32);console.assert(countBits32(0)===0);console.assert((1<<32)===1);console.assert(hasFlag(addFlag(0,31),31));`,
      "0032": `console.assert(targetPair([3],6)===undefined);console.assert(targetPair([3,3],6).join()==="0,1");`,
      "0033": `console.assert(sortedPair([],1).indices===undefined);console.assert(sortedPair([3,3],6).indices.join()==="0,1");`,
      "0034": `console.assert(longestDistinct("abba").best===2);console.assert(longestDistinct("").best===0);`,
      "0035": `const n=10;const out=nextGreater(Array.from({length:n},(_,i)=>n-i));console.assert(out.trace.reduce((s,t)=>s+t.unresolved.length,0)===n*(n+1)/2);console.assert(nextGreater([2,2]).answer.join()==="-1,-1");`,
      "0037": `for(const k of [0,-1,1.5,4,NaN]){let failed=false;try{kthLargest([1,2,3],k);}catch{failed=true;}console.assert(failed);}console.assert(kthLargest([3,3,1],2).value===3);`,
      "0039": `console.assert(countRegions([]).regions===0);console.assert(countRegions([[0]]).regions===0);`,
      "0044": `console.assert(spreadMinutes([]).minutes===0);console.assert(spreadMinutes([[1]]).minutes===-1);console.assert(spreadMinutes([[2,1,2]]).minutes===1);`,
      "0045": `const t=new Trie();console.assert(!t.has(""));t.insert("");console.assert(t.has(""));`,
      "0046": `console.assert(countTargetSubarrays([0,0],0).total===3);`,
      "0047": `for(const [input,want] of [[[],""],[[[]],""],[[[1,2,3]],"1,2,3"],[[[1],[2],[3]],"1,2,3"]])console.assert(spiral(input).output.join()===want);`,
      "0048": `console.assert(mergeIntervals([[1,2],[2,3]]).merged[0].join()==="1,3");const n=10;console.assert(mergeIntervals(Array.from({length:n},(_,i)=>[3*i,3*i+1])).trace.reduce((s,t)=>s+t.length,0)===n*(n+1)/2);`
    };
    for (const [target, source] of [["0038","0023"],["0036","0025"],["0042","0027"],["0043","0028"],["0041","0029"],["0049","0031"]]) probe[target] = probe[source];
    let checks = 0;
    runInNewContext(decode(code) + "\n{\n" + (probe[lesson.number] || "") + "\n}", { console: {
      assert(value) { checks += 1; assert.ok(value, `${lesson.number}: algorithm assertion failed`); },
      log() {}, table() {}
    } }, { timeout: 1000 });
    assert.ok(checks > 0, `${lesson.number}: algorithm example must execute an assertion, not merely define a helper`);
    algorithmChecks.push({ number: lesson.number, checks });
  }
  if (lesson.trackId === "lld-machine-coding") {
    assert.ok(html.includes("Worked answer criteria:"), `${lesson.id}: missing machine-coding checkpoint`);
    const probe = {
      "0068": `
for value in (True, 1.5, float("nan"), 0):
    try: Capacity(value)
    except ValueError: pass
    else: raise AssertionError("invalid capacity")
capacity.release()
assert capacity.used == 0
try: capacity.release()
except RuntimeError: pass
else: raise AssertionError("empty release")`,
      "0071": `
for value in (True, 1.5, float("nan"), -1):
    try: checkout(value, fake)
    except ValueError: pass
    else: raise AssertionError("invalid cents")
assert fake.charges == [2500]`,
      "0072": `
assert fee(0, 100) == 100 and fee(0, 100, first_hour_free) == 0
for hours, rate in ((True, 100), (1.5, 100), (1, float("nan"))):
    try: fee(hours, rate)
    except ValueError: pass
    else: raise AssertionError("invalid pricing units")`,
      "0074": `
for value in (None, "", " "):
    fresh = Seat()
    try: fresh.reserve(value)
    except ValueError: pass
    else: raise AssertionError("invalid owner")
    assert fresh.owner is None`,
      "0075": `
class FailingEvents(list):
    def append(self, event): raise RuntimeError("injected append failure")
partial = BookingRepository()
try: create_booking("partial", partial, FailingEvents())
except RuntimeError: pass
else: raise AssertionError("failure not propagated")
assert "partial" in partial.items`,
      "0077": `
try: ParkingLot([Spot(1, "car"), Spot(1, "bike")])
except ValueError: pass
else: raise AssertionError("duplicate spot number")
for vehicle in (None, "", " "):
    try: lot.park(vehicle, "car")
    except ValueError: pass
    else: raise AssertionError("invalid vehicle")
assert all(spot.vehicle is None for spot in lot.spots)`,
      "0079": `
for value in (True, 1.5, float("nan"), 0):
    try: LRUCache(value)
    except ValueError: pass
    else: raise AssertionError("invalid cache capacity")
history = deque([0.0, 1.0])
assert allow(history, 10.0, 2, 10.0) and list(history) == [1.0, 10.0]`
    }[lesson.number] || "";
    // These reviewed examples use only local in-memory stdlib operations.
    execFileSync(python, ["-I", "-c", decode(code) + "\n" + probe], { timeout: 10000, stdio: "pipe" });
    machineCodingChecks.push(lesson.number);
  }
  if (["ml-foundations", "llm-internals"].includes(lesson.trackId) || lesson.number === "0492") {
    execFileSync(python, ["-I", "-c", decode(code)], { timeout: 10000, stdio: "pipe" });
    numericalChecks.push(lesson.number);
  }
  if (lesson.trackId === "typescript") {
    assert.equal(missing.length, 0, `${lesson.id}: TypeScript definitions regressed`);
    assert.ok(html.includes('id="typescript-review"'), `${lesson.id}: missing review checkpoint`);
    assert.ok(typescriptReviewFor(lesson).every(value => typeof value === "string" && value.length > 20), `${lesson.id}: incomplete teaching review`);
  }
  if (lesson.number === "0082") {
    let checks = 0;
    runInNewContext(decode(code), { console: {
      assert(value) { checks += 1; assert.ok(value); },
      table() {}
    } }, { timeout: 1000 });
    assert.equal(checks, 3, "primitive-values lab must exercise all three identity/copy assertions");
  }
  const codeKey = `${lesson.trackId}\n${code}`;
  const group = codeGroups.get(codeKey) || [];
  group.push(lesson.number);
  codeGroups.set(codeKey, group);
  const item = SENIOR_CASES[lesson.trackId];
  assert.ok(item?.scenario && item.reasoning && item.followup && item.signals, `${lesson.id}: missing authored senior practice`);
  assert.ok(html.includes(`senior-interview-practice.html#${lesson.trackId}`), `${lesson.id}: missing senior reference`);
  assert.ok(reference.includes(`id="${lesson.trackId}"`), `${lesson.id}: broken senior reference anchor`);
  assert.ok(html.includes("Do not infer mastery"), `${lesson.id}: handoff must not overstate evidence`);
  rows.push({ ...lesson, path, missing, codeKey, terms: terms.length });
}

const missingCount = rows.reduce((sum, row) => sum + row.missing.length, 0);
const missingLessons = rows.filter(row => row.missing.length).length;
const sharedLessons = rows.filter(row => codeGroups.get(row.codeKey).length > 1).length;
const unresolvedReuse = rows.filter(row => codeGroups.get(row.codeKey).length > 1 && !REUSE_PURPOSE[row.number] && row.trackId !== "typescript");
assert.equal(unresolvedReuse.length, 0, "Every reused starter needs a reviewed, lesson-specific exercise");
const lines = [
  "# Curriculum content review — senior full-stack AI engineering",
  "",
  "Target confirmed by the learner: senior interviews, around ten years of experience. Review updated: 2026-09-11.",
  "",
  "## Verdict",
  "",
  "See [the per-lesson review checklist](REVIEW-CHECKLIST.md) for exact recorded-pass, pending and changed-content counts. The checklist separates content sign-off from integrations and live deployment; this report's structural audit does not automatically close a lesson.",
  "",
  "The curriculum-wide definition and shared-starter review pass is complete: generic title-term definitions are replaced, every retained reused starter has a distinct exercise, and unrelated generic starters have been replaced by concrete experiments or explicitly scoped integration assignments. This remains a depth library, not a fully executed or certified senior interview course. An experiment specification is not a supplied working application.",
  "",
  `All ${rows.length} generated lesson files across ${manifest.tracks.length} tracks were inspected by the content audit for term definitions, starter-code reuse, and senior-practice links. The curriculum topics, generator's shared teaching paths, representative explanations, and selected technical claims received manual review. This is not a line-by-line factual certification of every explanation, nor an execution test of every embedded lab. The appendix records a result for every lesson; absence of an automated flag is not a quality pass.`,
  "",
  "## Findings and changes",
  "",
  "Copy-boundary review (2026-09-10): all 644 starter blocks keep prediction/observation annotations outside code; SQS JSON parses without stripping comments. Kubernetes YAML no longer includes executable shell diagnostics. Specialized DevOps/Docker/Kubernetes starters now distinguish integration recipes and pseudocode from supplied executables, explain rollout gates, secret-bearing Terraform plans, rootless daemon versus non-root container, additive NetworkPolicy/DNS requirements, HPA CPU requests and rollout-deadline limits. The shell digest guard executes offline valid/invalid cases without invoking deployment adapters. No infrastructure integration ran.",
  "",
  "1. **Assessment does not establish knowledge.** All 644 lessons originally used the same three orientation answers and claimed mastery after the obvious choice. The current progress interaction is explicitly labelled as orientation only, and the handoff no longer claims practical work was completed. Written rehearsal, a reasoning checkpoint, and 28 authored track cases now add feedback and changed constraints. Replacing the progress mechanism with written self-assessment remains a learner choice.",
  `2. **Placeholder definitions replaced throughout the catalog.** The initial complete audit found 1,892 generic fallback definitions in 458 lessons. Exact corrections and shared vocabulary now leave ${missingCount} fallback definitions in ${missingLessons} lessons. The audit prevents their reintroduction across all 644 lessons. Concrete wording is not itself proof of factual correctness or sufficient depth; contextual review still matters.`,
  "3. **Loose matching selected the wrong subject.** A term such as TypeScript's `in` could match unrelated catalog text. Exact definitions now take priority, and fallback matching uses the longest whole phrase. All 46 JavaScript lessons now have concrete definitions for their title-level terms. Primitive values and async functions have dedicated mechanism traces rather than inheriting property-lookup or lexical-binding traces. Broader diagram routing still deserves lesson-specific review.",
  "Quality/reliability follow-up: 0465–0469 now link to topic-specific testing, threat-modeling, supply-chain and SLO sources instead of a single ASVS landing page. 0469 executes synthetic event-budget threshold, invalid/no-data and unequal-traffic aggregation checks. It distinguishes whole-window consumption from burn-rate alerting and does not verify production telemetry or incident response.",
  `4. **Starter reuse is now intentional and scoped.** Initially 230 lessons shared an identical starter. Currently ${sharedLessons} retain shared mechanisms, each with reviewed lesson-specific practice and limits; ${unresolvedReuse.length} reuse cases remain unexplained. Infrastructure, advanced React, AI and capstone placeholders now give concrete setup, a changed condition and expected evidence where a ready-made implementation is not supplied. These assignments still require the learner's implementation and appropriate environment.`,
  "5. **Senior reasoning needed a worked example.** Every track now has a concrete scenario, a reasoned answer, a changed constraint, feedback criteria, and a primary-source link. Lessons link to their track's case rather than repeating the full case in 644 pages. These cases supplement the topic-specific exercises; they are not 644 individually authored interview answers.",
  "6. **Repeated introductory prose added reading cost.** Removed the four generic input/state/mechanism/tradeoff cards from every lesson. Retained a short entry explanation, the term guide, and the underlying code. Reading estimates now explicitly exclude implementation and interview practice.",
  "7. **The schedule cannot represent exhaustive mastery.** At 6–8 hours/week, 24 weeks provides 144–192 hours. Even 644 readings of 15 minutes consume 161 hours before labs and projects. The senior reference recommends a diagnostic-led core with deep extensions. Selecting a numbered core sequence still needs target-role emphasis and evidence of the learner's actual gaps.",
  "",
  "## Executed examples",
  "API authorization/verification follow-up: 0416/0418 execute allow/deny and writable-field cases; 0419 checks bounded metric labels; 0420 executes frozen-dataset pagination and a missing-tie-breaker counterexample with node:test. These checks do not verify token authentication, SSRF transport controls, audit durability, live cursor security or API compatibility. 0443 executes fixed-set quorum intersection and a sloppy-placement counterexample; 0449 executes validated local endpoint selection and unavailable/invalid snapshot cases. Neither implements a replication protocol or live service discovery.",
  "API follow-up: 0407/0408/0437/0440/0442/0444/0445/0446/0452 execute local assertions for parameterized filter construction, scripted compatibility, quarantine classification, prepared-decision dispatch, vector-clock reconciliation, a two-operation consistency counterexample, CAP history, tiny-ring movement and event replay. Lesson 0410 parses as JSON. These are narrowly scoped checks, not a full query engine, linearizability checker, event store, replication protocol or live API. Exact primary sources now accompany consistency, CAP, prepared transactions, Dynamo-style versioning and CQRS.",
  "LLM benchmark 0614 executes deterministic fixture assertions for per-slice failures, failed calls, unknown costs, malformed costs and repetition limits. Retained records distinguish independent cases from repeated attempts; score standard deviation is not presented as statistical confidence. No model provider was called. AI ingestion/security and frontend testing/input/security diagrams have dedicated routing checks; browser behavior remains unexecuted.",
  "PostgreSQL follow-up: the deadlock/serialization retry adapter executes offline success, retry exhaustion, nonretryable-error and bound checks. SQL starters received execution-context, generated-expression, snapshot-session, invariant-recheck, replication-slot and hybrid-ranking corrections. The SQL text guard rejects shell/INI contamination; it is not a SQL parser or PostgreSQL integration test. No database server or extension was installed or run.",
  "Node follow-up: both gzip starters execute owned-staging success/failure/cancellation/concurrent-replacement checks. HTTP/2 session tracking, normal drain, forced deadline and late-session rejection use event adapters, not TLS. Fetch checks cover split UTF-8, object-only JSON, size limits, errors, cancellation and body disposal without network requests. TCP framing checks pause after a false write result and drain buffered frames before resuming; they use a socket fake. The local queue deliberately demonstrates two failures with assertions; it is not a deployable queue. The Node test-runner cancellation fixture executes. A cross-track diagram regression matrix includes PostgreSQL EXPLAIN, pooling, access, diagnostics and infrastructure troubleshooting; these checks do not establish every diagram's factual completeness.",
  "AWS follow-up: 0497 parses its CloudFormation JSON and verifies the queue/redrive relationship locally. Lesson 0505 extracts and executes the text-only response validator against completed, partial, tool, guardrail and malformed fixtures; no boto3 import, credentials or model calls are used. S3 version-deletion and custom CloudWatch burn-metric assumptions were corrected. No AWS resources were created or changed.",
  "",
  "Systems foundations 0056–0067: all 12 offline Python experiments execute. Fixed invalid scheduler progress, self-transfer deadlock, amount validation, truncated UDP headers, per-RTT versus per-ACK congestion wording, zero-capacity replacement and unique temporary-file cleanup. Five examples have mechanism-specific diagrams. Local file replacement is not a power-loss durability test.",
  "The separate TypeScript check command additionally compiles/executes 12 software-design snippets, four service/domain snippets and the custom streaming fixture (0591). Its original 26 TypeScript-track checks remain unchanged. Reservation/transaction tests use local fakes. The streaming checks cover split UTF-8, retained IDs, incomplete/invalid frames, a buffer ceiling and early cancellation; the LF-only JSON fixture is explicitly not a complete SSE or AI SDK implementation.",
  "Security operations: 0470 verifies SDK/HTTP adapter plumbing, not Stripe cryptography; 0471 checks accepted upload-version propagation/replay with fakes, not S3; 0472 checks attempt-specific lease identity and stale acknowledgment rejection, not SQL leases. Lesson 0473 executes audit hashing/tamper-input checks while preserving exact stored payload bytes. Real authorization, concurrency, scan/promotion, audit anchoring and recovery remain integration requirements.",
  "AI/agents: 0589/0600/0603/0604 execute tool-intent replay, exact-neighbor recall/dimension bounds, scripted control-loop limits and goal-preserving context selection. Lesson 0607 runs malformed/valid newline-frame checks for its explicitly partial MCP dispatcher; it is not a conforming server certification. A function extracted from 0606 checks explicit boolean approval and model attribute access without executing LangGraph/Pydantic. Other provider/framework examples remain source-reviewed integration sketches.",
  "Interview track: all 22 JavaScript planning/rehearsal snippets execute, with throwing assertions where present (some are smoke-only); the remaining lesson is a Markdown profile template. Fixed the generated résumé digit regex, exact-host screening, numeric top-k scope, one-time versus recurring offer arithmetic and fictional-evidence labels. Removed unsupplied interview/recording/demo helpers; the pair-sum rehearsal checks distinct-index behavior. The mock-interview planner distinguishes demonstrated, needs-practice and unobserved criteria; it organizes human evidence, not automatic interview grades. No live job, compensation, immigration, employer-process or learner-achievement claims are inferred from these fixtures.",
  `Python track: ${pythonTrackChecks.length} single-file snippets execute with the installed interpreter; some are smoke checks, not complete function/branch coverage. All 41 Python-format starters parse. Multi-file imports, spawned workers, native extensions, packaging and the external image-conversion command remain unexecuted. Lesson 0302 additionally checks service replay, changed intent and failed commit with a sequential fake, not a database.`,
  "FastAPI: all 42 Python-format starters receive AST syntax checks only; framework packages are unavailable and were not installed. Lesson 0331 additionally runs framework-free ASGI body-limit cases for chunked input, lying Content-Length, compressed input, empty bodies, disconnect and invalid configuration. Authentication, SQLAlchemy, WebSocket/SSE, framework cancellation and HTTP integration remain unexecuted.",
  "API lessons 0403/0405/0414/0447/0453 execute boundary parsing, strong If-Match comparison, custom webhook signature checks, a deliberately partial Raft precheck and mean-latency sizing assertions. The saga callback (0439) checks awaited write ordering/failure; the service-architecture Kafka batch checks empty/mixed/failed batches and large offsets with scripted adapters. These do not verify database rollback, consensus, broker delivery or network security.",
  "API lesson 0431 executes half-open probe admission and completion checks; it is not a complete circuit-breaker implementation. Lesson 0435 uses a sequential transaction fake to check duplicate suppression, changed-intent rejection, failed effects and replay after acknowledgment failure. Real inbox isolation, crash durability and broker acknowledgment semantics remain integration requirements. Lesson 0433's trace example and delivery-ownership explanation were corrected.",
  "API lessons 0426/0427/0430 now execute logical-clock, synthetic-latency and admission-control assertions. These cover concurrency versus equality, missing outcomes and percentile input bounds, overload rejection and slot restoration after errors. They do not establish real load capacity, distributed clock safety or fleet-wide admission guarantees.",
  "API lessons 0428/0429 execute Node deadline/retry self-checks, including expired and cancelled work, invalid limits and retry admission. Lesson 0434 runs three broker-adapter scenarios for success, handler failure and commit failure, checking that processing stops before a later offset can skip failed work and that large offsets retain precision. These are local checks, not Kafka integration, remote cancellation or load tests. Lesson 0436 received the corresponding offset-precision correction.",
  "Redis starters 0381–0395 have received targeted review across the follow-up batches. Data-structure and benchmark lessons now specify initial state, expected values, load limits and measurement caveats. Only the offline protocol and cache-adapter checks execute locally; no Redis server behavior or benchmark results are claimed.",
  "Lesson 0382 executes offline Python RESP encoding assertions for ASCII, multibyte text, binary CRLF, empty payloads and invalid input. Redis protocol, cluster and ACL lessons 0382/0391/0395 now have example-specific diagrams. Cluster/ACL commands remain source-reviewed but unexecuted; no Redis software was installed.",
  "Lesson 0393 has nine executed cache-adapter scenarios covering hits, negative hits, misses, malformed data, wrong versions and cache/database failures. Scripted adapters do not verify Redis TTL timing, failover or real database reads. Redis lessons 0386/0387/0389/0390/0392/0394 additionally received source-based safety corrections and explicit counterexamples; their server commands were not executed.",
  "Lesson 0380 additionally has five executed adapter-contract checks for successful writes, replay, mismatched intent, stale updates and missing receipts. These use scripted query responses, not PostgreSQL: they verify branching, not SQL syntax, locks, transaction rollback or concurrency. Lesson 0396 specifies the corresponding real-database failure experiments. No software installations are authorized.",
  `The runner additionally executes ${javascriptChecks.length} selected JavaScript module/test examples with throwing assertions, three benchmark examples with a correctness assertion, Buffer, timer, EventEmitter, UTF-8 transform and readable-cleanup examples, Node shutdown, URL-policy and event-loop measurement checks, and two deliberately failing child-process examples. HTTP parsing uses request/response fakes; child execution uses read-only Git. Worker lifecycle checks include actual local threads for success, throw, empty exit and deadline termination, plus adapter-only edge cases. These checks do not cover worker pools, transfers, shared-memory races or process isolation. They ran on Node ${process.version}; newer language/host features need a compatible runtime.`,
  `All ${numericalChecks.filter(number => number !== "0492").length} ML/LLM numerical examples and the Lambda/SQS batch algorithm (0492) run with Python assertions. These are deliberately small mechanism experiments, not trained models or provider integrations. Foundations 0001/0002 run read-only Bash/Git checks and 0004 runs Node assertions; 0003 is a dependency-install experiment specification and 0005 is a worked decision record, not an executed deployment.`,
  `The review command executes ${algorithmChecks.length} computer-science examples: ${algorithmChecks.filter(item => item.checks).length} contain throwing assertions and ${algorithmChecks.filter(item => !item.checks).length} are smoke checks only. It also executes all ${machineCodingChecks.length} low-level-design Python examples with their assertions, plus the JavaScript primitive-values example. Quickselect mutation, a two-pointer trace expectation, and non-finite money inputs were corrected. The repository example now explicitly distinguishes an in-memory event append from a transactional outbox.`,
  "",
  "Python examples require Python 3.12+ without optimization flags. Set LESSON_PYTHON to the interpreter executable if python3 is older. These small local tests do not establish concurrency scalability, production safety, or integration correctness.",
  "",
  "## Senior standard",
  "",
  "A ready lesson should let the learner explain a concrete mechanism, work through an example with expected results, identify a counterexample, compare a plausible alternative, and defend the choice after a constraint changes. Include operational or delivery consequences where relevant; do not force distributed-system vocabulary into a simple language exercise. Senior behavioral evidence should show personal scope, influence, mentoring, honest outcomes, and reflection.",
  "",
  "The teach skill informed the entry explanation → attempt → feedback → delayed retrieval structure. The new case studies are original exercises grounded in the linked primary sources; they are not employer questions or universal hiring rubrics. [Amazon's senior preparation](https://www.amazon.jobs/content/en/how-we-hire/sde-iii-interview-prep) is one example of employer expectations, not a prediction of every company's process.",
  "",
  "See [senior practice and glossary](reference/senior-interview-practice.html) for the worked cases and self-review rubric.",
  "The [complete TypeScript content-review pass](TYPESCRIPT-CONTENT-REVIEW.md) covers all 45 TypeScript lessons, with concrete definitions and explicit verification limits. Run `node scripts/check-typescript-lessons.mjs` for the 26 selected compiler/runtime checks; the track's integration exercises are not automatically certified.",
  "",
  "## Track review",
  "",
  "| Track | Lessons | Lessons with definition gaps | Review and next content work |",
  "| --- | ---: | ---: | --- |"
];
for (const track of manifest.tracks) {
  const group = rows.filter(row => row.trackId === track.id);
  lines.push(`| [${cell(track.title)}](reference/senior-interview-practice.html#${track.id}) | ${group.length} | ${group.filter(row => row.missing.length).length} | ${cell(SENIOR_CASES[track.id].gap)} |`);
}
lines.push("", "## How to close the remaining gaps", "",
  "- Preserve zero fallback definitions and check context-sensitive meanings. Broker partitions and HTTP/2 sessions now have routing regression checks to prevent unrelated definitions being substituted.",
  "- For each reused starter, either explain its distinct purpose in this lesson or replace it with a topic-specific runnable experiment. Supply setup, expected output, and a failing case. Label illustrative fragments and external dependencies honestly.",
  "- Review each diagram against the actual code and lesson objective; matching a keyword does not prove that the diagram teaches the right mechanism.",
  "- Add topic-specific answer criteria and plausible misconceptions. Keep reference depth separate from the short learning path; do not add more headings as a substitute for explanation.",
  "- Pin or record runtime/framework versions for labs, then run them in their required environments. Language, SQL, browser, cloud, and framework examples cannot all be certified by compiling the HTML's navigation script.",
  "", "## Per-lesson audit", "",
  "Every lesson has the senior rehearsal and a linked worked track case. The table below reports remaining structural content concerns. **Review lab and explanation** means no fallback/reuse flag was found; it does not mean the lesson has been technically certified. Shared-starter numbers refer to exact matches within the same track, excluding the generated lesson-title comment.",
  "", "| Lesson | Definition gaps | Starter review |", "| --- | --- | --- |");
for (const row of rows) {
  const shared = codeGroups.get(row.codeKey).filter(number => number !== row.number);
  const purpose = REUSE_PURPOSE[row.number] || (row.trackId === "typescript" ? typescriptReviewFor(row)[2] : "");
  lines.push(`| [${row.number} · ${cell(row.title)}](${row.path}) | ${row.missing.length ? cell(row.missing.join(", ")) : "None detected"} | ${shared.length ? `Shared with ${shared.join(", ")}; ${purpose ? `reviewed exercise: ${cell(purpose)}` : "verify distinct teaching purpose"}` : "Review lab and explanation"} |`);
}
lines.push("", "## Reproduce", "", "```sh", "node scripts/generate-lessons.mjs", "node scripts/validate-lessons.mjs", "node scripts/review-lessons.mjs", "```", "",
  "Requires Python 3.12+; for example, use `LESSON_PYTHON=python3.13 node scripts/review-lessons.mjs` if the default Python is older. The review checks semantic routing, all 644 lessons' definition coverage, senior case links, and the local examples described above. Run `node scripts/check-typescript-lessons.mjs` separately for TypeScript. Structural checks and selected executions do not substitute for reviewing and running the remaining technical labs.", "");
await writeFile(join(root, "CONTENT-REVIEW.md"), lines.join("\n"));
const reviewed = rows.filter(row => reviewState(row, reviewLedger.lessons[row.number]) === "Recorded pass");
const changed = rows.filter(row => reviewState(row, reviewLedger.lessons[row.number]) === "Recheck changed content");
const pending = rows.filter(row => reviewState(row, reviewLedger.lessons[row.number]) === "Final review pending");
assert.equal(reviewed.length + changed.length + pending.length, rows.length);
const checklist = [
  "# Lesson review checklist", "",
  `Content passes recorded: **${reviewed.length}/${rows.length}**. Final individual review pending: **${pending.length}**. Changed since the recorded revision: **${changed.length}**.`, "",
  "These are documentation/sign-off counts, not a percentage of effort remaining. All lessons already received the baseline definition/reuse/senior-practice pass. Pending lessons may have substantial reviewed code, explanations and diagrams; consult NOTES.md and CONTENT-REVIEW.md before doing more work.", "",
  "## Evidence and completion rule", "",
  "The initial 45 records come from the explicit TypeScript completion report dated 2026-09-06. Their revision fingerprints were captured when this ledger was introduced on 2026-09-11 to detect subsequent changes; importing them is not a new line-by-line review. Other historical batch notes are retained as partial evidence, not silently upgraded to complete sign-offs.", "",
  "For each pending lesson, review the existing work, resolve actual gaps, and record an individual evidence section covering:", "",
  "- Clear, technically accurate explanation and topic-relevant primary sources; version-dependent guarantees identified.",
  "- Diagram and walkthrough agree with the lesson's actual mechanism and example.",
  "- Practice has setup, expected evidence and a failure/counterexample; runnable checks pass where the existing environment permits.",
  "- Senior rehearsal has answer criteria, a credible alternative and a changed constraint—not only definitions.",
  "- Remaining integration dependencies and deliberate scope limits are explicit; no learner mastery is inferred.", "",
  "Then add/update that lesson in lesson-review-status.json with its manifest revision, review date and evidence filename. Evidence must contain a heading beginning `## NNNN`. Do not update a stale fingerprint without reviewing the change. Passing automated checks never promotes a pending lesson.", "",
  "Content review is finished when every lesson has a recorded pass and no changed-content rechecks remain. It does not require building every exercise into a production application or executing integrations unavailable under the no-install constraint.", "",
  "## Separate verification work", "",
  ...Object.entries(verificationTasks).map(([key, task]) => `- [${reviewLedger.verification[key] ? "x" : " "}] ${task}${reviewLedger.verification[key] ? ` [Evidence](${reviewLedger.verification[key]})` : ""}`), "",
  "Verification entries in the manual ledger stay null until the named scope is verified; then reference a Markdown evidence file with environment, date and observed results. Partial checks do not close a whole category.", "",
  "Optional learner decisions—not content-review blockers: replacing orientation progress with written assessment and choosing a personalized interview-core sequence.", "",
  "## Work order and track counts", "",
  "Continue pending lessons in catalog order, reusing prior evidence rather than restarting completed batch work. Recheck changed recorded lessons before declaring completion.", "",
  "| Track | Recorded pass | Final review pending | Changed |",
  "| --- | ---: | ---: | ---: |"
];
for (const track of manifest.tracks) {
  const count = group => group.filter(row => row.trackId === track.id).length;
  checklist.push(`| ${cell(track.title)} | ${count(reviewed)} | ${count(pending)} | ${count(changed)} |`);
}
for (const track of manifest.tracks) {
  checklist.push("", `## ${track.title}`, "", "| Lesson | Content status | Individual evidence |", "| --- | --- | --- |");
  for (const row of rows.filter(row => row.trackId === track.id)) {
    const record = reviewLedger.lessons[row.number];
    checklist.push(`| [${row.number} · ${cell(row.title)}](${row.path}) | ${reviewState(row, record)} | ${record ? `[${record.reviewedOn}](${record.evidence})` : "Final sign-off not recorded; reuse prior batch notes"} |`);
  }
}
checklist.push("", "Regenerate with `LESSON_PYTHON=python3.13 node scripts/review-lessons.mjs` (or another available Python 3.12+ interpreter). Edit the manual ledger/evidence, not this generated checklist.", "");
await writeFile(join(root, "REVIEW-CHECKLIST.md"), checklist.join("\n"));
console.log(`Content sign-offs: ${reviewed.length} recorded, ${pending.length} pending, ${changed.length} changed. Wrote REVIEW-CHECKLIST.md.`);
console.log(`Reviewed ${rows.length} lessons / ${manifest.tracks.length} tracks; ${missingCount} fallback definitions in ${missingLessons} lessons; ${sharedLessons} lessons with a scoped shared starter; ${unresolvedReuse.length} unexplained reuse cases. Wrote CONTENT-REVIEW.md.`);
