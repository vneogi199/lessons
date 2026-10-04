# Login is a code exchange, then a local session

`login.py` supplies a single-issuer OIDC authorization-code flow. The browser receives a short-lived opaque login cookie. The server retains state, nonce and a PKCE verifier in SQLite. On callback it consumes that state once, exchanges the code and validates the ID token with PyJWT. Only then does it create an opaque local session.

Use an already approved environment with FastAPI, HTTPX, PyJWT and cryptography. No dependencies were installed and no tests or issuer calls ran. `test_login.py` supplies a signed fake issuer through HTTPX MockTransport. Its RSA key is generated only when that test runs. It checks PKCE, wrong state/browser, callback replay, issuer, audience, expiry, nonce, authorized party and logout CSRF.

For a separately approved IdP integration, register a confidential web client with the exact HTTPS callback `/auth/callback`. Configure authorization code, PKCE S256, RS256 ID tokens and `client_secret_basic`. Read the issuer's trusted metadata and explicitly set the four URLs in `Config`; this narrow recipe requires one issuer origin. Inject the client secret from protected storage. Use an HTTPX client with `trust_env=False`, no redirects and reviewed TLS trust. Give `Login` a protected persistent SQLite path, then pass it to `create_app`. Importing the module starts no server.

The code never follows URLs from a JWT header. It fetches keys from the configured JWKS endpoint and accepts one matching RSA signing key. Refreshing keys on each login handles ordinary overlapping key rotation but adds traffic. Bound and cache trusted keys if load warrants it, retaining fail-closed handling for unknown keys. Do not allow an arbitrary issuer URL in a login request.

The application validates issuer, audience, expiry, issued-at and nonce, plus `azp` when present or needed for multiple audiences. State binds the callback to this login; the browser cookie binds it to this browser. PKCE binds the authorization code to the server's retained verifier. These checks serve different purposes. No provider access or refresh token is retained or returned to the browser.

Session cookies use Secure, HttpOnly, SameSite=Lax and the `__Host-` prefix. HTTPS is required. `/me` returns the CSRF value to the same-origin client; send it in `X-CSRF-Token` for logout. Every future state-changing route needs CSRF protection too. Do not enable permissive credentialed CORS. Keep callback query strings out of proxy/access logs, and use the supplied no-store/no-referrer headers.

Only `(issuer, subject)` is identity. A successful login grants no document, tenant or approval role. Connect this identity to trusted local membership and the Entra authorization lab where appropriate. That lab's local epoch must come from server state, not an arbitrary token field. Local logout revokes this session only; it does not sign the user out of the IdP or revoke other sessions.

The local store permits at most 1,000 active login attempts and sessions. Apply admission limits at the ingress to prevent login floods. SQLite is a single-host teaching choice; use a shared transactional session store for replicas. A callback outage consumes the attempt and requires a new login. Parallel logins in one browser replace its transient cookie. The app supplies no refresh flow, account recovery or cross-device session management.

Acceptance before deployment: run the supplied negative cases, add HTTPS browser/cookie tests, simulate key overlap/removal and verify secret rotation. A fake signed token validates the application's checks, not the external IdP configuration. Interview: why is decoding a JWT insufficient? Decoding reads claims; signature and claim validation establish whether this application can trust them. Ask the teacher to trace the two cookies and explain why neither contains the ID token.

Sources: [OIDC code-flow token validation](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation), [PyJWT validation](https://pyjwt.readthedocs.io/en/stable/usage.html), [PKCE](https://www.rfc-editor.org/rfc/rfc7636).
