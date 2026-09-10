# TypeScript content review

All 45 lessons (0126–0170) received a content-review pass: concrete term definitions, plain explanations, senior reasoning checkpoints, and explicit lab scope. This is not certification of every integration or learner mastery.

Verification: run `node scripts/check-typescript-lessons.mjs` for 26 generated snippets with compiler checks and runtime assertions/probes. The remaining 19 are intentional counterexamples, configuration/tooling recipes, integration sketches, or project assignments; they were reviewed as content, not executed end-to-end. No React/Node packages were installed for this review.

Corrected empty-input generic unsoundness, event-name remapping, declaration/implementation confusion, a declare-only runtime call, missing HTTP status checks, and mouse-only table selection. Integration exercises explicitly identify authorization, cancellation, packaging, and host prerequisites.

Use the labs' stated prerequisites. The test runner uses installed TypeScript 5.3.3; newer APIs such as NoInfer require their documented compiler version. Shared snippets now have distinct lesson-specific exercises. They are not complete implementations of every subtopic in the title.

## 0126 · TypeScript setup, compiler versions, tsconfig, strict mode, and reproducible checks

[Lesson](lessons/0126-typescript-setup-compiler-versions-tsconfig-strict-mode-and-reproducible.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: The compiler checks a project selected by its configuration, not whatever files happen to be open in the editor.

Senior checkpoint: Pin the compiler and lockfile; compare CLI and editor versions before interpreting disagreement. A green checker is not a runtime test.

Practice: Configuration exercise: create src/index.ts, install a pinned local TypeScript, and record version, showConfig, and noEmit results. JSON and shell lines belong in separate files/commands.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0127 · Compiler pipeline, scanner, parser, binder, checker, transformer, emitter, and language service

[Lesson](lessons/0127-compiler-pipeline-scanner-parser-binder-checker-transformer-emitter-and-.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Parsing builds syntax; binding connects declarations to names; checking reasons about their types; emission produces output.

Senior checkpoint: transpileModule is a single-file transform, not a full semantic check or declaration build. Compare its output with a Program diagnostic for a wrong assignment.

Practice: Tooling sketch: requires the typescript package and a Node project. Record AST, semantic diagnostic, JS, and declaration output separately; declaration: true in transpileModule does not supply a declaration build.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0128 · TypeScript design goals, type erasure, structural typing, gradual adoption, and soundness tradeoffs

[Lesson](lessons/0128-typescript-design-goals-type-erasure-structural-typing-gradual-adoption-.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: TypeScript deliberately accepts some programs whose runtime behavior can violate their annotations.

Senior checkpoint: An assertion on parsed JSON does not convert a number into a string. Explain what runtime validation would prove and what it would still not authorize.

Practice: Intentional counterexample: first(users) compiles only without noUncheckedIndexedAccess. Enable that flag and explain its diagnostic; run the asserted JSON example and inspect the actual values.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0129 · Type annotations, inference, contextual typing, best common types, and widening

[Lesson](lessons/0129-type-annotations-inference-contextual-typing-best-common-types-and-widen.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Inference fills in missing types from values and context; widening keeps mutable values useful beyond their initial literal.

Senior checkpoint: Use annotations to stabilize public contracts, not every local variable. satisfies checks compatibility and can influence inference through context; it is not a runtime assertion.

Practice: Type-only checks: the Equal/Expect aliases must compile. Change a mutable literal to as const and predict the diagnostic before inspecting inferred types.

Verification scope: Included in the compiler/runtime check command.

## 0130 · any, unknown, never, void, undefined, null, and top or bottom types

[Lesson](lessons/0130-any-unknown-never-void-undefined-null-and-top-or-bottom-types.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: unknown accepts external values but requires evidence before use; any bypasses that protection. never represents no possible value. void tells a caller to ignore a return value, while null and undefined are actual runtime values. Type annotations do not validate input.

Senior checkpoint: Why can a number-returning callback satisfy () => void, and why does changing an input from any to unknown still require runtime validation?

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0131 · Assignability, structural compatibility, freshness, excess property checks, and open object types

[Lesson](lessons/0131-assignability-structural-compatibility-freshness-excess-property-checks-.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Structural compatibility asks whether the source supplies the target's required members with compatible types, not whether both objects have identical keys. Fresh object literals receive additional excess-property checks. Assigning a stored object or using satisfies does not strip fields or validate runtime input. Explicit projection controls response fields; a runtime parser enforces an incoming unknown-field policy.

Senior checkpoint: Why does storing a literal change excess-property checking without changing its runtime fields? Design separate policies for public response projection and incoming write validation; explain when rejecting unknown keys conflicts with forward compatibility.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0132 · Optional properties, exactOptionalPropertyTypes, indexed access, noUncheckedIndexedAccess, and safe absence

[Lesson](lessons/0132-optional-properties-exactoptionalpropertytypes-indexed-access-nounchecke.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: An omitted property and a present property containing undefined are different object shapes. exactOptionalPropertyTypes preserves that distinction when assigning optional fields. noUncheckedIndexedAccess makes uncertain dictionary reads include undefined. These flags add static checks; they do not validate incoming JSON.

Senior checkpoint: A PATCH endpoint treats an omitted field as leave unchanged. How would you represent set, clear, and leave unchanged across JSON, runtime validation, and TypeScript without relying on truthiness?

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0133 · Union types, intersection types, common members, impossible intersections, and composition

[Lesson](lessons/0133-union-types-intersection-types-common-members-impossible-intersections-a.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A union accepts values satisfying either alternative; only operations safe for every remaining alternative are available before narrowing. An intersection requires both contracts at once; it does not merge objects or overwrite conflicting properties. A string-and-number property becomes never. Ordinary structural unions can overlap; distinct literal tags make alternatives distinguishable.

Senior checkpoint: A teammate uses an intersection to override an API field from string to number. Explain why that fails, how an explicit replacement type differs, and why neither approach migrates or validates existing runtime data.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0134 · Discriminated unions, state machines, exhaustiveness, never, and illegal states

[Lesson](lessons/0134-discriminated-unions-state-machines-exhaustiveness-never-and-illegal-sta.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A literal status ties each variant to its required fields. Switching on status narrows the value; passing the remainder to a never parameter catches a forgotten variant. This protects modeled shapes in checked code, not temporal rules or untrusted input. The reducer separately enforces latest-start-wins using a unique request ID; stale completions leave state unchanged.

Senior checkpoint: Can two individually well-typed states form an illegal transition? Explain stale successes and failures, unique attempt IDs, runtime validation, cancellation versus ignoring results, and how to introduce a new state without silently defaulting old consumers.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0135 · Control-flow analysis, narrowing, typeof, instanceof, in, equality, and truthiness

[Lesson](lessons/0135-control-flow-analysis-narrowing-typeof-instanceof-in-equality-and-truthi.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Narrowing changes what the checker knows at a particular program point, not the variable's declared contract. A returning null branch removes null from subsequent paths; assignments establish new flow facts. typeof distinguishes primitive categories but reports object for null. in proves property presence including inherited properties, not the property's value type. instanceof checks a runtime constructor relationship, not a deserialized JSON shape.

Senior checkpoint: Why can a string-or-number variable become number after assignment without changing its declared type? Explain where narrowing stops being reliable evidence at an external boundary, across mutation, or when instanceof is applied to deserialized objects.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0136 · User-defined type guards, assertion functions, predicates, validation, and narrowing safety

[Lesson](lessons/0136-user-defined-type-guards-assertion-functions-predicates-validation-and-n.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A predicate returns a boolean and promises a type relationship; an assertion function throws on failure and narrows after a normal return. The checker trusts these signatures without proving their implementations. A parser can validate and construct a fresh projected value. The lab accepts extra fields structurally, then strips them during parsing; shape validity does not establish business validity or authorization.

Senior checkpoint: What must be true on both the true and false branches of a type predicate? Why is a small-number check unsafe as a predicate for all numbers? Explain mutation after validation, parser ownership, unknown-field policy, and why authorization belongs outside a shape guard.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0137 · Function types, call signatures, construct signatures, parameters, callbacks, and overloads

[Lesson](lessons/0137-function-types-call-signatures-construct-signatures-parameters-callbacks.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Call signatures describe invocation; construct signatures describe new. Overloads advertise input/output relationships, but callers cannot use the broader implementation signature directly. Optional parameters allow omission; a callback may ignore a supplied index without making that index optional. All signatures are erased, so runtime tests must verify the implementation's promises.

Senior checkpoint: A caller has a string-or-array value that neither overload accepts. Would you narrow at the caller, expose a union overload, or redesign the API? Explain return precision, compatibility, and why the implementation body still needs runtime tests.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0138 · Object types, interfaces, type aliases, declaration merging, index signatures, and property keys

[Lesson](lessons/0138-object-types-interfaces-type-aliases-declaration-merging-index-signature.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Interfaces can merge compatible declarations; aliases can name object shapes and other type expressions such as unions. Neither creates runtime values or exact-key validation. A finite Record requires its listed keys, while an index signature describes values at a key category. Object numeric access uses string keys; symbols remain distinct. Map preserves key identity and represents missing entries explicitly.

Senior checkpoint: Design a registry with known built-ins and runtime third-party registrations. Choose interface or alias for the contract and Record, dictionary, or Map for storage; discuss declaration merging conflicts, missing keys, serialization, prototype names, and why accepting a plugin does not make its code safe.

Practice: Standalone lab with compiler-negative and runtime assertions. Run node scripts/check-typescript-lessons.mjs from the workspace. Predict the result before reading the checks; reconstruct the key distinction tomorrow.

Verification scope: Included in the compiler/runtime check command.

## 0139 · Readonly, const assertions, readonly arrays, tuples, satisfies, and literal preservation

[Lesson](lessons/0139-readonly-const-assertions-readonly-arrays-tuples-satisfies-and-literal-p.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: readonly restricts writes through a typed reference. as const preserves literal information; neither freezes the JavaScript object.

Senior checkpoint: A mutable alias can still change a value exposed through a readonly view. Object.freeze is shallow too. Decide whether ownership, copying, or deeper freezing is actually required.

Practice: Standalone type example. Add an expected-error write, run move on a tuple, and mutate a nested object through an existing mutable alias. Compare annotation, assertion, as const, and satisfies separately.

Verification scope: Included in the compiler/runtime check command.

## 0140 · Generics, type parameters, constraints, defaults, relationships, and reusable contracts

[Lesson](lessons/0140-generics-type-parameters-constraints-defaults-relationships-and-reusable.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A useful generic connects types at more than one position, such as keeping each input item's extra fields in the returned Map.

Senior checkpoint: Constrain only capabilities the body needs. A map indexed by id also needs a duplicate policy: this example keeps the last item, not a magically unique record.

Practice: Standalone example. Test duplicate IDs and preserved extra fields. choose now requires a nonempty tuple; prove that an empty input is rejected instead of hiding absence with !.

Verification scope: Included in the compiler/runtime check command.

## 0141 · Generic inference, inference sites, contextual inference, const type parameters, and inference failures

[Lesson](lessons/0141-generic-inference-inference-sites-contextual-inference-const-type-parame.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Inference gathers candidates from arguments and context; a constraint limits choices but cannot invent missing information.

Senior checkpoint: const type parameters preserve eligible inline literals, not information already widened in a variable. NoInfer controls candidate sources; it is available from TypeScript 5.4, not this workspace's 5.3 compiler.

Practice: Shared generic mechanism, distinct exercise: compare inline literals, a string[] variable, and an explicit type argument. Redesign createStore so its item type comes from values, or supply both type arguments intentionally.

Verification scope: Included in the compiler/runtime check command.

## 0142 · keyof, typeof in type positions, indexed access types, lookup relationships, and value-derived types

[Lesson](lessons/0142-keyof-typeof-in-type-positions-indexed-access-types-lookup-relationships.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: keyof names allowed keys, a type-position typeof captures a value's static type, and T[K] relates a selected key to its result.

Senior checkpoint: A generic key parameter preserves correlation that returning T[keyof T] would lose. Numeric and symbol keys need explicit treatment in string-only APIs.

Practice: Standalone example. Call get with id and archived, assert their different result types, and reject a misspelled key. No runtime reflection is created by these type expressions.

Verification scope: Included in the compiler/runtime check command.

## 0143 · Mapped types, mapping modifiers, key remapping, property transforms, and homomorphism

[Lesson](lessons/0143-mapped-types-mapping-modifiers-key-remapping-property-transforms-and-hom.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

Model: A mapped type transforms a contract one key at a time; it does not loop over or modify runtime objects.

Senior checkpoint: The event-name mapping must concatenate on with Capitalize<K>, not intersect two incompatible strings. Homomorphic mappings can preserve modifiers; explicit modifiers change them.

Practice: Standalone type example. Construct a ProjectEvents value with onName and onArchived handlers, reject onMissing, and prove MutablePatch removes readonly without changing the original Project contract.

Verification scope: Included in the compiler/runtime check command.

## 0144 · Conditional types, constraints, infer, distributivity, recursion, and deferred evaluation

[Lesson](lessons/0144-conditional-types-constraints-infer-distributivity-recursion-and-deferre.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

Model: A conditional type chooses a branch using assignability. A naked type parameter on the checked side distributes the operation over a union.

Senior checkpoint: Wrapping both sides in tuples asks about the union as a whole. never and any need dedicated examples; recursive types need a stopping condition and a checker-cost budget.

Practice: Type-only example. Assert ElementOf<string[] | number[]> and NonDistributive<string | number>, then compare distributive and wrapped tests on never. Keep recursion shallow before considering deep utilities.

Verification scope: Included in the compiler/runtime check command.

## 0145 · Template literal types, string unions, key paths, event names, and combinatorial growth

[Lesson](lessons/0145-template-literal-types-string-unions-key-paths-event-names-and-combinato.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Template literal types construct sets of permitted strings from smaller sets.

Senior checkpoint: Two unions of sizes m and n can produce up to m times n names. A deeply recursive key-path type can cost more than the mistakes it prevents; generated declarations or shallow paths may be clearer.

Practice: Shared type mechanism, distinct exercise: construct valid Changed names, reject a typo, and record checker timings when expanding the unions. A type does not parse arbitrary runtime strings.

Verification scope: Included in the compiler/runtime check command.

## 0146 · Built-in utility types, Partial, Required, Pick, Omit, Record, ReturnType, Parameters, and Awaited

[Lesson](lessons/0146-built-in-utility-types-partial-required-pick-omit-record-returntype-para.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/utility-types.html)

Model: Utility types are mechanical transformations; domain meaning must still be designed.

Senior checkpoint: Partial is shallow and is not a complete PATCH contract. Omit does not remove runtime secrets. ReturnType on an overloaded function uses its last signature, not overload resolution for a particular argument.

Practice: Type-only example. Derive Partial and Pick, then compare a nested partial with an omitted field versus explicit clear. Reuse the tested PATCH lab from 0132 for runtime semantics.

Verification scope: Included in the compiler/runtime check command.

## 0147 · Variance, covariance, contravariance, invariance, bivariance, and strictFunctionTypes

[Lesson](lessons/0147-variance-covariance-contravariance-invariance-bivariance-and-strictfunct.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A producer of dogs can supply animals; a consumer of all animals can safely consume dogs. Reversing either relationship is unsafe.

Senior checkpoint: strictFunctionTypes treats function-property parameters more strictly than method parameters. Mutable arrays retain unsound assignments for compatibility; readonly views prevent writes through that view, not all aliases.

Practice: Standalone example. Add an expected-error dog-only function assigned to an animal consumer. Contrast method syntax and show how pushing through a mutable animal alias can contaminate a dog array.

Verification scope: Included in the compiler/runtime check command.

## 0148 · Classes, public, protected, private, abstract classes, parameter properties, and override safety

[Lesson](lessons/0148-classes-public-protected-private-abstract-classes-parameter-properties-a.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A class has runtime construction and behavior as well as a static instance contract. An interface describes a contract without constructing anything.

Senior checkpoint: TypeScript private is a checker restriction; JavaScript # fields enforce a runtime access boundary. noImplicitOverride catches missing override markers, not behavioral substitutability.

Practice: Class/brand sketch. Implement a concrete Repository and test missing/found results. Add an override mismatch under noImplicitOverride; compare composition before introducing a hierarchy.

Verification scope: Included in the compiler/runtime check command.

## 0149 · Nominal techniques, private members, unique symbols, branded types, opaque IDs, and units

[Lesson](lessons/0149-nominal-techniques-private-members-unique-symbols-branded-types-opaque-i.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A brand separates structurally identical values, such as two different kinds of string IDs, within checked code.

Senior checkpoint: The brand is not runtime evidence. The sample checks only a usr_ prefix; it does not establish format completeness, existence, ownership, or authorization. Serialize brands as their underlying value and revalidate on reentry.

Practice: Standalone parser example. Reject nonstrings and wrong prefixes; add a negative UserId-to-ProjectId assignment. State the actual ID grammar before strengthening the parser.

Verification scope: Included in the compiler/runtime check command.

## 0150 · Decorators, standard decorator semantics, contexts, metadata boundaries, and dependency injection

[Lesson](lessons/0150-decorators-standard-decorator-semantics-contexts-metadata-boundaries-and.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)

Model: A method decorator can replace a method while preserving its receiver, parameters, and return type.

Senior checkpoint: The sample finally runs when invocation returns, not when an async result settles. Standard and legacy decorator calling conventions differ; do not mix their configuration or assume legacy metadata behavior.

Practice: Requires TypeScript 5+ standard decorator mode, without experimentalDecorators. Instantiate ProjectService, test receiver and thrown-error preservation, then compare Promise-returning methods before calling the log a duration measurement.

Verification scope: Included in the compiler/runtime check command.

## 0151 · Enums, const enums, literal unions, runtime objects, reverse mappings, and alternatives

[Lesson](lessons/0151-enums-const-enums-literal-unions-runtime-objects-reverse-mappings-and-al.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: An enum can create a runtime object; a literal union is erased. An as-const object supplies runtime values from which a union can be derived.

Senior checkpoint: Numeric enums add reverse mappings; string enums do not. Exported const enums can embed a different version's values in consumers. Stable wire values need a compatibility policy independent of type syntax.

Practice: Standalone parser. Test every allowed status plus null, inherited property names, and a typo. The key-membership parser works here because each key equals its value; do not generalize it to arbitrary lookup objects.

Verification scope: Included in the compiler/runtime check command.

## 0152 · ECMAScript modules, type-only imports, verbatimModuleSyntax, isolatedModules, and emit correctness

[Lesson](lessons/0152-ecmascript-modules-type-only-imports-verbatimmodulesyntax-isolatedmodule.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

Model: An import can be a type-checking edge, a runtime loading edge, or both. Explicit type imports disappear from emitted JavaScript.

Senior checkpoint: Erasing a type-only import also removes any runtime initialization you mistakenly expected from it. verbatimModuleSyntax exposes mismatches instead of silently rewriting incompatible module syntax.

Practice: Multi-file exercise, not a standalone script: create project.ts with a real parser, package.json and tsconfig, then inspect emitted imports and run them with the chosen host.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0153 · Module resolution, NodeNext, bundler mode, package exports, imports, paths, and traceResolution

[Lesson](lessons/0153-module-resolution-nodenext-bundler-mode-package-exports-imports-paths-an.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

Model: Resolution models how a specific host finds a specifier. The editor finding a file does not guarantee the deployed host can load it.

Senior checkpoint: paths does not rewrite emitted specifiers. NodeNext and bundler mode model different host behavior; package conditions, extensions, and package type must agree with the actual entry point.

Practice: Multi-file exercise: record traceResolution and run emitted JS without source aliases. Introduce a missing export condition or extension and diagnose the first mismatched edge.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0154 · Declaration files, ambient declarations, global scope, module augmentation, and lib selection

[Lesson](lessons/0154-declaration-files-ambient-declarations-global-scope-module-augmentation-.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

Model: A declaration file promises which values already exist at runtime; it supplies no implementation.

Senior checkpoint: An accidental script-global declaration can affect unrelated files. Module augmentation changes a known module's contract; it does not install a runtime feature. Choosing DOM libs cannot make browser APIs exist in Node.

Practice: Multi-file declaration sketch. Supply the real implementation, test a consumer, then intentionally mismatch its result and show how a runtime test catches what declarations conceal.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0155 · Typed library authoring, declaration emit, package exports, typesVersions, API surface, and compatibility

[Lesson](lessons/0155-typed-library-authoring-declaration-emit-package-exports-typesversions-a.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

Model: A published library ships a runtime API and a declaration API that consumers must resolve to matching versions.

Senior checkpoint: A workspace source import can hide missing packaged files. exports conditions and declarations must agree; typesVersions is not a universal override when exports controls resolution.

Practice: Packaging sketch. npm pack --dry-run lists files but does not create the tarball. Run npm pack, install that actual named archive in a clean consumer, and test public imports and runtime behavior.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0156 · JavaScript interop, allowJs, checkJs, JSDoc types, declaration generation, and gradual migration

[Lesson](lessons/0156-javascript-interop-allowjs-checkjs-jsdoc-types-declaration-generation-an.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Checked JavaScript allows types to be added incrementally through JSDoc without first changing runtime syntax.

Senior checkpoint: allowJs admits JavaScript; checkJs or ts-check reports its type issues. A JSDoc cast is still a trusted claim, so runtime parser tests remain essential during migration.

Practice: JavaScript module, not a .ts lab. Use allowJs/checkJs with noEmit, test valid and invalid JSON, then rename one dependency leaf and compare emitted behavior before broad migration.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0157 · Runtime validation, unknown input, parsing, schemas, decoders, and trusted domain types

[Lesson](lessons/0157-runtime-validation-unknown-input-parsing-schemas-decoders-and-trusted-do.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A parser converts uncertain input into a deliberately validated representation or a useful failure result.

Senior checkpoint: The example strips extras and trims names, but a string ownerId is only shape-valid. Schema inference helps keep types aligned; it does not choose business rules, error privacy, or authorization.

Practice: Runnable parser checks cover good input, null, arrays, missing fields, blank names, and a wrong ownerId type. Extend with size limits and your domain's ID rules before service use.

Verification scope: Included in the compiler/runtime check command.

## 0158 · HTTP, environment, database, queue, file, and AI-output type boundaries

[Lesson](lessons/0158-http-environment-database-queue-file-and-ai-output-type-boundaries.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Each external boundary brings uncertainty even when both applications are written in TypeScript.

Senior checkpoint: Do not trust an ownerId merely because it passes string validation. Derive identity from authentication or authorize delegation. Database rows, queue versions, environment strings, and AI output require different policies.

Practice: Parser mechanism shared with 0157; integration exercise: add malformed JSON handling, unauthorized ownership, an old queue version, invalid environment data, and invalid model output. Document the rejection owner at every boundary.

Verification scope: Included in the compiler/runtime check command.

## 0159 · Async typing, Promise, Awaited, async iterables, generators, cancellation, and error channels

[Lesson](lessons/0159-async-typing-promise-awaited-async-iterables-generators-cancellation-and.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Async types describe eventual values and iterator protocol slots, not timeouts, concurrency limits, or cancellation guarantees.

Senior checkpoint: The generator checks HTTP status and cancellation, but still needs a trusted URL policy, redirect controls, repeated-cursor detection, page/item limits, and a deadline. Same-origin cursor checks alone are not an SSRF defense.

Practice: Network integration sketch: inject or stub fetch and test non-2xx responses, malformed pages, cancellation between yielded items, consumer break, and cursor loops. Bound total work before production use.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0160 · React with TypeScript, component props, events, refs, generics, reducers, and polymorphism

[Lesson](lessons/0160-react-with-typescript-component-props-events-refs-generics-reducers-and-.html) · [Primary reference](https://react.dev/learn/typescript)

Model: Generic props connect each row to its selection callback; they should not force callers to understand advanced types just to render a table.

Senior checkpoint: Row[keyof Row] is a union of column values, not a key-specific value. Use a mapped union or row-based renderer when correlation matters. A clickable row alone is not keyboard-accessible; this example uses a native button.

Practice: TSX integration sketch requires pinned React and matching types. Test keyboard selection, empty data, stable keys, and renderer types. Add refs and reducer exercises separately; they are not implemented by this table.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0161 · Node.js with TypeScript, ESM, configuration, processes, streams, errors, and service boundaries

[Lesson](lessons/0161-node-js-with-typescript-esm-configuration-processes-streams-errors-and-s.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Node executes JavaScript under a concrete module and process model; successful type checking does not guarantee loading or shutdown behavior.

Senior checkpoint: Aborting a controller is a signal, not a shutdown implementation. Stop admission, drain within a deadline, close owned resources, and preserve exit errors. Reject malformed configuration before binding a port.

Practice: Service integration sketch: serve is an adapter the learner must implement. Requires Node types and matching ESM configuration. Test invalid configuration and SIGTERM with active work; record deadline and resource closure.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0162 · Type testing, ts-expect-error, assignability assertions, declaration tests, runtime tests, and contract evidence

[Lesson](lessons/0162-type-testing-ts-expect-error-assignability-assertions-declaration-tests-.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Type tests check what programs are accepted; runtime tests check what executed code actually does.

Senior checkpoint: An unused ts-expect-error detects a lost rejection, but it does not identify which diagnostic occurred. Narrow negative examples so an unrelated error cannot masquerade as the intended protection.

Practice: Runnable type-test lab: first has a real implementation, the invalid call is in an uncalled checked function, and a runtime assertion verifies the first element. Compile emitted declarations from a separate consumer next.

Verification scope: Included in the compiler/runtime check command.

## 0163 · tsconfig strictness, target, lib, module, moduleResolution, include, exclude, and build ownership

[Lesson](lessons/0163-tsconfig-strictness-target-lib-module-moduleresolution-include-exclude-a.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: target selects syntax transforms, lib describes assumed APIs, module chooses module output behavior, and moduleResolution models lookup.

Senior checkpoint: lib declarations are not polyfills. exclude limits initial discovery, not all imports; imported files may still enter the program. Give each environment and output directory a clear build owner.

Practice: Configuration fragments, not TypeScript source. Supply actual per-environment module settings and source includes; inspect showConfig and explainFiles and run output on the oldest supported host.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0164 · Project references, composite projects, incremental builds, declaration boundaries, monorepos, and build mode

[Lesson](lessons/0164-project-references-composite-projects-incremental-builds-declaration-bou.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/project-references.html)

Model: Project references create an explicit build graph with declaration boundaries and reusable build state.

Senior checkpoint: A root reference list alone does not express server-to-domain dependencies. Each consuming project needs the appropriate references. Composite builds add artifact and invalidation costs; keep a single project when it is sufficient.

Practice: Multi-project sketch: create every referenced directory and config, add consumer references, run tsc -b twice, change a domain export, and inspect which projects rebuild.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0165 · Compiler API, AST traversal, symbols, types, transforms, language service, and tooling

[Lesson](lessons/0165-compiler-api-ast-traversal-symbols-types-transforms-language-service-and.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: An AST node is a syntax occurrence; a symbol identifies declarations; a type is the checker's semantic view at a location.

Senior checkpoint: The sample is a syntax-policy scan of exported function declarations, not a complete public API analyzer. It misses exported arrows, re-exports, and some export forms. Do not call missing annotations correctness bugs automatically.

Practice: Tooling sketch requires typescript and input files. Test direct functions, arrows, aliases, and re-exports; use the module's exports and checker if the requirement is the complete public API.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0166 · Type-checker performance, extendedDiagnostics, generateTrace, instantiation depth, project size, and editor latency

[Lesson](lessons/0166-type-checker-performance-extendeddiagnostics-generatetrace-instantiation.html) · [Primary reference](https://github.com/microsoft/TypeScript/wiki/Performance)

Model: Compiler latency comes from discovering files, parsing, checking relationships, and maintaining project state; measure the dominant cost first.

Senior checkpoint: Compare clean and warm builds separately, using the same version and hardware. skipLibCheck may hide declaration conflicts; it is a trade-off, not a diagnosis. Trace files may reveal local paths and source details.

Practice: Shell diagnostic recipe for an existing project. Record timings, files, instantiations, memory, and editor wait before and after one change; retain traces privately unless reviewed for disclosure.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0167 · TypeScript upgrades, release notes, deprecations, strictness migration, dependency types, and compatibility

[Lesson](lessons/0167-typescript-upgrades-release-notes-deprecations-strictness-migration-depe.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: A compiler upgrade can change inference, diagnostics, declaration compatibility, resolution, and emitted code.

Senior checkpoint: Pin versions, read the intervening release notes, classify failures, and test real consumers before rollout. A mass suppression hides migration work instead of resolving it.

Practice: Review checklist, not test evidence. Replace every placeholder claim with a command result or artifact, compare public declarations and emitted JS, and document rollback and supported compiler versions.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0168 · Safe AI-assisted TypeScript, generated code, type constraints, validation, tests, review, and provenance

[Lesson](lessons/0168-safe-ai-assisted-typescript-generated-code-type-constraints-validation-t.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Generated code is an untrusted contribution whose contracts, dependencies, and runtime behavior need the same scrutiny as other code.

Senior checkpoint: A type-correct implementation may still authorize the wrong tenant, leak secrets, or perform unbounded work. Ask what invariant each test proves and whether a malicious input could bypass it.

Practice: Review exercise, not executable certification. Choose one generated change, test malformed input, cross-tenant access, timeout, and large payloads, and record provenance rather than marking checklist booleans true.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0169 · TypeScript architecture, domain modeling, ports, adapters, dependency direction, and change cost

[Lesson](lessons/0169-typescript-architecture-domain-modeling-ports-adapters-dependency-direct.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: Keep business decisions separate from transport and vendor details; inject the capabilities the decision actually needs.

Senior checkpoint: A port is justified by a meaningful boundary, not by a rule to wrap every function. The sample requires an idempotencyKey parser, not the ownerId parser from the earlier lab; telemetry must not replace the business outcome by throwing in finally.

Practice: Architecture sketch: implement matching parsing and adapters, test duplicate commands, cancellation, repository failure, and telemetry failure. Compare change cost against a direct implementation before adding abstractions.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.

## 0170 · TypeScript production architecture capstone, full-stack contracts, reliability, security, observability, and evolution

[Lesson](lessons/0170-typescript-production-architecture-capstone-full-stack-contracts-reliabi.html) · [Primary reference](https://www.typescriptlang.org/docs/handbook/intro.html)

Model: The capstone joins type contracts with runtime validation, ownership, persistence, and operational behavior in one deployable slice.

Senior checkpoint: Sharing a DTO does not solve wire evolution, authorization, idempotency, or schema rollout. Choose one invariant at each boundary and demonstrate both its failure case and recovery behavior.

Practice: Project assignment, not a finished application. Deliver a versioned request flow, authenticated ownership, durable idempotency, bounded model calls, validated outputs, trace evidence, type/runtime tests, and a mixed-version rollback rehearsal.

Verification scope: Content reviewed; requires the described project or exercise-specific verification.
