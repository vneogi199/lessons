from fastapi.testclient import TestClient
from service import create_app


def test_http_approval_does_not_execute(tmp_path):
    app = create_app(str(tmp_path / 'audit.db'))
    token = app.state.service.ledger.issue_session('synthetic', 'a', True)
    headers = {'Authorization': 'Bearer ' + token}
    with TestClient(app) as client:
        assert client.post('/runs/run1', headers={'Authorization': 'Bearer invalid'}).status_code == 403
        result = client.post('/runs/run1', headers=headers)
        assert result.status_code == 200
        item = result.json()
        body = {'operation': item['operation'], 'digest': item['hash'], 'approved': True}
        assert client.post('/decisions', headers=headers, json=body).status_code == 200
        assert client.get('/runs/run1', headers=headers).json()['execution'] == 'not_completed'
        for _ in range(2):
            assert client.post('/execute', headers=headers, json=body).json()['execution'] == 'completed'
        assert client.get('/runs/run1', headers=headers).json()['execution'] == 'completed'


def test_http_stale_denied_and_bounded(tmp_path):
    app = create_app(str(tmp_path / 'audit.db'))
    token = app.state.service.ledger.issue_session('synthetic', 'a', True)
    headers = {'Authorization': 'Bearer ' + token}
    with TestClient(app) as client:
        item = client.post('/runs/run1', headers=headers).json()
        body = {'operation': item['operation'], 'digest': '0'*64, 'approved': True}
        assert client.post('/decisions', headers=headers, json=body).status_code == 403
        assert client.post('/decisions', headers=headers, content=b'x'*4097).status_code == 413
        body['digest'], body['approved'] = item['hash'], False
        assert client.post('/decisions', headers=headers, json=body).status_code == 200
        body['approved'] = True
        assert client.post('/execute', headers=headers, json=body).status_code == 409
