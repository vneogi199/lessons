import asyncio
from io import BytesIO
from dataclasses import replace
import pytest
from document_rag import Bundle, ask, validate
from retry import Failure

def png():
    from PIL import Image
    output = BytesIO()
    Image.new('RGB', (1, 1), 'white').save(output, format='PNG')
    return output.getvalue()


def bundle():
    # Descriptor digest placeholder, not a claimed PDF-rendering observation.
    pages = tuple({'number': n, 'version': 'a'*64, 'coordinate_space': 'rendered_top_left_normalized',
        'image': png(), 'quality': 'candidate', 'words': [{'text': 'header' if n == 1 else 'exposure'}]}
        for n in (1, 2))
    return Bundle('synthetic', 'tenant', 'a'*64, frozenset({'reader'}), pages, {2: (1,)})


class Transport:
    def __init__(self, count=100, before_return=lambda: None):
        self.tokens, self.before_return, self.calls = count, before_return, 0
    async def count(self, *args):
        return self.tokens
    async def post(self, path, body):
        self.calls += 1
        self.before_return()
        return {'stop_reason': 'tool_use', 'content': [{'type': 'tool_use', 'name': 'answer_pages',
            'input': {'status': 'answered', 'answer': 'Synthetic 125 USD.', 'citations': ['p1', 'p2']}}]}


def test_header_and_page_citations():
    source, transport = bundle(), Transport()
    result = asyncio.run(ask(source, 'exposure', tenant='tenant', user='reader',
                            current=lambda _: source, transport=transport))
    assert [p['page'] for p in result['evidence']] == [1, 2]
    assert all(p['crop'] == (0., 0., 1., 1.) for p in result['evidence'])


def test_missing_pages_and_mixed_versions():
    source = bundle()
    with pytest.raises(ValueError):
        validate(replace(source, pages=source.pages[1:]))
    with pytest.raises(ValueError):
        validate(replace(source, pages=(source.pages[0], {**source.pages[1], 'version': 'b'*64})))


def test_revocation_and_token_budget():
    source = bundle()
    state = [source]
    transport = Transport(before_return=lambda: state.__setitem__(0, replace(source, readers=frozenset())))
    with pytest.raises(PermissionError):
        asyncio.run(ask(source, 'exposure', tenant='tenant', user='reader', current=lambda _: state[0], transport=transport))
    transport = Transport(count=16000)
    with pytest.raises(Failure):
        asyncio.run(ask(source, 'exposure', tenant='tenant', user='reader', current=lambda _: source, transport=transport))
    assert transport.calls == 0


def test_stale_version_denied_before_model():
    source, transport = bundle(), Transport()
    with pytest.raises(PermissionError):
        asyncio.run(ask(source, 'exposure', tenant='tenant', user='reader',
            current=lambda _: replace(source, version='b'*64), transport=transport))
    assert transport.calls == 0
