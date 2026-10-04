import unittest
from dataclasses import replace
from shop import Shop, plan_from_tools


class ShoppingTests(unittest.TestCase):
    def setUp(self):
        self.shop = Shop(":memory:")

    def tearDown(self):
        self.shop.close()

    def test_approval_replay_and_stock(self):
        p = plan_from_tools(self.shop, "user-a", "op-1", [
            {"name": "propose_item", "arguments": {"sku": "book", "quantity": 2}}])
        kwargs = dict(authenticated_user="user-a", approved_digest=p.digest, budget_cents=2400)
        self.assertFalse(self.shop.purchase(p, **kwargs)["replay"])
        self.assertTrue(self.shop.purchase(p, **kwargs)["replay"])
        self.assertEqual(self.shop.db.execute("SELECT stock FROM inventory WHERE sku='book'").fetchone()[0], 1)

    def test_denials_leave_no_order(self):
        p = self.shop.propose("user-a", "op-1", "book", 1)
        for user, digest, budget in [("user-b", p.digest, 1200),
                                      ("user-a", "wrong", 1200), ("user-a", p.digest, 1199)]:
            with self.assertRaises(PermissionError):
                self.shop.purchase(p, authenticated_user=user, approved_digest=digest, budget_cents=budget)
        self.assertEqual(self.shop.db.execute("SELECT count(*) FROM orders").fetchone()[0], 0)
        with self.assertRaises(PermissionError):
            self.shop.purchase(replace(p, quantity=2), authenticated_user="user-a",
                               approved_digest=p.digest, budget_cents=3000)

    def test_stale_kill_switch_and_unknown_tool(self):
        p = self.shop.propose("user-a", "op-1", "pen", 1)
        self.shop.db.execute("UPDATE inventory SET version=version+1 WHERE sku='pen'")
        with self.assertRaises(ValueError):
            self.shop.purchase(p, authenticated_user="user-a", approved_digest=p.digest, budget_cents=500)
        self.shop.db.execute("UPDATE control SET enabled=0 WHERE id=1")
        with self.assertRaises(PermissionError):
            self.shop.purchase(p, authenticated_user="user-a", approved_digest=p.digest, budget_cents=500)
        with self.assertRaises(ValueError):
            plan_from_tools(self.shop, "user-a", "op-2", [{"name": "purchase", "arguments": {}}])


if __name__ == "__main__":
    unittest.main()
