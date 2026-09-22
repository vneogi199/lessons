"""Check numerical lessons; optionally execute only already-installed libraries."""
import argparse
import ast
import importlib.util
import json
from pathlib import Path
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--run-installed", action="store_true")
args = parser.parse_args()
Reference = runpy.run_path(str(ROOT / "scripts/check-ai-data-extensions.py"))["Reference"]
page = Reference()
page.feed((ROOT / "reference/numerical-data-engineering.html").read_text())
expected = {"numpy-arrays", "vectorization", "numpy-performance", "pandas-windows", "polars", "sql-parity"}
assert set(page.ids) == expected and len(page.ids) == 6
manifest = json.loads((ROOT / "lessons/manifest.json").read_text())
lesson = next(item for item in manifest["lessons"] if item["number"] == "0285")
links = (ROOT / lesson["path"]).read_text()
for anchor in expected:
    assert f"../reference/numerical-data-engineering.html#{anchor}" in links
counts = {}
executed = {}
for mode, code in page.blocks:
    assert mode in {"numpy", "pandas", "polars", "offline"}
    tree = ast.parse(code)
    assert any(isinstance(node, ast.Assert) or
               (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
                and node.func.id == "assert_frame_equal") for node in ast.walk(tree))
    counts[mode] = counts.get(mode, 0) + 1
    if mode == "offline" or (args.run_installed and importlib.util.find_spec(mode)):
        subprocess.run([sys.executable, "-c", code], check=True, timeout=30)
        executed[mode] = executed.get(mode, 0) + 1
assert counts == {"numpy": 4, "pandas": 2, "polars": 2, "offline": 1}, counts
print("6 linked sections; parsed blocks:", counts, "executed:", executed)
print("Unexecuted library blocks are syntax-only, not runtime-verified. Nothing installed.")
