import base64
import hashlib
import json
import tempfile
import time
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import httpx
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from login import Config, Login


class LoginTests(unittest.IsolatedAsyncioTestCase):
    async def test_signed_fake_issuer_and_negative_claims(self):
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(key.public_key()))
        public.update(kid="test-key", use="sig", alg="RS256")
        config = Config("https://issuer.test", "https://issuer.test/authorize", "https://issuer.test/token",
                        "https://issuer.test/jwks", "client", "synthetic-secret", "https://app.test/auth/callback")
        expected, overrides = {}, {}

        def handle(request):
            if request.url.path == "/jwks":
                return httpx.Response(200, json={"keys": [public]})
            fields = parse_qs(request.content.decode())
            actual = base64.urlsafe_b64encode(hashlib.sha256(fields["code_verifier"][0].encode()).digest()).rstrip(b"=").decode()
            self.assertEqual(actual, expected["code_challenge"][0])
            claims = {"iss": config.issuer, "sub": "synthetic-user", "aud": "client", "iat": int(time.time()),
                      "exp": int(time.time()) + 120, "nonce": expected["nonce"][0], **overrides}
            encoded = jwt.encode(claims, key, algorithm="RS256", headers={"kid": "test-key"})
            return httpx.Response(200, json={"id_token": encoded, "token_type": "Bearer"})

        with tempfile.TemporaryDirectory() as tmp:
            async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as http:
                login = Login(str(Path(tmp) / "sessions.db"), config, http)
                for changes in ({}, {"iss": "https://wrong.test"}, {"aud": "other"},
                                {"exp": 1}, {"nonce": "wrong"}, {"azp": "other"}):
                    overrides.clear()
                    overrides.update(changes)
                    url, browser = login.begin()
                    expected = parse_qs(urlsplit(url).query)
                    state = expected["state"][0]
                    if changes:
                        with self.assertRaises((PermissionError, jwt.PyJWTError)):
                            await login.finish(state, browser, "code")
                    else:
                        session = await login.finish(state, browser, "code")
                        current = login.current(session)
                        self.assertEqual(current["subject"], "synthetic-user")
                        with self.assertRaises(PermissionError):
                            login.logout(session, "bad")
                        login.logout(session, current["csrf"])
                        with self.assertRaises(PermissionError):
                            login.current(session)
                    with self.assertRaises(PermissionError):
                        await login.finish(state, browser, "code")
                url, browser = login.begin()
                state = parse_qs(urlsplit(url).query)["state"][0]
                with self.assertRaises(PermissionError):
                    await login.finish("wrong-state", browser, "code")
                with self.assertRaises(PermissionError):
                    await login.finish(state, "other-browser", "code")


if __name__ == "__main__":
    unittest.main()
