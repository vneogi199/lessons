"""Single-issuer authorization-code login. PyJWT owns signature validation."""
import asyncio
import base64
from contextlib import closing
from dataclasses import dataclass
import hashlib
import hmac
import json
import secrets
import sqlite3
import time
from urllib.parse import urlencode, urlsplit
import jwt


def digest(value):
    if not isinstance(value, str) or not 1 <= len(value) <= 2048:
        raise PermissionError("invalid opaque value")
    return hashlib.sha256(value.encode()).hexdigest()


@dataclass(frozen=True)
class Config:
    issuer: str
    authorize_url: str
    token_url: str
    jwks_url: str
    client_id: str
    client_secret: str
    redirect_uri: str

    def __post_init__(self):
        urls = [urlsplit(v) for v in (self.issuer, self.authorize_url, self.token_url, self.jwks_url, self.redirect_uri)]
        if any(u.scheme != "https" or not u.hostname or u.username or u.password or u.query or u.fragment for u in urls):
            raise ValueError("reviewed fixed HTTPS URLs required")
        if any(u.netloc != urls[0].netloc for u in urls[1:4]) or not self.client_id or not self.client_secret:
            raise ValueError("single issuer origin and confidential client required")


class Login:
    def __init__(self, path, config, http):
        self.path, self.config, self.http = path, config, http
        with closing(self.connect()) as db, db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS pending (
                    state TEXT PRIMARY KEY, browser TEXT, nonce TEXT, verifier TEXT, expires REAL);
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY, subject TEXT, csrf TEXT, expires REAL);
            """)

    def connect(self):
        return sqlite3.connect(self.path, timeout=.2)

    def begin(self):
        state, browser, nonce, verifier = [secrets.token_urlsafe(32) for _ in range(4)]
        with closing(self.connect()) as db, db:
            db.execute("DELETE FROM pending WHERE expires<=?", (time.time(),))
            if db.execute("SELECT count(*) FROM pending").fetchone()[0] >= 1000:
                raise RuntimeError("login capacity")
            db.execute("INSERT INTO pending VALUES (?,?,?,?,?)",
                       (digest(state), digest(browser), nonce, verifier, time.time() + 300))
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
        return self.config.authorize_url + "?" + urlencode({"client_id": self.config.client_id,
            "redirect_uri": self.config.redirect_uri, "response_type": "code", "scope": "openid",
            "state": state, "nonce": nonce, "code_challenge": challenge, "code_challenge_method": "S256"}), browser

    async def fetch(self, method, url, **kwargs):
        async with self.http.stream(method, url, timeout=3, follow_redirects=False, **kwargs) as response:
            response.raise_for_status()
            body = bytearray()
            async for part in response.aiter_bytes():
                body.extend(part)
                if len(body) > 65536:
                    raise PermissionError("identity response bound")
        result = json.loads(body)
        if not isinstance(result, dict):
            raise PermissionError("identity response shape")
        return result

    async def finish(self, state, browser, code):
        if not isinstance(code, str) or not 1 <= len(code) <= 2048:
            raise PermissionError("invalid code")
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT browser,nonce,verifier,expires FROM pending WHERE state=?", (digest(state),)).fetchone()
            if not row or not hmac.compare_digest(row[0], digest(browser)) or row[3] <= time.time():
                raise PermissionError("state/browser mismatch or expiry")
            db.execute("DELETE FROM pending WHERE state=?", (digest(state),))
        # Consumed before exchange: outage requires a new login, never callback replay.
        async with asyncio.timeout(10):
            tokens = await self.fetch("POST", self.config.token_url,
                auth=(self.config.client_id, self.config.client_secret), data={"grant_type": "authorization_code",
                    "code": code, "redirect_uri": self.config.redirect_uri, "code_verifier": row[2]})
            encoded = tokens.get("id_token")
            if not isinstance(encoded, str) or len(encoded) > 16000:
                raise PermissionError("ID token missing")
            header = jwt.get_unverified_header(encoded)
            if header.get("alg") != "RS256" or not isinstance(header.get("kid"), str):
                raise PermissionError("unsupported signing header")
            # No token-selected URL, jku or x5u is followed.
            jwks = await self.fetch("GET", self.config.jwks_url)
            keys = jwks.get("keys")
            if not isinstance(keys, list) or len(keys) > 20:
                raise PermissionError("JWKS bound")
            matches = [k for k in keys if isinstance(k, dict) and k.get("kid") == header["kid"]
                       and k.get("kty") == "RSA" and k.get("use", "sig") == "sig"
                       and k.get("alg", "RS256") == "RS256"]
            if len(matches) != 1:
                raise PermissionError("unknown or ambiguous key")
            key = jwt.PyJWK.from_dict(matches[0]).key
            claims = jwt.decode(encoded, key, algorithms=["RS256"], audience=self.config.client_id,
                issuer=self.config.issuer, options={"require": ["iss", "sub", "aud", "exp", "iat", "nonce"]})
        if not isinstance(claims["nonce"], str) or not hmac.compare_digest(claims["nonce"], row[1]):
            raise PermissionError("nonce mismatch")
        if (isinstance(claims["aud"], list) and len(claims["aud"]) > 1 and claims.get("azp") != self.config.client_id
                or "azp" in claims and claims["azp"] != self.config.client_id):
            raise PermissionError("authorized party mismatch")
        if not isinstance(claims["sub"], str) or not 1 <= len(claims["sub"]) <= 255:
            raise PermissionError("invalid subject")
        session, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        with closing(self.connect()) as db, db:
            db.execute("DELETE FROM sessions WHERE expires<=?", (time.time(),))
            if db.execute("SELECT count(*) FROM sessions").fetchone()[0] >= 1000:
                raise RuntimeError("session capacity")
            db.execute("INSERT INTO sessions VALUES (?,?,?,?)", (digest(session), claims["sub"], csrf,
                       min(time.time() + 900, claims["exp"])))
        return session

    def current(self, token):
        with closing(self.connect()) as db:
            row = db.execute("SELECT subject,csrf,expires FROM sessions WHERE token=?", (digest(token),)).fetchone()
        if not row or row[2] <= time.time():
            raise PermissionError("session expired")
        return {"issuer": self.config.issuer, "subject": row[0], "csrf": row[1]}

    def logout(self, token, csrf):
        current = self.current(token)
        if not isinstance(csrf, str) or not hmac.compare_digest(current["csrf"], csrf):
            raise PermissionError("CSRF mismatch")
        with closing(self.connect()) as db, db:
            db.execute("DELETE FROM sessions WHERE token=?", (digest(token),))


def create_app(login):
    import httpx
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse, RedirectResponse
    app = FastAPI()

    @app.middleware("http")
    async def private_responses(request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    @app.get("/auth/login")
    async def begin():
        url, browser = login.begin()
        response = RedirectResponse(url, status_code=303)
        response.set_cookie("__Host-login", browser, max_age=300, secure=True, httponly=True, samesite="lax", path="/")
        return response

    @app.get("/auth/callback")
    async def callback(request: Request):
        try:
            if any(len(request.query_params.getlist(k)) != 1 for k in ("state", "code")):
                raise PermissionError("one state and code required")
            token = await login.finish(request.query_params["state"], request.cookies.get("__Host-login", ""),
                                       request.query_params["code"])
            response = RedirectResponse("/me", status_code=303)
            response.set_cookie("__Host-session", token, max_age=900, secure=True, httponly=True, samesite="lax", path="/")
        except (PermissionError, ValueError, KeyError, TypeError, jwt.PyJWTError, httpx.HTTPError, TimeoutError):
            response = JSONResponse({"error": "login_failed"}, status_code=400)
        response.delete_cookie("__Host-login", path="/", secure=True, httponly=True, samesite="lax")
        return response

    @app.get("/me")
    async def me(request: Request):
        try:
            return login.current(request.cookies.get("__Host-session", ""))
        except PermissionError:
            return JSONResponse({"error": "login_required"}, status_code=401)

    @app.post("/auth/logout")
    async def logout(request: Request):
        try:
            login.logout(request.cookies.get("__Host-session", ""), request.headers.get("x-csrf-token", ""))
        except PermissionError:
            return JSONResponse({"error": "denied"}, status_code=403)
        response = JSONResponse({"logged_out": True})
        response.delete_cookie("__Host-session", path="/", secure=True, httponly=True, samesite="lax")
        return response
    return app
