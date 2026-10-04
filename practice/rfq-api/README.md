# RFQ CRUD practice

Read [the worked lesson](../../reference/rfq-crud-practice.html) first.

This is a local teaching project for API-01. It uses Python 3.10+, FastAPI with
Pydantic v2, and Python's SQLite module. Tests also require pytest and HTTPX in
an existing compatible environment. No dependency installation or runtime
verification has been performed for this project. Version compatibility remains
unverified; it is not a locked deployment artifact.

Files:

- `app.py`: application factory, schemas, request-scoped connection, CRUD routes.
- `test_app.py`: temporary database fixture, CRUD, permissions, replay, pagination,
  and competing-write tests.

When execution is authorized, from this directory:

```sh
python -m pytest -q
```

The fixture creates and removes a temporary database through pytest. It does not
call a provider, use real credentials, or connect to an external database. Expected
result: all seven tests pass. This is an expectation, not a recorded result.

The application factory requires a file-backed SQLite database path. Do not use
`:memory:`: each request opens a separate connection. The lifespan initializes
the schema. `TestClient` must be used as a context manager to run that lifespan.

All application requests fail authentication by default. Tests explicitly
override the identity dependency. Never expose a test identity override through
an HTTP header or use it in a deployed service. Production authentication is a
separate IAM task.

Acceptance: one row per tenant/create key; changed payload gives 409; cross-tenant
reads and writes give 404; read-only identities cannot write; one competing
version-1 update succeeds and one gets 409; deletion does not erase replay history.

Limits: no production authentication, distributed rate limiter, migration tool,
database quota, or replay-retention policy. Middleware caps each body at 4096 bytes,
body receipt at five seconds, and active requests at 16 per process. It rejects
compressed bodies and counts received bytes even without Content-Length. This is
not a whole-request timeout or a cluster-wide limit. An ASGI server or proxy must
also bound headers, connections and incoming frame buffers. Database growth remains
unbounded. SQLite serializes writes. Do not deploy this example unchanged.
Actual integration verification remains separate from completed authoring.
