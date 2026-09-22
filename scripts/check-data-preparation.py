"""Check teaching examples without installing dependencies or processing uploads."""
import argparse
import ast
import html
import importlib.util
import json
from pathlib import Path
import re
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "reference/data-preparation-and-terminal.html"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-pandas", action="store_true",
                        help="Execute Pandas blocks in order using an existing installation")
    args = parser.parse_args()
    if args.run_pandas and importlib.util.find_spec("pandas") is None:
        raise SystemExit("Pandas is unavailable; nothing installed. Use the syntax-only default.")
    # Reuse the existing HTML code/anchor reader without invoking its main().
    Reference = runpy.run_path(str(ROOT / "scripts/check-ai-data-extensions.py"))["Reference"]
    source = PAGE.read_text()
    page = Reference()
    page.feed(source)
    expected = {"pandas": ["0285"], "pdf": ["0595"], "terminal": ["0001"],
                "async-executors": ["0289", "0291"], "linux-users": ["0508"]}
    assert set(page.ids) == set(expected) and len(page.ids) == 5
    manifest = json.loads((ROOT / "lessons/manifest.json").read_text())
    lessons = {item["number"]: item for item in manifest["lessons"]}
    for anchor, numbers in expected.items():
        for number in numbers:
            lesson = (ROOT / lessons[number]["path"]).read_text()
            assert f"../reference/{PAGE.name}#{anchor}" in lesson
    namespace = {}
    counts = {"pandas": 0, "pdf": 0, "offline": 0}
    for index, (mode, code) in enumerate(page.blocks, 1):
        assert mode in counts, mode
        tree = ast.parse(code, filename=f"{PAGE.name}:{index}")
        counts[mode] += 1
        if mode == "pandas" and args.run_pandas:
            exec(compile(tree, f"{PAGE.name}:{index}", "exec"), namespace)
        elif mode == "offline":
            assert any(isinstance(node, ast.Assert) for node in ast.walk(tree))
            subprocess.run([sys.executable, "-c", code],
                           timeout=20, check=True)
    assert counts == {"pandas": 9, "pdf": 1, "offline": 2}, counts
    shell = re.findall(r'<code data-shell="check">(.*?)</code>', source, flags=re.S)
    assert len(shell) == 1
    result = subprocess.run(["bash", "--noprofile", "--norc"], input=html.unescape(shell[0]),
                            text=True, capture_output=True, timeout=10, check=True)
    assert result.stdout.strip() == "Terminal fixture passed", result.stdout
    assert not result.stderr, result.stderr
    recipes = re.findall(r'<code data-shell="recipe">(.*?)</code>', source, flags=re.S)
    assert len(recipes) == 1
    subprocess.run(["bash", "--noprofile", "--norc", "-n"],
                   input=html.unescape(recipes[0]), text=True, timeout=10, check=True)
    print("6 lesson links checked; 12 Python blocks parsed; 2 offline fixtures passed.")
    print("Read-only Bash fixture passed; Linux administration recipe syntax-checked only.")
    if args.run_pandas:
        print(f"9 Pandas blocks executed with pandas {namespace['pd'].__version__}.")
    else:
        print("Pandas execution SKIPPED; use --run-pandas only with an existing installation.")
    print("PDF extraction/OCR and Linux-specific system operations remain unexecuted.")


if __name__ == "__main__":
    main()
