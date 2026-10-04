import unittest
from unittest.mock import AsyncMock
from access import Access, GraphGroups

TENANT = "11111111-1111-1111-1111-111111111111"
USER = "22222222-2222-2222-2222-222222222222"
GROUP = "33333333-3333-3333-3333-333333333333"


class AccessTests(unittest.IsolatedAsyncioTestCase):
    async def test_cache_refresh_revocation_and_object_denial(self):
        now, state = [0], [1, True]
        verify = AsyncMock(return_value={"tid": TENANT, "oid": USER, "local_epoch": 1,
            "_claim_names": {"groups": "src"}, "_claim_sources": {"src": {"endpoint": "https://evil.invalid"}}})
        groups = AsyncMock(return_value=frozenset({GROUP}))
        access = Access(verify, groups, lambda *_: tuple(state),
            {TENANT: {GROUP: {"reader", "approver"}}}, clock=lambda: now[0])
        doc = {"tenant": TENANT, "readers": {USER}, "approvers": {USER}}
        await access.authorize("opaque", doc)
        groups.return_value = frozenset()
        with self.assertRaises(PermissionError):
            await access.authorize("opaque", doc, "approve")
        now[0] = 31
        with self.assertRaises(PermissionError):
            await access.authorize("opaque", doc)
        groups.return_value = frozenset({GROUP})
        now[0] = 62
        with self.assertRaises(PermissionError):
            await access.authorize("opaque", {**doc, "readers": set()})
        state[0] = 2
        with self.assertRaises(PermissionError):
            await access.authorize("opaque", doc)

    async def test_graph_fixed_endpoint_and_payload(self):
        import httpx
        seen = []
        def handle(request):
            seen.append(request)
            return httpx.Response(200, json={"value": [GROUP]})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as http:
            graph = GraphGroups(http, AsyncMock(return_value="synthetic-credential"))
            self.assertEqual(await graph(TENANT, USER), frozenset({GROUP}))
        self.assertEqual(str(seen[0].url), f"https://graph.microsoft.com/v1.0/users/{USER}/getMemberObjects")


if __name__ == "__main__":
    unittest.main()
