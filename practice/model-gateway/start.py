"""Read mounted secrets at runtime; never bake them into image/config/CLI args."""
import json
import os
from pathlib import Path
import shutil
from urllib.parse import parse_qs, urlsplit


def validate(values):
    expected = {"LESSON_PRIMARY_URL", "LESSON_PRIMARY_KEY", "LESSON_BACKUP_URL", "LESSON_BACKUP_KEY",
                "LITELLM_MASTER_KEY", "DATABASE_URL", "REDIS_URL"}
    if set(values) != expected or any(not isinstance(v, str) or not v for v in values.values()):
        raise ValueError("exact nonempty configuration required")
    if len(values["LITELLM_MASTER_KEY"]) < 40 or not values["LITELLM_MASTER_KEY"].startswith("sk-"):
        raise ValueError("strong generated master credential required")
    for name in ("LESSON_PRIMARY_URL", "LESSON_BACKUP_URL"):
        url = urlsplit(values[name])
        if url.scheme != "https" or not url.hostname or url.username or url.password or url.query or url.fragment:
            raise ValueError("reviewed HTTPS model endpoint required")
    database = urlsplit(values["DATABASE_URL"])
    params = parse_qs(database.query)
    if (database.scheme not in {"postgres", "postgresql"} or not database.hostname
            or params.get("sslmode") != ["verify-full"] or "sslrootcert" not in params):
        raise ValueError("verified PostgreSQL TLS and mounted CA required")
    if urlsplit(values["REDIS_URL"]).scheme != "rediss":
        raise ValueError("Redis TLS required")
    return values


if __name__ == "__main__":
    if os.environ.get("APPROVED_GATEWAY_START") != "yes":
        raise RuntimeError("gateway deployment approval required")
    values = validate(json.loads(Path("/run/secrets/gateway.json").read_text()))
    executable = shutil.which("litellm")
    if not executable:
        raise RuntimeError("use the approved pre-provisioned proxy image")
    # The proxy's documented env resolver requires process-local values. Restrict
    # container introspection, crash dumps and child processes; never log this env.
    os.execve(executable, [executable, "--config", "/app/lesson/config.yaml", "--host", "0.0.0.0", "--port", "4000"],
              {**os.environ, **values})
