# Generate candidate questions from an approved source fact

`dataset_builder.py` creates five synthetic case variants from a bounded source span and a reviewer-supplied question. It uses templates, not an LLM. For “Returns: 30 days.”, a reviewer can ask “What is the return period?” and label the exact span “30 days”. The builder preserves document/version, content hash, offsets, quote, tenant and source-fact hash.

Assign a document-family ID before generation. Related versions and counterfactual variants inherit one deterministic train/development/holdout assignment. Do not split near-duplicate questions randomly. Small collections may have an empty split; add independently sourced families instead of moving an inconvenient held-out case into training. Freeze split-version policy before tuning.

The answerable candidate quotes the fact. The unanswerable candidate asks about a holiday exception. The conflict candidate introduces an explicitly synthetic competing assertion. The stale candidate adds a synthetic newer version. The forbidden candidate asks from a different tenant and requires abstention. Counterfactual records are benchmark fixtures only; never ingest them as real policy documents.

These templates propose cases; they do not prove answerability. A document might actually describe holiday exceptions elsewhere. A conflict may have a clear authoritative winner. A reviewer must check full source context, current-version rules, permissions and the intended outcome. For stale cases, the dataset adapter must apply the new version as current; do not simply retrieve both and expect the model to guess authority.

`reviewed_export` rejects incomplete reviews and any modified candidate whose hash no longer matches. It emits a versioned artifact and content hash. The review dictionary is an authoring interface, not an authentication system: protect it through code review or an authenticated reviewer service. Do not let a generation model self-approve. The synthetic reviewer in tests is only a fixture.

When connecting to the existing evaluator, convert approved cases to its `documents`, `operations`, `expected_status`, version and forbidden-document fields. Keep protected source text out of user/model/judge payloads. The benchmark's restricted label store may contain gold evidence that the application is not authorized to retrieve. This separation is part of the evaluation design.

Acceptance: all family variants share a split; five slices exist; references come from recorded spans or explicitly labeled counterfactuals; missing review blocks export; mutation invalidates the candidate hash. Tests are supplied and unexecuted. After approval, run `python3 -m unittest test_dataset_builder -v` in this directory.

Interview: does 1,000 generated questions mean 1,000 independent examples? No. Shared source families and repeated templates create correlation. Report family counts, review coverage and slice counts. Ask your teacher to inspect an unanswerable case for accidental evidence in another page.
