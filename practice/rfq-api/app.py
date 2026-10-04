"""Local teaching API. Authentication deliberately fails closed by default."""
import asyncio
import json
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.exceptions import HTTPException as StarletteHTTPException


@dataclass(frozen=True)
class Principal:
    tenant: str
    can_write: bool


def principal():
    # Override in tests. A deployed adapter must validate identity itself.
    raise HTTPException(401, "authentication_required")


def writer(user: Annotated[Principal, Depends(principal)]):
    if not user.can_write:
        raise HTTPException(403, "write_forbidden")
    return user


class CreateRFQ(BaseModel):
    model_config = ConfigDict(extra="forbid")
    instrument: str = Field(pattern=r"^[A-Z0-9-]{1,24}$")
    quantity: int = Field(strict=True, ge=1, le=1_000_000)


class UpdateRFQ(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quantity: int = Field(strict=True, ge=1, le=1_000_000)
    version: int = Field(strict=True, ge=1)


class RFQ(CreateRFQ):
    id: int
    version: int


class Page(BaseModel):
    items: list[RFQ]
    next_after: int | None


class RequestBounds:
    """Per-process admission and actual-byte limits for this non-streaming API."""
    def __init__(self, app, max_active=16, max_bytes=4096):
        self.app = app
        self.max_active = max_active
        self.max_bytes = max_bytes
        self.active = 0

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def reject(status, code):
            response = JSONResponse({"error": {"code": code}}, status_code=status)
            await response(scope, receive, send)

        # No await between the check and increment on this event loop.
        if self.active >= self.max_active:
            return await reject(503, "capacity_exceeded")
        self.active += 1
        try:
            if any(k.lower() == b"content-encoding" and v.lower() != b"identity"
                   for k, v in scope.get("headers", [])):
                return await reject(415, "unsupported_encoding")
            body = bytearray()
            loop = asyncio.get_running_loop()
            deadline = loop.time() + 5
            while True:
                remaining = deadline - loop.time()
                if remaining <= 0:
                    return await reject(408, "body_timeout")
                try:
                    message = await asyncio.wait_for(receive(), remaining)
                except asyncio.TimeoutError:
                    return await reject(408, "body_timeout")
                if message["type"] == "http.disconnect":
                    return
                chunk = message.get("body", b"")
                if len(body) + len(chunk) > self.max_bytes:
                    return await reject(413, "body_too_large")
                body.extend(chunk)
                if not message.get("more_body", False):
                    break
            delivered = False

            async def bounded_receive():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {"type": "http.request", "body": bytes(body),
                            "more_body": False}
                return await receive()

            await self.app(scope, bounded_receive, send)
        finally:
            self.active -= 1


@contextmanager
def transaction(db):
    # Reserve the SQLite writer before any read/check/write sequence.
    db.execute("BEGIN IMMEDIATE")
    try:
        yield
        db.commit()
    except BaseException:
        db.rollback()
        raise


def create_app(database):
    def connect():
        db = sqlite3.connect(database, timeout=1, isolation_level=None,
                             check_same_thread=False)
        db.row_factory = sqlite3.Row
        return db

    @asynccontextmanager
    async def lifespan(app):
        db = connect()
        try:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS rfqs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tenant TEXT NOT NULL,
                    instrument TEXT NOT NULL,
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    version INTEGER NOT NULL DEFAULT 1
                );
                CREATE INDEX IF NOT EXISTS rfq_tenant_id ON rfqs(tenant, id);
                CREATE TABLE IF NOT EXISTS requests (
                    tenant TEXT NOT NULL, key TEXT NOT NULL,
                    payload TEXT NOT NULL, response TEXT NOT NULL,
                    PRIMARY KEY(tenant, key)
                );
            """)
        finally:
            db.close()
        yield

    app = FastAPI(lifespan=lifespan)
    app.add_middleware(RequestBounds)

    def session():
        db = connect()
        try:
            yield db
        finally:
            db.close()

    @app.exception_handler(StarletteHTTPException)
    async def http_error(request, exc):
        code = exc.detail if isinstance(exc.detail, str) else "request_failed"
        return JSONResponse({"error": {"code": code}}, status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        # Do not echo submitted input, which may contain sensitive data.
        return JSONResponse({"error": {"code": "invalid_input"}}, status_code=422)

    @app.exception_handler(sqlite3.OperationalError)
    async def database_error(request, exc):
        busy = getattr(exc, "sqlite_errorcode", 0) & 255 in (
            sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED)
        return JSONResponse({"error": {"code": "database_busy" if busy else
                                       "database_failure"}},
                            status_code=503 if busy else 500)

    def find(db, tenant, rfq_id):
        row = db.execute("SELECT id, instrument, quantity, version FROM rfqs "
                         "WHERE tenant=? AND id=?", (tenant, rfq_id)).fetchone()
        if row is None:
            raise HTTPException(404, "rfq_not_found")
        return dict(row)

    @app.post("/rfqs", response_model=RFQ, status_code=201)
    def create(body: CreateRFQ,
               key: Annotated[str, Header(alias="Idempotency-Key", min_length=1,
                                          max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")],
               user: Principal = Depends(writer), db=Depends(session)):
        payload = json.dumps(body.model_dump(), sort_keys=True)
        with transaction(db):
            old = db.execute("SELECT payload, response FROM requests "
                             "WHERE tenant=? AND key=?", (user.tenant, key)).fetchone()
            if old:
                if old["payload"] != payload:
                    raise HTTPException(409, "idempotency_conflict")
                return json.loads(old["response"])
            cursor = db.execute("INSERT INTO rfqs(tenant, instrument, quantity) "
                                "VALUES (?, ?, ?)",
                                (user.tenant, body.instrument, body.quantity))
            result = find(db, user.tenant, cursor.lastrowid)
            db.execute("INSERT INTO requests VALUES (?, ?, ?, ?)",
                       (user.tenant, key, payload, json.dumps(result)))
        return result

    @app.get("/rfqs", response_model=Page)
    def list_rfqs(after: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
                  user: Principal = Depends(principal), db=Depends(session)):
        rows = db.execute("SELECT id, instrument, quantity, version FROM rfqs "
                          "WHERE tenant=? AND id>? ORDER BY id LIMIT ?",
                          (user.tenant, after, limit + 1)).fetchall()
        return {"items": [dict(row) for row in rows[:limit]],
                "next_after": rows[limit - 1]["id"] if len(rows) > limit else None}

    @app.get("/rfqs/{rfq_id}", response_model=RFQ)
    def read(rfq_id: int, user: Principal = Depends(principal), db=Depends(session)):
        return find(db, user.tenant, rfq_id)

    @app.patch("/rfqs/{rfq_id}", response_model=RFQ)
    def update(rfq_id: int, body: UpdateRFQ,
               user: Principal = Depends(writer), db=Depends(session)):
        with transaction(db):
            find(db, user.tenant, rfq_id)
            cursor = db.execute("UPDATE rfqs SET quantity=?, version=version+1 "
                                "WHERE tenant=? AND id=? AND version=?",
                                (body.quantity, user.tenant, rfq_id, body.version))
            if cursor.rowcount != 1:
                raise HTTPException(409, "stale_version")
            result = find(db, user.tenant, rfq_id)
        return result

    @app.delete("/rfqs/{rfq_id}", status_code=204)
    def delete(rfq_id: int, version: int = Query(..., ge=1),
               user: Principal = Depends(writer), db=Depends(session)):
        with transaction(db):
            find(db, user.tenant, rfq_id)
            cursor = db.execute("DELETE FROM rfqs WHERE tenant=? AND id=? AND version=?",
                                (user.tenant, rfq_id, version))
            if cursor.rowcount != 1:
                raise HTTPException(409, "stale_version")
        return Response(status_code=204)
    return app
