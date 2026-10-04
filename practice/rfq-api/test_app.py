"""Supplied tests; execution is not recorded. No network or model calls."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from fastapi.testclient import TestClient

from app import Principal, RequestBounds, create_app, principal


@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path / "rfqs.sqlite"))
    app.dependency_overrides[principal] = lambda: Principal("desk-a", True)
    with TestClient(app) as client:
        yield client


def create(client, key="one", quantity=10):
    return client.post("/rfqs", headers={"Idempotency-Key": key},
                       json={"instrument": "BOND-A", "quantity": quantity})


def test_crud_replay_and_missing(client):
    first = create(client)
    assert first.status_code == 201
    rfq = first.json()
    assert create(client).json() == rfq
    assert create(client, quantity=11).status_code == 409
    path = f"/rfqs/{rfq['id']}"
    assert client.get(path).json() == rfq
    updated = client.patch(path, json={"quantity": 20, "version": 1})
    assert updated.status_code == 200
    assert updated.json()["version"] == 2
    assert client.delete(path, params={"version": 1}).status_code == 409
    assert client.delete(path, params={"version": 2}).status_code == 204
    assert client.get(path).status_code == 404
    assert client.patch(path, json={"quantity": 20, "version": 2}).status_code == 404
    assert client.delete(path, params={"version": 2}).status_code == 404
    # Replays return the original response; they do not resurrect a deleted row.
    assert create(client).json() == rfq
    assert client.get("/rfqs").json()["items"] == []


def test_validation_and_pagination(client):
    assert create(client, quantity=True).status_code == 422
    assert create(client, quantity=0).json() == {"error": {"code": "invalid_input"}}
    for i in range(3):
        assert create(client, key=str(i)).status_code == 201
    first = client.get("/rfqs?limit=2").json()
    second = client.get("/rfqs", params={"limit": 2, "after": first["next_after"]}).json()
    assert len(first["items"]) == 2 and len(second["items"]) == 1
    assert first["items"][-1]["id"] < second["items"][0]["id"]
    assert second["next_after"] is None
    assert client.get("/rfqs?limit=101").status_code == 422


def test_permissions(client):
    rfq_id = create(client).json()["id"]
    client.app.dependency_overrides[principal] = lambda: Principal("desk-b", True)
    assert client.get(f"/rfqs/{rfq_id}").status_code == 404
    assert client.get("/rfqs").json()["items"] == []
    assert client.patch(f"/rfqs/{rfq_id}", json={"quantity": 5, "version": 1}).status_code == 404
    assert client.delete(f"/rfqs/{rfq_id}?version=1").status_code == 404
    assert create(client).status_code == 201  # Same key, different tenant.
    client.app.dependency_overrides[principal] = lambda: Principal("desk-a", False)
    assert create(client).status_code == 403
    assert client.patch(f"/rfqs/{rfq_id}", json={"quantity": 5, "version": 1}).status_code == 403
    assert client.delete(f"/rfqs/{rfq_id}?version=1").status_code == 403
    client.app.dependency_overrides.clear()
    assert client.get("/rfqs").status_code == 401


def test_concurrent_updates(client):
    rfq_id = create(client).json()["id"]
    barrier = Barrier(2)

    def change(quantity):
        barrier.wait(timeout=5)
        return client.patch(f"/rfqs/{rfq_id}", json={"quantity": quantity, "version": 1})

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(change, [20, 30]))
    assert sorted(result.status_code for result in results) == [200, 409]
    winner = next(result.json() for result in results if result.status_code == 200)
    assert client.get(f"/rfqs/{rfq_id}").json() == winner


def test_concurrent_duplicate_creation(client):
    barrier = Barrier(2)

    def submit(_):
        barrier.wait(timeout=5)
        return create(client)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(submit, range(2)))
    assert [result.status_code for result in results] == [201, 201]
    assert results[0].json() == results[1].json()
    assert len(client.get("/rfqs").json()["items"]) == 1


def test_body_bounds(client):
    result = client.post("/rfqs", content=b"x" * 4097)
    assert result.status_code == 413
    assert client.post("/rfqs", content=b"x",
                       headers={"Content-Encoding": "gzip"}).status_code == 415


def test_chunked_body_and_admission():
    async def check():
        entered, release = asyncio.Event(), asyncio.Event()

        async def downstream(scope, receive, send):
            entered.set()
            await release.wait()

        guard = RequestBounds(downstream, max_active=1, max_bytes=4)
        scope = {"type": "http", "headers": []}
        messages = []

        async def send(message):
            messages.append(message)

        async def empty():
            return {"type": "http.request", "body": b""}

        first = asyncio.create_task(guard(scope, empty, send))
        await asyncio.wait_for(entered.wait(), 1)
        try:
            await guard(scope, empty, send)
            assert messages[0]["status"] == 503
        finally:
            release.set()
            await first
        assert guard.active == 0
        messages.clear()
        chunks = iter([{"type": "http.request", "body": b"abc", "more_body": True},
                       {"type": "http.request", "body": b"de", "more_body": False}])

        async def chunked():
            return next(chunks)

        await guard(scope, chunked, send)
        assert messages[0]["status"] == 413
        assert guard.active == 0
    asyncio.run(check())
