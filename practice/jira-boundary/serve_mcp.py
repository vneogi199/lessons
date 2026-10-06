"""Run only after deployment approval with reviewed, private config files."""
import asyncio
import json
import os
from pathlib import Path

import httpx
import uvicorn

from mcp_server import Boundary, Verifier, build


async def main():
    if os.environ.get("APPROVED_JIRA_MCP") != "yes":
        raise RuntimeError("deployment approval required")
    config = json.loads(Path(os.environ["JIRA_MCP_CONFIG"]).read_text())
    keys = {kid: Path(path).read_text() for kid, path in config["public_key_files"].items()}
    members = {(row["subject"], row["client_id"]): row for row in config["members"]}
    verifier = Verifier(config["issuer"], config["resource"], keys, members)
    secret = Path(os.environ["JIRA_TOKEN_FILE"]).read_text().strip()
    # API token is held only by the server. Never forward an MCP bearer to Jira.
    async with httpx.AsyncClient(auth=httpx.BasicAuth(config["bot_email"], secret),
                                 trust_env=False, follow_redirects=False) as http:
        boundary = Boundary(config["ledger_path"], http, config, verifier)
        app = build(boundary, verifier)
        await uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8010,
                            workers=1, access_log=False, proxy_headers=False,
                            limit_concurrency=16, timeout_keep_alive=5)).serve()


if __name__ == "__main__":
    asyncio.run(main())
