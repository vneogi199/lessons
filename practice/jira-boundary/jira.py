"""Narrow Jira Cloud adapter with a durable uncertain-create ledger."""
import asyncio
from contextlib import closing
import hashlib
import json
import re
import sqlite3
from urllib.parse import urlsplit


def adf(text):
    if not isinstance(text, str) or not 1 <= len(text) <= 4000:
        raise ValueError("bounded plain description required")
    return {"type": "doc", "version": 1, "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": text}]}]}


def plain(document):
    """Conservative ADF subset. Unsupported rich content requires review."""
    count = 0
    def visit(node, depth=0):
        nonlocal count
        count += 1
        if count > 500 or depth > 12 or not isinstance(node, dict):
            raise ValueError("ADF bounds")
        kind = node.get("type")
        if kind == "text":
            text = node.get("text")
            if not isinstance(text, str) or len(text) > 8000:
                raise ValueError("ADF text bound")
            return text  # Marks/URLs are not fetched or rendered as HTML.
        if kind == "hardBreak":
            return "\n"
        if kind not in {"doc", "paragraph", "heading", "bulletList", "orderedList", "listItem"}:
            raise ValueError("unsupported rich content")
        children = node.get("content", [])
        if not isinstance(children, list):
            raise ValueError("ADF children")
        return "".join(visit(child, depth + 1) for child in children) + ("\n" if kind in {"paragraph", "heading"} else "")
    if not isinstance(document, dict) or document.get("type") != "doc" or document.get("version") != 1:
        raise ValueError("ADF document required")
    text = visit(document).strip()
    if len(text) > 8000:
        raise ValueError("ADF total bound")
    return text


class Jira:
    def __init__(self, path, http, site, project, issue_type, bot_account, authorize, approved):
        url = urlsplit(site)
        if (url.scheme != "https" or not re.fullmatch(r"[a-z0-9-]+\.atlassian\.net", url.netloc)
                or url.path not in {"", "/"} or url.query or url.fragment
                or not re.fullmatch(r"[A-Z][A-Z0-9]{1,15}", project)
                or not re.fullmatch(r"[0-9]{1,12}", issue_type)):
            raise ValueError("reviewed site/project/issue type required")
        self.path, self.http, self.site = path, http, site.rstrip("/")
        self.project, self.issue_type, self.bot = project, issue_type, bot_account
        self.authorize, self.approved = authorize, approved
        with closing(self.connect()) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS operations (tenant TEXT, id TEXT, digest TEXT, fields TEXT, state TEXT, issue TEXT, PRIMARY KEY(tenant,id))")

    def connect(self):
        return sqlite3.connect(self.path, timeout=.5)

    def issue_key(self, value):
        if not isinstance(value, str) or not re.fullmatch(re.escape(self.project) + r"-[1-9][0-9]{0,12}", value):
            raise ValueError("issue outside allowed project")
        return value

    async def call(self, method, path, **kwargs):
        # http is a server-owned client with approved credentials, never supplied by an end user.
        async with asyncio.timeout(6):
            async with self.http.stream(method, self.site + path, timeout=4, follow_redirects=False, **kwargs) as response:
                raw = bytearray()
                async for part in response.aiter_bytes():
                    raw.extend(part)
                    if len(raw) > 200000:
                        raise ValueError("Jira response bound")
                return response.status_code, json.loads(raw)

    async def read(self, tenant, actor, key):
        self.issue_key(key)
        if await self.authorize(tenant, actor, "read", key) is not True:
            raise PermissionError("issue denied")
        status, data = await self.call("GET", "/rest/api/3/issue/" + key,
                                       params={"fields": "summary,description,project"})
        if status != 200 or data.get("key") != key or data["fields"]["project"]["key"] != self.project:
            raise PermissionError("issue unavailable")
        fields = data["fields"]
        description = plain(fields["description"]) if fields.get("description") else ""
        if not isinstance(fields["summary"], str) or len(fields["summary"]) > 255:
            raise ValueError("summary bound")
        if await self.authorize(tenant, actor, "read", key) is not True:
            raise PermissionError("permission changed")
        return {"key": key, "summary": fields["summary"], "description": description}

    def intent(self, tenant, operation, summary, description):
        if not re.fullmatch(r"[0-9a-f]{32}", operation) or not isinstance(summary, str) or not 1 <= len(summary) <= 200:
            raise ValueError("bounded operation and summary required")
        label = "lesson-op-" + hashlib.sha256(json.dumps([tenant, operation]).encode()).hexdigest()
        fields = {"project": {"key": self.project}, "issuetype": {"id": self.issue_type},
                  "summary": summary, "description": adf(description), "labels": [label]}
        encoded = json.dumps(fields, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(encoded.encode()).hexdigest()
        return fields, encoded, digest

    async def create(self, tenant, actor, operation, summary, description):
        fields, encoded, digest = self.intent(tenant, operation, summary, description)
        if (await self.authorize(tenant, actor, "create", self.project) is not True
                or await self.approved(tenant, actor, operation, digest) is not True):
            raise PermissionError("exact creation intent not approved")
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            old = db.execute("SELECT digest,state,issue FROM operations WHERE tenant=? AND id=?", (tenant, operation)).fetchone()
            if old:
                if old[0] != digest:
                    raise ValueError("operation intent changed")
                return {"state": old[1], "issue": old[2]}
            db.execute("INSERT INTO operations VALUES (?,?,?,?,'unknown',NULL)", (tenant, operation, digest, encoded))
        # Unknown is durable BEFORE sending: a crash at any point must not trigger another POST.
        try:
            status, data = await self.call("POST", "/rest/api/3/issue", json={"fields": fields})
            key = self.issue_key(data.get("key")) if status == 201 else None
            state = "done" if key else ("rejected" if status in {400, 401, 403, 404, 422} else "unknown")
        except Exception:
            return {"state": "unknown", "issue": None}
        with closing(self.connect()) as db, db:
            db.execute("UPDATE operations SET state=?,issue=? WHERE tenant=? AND id=?", (state, key, tenant, operation))
        return {"state": state, "issue": key}

    async def reconcile(self, tenant, actor, operation):
        if await self.authorize(tenant, actor, "reconcile", self.project) is not True:
            raise PermissionError("reconciliation denied")
        with closing(self.connect()) as db:
            row = db.execute("SELECT fields,state,issue FROM operations WHERE tenant=? AND id=?", (tenant, operation)).fetchone()
        if not row:
            raise ValueError("unknown local operation")
        if row[1] != "unknown":
            return {"state": row[1], "issue": row[2]}
        fields = json.loads(row[0])
        label = fields["labels"][0]
        status, data = await self.call("POST", "/rest/api/3/search/jql", json={
            "jql": f'project = "{self.project}" AND labels = "{label}"', "maxResults": 2,
            "fields": ["project", "issuetype", "summary", "description", "labels", "creator"]})
        issues = data.get("issues", [])
        if status != 200 or not isinstance(issues, list) or len(issues) != 1 or data.get("isLast") is not True:
            return {"state": "unknown", "issue": None}  # Empty search does not prove no creation.
        found = issues[0]
        remote = found.get("fields", {})
        if (remote.get("creator", {}).get("accountId") != self.bot
                or remote.get("project", {}).get("key") != self.project
                or remote.get("issuetype", {}).get("id") != self.issue_type
                or any(remote.get(k) != fields[k] for k in ("summary", "description", "labels"))):
            return {"state": "unknown", "issue": None}
        key = self.issue_key(found.get("key"))
        if await self.authorize(tenant, actor, "reconcile", self.project) is not True:
            raise PermissionError("permission changed")
        with closing(self.connect()) as db, db:
            db.execute("UPDATE operations SET state='done',issue=? WHERE tenant=? AND id=? AND state='unknown'",
                       (key, tenant, operation))
        return {"state": "done", "issue": key}
