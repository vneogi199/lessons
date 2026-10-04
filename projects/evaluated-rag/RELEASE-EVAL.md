# Keep release evidence separate from a fluent answer

Prepare reviewed cases with the [source-bound dataset builder](DATASET-BUILDING.md).

`release_eval.py` extends the existing evaluator's per-case contract. Preserve `case`, `slice`, `passed`, `error` and `latency_ms` from `run_case`. Add two independently collected judge scores and `cost_usd`. A missing score remains missing. Feed the resulting rows to `release_report`, save its JSON as the CI artifact, then exit unsuccessfully when `release` is false. `persist` stores immutable run IDs in a local SQLite history. `compare` reports paired changes, failures, cost completeness and a seeded bootstrap interval.

The existing deterministic evaluator checks citation provenance and permission fixtures. Those checks do not prove semantic support. Judges should score whether each answer claim follows from the permitted evidence, using the same frozen rubric and blinded model identity. Score 1 for supported, 0.5 for partly supported and 0 for unsupported. An answer that refuses an answerable question can be safe but should fail the task-quality rubric. Use the correct rubric for each case type.

Before relying on a judge, collect human-reviewed calibration answers outside the release holdout. `calibrate` requires at least 20 labels and mean absolute error at most 0.15 by default. These are illustrative gates, not validated industry thresholds. Inspect disagreement by failure type and language too; one mean can hide a weak slice. Freeze thresholds before viewing a candidate's results.

Version fields are required for dataset, model, prompt, index, guardrail, judge and rubric. Store immutable revisions or content hashes, not `latest`. Missing required security/freshness/deletion slices block release. All supplied cases must pass the starter gate. Change this policy only through a reviewed requirement, never to hide a regression.

`run_release` connects the existing deterministic cases to two injected asynchronous judge adapters. It supplies question, result, expected status and rubric version, with a timeout for each call. Failed deterministic cases never reach a judge, since their output may violate access or provenance rules. No provider is configured by default. A provider adapter must use bounded requests, schema validation and approved evidence. Timeouts, refusals and malformed scores remain missing evidence and block release. The supplied runner leaves cost unknown; enrich costs only from complete billing evidence.

CI integration in an approved environment: execute the existing deterministic suite, collect approved judge outputs, assemble rows, call `release_report`, persist the immutable result, publish redacted JSON, and enforce its release flag. Do not mark a report as calibrated just by setting `accepted=true`; retain reviewed labels, judge outputs and their hashes with the artifact. No active GitHub workflow or model call is installed by this lesson.

Costs must include every billed retry. Unknown usage is `None`, not zero. Paired cost comparisons are labeled incomplete when either run lacks costs. Bootstrap intervals resample cases; questions from one document family are correlated and need family-level resampling for defensible inference. Tiny synthetic fixtures are arithmetic checks, not production acceptance evidence.

Tests are authored but unexecuted. After execution approval, run `python3 -m unittest test_release_eval -v` from this directory. Expected checks: missing/disagreeing judges and deterministic failures block release; duplicate run IDs fail; paired regressions and incomplete costs remain visible.

Interview: can an improved mean judge score override a new cross-tenant leak? No. A deterministic security failure blocks release. Ask your teacher to review the proposed gate and its calibration evidence.
