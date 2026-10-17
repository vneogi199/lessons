# Refresh and cross-app logout state exercise

Read [the lesson](../../reference/token-session-lifecycle.html) before the code.
This is a sequential, in-memory teaching model, not an authentication service.
It uses labels such as R0, not real tokens. No server, packages, keys or network
are required. It does not modify the existing OIDC/SAML adapters.

From the repository root:

```sh
python3 -B -m unittest discover -s practice/session-lifecycle -p 'test_*.py' -v
```

Ten tests cover rotation, reuse revocation, unknown tokens, expiry, lost response,
issuer/client/session scoping, subject-wide logout, duplicate delivery, invalid
selectors and partial cross-app delivery. The lost-response test models a
strict reuse policy; providers can have different documented recovery behavior.

`VerifiedLogout` is a post-validation fixture. Its constructor **does not validate
a JWT**. Real inputs need signature/issuer/audience/freshness/event/selector
validation before the state transition, plus atomic durable replay and session
updates. Do not expose this model as an endpoint. No real refresh token, access
token, signed logout message or SAML message is minted or verified here.

Before deploying a separate implementation, test distributed rotation races,
provider revocation semantics, expiry, key rollover, stale/forged logout events,
back-channel retries, restarts and browser cookie/CSRF behavior. SAML SLO needs
toolkit-specific signed requests/responses and correlation tests. Those live
integration checks remain unrun; the lesson supplies the acceptance plan.

Interview exercise: show which app remains active after only one notification is
delivered. Explain why a successful local logout cannot establish global logout.
