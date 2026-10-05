import asyncio
from dataclasses import replace
import pytest
from fastapi.testclient import TestClient
from service import create_app, pipeline


@pytest.fixture
def lab(tmp_path):
    app = create_app(str(tmp_path/'identities.db'))
    service = app.state.service
    token = service.sessions.issue_session('reader', 'demo', False)
    return app, service, token


def test_connected_http_paths(lab):
    app, service, token = lab
    with TestClient(app) as client:
        headers = {'Authorization': 'Bearer '+token}
        result = client.post('/ask', headers=headers, json={'question': 'Explain policy'}).json()
        assert result['status'] == 'released'
        assert result['answer']['citations'] == [['policy', 'v1']]
        assert 'PRIVATE' not in str(result)
        intent = {'query': 'exposure_by_desk', 'desk': 'RATES', 'as_of': '2026-01-01'}
        assert client.post('/query', headers=headers, json=intent).json()['rows'] == [['RATES', '125.00']]
        assert client.post('/query', headers=headers, json={**intent, 'desk': 'OTHER'}).status_code == 403
        assert client.post('/query', headers=headers, json={**intent, 'sql': 'DROP TABLE x'}).status_code == 422
        service.sessions.revoke(token)
        assert client.post('/ask', headers=headers, json={'question': 'policy'}).status_code == 403


@pytest.mark.parametrize('mode', ['bad_citation', 'private_output', 'revoked_document', 'outage'])
def test_release_failures(lab, mode):
    app, service, token = lab
    async def model(question, docs):
        if mode == 'outage':
            raise RuntimeError('synthetic outage')
        if mode == 'revoked_document':
            service.index.replace(replace(service.index.documents['policy'], readers=frozenset()))
        return pipeline.Answer('PRIVATE' if mode == 'private_output' else 'Policy answer',
            (('invented' if mode == 'bad_citation' else 'policy', 'v1'),))
    service.generate = model
    result = asyncio.run(service.ask(token, 'Explain policy'))
    assert result['answer'] is None
    assert result['status'] in {'denied', 'review_required'}


def test_other_user_and_off_topic(lab):
    app, service, token = lab
    other = service.sessions.issue_session('unlisted', 'demo', False)
    assert asyncio.run(service.ask(other, 'Explain policy'))['status'] == 'insufficient_evidence'
    assert asyncio.run(service.ask(token, 'Write travel tips'))['status'] == 'insufficient_evidence'
