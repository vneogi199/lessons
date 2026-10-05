"""Single-host synthetic AuditMesh. No external model or Jira calls."""
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'practice/agent-workflows'))
from approval import Approvals, payload_hash
from graphs import run_review


async def evidence(source):
    return {'claim': 'review_required', 'value': 'yes', 'source_version': 'fixture-v1'}


class Service:
    def __init__(self, database, workers=None):
        self.ledger = Approvals(database)
        self.workers = workers or {'evidence': evidence, 'policy': evidence}
        with closing(self.ledger.connect()) as db, db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY, tenant TEXT, state TEXT, operation TEXT,
                    result TEXT);
                CREATE TABLE IF NOT EXISTS fake_tickets (
                    operation TEXT PRIMARY KEY, payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS controls (
                    id INTEGER PRIMARY KEY CHECK(id=1), stopped INTEGER NOT NULL);
                INSERT OR IGNORE INTO controls VALUES(1,0);
            ''')

    def actor(self, db, token):
        if not isinstance(token, str) or not 20 <= len(token) <= 256:
            raise PermissionError('invalid_session')
        actor = db.execute('SELECT * FROM sessions WHERE token_hash=?',
                           (hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
        if not actor or actor['expires'] <= self.ledger.clock():
            raise PermissionError('expired_session')
        return actor

    def stop(self, value):
        """Trusted local operator only; deliberately no public HTTP route."""
        if type(value) is not bool:
            raise ValueError('boolean_required')
        with closing(self.ledger.connect()) as db, db:
            db.execute('UPDATE controls SET stopped=? WHERE id=1', (value,))

    def recover_reviews(self):
        """Operator calls after stopping ALL old workers, never during active reviews."""
        with closing(self.ledger.connect()) as db, db:
            db.execute("UPDATE runs SET state='interrupted' WHERE state='reviewing'")

    async def review(self, token, run_id):
        if not isinstance(run_id, str) or not 1 <= len(run_id) <= 64 or not run_id.isalnum():
            raise ValueError('invalid_run_id')
        with closing(self.ledger.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            actor = self.actor(db, token)
            tenant = actor['tenant']
            # Tenant-scoped, collision-free serialized identity; callers cannot pick a tenant.
            key = json.dumps([tenant, run_id])
            row = db.execute('SELECT * FROM runs WHERE id=?', (key,)).fetchone()
            if row:
                return self.status(token, run_id)
            db.execute('INSERT INTO runs VALUES(?,?,?,NULL,NULL)', (key, tenant, 'reviewing'))
        try:
            result = await run_review(self.workers, {'synthetic-policy'}, [
                {'id': 'evidence', 'kind': 'evidence', 'source': 'synthetic-policy'},
                {'id': 'policy', 'kind': 'policy', 'source': 'synthetic-policy'}], True)
        except BaseException:
            with closing(self.ledger.connect()) as db, db:
                db.execute("UPDATE runs SET state='interrupted' WHERE id=?", (key,))
            raise
        # Persist result and approval atomically. A crash cannot expose an orphan proposal.
        with closing(self.ledger.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            self.actor(db, token)  # Recheck session after asynchronous work.
            operation = None
            if result['decision'] == 'ready_for_human':
                import secrets
                operation = secrets.token_hex(16)
                payload = {'project': 'SYNTHETIC', 'summary': 'Review synthetic compliance evidence',
                           'evidence': result['results']}
                digest, encoded = payload_hash(payload)
                db.execute('INSERT INTO approvals VALUES(?,?,?,?,?,?,NULL)',
                           (operation, tenant, encoded, digest, self.ledger.clock()+300, 'pending'))
            db.execute('UPDATE runs SET state=?,operation=?,result=? WHERE id=?',
                       (result['decision'], operation, json.dumps(result), key))
        return self.status(token, run_id)

    def status(self, token, run_id):
        with closing(self.ledger.connect()) as db:
            actor = self.actor(db, token)
            row = db.execute('SELECT * FROM runs WHERE id=?',
                             (json.dumps([actor['tenant'], run_id]),)).fetchone()
            if not row:
                raise PermissionError('unknown_run')
            answer = {'state': row['state'], 'result': json.loads(row['result'] or 'null')}
            if row['operation']:
                item = db.execute('SELECT * FROM approvals WHERE id=?', (row['operation'],)).fetchone()
                ticket = db.execute('SELECT 1 FROM fake_tickets WHERE operation=?', (item['id'],)).fetchone()
                answer.update(operation=item['id'], hash=item['hash'], payload=json.loads(item['payload']),
                              decision=item['status'], execution='completed' if ticket else 'not_completed')
            return answer

    def execute(self, token, operation, digest, *, crash_after_claim=False):
        # Claim and fake effect are separate transactions to expose the uncertainty window.
        with closing(self.ledger.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            actor, item = self.ledger.checked(db, token, operation, digest)
            if db.execute('SELECT stopped FROM controls WHERE id=1').fetchone()[0]:
                raise PermissionError('kill_switch_active')
            if item['status'] == 'executed':
                return 'completed'
            if item['status'] != 'approved':
                raise ValueError('not_approved_or_reconciliation_required')
            db.execute("UPDATE approvals SET status='unknown' WHERE id=?", (operation,))
        if crash_after_claim:
            raise RuntimeError('synthetic_crash')
        with closing(self.ledger.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            self.ledger.checked(db, token, operation, digest)
            if db.execute('SELECT stopped FROM controls WHERE id=1').fetchone()[0]:
                raise PermissionError('kill_switch_active')
            db.execute('INSERT INTO fake_tickets VALUES(?,?)', (operation, item['payload']))
            db.execute("UPDATE approvals SET status='executed' WHERE id=?", (operation,))
        return 'completed'

    def reconcile(self, token, operation, digest):
        with closing(self.ledger.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            _, item = self.ledger.checked(db, token, operation, digest)
            ticket = db.execute('SELECT payload FROM fake_tickets WHERE operation=?', (operation,)).fetchone()
            if ticket and ticket['payload'] == item['payload']:
                db.execute("UPDATE approvals SET status='executed' WHERE id=?", (operation,))
                return 'completed'
            # Absence is not permission to repeat an external create.
            return 'unknown'


def create_app(database):
    from fastapi import FastAPI, Header, HTTPException
    from pydantic import BaseModel, ConfigDict, Field
    service = Service(database)
    app = FastAPI()
    app.state.service = service
    # Reuse the actual-byte/admission limiter without importing another module named app.
    import importlib.util
    spec = importlib.util.spec_from_file_location('auditmesh_rfq_bounds',
        Path(__file__).resolve().parents[2] / 'practice/rfq-api/app.py')
    bounds = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = bounds
    spec.loader.exec_module(bounds)
    app.add_middleware(bounds.RequestBounds)

    class Decision(BaseModel):
        model_config = ConfigDict(extra='forbid', strict=True)
        operation: str = Field(pattern=r'^[0-9a-f]{32}$')
        digest: str = Field(pattern=r'^[0-9a-f]{64}$')
        approved: bool

    def token(header):
        if not header.startswith('Bearer ') or len(header) > 263:
            raise HTTPException(401, 'authentication_required')
        return header[7:]

    @app.exception_handler(PermissionError)
    async def denied(request, exc):
        from fastapi.responses import JSONResponse
        return JSONResponse({'error': 'forbidden_or_stale'}, status_code=403)

    @app.exception_handler(ValueError)
    async def conflict(request, exc):
        from fastapi.responses import JSONResponse
        return JSONResponse({'error': 'conflict_or_invalid_input'}, status_code=409)

    @app.post('/runs/{run_id}')
    async def review(run_id: str, authorization: str = Header()):
        return await service.review(token(authorization), run_id)

    @app.get('/runs/{run_id}')
    def status(run_id: str, authorization: str = Header()):
        return service.status(token(authorization), run_id)

    @app.post('/decisions')
    def decide(body: Decision, authorization: str = Header()):
        return {'decision': service.ledger.decide(token(authorization), body.operation,
                                                  body.digest, body.approved)}

    @app.post('/execute')
    def execute(body: Decision, authorization: str = Header()):
        if not body.approved:
            raise ValueError('explicit_execution_required')
        return {'execution': service.execute(token(authorization), body.operation, body.digest)}

    return app
