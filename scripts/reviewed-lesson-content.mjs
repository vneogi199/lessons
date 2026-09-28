// Authored content for the eight-lesson explanation review. No runtime UI behavior.
export const REVIEWED_CONTENT = {
  "0090": {
    foundation: "A binding connects a variable name to its value. Lexical scope means that the location of a function in the source determines which outer variables it can use. A closure keeps access to those variables after the outer call returns.",
    reading: "Save the starter as an ES module because it uses top-level await. Follow createCounter calls separately. The Promise callback runs after the synchronous count assignment. The 1 MiB registry fixture checks reference removal, not a measured reduction in heap size.",
    profile: {
      analogy: "Each call to createCounter creates its own value binding. The returned read and increment functions share that binding. A second counter has a separate binding.",
      labScope: "Trace the counter, loop and deferred callback examples. The registry example removes one reference path. Use heap snapshots in an existing browser environment to investigate collection; an assertion cannot establish when the collector runs.",
      sourceLabel: "MDN: closures and lexical scope",
      sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"
    },
    mechanism: `<p>A closure reads a binding when its body runs. It does not recompute every value that was derived from that binding. Suppose count starts at 0 and message is assigned the string "Count: 0". Updating count to 1 leaves message unchanged. A deferred callback that reads count sees 1. A callback that reads message sees "Count: 0".</p>
<p>The loop example shows a different issue. A var loop has one shared index binding. After three iterations, each saved callback reads 3. A let loop creates a separate binding for each iteration. Its callbacks read 0, 1 and 2.</p>
<p>The counter exposes functions but not a property that lets callers assign value directly. Object.freeze prevents changes to the returned object's properties. It does not freeze variables used by those functions. A class with a #private field is another way to enforce access. Choose based on API needs and method sharing; measure allocation cost before making a performance claim.</p>
<p>A long-lived registry can retain a callback, which in turn retains data. Delete the registry entry when its owner finishes. If a listener, timer or another variable still refers to the callback, that path can keep the data reachable. In a heap snapshot, follow the retaining path from a root to the data. Compare paths after cleanup. Do not infer immediate collection from a smaller registry.</p>`,
    pitfalls: [
      ["Old derived value", "Rebuilding message inside the callback reads the current count. Keeping the old message is correct only if the callback needs the earlier snapshot."],
      ["Incomplete cleanup", "Removing one registry entry does not remove other listeners or callback references. Inspect ownership before changing the closure."]
    ],
    rehearsal: "A deferred callback prints Count: 0 after count becomes 1. Explain the result without saying that closures freeze values. Then describe when keeping the old message is intentional. How would you investigate a retained 10 MB response?",
    answer: "Trace the count and message bindings separately. Choose current data for a live display, or the earlier snapshot for an event record. For retention, identify the owning listener or registry, remove its reference at the correct lifecycle boundary, and inspect remaining heap paths. Do not promise a collection time."
  },
  "0140": {
    reading: "Inspect byId and byName in the editor. Both retain the item's name and private fields. The false branch is never executed, but the compiler checks its expected errors. Removing a constraint should make the corresponding negative type check fail. Console assertions check runtime results separately.",
    foundation: "A type parameter is a name for a type supplied or inferred at a call site. In identity<T>(value: T): T, the same T connects the argument type to the result type. TypeScript checks this relationship before execution; JavaScript does not receive T at runtime.",
    profile: {
      analogy: "For indexById, T is the complete item type. The constraint requires an id field. It still preserves fields such as name and private in the returned Map.",
      code: `interface Identified { id: string }

function indexById<T extends Identified>(items: readonly T[]): Map<string, T> {
  return new Map(items.map(item => [item.id, item]));
}

function choose<const T extends readonly [string, ...string[]]>(values: T): T[number] {
  return values[0];
}

function createStore<T, Key extends keyof T>(key: Key, items: readonly T[]): Map<T[Key], T> {
  return new Map(items.map(item => [item[key], item]));
}

const projects = [{ id: "p1", name: "Demo", private: true }] as const;
const byId = indexById(projects);
const direction = choose(["north", "south"] as const); // "north" | "south"

const byName = createStore("name", projects);
const found = byName.get("Demo"); // complete item type | undefined
console.assert(found?.private === true);
console.assert(direction === "north");
const duplicates = indexById([{ id: "p1", name: "First" }, { id: "p1", name: "Last" }]);
console.assert(duplicates.get("p1")?.name === "Last");

type Box<T = string> = { value: T };
const label: Box = { value: "ready" };
const size: Box<number> = { value: 3 };
console.assert(label.value === "ready" && size.value === 3);

// Compile-time checks only. Do not execute these invalid calls.
if (false) {
  // @ts-expect-error Empty input violates the nonempty tuple contract.
  choose([]);
  // @ts-expect-error Missing required id capability.
  indexById([{ name: "No ID" }]);
  // @ts-expect-error The item has no missing property.
  createStore("missing", projects);
  // @ts-expect-error Omitting T selects string, not number.
  const invalid: Box = { value: 3 };
}

// Each parameter must preserve a real relationship. A parameter used only once
// often adds ceremony without information.`,
      labScope: "Use an existing TypeScript 5+ compiler with strict checking and an ES2015-or-later library. Inspect inferred types and expected errors before considering runtime results. The const type parameter requires TypeScript 5.0 or later.",
      sourceLabel: "TypeScript handbook: generics",
      sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/generics.html"
    },
    mechanism: `<p>Read indexById from the call inward. The items argument supplies T. The constraint checks that T has a string id. The result is Map&lt;string, T&gt;, so an item read from it keeps its extra fields. Map.get can return undefined when the key is absent. A type parameter does not establish that a lookup will succeed.</p>
<p>keyof T means the property names of T. T[K] means the type of the property selected by K. The store example accepts both key and items in one call. That gives inference the item type when it checks the key. A curried version must establish T before the first call, or design the returned function to infer the later items.</p>
<p>A default type applies when a type argument is omitted and inference has no candidate. In Box&lt;T = string&gt;, Box means Box&lt;string&gt;. Box&lt;number&gt; overrides the default. A default must satisfy its constraint. It does not create or validate a runtime value.</p>
<p>For choose, T is the nonempty tuple and T[number] is the union of its element types. With north and south, the declared result is "north" | "south", although this implementation returns the first element. That contract permits a later implementation to choose another member. If callers require the first element's exact type, use a contract that returns T[0].</p>
<p>Inference means that the checker chooses type arguments from the call and its context. Variance describes how relationships between element types affect relationships between containers or callbacks. Mapped and conditional types are separate type transformations; this example does not require them.</p>`,
    pitfalls: [
      ["Constraint loses information", "Returning Identified instead of T discards the caller's extra fields from the static result type. Replacing T with any removes useful checking."],
      ["Types hide data policy", "Duplicate IDs overwrite earlier Map entries. Choose reject, first-write or last-write behavior explicitly. Validate external data at runtime before trusting its declared type."]
    ],
    rehearsal: "Design an index that preserves extra item fields. Show one accepted call, one rejected key and one rejected empty selection. If duplicate IDs must become errors, which part of the implementation changes?",
    answer: "Connect input T to Map values. Use keyof T to check selected keys. Keep undefined in lookup results. Reject duplicates in runtime code before setting an existing key; a generic constraint cannot enforce uniqueness. Prefer a concrete function when no caller-specific type relationship needs preservation."
  },
  "0176": {
    reading: "The component needs the supplied environment pieces named above; it is not a standalone browser page. Follow the three setQuantity calls in order. In addTag, the spread copies draft and the array expression copies tags. Neither operation deep-copies every possible nested value.",
    foundation: "React calls a component to calculate its UI. That call is a render. useState returns the state for that render and a setter that requests an update. Code already running keeps the state value from its own render.",
    profile: {
      analogy: "A click handler closes over one render's quantity. Passing a number queues a replacement value. Passing an updater queues a calculation from the pending value.",
      labScope: "The component fragment needs React, an Editor component and a clamp function. For this exercise, initial must be a finite number and clamp must bound it to 1 through 99. The queue table can be traced on paper without a React environment.",
      sourceLabel: "React: useState reference",
      sourceUrl: "https://react.dev/reference/react/useState"
    },
    mechanism: `<p>Start at quantity = 1. Three calls to setQuantity(quantity + 1) each queue the number 2. The next state is 2. Three calls to setQuantity(value =&gt; value + 1) instead calculate 2, then 3, then 4. In the supplied component, the upper bound makes three increments from 98 finish at 99.</p>
<p>A mixed queue follows the same rule. From 1, queue replacement 5, then an increment updater, then replacement 2. The pending values become 5, 6 and 2. Batching combines update work; it does not turn replacement values into increments. Separate intentional clicks remain separate events.</p>
<p>A hook slot is React's association between a hook call and a component instance. Keep hook calls in the same order on every render. Memoized state is the state React retains between renders. A bailout skips work when it is unnecessary. With useState, React compares the next value using Object.is. Equal state can skip rendering work, though React may call the component before discarding its result.</p>
<p>React calculates the next UI during render. During commit, it applies the required DOM changes. The browser paints afterward. A render snapshot is not a deep-frozen copy of objects. Mutating draft and passing the same object can both corrupt an older snapshot and fail to request the intended visible change.</p>
<p>The lazy initializer supplies the initial state. Changing initial later does not rerun initialization for the same component instance. In development Strict Mode, React can call initializers and updaters twice to detect impurities. Keep them free of requests, logging that must occur once, and mutations of existing state. The logical update is not applied twice.</p>
<p>When switching the edited entity, a new key resets component state and discards local edits. A controlled value lets the parent own the state. Choose deliberately. Copy each changed object or array branch; a top-level spread alone does not copy nested arrays.</p>
<p><a href="https://react.dev/learn/render-and-commit">React's render, commit and paint explanation</a>.</p>`,
    pitfalls: [
      ["Replacement confused with increment", "Write the actual queued value beside each setter call. Use an updater when the next value depends on pending state."],
      ["Initializer treated as synchronization", "A new initial prop does not reset an existing instance. Specify whether entity changes discard edits or preserve them."]
    ],
    rehearsal: "Predict the replacement, updater and mixed queues without running them. Then explain a missing rerender after mutating draft.tags. How should the editor behave when its entity ID changes?",
    answer: "The queues finish at 2, 4 and 2. The bounded component saturates at 99. Create a new tags array and draft object for a tags update. Choose a key reset when all local state should be discarded; choose parent-owned state when edits must be coordinated. Keep updater functions pure under repeated render attempts."
  },
  "0216": {
    reading: "Each top-level promise resolves when its callback runs. The I/O promise resolves only after both callbacks created by the file read finish. A read error rejects it instead. Promise.all therefore observes completion without a guessed delay. The assertion deliberately excludes top-level order.",
    foundation: "Node runs JavaScript callbacks on its event-loop thread. libuv is the native library that coordinates I/O and loop phases. A phase is a category of callback work. Scheduling a callback makes it eligible later; it does not interrupt the current JavaScript call.",
    profile: {
      analogy: "Follow the file-read callback as a scheduling boundary. Work queued there has different timing guarantees from work queued while the module first loads.",
      labScope: "Save the starter as an .mjs file in an existing Node environment. It reads its own file, checks read errors, and waits for all four scheduled callbacks before comparing their order. It does not exercise every libuv phase.",
      sourceLabel: "Node: event loop, timers and nextTick",
      sourceUrl: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick"
    },
    mechanism: `<p>Timers run after their delay threshold has elapsed and the loop can process them. The pending-callback phase handles selected deferred I/O callbacks, including some TCP error callbacks. Poll processes ready I/O callbacks and can wait for events. Check processes setImmediate callbacks. Close callbacks report shutdown for supported handles. Internal idle and prepare phases also exist.</p>
<p>In Node 20 and later, libuv runs timers after polling during loop iterations. Version 1.45 retained an initial timer pass before entering the loop for compatibility. Record process.version with observations. A phase diagram is a model of repeated processing, not a promise that every phase has work on each pass.</p>
<p>Inside the file-read callback, the immediate callback runs before the zero-delay timer scheduled beside it. The starter asserts only that relationship. Its top-level immediate and timer have no fixed relative order to assert. A zero delay is a minimum scheduling threshold, not a deadline.</p>
<p>Promise microtasks and process.nextTick callbacks are not extra libuv phases. Node processes them at callback boundaries. Recursive nextTick scheduling can prevent the loop from reaching I/O. CommonJS and ES-module top-level ordering can differ, so do not transfer a top-level trace between them without checking its context.</p>
<p>For a starvation exercise, schedule an immediate, then queue a nextTick callback that queues itself only 100 times. Predict that the immediate waits for the chain to finish. Keep the bound; an infinite chain can starve I/O. For long CPU work, break work into bounded chunks that yield, or use a worker when parallel execution justifies its coordination cost.</p>
<p>To examine close behavior, use a local test server and a socket. Register the socket's close listener before destroying it, then record the notification. Close every test handle afterward. This is a separate experiment; the file-read trace does not verify socket shutdown ordering.</p>`,
    pitfalls: [
      ["Sampling mistaken for completion", "A timer that prints after 25 ms can miss slow I/O. The starter waits for explicit completions instead."],
      ["One trace treated as a guarantee", "Assert the order inside the I/O callback. Keep top-level order as an observation. Inspect event-loop delay separately from dependency latency."]
    ],
    rehearsal: "Why does the I/O immediate precede its timer while top-level ordering remains unasserted? A service has low database latency but slow callbacks. How would you distinguish CPU blocking, recursive microtasks and slow I/O?",
    answer: "Name the scheduling context and loop phase. Use event-loop delay and a CPU profile to investigate main-thread work. Inspect unbounded nextTick or promise chains when callbacks do not yield. Worker threads can move CPU work; increasing the I/O pool does not move arbitrary JavaScript off the main thread."
  },
  "0358": {
    reading: "The B commands are comments so pasting the A block cannot accidentally perform both roles in one connection. Copy those commands into B without their comment markers. Pause A at step 3. Record each balance and both verbose vacuum reports before comparing them.",
    foundation: "A tuple is a stored row version. An update can create a new version while an older one remains available. A snapshot records which transaction effects a reader can see. MVCC uses these versions so ordinary reads need not wait for a writer's row change.",
    profile: {
      analogy: "Two connections can read different versions of the same account row. Their snapshot rules select the version; the row's physical location is not its business identity.",
      labScope: "Use two connections to the same existing disposable PostgreSQL database. Run the numbered blocks in order. The setup creates a dedicated table and intentionally fails if that name already exists. Do not reuse a production accounts table. VACUUM must run outside a transaction block.",
      sourceLabel: "PostgreSQL: transaction isolation",
      sourceUrl: "https://www.postgresql.org/docs/current/transaction-iso.html"
    },
    mechanism: `<p>The fixture begins with balance_cents = 100. Session A starts Repeatable Read and reads 100. That read establishes its snapshot. Session B updates the balance to 101 and commits. A still reads 100. After A commits, its next statement reads 101.</p>
<p>Repeat the exercise with Read Committed after resetting the balance while both sessions are idle. A's second SELECT now reads 101 because each statement takes a fresh snapshot. Repeatable Read provides a stable transaction view, but concurrent writes can require a transaction retry. Read Committed permits fresher results between statements; it does not guarantee a stable view across a report's separate queries.</p>
<p>xmin identifies the inserting transaction. xmax can contain deletion or locking information. Visibility also depends on transaction status and the reader's snapshot. Do not compare these fields as timestamps or use them as permanent application versions. ctid identifies a physical row-version location and can change.</p>
<p>While A holds its old snapshot, VACUUM must retain versions that A can still need. After A commits, those versions can become removable, unless another snapshot or retention requirement still needs them. VACUUM output depends on other activity. Compare its verbose reports; do not expect one universal tuple count or immediate file shrinkage.</p>
<p>Long transactions can delay cleanup and increase storage and scan work. Inspect old transactions and the cleanup horizon before increasing vacuum frequency. Transaction IDs also wrap; vacuum freezing prevents old IDs from becoming unsafe to interpret. Do not treat an old xmin as an unbounded clock.</p>
<p>MVCC does not remove locks. Two writers changing the same row can wait or fail under the isolation rules. Ordinary SELECT also takes a table-level lock that can conflict with exclusive DDL. Distinguish row-version visibility from write coordination.</p>
<p><a href="https://www.postgresql.org/docs/current/routine-vacuuming.html">Vacuum and old versions</a>; <a href="https://www.postgresql.org/docs/current/ddl-system-columns.html">system column meanings</a>.</p>`,
    pitfalls: [
      ["Both sessions use one connection", "The reader can see its own writes. That does not demonstrate a concurrent transaction's visibility. Use two connections and pause at the indicated boundaries."],
      ["More vacuum solves every backlog", "Vacuum cannot remove a version that an active snapshot still needs. Investigate the long transaction and its owner before changing cleanup settings."]
    ],
    rehearsal: "Predict all four balances. Explain why a busy table can grow while autovacuum runs. Would Read Committed be a suitable replacement for a multi-query financial report?",
    answer: "A reads 100, B returns 101, A still reads 100, then A reads 101 after commit. An old snapshot can hold back cleanup. Choose a report's consistency requirement before changing isolation: independent fresh statements and one stable report snapshot are different contracts. Account for retry handling and transaction duration."
  },
  "0447": {
    reading: "Read onAppendEntries as a precheck. A higher term is persisted even when the prefix is rejected. readyForLogProcessing deliberately differs from append success. A rejected persistence promise must stop normal node processing. Tests of this adapter cannot establish election or commitment safety.",
    foundation: "Consensus lets replicas agree on an ordered log of commands despite crashes and delayed messages. A term is an election epoch. A quorum is the required set of voters; in a fixed Raft cluster it is a majority. A log prefix is the sequence of entries up to a given position.",
    profile: {
      analogy: "A committed log gives each replica the same command order. A deterministic state machine applies those commands with the same result. External effects need their own replay and authority controls.",
      labScope: "First trace the five-node scenario below. The JavaScript starter checks only the AppendEntries term and prefix preconditions with a persistence adapter. It does not implement a consensus cluster. Membership and recovery exercises are tabletop reasoning tasks.",
      sourceLabel: "Raft paper: elections, safety and membership",
      sourceUrl: "https://raft.github.io/raft.pdf"
    },
    mechanism: `<p>Raft elects at most one leader per term. Split votes can leave a term without a leader. Each server persists its current term and vote before relying on them after a crash. A server that learns of a higher term updates its term and becomes a follower. A disconnected old leader may not yet know that a new term exists.</p>
<p>Consider five servers A, B, C, D and E with matching logs. Three votes form a majority. A leads term 4. A partition separates A and B from C, D and E. C can win term 5 with C, D and E. A may still believe it leads, but A and B cannot form a majority to commit new commands. A must step down when it receives a valid higher-term message.</p>
<p>A voter also checks log freshness. Compare the last entry's term first, then its index if the terms match. A longer log with an older last term is not necessarily more up to date. Majority intersection alone is insufficient without these election and log rules.</p>
<p>A leader advances commitment by counting replicas for entries from its current term. Once such an entry is stored on a majority, it and preceding entries become committed. A majority holding an older-term entry alone does not justify the same conclusion. The paper's Figure 8 shows why that entry can still be overwritten before the current-term rule is satisfied.</p>
<p>AppendEntries checks the preceding entry's index and term. On a mismatch, the leader repairs the follower's log by finding a matching prefix. Conflicting uncommitted entries can be replaced. A shorter matching request must not blindly truncate a matching suffix. Persist accepted changes before reporting success. Apply committed commands in index order.</p>
<p>Membership changes need overlapping authority. In the paper's joint-consensus procedure, decisions require a majority of both the old and new configurations during the transition. Switching directly between unrelated majorities can allow conflicting decisions. Name the membership procedure your implementation uses.</p>
<p>Safety means that conflicting commands do not become committed at the same log position under the protocol's crash-fault assumptions. Progress also needs a communicating majority and sufficiently stable timing for an election. A minority partition loses write availability. These tests provide evidence for particular cases; they are not a proof of the full protocol.</p>
<p>A fencing token is an application mechanism for rejecting a stale actor at an external resource. Raft does not make that resource enforce tokens automatically. A term is not a commit receipt. Define token issuance and stale-token rejection separately. A lease also introduces time assumptions that are not part of basic Raft log commitment.</p>`,
    pitfalls: [
      ["Replication confused with commitment", "An older-term entry can exist on a majority and still be unsafe to commit by replica counting alone. Explain the current-term rule before acknowledging a client."],
      ["Consensus confused with exactly-once effects", "A client can retry after losing a reply. Applying the same request twice is an application concern. Persist request identity and results where replay must be safe."]
    ],
    rehearsal: "Trace the five-node partition. Who can commit? What happens to the old leader after healing? Then change membership from five servers to three. Explain which majorities the transition requires and what the precheck code cannot establish.",
    answer: "C, D and E can elect a term-5 leader and commit current-term entries. A and B cannot commit alone. A steps down after learning term 5; conflicting uncommitted suffixes can be repaired. Joint consensus needs both configuration majorities. The precheck verifies durable term handling and prefix rejection only; election, append durability, commitment, application and membership safety still need the full protocol."
  },
  "0582": {
    reading: "The starter uses d = 1, so division by the square root of d would divide by one. Slicing visible keys performs the causal restriction. zip combines matching weights and values for the trusted fixture. A general function would also validate positions, lengths and finite values.",
    foundation: "A token representation is a list of numbers. A tensor is an array with one or more dimensions; its shape gives the length of each dimension. Attention combines token representations. A transformer block combines attention with per-token transformations and residual additions.",
    profile: {
      analogy: "A query describes what a position is looking for. Keys are compared with that query to produce scores. Values supply the information that the scores will combine. These are learned vectors, not literal database queries or keys.",
      labScope: "The Python starter computes scalar causal attention and checks two outputs. The shape trace extends it to one matrix attention head and a named pre-normalization block. The block equations are an explanation, not a supplied trained model or performance benchmark.",
      sourceLabel: "Attention Is All You Need: architecture",
      sourceUrl: "https://arxiv.org/html/1706.03762v7"
    },
    mechanism: `<p>First trace the scalar example. At position zero, only value 10 is visible, so its weight is 1 and the output is 10. At position one, scores are 0 and 1. Softmax gives weights 1/(1 + e) and e/(1 + e). The weighted value is about 17.31. Changing the future value does not change position zero's output.</p>
<p>Now use one head, three tokens and two numbers per query and key. Q and K each have shape 3 × 2. QKᵀ has shape 3 × 3. Each row scores one query against the three keys. Divide by √2. Set future-position scores to negative infinity before applying softmax across each row. If V has shape 3 × 4, the result has shape 3 × 4.</p>
<p>For a full head, learned matrices project the input X into Q, K and V. Scaling by √d_k limits score growth as the key dimension grows. Without scaling, large scores can make softmax too concentrated and its gradients small. Subtracting the row maximum before exponentiation prevents avoidable overflow. Scaling and numerical stabilization solve different problems.</p>
<p>Multiple heads use separate projections. Their outputs are concatenated and projected back to the model width. For the following pre-normalization block, X has shape n × d_model. This is one block variant; the original transformer paper uses post-normalization.</p>
<pre><code>Y = X + Attention(LayerNorm(X))
Z = Y + FFN(LayerNorm(Y))

X, Y, Z: n × d_model
FFN hidden activations: n × d_ff
FFN output: n × d_model</code></pre>
<p>Here Attention includes head combination and the output projection. Each addition requires matching shapes. The residual stream is the representation carried forward through these additions. LayerNorm normalizes features within each token. It is different from softmax, which turns attention scores into weights across visible positions.</p>
<p>The feed-forward network applies a learned nonlinear transformation to each token separately. It shares weights across token positions within the layer. It expands to d_ff and projects back to d_model. Attention mixes positions; the feed-forward network transforms features. Positional information is also needed to represent sequence position; a causal mask specifies which positions are permitted.</p>
<p>Dense attention computes n² query-key pairs for a full sequence. Doubling n quadruples the pair count, but does not imply that total model latency quadruples. Projections, the feed-forward network, memory access and kernels also cost time. During autoregressive decoding, a KV cache reuses prior keys and values. A new token attends to the stored prefix, while the cache consumes memory that grows with context length. Caching does not remove attention over the prefix.</p>
<p><a href="https://arxiv.org/abs/2002.04745">Pre-normalization and post-normalization analysis</a>; <a href="https://huggingface.co/docs/transformers/cache_explanation">KV cache explanation</a>.</p>`,
    pitfalls: [
      ["Wrong softmax axis", "Normalize scores across the keys visible to one query. Mask before softmax so forbidden positions receive zero weight."],
      ["Toy mistaken for a full block", "The scalar starter has no learned projections, multi-head combination, residual addition or feed-forward network. Use the shape trace to explain these omitted parts."]
    ],
    rehearsal: "Give every shape for the three-token head. Explain why the FFN output must return to d_model. Then double the prompt length: what grows quadratically, and what does a KV cache save during decoding?",
    answer: "Scores and weights are 3 × 3; the weighted values are 3 × 4. The output projection restores model width for the residual addition. FFN weights are shared across positions, with an expanded hidden width. Dense pair count grows fourfold when length doubles. A KV cache avoids recomputing prior keys and values, at the cost of memory; it does not guarantee a fourfold latency change or eliminate prefix attention."
  },
  "0629": {
    reading: "At each loop iteration, compare the Map before lookup and after insertion. Existing assertions cover a normal match, duplicate values, a single element and empty input. Add [-2, 5] with target 3 and [1, 2] with target 9 to check negatives and no match.",
    foundation: "An input contract states accepted data and the required result. An invariant is a statement that remains true as the algorithm advances. Start with a correct simple method, then use the constraints to decide whether its cost is acceptable.",
    profile: {
      analogy: "For pair sum, the invariant is concrete: before index j, the Map contains values from earlier indices only. Looking up before insertion prevents reuse of the same element.",
      labScope: "Practise on safe integers whose needed subtractions are also safe integers. The supplied function assumes that contract. It returns one valid pair, not every pair. Use a 25-minute rehearsal, then compare the feedback below; the exercise does not establish readiness for a whole interview loop."
    },
    mechanism: `<p>Clarify whether the result contains indices or values, whether indices must differ, and whether any valid pair is acceptable. Ask what to return when no pair exists. For this fixture, return two distinct indices or null. Duplicates are allowed. Inputs and relevant arithmetic must stay within the safe-integer contract.</p>
<p>Try every i &lt; j pair as a baseline. This uses O(n²) time and O(1) extra space. For a large input, store prior values in a Map. At j, compute the needed partner, check the Map, then insert the current value. With expected constant-time Map operations, this uses O(n) time and O(n) extra space.</p>
<p>Trace [3, 3] with target 6. At j = 0 the Map is empty; store 3 → 0. At j = 1 the Map contains the needed 3, so return [0, 1]. If insertion came first, the single-element input [3] could incorrectly match itself. This counterexample tests the invariant directly.</p>
<p>The current algorithm returns on the first matching second index. When duplicate values overwrite earlier Map entries, it does not promise the earliest possible first index. A contract that requires a particular pair order needs a different selection rule.</p>
<p>If extra memory must be O(1), revisit the baseline. Sorting and two pointers can reduce time, but mutation and original-index requirements matter. Copying values with their indices uses O(n) space. Do not claim constant extra space merely because the pointer scan uses two variables.</p>
<p>Use minutes 0–4 to clarify the contract and examples, 4–8 for a baseline and invariant, 8–18 for implementation, and 18–25 for tests and changed constraints. These are practice targets, not an employer's scoring policy. If stuck, trace the smallest failing input and identify the first step that violates the invariant.</p>`,
    pitfalls: [
      ["Optimization changes the contract", "A sorted answer may lose original indices. State the required output before proposing a different algorithm."],
      ["Passing examples replace reasoning", "Test duplicates, an empty input, a single element, negatives and no match. Explain the invariant as well as the results."]
    ],
    rehearsal: "Without copying pairSum, solve a new version that returns every distinct index pair. Use [3, 3, 3] and target 6. Then discuss a stream where only the last W elements are eligible. What changes in storage, output cost and expiry?",
    answer: "All-pairs output is [0,1], [0,2], [1,2]. Store every prior index for each value, emit matches before insertion, and count output size k: expected O(n + k) time and O(n) auxiliary storage, plus O(k) if results are collected. For a window, expire indices before lookup and keep only eligible entries; one index per value loses duplicate matches. In a self-review, mark contract, invariant, implementation, tests and tradeoff as demonstrated or needs practice. Correct output alone does not demonstrate all five."
  }
};

export const REVIEW_SCENARIOS = {
  "0090": {
    kind: "scenario", terms: [],
    prompt: "count starts at 0. message is assigned 'Count: ' + count. A deferred callback reads both after count becomes 1. What does it read?",
    context: ["No code assigns a new value to message."],
    options: ["0 and Count: 0", "1 and Count: 0", "0 and Count: 1", "1 and Count: 1"], answer: 1,
    explanations: ["The callback reads the updated count binding.", "count changed; the earlier derived message did not.", "This reverses which binding changed.", "Updating count does not recompute message."],
    reasoning: ["Closures retain access to bindings. A derived string changes only when the program assigns a new string to that binding."],
    followup: "Move message construction into the callback. Predict the result and explain when retaining the old message would be correct."
  },
  "0140": {
    kind: "scenario", terms: [],
    prompt: "An index function accepts items with id and extra caller-specific fields. Which result type preserves those fields without disabling checking?",
    context: ["The function declares T extends Identified. Identified contains only id: string."],
    options: ["Map<string, Identified>", "Map<string, unknown>", "Map<string, T>", "Map<string, any>"], answer: 2,
    explanations: ["Identified discards the extra fields from the result type.", "unknown requires narrowing before using item fields.", "T preserves the caller's complete item type.", "any disables useful checking."],
    reasoning: ["Map.get still returns T | undefined. Preserving the item type does not prove a key exists or enforce unique input IDs."],
    followup: "Change the contract to reject duplicate IDs. Explain why that needs runtime behavior."
  },
  "0176": {
    kind: "scenario", terms: [],
    prompt: "State starts at 1. One handler queues replacement 5, an updater that adds 1, and replacement 2, in that order. What is the next state?",
    context: ["There are no other updates. The updater is pure."],
    options: ["2", "3", "6", "8"], answer: 0,
    explanations: ["The pending values are 5, 6, then 2.", "The final call replaces the value; it does not increment it.", "6 is the intermediate value before the last replacement.", "Replacement values are not summed."],
    reasoning: ["Batching preserves update meaning and order. It does not turn a replacement into a calculation from pending state."],
    followup: "Replace the last update with value => value + 2. Predict 8, then explain the difference."
  },
  "0216": {
    kind: "scenario", terms: [],
    prompt: "A file-read callback schedules setImmediate and a zero-delay timer. Which relationship should the starter assert?",
    context: ["Both callbacks are scheduled in the same I/O callback. Top-level callbacks are recorded separately."],
    options: ["Top timer before immediate", "I/O timer before immediate", "All timers before immediates", "I/O immediate before timer"], answer: 3,
    explanations: ["The top-level pair has no fixed order to assert.", "The immediate scheduled inside this I/O callback runs first.", "This invents a global order across scheduling contexts.", "Check work runs the immediate before that timer."],
    reasoning: ["Wait for explicit completion before comparing the trace. Printing after an arbitrary delay only samples progress."],
    followup: "Add bounded CPU work inside the I/O callback. Explain why it delays both callbacks without reversing the guaranteed relationship."
  },
  "0358": {
    kind: "scenario", terms: [],
    prompt: "A reads balance 100 under Repeatable Read. B changes it to 101 and commits. What does A read before its commit and in a new statement afterward?",
    context: ["A makes no writes. No other transaction changes the row."],
    options: ["100 then 100", "100 then 101", "101 then 100", "101 then 101"], answer: 1,
    explanations: ["A's new statement after commit can see B's committed version.", "The old snapshot sees 100; the new snapshot sees 101.", "The stated history does not move the balance backward.", "The first read remains on A's established snapshot."],
    reasoning: ["Vacuum cannot remove a row version still needed by A's old snapshot. A statement after commit no longer uses that snapshot."],
    followup: "Repeat with Read Committed and explain why the second SELECT within A can see 101."
  },
  "0447": {
    kind: "scenario", terms: [],
    prompt: "A five-node Raft cluster splits into groups of two and three. The old leader is in the group of two. Which statement is correct?",
    context: ["Logs initially match. The three-node side communicates reliably and can complete an election."],
    options: ["Both groups commit independently", "Only majority can commit", "Only minority can commit", "Neither group can commit"], answer: 1,
    explanations: ["Two disjoint groups cannot both form a fixed-cluster majority.", "Three nodes can elect a leader and replicate a current-term entry to a majority.", "The old leader's belief does not replace the majority requirement.", "The three-node side can make progress under the stated conditions."],
    reasoning: ["The old leader steps down after learning of the higher term. A partition can delay that knowledge. Do not equate a local leadership belief with commitment authority."],
    followup: "Explain why an older-term entry on a majority still needs the current-term commitment rule."
  },
  "0582": {
    kind: "scenario", terms: [],
    prompt: "One head has Q and K of shape 3 × 2, and V of shape 3 × 4. What is the shape of softmax(QKᵀ / √2)V?",
    context: ["Softmax operates across keys in each score row. Masking preserves the score matrix shape."],
    options: ["2 × 4", "3 × 3", "3 × 4", "4 × 3"], answer: 2,
    explanations: ["The output retains three query positions, not the key feature count.", "3 × 3 is the shape of the weights before multiplying V.", "A 3 × 3 weight matrix times 3 × 4 values gives 3 × 4.", "The output does not transpose the query and value dimensions."],
    reasoning: ["The value width can differ from the query/key width. A full multi-head block projects combined heads back to model width before residual addition."],
    followup: "Double sequence length while preserving feature widths. Give the new score and output shapes."
  },
  "0629": {
    kind: "scenario", terms: [],
    prompt: "Change pair sum to return every distinct index pair. For [3, 3, 3] and target 6, how many pairs are required?",
    context: ["Indices must differ. Treat [i,j] and [j,i] as the same pair."],
    options: ["1", "2", "3", "6"], answer: 2,
    explanations: ["One result satisfies the original any-pair contract only.", "This omits one pair.", "The pairs are [0,1], [0,2] and [1,2].", "Six counts both orders of each pair."],
    reasoning: ["Store every eligible prior index for a value. Count output cost k separately: expected O(n + k) time for a hash-based approach. k can be quadratic."],
    followup: "Explain the storage difference between yielding pairs and collecting all pairs into an array."
  }
};
