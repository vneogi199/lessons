import asyncio
from contextlib import closing
import pytest
from service import Service


@pytest.fixture
def lab(tmp_path):
    service = Service(str(tmp_path / 'audit.db'))
    token = service.ledger.issue_session('synthetic-reviewer', 'tenant-a', True)
    return service, token


def reviewed(service, token):
    item = asyncio.run(service.review(token, 'run1'))
    assert item['state'] == 'ready_for_human'
    return item


def test_restart_and_duplicate(lab):
    service, token = lab
    item = reviewed(service, token)
    service.ledger.decide(token, item['operation'], item['hash'], True)
    service.ledger.decide(token, item['operation'], item['hash'], True)
    restarted = Service(service.ledger.path)
    assert restarted.status(token, 'run1')['decision'] == 'approved'
    assert restarted.execute(token, item['operation'], item['hash']) == 'completed'
    assert restarted.execute(token, item['operation'], item['hash']) == 'completed'
    with closing(service.ledger.connect()) as db:
        assert db.execute('SELECT count(*) FROM fake_tickets').fetchone()[0] == 1


def test_denial_stale_hash_and_kill_switch(lab):
    service, token = lab
    item = reviewed(service, token)
    foreign = service.ledger.issue_session('other', 'tenant-b', True)
    with pytest.raises(PermissionError):
        service.status(foreign, 'run1')
    with pytest.raises(PermissionError):
        service.ledger.decide(token, item['operation'], '0'*64, True)
    service.ledger.decide(token, item['operation'], item['hash'], False)
    with pytest.raises(ValueError):
        service.execute(token, item['operation'], item['hash'])
    other = asyncio.run(service.review(token, 'run2'))
    service.ledger.decide(token, other['operation'], other['hash'], True)
    service.stop(True)
    with pytest.raises(PermissionError):
        service.execute(token, other['operation'], other['hash'])


@pytest.mark.parametrize('timeout', [False, True])
def test_partial_worker_failure(lab, timeout):
    service, token = lab
    async def failed(source):
        if timeout:
            raise asyncio.TimeoutError()
        raise RuntimeError('synthetic_failure')
    service.workers['policy'] = failed
    item = asyncio.run(service.review(token, 'failed'))
    assert item['state'] == 'incomplete_review'
    assert 'operation' not in item


def test_uncertain_execution_never_retries(lab):
    service, token = lab
    item = reviewed(service, token)
    service.ledger.decide(token, item['operation'], item['hash'], True)
    with pytest.raises(RuntimeError):
        service.execute(token, item['operation'], item['hash'], crash_after_claim=True)
    restarted = Service(service.ledger.path)
    assert restarted.reconcile(token, item['operation'], item['hash']) == 'unknown'
    with pytest.raises(ValueError):
        restarted.execute(token, item['operation'], item['hash'])


def test_interrupted_review_is_not_replayed(lab):
    service, token = lab
    with closing(service.ledger.connect()) as db, db:
        db.execute('INSERT INTO runs VALUES(?,?,?,NULL,NULL)',
                   ('["tenant-a", "old"]', 'tenant-a', 'reviewing'))
    service.recover_reviews()
    assert asyncio.run(service.review(token, 'old'))['state'] == 'interrupted'
