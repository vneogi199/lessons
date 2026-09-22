"""Validate extension wiring and trusted offline examples; never import SDKs."""
import ast
import json
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
Reference = runpy.run_path(str(ROOT / "scripts/check-ai-data-extensions.py"))["Reference"]
EXPECTED = {
    "rag": "0594", "pinecone": "0599", "ragas": "0597",
    "parent-child": "0595", "pageindex": "0598", "chain-of-thought": "0587",
    "deep-agents": "0610", "openai-agents": "0603", "claude-agents": "0603",
    "episodic-memory": "0604", "kill-switch": "0611", "gunicorn": "0342",
    "saml": "0416", "etl-elt": "0595", "vllm": "0586",
}


def main():
    page = Reference()
    page.feed((ROOT / "reference/enterprise-ai-practice.html").read_text())
    assert len(page.ids) == len(set(page.ids)), "duplicate anchor"
    assert set(page.ids) == set(EXPECTED), "topic mismatch"
    for link in page.links:
        if link.startswith("#"):
            assert link[1:] in page.ids, link
    manifest = json.loads((ROOT / "lessons/manifest.json").read_text())
    lessons = {lesson["number"]: lesson for lesson in manifest["lessons"]}
    for topic, number in EXPECTED.items():
        assert f'../reference/enterprise-ai-practice.html#{topic}' in (
            ROOT / lessons[number]["path"]).read_text(), topic
    counts = {"offline": 0, "integration": 0}
    for index, (mode, source) in enumerate(page.blocks, 1):
        name = f"enterprise-ai-practice:block{index}"
        tree = ast.parse(source, filename=name)
        assert mode in counts, mode
        if mode == "offline":
            assert any(isinstance(node, ast.Assert) for node in ast.walk(tree))
            exec(compile(tree, name, "exec"), {})
        counts[mode] += 1
    assert counts == {"offline": 4, "integration": 4}, counts
    print("15 topics linked; 4 offline fixtures passed; 4 SDK recipes syntax-checked only.")


if __name__ == "__main__":
    main()
