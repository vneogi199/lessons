"""Validate syllabus reference links and trusted offline fixtures; install nothing."""
import ast
import html
import json
import re
import runpy
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
Reference = runpy.run_path(str(ROOT / "scripts/check-ai-data-extensions.py"))["Reference"]
PAGES = {
    "api-cloud-delivery-labs.html": 7,
    "retrieval-document-labs.html": 8,
    "enterprise-security-labs.html": 7,
    "agent-operations-capstones.html": 7,
    "ai-engineer-practice.html": 6,
}
manifest = json.loads((ROOT / "lessons/manifest.json").read_text())
lesson_html = "\n".join((ROOT / item["path"]).read_text() for item in manifest["lessons"])
offline = integration = 0
for name, count in PAGES.items():
    source = (ROOT / "reference" / name).read_text()
    page = Reference()
    page.feed(source)
    assert len(page.ids) == len(set(page.ids)) == count, (name, page.ids)
    for anchor in page.ids:
        assert f"../reference/{name}#{anchor}" in lesson_html, (name, anchor)
    for href in page.links:
        if href.startswith("#"):
            assert href[1:] in page.ids, (name, href)
    for index, (mode, code) in enumerate(page.blocks, 1):
        tree = ast.parse(code, filename=f"{name}:{index}")
        assert mode in {"offline", "integration"}, mode
        if mode == "offline":
            assert any(isinstance(node, ast.Assert) for node in ast.walk(tree))
            subprocess.run([sys.executable, "-I", "-c", code], check=True, timeout=15)
            offline += 1
        else:
            integration += 1
    for code in re.findall(r'<code data-json="check">(.*?)</code>', source, re.S):
        json.loads(html.unescape(code))
print(f"{sum(PAGES.values())} sections linked; {offline} offline fixtures passed; "
      f"{integration} integration recipes Python-syntax checked only.")
print("Cloud, SDK, YAML, SQL, Cypher and Colang integration execution not performed.")
