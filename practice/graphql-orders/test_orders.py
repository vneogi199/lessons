import asyncio
import sqlite3

import pytest

from orders import Actor, Repository, context_for, schema


@pytest.fixture
def repo(tmp_path):
    path = str(tmp_path / "orders.sqlite")
    db = sqlite3.connect(path)
    try:
        with db:
            db.executescript("""
                CREATE TABLE customers(tenant TEXT, id TEXT, name TEXT,
                                       PRIMARY KEY(tenant, id));
                CREATE TABLE orders(tenant TEXT, id TEXT, customer_id TEXT,
                                    PRIMARY KEY(tenant, id));
                INSERT INTO customers VALUES ('a','1','Ada'), ('a','2','Ben'),
                                             ('b','1','Private');
                INSERT INTO orders VALUES ('a','1','1'), ('a','2','2'),
                                          ('a','3','1'), ('a','4','missing'),
                                          ('b','1','1');
            """)
    finally:
        db.close()
    return Repository(path)


QUERY = "{ orders { id customer { id name } } }"


def test_schema_shape_and_actual_select_count(repo):
    async def run():
        result = await schema.execute(QUERY, context_value=context_for(Actor("a"), repo))
        assert result.errors is None
        assert result.data == {"orders": [
            {"id": "1", "customer": {"id": "1", "name": "Ada"}},
            {"id": "2", "customer": {"id": "2", "name": "Ben"}},
            {"id": "3", "customer": {"id": "1", "name": "Ada"}},
            {"id": "4", "customer": None}]}
        assert repo.select_count == 2  # One orders SELECT plus one customer batch.
    asyncio.run(run())


def test_loader_order_missing_and_request_isolation(repo):
    async def run():
        a = context_for(Actor("a"), repo)
        b = context_for(Actor("b"), repo)
        rows = await a["customers"].load_many(["2", "missing", "1", "2"])
        assert [row.name if row else None for row in rows] == ["Ben", None, "Ada", "Ben"]
        assert (await b["customers"].load("1")).name == "Private"
        assert await b["customers"].load("2") is None
        fresh = context_for(Actor("a"), repo)
        before = repo.select_count
        await fresh["customers"].load("1")
        assert repo.select_count == before + 1
    asyncio.run(run())


def test_mutation_clears_loaded_value_and_checks_authority(repo):
    async def run():
        context = context_for(Actor("a", True), repo)
        assert (await context["customers"].load("1")).name == "Ada"
        result = await schema.execute(
            'mutation { renameCustomer(id:"1", name:"Ana") { id name } }',
            context_value=context)
        assert result.errors is None
        assert (await context["customers"].load("1")).name == "Ana"
        denied = await schema.execute(
            'mutation { renameCustomer(id:"1", name:"No") { id } }',
            context_value=context_for(Actor("a"), repo))
        assert denied.errors
        missing = await schema.execute(
            'mutation { renameCustomer(id:"2", name:"No") { id } }',
            context_value=context_for(Actor("b", True), repo))
        assert missing.errors
        other = context_for(Actor("b"), repo)
        assert (await other["customers"].load("1")).name == "Private"
        assert (await context_for(Actor("a"), repo)["customers"].load("2")).name == "Ben"
    asyncio.run(run())


def test_invalid_page_and_name(repo):
    async def run():
        for query in ['{ orders(first:101) { id } }',
                      'mutation { renameCustomer(id:"1", name:" ") { id } }']:
            result = await schema.execute(query, context_value=context_for(Actor("a", True), repo))
            assert result.errors
    asyncio.run(run())
