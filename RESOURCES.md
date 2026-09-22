# Full Stack AI Engineer Resources

## Knowledge

- [TypeScript inference](https://www.typescriptlang.org/docs/handbook/type-inference.html), [object types](https://www.typescriptlang.org/docs/handbook/2/objects.html), and [enums](https://www.typescriptlang.org/docs/handbook/enums.html)
  Consulted 2026-09-22 to distinguish contextual inference, insufficient inference, readonly arrays and const enums in the curriculum-wide MCQs. These refine existing lesson definitions rather than certify compiler execution.
- [Python imports](https://docs.python.org/3/reference/import.html), [structural protocols](https://docs.python.org/3/library/typing.html#typing.Protocol), and [Starlette middleware source documentation](https://github.com/Kludex/starlette/blob/main/docs/middleware.md)
  Consulted 2026-09-22 for partially initialized circular imports, structural typing and pure ASGI middleware. The Starlette website failed to load; its official repository documentation supplied the reference. Integration behavior remains untested.

- [Python thread offloading](https://docs.python.org/3/library/asyncio-task.html#asyncio.to_thread), [event-loop executors](https://docs.python.org/3/library/asyncio-eventloop.html#asyncio.loop.run_in_executor), and [executor lifecycle](https://docs.python.org/3/library/concurrent.futures.html)
  Ground the 0289/0291 integration exercise: submission timing, copied context, awaiting results, running-work cancellation limits and pool ownership. Checked 2026-09-20; stdlib fixture executes without external I/O.
- [Linux useradd](https://man7.org/linux/man-pages/man8/useradd.8.html), [usermod](https://man7.org/linux/man-pages/man8/usermod.8.html), [groupadd](https://man7.org/linux/man-pages/man8/groupadd.8.html), [inode modes](https://man7.org/linux/man-pages/man7/inode.7.html), [path resolution](https://man7.org/linux/man-pages/man7/path_resolution.7.html), and [umask](https://man7.org/linux/man-pages/man2/umask.2.html)
  Maintained tool/kernel interface manuals for lesson 0508's scoped identity and permission lab. Checked 2026-09-20; command recipe parsed only, arithmetic fixture does not certify real Linux authorization.

- [Enterprise AI practice](reference/enterprise-ai-practice.html) — 15 focused extensions, checked 2026-09-20. Each section links primary documentation and separates executable local mechanics from provisioned integration assignments.
  Retrieval sources: [Pinecone filtering](https://docs.pinecone.io/guides/search/filter-by-metadata), [Ragas evaluation](https://docs.ragas.io/en/stable/getstarted/rag_eval/), [parent retrieval](https://reference.langchain.com/python/langchain-classic/retrievers/parent_document_retriever/ParentDocumentRetriever), [PageIndex](https://github.com/VectifyAI/PageIndex), [RAG paper](https://arxiv.org/abs/2005.11401), [CoT paper](https://arxiv.org/abs/2201.11903).
  Agent sources: [Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview), [OpenAI SDK quickstart](https://developers.openai.com/api/docs/guides/agents/quickstart), [Claude permission semantics](https://code.claude.com/docs/en/agent-sdk/permissions), [memory taxonomy](https://docs.langchain.com/oss/python/concepts/memory), [OWASP agent security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html).
  Operations sources: [Gunicorn ASGI](https://gunicorn.org/asgi/), [Uvicorn deployment](https://uvicorn.dev/deployment/), [OWASP SAML](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html), [ETL/ELT](https://aws.amazon.com/compare/the-difference-between-etl-and-elt/), [vLLM serving](https://docs.vllm.ai/en/stable/cli/serve/). Release-dependent recipes must be rechecked against pinned versions; links do not certify integrations.

- [Sentence Transformers cross-encoder usage](https://www.sbert.net/docs/cross_encoder/usage/usage.html) and [reranking evaluation](https://www.sbert.net/docs/package_reference/cross_encoder/evaluation.html)
  Ground lesson 0596's cross-encoder extension: pair scoring, score interpretation, realistic candidate sets and evaluation configuration. Checked 2026-09-19; local exercises use fixed scores, not model inference.

- [ECMAScript array length](https://tc39.es/ecma262/2023/multipage/indexed-collections.html#sec-properties-of-array-instances-length), [generator completion](https://tc39.es/ecma262/2025/multipage/control-abstraction-objects.html#sec-generatorresumeabrupt), and [resizable buffers](https://github.com/tc39/proposal-resizablearraybuffer)
  Ground the sparse-length counterexample, unopened-generator return behavior and fixed versus resizable storage distinction in the JavaScript individual review.
- [TC39 explicit resource management](https://github.com/tc39/proposal-explicit-resource-management)
  Use for reverse disposal order and preservation of work/disposal failures; syntax and built-in support must be checked in the execution environment.

- [TCP congestion control](https://www.rfc-editor.org/rfc/rfc5681.html), [HTTP resource identifiers](https://www.rfc-editor.org/rfc/rfc9110.html#section-4.2), and [file/directory synchronization](https://man7.org/linux/man-pages/man2/fsync.2.html)
  Use for systems 0060–0066: in-flight data versus window limits, query versus fragment handling, and namespace durability after atomic replacement. Round-level simulations and successful local file reads do not verify live TCP behavior or power-loss recovery.

- [HTML event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops), [HTML labels](https://html.spec.whatwg.org/multipage/forms.html#the-label-element), [CSS painting order](https://www.w3.org/TR/css-position-3/#painting-order), and [Fetch/CORS](https://fetch.spec.whatwg.org/#http-cors-protocol)
  Use for browser foundations 0051–0055: scheduling versus displayed pixels, semantic label associations, nested stacking contexts, and response access versus server authorization. Browser-only fixture instructions are not browser integration evidence.

- [MIT algorithm lecture notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/) and [ECMAScript shifts](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-bitwise-shift-operators)
  Use for 0018–0050: cost models and proof obligations, DP state-space size, language-specific integer width, and the distinction between algorithm work and retained teaching traces.

- [Bash pipeline status](https://www.gnu.org/software/bash/manual/bash.html#Pipelines), [Git objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects), [reflog](https://git-scm.com/docs/git-reflog), and [bisect](https://git-scm.com/docs/git-bisect)
  Use for foundations 0001–0002: process status versus successful work, snapshots versus references, recovery limits and reliable regression predicates. Bash web retrieval timed out during the final review; installed Bash help and read-only assertions verified the pipeline rule.

- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) and [pip repeatable installs](https://pip.pypa.io/en/stable/topics/repeatable-installs/)
  Use for 0003: frozen resolution, manifest mismatch, transitive pins, artifact hashes and platform-specific bundles. A matching lock is not a guarantee of installation success. These references do not authorize installations.

- [Node strict assertions](https://nodejs.org/api/assert.html) and [ADR process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html)
  Use for 0004's executable falsification and 0005's context/decision/consequences, review ownership and supersession. The outbox decision is a synthetic tabletop case, not deployment evidence.

- [Retrieval precision and recall](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-unranked-retrieval-sets-1.html) and [KD-tree nearest-neighbor queries](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.KDTree.query.html)
  Use to separate judged document relevance from nearest-neighbor accuracy and exact results from a particular brute-force implementation. Lesson 0597 uses only synthetic IDs and arithmetic, not SciPy or a retrieval service.

- [LangGraph interrupt resumption](https://docs.langchain.com/oss/python/langgraph/interrupts)
  Use for node re-execution, durable versus in-memory checkpointers, thread identity and replay-safe side effects. A resume value is not proof that an authorized person approved the exact pending action.

- [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)
  Use for confidence-band reliability diagrams and the distinction between matching global averages and calibrated predictions. Small synthetic bins illustrate arithmetic, not a reliable deployment estimate.

- [S3 presigned URL lifetime and restrictions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
  Use for bearer-token reuse, early expiry through credentials/policy, and the distinction between authorizing a request and terminating an already accepted download.

- [JSON Schema annotations](https://json-schema.org/understanding-json-schema/reference/annotations) and [format behavior](https://json-schema.org/understanding-json-schema/reference/type)
  Use for 0464: defaults do not fill missing values during validation, and format assertions depend on validator support/configuration. Test writer/reader compatibility independently of validating one schema version.

- [Kafka 4.1 design](https://kafka.apache.org/41/design/design/), [producer configuration](https://kafka.apache.org/41/configuration/producer-configs/), and [consumer configuration](https://kafka.apache.org/41/configuration/consumer-configs/)
  Use for ISR acknowledgements, follower reads, eventual compaction, transaction isolation and consumer ownership. These are version-pinned references, not a claim that 4.1 is the latest release. Kafka transactions do not automatically include external effects.

- [Test doubles and autospec](https://docs.python.org/3/library/unittest.mock.html), [property-based testing](https://hypothesis.readthedocs.io/en/latest/quickstart.html), [threat modeling](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html), and [software supply-chain security](https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html)
  Use for the distinct testing/security exercises in 0465–0468. Test-double interface checks are not real dependency verification; generated examples are not exhaustive proofs. Documentation links do not require installing the illustrated tools.

- [Google SRE: Implementing SLOs](https://sre.google/workbook/implementing-slos/)
  Use for user-centered good/total event ratios, explicit windows and targets, error-budget decisions and the limits of any particular measurement implementation.

- [FastAPI concurrency](https://fastapi.tiangolo.com/async/) and [Python task ownership and cancellation](https://docs.python.org/3/library/asyncio-task.html)
  Use to distinguish framework-offloaded endpoints from directly called helpers, and cooperative cancellation from terminating threads or reversing remote effects. Verify disconnect behavior with the actual ASGI server stack.

- [OWASP object authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) and [SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
  Use for per-resource decisions and enforcement across URL parsing, name resolution, connection and redirects. A returned policy object, verified identity or hostname allowlist is not sufficient by itself.

- [Linearizability](https://www.cs.cmu.edu/~wing/publications/HerlihyWing90.pdf), [CAP impossibility](https://www.cs.princeton.edu/courses/archive/spr22/cos418/papers/cap.pdf), and [Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
  Use for real-time histories, partition assumptions, version reconciliation and key placement. Small local counterexamples explain a guarantee; they do not implement or certify a distributed protocol. Dynamo here is the published system design, not a promise about every current DynamoDB configuration.

- [Prepared transactions](https://www.postgresql.org/docs/current/sql-prepare-transaction.html) and [CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
  Use for in-doubt recovery responsibilities and the distinction between separating read/write models and storing event history. Keep unavailable decisions explicit and do not introduce separate databases just to demonstrate CQRS.

- [React input ownership](https://react.dev/reference/react-dom/components/input) and [raw HTML rendering](https://react.dev/reference/react-dom/components/common)
  Use for stable controlled/uncontrolled input modes and the distinction between ordinary text rendering and trusted, sanitized HTML. Neither client validation nor escaping substitutes for server authorization.

- [Evaluation repetitions](https://docs.langchain.com/langsmith/repetition) and [evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts)
  Use for versioned test cases, repeated outputs and slice-level comparison. Repeating a case does not expand task coverage; retain individual outcomes and distinguish descriptive spread from uncertainty about deployment performance.

- [Generated-column restrictions](https://www.postgresql.org/docs/current/ddl-generated-columns.html), [complete-transaction retry](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html), and [logical replication limits](https://www.postgresql.org/docs/17/logical-replication-restrictions.html)
  Use for immutable generation expressions, fresh decisions after serialization failure and explicit schema/sequence migration. Retry helpers and text checks do not validate database isolation or replication.

- [Deployment progress](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [HPA metrics](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/), and [Prometheus rate](https://prometheus.io/docs/prometheus/latest/querying/functions/)
  Use for stalled-rollout reporting versus recovery, request-relative CPU utilization and rate-before-aggregation. Explain missing telemetry and insufficient capacity before treating a configuration as an availability guarantee.

- [NetworkPolicy semantics](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [Docker rootless mode](https://docs.docker.com/engine/security/rootless/), and [Terraform plan behavior](https://developer.hashicorp.com/terraform/cli/commands/plan)
  Use to distinguish additive network rules from global deny, non-root container identity from daemon privilege, and secret-bearing plan artifacts from safe interview evidence. Check DNS paths and the meaning of Terraform exit code 2 explicitly.

- [SQS CloudFormation resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-sqs-queue.html), [S3 version deletion](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeletingObjectVersions.html), and [Bedrock Converse response](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)
  Use for native redrive-policy structure, reversible delete markers versus permanent version deletion, and text completion versus tool/truncated/guardrail output. Local parsers are not AWS deployment tests.

- [Kubernetes endpoint conditions](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/), [Service variants](https://kubernetes.io/docs/concepts/services-networking/service/), and [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
  Use for readiness versus endpoint deletion, headless/selectorless service exceptions and optional stage naming. Review these as configured behaviors, not universal diagrams.

- [CloudTrail data-event selection](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html), [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence), and [MCP transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
  Use to check which operations are actually audited, what survives a process restart and when HTTP session identifiers apply. These controls require explicit configuration, not just a named library or service.

- [HSTS threat model](https://datatracker.ietf.org/doc/html/rfc6797#section-2.3.1), [FastAPI dependency cleanup scopes](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/), and [Python coroutine definitions](https://docs.python.org/3/reference/compound_stmts.html#coroutine-function-definition)
  Use for the insecure first-request limitation of redirects, before/after-response cleanup and distinguishing coroutine functions from async generators.

- [Node stream lifecycle](https://nodejs.org/api/stream.html), [filesystem staging](https://nodejs.org/api/fs.html#fspromisesmkdtempprefix-options), and [HTTP/2 session close](https://nodejs.org/api/http2.html#http2sessionclosecallback)
  Use for backpressure thresholds, per-operation temporary-file ownership and graceful session close versus merely sending GOAWAY. Local checks do not prove crash durability or TLS lifecycle behavior.
- [Fetch body consumption](https://fetch.spec.whatwg.org/#body-mixin) and [Node AbortSignal](https://nodejs.org/api/globals.html#class-abortsignal)
  Use for bounded decoded-body reads, combining cancellation with deadlines and distinguishing cooperative cancellation from interrupting synchronous parsing.

- [React state identity](https://react.dev/learn/preserving-and-resetting-state), [effect cleanup](https://react.dev/reference/react/useEffect), and [native dialog semantics](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)
  Use for parent-scoped keys, stale callback cleanup and the difference between portal placement and actual modal behavior. Browser checks remain required.
- [SSE interpretation](https://html.spec.whatwg.org/multipage/server-sent-events.html), [LangGraph graph/state API](https://docs.langchain.com/oss/python/langgraph/graph-api), and [MCP lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
  Use to distinguish an LF-only JSON fixture from a protocol implementation, Pydantic attribute access from dictionary state, and a dispatch demo from a negotiated MCP session.
- [Stripe signature verification](https://docs.stripe.com/webhooks/signature), [S3 HeadObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html), and [presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
  Use for original signed bytes, provider-native verification, checksum retrieval and pinning the object version that was actually scanned. Mocks verify adapter control flow only.
- [TCP congestion control, RFC 5681](https://www.rfc-editor.org/rfc/rfc5681.html), [Python locks](https://docs.python.org/3/library/threading.html), and [temporary files](https://docs.python.org/3/library/tempfile.html)
  Use for ACK-versus-round reasoning, non-reentrant lock behavior and safe owned staging files. Kernel/network/crash behavior is not established by the local models.
- [FTC job-scam guidance](https://consumer.ftc.gov/articles/job-scams)
  Use for independently verifying hiring claims. A matching URL/email is only a screening signal, not proof that the recruiter or offer is genuine.
- [ASGI HTTP messages](https://asgi.readthedocs.io/en/latest/specs/www.html), [AnyIO cancellation](https://anyio.readthedocs.io/en/latest/cancellation.html), and [FastAPI error handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
  Use for streamed request boundaries, cancellation-scope ownership and redacted validation responses. Syntax and framework-free checks do not establish FastAPI integration correctness.
- [OAuth security best practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), [PyJWT API](https://pyjwt.readthedocs.io/en/stable/api.html), [HTTP preconditions](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match), and [Deprecation header](https://www.rfc-editor.org/rfc/rfc9745.html)
  Use for replacing legacy password grants, explicit JWT verification requirements, strong conditional writes and structured deprecation dates.
- [Python queue accounting](https://docs.python.org/3/library/asyncio-queue.html), [total ordering](https://docs.python.org/3/library/functools.html#functools.total_ordering), and [finite decimals](https://docs.python.org/3/library/decimal.html#decimal.Decimal.is_finite)
  Use for shutdown accounting, consistent comparisons and money-domain counterexamples. Local assertions demonstrate the mechanism, not production throughput.
- [Raft paper](https://raft.github.io/raft.pdf), [PostgreSQL data-modifying CTEs](https://www.postgresql.org/docs/current/queries-with.html), and [sequence functions](https://www.postgresql.org/docs/current/functions-sequence.html)
  Use for term persistence before consistency checks, effect gating and sequence/rollback limits. A Raft precheck is not an implementation of consensus; SQL examples still require a real database.
- [Circuit breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) and [W3C Trace Context](https://www.w3.org/TR/trace-context/)
  Use for probe-state reasoning and valid trace metadata. Distinguish a small state-machine exercise from a complete breaker, and tracing identity from business idempotency identity.
- [Lamport: Time, Clocks, and the Ordering of Events](https://lamport.azurewebsites.net/pubs/time-clocks.pdf), [SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/), and [handling overload](https://sre.google/sre-book/handling-overload/)
  Use for causality versus total ordering, separating successful and failed request measurements, and explaining admission-control limits. Synthetic exercises are not production measurements.
- [Node abortable timers](https://nodejs.org/api/timers.html#timerspromisessettimeoutdelay-value-options) and [Kafka consumer API](https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)
  Use for deadline/retry cleanup and committed-offset reasoning. The Java consumer contract grounds the broker lesson; its JavaScript adapter is explicitly illustrative, not a library API.
- [Redis benchmarking](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/), [LPUSH](https://redis.io/docs/latest/commands/lpush/), [ZRANGE](https://redis.io/docs/latest/commands/zrange/), and [SETBIT](https://redis.io/docs/latest/commands/setbit/)
  Use for controlled measurement, exact ordering exercises and bitmap allocation limits. Separate predicted command results from measured results on a real instance.
- [Redis protocol specification](https://redis.io/docs/latest/develop/reference/protocol-spec/), [Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/), and [ACL SETUSER](https://redis.io/docs/latest/commands/acl-setuser/)
  Use for byte-length framing, same-slot transaction constraints, and separate identity/command/key authorization exercises. The local RESP encoder checks do not test a live Redis client or server.
- [Redis transactions](https://redis.io/docs/latest/develop/using-commands/transactions/), [WAIT](https://redis.io/docs/latest/commands/wait/), [XTRIM](https://redis.io/docs/latest/commands/xtrim/), and [persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
  Use for transaction-error counterexamples, connection-scoped replication evidence, retention risk and offline recovery exercises. These sources support content review, not a claim that local Redis integration tests ran.
- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [transaction-local settings](https://www.postgresql.org/docs/current/sql-set.html), and [monitoring statistics](https://www.postgresql.org/docs/current/monitoring-stats.html)
  Review sources for tenant-boundary caveats, transaction scope and version-specific monitoring views. SQL integration execution is still required.
- [Lambda SQS partial batch failures](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html), [Node performance hooks](https://nodejs.org/api/perf_hooks.html), and [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
  Review sources for batch acknowledgment, event-loop measurements and the limits of URL parsing alone as a network security control.
- [Amazon senior engineer interview preparation](https://www.amazon.jobs/content/en/how-we-hire/sde-iii-interview-prep)
  Employer-authored senior expectations. Use for: architectural judgment, robust coding, technical leadership, and truthful behavioral evidence; do not generalize one company's process to all interviews.
- [AWS Builders' Library: safe retries](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/), [Google SRE canarying releases](https://sre.google/workbook/canarying-releases/), and [scikit-learn common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)
  Primary sources for worked senior cases involving unknown outcomes, release evidence, and evaluation leakage. Use for: counterexamples, failure experiments, and defensible tradeoffs.
- [Lost in the Middle](https://arxiv.org/abs/2307.03172)
  Research evaluating long-context use. Use for: explaining why accepted context length does not guarantee reliable use of evidence, then test current models on the actual workload.
- [ASD-STE100 Simplified Technical English, Issue 9](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf) and [official STE overview](https://www.asd-ste100.org/about_STE.html)
  The official controlled-language standard and overview. Use for: short active sentences, controlled technical terms, gradual descriptive detail, one-topic paragraphs, direct procedures, and consistent beginner explanations.
- [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)
  Current ecosystem evidence for prioritizing TypeScript, Python, AI-assisted engineering, Docker, collaboration, and public project work. Use for: annual curriculum-priority review.
- [Stack Overflow Developer Survey 2025 — Technology](https://survey.stackoverflow.co/2025/technology)
  Broad practitioner survey covering languages, databases, frameworks, and infrastructure. Use for: checking whether the stack remains broadly transferable.
- [World Economic Forum: Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/)
  Employer research on growing technical and human skills. Use for: balancing AI, security, analytical thinking, resilience, leadership, and collaboration.
- [Google Engineering Practices](https://google.github.io/eng-practices/), [what to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html), and [the code-review standard](https://google.github.io/eng-practices/review/reviewer/standard.html)
  Public engineering guidance grounded in large-codebase practice. Use for: readability, naming, complexity, comments, tests, maintainability, incremental improvement, and separating design evidence from personal style.
- [Martin Fowler's Refactoring catalog](https://refactoring.com/catalog/), [Refactoring](https://www.martinfowler.com/books/refactoring.html), and [Code Smell](https://martinfowler.com/bliki/CodeSmell.html)
  Primary author material for behavior-preserving small transformations, characterization and regression safety, code smells as investigation signals, and practical refactoring mechanics.
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.pearson.com/en-us/subject-catalog/p/design-patterns-elements-of-reusable-object-oriented-software/P200000009480/9780201633610), [.NET design guidelines](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/), and [Microsoft application architecture fundamentals](https://learn.microsoft.com/en-us/azure/architecture/guide/)
  Pattern and design references. Use for: pattern context, intent, forces and consequences; creational, structural, and behavioral families; SOLID-related contract judgment; dependency direction; and architecture-style tradeoffs. Translate class-heavy examples into functions or data when that is simpler.
- [ECMAScript Language Specification](https://tc39.es/ecma262/), [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide), and [V8 documentation](https://v8.dev/docs)
  The normative language standard, an accessible high-quality guide, and primary implementation material. Use for: specification algorithms, execution contexts, values, objects, modules, Promises, resource management, shared-memory semantics, built-ins, host boundaries, bytecode, object shapes, inline caches, garbage collection, optimization, deoptimization, and evidence-based performance work.
- [Node.js Learn](https://nodejs.org/en/learn), [Node.js API Documentation](https://nodejs.org/api/), [Node.js Packages](https://nodejs.org/api/packages.html), and [Node.js TypeScript](https://nodejs.org/api/typescript.html)
  Primary runtime documentation. Use for: V8 and libuv boundaries, event-loop phases, worker-pool behavior, buffers, streams, files, networking, HTTP, modules, native TypeScript execution, packages, processes, workers, permissions, testing, diagnostics, memory, profiling, native addons, and service operation.
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html), [TSConfig Reference](https://www.typescriptlang.org/tsconfig/), [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html), [TypeScript Design Goals](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals), and [TypeScript Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
  Official language and compiler sources. Use for: inference, narrowing, generics, transformations, variance, module and declaration behavior, runtime-boundary limits, project graphs, diagnostics, compiler tooling, performance, and upgrades.
- [React Learn](https://react.dev/learn), [React Hooks Reference](https://react.dev/reference/react/hooks), [React DOM Reference](https://react.dev/reference/react-dom), [React Server Components](https://react.dev/reference/rsc/server-components), and [React Compiler](https://react.dev/learn/react-compiler)
  Primary sources for the complete modern React surface. Use for: components, every stable hook, state, effects, concurrency, accessibility, testing, rendering internals, compiler behavior, client/server boundaries, and production architecture.
- [Python Tutorial](https://docs.python.org/3/tutorial/), [Python Language Reference](https://docs.python.org/3/reference/), [Python Standard Library](https://docs.python.org/3/library/), and [Python Packaging User Guide](https://packaging.python.org/en/latest/)
  Primary sources for the complete Python deep dive. Use for: execution and object models, imports, protocols, collections, iterators, generators, descriptors, typing, asyncio, threads, processes, memory and GC, profiling, testing, debugging, extension boundaries, virtual environments, build artifacts, and dependency workflows.
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/), [Advanced User Guide](https://fastapi.tiangolo.com/advanced/), [Concurrency and async/await](https://fastapi.tiangolo.com/async/), [Security Guide](https://fastapi.tiangolo.com/tutorial/security/), and [Deployment Concepts](https://fastapi.tiangolo.com/deployment/concepts/)
  The official FastAPI learning and reference paths. Use for: ASGI behavior, typed HTTP contracts, Pydantic validation, dependency graphs, lifespan, concurrency, security, OpenAPI, real-time connections, testing, performance, proxies, workers, containers, and graceful deployment.
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/), [Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), [Indexes](https://www.postgresql.org/docs/current/indexes.html), [Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html), and [High Availability](https://www.postgresql.org/docs/current/high-availability.html)
  Primary PostgreSQL sources. Use for: server and storage architecture, modeling, SQL, planning and execution, transactions, MVCC, locks, index access methods, vacuum, WAL, replication, backup, security, observability, tuning, and recovery.
- [Redis Documentation](https://redis.io/docs/latest/), [Data Types](https://redis.io/docs/latest/develop/data-types/), [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), [Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/), and [Cluster Specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
  Primary Redis sources. Use for: command and event-loop behavior, data structures, expiration and eviction, transactions and scripting, pipelining, RDB and AOF, replicas and Sentinel, Cluster, Streams, caching, coordination, security, and operations.
- [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html), [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html), [OpenAPI Specification](https://spec.openapis.org/oas/), [gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/), and [GraphQL Specification](https://spec.graphql.org/)
  Primary API standards and protocol sources. Use for: HTTP methods and intermediaries, resources and representations, status and error contracts, caching and preconditions, schema governance, generated clients, typed RPCs, streaming, deadlines, GraphQL execution, and compatibility.
- [Google Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), [Apache Kafka Documentation](https://kafka.apache.org/documentation/), [Kafka design](https://kafka.apache.org/41/design/design/), [Lamport's Time and Clocks paper](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/), [Raft extended paper](https://raft.github.io/raft.pdf), and [Spanner paper](https://research.google/pubs/pub45855/)
  Primary distributed-systems and operations sources. Use for: failure models, latency, deadlines, retries, overload, Kafka logs, partitions, replication, producers, consumers, messaging and delivery, clocks and causality, consistency, consensus, placement, multi-region operation, recovery, and system-design evidence.
- [Microsoft microservices architecture](https://learn.microsoft.com/en-us/azure/architecture/microservices/), [domain analysis](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis), [tactical DDD](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd), and [microservice boundaries](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries)
  Primary architecture guidance. Use for: modular-monolith versus microservice decisions, business-capability boundaries, bounded contexts, ubiquitous language, entities, value objects, aggregates, ownership, and distributed-system costs.
- [MIT OpenCourseWare: Introduction to Algorithms](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/) and [Designing Data-Intensive Applications](https://dataintensive.net/)
  Rigorous algorithmic and distributed-data foundations. Use for: interview problem solving, storage systems, replication, partitioning, streams, and system design.
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html), [IAM policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html), [Amazon VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html), and [Elastic Load Balancing](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
  Primary AWS architecture sources. Use for: shared responsibility, account and identity boundaries, network design, L4/L7 load balancing, health checks, reliability, security, performance, cost, sustainability, and service-selection tradeoffs.
- [GitHub Actions documentation](https://docs.github.com/en/actions/get-started/understand-github-actions), [GitHub Actions OIDC](https://docs.github.com/en/actions/reference/security/oidc), and [Google SRE Books](https://sre.google/books/)
  Primary DevOps and reliability sources. Use for: workflow graphs, short-lived cloud authentication, continuous delivery, observability, SLOs, incident response, and production tradeoffs.
- [Docker overview](https://docs.docker.com/get-started/docker-overview/), [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/), and [Docker Engine security](https://docs.docker.com/engine/security/)
  Primary Docker sources. Use for: client-daemon architecture, immutable image layers, build caching, minimal production images, namespaces, cgroups, capabilities, rootless operation, and runtime hardening.
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/), [Cluster Architecture](https://kubernetes.io/docs/concepts/architecture/), and [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
  Primary Kubernetes sources. Use for: API-driven desired state, control-plane components, controller reconciliation, workload rollout, networking, storage, scheduling, security, scaling, and cluster operations.
- [LinkedIn Job Alerts](https://www.linkedin.com/help/linkedin/answer/a508396), [Open to Work](https://www.linkedin.com/help/linkedin/answer/a507508), [Job-search best practices](https://www.linkedin.com/help/linkedin/answer/a509393), and [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement)
  Official job-search and platform sources. Use for: profile discoverability, native alerts, application quality, privacy choices, and safe automation boundaries. Automate only owned or explicitly permitted data and reminders; never scrape, automate engagement, bypass controls, or mass-apply.
- [GitHub profile resume guide](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume), [GitHub Skills](https://github.com/skills), and [GitHub Open Source Guide](https://opensource.guide/how-to-contribute/)
  Official portfolio and contribution guidance. Use for: profile READMEs, pinned evidence-rich repositories, reproducible demos, visible collaboration, and respectful open-source participation.
- [Amazon SDE II interview preparation](https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep), [Software development interview topics](https://amazon.jobs/content/en-gb/how-we-hire/interview-prep/software-development-topics), and [Amazon Leadership Principles](https://www.amazon.jobs/content/en/our-workplace/leadership-principles)
  Current employer-authored preparation material. Use for: coding, system design, technical depth, behavioral evidence, structured practice, and mock-loop scorecards without treating one company's process as universal.
- [Google Technical Writing Courses](https://developers.google.com/tech-writing), [Center for Creative Leadership influence guidance](https://www.ccl.org/articles/leading-effectively-articles/influence-others/), [FTC dark-patterns report](https://www.ftc.gov/reports/bringing-dark-patterns-light), and [Harvard Program on Negotiation salary guidance](https://www.pon.harvard.edu/daily/salary-negotiations/negotiate-salary-3-winning-strategies/)
  Primary and specialist communication sources. Use for: concise technical storytelling, influence without authority, transparent ethical persuasion, manipulation boundaries, evidence-based compensation requests, counteroffers, and written offer review.
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) and [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
  Industry security baselines. Use for: threat modeling, authentication, authorization, injection defense, secrets, model/tool security, and release checks.
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1) and [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
  Practical open-model education plus the foundational transformer paper. Use for: tokenization, embeddings, attention, transformers, inference, and model limitations.
- [Retrieval-Augmented Generation paper](https://arxiv.org/abs/2005.11401) and [Hugging Face RAG Evaluation](https://huggingface.co/learn/cookbook/rag_evaluation)
  Foundational retrieval-generation architecture and a practical evaluation workflow. Use for: retrieval pipelines, grounding, citations, metrics, and regression testing.
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
  Vendor-neutral risk framework. Use for: trustworthy AI design, risk identification, governance, measurement, and operational controls.
- [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents), [LangChain structured output](https://docs.langchain.com/oss/python/langchain/structured-output), [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview), [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence), and [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
  Current primary framework sources. Use for: LangChain v1 agent loops, models, messages, tools, middleware, structured output and streaming; LangGraph typed state, nodes, routing, reducers, checkpointing, interrupts, replay constraints, and durable execution.
- [LangSmith evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts), [evaluation types](https://docs.langchain.com/langsmith/evaluation-types), and [experiment configuration](https://docs.langchain.com/langsmith/experiment-configuration)
  Current primary evaluation sources. Use for: datasets, targets, evaluators, offline benchmarks, baselines, repetitions, concurrency, experiment comparison, regressions, and production feedback loops.
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-11-25), [lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle), [transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), and [authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
  Current protocol sources. Use for: hosts, clients, servers, JSON-RPC, initialization, capability negotiation, tools, resources, prompts, stdio, Streamable HTTP, sessions, authorization, security, cancellation, and lifecycle behavior.
- [pgvector documentation](https://github.com/pgvector/pgvector), [Qdrant storage internals](https://qdrant.tech/documentation/manage-data/storage/), and [Qdrant optimizer](https://qdrant.tech/documentation/operations/optimizer/)
  Primary implementation sources for vector data, metrics, exact search, HNSW, IVFFlat, recall tuning, filtering, write-ahead logs, segments, tombstones, compaction, memory mapping, and recovery.
- [AI SDK UI stream protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol), [tool usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage), and [message persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
  Primary AI frontend sources. Use for: typed stream events, SSE framing, message parts, tool states, human approval, persistence, stable message IDs, disconnect behavior, and resumable conversations.
- [Stripe webhooks](https://docs.stripe.com/webhooks), [Amazon S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html), and [Amazon SQS visibility timeouts](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
  Production workflow sources. Use for: signed raw webhook requests, retry and duplicate delivery, direct private uploads, temporary capabilities, object validation, queue leases, acknowledgements, and worker recovery.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) and [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
  Security guidance for structured audit evidence and privileged admin systems. Use for: event fields, sensitive-data exclusion, tamper detection, access controls, deny-by-default authorization, resource scope, and privileged workflow testing.

- [Chroma clients](https://docs.trychroma.com/reference/python/client), [collections](https://docs.trychroma.com/docs/collections/manage-collections), and [query/get](https://docs.trychroma.com/docs/querying-collections/query-and-get)
  Use for: local versus server-backed persistence, explicit embeddings, collection lifecycle and metadata-filtered retrieval. Linked extension includes a tenant-isolation fixture.
- [Neo4j MERGE](https://neo4j.com/docs/cypher-manual/current/clauses/merge/), [index use](https://neo4j.com/docs/cypher-manual/current/indexes/search-performance-indexes/using-indexes/), and [GraphRAG Python](https://neo4j.com/docs/neo4j-graphrag-python/current/)
  Use for: property-graph identity, parameterized Cypher, constraints, bounded traversals and source-backed graph retrieval.
- [CrewAI agents](https://docs.crewai.com/en/concepts/agents) and [tasks](https://docs.crewai.com/en/concepts/tasks)
  Use for: role/tool/task separation, direct Python configuration, sequential handoffs and bounded delegation. Verify memory/tracing configuration against the deployed release.
- [Pydantic AI dependencies](https://pydantic.dev/docs/ai/core-concepts/dependencies/), [structured output](https://pydantic.dev/docs/ai/examples/getting-started/pydantic-model/), and [testing](https://pydantic.dev/docs/ai/guides/testing/)
  Use for: trusted runtime dependencies, typed outputs, TestModel/FunctionModel and blocking accidental provider calls. Validation does not establish truth or authorization.
- [DuckDB Python DB API](https://duckdb.org/docs/current/clients/python/dbapi) and [security model](https://duckdb.org/docs/current/operations_manual/securing_duckdb/overview)
  Use for: embedded analytics, bound SQL values, file snapshots, external-access restrictions and the limits of read-only execution.
- [Microsoft GraphRAG](https://microsoft.github.io/graphrag/) and [query modes](https://microsoft.github.io/graphrag/query/overview/), [OpenSPG KAG](https://github.com/OpenSPG/KAG), and [LightRAG](https://github.com/HKUDS/LightRAG)
  Use for: comparing entity/community retrieval, schema/rule-aware reasoning and graph-plus-vector retrieval. Framework-specific mode names and advertised benchmark gains are not interchangeable guarantees.
- [Self-RAG paper](https://arxiv.org/abs/2310.11511) and [author explanation](https://selfrag.github.io/), plus [HyDE paper](https://arxiv.org/abs/2212.10496)
  Use for: trained reflection-token boundaries versus prompted critique, and hypothetical-document embeddings versus real evidence. Local fixtures illustrate controller/retrieval mechanics, not research reproduction.
- [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) and [prompt-injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
  Use for: search/fetch trust boundaries, egress and redirect controls, untrusted page content and tool permissions.
- [MongoDB modeling](https://www.mongodb.com/docs/manual/data-modeling/), [BSON](https://www.mongodb.com/docs/manual/reference/bson-types/), [compound indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/), and [aggregation](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)
  Use for: embedding versus references, typed document contracts, query-plan experiments and aggregation pipelines.
- [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/), [replication](https://www.mongodb.com/docs/manual/replication/), [sharding](https://www.mongodb.com/docs/manual/sharding/), and [change streams](https://www.mongodb.com/docs/manual/changestreams/)
  Use for: single-document atomicity versus distributed transactions, concerns and failover, shard-key tradeoffs and replay-safe CDC.

- [Pandas indexing](https://pandas.pydata.org/docs/user_guide/indexing.html), [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html), and [missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
  Use for: label alignment versus position, Pandas 3.x mutation semantics, nullable dtypes and explicit missing-value policies.
- [Pandas CSV input](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html), [merge contracts](https://pandas.pydata.org/docs/reference/api/pandas.merge.html), and [combining frames](https://pandas.pydata.org/docs/user_guide/merging.html)
  Use for: schema-controlled ingestion, key cardinality, null-key behavior and avoiding silent row multiplication.
- [Pandas grouping](https://pandas.pydata.org/docs/user_guide/groupby.html), [reshaping](https://pandas.pydata.org/docs/user_guide/reshaping.html), and [time series](https://pandas.pydata.org/docs/user_guide/timeseries.html)
  Use for: aggregation versus transformation, count/size, pivots, timezones, resampling and window boundaries.
- [Pandas scaling](https://pandas.pydata.org/docs/user_guide/scale.html) and [frame assertions](https://pandas.pydata.org/docs/reference/api/pandas.testing.assert_frame_equal.html)
  Use for: memory-aware analysis, chunked summaries, dtype-sensitive regression tests and limits of in-memory processing.
- [pypdf text extraction](https://pypdf.readthedocs.io/en/stable/user/extract-text.html)
  Use for: digitally generated versus scanned PDFs, OCR boundaries, layout ambiguity and extraction quality. A parser is not a sandbox.
- [Ubuntu terminal introduction](https://ubuntu.com/server/docs/tutorial/welcome-to-the-terminal/), [command reference](https://ubuntu.com/server/docs/reference/cli-cheatsheet/), [Bash redirection](https://www.gnu.org/s/bash/manual/html_node/Redirections.html), and [pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)
  Use for: navigation, file/process inspection, quoting, standard streams, exit status and safe command composition. Check local manuals for macOS/Linux flag differences.

## Wisdom (Communities)

- [GitHub Open Source](https://github.com/open-source)
  Contribute to actively maintained JavaScript, Python, infrastructure, or AI projects. Use for: asynchronous collaboration, review feedback, and globally visible evidence.
- [Stack Overflow](https://stackoverflow.com/)
  Search and participate in narrowly tagged technical discussions. Use for: testing explanations against real failure cases and learning precise technical communication.
- [CNCF Community](https://www.cncf.io/community/)
  Global cloud-native community with projects and events. Use for: production infrastructure perspectives, mentoring, and cross-border professional connections.

## Gaps

- Select target countries or regions before adding official immigration pathways, work-authorization constraints, and local hiring conventions.
- Collect representative job descriptions for the learner's desired seniority and target companies before the interview-intensive phase.
- AWS is the implementation platform for the cloud deep dive while cloud fundamentals and tradeoffs remain portable. Revisit platform emphasis after collecting job descriptions from the learner's target countries and companies.
## Knowledge additions — 2026-09-21

- [LangGraph subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs): nested execution and shared state boundaries.
- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/instrumentation/): manual spans and request trace context.
- [RAGAS metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/): distinguish retrieval and response evaluation.
- [Strawberry DataLoader](https://strawberry.rocks/docs/guides/dataloaders): batching and ordered resolver results.
- [FastAPI errors](https://fastapi.tiangolo.com/tutorial/handling-errors/): request/HTTP exception boundaries.
- [ColPali paper](https://arxiv.org/abs/2407.01449): visual document late-interaction retrieval.
- [Zeep settings](https://docs.python-zeep.org/en/master/settings.html): XML parser controls, not a complete network policy.

Further topic-specific primary sources are cited beside each recipe in the four guides listed in SYLLABUS-COVERAGE.md.
## Numerical data engineering — 2026-09-21

- [NumPy broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html): shape compatibility and memory costs of expanded results.
- [NumPy copies/views](https://numpy.org/doc/stable/user/basics.copies.html): ownership when slicing, reshaping and indexing.
- [NumPy vectorize](https://numpy.org/doc/stable/reference/generated/numpy.vectorize.html): convenience wrapper versus native vectorized operations.
- [Pandas windows](https://pandas.pydata.org/docs/user_guide/window.html): rolling, expanding and weighted-window semantics.
- [Pandas as-of joins](https://pandas.pydata.org/docs/reference/api/pandas.merge_asof.html): sorted temporal joins, tolerance and direction.
- [Polars optimization](https://docs.pola.rs/user-guide/lazy/optimizations/): inspect lazy pushdown and query plans.
- [Polars windows](https://docs.pola.rs/user-guide/expressions/window-functions/): grouped expressions mapped back to rows.
- [Polars streaming](https://docs.pola.rs/user-guide/concepts/streaming/): batch execution and its memory boundaries.
## AI Engineer practice sources — 2026-09-21

- [Agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): distinguish claimed completion from actual outcomes and use multiple grading signals.
- [pytest monkeypatch](https://docs.pytest.org/en/stable/how-to/monkeypatch.html): isolate external dependencies without mocking away the policy under test.
- [LoRA concepts](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora): low-rank adaptation and its training tradeoffs.
## RFQ interview MCQ references — 2026-09-22

- [Python data structures](https://docs.python.org/3/tutorial/datastructures.html): dictionary/list/set choices and record transformations.
- [PostgreSQL window functions](https://www.postgresql.org/docs/current/tutorial-window.html): partitioning, ordering, ranking and frames.
- [Pandas merge](https://pandas.pydata.org/docs/reference/api/pandas.merge.html): cardinality validation and null-key behavior.
- [CME basis-point value](https://www.cmegroup.com/education/courses/introduction-to-sofr/understanding-the-importance-of-basis-point-value): distinguish rate moves from sensitivity measures.
