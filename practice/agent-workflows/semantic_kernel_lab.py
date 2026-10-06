"""Real SDK dispatch, synthetic evidence, no provider or external write."""
import asyncio
from importlib.metadata import version

from semantic_kernel import Kernel
from semantic_kernel.functions import KernelArguments, kernel_function

from workflows import plan_execute


class Evidence:
    def __init__(self, permitted):
        # Trusted application callback; never a function argument from the model.
        self.permitted = permitted

    @kernel_function(name="read_evidence", description="Read the approved synthetic risk total.")
    def read_evidence(self, source: str) -> str:
        if source != "risk-v1" or not self.permitted(source):
            raise PermissionError("source_forbidden")
        return "Synthetic risk exposure: 125.00 USD; source risk-v1."

    @kernel_function(name="read_policy", description="Read the approved synthetic review threshold.")
    def read_policy(self, source: str) -> str:
        if source != "policy-v1" or not self.permitted(source):
            raise PermissionError("source_forbidden")
        return "Synthetic policy: a human reviews exposure above 100.00 USD."


def build(permitted):
    if version("semantic-kernel") != "1.44.1":
        raise RuntimeError("review the SDK version before running this fixture")
    kernel = Kernel()
    kernel.add_plugin(Evidence(permitted), plugin_name="risk")
    return kernel


async def review(kernel, planner, permitted):
    async def execute(step):
        if not permitted(step.source):
            raise PermissionError("source_revoked")
        result = await asyncio.wait_for(kernel.invoke(
            plugin_name="risk", function_name=step.tool,
            arguments=KernelArguments(source=step.source)), timeout=2)
        if not permitted(step.source):
            raise PermissionError("source_revoked")
        return {"status": "ok", "text": str(result), "source": step.source}
    return await plan_execute(planner, execute, {"risk-v1", "policy-v1"})


def approve_local_proposal(ledger, reviewer_token, operation, payload):
    """Trusted review application only. Not registered as a kernel function.

    Claiming records permission for this exact proposal; it sends no ticket.
    The reviewer must already have decided through the separate approval service.
    """
    if payload.get("kind") != "synthetic-risk-review":
        raise ValueError("unsupported_intent")
    return ledger.claim_resume(reviewer_token, operation, payload)
