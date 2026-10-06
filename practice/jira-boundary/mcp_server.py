"""Authenticated MCP resource server. No public token issuance or approval tool."""
from contextlib import closing
import hashlib
import importlib.util
from importlib.metadata import version
import json
from pathlib import Path
import secrets
import time
from urllib.parse import urlsplit

import jwt
from mcp.server import MCPServer
from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.auth.provider import AccessToken
from mcp.server.auth.settings import AuthSettings
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import AnyHttpUrl

from jira import Jira

spec = importlib.util.spec_from_file_location("jira_approval", Path(__file__).parents[1] / "agent-workflows" / "approval.py")
approval_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(approval_module)
Approvals = approval_module.Approvals


class Verifier:
    """RS256 access-token profile with operator-pinned public keys and identities."""
    def __init__(self, issuer, resource, keys, members):
        for value in (issuer, resource):
            url = urlsplit(value)
            if url.scheme != "https" or not url.hostname or url.username or url.password or url.query or url.fragment:
                raise ValueError("fixed HTTPS issuer and resource required")
        self.issuer, self.resource = issuer, resource
        if urlsplit(resource).path != "/mcp":
            raise ValueError("this fixture serves the /mcp resource only")
        self.keys, self.members = keys, members

    async def verify_token(self, token):
        try:
            if not isinstance(token, str) or not 1 <= len(token) <= 8192:
                return None
            header = jwt.get_unverified_header(token)
            if header.get("alg") != "RS256" or header.get("typ") != "at+jwt":
                return None
            key = self.keys[header["kid"]]  # Never fetch jku/x5u from the token.
            claims = jwt.decode(token, key, algorithms=["RS256"], issuer=self.issuer,
                                audience=self.resource, options={"strict_aud": True,
                                "require": ["iss", "aud", "exp", "iat", "nbf", "sub", "client_id", "scope"]})
            if (any(type(claims[field]) is not int for field in ("exp", "iat", "nbf"))
                    or not 0 < claims["exp"] - claims["iat"] <= 900
                    or not isinstance(claims["scope"], str) or len(claims["scope"]) > 500):
                return None
            member = self.members.get((claims["sub"], claims["client_id"]))
            if not member:
                return None
            scopes = set(claims["scope"].split()) & set(member["scopes"])
            if "mcp:access" not in scopes:
                return None
            return AccessToken(token=token, client_id=claims["client_id"], subject=claims["sub"],
                               claims={"iss": self.issuer}, scopes=sorted(scopes),
                               expires_at=claims["exp"], resource=self.resource)
        except (jwt.PyJWTError, ValueError, KeyError, TypeError):
            return None

    def current(self, scope):
        token = get_access_token()
        if (not token or token.resource != self.resource or not token.expires_at
                or token.expires_at <= time.time() or scope not in token.scopes):
            raise PermissionError("token_scope_or_expiry")
        member = self.members.get((token.subject, token.client_id))
        if not member or scope not in member["scopes"]:
            raise PermissionError("membership_revoked")
        return member


class Boundary:
    def __init__(self, path, http, config, verifier):
        self.verifier = verifier
        self.approvals = Approvals(path)
        self.jira = Jira(path, http, config["site"], config["project"], config["issue_type"],
                         config["bot_account"], self.authorize, self.approved)
        with closing(self.approvals.connect()) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS intent_links (operation TEXT PRIMARY KEY, approval TEXT UNIQUE)")

    async def authorize(self, tenant, actor, action, destination):
        member = self.verifier.current("jira:" + action)
        # Each principal gets one reviewed project. Issue-level restrictions must
        # be represented by the service account's Jira permissions as well.
        return (member["tenant"] == tenant and member["actor"] == actor
                and member["project"] == self.jira.project)

    def propose(self, tenant, actor, summary, description):
        """Trusted review application only; not an MCP tool or public endpoint."""
        operation = secrets.token_hex(16)
        fields, _, digest = self.jira.intent(tenant, operation, summary, description)
        payload = {"operation": operation, "actor": actor, "site": self.jira.site, "fields": fields, "digest": digest,
                   "summary": summary, "description": description}
        result = self.approvals.propose(tenant, payload)
        with closing(self.approvals.connect()) as db, db:
            db.execute("INSERT INTO intent_links VALUES (?,?)", (operation, result["id"]))
        return {**result, "operation": operation, "payload": payload}

    def lookup(self, operation, tenant, actor, *, require_approval):
        with closing(self.approvals.connect()) as db:
            row = db.execute("SELECT a.* FROM approvals a JOIN intent_links i ON i.approval=a.id "
                             "WHERE i.operation=? AND a.tenant=?", (operation, tenant)).fetchone()
        if not row:
            raise PermissionError("unknown_operation")
        payload = json.loads(row["payload"])
        if payload["actor"] != actor or hashlib.sha256(row["payload"].encode()).hexdigest() != row["hash"]:
            raise PermissionError("intent_owner_or_integrity")
        if (payload["site"] != self.jira.site or payload["fields"]["project"]["key"] != self.jira.project
                or payload["fields"]["issuetype"]["id"] != self.jira.issue_type):
            raise PermissionError("destination_changed")
        if require_approval and (row["status"] != "approved" or row["expires"] <= time.time()):
            raise PermissionError("approval_missing_or_expired")
        return payload

    async def approved(self, tenant, actor, operation, digest):
        payload = self.lookup(operation, tenant, actor, require_approval=True)
        return payload["digest"] == digest

    async def create(self, operation):
        member = self.verifier.current("jira:create")
        payload = self.lookup(operation, member["tenant"], member["actor"], require_approval=True)
        return await self.jira.create(member["tenant"], member["actor"], operation,
                                      payload["summary"], payload["description"])

    async def reconcile(self, operation):
        member = self.verifier.current("jira:reconcile")
        self.lookup(operation, member["tenant"], member["actor"], require_approval=False)
        return await self.jira.reconcile(member["tenant"], member["actor"], operation)


def build(boundary, verifier):
    if version("mcp") != "2.3.0":
        raise RuntimeError("review MCP SDK baseline before startup")
    server = MCPServer("AuditMesh Jira", token_verifier=verifier, auth=AuthSettings(
        issuer_url=AnyHttpUrl(verifier.issuer), resource_server_url=AnyHttpUrl(verifier.resource),
        required_scopes=["mcp:access"], validate_token_resource=True))

    @server.tool()
    async def read_ticket(key: str) -> dict:
        """Read one permitted project ticket as untrusted plain text."""
        member = verifier.current("jira:read")
        return await boundary.jira.read(member["tenant"], member["actor"], key)

    @server.tool()
    async def create_approved_ticket(operation: str) -> dict:
        """Execute an existing exact-intent human approval. No arbitrary fields."""
        return await boundary.create(operation)

    @server.tool()
    async def reconcile_ticket(operation: str) -> dict:
        """Inspect an uncertain operation without sending another create request."""
        return await boundary.reconcile(operation)

    url = urlsplit(verifier.resource)
    return server.streamable_http_app(stateless_http=True, json_response=True,
        max_request_body_size=16384, transport_security=TransportSecuritySettings(
            enable_dns_rebinding_protection=True, allowed_hosts=[url.netloc],
            allowed_origins=[f"https://{url.netloc}"]))
