# SAML login with request correlation

The adapter delegates XML signatures and SAML validation to `python3-saml` and
xmlsec. It supplies SP-initiated login, a browser-bound request record, signed
response processing, replay storage and a new opaque session. It does not write
an XML-signature verifier or trust a certificate supplied by the response.

Use an existing reviewed python3-saml 1.16.0 environment with compatible lxml,
xmlsec and defusedxml. Tests also need cryptography and pytest; the HTTP wrapper
needs FastAPI. Record the exact native libxml2/xmlsec versions. This version
reference is an API baseline, not a claim that all dependencies are secure.
Review current advisories before adoption. Nothing was installed or executed.

Construct `Login(private_database_path, reviewed_settings)` and pass it to
`create_app`. Configure the SP entity ID, HTTPS ACS URL ending `/saml/acs`, IdP
entity ID, HTTPS SSO URL and pinned IdP signing certificates. The settings shape
is illustrated in `test_login.py`. Obtain production metadata through an
administrator-approved channel; do not fetch a metadata URL from a login request.
The adapter requires both response and assertion signatures. Configure the IdP
accordingly. SP request signing, assertion encryption and single logout are not
implemented by this exercise and need a separate deployment decision.

The login route stores the AuthnRequest ID and a hash of a short-lived browser
nonce. The ACS requires the matching nonce and consumes the request once. It
passes the stored request ID to the toolkit, which checks signature, issuer,
destination, audience, timing and response correlation. Accepted response and
assertion IDs enter the replay table in the same transaction as session creation.
The session expires no later than the accepted assertion's confirmation window,
the IdP session limit or the local 15-minute ceiling. Local RBAC must map the
validated `(issuer, NameID)`; an arbitrary attribute must not grant administrator
rights.

The short-lived request cookie uses Secure, HttpOnly and SameSite=None because
the IdP posts across sites. The issued session uses SameSite=Lax. RelayState is
ignored and never used as a redirect destination. ACS coordinates come from
trusted settings, not Host or forwarded headers. Browser behavior, TLS termination
and proxy limits still need an actual integration check. Add CSRF protection for
any later state-changing session-authenticated routes. The supplied `/saml/me`
route only reads identity.

After execution approval, run `python -m pytest -q` here. Tests generate temporary
RSA keys and self-signed certificates in memory, then use the toolkit to sign
synthetic assertions and responses. They cover valid sessions, wrong audience,
wrong request, expiry, tampering, wrong browser, repeated IDs and signing-key
rollover. No assertion signature or browser exchange has been verified yet.

Rollover exercise: trust the old and new approved certificates briefly. Confirm
both signed fixtures pass, remove the old certificate and confirm it fails.
Do not remove a production certificate until the IdP migration is coordinated.
SQLite is a single-host teaching store. Set owner-only filesystem permissions,
bound incoming connections and clean up expired records. High-volume deployments
need a shared atomic request/replay/session store and identity revocation policy.

Question: why is a valid signature insufficient? It proves which key signed the
message. The message can still target another service, belong to another login
request, be expired or have been consumed already. Ask your teacher to trace the
wrong-audience fixture from ACS input to rejection.

Source: [Python SAML toolkit settings and validation](https://github.com/SAML-Toolkits/python3-saml).
