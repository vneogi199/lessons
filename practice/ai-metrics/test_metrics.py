from decimal import Decimal as D
import unittest
from metrics import Metrics


class MetricsTests(unittest.TestCase):
    def test_billed_failed_retry_and_cache(self):
        m = Metrics()
        usage = dict(input=100, cache_read=200, cache_write=0, output=10)
        prices = dict(input=D("2"), cache_read=D("0.2"), cache_write=D("3"), output=D("8"))
        self.assertEqual(m.attempt("small", "error", usage=usage, prices=prices), D("0.00032"))
        self.assertEqual(m.attempt("small", "success", usage=usage, prices=prices), D("0.00032"))
        self.assertIsNone(m.attempt("small", "error"))
        m.finish("success", 4, first_token_seconds=3)
        self.assertEqual(m.registry.get_sample_value("ai_cost_usd_total", {"model": "small"}), .00064)
        self.assertEqual(m.registry.get_sample_value("ai_unknown_cost_attempts_total", {"model": "small"}), 1)
        self.assertEqual(m.registry.get_sample_value("ai_endpoint_seconds_count"), 1)
        self.assertEqual(m.registry.get_sample_value("ai_ttft_seconds_sum"), 3)

    def test_invalid_values_create_no_task(self):
        m = Metrics()
        for seconds, first in [(float("nan"), None), (1, 2), (True, None)]:
            with self.assertRaises(ValueError):
                m.finish("success", seconds, first_token_seconds=first)
        m.finish("denied", .1)
        self.assertEqual(m.registry.get_sample_value("ai_no_token_total"), 1)
        self.assertEqual(m.registry.get_sample_value("ai_ttft_seconds_count"), 0)


if __name__ == "__main__":
    unittest.main()
