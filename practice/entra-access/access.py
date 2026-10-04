"""Verified Entra identity -> bounded Graph membership -> local object authorization."""
import asyncio
import json
import time
from uuid import UUID


def guid(value):
    if not isinstance(value, str) or str(UUID(value)) != value:
        raise ValueError("canonical GUID required")
    return value


class GraphGroups:
    def __init__(self, http, token_for_tenant):
        self.http, self.token_for_tenant = http, token_for_tenant

    async def __call__(self, tenant, user):
        guid(tenant), guid(user)
        # Credential callback is server-owned and must return a Graph-audience token
        # for this allowlisted tenant. Never accept a token or URL from claim_sources.
        async with asyncio.timeout(5):
            token = await self.token_for_tenant(tenant)
            if not isinstance(token, str) or not token or len(token) > 16000:
                raise PermissionError("Graph credential unavailable")
            async with self.http.stream("POST",
                    f"https://graph.microsoft.com/v1.0/users/{user}/getMemberObjects",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"securityEnabledOnly": True}, timeout=4, follow_redirects=False) as response:
                response.raise_for_status()
                body = bytearray()
                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > 500_000:
                        raise PermissionError("membership response too large")
            result = json.loads(body)
            groups = result.get("value")
            if not isinstance(groups, list) or len(groups) > 10000 or "@odata.nextLink" in result:
                raise PermissionError("incomplete membership response")
            return frozenset(guid(g) for g in groups)


class Access:
    def __init__(self, verify_token, memberships, state, role_map, *, clock=time.monotonic):
        # verify_token performs cryptographic issuer/audience/expiry/scope validation.
        # state(tid, oid) returns the current (revocation_epoch, enabled) from trusted storage.
        self.verify, self.memberships, self.state = verify_token, memberships, state
        self.role_map = {guid(t): {guid(g): frozenset(roles) for g, roles in mapping.items()}
                         for t, mapping in role_map.items()}
        if any(not roles <= {"reader", "approver"} for m in self.role_map.values() for roles in m.values()):
            raise ValueError("local role allowlist")
        self.cache, self.clock = {}, clock

    async def authorize(self, token, document, action="read"):
        if action not in {"read", "approve"}:
            raise PermissionError("unsupported action")
        claims = await self.verify(token)
        tenant, user = guid(claims["tid"]), guid(claims["oid"])
        if tenant not in self.role_map or document["tenant"] != tenant:
            raise PermissionError("tenant denied")
        epoch, enabled = self.state(tenant, user)
        # The trusted session/token verifier attaches this local epoch at login.
        if enabled is not True or claims.get("local_epoch") != epoch:
            raise PermissionError("session revoked")
        key = tenant, user, epoch
        cached = self.cache.get(key)
        if action == "approve" or cached is None or cached[0] <= self.clock():
            groups = await self.memberships(tenant, user)
            if not isinstance(groups, frozenset) or len(groups) > 10000:
                raise PermissionError("invalid membership adapter")
            for group in groups:
                guid(group)
            # ponytail: bounded single-process cache; shared invalidation is required for a fleet.
            if len(self.cache) >= 100:
                self.cache.clear()
            self.cache[key] = self.clock() + 30, groups
        else:
            groups = cached[1]
        if self.state(tenant, user) != (epoch, True):
            raise PermissionError("revoked during resolution")
        roles = set().union(*(self.role_map[tenant].get(g, ()) for g in groups))
        required = "reader" if action == "read" else "approver"
        allowed_users = document["readers" if action == "read" else "approvers"]
        if required not in roles or user not in allowed_users:
            raise PermissionError("object denied")
        return tenant, user
