"""Read-only synthetic capstone with explicit adapters. No automatic cloud calls."""
import asyncio
from contextlib import closing
import hashlib
import importlib.util
from pathlib import Path
import sys


def module(name, relative):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parents[2] / relative)
    loaded = importlib.util.module_from_spec(spec)
    sys.modules[name] = loaded
    spec.loader.exec_module(loaded)
    return loaded


pipeline = module('omniguard_pipeline', 'practice/secure-pipeline/pipeline.py')
retrieval = module('omniguard_retrieval', 'practice/retrieval-permissions/access.py')
sql = module('omniguard_sql', 'practice/legacy-integrations/typed_sql.py')
approval = module('omniguard_approval', 'practice/agent-workflows/approval.py')
rfq = module('omniguard_bounds', 'practice/rfq-api/app.py')


class Service:
    def __init__(self, database):
        self.sessions = approval.Approvals(database)
        self.index = retrieval.Retrieval([
            retrieval.Document('policy', 'demo', 'v1', 'Policy: a reviewer approves each ticket.',
                               frozenset({'reader'}), (1., 0.)),
            retrieval.Document('private', 'other', 'v1', 'PRIVATE other tenant policy.',
                               frozenset({'reader'}), (1., 0.))])
        self.desks = {('demo', 'reader'): {'RATES'}}
        self.redact = self.fixture_redact
        self.generate = self.fixture_generate
        self.scan = self.fixture_scan
        self.topical = self.fixture_topical

    def identity(self, token):
        if not isinstance(token, str) or not 20 <= len(token) <= 256:
            raise PermissionError('invalid_session')
        with closing(self.sessions.connect()) as db:
            row = db.execute('SELECT * FROM sessions WHERE token_hash=?',
                             (hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
        if not row or row['expires'] <= self.sessions.clock():
            raise PermissionError('invalid_session')
        return pipeline.Identity(row['tenant'], row['actor'])

    @staticmethod
    async def fixture_redact(text, identity):
        return text.replace('PRIVATE', '[REDACTED]')

    @staticmethod
    async def fixture_generate(question, docs):
        return pipeline.Answer(docs[0].text, ((docs[0].document_id, docs[0].version),))

    @staticmethod
    async def fixture_scan(identity, answer):
        return 'PRIVATE' not in answer.text

    @staticmethod
    async def fixture_topical(question):
        # Exact small fixture vocabulary; not a semantic or security classifier.
        return any(word in question.casefold().split() for word in ('policy', 'ticket', 'approval'))

    async def ask(self, token, question):
        identity = self.identity(token)
        async def authorized(current):
            return self.identity(token) == current
        async def allowed(current, doc):
            original = self.index.documents.get(doc.document_id)
            return bool(original and original.version == doc.version and
                        self.index.permitted(original, current.tenant, current.user))
        async def retrieve(current, safe_question):
            if await self.topical(safe_question) is not True:
                return ()
            scores = {}
            # Two permission-filtered rankings, then reciprocal-rank fusion.
            for mode in ('lexical', 'vector'):
                ranked = self.index.ask(current.tenant, current.user, safe_question,
                    mode=mode, vector=(1., 0.), rerank=lambda q, docs: tuple(d.id for d in docs),
                    generate=lambda q, docs: '')
                for rank, (key, version) in enumerate(ranked.get('sources', ()), 1):
                    scores[(key, version)] = scores.get((key, version), 0) + 1 / (60 + rank)
            selected = sorted(scores, key=lambda key: (-scores[key], key))[:3]
            return tuple(pipeline.Document(key, version, self.index.documents[key].tenant,
                                           self.index.documents[key].text) for key, version in selected)
        return await pipeline.respond(identity, question, authorize=authorized,
            redact=self.redact, retrieve=retrieve, allowed=allowed, generate=self.generate,
            scan_output=self.scan)

    def query(self, token, intent, connection=None):
        current = self.identity(token)
        desks = self.desks.get((current.tenant, current.user), set())
        statement, params = sql.compile_intent(intent, current.tenant, desks)
        if connection is None:
            # This is an explicit fixture response, never claimed as a SQL Server result.
            result = {'status': 'fixture', 'rows': [('RATES', '125.00')]} if intent['query'] == 'exposure_by_desk' else {
                'status': 'fixture', 'rows': [('RFQ-1', 'SYNTHETIC-BOND', '2026-01-01T09:00:00Z')]}
        else:
            result = sql.execute_intent(connection, intent, current.tenant, desks)
        if self.identity(token) != current or intent['desk'] not in self.desks.get((current.tenant, current.user), set()):
            raise PermissionError('permission_changed')
        return result

    def enable_local_guards(self, spacy_directory):
        """Opt-in already-provisioned Presidio plus the NeMo fixture rails."""
        root = Path(__file__).resolve().parents[2]
        sys.path.insert(0, str(root / 'practice/pii-evaluation'))
        sys.path.insert(0, str(root / 'practice/nemo-rails'))
        from presidio_adapter import build as detector_build
        from boundary import Policy
        nemo = module('omniguard_nemo_lab', 'practice/nemo-rails/lab.py')
        detector, rails = detector_build(spacy_directory), nemo.build()
        lock = asyncio.Lock()
        async def detect(text):
            async with lock:
                # Local CPU work. In production use an isolated, resource-limited worker.
                return detector.redact(text)
        async def redact(text, identity):
            safe, _ = await detect(text)
            return safe
        async def scan(identity, answer):
            _, spans = await detect(answer.text)
            return not spans and 'PRIVATE' not in answer.text
        async def topical(question):
            if await self.fixture_topical(question) is not True:
                return False
            result = await nemo.answer(rails, question, Policy(True, 'policy_answer'))
            return result == {'status': 'processed',
                'text': 'Synthetic policy: a reviewer must approve the ticket.'}
        self.redact, self.scan, self.topical = redact, scan, topical


def create_app(database):
    from fastapi import FastAPI, Header, HTTPException
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel, ConfigDict, Field
    app, service = FastAPI(), Service(database)
    app.state.service = service
    app.add_middleware(rfq.RequestBounds)
    class Question(BaseModel):
        model_config = ConfigDict(extra='forbid', strict=True)
        question: str = Field(min_length=1, max_length=2000)
    def bearer(value):
        if not value.startswith('Bearer ') or len(value) > 263:
            raise HTTPException(401, 'authentication_required')
        return value[7:]
    @app.exception_handler(PermissionError)
    async def denied(request, exc):
        return JSONResponse({'status': 'denied'}, status_code=403)
    @app.post('/ask')
    async def ask(body: Question, authorization: str = Header()):
        return await service.ask(bearer(authorization), body.question)
    @app.post('/query')
    def query(body: sql.Intent, authorization: str = Header()):
        return service.query(bearer(authorization), body.model_dump())
    return app
