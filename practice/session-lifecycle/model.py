"""Deterministic teaching model; not a token endpoint, JWT verifier or session server."""

from dataclasses import dataclass, field


@dataclass
class RefreshFamily:
    expires_at: int
    generation: int = 0
    consumed: set = field(default_factory=set)
    revoked: bool = False

    def exchange(self, label, now):
        # shortcut: sequential model with labels, not secrets; a real issuer needs
        # atomic durable rotation, client binding and cryptographically random tokens.
        if self.revoked or now >= self.expires_at:
            return "denied", None
        if label in self.consumed:
            self.revoked = True
            return "reuse_detected", None
        if label != f"R{self.generation}":
            return "denied", None
        self.consumed.add(label)
        self.generation += 1
        return "rotated", f"R{self.generation}"

    def revoke(self):
        self.revoked = True


@dataclass
class Session:
    issuer: str
    client: str
    subject: str
    sid: str
    active: bool = True


@dataclass(frozen=True)
class VerifiedLogout:
    """Trusted post-validation fixture. Constructing this class does NOT verify a JWT."""

    issuer: str
    client: str
    event_id: str
    sid: str = ""
    subject: str = ""


class Application:
    def __init__(self, issuer, client, sessions):
        self.issuer = issuer
        self.client = client
        self.sessions = sessions
        self.processed = set()

    def deliver_verified(self, event):
        # shortcut: no transport or signature validation; use only synthetic,
        # already-validated events here, never values parsed from a raw request.
        if event.issuer != self.issuer or event.client != self.client:
            raise ValueError("wrong issuer or audience")
        if not event.event_id or not (event.sid or event.subject):
            raise ValueError("missing event ID or session selector")
        key = (event.issuer, event.client, event.event_id)
        if key in self.processed:
            return 0
        changed = 0
        for session in self.sessions:
            if session.issuer != event.issuer or session.client != event.client:
                continue
            if event.sid and session.sid != event.sid:
                continue
            if event.subject and session.subject != event.subject:
                continue
            if session.active:
                session.active = False
                changed += 1
        self.processed.add(key)
        return changed
