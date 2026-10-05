"""No-network model adapter for exercising actual NeMo rails."""
from nemoguardrails import LLMResponse, LLMResponseChunk, register_provider
from boundary import policy


class FixtureModel:
    def __init__(self, model, **kwargs):
        self.model_name = model
        self.provider_name = 'lesson_fixture'
        self.provider_url = None

    async def generate_async(self, prompt, *, stop=None, **kwargs):
        current = policy.get()
        if current is None:
            raise PermissionError('trusted_context_required')
        content = prompt if isinstance(prompt, str) else '\n'.join(m.content or '' for m in prompt)
        if 'LESSON_INPUT_CHECK' in content:
            reply = 'Yes' if current.input_unsafe else 'No'
        elif 'LESSON_OUTPUT_CHECK' in content:
            reply = 'Yes' if current.output_unsafe else 'No'
        else:
            reply = 'Synthetic policy: a reviewer must approve the ticket.'
        return LLMResponse(content=reply, model=self.model_name, finish_reason='stop')

    async def stream_async(self, prompt, *, stop=None, **kwargs):
        result = await self.generate_async(prompt, stop=stop, **kwargs)
        yield LLMResponseChunk(delta_content=result.content, finish_reason='stop')


register_provider('lesson_fixture', FixtureModel)
