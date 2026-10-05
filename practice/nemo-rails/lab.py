"""Version-pinned buffered integration. No remote provider configuration."""
import asyncio
from importlib.metadata import version
import os
from pathlib import Path
from boundary import Policy, policy, check_application_scope


def build():
    if version('nemoguardrails') != '0.22.0':
        raise RuntimeError('This exercise requires pre-provisioned nemoguardrails==0.22.0')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    from nemoguardrails import LLMRails, RailsConfig
    rails = LLMRails(RailsConfig.from_path(str(Path(__file__).parent / 'config')))
    rails.register_action(action=check_application_scope, name='check_application_scope')
    return rails


async def answer(rails, question, trusted_policy):
    if not isinstance(question, str) or not 1 <= len(question) <= 2000 or not isinstance(trusted_policy, Policy):
        raise ValueError('invalid_boundary_input')
    # Authorization is enforced outside the LLM as well as inside the rail.
    if trusted_policy.authorized is not True:
        return {'status': 'denied', 'text': None}
    token = policy.set(trusted_policy)
    try:
        async with asyncio.timeout(10):
            result = await rails.generate_async(messages=[{'role': 'user', 'content': question}])
        content = result.get('content')
        if not isinstance(content, str) or not 1 <= len(content) <= 4000:
            raise ValueError('invalid_rail_response')
        return {'status': 'processed', 'text': content}
    except asyncio.CancelledError:
        raise
    except Exception:
        return {'status': 'review_required', 'text': None}
    finally:
        policy.reset(token)
