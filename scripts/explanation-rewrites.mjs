// Python introductions replace syllabus instructions with explanations.
// Keep these separate from the worked examples so prose edits cannot alter code.
export const PYTHON_EXPLANATIONS = {
  "0260": "The interpreter runs your Python program. A REPL lets you try statements interactively; a script stores them in a file. A virtual environment selects a separate set of installed packages. Check the running interpreter and its environment before investigating an import problem. A changed shell prompt alone does not establish which Python executable ran the code.",
  "0261": "A name must be resolved to an object before Python can use it. Namespaces hold those bindings, and scope rules determine where Python looks. Each function call has a frame that holds its execution state. An assignment inside a function can make a name local throughout that function, including lines before the assignment. A closure keeps access to an enclosing binding, so later changes to that binding can affect its result.",
  "0262": "Assignment gives another name to an object. It does not copy the object. If two names refer to one list, a change through either name is visible through both. Identity tells you whether the object is the same; equality compares values. A shallow copy creates a separate outer container but keeps references to its children. A deep copy follows more of the object graph, which may cost more or be inappropriate for resources with their own identity.",
  "0263": "The numeric type affects the result of arithmetic. Binary floating point cannot represent every decimal fraction exactly. Decimal uses decimal arithmetic, but its precision and rounding rules still matter. For money, decide the currency and when to round before choosing a calculation. Truth tests also need care: zero, None and an absent value may have different meanings even when each leads to a false condition.",
  "0264": "Text and encoded bytes are different representations. A string holds Unicode text; encoding turns that text into bytes, and decoding turns bytes back into text under a chosen encoding. One character can require several UTF-8 bytes. Replacing a single byte can therefore make the data invalid. Normalization can make selected text forms compare alike, but it cannot establish identity or eliminate every visually confusing name.",
  "0265": "Lists, tuples and ranges keep values in order, but they store and update them differently. CPython lists use a resizable array of references. Tuples keep their direct references fixed. A range describes an integer progression without storing every item. Slicing and unpacking depend on those representations, so copying a list and slicing a range have different allocation costs.",
  "0266": "A dictionary finds a key using its hash and checks equality when needed. Equal keys must have equal hashes; two different keys can still have the same hash. A key's hash and equality behavior must remain stable while it is stored. Sets use the same ideas for membership. Dictionaries retain insertion order, which is different from sorting the keys. Removing and reinserting a key changes its position.",
  "0267": "A condition selects a branch, and a loop repeats work over values or while a condition holds. Comprehensions build collections from that repeated work. An assignment expression can name a value while testing it. Pattern matching selects a branch from a value's structure, but matching alone does not establish every input rule. Check which types and extra fields each branch accepts before using it at an API boundary.",
  "0268": "Before a function body runs, Python binds supplied arguments to its parameters. Positional-only and keyword-only parameters control how callers supply them. Defaults are evaluated when the function is defined, so a mutable default can be shared by later calls. Allocate per-call storage inside the body. If omitted input has a different meaning from None, use a separate sentinel value to represent omission.",
  "0269": "A function is an object: you can pass it to another function, return it or store it for later. A closure keeps access to enclosing bindings. A lambda creates a function from an expression, and partial stores arguments for a later call. An instance with a call method can keep explicit state alongside its callable behavior. Choose the form that makes that state easiest to follow, especially when later mutation changes the result.",
  "0270": "An exception leaves the current operation and searches for a matching handler. Cleanup belongs on paths that run whether the operation succeeds or fails. When translating an error, preserve its cause so the failure can still be diagnosed. Exception groups hold several failures; except* handles matching subgroups. A timeout reports a missing result, so retry decisions must also consider whether an external effect already happened.",
  "0271": "Import creates or retrieves a module object with its own namespace. Finders locate the module, loaders initialize it, and sys.modules caches it. A module can enter that cache before its code finishes running. If two modules import each other, one can therefore see the other only partly initialized. Moving shared policy to a lower-level module can remove the cycle; delaying an import only changes when it occurs.",
  "0272": "An instance holds state, while its class supplies shared behavior. Accessing an ordinary method through an instance binds that instance as the receiver. A classmethod receives the actual class, which lets a constructor work with subclasses. A staticmethod receives neither automatically. A validation helper protects an invariant only if every relevant construction or update path calls it.",
  "0273": "Inheritance finds behavior along the method resolution order, or MRO. super continues that search after the current class; it does not always call one named parent. Methods that cooperate through super need compatible parameters and must forward the call consistently. Abstract base classes state required behavior, while mixins supply reusable pieces. Composition lets one object call another without placing both in an inheritance hierarchy.",
  "0274": "Python operations use protocols implemented by special methods. A collection can support iteration or length, and a value can define comparison or arithmetic. These methods must agree with each other: ordering should remain consistent with equality, for example. Returning NotImplemented from an unsupported binary operation lets Python try the other operand's protocol. It is a return value, not an exception to raise.",
  "0275": "Attribute access can run code instead of reading stored data directly. Descriptors control access, and a data descriptor takes priority over an instance's dictionary during normal lookup. A property uses this mechanism for managed access. __getattribute__ participates in ordinary lookup, while __getattr__ handles missing attributes. Slots affect storage, but a class that includes __dict__ still permits dictionary-backed attributes.",
  "0276": "A dataclass generates routine methods for a record. Named tuples provide tuple-based records, and enums name a defined set of values. A frozen dataclass blocks ordinary field reassignment, but a field can still refer to a mutable child. Type annotations describe expected values; runtime checks enforce requirements such as a finite amount or a valid currency. Decide which fields define value equality and which metadata should survive an operation.",
  "0277": "An iterable can supply an iterator. The iterator holds the position of one traversal and returns successive values through next. StopIteration signals that it has finished; further calls must stay exhausted. An iterable can create a fresh iterator for each traversal, so two loops need not share their positions. A sentinel iterator instead calls a function until it returns the chosen stopping value.",
  "0278": "Calling a generator function creates a generator without running its body. Advancing it runs the body until yield pauses execution and returns a value. The suspended frame retains local state. send and throw resume it with a value or exception, while close requests cleanup. yield from delegates this behavior to another iterator. If the generator owns a file, give it an explicit lifetime; leaving a loop does not automatically close an externally retained generator.",
  "0279": "A list comprehension builds its result immediately. A generator expression produces values as a consumer asks for them, so intermediate results need not all exist at once. itertools can connect these steps, but some helpers buffer values or require ordered input. An iterator is usually consumed once. Laziness also delays errors and keeps resources alive until consumption or cleanup, so consider the whole pipeline, including its final output.",
  "0280": "A decorator receives a newly defined object and binds the name to the decorator's result. A wrapper can add work around a call; a registration decorator can record the callable for later use. Stacked decorators apply from the bottom upward. functools.wraps retains useful metadata, but the wrapper must still preserve arguments, results and error behavior. A synchronous timer around an async function measures coroutine creation unless it also awaits execution.",
  "0281": "A with statement enters a context manager, runs the body and calls its exit method when leaving. The exit method can handle or suppress an exception. ExitStack records a changing set of resources and cleans them up in reverse order, including when a later acquisition fails. Async context managers await entry and exit. If acquisition fails before entry completes, the acquisition code must clean up anything it already opened.",
  "0282": "Type hints give readers and static checkers a model of the program's values. They do not automatically validate incoming data. A condition can narrow a union to the types that remain possible in one branch. Aliases name type expressions, Literal restricts a type to particular values, and Never represents a path with no possible value. Gradual typing and unchecked escape hatches limit what a checker can establish; annotation evaluation also depends on the Python version.",
  "0283": "A type parameter preserves a relationship, such as returning the same item type that a collection contains. Bounds restrict the types it accepts. A Protocol describes required behavior without requiring inheritance. Variance determines whether a relationship between item types also holds for their containers; a mutable container usually both accepts and returns items, which restricts substitution. Overloads describe different call signatures, and ParamSpec forwards a callable's parameter list. These are static contracts, not runtime validation.",
  "0284": "Data arriving over an API has not yet met the application's rules. Parsing converts its representation, normalization applies an agreed form, and validation checks the allowed structure and values. Only then should domain code rely on the resulting object. Serialization prepares an outgoing representation. Keep conversion errors distinguishable from invalid business values, and check authorization separately from both.",
  "0285": "Reading a file crosses several boundaries. The operating system supplies bytes, an encoding gives text meaning, and a parser interprets the format. Buffering affects I/O, while replacement and storage behavior affect durability. JSON may lose Python type information; CSV needs dialect and quoting rules. Timestamps need timezone rules when local times are ambiguous. Package resources also need a defined way to locate and release them.",
  "0286": "A subprocess has its own arguments, environment and streams. Passing an argument list avoids shell interpretation, but the called program can still treat an argument as an option. Pipes can fill, output can consume memory, and timeouts need a termination policy. Signals let processes coordinate shutdown. Regular expressions have a separate risk: backtracking on an unsuitable pattern or large input can consume excessive time.",
  "0287": "Calling an async function creates a coroutine. Scheduling it as a task gives the event loop responsibility for driving it. When an await suspends, the loop can run other ready work while waiting for a timer or I/O readiness. It later resumes the task and stores its result or exception. A blocking call or long CPU calculation on the loop prevents that cooperation, even inside an async function.",
  "0288": "TaskGroup keeps child tasks within an owned lifetime and waits for their cleanup. When a worker fails, it cancels siblings and collects failures. Cancellation is delivered at a suspension point, so cleanup must account for it. A bounded queue limits waiting items, a semaphore limits active permits, and a timeout limits waiting time. These controls address different limits; none makes an external effect reversible.",
  "0289": "Threads share memory, so two operations can interfere through the same object. A lock must protect the whole read-change-write rule, not just one line in it. A condition lets a thread wait for a state change and recheck the condition when it wakes. Conventional CPython's GIL limits simultaneous Python execution, but native work can release it. Free-threaded builds change interpreter locking, so application and extension code still need their own thread-safety checks.",
  "0290": "A worker process has separate execution state. Sending work to it normally involves serialization and communication, which can outweigh the benefit for small jobs. A process pool reuses workers to reduce startup work. Shared memory can reduce copying but needs explicit ownership and synchronization. Start methods determine how workers begin and what they inherit; choose a supported method rather than assuming the same default on every platform.",
  "0291": "Choose a concurrency boundary from the work it must handle. Cooperative I/O can use async tasks; blocking I/O may need bounded threads. Processes can isolate CPU work, with serialization and memory costs. An executor manages submitted work and its results, but durable jobs also need persisted state and replay ownership. Compare cancellation, queueing and failure recovery as well as elapsed time before choosing.",
  "0292": "An object remains reachable while a live reference path leads to it. CPython tracks strong references and uses cyclic garbage collection to find unreachable cycles. A weak reference observes an object without keeping it alive. Finalizers and weak-reference callbacks can complicate cleanup, and resurrection can make an object reachable again. Collection details differ across implementations, so files and other external resources need explicit cleanup instead of assumptions about timing.",
  "0293": "A shallow copy separates outer storage while retaining child references. A deep copy traverses the graph under a copying protocol and can preserve shared relationships and cycles. Serialization has a different contract: JSON cannot preserve every Python type or identity relationship. Pickle can reconstruct more Python-specific objects, but loading it can execute code. Treat format versions and trust as part of the input boundary, not as details to fix after decoding.",
  "0294": "A slow result can come from the algorithm, Python execution overhead, allocation or waiting for I/O. Profile a representative workload to locate the cost before changing code. Benchmarks need repeated runs with stated inputs, warmup and system conditions. Measurement tools add overhead of their own. A cache saves repeated work but introduces memory use and stale-value policy; measure the complete operation after adding it.",
  "0295": "A test exercises a stated requirement under controlled conditions. Fixtures supply setup and cleanup; their lifetime determines which tests can share state. Mocks control a dependency and record calls, but they cannot prove that the real dependency behaves the same way. Property tests check rules across generated inputs. Control clocks, randomness and ordering when they affect the result, and investigate shared state when a test passes only sometimes.",
  "0296": "A traceback connects an exception to the frames that led to it. A debugger lets you inspect those frames and values. Logging creates records that handlers format and send onward; levels and propagation affect which records appear. Add enough context to connect events without exposing secrets. Warning filters control separate diagnostic messages, while metrics summarize behavior over time. Request IDs can help logs but create too many distinct metric labels.",
  "0297": "A build frontend asks a PEP 517 backend to produce a distribution. A source distribution contains the source and build metadata; a wheel is already built for its supported Python, ABI and platform combinations. pyproject.toml declares project and build information. Check the files and metadata inside both artifacts, because a successful import from the source folder does not establish that the installed package is complete.",
  "0298": "A virtual environment separates installed packages. A resolver chooses versions across direct and transitive dependencies, while a lock records a resolution for supported environments. Hashes check artifact identity but do not establish that its source is trustworthy. Reproducibility also depends on the interpreter, platform and available artifacts. Before publishing, inspect the package contents and provenance as well as its version constraints.",
  "0299": "Calling native code crosses a boundary with its own memory and error rules. The Python C API handles Python objects and reference ownership; an FFI describes calls into another compiled library. Conversions and copies can erase the expected speed benefit. Buffer sharing avoids some copies but requires a valid layout and lifetime. The stable ABI improves compatibility across Python releases at the cost of access to some internals. Native memory bugs can crash the process.",
  "0300": "Keep business rules independent of storage and framework details. A use case can depend on a small contract, while an adapter implements the external operation. Application startup chooses the implementation and validates configuration. This dependency direction lets tests supply a fake without starting the whole service. The real adapter still owns resource lifetimes, persistence and the failure behavior promised to callers.",
  "0301": "Identify each point where untrusted data can influence an operation. Parse input under size limits, use safe query and command APIs, and check permission before accessing protected data. Paths and external tools have their own rules. Keep secrets out of source and logs, restrict privileges, and review dependency trust. Validation alone cannot contain arbitrary code execution or prevent resource exhaustion without corresponding limits.",
  "0302": "Follow one request from configuration and input validation through business logic and persistence. State who owns concurrent work, retries and cleanup. Then follow a failure through the error response and logs, including graceful shutdown. Packaging and deployment must preserve the assumptions used by tests. The example's adapter must atomically claim the scoped intent, create the project and record its replay result; a sequential fake cannot establish that database guarantee."
};

// Individually authored worked explanations.
export const EXPLANATION_REWRITES = {
  "0265": {
    foundation: "An RFQ can have several legs, each with its own quantity. You might keep those quantities in a list, update one, then copy the list for a calculation. Whether that copy protects the original depends on what the list contains. This lesson follows those changes through lists and nested lists, then looks at tuples and ranges. All three are sequences: they keep their values in order, though the operations they support differ.",
    profile: {
      analogy: "When two lists share a nested list, changing that nested list affects both. Replacing an item in one outer list affects only that outer list. The difference is which object you change.",
      sourceLabel: "Python: sequence types and operations",
      sourceUrl: "https://docs.python.org/3/library/stdtypes.html#sequence-types-list-tuple-range",
      labScope: "This example uses only the Python standard library. Predict whether each assertion will pass before running it. It checks the behavior described here; it does not measure performance.",
      code: `from copy import deepcopy
from collections import deque

quantities = [10, 20, 30]
alias = quantities
alias.append(40)
assert quantities == [10, 20, 30, 40]
assert alias is quantities

outer_copy = quantities[:]
outer_copy[0] = 99
assert quantities[0] == 10
assert outer_copy is not quantities

legs = [[10, 20], [30]]
shallow = legs.copy()
independent = deepcopy(legs)
shallow[0].append(99)
assert legs == [[10, 20, 99], [30]]
assert independent == [[10, 20], [30]]
shallow[1] = [70]
assert legs[1] == [30]

record = ("RFQ-1", [10, 20])
record[1].append(30)
assert record == ("RFQ-1", [10, 20, 30])
try:
    record[0] = "RFQ-2"
except TypeError:
    pass
else:
    raise AssertionError("Tuple slot replacement must fail")

assert quantities[1:3] == [20, 30]
assert quantities[99:] == []
assert quantities[::-1] == [40, 30, 20, 10]
first, *middle, last = range(5)
assert (first, middle, last) == (0, [1, 2, 3], 4)
assert list(range(2, 9, 3)) == [2, 5, 8]
queue = deque(["a", "b"])
assert queue.popleft() == "a"`,
      checkpoint: "Assignment shares the original list. A shallow copy separates outer slots only. Mutation of a shared child reaches both views; replacement of a copied outer slot does not. The tuple permits child mutation but rejects slot replacement."
    },
    mechanism: `<h2>Reading and updating a list</h2>
<p>In quantities = [10, 20, 30], the first item is quantities[0], which gives 10. Python counts indexes from zero. A negative index counts from the other end, so quantities[-1] gives 30.</p>
<p>You can replace the second item with quantities[1] = 25, or add an item at the end with append(40). This ability to change a list after creating it is what mutable means.</p>
<h2>What happens when you copy a list?</h2>
<pre><code>quantities = [10, 20, 30]
alias = quantities
alias.append(40)
print(quantities)  # [10, 20, 30, 40]

outer_copy = quantities[:]
outer_copy[0] = 99
print(quantities[0])  # 10
print(outer_copy[0])  # 99</code></pre>
<p>After alias = quantities, both names refer to the same list. That is why appending through alias also changes what you see through quantities: [10, 20, 30, 40]. In the practice code, alias is quantities checks whether the two names refer to the very same object. Two separate lists could contain equal values without passing that check.</p>
<p>The slice quantities[:] creates a separate list. You can replace outer_copy[0] with 99 and leave quantities[0] at 10. For this list of numbers, that gives you the independence you need. With a list inside the list, there is another object to account for:</p>
<pre><code>legs = [[10, 20], [30]]
shallow = legs.copy()
shallow[0].append(99)
print(legs)  # [[10, 20, 99], [30]]

shallow[1] = [70]
print(legs[1])     # [30]
print(shallow[1])  # [70]</code></pre>
<p>legs.copy() copies the outer list. It leaves the two inner lists shared. So shallow[0].append(99) changes the first inner list, and you see [10, 20, 99] through both legs and shallow. This is a shallow copy.</p>
<p>The next assignment, shallow[1] = [70], does something different. It replaces the second item in shallow with a new list. Nothing changes the second item in legs, which still holds [30]. Follow the brackets when reading these lines: are you replacing an outer item, or changing the list that item refers to?</p>
<p>In the full example, deepcopy also copies the inner lists, so independent stays unchanged. That can be useful when a calculation needs to change nested data. It can also copy far more than the calculation needs, and some resources cannot meaningfully be copied. Decide what the caller may change before choosing between a deep copy, copying just the affected part, or an immutable data model. See <a href="https://docs.python.org/3/library/copy.html">Python's copying rules</a>.</p>
<h2>Tuples can contain mutable objects</h2>
<p>Consider record = ("RFQ-1", [10, 20]). You cannot replace either of its two items: record[0] = "RFQ-2" raises TypeError. But record[1].append(30) works. It changes the list already held in the second position, without replacing that position.</p>
<p>A tuple like this therefore cannot serve as an immutable snapshot. It also cannot be a dictionary key, because its list item is unhashable.</p>
<h2>Slices, ranges and unpacking</h2>
<p>A slice uses start:stop:step. The stop index is excluded. quantities[1:3] selects indexes 1 and 2, giving [20, 30]. quantities[::-1] walks backward and produces a reversed list. Slice bounds can extend past the sequence, so quantities[99:] is empty. In contrast, directly reading quantities[99] raises IndexError. A zero slice step raises ValueError.</p>
<p>A range describes an integer progression. range(2, 9, 3) yields 2, 5 and 8; the stop value 9 is excluded. It does not store a separate item for every integer in the progression. Converting it to a list allocates those items. Slicing a range produces another compact range, so do not apply list-copy costs to it.</p>
<p>Unpacking assigns successive values to names. first, *middle, last = range(5) assigns 0 to first, [1, 2, 3] to middle and 4 to last. The starred target receives a list. Without a starred target, the number of values must match the number of targets. Too few or too many values raise ValueError; silently ignoring extra fields requires an explicit rule.</p>
<h2>Why some list operations cost more</h2>
<p>CPython stores a list's references in a resizable array. An index identifies a position directly. Appending is usually cheap, but occasionally the array must grow and copy its references. Spread over many appends, that extra work gives an amortized constant cost per append. Individual appends can still take different amounts of time.</p>
<p>Inserting at the front requires shifting the existing references. The longer the list, the more work that takes. A slice of k items also copies k references into new outer storage, so its time and space costs grow with the slice size.</p>
<p>For a FIFO job queue, removing the first list item over and over pays that shifting cost repeatedly. deque supports efficient operations at both ends: append adds a job and popleft removes the oldest. A list is still useful when you need direct indexed access. These operation costs help you choose a container; you would need measurements to establish latency in your own application. See <a href="https://docs.python.org/3/tutorial/datastructures.html#using-lists-as-queues">the queue example</a>.</p>`,
    reading: "Work through one block at a time and write down the values you expect. For the copies, also ask which names share an object. The tuple example catches TypeError deliberately so the remaining checks can run. The code has not been run as part of this prose edit.",
    pitfalls: [
      ["A report changes its source", "A shallow copy still shares nested legs. Copy the mutable part that the calculation owns, or avoid mutating source data. Verify both source and result after the calculation."],
      ["Repeated rows share storage", "[[0] * 3] * 3 repeats references to one row. Changing one cell appears in every row. [[0] * 3 for _ in range(3)] creates a separate row each time."],
      ["Copying becomes the bottleneck", "Repeated slices in a loop allocate new lists. Pass index bounds when the algorithm does not need independent storage; do not change ownership semantics merely to remove allocations."]
    ],
    rehearsal: "An RFQ risk calculation copies a list of legs, changes one nested quantity and unexpectedly changes the original RFQ. Trace the shared object, propose the smallest ownership fix and explain when deepcopy would be excessive. Then replace a FIFO list queue with deque and justify the operation costs.",
    answer: "The outer list was copied, but the nested leg remained shared. Copy the nested mutable data the calculation must change, or derive new output without source mutation. Test source preservation as well as the computed result. deque avoids repeated front shifts; this does not make it the best container for arbitrary indexed access. Tomorrow, predict the outcome when an outer slot is replaced instead of its child being mutated."
  }
};
