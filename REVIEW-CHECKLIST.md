# Lesson review checklist

Content passes recorded: **644/644**. Final individual review pending: **0**. Changed since the recorded revision: **0**.

These are documentation/sign-off counts, not a percentage of effort remaining. All lessons already received the baseline definition/reuse/senior-practice pass. Pending lessons may have substantial reviewed code, explanations and diagrams; consult NOTES.md and CONTENT-REVIEW.md before doing more work.

## Evidence and completion rule

The initial 45 records come from the explicit TypeScript completion report dated 2026-09-06. Their revision fingerprints were captured when this ledger was introduced on 2026-09-11 to detect subsequent changes; importing them is not a new line-by-line review. Other historical batch notes are retained as partial evidence, not silently upgraded to complete sign-offs.

For each pending lesson, review the existing work, resolve actual gaps, and record an individual evidence section covering:

- Clear, technically accurate explanation and topic-relevant primary sources; version-dependent guarantees identified.
- Diagram and walkthrough agree with the lesson's actual mechanism and example.
- Practice has setup, expected evidence and a failure/counterexample; runnable checks pass where the existing environment permits.
- Senior rehearsal has answer criteria, a credible alternative and a changed constraint—not only definitions.
- Remaining integration dependencies and deliberate scope limits are explicit; no learner mastery is inferred.

Then add/update that lesson in lesson-review-status.json with its manifest revision, review date and evidence filename. Evidence must contain a heading beginning `## NNNN`. Do not update a stale fingerprint without reviewing the change. Passing automated checks never promotes a pending lesson.

Content review is finished when every lesson has a recorded pass and no changed-content rechecks remain. It does not require building every exercise into a production application or executing integrations unavailable under the no-install constraint.

## Separate verification work

- [ ] Browser behavior and accessibility checks in an available browser environment.
- [ ] FastAPI/framework and database/broker integration checks; current fakes and syntax checks remain documented in CONTENT-REVIEW.md.
- [ ] Cloud, container, orchestration and model-provider experiments in authorized disposable environments; no installation or resource creation is implied.
- [ ] Confirm GitHub Pages serves the current manifest and lesson files; local path checks are not live deployment verification.

Verification entries in the manual ledger stay null until the named scope is verified; then reference a Markdown evidence file with environment, date and observed results. Partial checks do not close a whole category.

Optional learner decisions—not content-review blockers: replacing orientation progress with written assessment and choosing a personalized interview-core sequence.

## Work order and track counts

Continue pending lessons in catalog order, reusing prior evidence rather than restarting completed batch work. Recheck changed recorded lessons before declaring completion.

| Track | Recorded pass | Final review pending | Changed |
| --- | ---: | ---: | ---: |
| Engineering Foundations and Workflow | 5 | 0 | 0 |
| Software Design, Clean Code, and Patterns | 12 | 0 | 0 |
| Computer Science and Coding Interviews | 33 | 0 | 0 |
| Web Platform and Browser Internals | 5 | 0 | 0 |
| Networking and Operating Systems Foundations | 12 | 0 | 0 |
| Low-Level Design and Machine Coding | 12 | 0 | 0 |
| JavaScript Complete Deep Dive | 46 | 0 | 0 |
| TypeScript Complete Deep Dive | 45 | 0 | 0 |
| React Complete Deep Dive | 43 | 0 | 0 |
| Node.js Complete Deep Dive | 46 | 0 | 0 |
| Python Complete Deep Dive | 43 | 0 | 0 |
| FastAPI Complete Deep Dive | 43 | 0 | 0 |
| PostgreSQL, Redis, and Data Systems Complete Deep Dive | 51 | 0 | 0 |
| API Design and Distributed Systems Complete Deep Dive | 59 | 0 | 0 |
| Microservices, Domain-Driven Design, and Event-Driven Systems | 9 | 0 | 0 |
| Testing, Security, Reliability, and SaaS Operations | 10 | 0 | 0 |
| Cloud and AWS Complete Deep Dive | 32 | 0 | 0 |
| DevOps Complete Deep Dive | 20 | 0 | 0 |
| Docker Complete Deep Dive | 20 | 0 | 0 |
| Kubernetes Complete Deep Dive | 30 | 0 | 0 |
| Mathematics and Machine Learning Foundations | 4 | 0 | 0 |
| LLM and Transformer Internals | 5 | 0 | 0 |
| AI Application Engineering | 8 | 0 | 0 |
| Search, Embeddings, and RAG | 9 | 0 | 0 |
| Agents and Durable AI Workflows | 9 | 0 | 0 |
| AI Evaluations, Observability, and Safety | 6 | 0 | 0 |
| Production Capstone | 4 | 0 | 0 |
| International Interviews and Relocation Readiness Complete Module | 23 | 0 | 0 |

## Engineering Foundations and Workflow

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0001 · Terminal, processes, files, permissions, environment variables, signals, and exit codes](lessons/0001-terminal-processes-files-permissions-environment-variables-signals-and-e.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0002 · Git object model and collaborative workflows](lessons/0002-git-object-model-and-collaborative-workflows.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0003 · Dependency management and reproducible environments](lessons/0003-dependency-management-and-reproducible-environments.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0004 · Debugging as hypothesis testing](lessons/0004-debugging-as-hypothesis-testing.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0005 · Technical writing and architecture decisions](lessons/0005-technical-writing-and-architecture-decisions.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |

## Software Design, Clean Code, and Patterns

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0006 · Clean code, naming, functions, control flow, comments, formatting, and local reasoning](lessons/0006-clean-code-naming-functions-control-flow-comments-formatting-and-local-r.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0007 · DRY, knowledge duplication, accidental duplication, KISS, YAGNI, simplicity, and premature abstraction](lessons/0007-dry-knowledge-duplication-accidental-duplication-kiss-yagni-simplicity-a.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0008 · Cohesion, coupling, encapsulation, information hiding, dependency direction, boundaries, and change cost](lessons/0008-cohesion-coupling-encapsulation-information-hiding-dependency-direction-.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0009 · Single Responsibility Principle, Open-Closed Principle, reasons to change, extension points, and plugin boundaries](lessons/0009-single-responsibility-principle-open-closed-principle-reasons-to-change-.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0010 · Liskov Substitution Principle, Interface Segregation Principle, Dependency Inversion Principle, contracts, substitutability, and capability interfaces](lessons/0010-liskov-substitution-principle-interface-segregation-principle-dependency.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0011 · Composition, inheritance, delegation, polymorphism, data-oriented design, and functional cores](lessons/0011-composition-inheritance-delegation-polymorphism-data-oriented-design-and.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0012 · Design pattern literacy, context, forces, intent, consequences, implementation variants, and anti-patterns](lessons/0012-design-pattern-literacy-context-forces-intent-consequences-implementatio.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0013 · Creational patterns, Factory Method, Abstract Factory, Builder, Prototype, Singleton, and dependency injection](lessons/0013-creational-patterns-factory-method-abstract-factory-builder-prototype-si.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0014 · Structural patterns, Adapter, Facade, Decorator, Composite, Proxy, Bridge, and Flyweight](lessons/0014-structural-patterns-adapter-facade-decorator-composite-proxy-bridge-and-.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0015 · Behavioral patterns, Strategy, Observer, Command, State, Chain of Responsibility, Template Method, Iterator, Mediator, Memento, and Visitor](lessons/0015-behavioral-patterns-strategy-observer-command-state-chain-of-responsibil.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0016 · Code smells, characterization tests, refactoring, seams, small steps, behavior preservation, and review evidence](lessons/0016-code-smells-characterization-tests-refactoring-seams-small-steps-behavio.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |
| [0017 · Architecture patterns, layered architecture, hexagonal architecture, clean architecture, vertical slices, repository, unit of work, and modular monoliths](lessons/0017-architecture-patterns-layered-architecture-hexagonal-architecture-clean-.html) | Recorded pass | [2026-09-11](REVIEW-EVIDENCE.md) |

## Computer Science and Coding Interviews

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0018 · Complexity analysis and cost models](lessons/0018-complexity-analysis-and-cost-models.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0019 · Arrays, strings, hash tables, stacks, queues, and linked structures](lessons/0019-arrays-strings-hash-tables-stacks-queues-and-linked-structures.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0020 · Trees, heaps, tries, graphs, and disjoint sets](lessons/0020-trees-heaps-tries-graphs-and-disjoint-sets.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0021 · Recursion, backtracking, greedy methods, and dynamic programming](lessons/0021-recursion-backtracking-greedy-methods-and-dynamic-programming.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0022 · Sorting, comparison bounds, stability, merge sort, quicksort, heapsort, counting sort, and selection](lessons/0022-sorting-comparison-bounds-stability-merge-sort-quicksort-heapsort-counti.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0023 · Binary search, boundary invariants, lower bound, upper bound, monotonic predicates, rotated arrays, and answer search](lessons/0023-binary-search-boundary-invariants-lower-bound-upper-bound-monotonic-pred.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0024 · Array and string patterns, two pointers, sliding windows, prefix sums, difference arrays, frequency maps, and intervals](lessons/0024-array-and-string-patterns-two-pointers-sliding-windows-prefix-sums-diffe.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0025 · Linked-list patterns, sentinel nodes, fast and slow pointers, reversal, stacks, queues, deques, and monotonic structures](lessons/0025-linked-list-patterns-sentinel-nodes-fast-and-slow-pointers-reversal-stac.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0026 · Tree algorithms, depth-first traversal, breadth-first traversal, binary search trees, heaps, tries, lowest common ancestors, and serialization](lessons/0026-tree-algorithms-depth-first-traversal-breadth-first-traversal-binary-sea.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0027 · Graph algorithms, representations, BFS, DFS, topological sorting, shortest paths, minimum spanning trees, and union-find](lessons/0027-graph-algorithms-representations-bfs-dfs-topological-sorting-shortest-pa.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0028 · Backtracking, decision trees, permutations, combinations, subsets, constraint propagation, pruning, and branch and bound](lessons/0028-backtracking-decision-trees-permutations-combinations-subsets-constraint.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0029 · Dynamic programming, state, transitions, base cases, memoization, tabulation, reconstruction, and space optimization](lessons/0029-dynamic-programming-state-transitions-base-cases-memoization-tabulation-.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0030 · Greedy algorithms, exchange arguments, stays-ahead proofs, intervals, scheduling, heaps, and counterexamples](lessons/0030-greedy-algorithms-exchange-arguments-stays-ahead-proofs-intervals-schedu.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0031 · Bit manipulation, binary representation, masks, shifts, XOR, integer limits, subsets, and practical bitsets](lessons/0031-bit-manipulation-binary-representation-masks-shifts-xor-integer-limits-s.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0032 · Arrays and hashing, frequency maps, sets, grouping, and lookup tradeoffs](lessons/0032-arrays-and-hashing-frequency-maps-sets-grouping-and-lookup-tradeoffs.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0033 · Two pointers, converging scans, same-direction scans, partitioning, and sorted invariants](lessons/0033-two-pointers-converging-scans-same-direction-scans-partitioning-and-sort.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0034 · Sliding windows, fixed windows, variable windows, frequency constraints, and monotonic deques](lessons/0034-sliding-windows-fixed-windows-variable-windows-frequency-constraints-and.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0035 · Stacks, monotonic stacks, matching, deferred resolution, and amortized analysis](lessons/0035-stacks-monotonic-stacks-matching-deferred-resolution-and-amortized-analy.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0036 · Linked lists, sentinel nodes, reversal, fast and slow pointers, and pointer surgery](lessons/0036-linked-lists-sentinel-nodes-reversal-fast-and-slow-pointers-and-pointer-.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0037 · Heaps, priority queues, top-k selection, multiway merge, and streaming medians](lessons/0037-heaps-priority-queues-top-k-selection-multiway-merge-and-streaming-media.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0038 · Binary search, boundary invariants, rotated order, monotonic predicates, and answer search](lessons/0038-binary-search-boundary-invariants-rotated-order-monotonic-predicates-and.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0039 · Depth-first search, recursive frames, iterative stacks, tree paths, and connected regions](lessons/0039-depth-first-search-recursive-frames-iterative-stacks-tree-paths-and-conn.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0040 · Greedy algorithms, local choices, exchange arguments, stays-ahead proofs, and counterexamples](lessons/0040-greedy-algorithms-local-choices-exchange-arguments-stays-ahead-proofs-an.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0041 · Dynamic programming, state, recurrences, memoization, tabulation, and reconstruction](lessons/0041-dynamic-programming-state-recurrences-memoization-tabulation-and-reconst.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0042 · Graphs, adjacency structures, topological order, weighted shortest paths, and union-find](lessons/0042-graphs-adjacency-structures-topological-order-weighted-shortest-paths-an.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0043 · Backtracking, decision trees, reversible state, pruning, combinations, and constraint search](lessons/0043-backtracking-decision-trees-reversible-state-pruning-combinations-and-co.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0044 · Breadth-first search, queues, levels, shortest unweighted paths, and multi-source expansion](lessons/0044-breadth-first-search-queues-levels-shortest-unweighted-paths-and-multi-s.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0045 · Tries, prefix trees, shared prefixes, autocomplete, and wildcard search](lessons/0045-tries-prefix-trees-shared-prefixes-autocomplete-and-wildcard-search.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0046 · Prefix sums, running aggregates, range queries, subarray counts, and difference arrays](lessons/0046-prefix-sums-running-aggregates-range-queries-subarray-counts-and-differe.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0047 · Matrices, coordinate transforms, boundary walks, in-place rotation, and marker encoding](lessons/0047-matrices-coordinate-transforms-boundary-walks-in-place-rotation-and-mark.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0048 · Intervals, sorting, merging, insertion, sweep events, and overlap counting](lessons/0048-intervals-sorting-merging-insertion-sweep-events-and-overlap-counting.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0049 · Bit manipulation, masks, shifts, XOR, set-bit iteration, and subset encoding](lessons/0049-bit-manipulation-masks-shifts-xor-set-bit-iteration-and-subset-encoding.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0050 · Interview execution and verification](lessons/0050-interview-execution-and-verification.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |

## Web Platform and Browser Internals

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0051 · URLs, DNS, TCP, TLS, HTTP, proxies, and CDNs](lessons/0051-urls-dns-tcp-tls-http-proxies-and-cdns.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0052 · HTML semantics, parsing, DOM construction, and accessibility trees](lessons/0052-html-semantics-parsing-dom-construction-and-accessibility-trees.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0053 · CSS cascade, layout, stacking, painting, and compositing](lessons/0053-css-cascade-layout-stacking-painting-and-compositing.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0054 · Browser event loop, tasks, microtasks, rendering, and input](lessons/0054-browser-event-loop-tasks-microtasks-rendering-and-input.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0055 · Browser security and storage](lessons/0055-browser-security-and-storage.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |

## Networking and Operating Systems Foundations

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0056 · Request to wire, sockets, encapsulation, frames, packets, segments, and application messages](lessons/0056-request-to-wire-sockets-encapsulation-frames-packets-segments-and-applic.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0057 · IPv4, IPv6, CIDR, subnet masks, MAC addresses, ARP, and neighbor discovery](lessons/0057-ipv4-ipv6-cidr-subnet-masks-mac-addresses-arp-and-neighbor-discovery.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0058 · Routing tables, longest-prefix match, default gateways, ICMP, traceroute, and NAT](lessons/0058-routing-tables-longest-prefix-match-default-gateways-icmp-traceroute-and.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0059 · UDP, TCP, ports, sockets, handshakes, sequence numbers, acknowledgements, MTU, and MSS](lessons/0059-udp-tcp-ports-sockets-handshakes-sequence-numbers-acknowledgements-mtu-a.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0060 · TCP flow control, congestion control, slow start, AIMD, retransmission, backpressure, and overload](lessons/0060-tcp-flow-control-congestion-control-slow-start-aimd-retransmission-backp.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0061 · DNS resolution, TLS handshakes, certificates, HTTP semantics, HTTP versions, and connection reuse](lessons/0061-dns-resolution-tls-handshakes-certificates-http-semantics-http-versions-.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0062 · System calls, user mode, kernel mode, file descriptors, process creation, exec, signals, and exit](lessons/0062-system-calls-user-mode-kernel-mode-file-descriptors-process-creation-exe.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0063 · Processes, threads, process control blocks, context switches, CPU scheduling, and IPC](lessons/0063-processes-threads-process-control-blocks-context-switches-cpu-scheduling.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0064 · Race conditions, locks, semaphores, condition variables, atomics, deadlocks, and lock ordering](lessons/0064-race-conditions-locks-semaphores-condition-variables-atomics-deadlocks-a.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0065 · Address spaces, segmentation, paging, page tables, the MMU, virtual memory, demand paging, and replacement](lessons/0065-address-spaces-segmentation-paging-page-tables-the-mmu-virtual-memory-de.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0066 · I/O, disks, SSDs, files, directories, VFS, buffering, caching, journaling, and durability](lessons/0066-i-o-disks-ssds-files-directories-vfs-buffering-caching-journaling-and-du.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0067 · Namespaces, cgroups, containers, virtualization, resource limits, observability, and systems debugging capstone](lessons/0067-namespaces-cgroups-containers-virtualization-resource-limits-observabili.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |

## Low-Level Design and Machine Coding

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0068 · Requirement discovery, use cases, constraints, actors, invariants, and scope control](lessons/0068-requirement-discovery-use-cases-constraints-actors-invariants-and-scope-.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0069 · Domain modeling, entities, value objects, identity, equality, immutability, and validation](lessons/0069-domain-modeling-entities-value-objects-identity-equality-immutability-an.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0070 · Object relationships, composition, aggregation, association, ownership, lifecycle, and UML class diagrams](lessons/0070-object-relationships-composition-aggregation-association-ownership-lifec.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0071 · Interfaces, abstract base classes, protocols, dependency injection, and substitutable adapters](lessons/0071-interfaces-abstract-base-classes-protocols-dependency-injection-and-subs.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0072 · Strategy, Factory, Adapter, Decorator, Observer, and pattern selection by changing requirement](lessons/0072-strategy-factory-adapter-decorator-observer-and-pattern-selection-by-cha.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0073 · State machines, commands, transitions, workflows, and invalid-state prevention](lessons/0073-state-machines-commands-transitions-workflows-and-invalid-state-preventi.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0074 · Concurrency, atomic operations, locks, idempotency, contention, and thread-safe design](lessons/0074-concurrency-atomic-operations-locks-idempotency-contention-and-thread-sa.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0075 · Repositories, transactions, persistence boundaries, domain events, errors, and recovery](lessons/0075-repositories-transactions-persistence-boundaries-domain-events-errors-an.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0076 · Testable design, unit tests, contract tests, fakes, edge cases, and executable acceptance criteria](lessons/0076-testable-design-unit-tests-contract-tests-fakes-edge-cases-and-executabl.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0077 · Parking lot machine-coding case study, allocation, tickets, pricing, and extension seams](lessons/0077-parking-lot-machine-coding-case-study-allocation-tickets-pricing-and-ext.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0078 · Splitwise expense-sharing case study, exact arithmetic, balances, settlement, and simplification](lessons/0078-splitwise-expense-sharing-case-study-exact-arithmetic-balances-settlemen.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0079 · Timed machine-coding capstone, LRU cache, rate limiter, demo strategy, and review rubric](lessons/0079-timed-machine-coding-capstone-lru-cache-rate-limiter-demo-strategy-and-r.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |

## JavaScript Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0080 · JavaScript setup, strict mode, runtimes, consoles, and reproducible experiments](lessons/0080-javascript-setup-strict-mode-runtimes-consoles-and-reproducible-experime.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0081 · ECMAScript specification, syntax grammar, abstract operations, and completion records](lessons/0081-ecmascript-specification-syntax-grammar-abstract-operations-and-completi.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0082 · Primitive values, objects, typeof, null, undefined, and identity](lessons/0082-primitive-values-objects-typeof-null-undefined-and-identity.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0083 · Numbers, IEEE-754, NaN, signed zero, BigInt, and numeric precision](lessons/0083-numbers-ieee-754-nan-signed-zero-bigint-and-numeric-precision.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0084 · Strings, Unicode, code units, code points, graphemes, and normalization](lessons/0084-strings-unicode-code-units-code-points-graphemes-and-normalization.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0085 · Type coercion, ToPrimitive, valueOf, toString, truthiness, and operators](lessons/0085-type-coercion-toprimitive-valueof-tostring-truthiness-and-operators.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0086 · Equality, strict equality, Object.is, SameValueZero, and relational comparison](lessons/0086-equality-strict-equality-object-is-samevaluezero-and-relational-comparis.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0087 · Declarations, lexical environments, environment records, scope, and name resolution](lessons/0087-declarations-lexical-environments-environment-records-scope-and-name-res.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0088 · Execution contexts, call stack, realms, scripts, and functions](lessons/0088-execution-contexts-call-stack-realms-scripts-and-functions.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0089 · Hoisting, var, let, const, temporal dead zone, and global bindings](lessons/0089-hoisting-var-let-const-temporal-dead-zone-and-global-bindings.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0090 · Closures, captured bindings, factories, privacy, stale state, and retention](lessons/0090-closures-captured-bindings-factories-privacy-stale-state-and-retention.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0091 · Functions, declarations, expressions, arrows, parameters, arguments, and arity](lessons/0091-functions-declarations-expressions-arrows-parameters-arguments-and-arity.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0092 · this binding, call, apply, bind, method calls, constructors, and new.target](lessons/0092-this-binding-call-apply-bind-method-calls-constructors-and-new-target.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0093 · Objects, property keys, own properties, descriptors, enumerability, and ownership](lessons/0093-objects-property-keys-own-properties-descriptors-enumerability-and-owner.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0094 · Prototypes, delegation, property lookup, Object.create, and prototype mutation](lessons/0094-prototypes-delegation-property-lookup-object-create-and-prototype-mutati.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0095 · Classes, fields, private elements, static initialization, inheritance, and super](lessons/0095-classes-fields-private-elements-static-initialization-inheritance-and-su.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0096 · Composition, immutability, shallow copies, deep copies, freezing, and structural sharing](lessons/0096-composition-immutability-shallow-copies-deep-copies-freezing-and-structu.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0097 · Arrays, holes, length, mutation, copying methods, sorting, and element kinds](lessons/0097-arrays-holes-length-mutation-copying-methods-sorting-and-element-kinds.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0098 · Map, Set, WeakMap, WeakSet, keys, identity, and collection selection](lessons/0098-map-set-weakmap-weakset-keys-identity-and-collection-selection.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0099 · Iteration protocols, iterable, iterator, Iterator helpers, and custom traversal](lessons/0099-iteration-protocols-iterable-iterator-iterator-helpers-and-custom-traver.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0100 · Generators, yield, yield star, next, throw, return, and suspended execution](lessons/0100-generators-yield-yield-star-next-throw-return-and-suspended-execution.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0101 · Symbols, well-known symbols, protocols, and customization hooks](lessons/0101-symbols-well-known-symbols-protocols-and-customization-hooks.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0102 · Proxy, Reflect, traps, invariants, revocation, and metaprogramming](lessons/0102-proxy-reflect-traps-invariants-revocation-and-metaprogramming.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0103 · Errors, throw, try, catch, finally, cause, AggregateError, and custom errors](lessons/0103-errors-throw-try-catch-finally-cause-aggregateerror-and-custom-errors.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0104 · ECMAScript modules, live bindings, linking, evaluation, cycles, and top-level await](lessons/0104-ecmascript-modules-live-bindings-linking-evaluation-cycles-and-top-level.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0105 · Dynamic import, import attributes, module boundaries, code splitting, and tree shaking](lessons/0105-dynamic-import-import-attributes-module-boundaries-code-splitting-and-tr.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0106 · Promises, states, fate, resolving functions, thenables, reactions, and chaining](lessons/0106-promises-states-fate-resolving-functions-thenables-reactions-and-chainin.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0107 · Async functions, await, suspension, resumption, errors, and sequential execution](lessons/0107-async-functions-await-suspension-resumption-errors-and-sequential-execut.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0108 · Event loop, tasks, microtasks, rendering, browser hosts, and Node hosts](lessons/0108-event-loop-tasks-microtasks-rendering-browser-hosts-and-node-hosts.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0109 · Promise combinators, bounded concurrency, backpressure, retries, and partial failure](lessons/0109-promise-combinators-bounded-concurrency-backpressure-retries-and-partial.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0110 · AbortController, AbortSignal, cancellation, deadlines, timeouts, and cleanup](lessons/0110-abortcontroller-abortsignal-cancellation-deadlines-timeouts-and-cleanup.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0111 · Explicit resource management, using, await using, Symbol.dispose, and DisposableStack](lessons/0111-explicit-resource-management-using-await-using-symbol-dispose-and-dispos.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0112 · JSON, structured clone, serialization, transfer, identity, and schema evolution](lessons/0112-json-structured-clone-serialization-transfer-identity-and-schema-evoluti.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0113 · Date, time zones, Intl, formatting, collation, and temporal modeling](lessons/0113-date-time-zones-intl-formatting-collation-and-temporal-modeling.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0114 · Regular expressions, Unicode modes, groups, lookarounds, backtracking, and ReDoS](lessons/0114-regular-expressions-unicode-modes-groups-lookarounds-backtracking-and-re.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0115 · ArrayBuffer, TypedArray, DataView, binary data, endianness, and detachment](lessons/0115-arraybuffer-typedarray-dataview-binary-data-endianness-and-detachment.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0116 · SharedArrayBuffer, Atomics, agents, workers, memory ordering, and synchronization](lessons/0116-sharedarraybuffer-atomics-agents-workers-memory-ordering-and-synchroniza.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0117 · Reachability, garbage collection, weak references, FinalizationRegistry, leaks, and cleanup](lessons/0117-reachability-garbage-collection-weak-references-finalizationregistry-lea.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0118 · Engine pipeline, parsing, AST, bytecode, interpreter, JIT, and deoptimization](lessons/0118-engine-pipeline-parsing-ast-bytecode-interpreter-jit-and-deoptimization.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0119 · Hidden classes, shapes, inline caches, elements kinds, optimization, and performance](lessons/0119-hidden-classes-shapes-inline-caches-elements-kinds-optimization-and-perf.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0120 · Measurement, complexity, benchmarking, warmup, variance, and event-loop responsiveness](lessons/0120-measurement-complexity-benchmarking-warmup-variance-and-event-loop-respo.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0121 · JavaScript security, prototype pollution, injection, eval, supply chain, and trust boundaries](lessons/0121-javascript-security-prototype-pollution-injection-eval-supply-chain-and-.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0122 · Testing, assertions, table tests, property tests, async tests, fakes, and timers](lessons/0122-testing-assertions-table-tests-property-tests-async-tests-fakes-and-time.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0123 · Debugging, breakpoints, stack traces, source maps, heap snapshots, CPU profiles, and tracing](lessons/0123-debugging-breakpoints-stack-traces-source-maps-heap-snapshots-cpu-profil.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0124 · JavaScript architecture, module cohesion, dependency direction, functional core, object boundaries, and contracts](lessons/0124-javascript-architecture-module-cohesion-dependency-direction-functional-.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0125 · JavaScript production architecture capstone, event pipeline, reliability, observability, security, and performance](lessons/0125-javascript-production-architecture-capstone-event-pipeline-reliability-o.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |

## TypeScript Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0126 · TypeScript setup, compiler versions, tsconfig, strict mode, and reproducible checks](lessons/0126-typescript-setup-compiler-versions-tsconfig-strict-mode-and-reproducible.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0127 · Compiler pipeline, scanner, parser, binder, checker, transformer, emitter, and language service](lessons/0127-compiler-pipeline-scanner-parser-binder-checker-transformer-emitter-and-.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0128 · TypeScript design goals, type erasure, structural typing, gradual adoption, and soundness tradeoffs](lessons/0128-typescript-design-goals-type-erasure-structural-typing-gradual-adoption-.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0129 · Type annotations, inference, contextual typing, best common types, and widening](lessons/0129-type-annotations-inference-contextual-typing-best-common-types-and-widen.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0130 · any, unknown, never, void, undefined, null, and top or bottom types](lessons/0130-any-unknown-never-void-undefined-null-and-top-or-bottom-types.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0131 · Assignability, structural compatibility, freshness, excess property checks, and open object types](lessons/0131-assignability-structural-compatibility-freshness-excess-property-checks-.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0132 · Optional properties, exactOptionalPropertyTypes, indexed access, noUncheckedIndexedAccess, and safe absence](lessons/0132-optional-properties-exactoptionalpropertytypes-indexed-access-nounchecke.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0133 · Union types, intersection types, common members, impossible intersections, and composition](lessons/0133-union-types-intersection-types-common-members-impossible-intersections-a.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0134 · Discriminated unions, state machines, exhaustiveness, never, and illegal states](lessons/0134-discriminated-unions-state-machines-exhaustiveness-never-and-illegal-sta.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0135 · Control-flow analysis, narrowing, typeof, instanceof, in, equality, and truthiness](lessons/0135-control-flow-analysis-narrowing-typeof-instanceof-in-equality-and-truthi.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0136 · User-defined type guards, assertion functions, predicates, validation, and narrowing safety](lessons/0136-user-defined-type-guards-assertion-functions-predicates-validation-and-n.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0137 · Function types, call signatures, construct signatures, parameters, callbacks, and overloads](lessons/0137-function-types-call-signatures-construct-signatures-parameters-callbacks.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0138 · Object types, interfaces, type aliases, declaration merging, index signatures, and property keys](lessons/0138-object-types-interfaces-type-aliases-declaration-merging-index-signature.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0139 · Readonly, const assertions, readonly arrays, tuples, satisfies, and literal preservation](lessons/0139-readonly-const-assertions-readonly-arrays-tuples-satisfies-and-literal-p.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0140 · Generics, type parameters, constraints, defaults, relationships, and reusable contracts](lessons/0140-generics-type-parameters-constraints-defaults-relationships-and-reusable.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0141 · Generic inference, inference sites, contextual inference, const type parameters, and inference failures](lessons/0141-generic-inference-inference-sites-contextual-inference-const-type-parame.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0142 · keyof, typeof in type positions, indexed access types, lookup relationships, and value-derived types](lessons/0142-keyof-typeof-in-type-positions-indexed-access-types-lookup-relationships.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0143 · Mapped types, mapping modifiers, key remapping, property transforms, and homomorphism](lessons/0143-mapped-types-mapping-modifiers-key-remapping-property-transforms-and-hom.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0144 · Conditional types, constraints, infer, distributivity, recursion, and deferred evaluation](lessons/0144-conditional-types-constraints-infer-distributivity-recursion-and-deferre.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0145 · Template literal types, string unions, key paths, event names, and combinatorial growth](lessons/0145-template-literal-types-string-unions-key-paths-event-names-and-combinato.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0146 · Built-in utility types, Partial, Required, Pick, Omit, Record, ReturnType, Parameters, and Awaited](lessons/0146-built-in-utility-types-partial-required-pick-omit-record-returntype-para.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0147 · Variance, covariance, contravariance, invariance, bivariance, and strictFunctionTypes](lessons/0147-variance-covariance-contravariance-invariance-bivariance-and-strictfunct.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0148 · Classes, public, protected, private, abstract classes, parameter properties, and override safety](lessons/0148-classes-public-protected-private-abstract-classes-parameter-properties-a.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0149 · Nominal techniques, private members, unique symbols, branded types, opaque IDs, and units](lessons/0149-nominal-techniques-private-members-unique-symbols-branded-types-opaque-i.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0150 · Decorators, standard decorator semantics, contexts, metadata boundaries, and dependency injection](lessons/0150-decorators-standard-decorator-semantics-contexts-metadata-boundaries-and.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0151 · Enums, const enums, literal unions, runtime objects, reverse mappings, and alternatives](lessons/0151-enums-const-enums-literal-unions-runtime-objects-reverse-mappings-and-al.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0152 · ECMAScript modules, type-only imports, verbatimModuleSyntax, isolatedModules, and emit correctness](lessons/0152-ecmascript-modules-type-only-imports-verbatimmodulesyntax-isolatedmodule.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0153 · Module resolution, NodeNext, bundler mode, package exports, imports, paths, and traceResolution](lessons/0153-module-resolution-nodenext-bundler-mode-package-exports-imports-paths-an.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0154 · Declaration files, ambient declarations, global scope, module augmentation, and lib selection](lessons/0154-declaration-files-ambient-declarations-global-scope-module-augmentation-.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0155 · Typed library authoring, declaration emit, package exports, typesVersions, API surface, and compatibility](lessons/0155-typed-library-authoring-declaration-emit-package-exports-typesversions-a.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0156 · JavaScript interop, allowJs, checkJs, JSDoc types, declaration generation, and gradual migration](lessons/0156-javascript-interop-allowjs-checkjs-jsdoc-types-declaration-generation-an.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0157 · Runtime validation, unknown input, parsing, schemas, decoders, and trusted domain types](lessons/0157-runtime-validation-unknown-input-parsing-schemas-decoders-and-trusted-do.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0158 · HTTP, environment, database, queue, file, and AI-output type boundaries](lessons/0158-http-environment-database-queue-file-and-ai-output-type-boundaries.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0159 · Async typing, Promise, Awaited, async iterables, generators, cancellation, and error channels](lessons/0159-async-typing-promise-awaited-async-iterables-generators-cancellation-and.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0160 · React with TypeScript, component props, events, refs, generics, reducers, and polymorphism](lessons/0160-react-with-typescript-component-props-events-refs-generics-reducers-and-.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0161 · Node.js with TypeScript, ESM, configuration, processes, streams, errors, and service boundaries](lessons/0161-node-js-with-typescript-esm-configuration-processes-streams-errors-and-s.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0162 · Type testing, ts-expect-error, assignability assertions, declaration tests, runtime tests, and contract evidence](lessons/0162-type-testing-ts-expect-error-assignability-assertions-declaration-tests-.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0163 · tsconfig strictness, target, lib, module, moduleResolution, include, exclude, and build ownership](lessons/0163-tsconfig-strictness-target-lib-module-moduleresolution-include-exclude-a.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0164 · Project references, composite projects, incremental builds, declaration boundaries, monorepos, and build mode](lessons/0164-project-references-composite-projects-incremental-builds-declaration-bou.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0165 · Compiler API, AST traversal, symbols, types, transforms, language service, and tooling](lessons/0165-compiler-api-ast-traversal-symbols-types-transforms-language-service-and.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0166 · Type-checker performance, extendedDiagnostics, generateTrace, instantiation depth, project size, and editor latency](lessons/0166-type-checker-performance-extendeddiagnostics-generatetrace-instantiation.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0167 · TypeScript upgrades, release notes, deprecations, strictness migration, dependency types, and compatibility](lessons/0167-typescript-upgrades-release-notes-deprecations-strictness-migration-depe.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0168 · Safe AI-assisted TypeScript, generated code, type constraints, validation, tests, review, and provenance](lessons/0168-safe-ai-assisted-typescript-generated-code-type-constraints-validation-t.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0169 · TypeScript architecture, domain modeling, ports, adapters, dependency direction, and change cost](lessons/0169-typescript-architecture-domain-modeling-ports-adapters-dependency-direct.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |
| [0170 · TypeScript production architecture capstone, full-stack contracts, reliability, security, observability, and evolution](lessons/0170-typescript-production-architecture-capstone-full-stack-contracts-reliabi.html) | Recorded pass | [2026-09-06](TYPESCRIPT-CONTENT-REVIEW.md) |

## React Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0171 · React setup, project anatomy, module graph, and development tooling](lessons/0171-react-setup-project-anatomy-module-graph-and-development-tooling.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0172 · JSX, elements, expressions, fragments, and element creation](lessons/0172-jsx-elements-expressions-fragments-and-element-creation.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0173 · Components, props, children, composition, and public component APIs](lessons/0173-components-props-children-composition-and-public-component-apis.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0174 · Purity, Rules of React, Rules of Hooks, and Strict Mode](lessons/0174-purity-rules-of-react-rules-of-hooks-and-strict-mode.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0175 · Events, propagation, event handlers, update priority, and batching](lessons/0175-events-propagation-event-handlers-update-priority-and-batching.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0176 · useState, render snapshots, update queues, batching, and functional updates](lessons/0176-usestate-render-snapshots-update-queues-batching-and-functional-updates.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0177 · useReducer, actions, reducer purity, initialization, and dispatch](lessons/0177-usereducer-actions-reducer-purity-initialization-and-dispatch.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0178 · State modeling, normalization, derived data, lifting state, and ownership](lessons/0178-state-modeling-normalization-derived-data-lifting-state-and-ownership.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0179 · Identity, keys, reconciliation, state preservation, and reset](lessons/0179-identity-keys-reconciliation-state-preservation-and-reset.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0180 · createContext and useContext, providers, defaults, and update propagation](lessons/0180-createcontext-and-usecontext-providers-defaults-and-update-propagation.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0181 · useRef, DOM refs, ref callbacks, and useImperativeHandle](lessons/0181-useref-dom-refs-ref-callbacks-and-useimperativehandle.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0182 · useEffect, external synchronization, setup, cleanup, and dependencies](lessons/0182-useeffect-external-synchronization-setup-cleanup-and-dependencies.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0183 · useLayoutEffect and useInsertionEffect timing](lessons/0183-uselayouteffect-and-useinsertioneffect-timing.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0184 · useEffectEvent, reactive dependencies, and stale closure repair](lessons/0184-useeffectevent-reactive-dependencies-and-stale-closure-repair.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0185 · Custom Hooks, reusable stateful logic, useDebugValue, and hook contracts](lessons/0185-custom-hooks-reusable-stateful-logic-usedebugvalue-and-hook-contracts.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0186 · memo, useMemo, useCallback, referential equality, and cache invalidation](lessons/0186-memo-usememo-usecallback-referential-equality-and-cache-invalidation.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0187 · useTransition, startTransition, useDeferredValue, and interruptible rendering](lessons/0187-usetransition-starttransition-usedeferredvalue-and-interruptible-renderi.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0188 · useId, deterministic identity, accessibility relationships, and hydration](lessons/0188-useid-deterministic-identity-accessibility-relationships-and-hydration.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0189 · useSyncExternalStore, subscriptions, snapshots, and server snapshots](lessons/0189-usesyncexternalstore-subscriptions-snapshots-and-server-snapshots.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0190 · use, promises, context resources, Suspense integration, and conditional reads](lessons/0190-use-promises-context-resources-suspense-integration-and-conditional-read.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0191 · useActionState, useOptimistic, useFormStatus, actions, and pending UI](lessons/0191-useactionstate-useoptimistic-useformstatus-actions-and-pending-ui.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0192 · Controlled and uncontrolled inputs, forms, validation, and file fields](lessons/0192-controlled-and-uncontrolled-inputs-forms-validation-and-file-fields.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0193 · Client data fetching, caches, race prevention, optimistic updates, and URL state](lessons/0193-client-data-fetching-caches-race-prevention-optimistic-updates-and-url-s.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0194 · Suspense, lazy, code splitting, streaming boundaries, and fallbacks](lessons/0194-suspense-lazy-code-splitting-streaming-boundaries-and-fallbacks.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0195 · Error boundaries, rejected resources, recovery, and observability](lessons/0195-error-boundaries-rejected-resources-recovery-and-observability.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0196 · Portals, overlays, stacking contexts, focus management, and event trees](lessons/0196-portals-overlays-stacking-contexts-focus-management-and-event-trees.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0197 · React with TypeScript, component contracts, refs, events, and polymorphism](lessons/0197-react-with-typescript-component-contracts-refs-events-and-polymorphism.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0198 · Styling, CSS architecture, responsive design, and design systems](lessons/0198-styling-css-architecture-responsive-design-and-design-systems.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0199 · Accessibility, semantic HTML, keyboard interaction, focus, and announcements](lessons/0199-accessibility-semantic-html-keyboard-interaction-focus-and-announcements.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0200 · Component tests, integration tests, browser tests, act, and user behavior](lessons/0200-component-tests-integration-tests-browser-tests-act-and-user-behavior.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0201 · Profiler, render diagnostics, performance tracks, and optimization workflow](lessons/0201-profiler-render-diagnostics-performance-tracks-and-optimization-workflow.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0202 · React Compiler, automatic memoization, directives, linting, and adoption](lessons/0202-react-compiler-automatic-memoization-directives-linting-and-adoption.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0203 · Fiber nodes, reconciliation, render work, commit work, lanes, and scheduling](lessons/0203-fiber-nodes-reconciliation-render-work-commit-work-lanes-and-scheduling.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0204 · createRoot, hydrateRoot, StrictMode, portals, and React DOM client APIs](lessons/0204-createroot-hydrateroot-strictmode-portals-and-react-dom-client-apis.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0205 · Server rendering, streaming HTML, static rendering, and hydration](lessons/0205-server-rendering-streaming-html-static-rendering-and-hydration.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0206 · Server Components, Client Components, serialization, and bundle boundaries](lessons/0206-server-components-client-components-serialization-and-bundle-boundaries.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0207 · Server Functions, use server, actions, authorization, and progressive enhancement](lessons/0207-server-functions-use-server-actions-authorization-and-progressive-enhanc.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0208 · Routing, framework boundaries, layouts, data loading, and resource preloading](lessons/0208-routing-framework-boundaries-layouts-data-loading-and-resource-preloadin.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0209 · React security, escaping, dangerouslySetInnerHTML, URLs, and trust boundaries](lessons/0209-react-security-escaping-dangerouslysetinnerhtml-urls-and-trust-boundarie.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0210 · React DevTools, component stacks, source maps, debugging, and production incidents](lessons/0210-react-devtools-component-stacks-source-maps-debugging-and-production-inc.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0211 · Class components, lifecycle methods, legacy context, and migration](lessons/0211-class-components-lifecycle-methods-legacy-context-and-migration.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0212 · React architecture, feature boundaries, state placement, and scalable delivery](lessons/0212-react-architecture-feature-boundaries-state-placement-and-scalable-deliv.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |
| [0213 · Portfolio Project 1 — production-quality frontend](lessons/0213-portfolio-project-1-production-quality-frontend.html) | Recorded pass | [2026-09-12](REVIEW-EVIDENCE.md) |

## Node.js Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0214 · Node.js setup, release lines, version management, CLI, REPL, and reproducible execution](lessons/0214-node-js-setup-release-lines-version-management-cli-repl-and-reproducible.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0215 · Node.js architecture, V8, native bindings, libuv, operating system, and host APIs](lessons/0215-node-js-architecture-v8-native-bindings-libuv-operating-system-and-host-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0216 · Event loop phases, timers, pending callbacks, poll, check, close callbacks, and iteration](lessons/0216-event-loop-phases-timers-pending-callbacks-poll-check-close-callbacks-an.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0217 · process.nextTick, Promise microtasks, queueMicrotask, setImmediate, timers, and starvation](lessons/0217-process-nexttick-promise-microtasks-queuemicrotask-setimmediate-timers-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0218 · libuv worker pool, file system, crypto, DNS, UV_THREADPOOL_SIZE, and saturation](lessons/0218-libuv-worker-pool-file-system-crypto-dns-uv-threadpool-size-and-saturati.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0219 · Callback APIs, error-first callbacks, promises, promisify, async functions, and error propagation](lessons/0219-callback-apis-error-first-callbacks-promises-promisify-async-functions-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0220 · EventEmitter, listeners, synchronous dispatch, once, errors, captureRejections, and leaks](lessons/0220-eventemitter-listeners-synchronous-dispatch-once-errors-capturerejection.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0221 · async_hooks, AsyncLocalStorage, AsyncResource, execution context, and request correlation](lessons/0221-async-hooks-asynclocalstorage-asyncresource-execution-context-and-reques.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0222 · Timers, AbortSignal, ref, unref, scheduling, drift, and cleanup](lessons/0222-timers-abortsignal-ref-unref-scheduling-drift-and-cleanup.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0223 · Buffer, encodings, allocation, pooling, slices, copies, and binary safety](lessons/0223-buffer-encodings-allocation-pooling-slices-copies-and-binary-safety.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0224 · ArrayBuffer, TypedArray, DataView, Buffer interop, transfer, and endianness](lessons/0224-arraybuffer-typedarray-dataview-buffer-interop-transfer-and-endianness.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0225 · Stream architecture, Readable, Writable, Duplex, Transform, states, and events](lessons/0225-stream-architecture-readable-writable-duplex-transform-states-and-events.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0226 · Readable streams, flowing mode, paused mode, async iteration, object mode, and consumption](lessons/0226-readable-streams-flowing-mode-paused-mode-async-iteration-object-mode-an.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0227 · Writable streams, highWaterMark, write return values, drain, cork, and backpressure](lessons/0227-writable-streams-highwatermark-write-return-values-drain-cork-and-backpr.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0228 · Transform streams, pipeline, finished, error propagation, cancellation, and composition](lessons/0228-transform-streams-pipeline-finished-error-propagation-cancellation-and-c.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0229 · Node streams, Web Streams, adapters, fetch bodies, compression, and interoperability](lessons/0229-node-streams-web-streams-adapters-fetch-bodies-compression-and-interoper.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0230 · File system, file descriptors, promises API, atomic writes, metadata, watching, and race conditions](lessons/0230-file-system-file-descriptors-promises-api-atomic-writes-metadata-watchin.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0231 · Paths, file URLs, import.meta, cross-platform behavior, traversal, and filesystem boundaries](lessons/0231-paths-file-urls-import-meta-cross-platform-behavior-traversal-and-filesy.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0232 · TCP sockets, net server, connections, framing, half-close, timeouts, and backpressure](lessons/0232-tcp-sockets-net-server-connections-framing-half-close-timeouts-and-backp.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0233 · DNS, lookup, resolve, address selection, caching, thread pool, and connection behavior](lessons/0233-dns-lookup-resolve-address-selection-caching-thread-pool-and-connection-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0234 · TLS, certificates, trust stores, SNI, ALPN, sessions, verification, and secure contexts](lessons/0234-tls-certificates-trust-stores-sni-alpn-sessions-verification-and-secure-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0235 · HTTP server, parser, request, response, headers, keep-alive, timeouts, and connection lifecycle](lessons/0235-http-server-parser-request-response-headers-keep-alive-timeouts-and-conn.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0236 · Fetch, Undici, connection pools, dispatchers, Web APIs, cancellation, and response consumption](lessons/0236-fetch-undici-connection-pools-dispatchers-web-apis-cancellation-and-resp.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0237 · HTTP/2, sessions, streams, multiplexing, flow control, headers, and graceful shutdown](lessons/0237-http-2-sessions-streams-multiplexing-flow-control-headers-and-graceful-s.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0238 · ECMAScript modules, URLs, resolution, loading, caching, top-level await, and customization hooks](lessons/0238-ecmascript-modules-urls-resolution-loading-caching-top-level-await-and-c.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0239 · CommonJS, wrapper function, require resolution, module cache, exports, cycles, and initialization](lessons/0239-commonjs-wrapper-function-require-resolution-module-cache-exports-cycles.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0240 · ESM and CommonJS interoperability, package type, exports, imports, conditions, and dual-package hazards](lessons/0240-esm-and-commonjs-interoperability-package-type-exports-imports-condition.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0241 · Runtime TypeScript, type stripping, erasable syntax, tsconfig limits, module formats, and distribution](lessons/0241-runtime-typescript-type-stripping-erasable-syntax-tsconfig-limits-module.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0242 · Packages, npm, package-lock, semantic versioning, lifecycle scripts, provenance, and supply-chain risk](lessons/0242-packages-npm-package-lock-semantic-versioning-lifecycle-scripts-provenan.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0243 · Configuration, process.env, env files, command-line arguments, secrets, parsing, and startup validation](lessons/0243-configuration-process-env-env-files-command-line-arguments-secrets-parsi.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0244 · Node errors, system errors, causes, codes, operational failures, programmer bugs, and recovery](lessons/0244-node-errors-system-errors-causes-codes-operational-failures-programmer-b.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0245 · uncaughtException, unhandledRejection, warnings, exit codes, crash policy, and supervisors](lessons/0245-uncaughtexception-unhandledrejection-warnings-exit-codes-crash-policy-an.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0246 · Process lifecycle, signals, readiness, liveness, graceful shutdown, draining, and deadlines](lessons/0246-process-lifecycle-signals-readiness-liveness-graceful-shutdown-draining-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0247 · child_process, spawn, execFile, exec, stdio, IPC, signals, and shell injection](lessons/0247-child-process-spawn-execfile-exec-stdio-ipc-signals-and-shell-injection.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0248 · worker_threads, message ports, structured clone, transfer lists, SharedArrayBuffer, and Atomics](lessons/0248-worker-threads-message-ports-structured-clone-transfer-lists-sharedarray.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0249 · Cluster, processes, replicas, load balancing, IPC, shared ports, and failure isolation](lessons/0249-cluster-processes-replicas-load-balancing-ipc-shared-ports-and-failure-i.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0250 · Background jobs, durable queues, idempotency, retries, backoff, dead letters, and CPU work](lessons/0250-background-jobs-durable-queues-idempotency-retries-backoff-dead-letters-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0251 · Node test runner, assertions, mocking, timers, concurrency, coverage, and isolation](lessons/0251-node-test-runner-assertions-mocking-timers-concurrency-coverage-and-isol.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0252 · Node security, permission model, validation, injection, SSRF, path traversal, and least privilege](lessons/0252-node-security-permission-model-validation-injection-ssrf-path-traversal-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0253 · diagnostics_channel, AsyncLocalStorage, structured logging, metrics, traces, and observability](lessons/0253-diagnostics-channel-asynclocalstorage-structured-logging-metrics-traces-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0254 · perf_hooks, eventLoopUtilization, monitorEventLoopDelay, marks, measures, and capacity evidence](lessons/0254-perf-hooks-eventlooputilization-monitoreventloopdelay-marks-measures-and.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0255 · Memory, V8 heap, external memory, RSS, garbage collection, heap snapshots, and leaks](lessons/0255-memory-v8-heap-external-memory-rss-garbage-collection-heap-snapshots-and.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0256 · CPU profiles, inspector, trace events, diagnostic reports, flame graphs, and incident evidence](lessons/0256-cpu-profiles-inspector-trace-events-diagnostic-reports-flame-graphs-and-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0257 · Native addons, Node-API, ABI stability, WebAssembly, FFI, ownership, and failure boundaries](lessons/0257-native-addons-node-api-abi-stability-webassembly-ffi-ownership-and-failu.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0258 · Node.js service architecture, dependency direction, concurrency budgets, overload, resilience, and operations](lessons/0258-node-js-service-architecture-dependency-direction-concurrency-budgets-ov.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0259 · Node.js production architecture capstone, API, streaming, workers, reliability, security, and observability](lessons/0259-node-js-production-architecture-capstone-api-streaming-workers-reliabili.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## Python Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0260 · Python setup, interpreters, REPL, scripts, virtual environments, and workflow](lessons/0260-python-setup-interpreters-repl-scripts-virtual-environments-and-workflow.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0261 · Execution model, code blocks, frames, namespaces, scopes, and name resolution](lessons/0261-execution-model-code-blocks-frames-namespaces-scopes-and-name-resolution.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0262 · Objects, identity, type, value, references, mutability, and aliasing](lessons/0262-objects-identity-type-value-references-mutability-and-aliasing.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0263 · Numbers, booleans, None, truthiness, floating point, Decimal, and arithmetic](lessons/0263-numbers-booleans-none-truthiness-floating-point-decimal-and-arithmetic.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0264 · Strings, Unicode, bytes, bytearray, encoding, and text boundaries](lessons/0264-strings-unicode-bytes-bytearray-encoding-and-text-boundaries.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0265 · Lists, tuples, ranges, slicing, unpacking, copying, and sequence costs](lessons/0265-lists-tuples-ranges-slicing-unpacking-copying-and-sequence-costs.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0266 · Dictionaries, sets, hashing, equality, collisions, and insertion order](lessons/0266-dictionaries-sets-hashing-equality-collisions-and-insertion-order.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0267 · Control flow, loops, comprehensions, assignment expressions, and pattern matching](lessons/0267-control-flow-loops-comprehensions-assignment-expressions-and-pattern-mat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0268 · Functions, parameters, defaults, positional-only, keyword-only, args, and kwargs](lessons/0268-functions-parameters-defaults-positional-only-keyword-only-args-and-kwar.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0269 · First-class functions, closures, lambdas, partials, and callable objects](lessons/0269-first-class-functions-closures-lambdas-partials-and-callable-objects.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0270 · Exceptions, chaining, custom errors, groups, notes, cleanup, and failure design](lessons/0270-exceptions-chaining-custom-errors-groups-notes-cleanup-and-failure-desig.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0271 · Modules, packages, imports, sys.modules, finders, loaders, and circular imports](lessons/0271-modules-packages-imports-sys-modules-finders-loaders-and-circular-import.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0272 · Classes, instances, attributes, methods, classmethods, staticmethods, and binding](lessons/0272-classes-instances-attributes-methods-classmethods-staticmethods-and-bind.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0273 · Inheritance, composition, MRO, super, abstract base classes, and mixins](lessons/0273-inheritance-composition-mro-super-abstract-base-classes-and-mixins.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0274 · Data model, special methods, operators, containers, representations, and protocols](lessons/0274-data-model-special-methods-operators-containers-representations-and-prot.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0275 · Attribute lookup, descriptors, properties, slots, __getattribute__, and __getattr__](lessons/0275-attribute-lookup-descriptors-properties-slots-getattribute-and-getattr.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0276 · Dataclasses, named tuples, enums, frozen models, and value objects](lessons/0276-dataclasses-named-tuples-enums-frozen-models-and-value-objects.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0277 · Iterables, iterators, next, StopIteration, sentinel iteration, and lazy traversal](lessons/0277-iterables-iterators-next-stopiteration-sentinel-iteration-and-lazy-trave.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0278 · Generators, yield, generator frames, send, throw, close, and delegation](lessons/0278-generators-yield-generator-frames-send-throw-close-and-delegation.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0279 · Comprehensions, generator expressions, itertools, laziness, and streaming pipelines](lessons/0279-comprehensions-generator-expressions-itertools-laziness-and-streaming-pi.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0280 · Decorators, wrappers, functools.wraps, parameters, stacking, and registration](lessons/0280-decorators-wrappers-functools-wraps-parameters-stacking-and-registration.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0281 · Context managers, with, contextlib, ExitStack, async context, and cleanup](lessons/0281-context-managers-with-contextlib-exitstack-async-context-and-cleanup.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0282 · Type hints, unions, narrowing, aliases, Literal, Never, and static analysis](lessons/0282-type-hints-unions-narrowing-aliases-literal-never-and-static-analysis.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0283 · Generics, type parameters, protocols, variance, overloads, and ParamSpec](lessons/0283-generics-type-parameters-protocols-variance-overloads-and-paramspec.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0284 · Runtime validation, parsing, schemas, serialization, and typed API boundaries](lessons/0284-runtime-validation-parsing-schemas-serialization-and-typed-api-boundarie.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0285 · Standard library, pathlib, files, JSON, CSV, datetime, zones, and resources](lessons/0285-standard-library-pathlib-files-json-csv-datetime-zones-and-resources.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0286 · Regular expressions, parsing, subprocesses, environment, signals, and OS boundaries](lessons/0286-regular-expressions-parsing-subprocesses-environment-signals-and-os-boun.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0287 · Asyncio event loop, coroutines, awaitables, tasks, futures, and cooperative scheduling](lessons/0287-asyncio-event-loop-coroutines-awaitables-tasks-futures-and-cooperative-s.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0288 · TaskGroup, cancellation, timeouts, queues, semaphores, and backpressure](lessons/0288-taskgroup-cancellation-timeouts-queues-semaphores-and-backpressure.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0289 · Threads, the GIL, locks, conditions, thread safety, and free-threaded builds](lessons/0289-threads-the-gil-locks-conditions-thread-safety-and-free-threaded-builds.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0290 · Multiprocessing, process pools, IPC, shared memory, start methods, and pickling](lessons/0290-multiprocessing-process-pools-ipc-shared-memory-start-methods-and-pickli.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0291 · Concurrency selection, async, threads, processes, executors, and distributed workers](lessons/0291-concurrency-selection-async-threads-processes-executors-and-distributed-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0292 · Memory management, reference counting, cyclic GC, weak references, and finalization](lessons/0292-memory-management-reference-counting-cyclic-gc-weak-references-and-final.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0293 · Copying, serialization, pickle, JSON, object graphs, and trust boundaries](lessons/0293-copying-serialization-pickle-json-object-graphs-and-trust-boundaries.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0294 · Performance, complexity, profiling, benchmarking, caching, and optimization](lessons/0294-performance-complexity-profiling-benchmarking-caching-and-optimization.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0295 · Testing, unittest, pytest concepts, fixtures, mocking, properties, and determinism](lessons/0295-testing-unittest-pytest-concepts-fixtures-mocking-properties-and-determi.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0296 · Debugging, tracebacks, pdb, logging, warnings, metrics, and observability](lessons/0296-debugging-tracebacks-pdb-logging-warnings-metrics-and-observability.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0297 · Packaging, pyproject.toml, build backends, source distributions, wheels, and metadata](lessons/0297-packaging-pyproject-toml-build-backends-source-distributions-wheels-and-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0298 · Dependencies, virtual environments, lock files, reproducibility, publishing, and supply chain](lessons/0298-dependencies-virtual-environments-lock-files-reproducibility-publishing-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0299 · Native extensions, C API, stable ABI, FFI, buffer protocol, and performance boundaries](lessons/0299-native-extensions-c-api-stable-abi-ffi-buffer-protocol-and-performance-b.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0300 · Architecture, modules, domain boundaries, dependency inversion, configuration, and errors](lessons/0300-architecture-modules-domain-boundaries-dependency-inversion-configuratio.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0301 · Python security, validation, secrets, deserialization, injection, dependencies, and hardening](lessons/0301-python-security-validation-secrets-deserialization-injection-dependencie.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0302 · Python production architecture capstone, contracts, concurrency, tests, packaging, and operations](lessons/0302-python-production-architecture-capstone-contracts-concurrency-tests-pack.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## FastAPI Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0303 · FastAPI setup, CLI, project anatomy, typing, and development workflow](lessons/0303-fastapi-setup-cli-project-anatomy-typing-and-development-workflow.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0304 · ASGI scope, receive, send, Uvicorn, Starlette, and request lifecycle](lessons/0304-asgi-scope-receive-send-uvicorn-starlette-and-request-lifecycle.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0305 · FastAPI application configuration, metadata, docs, and OpenAPI lifecycle](lessons/0305-fastapi-application-configuration-metadata-docs-and-openapi-lifecycle.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0306 · Path operations, HTTP methods, routing order, status codes, and semantics](lessons/0306-path-operations-http-methods-routing-order-status-codes-and-semantics.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0307 · Path parameters, converters, enums, UUIDs, dates, and validation](lessons/0307-path-parameters-converters-enums-uuids-dates-and-validation.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0308 · Query parameters, headers, cookies, aliases, lists, and reusable filters](lessons/0308-query-parameters-headers-cookies-aliases-lists-and-reusable-filters.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0309 · Pydantic request bodies, nested models, unions, validators, and strict boundaries](lessons/0309-pydantic-request-bodies-nested-models-unions-validators-and-strict-bound.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0310 · Forms, files, UploadFile, multipart parsing, and size boundaries](lessons/0310-forms-files-uploadfile-multipart-parsing-and-size-boundaries.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0311 · Response models, serialization, filtering, aliases, and output contracts](lessons/0311-response-models-serialization-filtering-aliases-and-output-contracts.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0312 · Response classes, streaming, files, redirects, cookies, and headers](lessons/0312-response-classes-streaming-files-redirects-cookies-and-headers.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0313 · HTTPException, validation errors, exception handlers, and stable error contracts](lessons/0313-httpexception-validation-errors-exception-handlers-and-stable-error-cont.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0314 · Request and Response objects, state, disconnects, and low-level access](lessons/0314-request-and-response-objects-state-disconnects-and-low-level-access.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0315 · Depends, Annotated, dependency caching, and dependency graph solving](lessons/0315-depends-annotated-dependency-caching-and-dependency-graph-solving.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0316 · Yield dependencies, cleanup scopes, exceptions, and resource ownership](lessons/0316-yield-dependencies-cleanup-scopes-exceptions-and-resource-ownership.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0317 · Callable dependencies, classes, factories, router dependencies, and overrides](lessons/0317-callable-dependencies-classes-factories-router-dependencies-and-override.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0318 · Dependency injection architecture, service boundaries, and domain isolation](lessons/0318-dependency-injection-architecture-service-boundaries-and-domain-isolatio.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0319 · Settings, environment configuration, secrets, validation, and process boundaries](lessons/0319-settings-environment-configuration-secrets-validation-and-process-bounda.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0320 · Lifespan, startup, shutdown, shared resources, and application state](lessons/0320-lifespan-startup-shutdown-shared-resources-and-application-state.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0321 · async def, def, thread pools, blocking calls, and event-loop health](lessons/0321-async-def-def-thread-pools-blocking-calls-and-event-loop-health.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0322 · Cancellation, timeouts, task groups, disconnects, and structured concurrency](lessons/0322-cancellation-timeouts-task-groups-disconnects-and-structured-concurrency.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0323 · Async SQLAlchemy sessions, engines, connection pools, and request scope](lessons/0323-async-sqlalchemy-sessions-engines-connection-pools-and-request-scope.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0324 · Transactions, unit of work, commit, rollback, retries, and consistency](lessons/0324-transactions-unit-of-work-commit-rollback-retries-and-consistency.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0325 · BackgroundTasks, durable jobs, idempotency, queues, and outbox delivery](lessons/0325-backgroundtasks-durable-jobs-idempotency-queues-and-outbox-delivery.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0326 · OAuth2, password hashing, bearer tokens, JWT validation, and identity](lessons/0326-oauth2-password-hashing-bearer-tokens-jwt-validation-and-identity.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0327 · Security scopes, authorization, tenant boundaries, and object permissions](lessons/0327-security-scopes-authorization-tenant-boundaries-and-object-permissions.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0328 · Cookie sessions, CSRF, SameSite, secure attributes, and browser clients](lessons/0328-cookie-sessions-csrf-samesite-secure-attributes-and-browser-clients.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0329 · CORS, trusted hosts, HTTPS redirects, proxy headers, and origin policy](lessons/0329-cors-trusted-hosts-https-redirects-proxy-headers-and-origin-policy.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0330 · HTTP middleware, pure ASGI middleware, ordering, context, and request IDs](lessons/0330-http-middleware-pure-asgi-middleware-ordering-context-and-request-ids.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0331 · API security hardening, rate limits, body limits, audit logs, and abuse controls](lessons/0331-api-security-hardening-rate-limits-body-limits-audit-logs-and-abuse-cont.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0332 · OpenAPI schemas, documentation customization, examples, and client generation](lessons/0332-openapi-schemas-documentation-customization-examples-and-client-generati.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0333 · OpenAPI callbacks, webhooks, external events, and delivery contracts](lessons/0333-openapi-callbacks-webhooks-external-events-and-delivery-contracts.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0334 · APIRouter, multi-file applications, sub-applications, mounts, and root paths](lessons/0334-apirouter-multi-file-applications-sub-applications-mounts-and-root-paths.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0335 · WebSockets, handshake, connection management, dependencies, and backpressure](lessons/0335-websockets-handshake-connection-management-dependencies-and-backpressure.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0336 · Server-sent events, StreamingResponse, generators, disconnects, and buffering](lessons/0336-server-sent-events-streamingresponse-generators-disconnects-and-bufferin.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0337 · Static files, templates, HTML responses, and GraphQL integration boundaries](lessons/0337-static-files-templates-html-responses-and-graphql-integration-boundaries.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0338 · TestClient, dependency overrides, lifespan, fixtures, and deterministic tests](lessons/0338-testclient-dependency-overrides-lifespan-fixtures-and-deterministic-test.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0339 · Async integration tests, HTTPX transports, real databases, and contract tests](lessons/0339-async-integration-tests-httpx-transports-real-databases-and-contract-tes.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0340 · Structured logging, metrics, tracing, health, readiness, and diagnostics](lessons/0340-structured-logging-metrics-tracing-health-readiness-and-diagnostics.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0341 · Performance profiling, serialization, validation cost, pools, and workers](lessons/0341-performance-profiling-serialization-validation-cost-pools-and-workers.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0342 · Containers, workers, proxies, migrations, health checks, and graceful deployment](lessons/0342-containers-workers-proxies-migrations-health-checks-and-graceful-deploym.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0343 · API versioning, deprecation, compatibility, schema evolution, and rollout](lessons/0343-api-versioning-deprecation-compatibility-schema-evolution-and-rollout.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0344 · Custom APIRoute, custom request handling, schema hooks, and framework internals](lessons/0344-custom-apiroute-custom-request-handling-schema-hooks-and-framework-inter.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0345 · FastAPI production architecture capstone](lessons/0345-fastapi-production-architecture-capstone.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## PostgreSQL, Redis, and Data Systems Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0346 · PostgreSQL setup, psql, clusters, databases, schemas, roles, and search_path](lessons/0346-postgresql-setup-psql-clusters-databases-schemas-roles-and-search-path.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0347 · PostgreSQL architecture, postmaster, backend processes, shared memory, and background workers](lessons/0347-postgresql-architecture-postmaster-backend-processes-shared-memory-and-b.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0348 · Relations, forks, pages, tuples, catalogs, and physical versus logical storage](lessons/0348-relations-forks-pages-tuples-catalogs-and-physical-versus-logical-storag.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0349 · PostgreSQL data types, NULL, domains, enums, arrays, ranges, JSONB, and generated columns](lessons/0349-postgresql-data-types-null-domains-enums-arrays-ranges-jsonb-and-generat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0350 · Relational modeling, entities, relationships, keys, functional dependencies, and normalization](lessons/0350-relational-modeling-entities-relationships-keys-functional-dependencies-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0351 · Constraints, primary keys, foreign keys, uniqueness, CHECK, exclusion, and deferred validation](lessons/0351-constraints-primary-keys-foreign-keys-uniqueness-check-exclusion-and-def.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0352 · Schema migrations, DDL locks, transactional DDL, expand-contract, backfills, and zero-downtime change](lessons/0352-schema-migrations-ddl-locks-transactional-ddl-expand-contract-backfills-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0353 · SQL logical query processing, SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, and LIMIT](lessons/0353-sql-logical-query-processing-select-from-where-group-by-having-order-by-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0354 · Joins, inner, outer, cross, semi, anti, LATERAL, and join predicates](lessons/0354-joins-inner-outer-cross-semi-anti-lateral-and-join-predicates.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0355 · Subqueries, correlated execution, CTEs, recursive queries, and materialization](lessons/0355-subqueries-correlated-execution-ctes-recursive-queries-and-materializati.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0356 · Aggregates, window functions, frames, grouping sets, rollup, and ordered-set analysis](lessons/0356-aggregates-window-functions-frames-grouping-sets-rollup-and-ordered-set-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0357 · Transactions, ACID, autocommit, BEGIN, savepoints, commit, and rollback](lessons/0357-transactions-acid-autocommit-begin-savepoints-commit-and-rollback.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0358 · MVCC, transaction IDs, snapshots, xmin, xmax, tuple versions, and visibility](lessons/0358-mvcc-transaction-ids-snapshots-xmin-xmax-tuple-versions-and-visibility.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0359 · Isolation levels, Read Committed, Repeatable Read, Serializable, anomalies, and SSI](lessons/0359-isolation-levels-read-committed-repeatable-read-serializable-anomalies-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0360 · Table locks, row locks, predicate locks, advisory locks, wait queues, and NOWAIT](lessons/0360-table-locks-row-locks-predicate-locks-advisory-locks-wait-queues-and-now.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0361 · Deadlocks, serialization failures, timeouts, retry budgets, and idempotent transactions](lessons/0361-deadlocks-serialization-failures-timeouts-retry-budgets-and-idempotent-t.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0362 · B-tree internals, pages, ordering, splits, deduplication, and index-only scans](lessons/0362-b-tree-internals-pages-ordering-splits-deduplication-and-index-only-scan.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0363 · Hash, GiST, SP-GiST, GIN, BRIN, operator classes, and extension indexes](lessons/0363-hash-gist-sp-gist-gin-brin-operator-classes-and-extension-indexes.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0364 · Composite, covering, partial, expression, unique indexes, and index design tradeoffs](lessons/0364-composite-covering-partial-expression-unique-indexes-and-index-design-tr.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0365 · Planner statistics, cardinality estimation, selectivity, histograms, MCVs, correlation, and extended statistics](lessons/0365-planner-statistics-cardinality-estimation-selectivity-histograms-mcvs-co.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0366 · EXPLAIN, ANALYZE, BUFFERS, WAL, SETTINGS, timing, and plan interpretation](lessons/0366-explain-analyze-buffers-wal-settings-timing-and-plan-interpretation.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0367 · Sequential scans, bitmap scans, nested loops, hash joins, merge joins, sorts, and spills](lessons/0367-sequential-scans-bitmap-scans-nested-loops-hash-joins-merge-joins-sorts-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0368 · Heap pages, TOAST, free space map, visibility map, HOT updates, fillfactor, and bloat](lessons/0368-heap-pages-toast-free-space-map-visibility-map-hot-updates-fillfactor-an.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0369 · VACUUM, autovacuum, ANALYZE, freezing, transaction ID wraparound, and maintenance tuning](lessons/0369-vacuum-autovacuum-analyze-freezing-transaction-id-wraparound-and-mainten.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0370 · WAL, LSNs, commit durability, checkpoints, full-page writes, and crash recovery](lessons/0370-wal-lsns-commit-durability-checkpoints-full-page-writes-and-crash-recove.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0371 · Connections, sessions, prepared statements, PgBouncer, pool sizing, and transaction pooling](lessons/0371-connections-sessions-prepared-statements-pgbouncer-pool-sizing-and-trans.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0372 · Declarative partitioning, pruning, routing, maintenance, constraints, and partition-wise execution](lessons/0372-declarative-partitioning-pruning-routing-maintenance-constraints-and-par.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0373 · Physical streaming replication, WAL senders, receivers, slots, lag, synchronous replication, and failover](lessons/0373-physical-streaming-replication-wal-senders-receivers-slots-lag-synchrono.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0374 · Logical replication, publications, subscriptions, decoding, replication identity, and CDC](lessons/0374-logical-replication-publications-subscriptions-decoding-replication-iden.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0375 · Backups, pg_dump, pg_restore, base backups, WAL archiving, PITR, RPO, and RTO](lessons/0375-backups-pg-dump-pg-restore-base-backups-wal-archiving-pitr-rpo-and-rto.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0376 · Authentication, pg_hba.conf, TLS, roles, privileges, default privileges, and row-level security](lessons/0376-authentication-pg-hba-conf-tls-roles-privileges-default-privileges-and-r.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0377 · PostgreSQL observability, pg_stat_activity, pg_locks, pg_stat_statements, progress views, logs, and wait events](lessons/0377-postgresql-observability-pg-stat-activity-pg-locks-pg-stat-statements-pr.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0378 · PostgreSQL performance tuning, memory, I/O, checkpoints, work_mem, cache, and capacity testing](lessons/0378-postgresql-performance-tuning-memory-i-o-checkpoints-work-mem-cache-and-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0379 · JSONB indexing, full-text search, extensions, pgvector, vector indexes, and hybrid retrieval](lessons/0379-jsonb-indexing-full-text-search-extensions-pgvector-vector-indexes-and-h.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0380 · Application data patterns, optimistic concurrency, idempotency, outbox, inbox, pagination, and read consistency](lessons/0380-application-data-patterns-optimistic-concurrency-idempotency-outbox-inbo.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0381 · Redis architecture, event loop, command execution, I/O threads, keyspace, databases, and expiration cycle](lessons/0381-redis-architecture-event-loop-command-execution-i-o-threads-keyspace-dat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0382 · RESP, connections, clients, command pipelining, protocol framing, and output buffers](lessons/0382-resp-connections-clients-command-pipelining-protocol-framing-and-output-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0383 · Redis strings, counters, hashes, object encodings, memory usage, and atomic updates](lessons/0383-redis-strings-counters-hashes-object-encodings-memory-usage-and-atomic-u.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0384 · Redis lists, sets, sorted sets, blocking operations, indexes, and leaderboard patterns](lessons/0384-redis-lists-sets-sorted-sets-blocking-operations-indexes-and-leaderboard.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0385 · Redis bitmaps, bitfields, HyperLogLog, geospatial indexes, probabilistic tradeoffs, and compact analytics](lessons/0385-redis-bitmaps-bitfields-hyperloglog-geospatial-indexes-probabilistic-tra.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0386 · Redis TTL, expiration, eviction policies, maxmemory, LFU, LRU sampling, and memory pressure](lessons/0386-redis-ttl-expiration-eviction-policies-maxmemory-lfu-lru-sampling-and-me.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0387 · Redis atomic commands, MULTI, EXEC, WATCH, optimistic locking, Lua, and server-side functions](lessons/0387-redis-atomic-commands-multi-exec-watch-optimistic-locking-lua-and-server.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0388 · Redis pipelining, batching, round trips, throughput, latency, and backpressure](lessons/0388-redis-pipelining-batching-round-trips-throughput-latency-and-backpressur.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0389 · Redis RDB, AOF, fsync, rewrites, fork, copy-on-write, restart, and durability tradeoffs](lessons/0389-redis-rdb-aof-fsync-rewrites-fork-copy-on-write-restart-and-durability-t.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0390 · Redis replication, replication IDs, offsets, PSYNC, backlog, replicas, and Sentinel failover](lessons/0390-redis-replication-replication-ids-offsets-psync-backlog-replicas-and-sen.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0391 · Redis Cluster, hash slots, hash tags, MOVED, ASK, resharding, gossip, quorum, and failover](lessons/0391-redis-cluster-hash-slots-hash-tags-moved-ask-resharding-gossip-quorum-an.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0392 · Redis Streams, entries, consumer groups, pending entries, acknowledgements, claiming, trimming, and idempotency](lessons/0392-redis-streams-entries-consumer-groups-pending-entries-acknowledgements-c.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0393 · Cache-aside, write-through, invalidation, stampedes, stale data, negative caching, and consistency](lessons/0393-cache-aside-write-through-invalidation-stampedes-stale-data-negative-cac.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0394 · Distributed locks, fencing tokens, rate limiting, queues, delayed work, and correctness boundaries](lessons/0394-distributed-locks-fencing-tokens-rate-limiting-queues-delayed-work-and-c.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0395 · Redis security, ACLs, TLS, protected mode, command controls, observability, latency, and memory diagnostics](lessons/0395-redis-security-acls-tls-protected-mode-command-controls-observability-la.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0396 · Data systems production architecture capstone, PostgreSQL, Redis, CDC, recovery, performance, and operations](lessons/0396-data-systems-production-architecture-capstone-postgresql-redis-cdc-recov.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## API Design and Distributed Systems Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0397 · System boundaries, domain invariants, service ownership, and API contracts](lessons/0397-system-boundaries-domain-invariants-service-ownership-and-api-contracts.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0398 · HTTP architecture, requests, responses, intermediaries, and semantics](lessons/0398-http-architecture-requests-responses-intermediaries-and-semantics.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0399 · HTTP methods, safety, idempotency, cacheability, and conditional behavior](lessons/0399-http-methods-safety-idempotency-cacheability-and-conditional-behavior.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0400 · Resource modeling, URIs, collections, relationships, and action endpoints](lessons/0400-resource-modeling-uris-collections-relationships-and-action-endpoints.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0401 · Representations, media types, content negotiation, compression, and localization](lessons/0401-representations-media-types-content-negotiation-compression-and-localiza.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0402 · Status codes, RFC 9457 Problem Details, stable error codes, and failure contracts](lessons/0402-status-codes-rfc-9457-problem-details-stable-error-codes-and-failure-con.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0403 · Boundary validation, normalization, unknown fields, limits, and error aggregation](lessons/0403-boundary-validation-normalization-unknown-fields-limits-and-error-aggreg.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0404 · Idempotency keys, request fingerprints, deduplication records, and replayed responses](lessons/0404-idempotency-keys-request-fingerprints-deduplication-records-and-replayed.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0405 · ETags, Last-Modified, preconditions, optimistic concurrency, and lost-update prevention](lessons/0405-etags-last-modified-preconditions-optimistic-concurrency-and-lost-update.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0406 · Pagination offset, keyset, cursor, snapshots, and stable ordering](lessons/0406-pagination-offset-keyset-cursor-snapshots-and-stable-ordering.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0407 · Filtering, sorting, search, sparse fields, includes, and query complexity](lessons/0407-filtering-sorting-search-sparse-fields-includes-and-query-complexity.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0408 · API versioning, compatibility, additive evolution, deprecation, and sunset policy](lessons/0408-api-versioning-compatibility-additive-evolution-deprecation-and-sunset-p.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0409 · HTTP caching, Cache-Control, validators, Vary, CDNs, and invalidation](lessons/0409-http-caching-cache-control-validators-vary-cdns-and-invalidation.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0410 · REST constraints, statelessness, hypermedia, uniform interface, and maturity tradeoffs](lessons/0410-rest-constraints-statelessness-hypermedia-uniform-interface-and-maturity.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0411 · OpenAPI, JSON Schema, examples, code generation, linting, and contract governance](lessons/0411-openapi-json-schema-examples-code-generation-linting-and-contract-govern.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0412 · Protocol Buffers, gRPC, streaming RPCs, deadlines, status, and schema evolution](lessons/0412-protocol-buffers-grpc-streaming-rpcs-deadlines-status-and-schema-evoluti.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0413 · GraphQL schema, resolvers, N+1, batching, complexity, and federation](lessons/0413-graphql-schema-resolvers-n-1-batching-complexity-and-federation.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0414 · Webhooks, signatures, timestamps, retries, replay protection, and event evolution](lessons/0414-webhooks-signatures-timestamps-retries-replay-protection-and-event-evolu.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0415 · SSE, WebSockets, bidirectional streams, heartbeats, backpressure, and reconnects](lessons/0415-sse-websockets-bidirectional-streams-heartbeats-backpressure-and-reconne.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0416 · Authentication, authorization, scopes, tenant isolation, delegation, and audit](lessons/0416-authentication-authorization-scopes-tenant-isolation-delegation-and-audi.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0417 · API gateways, reverse proxies, routing, quotas, rate limits, and policy placement](lessons/0417-api-gateways-reverse-proxies-routing-quotas-rate-limits-and-policy-place.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0418 · API security, threat modeling, injection, SSRF, mass assignment, and abuse resistance](lessons/0418-api-security-threat-modeling-injection-ssrf-mass-assignment-and-abuse-re.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0419 · API observability, correlation, trace context, metrics, logs, and audit events](lessons/0419-api-observability-correlation-trace-context-metrics-logs-and-audit-event.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0420 · API testing, schema conformance, contract tests, property tests, fuzzing, and compatibility](lessons/0420-api-testing-schema-conformance-contract-tests-property-tests-fuzzing-and.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0421 · Developer experience, documentation, SDKs, changelogs, sandboxes, and governance](lessons/0421-developer-experience-documentation-sdks-changelogs-sandboxes-and-governa.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0422 · Distributed system model, nodes, processes, messages, state, and assumptions](lessons/0422-distributed-system-model-nodes-processes-messages-state-and-assumptions.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0423 · Failure models, crashes, omissions, Byzantine behavior, and partial failure](lessons/0423-failure-models-crashes-omissions-byzantine-behavior-and-partial-failure.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0424 · Network uncertainty, delay, loss, duplication, reordering, partitions, and TCP limits](lessons/0424-network-uncertainty-delay-loss-duplication-reordering-partitions-and-tcp.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0425 · Physical clocks, monotonic time, NTP, clock skew, and timestamp hazards](lessons/0425-physical-clocks-monotonic-time-ntp-clock-skew-and-timestamp-hazards.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0426 · Logical clocks, happens-before, Lamport clocks, vector clocks, and hybrid logical clocks](lessons/0426-logical-clocks-happens-before-lamport-clocks-vector-clocks-and-hybrid-lo.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0427 · Latency distributions, percentiles, tail amplification, fan-out, and coordinated omission](lessons/0427-latency-distributions-percentiles-tail-amplification-fan-out-and-coordin.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0428 · Timeouts, deadlines, budget propagation, cancellation, and cleanup](lessons/0428-timeouts-deadlines-budget-propagation-cancellation-and-cleanup.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0429 · Retries, exponential backoff, jitter, retry budgets, and hedged requests](lessons/0429-retries-exponential-backoff-jitter-retry-budgets-and-hedged-requests.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0430 · Overload control, bounded queues, backpressure, admission, load shedding, and degradation](lessons/0430-overload-control-bounded-queues-backpressure-admission-load-shedding-and.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0431 · Circuit breakers, bulkheads, health checks, dependency isolation, and recovery](lessons/0431-circuit-breakers-bulkheads-health-checks-dependency-isolation-and-recove.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0432 · Idempotency, deduplication, commutativity, monotonic operations, and exactly-once claims](lessons/0432-idempotency-deduplication-commutativity-monotonic-operations-and-exactly.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0433 · Queues, publish-subscribe, logs, streams, commands, and events](lessons/0433-queues-publish-subscribe-logs-streams-commands-and-events.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0434 · Broker internals, acknowledgements, visibility, offsets, retention, and flow control](lessons/0434-broker-internals-acknowledgements-visibility-offsets-retention-and-flow-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0435 · Delivery semantics, at-most-once, at-least-once, redelivery, and duplicate effects](lessons/0435-delivery-semantics-at-most-once-at-least-once-redelivery-and-duplicate-e.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0436 · Ordering, partitions, consumer groups, rebalancing, and parallelism](lessons/0436-ordering-partitions-consumer-groups-rebalancing-and-parallelism.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0437 · Poison messages, retry topics, dead-letter queues, quarantine, and replay](lessons/0437-poison-messages-retry-topics-dead-letter-queues-quarantine-and-replay.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0438 · Transactional outbox, inbox, CDC, atomic publication, and idempotent consumers](lessons/0438-transactional-outbox-inbox-cdc-atomic-publication-and-idempotent-consume.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0439 · Sagas, compensating actions, orchestration, choreography, and workflow durability](lessons/0439-sagas-compensating-actions-orchestration-choreography-and-workflow-durab.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0440 · Distributed transactions, two-phase commit, coordinator failure, blocking, and alternatives](lessons/0440-distributed-transactions-two-phase-commit-coordinator-failure-blocking-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0441 · Single-leader replication, WAL, commit index, follower lag, failover, and read scaling](lessons/0441-single-leader-replication-wal-commit-index-follower-lag-failover-and-rea.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0442 · Multi-leader replication, conflict detection, resolution, topology, and convergence](lessons/0442-multi-leader-replication-conflict-detection-resolution-topology-and-conv.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0443 · Leaderless replication, quorums, sloppy quorums, hinted handoff, and read repair](lessons/0443-leaderless-replication-quorums-sloppy-quorums-hinted-handoff-and-read-re.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0444 · Consistency models, linearizability, serializability, causal, session, and eventual consistency](lessons/0444-consistency-models-linearizability-serializability-causal-session-and-ev.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0445 · CAP theorem, partitions, availability, consistency, and PACELC latency tradeoffs](lessons/0445-cap-theorem-partitions-availability-consistency-and-pacelc-latency-trade.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0446 · Sharding, partition keys, consistent hashing, rebalancing, hotspots, and scatter-gather](lessons/0446-sharding-partition-keys-consistent-hashing-rebalancing-hotspots-and-scat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0447 · Consensus, replicated state machines, Raft terms, elections, log replication, and safety](lessons/0447-consensus-replicated-state-machines-raft-terms-elections-log-replication.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0448 · Membership, failure detection, leases, distributed locks, fencing, and split brain](lessons/0448-membership-failure-detection-leases-distributed-locks-fencing-and-split-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0449 · Service discovery, DNS, client-side and server-side load balancing, health, and locality](lessons/0449-service-discovery-dns-client-side-and-server-side-load-balancing-health-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0450 · Layer 4 and Layer 7 load balancing, transport flows, HTTP routing, algorithms, health checks, affinity, TLS, proxies, and failure modes](lessons/0450-layer-4-and-layer-7-load-balancing-transport-flows-http-routing-algorith.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0451 · Multi-region architecture, active-passive, active-active, geo-routing, sovereignty, and failover](lessons/0451-multi-region-architecture-active-passive-active-active-geo-routing-sover.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0452 · CQRS, event sourcing, materialized views, snapshots, and temporal queries](lessons/0452-cqrs-event-sourcing-materialized-views-snapshots-and-temporal-queries.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0453 · System design method, requirements, estimation, Little's Law, capacity, and bottlenecks](lessons/0453-system-design-method-requirements-estimation-little-s-law-capacity-and-b.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0454 · System design case studies, URL shortener, chat, feed, file processing, and AI inference](lessons/0454-system-design-case-studies-url-shortener-chat-feed-file-processing-and-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0455 · Distributed systems production architecture capstone, contracts, resilience, consistency, observability, and evolution](lessons/0455-distributed-systems-production-architecture-capstone-contracts-resilienc.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## Microservices, Domain-Driven Design, and Event-Driven Systems

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0456 · Microservices, modular monoliths, service boundaries, independent deployment, team ownership, data ownership, and distributed costs](lessons/0456-microservices-modular-monoliths-service-boundaries-independent-deploymen.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0457 · Strategic domain-driven design, domains, subdomains, core domains, supporting domains, generic domains, ubiquitous language, bounded contexts, and context maps](lessons/0457-strategic-domain-driven-design-domains-subdomains-core-domains-supportin.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0458 · Tactical domain-driven design, entities, value objects, aggregates, aggregate roots, invariants, repositories, domain services, and application services](lessons/0458-tactical-domain-driven-design-entities-value-objects-aggregates-aggregat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0459 · Commands, domain events, integration events, transactional outbox, idempotent consumers, eventual consistency, and process managers](lessons/0459-commands-domain-events-integration-events-transactional-outbox-idempoten.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0460 · Event-driven architecture, producers, consumers, brokers, publish-subscribe, event notification, event-carried state transfer, choreography, and orchestration](lessons/0460-event-driven-architecture-producers-consumers-brokers-publish-subscribe-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0461 · Kafka architecture, brokers, topics, partitions, keys, append-only logs, segments, indexes, retention, and compaction](lessons/0461-kafka-architecture-brokers-topics-partitions-keys-append-only-logs-segme.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0462 · Kafka replication, leaders, followers, in-sync replicas, acknowledgements, min.insync.replicas, controllers, elections, and failure recovery](lessons/0462-kafka-replication-leaders-followers-in-sync-replicas-acknowledgements-mi.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0463 · Kafka producers, batching, compression, idempotence, transactions, consumers, consumer groups, rebalancing, offsets, and ordering](lessons/0463-kafka-producers-batching-compression-idempotence-transactions-consumers-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0464 · Event schemas, compatibility, schema registries, poison events, retry topics, replay, observability, testing, and operations](lessons/0464-event-schemas-compatibility-schema-registries-poison-events-retry-topics.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## Testing, Security, Reliability, and SaaS Operations

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0465 · Test strategy, boundaries, contracts, and test doubles](lessons/0465-test-strategy-boundaries-contracts-and-test-doubles.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0466 · Property-based, concurrency, load, chaos, and regression testing](lessons/0466-property-based-concurrency-load-chaos-and-regression-testing.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0467 · Threat modeling, secure design, authentication, authorization, and secrets](lessons/0467-threat-modeling-secure-design-authentication-authorization-and-secrets.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0468 · Web, API, dependency, and supply-chain security](lessons/0468-web-api-dependency-and-supply-chain-security.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0469 · Reliability targets, observability, incidents, and postmortems](lessons/0469-reliability-targets-observability-incidents-and-postmortems.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0470 · Production webhooks, event contracts, signatures, timestamps, replay defense, idempotency, retries, ordering, and secret rotation](lessons/0470-production-webhooks-event-contracts-signatures-timestamps-replay-defense.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0471 · Application file storage, direct uploads, presigned URLs, multipart transfer, validation, malware scanning, metadata, lifecycle, and delivery](lessons/0471-application-file-storage-direct-uploads-presigned-urls-multipart-transfe.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0472 · Background jobs, queues, leases, acknowledgements, retries, idempotency, scheduling, dead letters, and worker shutdown](lessons/0472-background-jobs-queues-leases-acknowledgements-retries-idempotency-sched.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0473 · Audit logs, actors, actions, targets, outcomes, correlation, tamper evidence, retention, privacy, and investigation](lessons/0473-audit-logs-actors-actions-targets-outcomes-correlation-tamper-evidence-r.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0474 · Admin systems, privileged workflows, RBAC, impersonation, approvals, bulk operations, safety rails, and observability](lessons/0474-admin-systems-privileged-workflows-rbac-impersonation-approvals-bulk-ope.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## Cloud and AWS Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0475 · Cloud mental models, shared responsibility, elasticity, regions, managed services, and tradeoffs](lessons/0475-cloud-mental-models-shared-responsibility-elasticity-regions-managed-ser.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0476 · AWS global infrastructure, Regions, Availability Zones, edge locations, partitions, and service scope](lessons/0476-aws-global-infrastructure-regions-availability-zones-edge-locations-part.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0477 · AWS accounts, Organizations, organizational units, SCPs, Control Tower, and landing zones](lessons/0477-aws-accounts-organizations-organizational-units-scps-control-tower-and-l.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0478 · AWS CLI, SDKs, profiles, credential provider chain, SigV4, endpoints, and retries](lessons/0478-aws-cli-sdks-profiles-credential-provider-chain-sigv4-endpoints-and-retr.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0479 · IAM identities, policies, resources, conditions, evaluation logic, boundaries, and explicit deny](lessons/0479-iam-identities-policies-resources-conditions-evaluation-logic-boundaries.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0480 · STS, role assumption, federation, IAM Identity Center, OIDC, session policies, and temporary credentials](lessons/0480-sts-role-assumption-federation-iam-identity-center-oidc-session-policies.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0481 · KMS, envelope encryption, key policies, grants, encryption context, rotation, and Secrets Manager](lessons/0481-kms-envelope-encryption-key-policies-grants-encryption-context-rotation-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0482 · VPCs, CIDR planning, subnets, route tables, local routes, IPv4, IPv6, and IP address management](lessons/0482-vpcs-cidr-planning-subnets-route-tables-local-routes-ipv4-ipv6-and-ip-ad.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0483 · Internet gateways, NAT gateways, egress-only gateways, VPC endpoints, PrivateLink, peering, and Transit Gateway](lessons/0483-internet-gateways-nat-gateways-egress-only-gateways-vpc-endpoints-privat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0484 · Security groups, network ACLs, Network Firewall, DNS Resolver, VPC Flow Logs, and packet diagnosis](lessons/0484-security-groups-network-acls-network-firewall-dns-resolver-vpc-flow-logs.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0485 · Route 53 zones, records, aliases, health checks, routing policies, DNSSEC, and failover](lessons/0485-route-53-zones-records-aliases-health-checks-routing-policies-dnssec-and.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0486 · CloudFront distributions, origins, cache keys, behaviors, invalidation, signed access, WAF, and edge security](lessons/0486-cloudfront-distributions-origins-cache-keys-behaviors-invalidation-signe.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0487 · Elastic Load Balancing, ALB, NLB, listeners, target groups, health checks, TLS, and connection behavior](lessons/0487-elastic-load-balancing-alb-nlb-listeners-target-groups-health-checks-tls.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0488 · EC2 instance families, AMIs, user data, metadata, IMDSv2, placement, Auto Scaling, and lifecycle](lessons/0488-ec2-instance-families-amis-user-data-metadata-imdsv2-placement-auto-scal.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0489 · EBS, instance store, EFS, FSx, snapshots, encryption, performance, attachment, and durability](lessons/0489-ebs-instance-store-efs-fsx-snapshots-encryption-performance-attachment-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0490 · S3 buckets, objects, consistency, versioning, lifecycle, replication, events, policies, and data protection](lessons/0490-s3-buckets-objects-consistency-versioning-lifecycle-replication-events-p.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0491 · ECR, ECS task definitions, services, capacity providers, Fargate, EC2 launch type, and deployments](lessons/0491-ecr-ecs-task-definitions-services-capacity-providers-fargate-ec2-launch-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0492 · Lambda execution environments, handlers, cold starts, concurrency, event sources, layers, and failure semantics](lessons/0492-lambda-execution-environments-handlers-cold-starts-concurrency-event-sou.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0493 · API Gateway HTTP APIs, REST APIs, WebSocket APIs, integrations, authorizers, throttling, and stages](lessons/0493-api-gateway-http-apis-rest-apis-websocket-apis-integrations-authorizers-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0494 · RDS, Aurora, Multi-AZ, read replicas, backups, failover, parameter groups, IAM auth, and RDS Proxy](lessons/0494-rds-aurora-multi-az-read-replicas-backups-failover-parameter-groups-iam-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0495 · DynamoDB partition keys, sort keys, indexes, capacity, adaptive behavior, consistency, transactions, TTL, and streams](lessons/0495-dynamodb-partition-keys-sort-keys-indexes-capacity-adaptive-behavior-con.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0496 · ElastiCache Redis, cache-aside, TTL, eviction, clustering, replication, failover, and stampede control](lessons/0496-elasticache-redis-cache-aside-ttl-eviction-clustering-replication-failov.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0497 · SQS, SNS, standard queues, FIFO, visibility timeouts, DLQs, long polling, fan-out, and idempotency](lessons/0497-sqs-sns-standard-queues-fifo-visibility-timeouts-dlqs-long-polling-fan-o.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0498 · EventBridge buses, rules, schemas, archives, replay, Scheduler, Step Functions, retries, and compensation](lessons/0498-eventbridge-buses-rules-schemas-archives-replay-scheduler-step-functions.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0499 · Kinesis Data Streams, Firehose, MSK, shards, partitions, consumers, checkpoints, ordering, and streaming backpressure](lessons/0499-kinesis-data-streams-firehose-msk-shards-partitions-consumers-checkpoint.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0500 · CloudWatch metrics, logs, alarms, dashboards, Logs Insights, X-Ray, OpenTelemetry, and correlation](lessons/0500-cloudwatch-metrics-logs-alarms-dashboards-logs-insights-x-ray-openteleme.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0501 · CloudTrail, AWS Config, GuardDuty, Security Hub, Detective, audit trails, detection, and response](lessons/0501-cloudtrail-aws-config-guardduty-security-hub-detective-audit-trails-dete.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0502 · CloudFormation, CDK, stacks, change sets, dependencies, custom resources, drift, and infrastructure testing](lessons/0502-cloudformation-cdk-stacks-change-sets-dependencies-custom-resources-drif.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0503 · AWS reliability, Well-Architected pillars, quotas, multi-AZ design, backups, disaster recovery, RTO, and RPO](lessons/0503-aws-reliability-well-architected-pillars-quotas-multi-az-design-backups-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0504 · AWS cost models, tags, CUR, Cost Explorer, Budgets, rightsizing, Savings Plans, Spot, and FinOps](lessons/0504-aws-cost-models-tags-cur-cost-explorer-budgets-rightsizing-savings-plans.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0505 · Amazon Bedrock, SageMaker, model access, inference, agents, knowledge bases, guardrails, evaluation, and AI security](lessons/0505-amazon-bedrock-sagemaker-model-access-inference-agents-knowledge-bases-g.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0506 · Cloud and AWS production architecture capstone, full-stack AI delivery, security, reliability, cost, and incident defense](lessons/0506-cloud-and-aws-production-architecture-capstone-full-stack-ai-delivery-se.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## DevOps Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0507 · DevOps principles, CALMS, flow, feedback, learning, ownership, and socio-technical systems](lessons/0507-devops-principles-calms-flow-feedback-learning-ownership-and-socio-techn.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0508 · Linux processes, systemd, services, users, permissions, signals, limits, and resource diagnosis](lessons/0508-linux-processes-systemd-services-users-permissions-signals-limits-and-re.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0509 · Networking diagnostics, DNS, routing, TCP, TLS, HTTP, proxies, load balancers, and timeouts](lessons/0509-networking-diagnostics-dns-routing-tcp-tls-http-proxies-load-balancers-a.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0510 · Shell automation, strict mode, quoting, pipes, exit codes, idempotency, traps, and portable scripts](lessons/0510-shell-automation-strict-mode-quoting-pipes-exit-codes-idempotency-traps-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0511 · Git workflows, trunk-based development, branches, pull requests, reviews, rebasing, releases, and recovery](lessons/0511-git-workflows-trunk-based-development-branches-pull-requests-reviews-reb.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0512 · CI pipeline graphs, triggers, runners, jobs, matrices, caches, artifacts, concurrency, and reproducibility](lessons/0512-ci-pipeline-graphs-triggers-runners-jobs-matrices-caches-artifacts-concu.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0513 · Automated testing strategy, unit, integration, contract, end-to-end, performance, and quality gates](lessons/0513-automated-testing-strategy-unit-integration-contract-end-to-end-performa.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0514 · Software supply chain, dependency trust, SBOMs, provenance, signing, attestations, and SLSA concepts](lessons/0514-software-supply-chain-dependency-trust-sboms-provenance-signing-attestat.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0515 · CI identity, OIDC federation, secrets, environments, approvals, least privilege, and runner security](lessons/0515-ci-identity-oidc-federation-secrets-environments-approvals-least-privile.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0516 · Artifact repositories, semantic versioning, immutable releases, promotion, retention, and rollback identity](lessons/0516-artifact-repositories-semantic-versioning-immutable-releases-promotion-r.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0517 · Configuration, environment variables, feature flags, secrets, dynamic config, validation, and drift](lessons/0517-configuration-environment-variables-feature-flags-secrets-dynamic-config.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0518 · Deployment strategies, rolling, recreate, blue-green, canary, feature release, health checks, and rollback](lessons/0518-deployment-strategies-rolling-recreate-blue-green-canary-feature-release.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0519 · Database delivery, expand-contract migrations, backward compatibility, data backfills, locks, and rollback](lessons/0519-database-delivery-expand-contract-migrations-backward-compatibility-data.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0520 · Observability, SLIs, SLOs, error budgets, metrics, logs, traces, alerts, and dashboards](lessons/0520-observability-slis-slos-error-budgets-metrics-logs-traces-alerts-and-das.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0521 · Incident response, severity, command, communication, mitigation, recovery, and blameless postmortems](lessons/0521-incident-response-severity-command-communication-mitigation-recovery-and.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0522 · Capacity planning, load testing, queues, saturation, autoscaling, performance budgets, and load shedding](lessons/0522-capacity-planning-load-testing-queues-saturation-autoscaling-performance.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0523 · Infrastructure as code, desired state, plans, modules, state, drift, policy checks, and change review](lessons/0523-infrastructure-as-code-desired-state-plans-modules-state-drift-policy-ch.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0524 · Platform engineering, internal developer platforms, golden paths, self-service, APIs, scorecards, and product thinking](lessons/0524-platform-engineering-internal-developer-platforms-golden-paths-self-serv.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0525 · DevSecOps, threat modeling, secure defaults, policy as code, compliance evidence, and vulnerability response](lessons/0525-devsecops-threat-modeling-secure-defaults-policy-as-code-compliance-evid.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0526 · DevOps production delivery capstone, value stream, pipeline, infrastructure, observability, incident, and improvement](lessons/0526-devops-production-delivery-capstone-value-stream-pipeline-infrastructure.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## Docker Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0527 · Docker architecture, client, daemon, API, containerd, runc, registries, and object lifecycle](lessons/0527-docker-architecture-client-daemon-api-containerd-runc-registries-and-obj.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0528 · Images, containers, read-only layers, writable layers, content digests, tags, and lifecycle](lessons/0528-images-containers-read-only-layers-writable-layers-content-digests-tags-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0529 · Dockerfile FROM, RUN, COPY, ADD, WORKDIR, USER, ENV, ARG, EXPOSE, and metadata](lessons/0529-dockerfile-from-run-copy-add-workdir-user-env-arg-expose-and-metadata.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0530 · Build context, .dockerignore, layers, cache keys, invalidation, ordering, and reproducible builds](lessons/0530-build-context-dockerignore-layers-cache-keys-invalidation-ordering-and-r.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0531 · BuildKit, multi-stage builds, named stages, targets, cache mounts, secret mounts, SSH mounts, and outputs](lessons/0531-buildkit-multi-stage-builds-named-stages-targets-cache-mounts-secret-mou.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0532 · CMD, ENTRYPOINT, exec form, shell form, arguments, environment expansion, and overrides](lessons/0532-cmd-entrypoint-exec-form-shell-form-arguments-environment-expansion-and-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0533 · PID 1, signals, process reaping, init, graceful shutdown, stop timeout, and application lifecycle](lessons/0533-pid-1-signals-process-reaping-init-graceful-shutdown-stop-timeout-and-ap.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0534 · Linux namespaces, cgroups, capabilities, seccomp, AppArmor, SELinux, and container isolation](lessons/0534-linux-namespaces-cgroups-capabilities-seccomp-apparmor-selinux-and-conta.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0535 · Rootless Docker, user namespaces, non-root users, read-only filesystems, no-new-privileges, and hardening](lessons/0535-rootless-docker-user-namespaces-non-root-users-read-only-filesystems-no-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0536 · Docker networking, bridge, host, none, user-defined networks, DNS, NAT, published ports, and IPv6](lessons/0536-docker-networking-bridge-host-none-user-defined-networks-dns-nat-publish.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0537 · Overlay filesystems, container writable state, volumes, bind mounts, tmpfs, ownership, backup, and performance](lessons/0537-overlay-filesystems-container-writable-state-volumes-bind-mounts-tmpfs-o.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0538 · Docker Compose services, projects, networks, volumes, profiles, dependencies, environment, and overrides](lessons/0538-docker-compose-services-projects-networks-volumes-profiles-dependencies-.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0539 · Health checks, readiness, startup ordering, restart policies, dependency failure, and self-healing limits](lessons/0539-health-checks-readiness-startup-ordering-restart-policies-dependency-fai.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0540 · Container logs, stdout, stderr, logging drivers, docker stats, events, metrics, and retention](lessons/0540-container-logs-stdout-stderr-logging-drivers-docker-stats-events-metrics.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0541 · Container debugging, inspect, logs, exec, top, diff, events, network namespaces, and minimal images](lessons/0541-container-debugging-inspect-logs-exec-top-diff-events-network-namespaces.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0542 · Registries, repositories, tags, digests, authentication, push, pull, garbage collection, and retention](lessons/0542-registries-repositories-tags-digests-authentication-push-pull-garbage-co.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0543 · Multi-platform images, buildx, builders, emulation, cross-compilation, manifests, and platform selection](lessons/0543-multi-platform-images-buildx-builders-emulation-cross-compilation-manife.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0544 · Container supply-chain security, base images, vulnerabilities, SBOMs, provenance, signing, and policy](lessons/0544-container-supply-chain-security-base-images-vulnerabilities-sboms-proven.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0545 · Production image optimization, dependency caching, distroless, resource limits, immutability, and operational tradeoffs](lessons/0545-production-image-optimization-dependency-caching-distroless-resource-lim.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |
| [0546 · Docker production capstone, build, Compose, security, networking, storage, observability, and incident diagnosis](lessons/0546-docker-production-capstone-build-compose-security-networking-storage-obs.html) | Recorded pass | [2026-09-13](REVIEW-EVIDENCE.md) |

## Kubernetes Complete Deep Dive

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0547 · Kubernetes purpose, declarative APIs, desired state, control plane, nodes, workloads, and orchestration tradeoffs](lessons/0547-kubernetes-purpose-declarative-apis-desired-state-control-plane-nodes-wo.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0548 · Kubernetes objects, apiVersion, kind, metadata, spec, status, UIDs, generations, resource versions, and etcd](lessons/0548-kubernetes-objects-apiversion-kind-metadata-spec-status-uids-generations.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0549 · API server, authentication, authorization, admission, validation, conversion, persistence, and audit](lessons/0549-api-server-authentication-authorization-admission-validation-conversion-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0550 · Controllers, reconciliation loops, watches, work queues, owner references, finalizers, and garbage collection](lessons/0550-controllers-reconciliation-loops-watches-work-queues-owner-references-fi.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0551 · Scheduler, pending Pods, filtering, scoring, binding, requests, constraints, plugins, and scheduling failure](lessons/0551-scheduler-pending-pods-filtering-scoring-binding-requests-constraints-pl.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0552 · Nodes, kubelet, CRI, container runtime, pod sandbox, image pulls, status, leases, and node failure](lessons/0552-nodes-kubelet-cri-container-runtime-pod-sandbox-image-pulls-status-lease.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0553 · Pods, shared network, volumes, lifecycle, restart policy, init containers, sidecars, and ephemeral containers](lessons/0553-pods-shared-network-volumes-lifecycle-restart-policy-init-containers-sid.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0554 · Startup, readiness, liveness probes, conditions, readiness gates, termination, grace periods, and draining](lessons/0554-startup-readiness-liveness-probes-conditions-readiness-gates-termination.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0555 · Deployments, ReplicaSets, rolling updates, maxSurge, maxUnavailable, progress, pause, and rollback](lessons/0555-deployments-replicasets-rolling-updates-maxsurge-maxunavailable-progress.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0556 · StatefulSets, stable identity, ordered rollout, headless Services, persistent storage, and failure recovery](lessons/0556-statefulsets-stable-identity-ordered-rollout-headless-services-persisten.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0557 · DaemonSets, node-local agents, update strategies, tolerations, priority, and system workload safety](lessons/0557-daemonsets-node-local-agents-update-strategies-tolerations-priority-and-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0558 · Jobs, CronJobs, completions, parallelism, backoff, deadlines, concurrency policy, and failure handling](lessons/0558-jobs-cronjobs-completions-parallelism-backoff-deadlines-concurrency-poli.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0559 · Services, ClusterIP, NodePort, LoadBalancer, EndpointSlices, selectors, kube-proxy, and traffic policies](lessons/0559-services-clusterip-nodeport-loadbalancer-endpointslices-selectors-kube-p.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0560 · Ingress, ingress controllers, Gateway API, routes, listeners, TLS, load balancers, and north-south traffic](lessons/0560-ingress-ingress-controllers-gateway-api-routes-listeners-tls-load-balanc.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0561 · Cluster DNS, CoreDNS, Service discovery, search domains, ndots, caching, and DNS debugging](lessons/0561-cluster-dns-coredns-service-discovery-search-domains-ndots-caching-and-d.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0562 · Kubernetes network model, CNI, Pod IPs, routing, encapsulation, NetworkPolicy, ingress, egress, and isolation](lessons/0562-kubernetes-network-model-cni-pod-ips-routing-encapsulation-networkpolicy.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0563 · ConfigMaps, Secrets, environment variables, projected volumes, Downward API, reload, encryption, and external secret stores](lessons/0563-configmaps-secrets-environment-variables-projected-volumes-downward-api-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0564 · CPU and memory requests, limits, cgroups, QoS classes, throttling, OOM, eviction, and resource diagnosis](lessons/0564-cpu-and-memory-requests-limits-cgroups-qos-classes-throttling-oom-evicti.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0565 · PersistentVolumes, PVCs, StorageClasses, CSI, dynamic provisioning, access modes, reclaim policy, and snapshots](lessons/0565-persistentvolumes-pvcs-storageclasses-csi-dynamic-provisioning-access-mo.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0566 · Namespaces, labels, selectors, annotations, quotas, LimitRanges, multi-tenancy, and isolation boundaries](lessons/0566-namespaces-labels-selectors-annotations-quotas-limitranges-multi-tenancy.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0567 · ServiceAccounts, RBAC Roles, ClusterRoles, bindings, verbs, resources, subresources, and least privilege](lessons/0567-serviceaccounts-rbac-roles-clusterroles-bindings-verbs-resources-subreso.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0568 · SecurityContext, users, groups, capabilities, seccomp, AppArmor, Pod Security Standards, and admission](lessons/0568-securitycontext-users-groups-capabilities-seccomp-apparmor-pod-security-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0569 · Horizontal Pod Autoscaler, Vertical Pod Autoscaler, cluster autoscaling, metrics, stabilization, and scaling limits](lessons/0569-horizontal-pod-autoscaler-vertical-pod-autoscaler-cluster-autoscaling-me.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0570 · Affinity, anti-affinity, topology spread, taints, tolerations, priority, preemption, disruption budgets, and drains](lessons/0570-affinity-anti-affinity-topology-spread-taints-tolerations-priority-preem.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0571 · Kubernetes observability, events, logs, metrics, API audit, traces, control-plane signals, and SLOs](lessons/0571-kubernetes-observability-events-logs-metrics-api-audit-traces-control-pl.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0572 · Kubernetes debugging, Pending, ImagePullBackOff, CrashLoopBackOff, OOMKilled, DNS, networking, storage, and nodes](lessons/0572-kubernetes-debugging-pending-imagepullbackoff-crashloopbackoff-oomkilled.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0573 · Helm, charts, templates, values, releases, hooks, dependencies, Kustomize, overlays, and configuration management](lessons/0573-helm-charts-templates-values-releases-hooks-dependencies-kustomize-overl.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0574 · GitOps, reconciliation, drift, pull-based delivery, CRDs, operators, webhooks, and API extension](lessons/0574-gitops-reconciliation-drift-pull-based-delivery-crds-operators-webhooks-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0575 · Cluster operations, version skew, upgrades, node replacement, etcd backup, disaster recovery, and EKS boundaries](lessons/0575-cluster-operations-version-skew-upgrades-node-replacement-etcd-backup-di.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0576 · Kubernetes production capstone, architecture, security, delivery, scaling, observability, failure injection, and operations](lessons/0576-kubernetes-production-capstone-architecture-security-delivery-scaling-ob.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## Mathematics and Machine Learning Foundations

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0577 · Vectors, matrices, similarity, projections, and probability](lessons/0577-vectors-matrices-similarity-projections-and-probability.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0578 · Optimization, gradients, loss functions, regularization, and generalization](lessons/0578-optimization-gradients-loss-functions-regularization-and-generalization.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0579 · Data splits, leakage, imbalance, metrics, and experiment design](lessons/0579-data-splits-leakage-imbalance-metrics-and-experiment-design.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0580 · Classical ML, embeddings, clustering, ranking, and recommendation intuition](lessons/0580-classical-ml-embeddings-clustering-ranking-and-recommendation-intuition.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## LLM and Transformer Internals

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0581 · Tokenization, vocabulary, embeddings, positional information, and context windows](lessons/0581-tokenization-vocabulary-embeddings-positional-information-and-context-wi.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0582 · Attention, transformer blocks, residual streams, normalization, and feed-forward layers](lessons/0582-attention-transformer-blocks-residual-streams-normalization-and-feed-for.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0583 · Pretraining, next-token prediction, fine-tuning, instruction tuning, and preference optimization](lessons/0583-pretraining-next-token-prediction-fine-tuning-instruction-tuning-and-pre.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0584 · Decoding, temperature, top-p, determinism, caching, batching, and quantization](lessons/0584-decoding-temperature-top-p-determinism-caching-batching-and-quantization.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0585 · Hallucination, calibration, long-context limits, reasoning claims, and failure analysis](lessons/0585-hallucination-calibration-long-context-limits-reasoning-claims-and-failu.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## AI Application Engineering

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0586 · Model APIs, messages, instructions, multimodal inputs, streaming, and provider abstraction](lessons/0586-model-apis-messages-instructions-multimodal-inputs-streaming-and-provide.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0587 · Prompt design, context engineering, examples, delimiters, and prompt versioning](lessons/0587-prompt-design-context-engineering-examples-delimiters-and-prompt-version.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0588 · Structured outputs, schemas, parsing, validation, and repair](lessons/0588-structured-outputs-schemas-parsing-validation-and-repair.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0589 · Tool calling, execution boundaries, permissions, and human approval](lessons/0589-tool-calling-execution-boundaries-permissions-and-human-approval.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0590 · Latency, cost, caching, fallbacks, rate limits, and model routing](lessons/0590-latency-cost-caching-fallbacks-rate-limits-and-model-routing.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0591 · AI frontend streaming, fetch streams, SSE, event framing, incremental state, cancellation, reconnection, and backpressure](lessons/0591-ai-frontend-streaming-fetch-streams-sse-event-framing-incremental-state-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0592 · Generative UI, structured message parts, tool calls, human approval, optimistic state, errors, and accessibility](lessons/0592-generative-ui-structured-message-parts-tool-calls-human-approval-optimis.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0593 · Conversation persistence, message identity, server authority, resumable streams, authentication, privacy, testing, and evaluation](lessons/0593-conversation-persistence-message-identity-server-authority-resumable-str.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## Search, Embeddings, and RAG

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0594 · Information retrieval fundamentals, lexical search, dense retrieval, and hybrid search](lessons/0594-information-retrieval-fundamentals-lexical-search-dense-retrieval-and-hy.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0595 · Ingestion, parsing, cleaning, metadata, chunking, and indexing](lessons/0595-ingestion-parsing-cleaning-metadata-chunking-and-indexing.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0596 · Query rewriting, filtering, reranking, context assembly, and citations](lessons/0596-query-rewriting-filtering-reranking-context-assembly-and-citations.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0597 · RAG evaluation, golden sets, retrieval metrics, answer metrics, and regression testing](lessons/0597-rag-evaluation-golden-sets-retrieval-metrics-answer-metrics-and-regressi.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0598 · Advanced retrieval, freshness, permissions, and operational failure modes](lessons/0598-advanced-retrieval-freshness-permissions-and-operational-failure-modes.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0599 · Vector database data model, embeddings, dimensions, distance metrics, metadata, filtering, upserts, deletes, and query execution](lessons/0599-vector-database-data-model-embeddings-dimensions-distance-metrics-metada.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0600 · Vector index internals, exact search, HNSW graphs, IVF lists, product quantization, recall, memory, and build cost](lessons/0600-vector-index-internals-exact-search-hnsw-graphs-ivf-lists-product-quanti.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0601 · Vector database storage internals, segments, write-ahead logs, tombstones, compaction, filtering plans, sharding, replication, and recovery](lessons/0601-vector-database-storage-internals-segments-write-ahead-logs-tombstones-c.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0602 · Portfolio Project 2 — evaluated knowledge product](lessons/0602-portfolio-project-2-evaluated-knowledge-product.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## Agents and Durable AI Workflows

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0603 · LLM system blueprint, workflows versus agents, ReAct, state machines, planners, and control loops](lessons/0603-llm-system-blueprint-workflows-versus-agents-react-state-machines-planne.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0604 · Tool design, descriptions, schemas, state, memory, and context management](lessons/0604-tool-design-descriptions-schemas-state-memory-and-context-management.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0605 · LangChain v1 agents, models, messages, tools, middleware, structured output, streaming, and tracing](lessons/0605-langchain-v1-agents-models-messages-tools-middleware-structured-output-s.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0606 · LangGraph StateGraph, Pydantic state schemas, nodes, edges, reducers, checkpoints, interrupts, and durable execution](lessons/0606-langgraph-stategraph-pydantic-state-schemas-nodes-edges-reducers-checkpo.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0607 · Model Context Protocol architecture, hosts, clients, servers, JSON-RPC, initialization, capabilities, tools, resources, prompts, and lifecycle](lessons/0607-model-context-protocol-architecture-hosts-clients-servers-json-rpc-initi.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0608 · MCP transports, Streamable HTTP, sessions, authorization, consent, security, testing, and observability](lessons/0608-mcp-transports-streamable-http-sessions-authorization-consent-security-t.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0609 · Checkpoints, retries, idempotency, human-in-the-loop, and recovery](lessons/0609-checkpoints-retries-idempotency-human-in-the-loop-and-recovery.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0610 · Multi-agent patterns, coordination costs, and failure containment](lessons/0610-multi-agent-patterns-coordination-costs-and-failure-containment.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0611 · Agent evaluation, traces, budgets, security, and stopping conditions](lessons/0611-agent-evaluation-traces-budgets-security-and-stopping-conditions.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## AI Evaluations, Observability, and Safety

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0612 · Evaluation objectives, datasets, rubrics, baselines, and slices](lessons/0612-evaluation-objectives-datasets-rubrics-baselines-and-slices.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0613 · Deterministic checks, model graders, human review, and judge calibration](lessons/0613-deterministic-checks-model-graders-human-review-and-judge-calibration.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0614 · LLM benchmarking, representative datasets, baselines, repetitions, quality metrics, latency, cost, and statistical uncertainty](lessons/0614-llm-benchmarking-representative-datasets-baselines-repetitions-quality-m.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0615 · Prompt injection, data exfiltration, tool abuse, and untrusted content](lessons/0615-prompt-injection-data-exfiltration-tool-abuse-and-untrusted-content.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0616 · AI traces, quality monitoring, drift, feedback, and incident response](lessons/0616-ai-traces-quality-monitoring-drift-feedback-and-incident-response.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0617 · Privacy, fairness, compliance, model risk, and product boundaries](lessons/0617-privacy-fairness-compliance-model-risk-and-product-boundaries.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## Production Capstone

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0618 · Product discovery, users, success metrics, constraints, and architecture](lessons/0618-product-discovery-users-success-metrics-constraints-and-architecture.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0619 · End-to-end implementation across React, Node.js or FastAPI, data, and AI](lessons/0619-end-to-end-implementation-across-react-node-js-or-fastapi-data-and-ai.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0620 · Quality, security, evaluation, observability, deployment, and operations](lessons/0620-quality-security-evaluation-observability-deployment-and-operations.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0621 · Portfolio narrative, demo, case study, and architecture defense](lessons/0621-portfolio-narrative-demo-case-study-and-architecture-defense.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

## International Interviews and Relocation Readiness Complete Module

| Lesson | Content status | Individual evidence |
| --- | --- | --- |
| [0622 · Role targeting, job-description analysis, skill signals, gap mapping, and evidence selection](lessons/0622-role-targeting-job-description-analysis-skill-signals-gap-mapping-and-ev.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0623 · Resume architecture, ATS parsing, achievement bullets, keywords, credibility, and tailoring](lessons/0623-resume-architecture-ats-parsing-achievement-bullets-keywords-credibility.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0624 · LinkedIn profile, headline, About, experience, skills, Open to Work, and discoverability](lessons/0624-linkedin-profile-headline-about-experience-skills-open-to-work-and-disco.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0625 · GitHub profile, pinned repositories, portfolio evidence, READMEs, demos, and engineering credibility](lessons/0625-github-profile-pinned-repositories-portfolio-evidence-readmes-demos-and-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0626 · Job portals, company career pages, search queries, filters, alerts, sourcing channels, and fraud checks](lessons/0626-job-portals-company-career-pages-search-queries-filters-alerts-sourcing-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0627 · Application tracking, prioritization, personalized outreach, follow-ups, analytics, and safe automation](lessons/0627-application-tracking-prioritization-personalized-outreach-follow-ups-ana.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0628 · Recruiter screens, career narrative, introduction, motivation, scope, compensation, and availability](lessons/0628-recruiter-screens-career-narrative-introduction-motivation-scope-compens.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0629 · Coding interview method, clarification, examples, invariants, brute force, optimization, complexity, and tests](lessons/0629-coding-interview-method-clarification-examples-invariants-brute-force-op.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0630 · JavaScript and Python coding interviews, language fluency, debugging, standard libraries, and execution](lessons/0630-javascript-and-python-coding-interviews-language-fluency-debugging-stand.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0631 · Full-stack technical interviews, JavaScript, Node.js, Python, React, FastAPI, data, cloud, and operations](lessons/0631-full-stack-technical-interviews-javascript-node-js-python-react-fastapi-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0632 · System-design interviews, requirements, estimates, APIs, data, scaling, reliability, and evolution](lessons/0632-system-design-interviews-requirements-estimates-apis-data-scaling-reliab.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0633 · AI engineering interviews, model behavior, RAG, agents, evaluations, safety, latency, and cost](lessons/0633-ai-engineering-interviews-model-behavior-rag-agents-evaluations-safety-l.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0634 · Situational interview questions, hypothetical scenarios, clarification, principles, options, tradeoffs, decisions, and model answers](lessons/0634-situational-interview-questions-hypothetical-scenarios-clarification-pri.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0635 · Behavioral story bank, STAR, decisions, actions, results, metrics, and reflection](lessons/0635-behavioral-story-bank-star-decisions-actions-results-metrics-and-reflect.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0636 · Leadership, ownership, conflict, failure, feedback, ambiguity, and cross-cultural collaboration](lessons/0636-leadership-ownership-conflict-failure-feedback-ambiguity-and-cross-cultu.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0637 · Technical storytelling, audience, context, stakes, tension, decisions, evidence, clarity, and brevity](lessons/0637-technical-storytelling-audience-context-stakes-tension-decisions-evidenc.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0638 · Influence without authority, stakeholder mapping, listening, incentives, framing, credibility, coalition building, disagreement, and escalation](lessons/0638-influence-without-authority-stakeholder-mapping-listening-incentives-fra.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0639 · Ethical persuasion, transparency, consent, autonomy, incentives, nudges, dark patterns, coercion, deception, and manipulation boundaries](lessons/0639-ethical-persuasion-transparency-consent-autonomy-incentives-nudges-dark-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0640 · Portfolio presentations, project walkthroughs, architecture diagrams, demos, tradeoffs, and live questions](lessons/0640-portfolio-presentations-project-walkthroughs-architecture-diagrams-demos.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0641 · Networking, open source, referrals, communities, outreach, and international communication](lessons/0641-networking-open-source-referrals-communities-outreach-and-international-.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0642 · Salary negotiation, market evidence, total compensation, ranges, anchors, BATNA, priorities, scripts, counteroffers, and written terms](lessons/0642-salary-negotiation-market-evidence-total-compensation-ranges-anchors-bat.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0643 · Relocation readiness, work authorization, sponsorship, official research, offer evaluation, and negotiation](lessons/0643-relocation-readiness-work-authorization-sponsorship-official-research-of.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |
| [0644 · Mock interview loops, scorecards, recordings, error logs, feedback, spaced retrieval, and improvement cycles](lessons/0644-mock-interview-loops-scorecards-recordings-error-logs-feedback-spaced-re.html) | Recorded pass | [2026-09-14](REVIEW-EVIDENCE.md) |

Regenerate with `LESSON_PYTHON=python3.13 node scripts/review-lessons.mjs` (or another available Python 3.12+ interpreter). Edit the manual ledger/evidence, not this generated checklist.
