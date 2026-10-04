import pytest
from fastapi.testclient import TestClient

from app import create_app, public_item


@pytest.fixture
def client():
    app = create_app()
    app.dependency_overrides[public_item] = lambda: {"id": 7, "name": "Fixture", "quantity": 3}
    with TestClient(app) as client:
        yield client


@pytest.mark.parametrize("path,headers,version", [
    ("/item", {}, "1"), ("/item", {"X-API-Version": "2"}, "2"),
    ("/v2/item", {}, "2"), ("/v1/item", {"X-API-Version": "1"}, "1")])
def test_contracts(client, path, headers, version):
    response = client.get(path, headers=headers)
    assert response.status_code == 200
    assert response.headers["X-API-Version"] == version
    expected = ({"id": 7, "name": "Fixture", "quantity": 3} if version == "1" else
                {"id": "7", "label": "Fixture", "units": 3})
    assert response.json() == expected


@pytest.mark.parametrize("path,header", [("/v1/item", "2"), ("/item", "3"),
                                         ("/v3/item", "1"), ("/item", "")])
def test_rejections(client, path, header):
    assert client.get(path, headers={"X-API-Version": header}).status_code == 400


def test_warmed_cache_separates_variants(client):
    # A tiny Vary-aware cache fixture; it is not a CDN integration test.
    cache = {}

    def get(version):
        key = ("/item", version)
        if key not in cache:
            result = client.get("/item", headers={"X-API-Version": version})
            assert {part.strip().lower() for part in result.headers["vary"].split(",")} == {
                "x-api-version"}
            cache[key] = result.json()
        return cache[key]

    assert isinstance(get("1")["id"], int)
    assert isinstance(get("2")["id"], str)
    assert isinstance(get("1")["id"], int)
    assert len(cache) == 2
