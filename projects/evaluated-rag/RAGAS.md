# Compare five distinct Ragas metrics

This recipe targets `ragas==0.2.15`, matching the linked versioned documentation. It is a compatibility target, not a recommendation to replace an organization's supported version. Nothing is installed or called. Runtime compatibility remains unverified.

`configured_metrics` requires explicit `BaseRagasLLM` and `BaseRagasEmbeddings` adapters. If you use LangChain integrations in an approved environment, wrap the already-configured judge with `ragas.llms.LangchainLLMWrapper` and the already-configured embedding client with `ragas.embeddings.LangchainEmbeddingsWrapper`. Record exact integration package versions, provider model revisions, prompts, embedding revision and retry settings. Do not let an adapter silently choose a default provider or read unrelated credentials.

The chosen metrics are Faithfulness, FactualCorrectness in F1 mode, LLMContextRecall, LLMContextPrecisionWithReference and ResponseRelevancy with strictness three. Construct a `ragas.SingleTurnSample` with `user_input`, `response`, ordered `retrieved_contexts` and a reviewed `reference`, then call `await score(sample, configured_metrics(judge, embeddings))`.

Context precision uses the reference-based variant here. Missing references produce `missing_reference`, not a different metric selected silently. Retrieval order matters. Relevant context at rank one should score better than the same context buried after distractors. This is distinct from context recall, which measures reference support covered by retrieval. See [versioned context precision](https://docs.ragas.io/en/v0.2.15/concepts/metrics/available_metrics/context_precision/).

Response relevancy uses generated questions and embedding similarity. It needs both adapters and does not establish factual correctness. Its cosine-based score is not guaranteed to be nonnegative, so the wrapper preserves valid negative results rather than clipping them. See [versioned response relevancy](https://docs.ragas.io/en/v0.2.15/concepts/metrics/available_metrics/answer_relevance/).

## Controlled cases to review

| Case | Change | Expected diagnostic direction, not a guaranteed numeric result |
|---|---|---|
| Supported | Context and answer both say seven days | High support and correctness after judge calibration |
| Wrong fact | Answer says thirty; context/reference say seven | Faithfulness and correctness should fall |
| Irrelevant answer | Question asks return period; answer gives office hours | Answer relevance should fall |
| Poor order | Relevant passage follows three distractors | Reference-based context precision should fall |
| Missing evidence | Required reference claim absent from contexts | Context recall should fall |
| Missing label | Reference omitted | Reference-dependent metrics are unscored |

Use authorized synthetic contexts. A judge must not receive forbidden documents just because they are gold labels. Empty contexts produce an explicit missing-evidence status for context metrics. Exceptions and non-finite results remain null with a status. Keep evaluation coverage beside averages. A metric timeout bounds one cooperative call; the caller also needs a total job deadline and spending cap across metrics and retries.

`test_ragas_metrics.py` tests orchestration with fake metrics, without importing Ragas. It does not test judge quality or SDK compatibility. Tests are unexecuted. After approval, run `python3 -m unittest test_ragas_metrics -v` here. Run actual Ragas only in an approved provisioned environment and retain per-case evidence.

Interview: why can a faithful answer still be wrong? The retrieved source can be wrong or obsolete. Faithfulness tests support in supplied context; correctness and source freshness need separate checks. Ask your teacher to review a controlled case before interpreting an aggregate score.
