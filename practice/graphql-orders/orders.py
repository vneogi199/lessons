"""Strawberry schema with a file-backed, tenant-scoped SQLite repository.

Schema execution lab only: identity is supplied by trusted test code, not a client.
"""
import asyncio
import sqlite3
from dataclasses import dataclass
from threading import Lock

import strawberry
from strawberry.dataloader import DataLoader
from strawberry.types import Info


@dataclass(frozen=True)
class Actor:
    tenant: str
    can_write: bool = False


@strawberry.type
class Customer:
    id: strawberry.ID
    name: str


@strawberry.type
class Order:
    id: strawberry.ID
    customer_id: strawberry.Private[str]

    @strawberry.field
    async def customer(self, info: Info) -> Customer | None:
        return await info.context["customers"].load(self.customer_id)


class Repository:
    def __init__(self, path):
        self.path = path
        self.select_count = 0
        self.counter_lock = Lock()

    def trace(self, sql):
        # Count statements; never retain expanded SQL containing customer data.
        if sql.lstrip().upper().startswith("SELECT"):
            with self.counter_lock:
                self.select_count += 1

    def read(self, sql, params):
        db = sqlite3.connect(self.path, timeout=1)
        try:
            db.row_factory = sqlite3.Row
            db.set_trace_callback(self.trace)
            return [dict(row) for row in db.execute(sql, params)]
        finally:
            db.close()

    async def orders(self, actor, first):
        if type(first) is not int or not 1 <= first <= 100:
            raise ValueError("invalid_page_size")
        rows = await asyncio.to_thread(
            self.read, "SELECT id, customer_id FROM orders WHERE tenant=? ORDER BY id LIMIT ?",
            (actor.tenant, first))
        return [Order(id=row["id"], customer_id=row["customer_id"]) for row in rows]

    async def customers(self, actor, ids):
        if not ids:
            return {}
        if len(ids) > 100:
            raise ValueError("batch_too_large")
        placeholders = ",".join("?" for _ in ids)
        rows = await asyncio.to_thread(
            self.read, "SELECT id, name FROM customers WHERE tenant=? AND id IN ("
            + placeholders + ") ORDER BY id DESC", (actor.tenant, *ids))
        return {row["id"]: Customer(id=row["id"], name=row["name"]) for row in rows}

    async def rename(self, actor, customer_id, name):
        if not actor.can_write:
            raise PermissionError("write_forbidden")
        name = name.strip()
        if not 1 <= len(name) <= 100:
            raise ValueError("invalid_name")

        def write():
            db = sqlite3.connect(self.path, timeout=1)
            try:
                with db:
                    cursor = db.execute("UPDATE customers SET name=? WHERE tenant=? AND id=?",
                                        (name, actor.tenant, customer_id))
                    if cursor.rowcount != 1:
                        raise ValueError("customer_not_found")
                return Customer(id=customer_id, name=name)
            finally:
                db.close()
        return await asyncio.to_thread(write)


def context_for(actor, repo):
    async def batch(ids):
        rows = await repo.customers(actor, ids)
        return [rows.get(key) for key in ids]
    # Construct once per request, inside an async context. Never reuse across actors.
    return {"actor": actor, "repo": repo,
            "customers": DataLoader(load_fn=batch, max_batch_size=100)}


@strawberry.type
class Query:
    @strawberry.field
    async def orders(self, info: Info, first: int = 20) -> list[Order]:
        return await info.context["repo"].orders(info.context["actor"], first)


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def rename_customer(self, info: Info, id: strawberry.ID, name: str) -> Customer:
        customer = await info.context["repo"].rename(info.context["actor"], str(id), name)
        info.context["customers"].clear(str(id))
        return customer


schema = strawberry.Schema(query=Query, mutation=Mutation)
