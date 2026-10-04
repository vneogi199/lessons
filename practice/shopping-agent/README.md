# A shopping agent that can only draft a purchase

The model's allowed action is `propose_item(sku, quantity)`. `plan_from_tools` accepts one validated call. The server supplies the user and operation ID. Prices come from SQLite, never from the model. The proposed purchase binds the user, item, quantity, price and inventory version in its approval digest.

Example: two books at 1,200 cents each cost 2,400 cents. A budget of 2,399 cents denies the purchase. An unchanged replay returns the existing order without reducing inventory again. A changed quantity needs a new approval. All inventory, orders and effects are synthetic. There is no payment provider, delivery address or shipping action.

The deterministic workflow ends after one proposal. This is sufficient for the small catalog. If a model adapter is added later, supply a deadline, token budget and bounded catalog input. The adapter must not receive a purchase tool. A framework wrapper would not strengthen these permissions.

Approval parameters must come from a trusted authenticated application boundary. This module is not a login server and must not accept a model-provided `authenticated_user` or `approved_digest`. A UI should show the full proposal, then persist the exact decision. See the existing agent-workflow approval store for the separate session pattern.

`BEGIN IMMEDIATE` serializes the stock check, decrement and synthetic order creation. It does not establish exactly-once behavior with a remote payment service. A production connector needs its own idempotency contract and reconciliation after uncertain responses. The SQLite busy timeout bounds lock waiting; throughput is limited by serialized writes.

The `control` row is a local kill switch. Setting `enabled=0` blocks purchases, including replay responses in this policy. It does not erase existing orders. Restrict control changes to operators in a real service. The tests show a paused purchase fails without a new order.

Supplied tests cover approval binding, owner mismatch, budget denial, replay, stock, stale versions, kill switch and unknown tools. They are unexecuted. After separate execution approval, run `python3 -m unittest -v` from this directory using existing Python. Use a temporary database for restart/concurrency exercises; never point this lab at a real order store.

Interview: why use integer cents? They preserve this catalog's two-decimal prices exactly. Other currencies and fractional pricing need an explicit currency/rounding contract, not a universal assumption that all money has two decimal places.

Acceptance: every denied case leaves order count unchanged, an exact replay decrements stock once, and changed or stale proposals require review. Ask your teacher to add a simulated lost response after commit and explain why replay should return the stored outcome.
