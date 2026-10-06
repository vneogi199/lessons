# Semantic Kernel: two reads and a human decision

The synthetic risk is 125 USD. The policy requires human review above 100 USD. The assistant may read both facts and propose a review. A human must approve the exact proposal before the application records its approval claim.

`semantic_kernel_lab.py` registers two native Python functions in a real Semantic Kernel plugin. The kernel dispatches them through `KernelArguments`. The application supplies the permission callback; it is absent from the tool schema. Neither plugin can approve a proposal or send a ticket.

The fixture planner supplies a fixed two-step plan. It does not call an LLM and does not measure model planning quality. The existing `plan_execute` checks the plan schema, allowed tools, sources and step bounds. Per-call and overall timeouts bound cooperative async work. Read results are permission-checked again before return.

Semantic Kernel's old Stepwise and Handlebars planners are removed. Current planning guidance uses function calling: the model chooses a function, the application validates the request, the function returns evidence, and the model decides whether another step is needed. A function-call proposal is untrusted input. Limit iterations, validate arguments, reserve cost and keep irreversible actions behind an approval boundary. This exercise keeps the planner deterministic so you can inspect the SDK and permission path first.

The shared approval ledger binds tenant, exact payload hash, reviewer and expiry. Changing 125 to 999 invalidates the match. Claiming approval does not deliver a remote effect. See the Jira operation ledger for uncertain-write reconciliation. Never register `decide`, `issue_session` or `approve_local_proposal` as model tools.

## Try it when execution is approved

The API baseline is `semantic-kernel==1.44.1`, Python 3.11 or 3.12, Pydantic v2 and pytest. Use an already-provisioned environment with reviewed dependency versions. No package was installed and no test was run. The exact pin makes API changes visible; it is not a security certification. The package now points new projects toward Microsoft Agent Framework, so check support and migration requirements before selecting it for a new product.

```sh
python -m pytest -q test_semantic_kernel_lab.py
```

Expected: both synthetic reads complete; denied access raises; an unapproved, altered or already-claimed proposal fails. The fixture blocks socket connections. Record actual SDK/dependency versions and test results under VERIFY-01. Do not add credentials or a model service to this offline run.

For an interview, compare this plugin dispatch with `graphs.py`. Semantic Kernel groups model services and callable plugins. LangGraph makes state transitions, branches and checkpoints explicit. Both still require application-owned authorization, effect idempotency and evaluation. A known two-read workflow can use ordinary Python; adding an autonomous planner adds cost and failure paths without helping this example.

Practice: predict what happens when permission is revoked between the two reads. The second call fails before returning evidence; there is no automatic approval or fallback to another tenant. Ask your teacher to review your proposed recovery path.

Sources: [Kernel API](https://learn.microsoft.com/en-us/python/api/semantic-kernel/semantic_kernel.kernel.kernel?view=semantic-kernel-python), [planning and removed planners](https://learn.microsoft.com/en-us/semantic-kernel/concepts/planning), [published package baseline](https://pypi.org/project/semantic-kernel/1.44.1/).
