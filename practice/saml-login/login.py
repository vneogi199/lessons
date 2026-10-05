"""SP-initiated SAML adapter. Signature validation belongs to python3-saml/xmlsec."""
import base64
from contextlib import closing
from copy import deepcopy
import hashlib
import secrets
import sqlite3
import time
from urllib.parse import urlsplit


def digest(value):
    if not isinstance(value, str) or not 20 <= len(value) <= 256:
        raise PermissionError('invalid_binding')
    return hashlib.sha256(value.encode()).hexdigest()


class Login:
    def __init__(self, path, settings, clock=time.time):
        self.path, self.settings, self.clock = path, deepcopy(settings), clock
        self.settings['strict'], self.settings['debug'] = True, False
        self.settings.setdefault('security', {}).update(
            wantMessagesSigned=True, wantAssertionsSigned=True, wantNameId=True,
            wantAttributeStatement=False, wantXMLValidation=True,
            rejectUnsolicitedResponsesWithInResponseTo=True, rejectDeprecatedAlgorithm=True)
        self.acs = urlsplit(self.settings['sp']['assertionConsumerService']['url'])
        if self.acs.scheme != 'https' or not self.acs.hostname or self.acs.query or self.acs.fragment or self.acs.username:
            raise ValueError('fixed_https_acs_required')
        if urlsplit(self.settings['idp']['singleSignOnService']['url']).scheme != 'https':
            raise ValueError('https_idp_required')
        with closing(self.connect()) as db, db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS requests (nonce TEXT PRIMARY KEY, request TEXT, expires REAL);
                CREATE TABLE IF NOT EXISTS consumed (id TEXT PRIMARY KEY, expires REAL);
                CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, issuer TEXT, subject TEXT, expires REAL);
            ''')

    def connect(self):
        db = sqlite3.connect(self.path, timeout=1)
        db.row_factory = sqlite3.Row
        return db

    def auth(self, post=None):
        from onelogin.saml2.auth import OneLogin_Saml2_Auth
        # Never trust Host or forwarded headers to construct security-sensitive URLs.
        request = {'https': 'on', 'http_host': self.acs.netloc,
                   'server_port': self.acs.port or 443, 'script_name': self.acs.path,
                   'get_data': {}, 'post_data': post or {}}
        return OneLogin_Saml2_Auth(request, old_settings=self.settings)

    def begin(self):
        auth = self.auth()
        target = auth.login()
        nonce = secrets.token_urlsafe(32)
        with closing(self.connect()) as db, db:
            db.execute('DELETE FROM requests WHERE expires<=?', (self.clock(),))
            if db.execute('SELECT count(*) FROM requests').fetchone()[0] >= 1000:
                raise ValueError('login_capacity')
            db.execute('INSERT INTO requests VALUES(?,?,?)',
                       (digest(nonce), auth.get_last_request_id(), self.clock()+300))
        return target, nonce

    def finish(self, nonce, encoded):
        if not isinstance(encoded, str) or not 1 <= len(encoded) <= 100000:
            raise PermissionError('invalid_response')
        from defusedxml.ElementTree import fromstring
        try:
            raw = base64.b64decode(encoded, validate=True)
            if len(raw) > 70000:
                raise ValueError('response_size')
            fromstring(raw, forbid_dtd=True, forbid_entities=True, forbid_external=True)
        except Exception:
            raise PermissionError('invalid_response') from None
        with closing(self.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT * FROM requests WHERE nonce=?', (digest(nonce),)).fetchone()
            if not row or row['expires'] <= self.clock():
                raise PermissionError('unsolicited_or_expired')
            db.execute('DELETE FROM requests WHERE nonce=?', (digest(nonce),))
        auth = self.auth({'SAMLResponse': encoded})
        auth.process_response(request_id=row['request'])
        if auth.get_errors() or not auth.is_authenticated():
            raise PermissionError('invalid_assertion')
        assertion_expiry = auth.get_last_assertion_not_on_or_after()
        expiry = min(self.clock()+900, assertion_expiry or 0,
                     auth.get_session_expiration() or self.clock()+900)
        ids = (auth.get_last_message_id(), auth.get_last_assertion_id())
        subject = auth.get_nameid()
        if expiry <= self.clock() or any(not isinstance(i, str) or not 1 <= len(i) <= 256 for i in ids) or not subject:
            raise PermissionError('incomplete_assertion')
        token = secrets.token_urlsafe(32)
        with closing(self.connect()) as db, db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('DELETE FROM consumed WHERE expires<=?', (self.clock(),))
            db.execute('DELETE FROM sessions WHERE expires<=?', (self.clock(),))
            if db.execute('SELECT count(*) FROM consumed').fetchone()[0] >= 10000:
                raise PermissionError('replay_store_capacity')
            try:
                db.executemany('INSERT INTO consumed VALUES(?,?)', [(i, assertion_expiry+300) for i in ids])
            except sqlite3.IntegrityError:
                raise PermissionError('replayed_assertion') from None
            db.execute('INSERT INTO sessions VALUES(?,?,?,?)',
                       (digest(token), self.settings['idp']['entityId'], subject, expiry))
        return token

    def current(self, token):
        with closing(self.connect()) as db:
            row = db.execute('SELECT * FROM sessions WHERE token=? AND expires>?',
                             (digest(token), self.clock())).fetchone()
        if not row:
            raise PermissionError('expired_session')
        return row['issuer'], row['subject']


def create_app(login):
    import asyncio
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse, RedirectResponse
    from urllib.parse import parse_qs
    app = FastAPI()
    @app.exception_handler(PermissionError)
    async def denied(request, exc):
        return JSONResponse({'error': 'login_failed'}, status_code=403,
                            headers={'Cache-Control': 'no-store'})
    @app.get('/saml/login')
    def begin():
        target, nonce = login.begin()
        response = RedirectResponse(target, status_code=302, headers={'Cache-Control': 'no-store'})
        # Cross-site SAML POST requires this short-lived binding cookie.
        response.set_cookie('__Host-saml-request', nonce, secure=True, httponly=True,
                            samesite='none', max_age=300, path='/')
        return response
    @app.post('/saml/acs')
    async def finish(request: Request):
        if request.headers.get('content-type', '').split(';')[0] != 'application/x-www-form-urlencoded':
            raise PermissionError('invalid_type')
        raw = bytearray()
        async with asyncio.timeout(5):
            async for part in request.stream():
                raw.extend(part)
                if len(raw) > 140000:
                    raise PermissionError('body_limit')
        try:
            values = parse_qs(raw.decode('ascii'), max_num_fields=2)
        except (ValueError, UnicodeError):
            raise PermissionError('invalid_form') from None
        if set(values) - {'SAMLResponse', 'RelayState'} or len(values.get('SAMLResponse', [])) != 1:
            raise PermissionError('invalid_fields')
        token = login.finish(request.cookies.get('__Host-saml-request'), values['SAMLResponse'][0])
        response = RedirectResponse('/saml/me', status_code=303, headers={'Cache-Control': 'no-store'})
        response.delete_cookie('__Host-saml-request', path='/', secure=True, httponly=True, samesite='none')
        response.set_cookie('__Host-saml-session', token, secure=True, httponly=True, samesite='lax', path='/')
        return response
    @app.get('/saml/me')
    def current(request: Request):
        issuer, subject = login.current(request.cookies.get('__Host-saml-session'))
        return JSONResponse({'issuer': issuer, 'subject': subject}, headers={'Cache-Control': 'no-store'})
    return app
