import unittest
from start import validate


class StartupTests(unittest.TestCase):
    def test_required_security_settings(self):
        values = {"LESSON_PRIMARY_URL": "https://primary.example.test/v1",
                  "LESSON_BACKUP_URL": "https://backup.example.test/v1",
                  "LESSON_PRIMARY_KEY": "synthetic-only", "LESSON_BACKUP_KEY": "synthetic-only",
                  "LITELLM_MASTER_KEY": "sk-" + "synthetic" * 8,
                  "DATABASE_URL": "postgresql://db.example.test/lesson?sslmode=verify-full&sslrootcert=/run/secrets/database-ca.pem",
                  "REDIS_URL": "rediss://redis.example.test:6379"}
        self.assertEqual(validate(values), values)
        for field, invalid in [("DATABASE_URL", "postgresql://db/lesson"),
                               ("REDIS_URL", "redis://db"), ("LITELLM_MASTER_KEY", "sk-1234"),
                               ("LESSON_PRIMARY_URL", "http://primary.example.test")]:
            with self.assertRaises(ValueError):
                validate({**values, field: invalid})


if __name__ == "__main__":
    unittest.main()
