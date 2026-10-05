# Run the input and output rails

This exercise pins NeMo Guardrails 0.22.0 and Colang 1.0. It supplies a Python
scope action, a custom no-network model adapter, self-check prompts, both rails
and tests. Use an existing compatible environment; no package or model was
installed and no test was run. The pin selects an API contract, not a security
endorsement of that version. Review its advisories before any deployment.

The support desk accepts policy questions and ticket-status requests. A trusted
server chooses the intent and checks authorization before calling `answer`.
A browser must not submit the `Policy` object. The Colang input flow consults
that request-local state. A travel request gets a fixed refusal. The real access
checks must also exist in the document and ticket services.

The fixture model supplies predetermined Yes/No safety decisions so the tests
exercise actual NeMo flow wiring without a model call. It does not understand
topics or detect attacks. Its prompt-marker routing is test machinery and must
not be used as a security classifier. In a real adapter, use a reviewed model,
measure benign false blocks and unsafe passes, and retain deterministic access
checks regardless of the model's answer.

After execution approval, from this directory use `python -m pytest -q`.
The fixture rejects network connections and disables Hugging Face downloads.
Unexpected asset requirements must fail; do not remove those restrictions just
to make the tests pass. No user-intent examples or knowledge base are configured.
The passthrough generation path avoids conversational intent matching.

Expected sequence: allowed policy request, input check, synthetic answer, output
check, buffered release. An input refusal must stop generation. An output
refusal must replace the candidate before release. A required dependency failure
returns `review_required` with no text. The wrapper's `processed` status includes
both answers and refusals; it is not a safety or factual-accuracy certificate.

Practice: remove permission while leaving the safety classifier's answer No.
Should the request pass? No. Safety classification does not confer permission.
Then test an ordinary policy question with a false-positive classifier decision.
Record the lost utility as well as the blocked response. Ask your teacher to
review how the trusted intent is chosen in your actual application.

Sources: [custom model contract](https://docs.nvidia.com/nemo/guardrails/configure-guardrails/custom-initialization/custom-llm-model),
[Colang input rails](https://docs.nvidia.com/nemo/guardrails/configure-guardrails/colang/colang-1/tutorials/4-input-rails),
[self-check rails](https://docs.nvidia.com/nemo/guardrails/configure-guardrails/guardrail-catalog/self-check).
