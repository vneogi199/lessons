"""Request-local trusted decisions. Never fill this context from browser JSON."""
from contextvars import ContextVar
from dataclasses import dataclass


@dataclass(frozen=True)
class Policy:
    authorized: bool
    intent: str
    # Synthetic adapter decisions, not a real safety classifier.
    input_unsafe: bool = False
    output_unsafe: bool = False


policy = ContextVar('lesson_policy', default=None)


async def check_application_scope():
    current = policy.get()
    return (isinstance(current, Policy) and current.authorized is True
            and current.intent in {'policy_answer', 'ticket_status'})
