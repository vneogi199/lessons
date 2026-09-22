"""Check authored extension fixtures and wiring, without installing/importing SDKs."""
import ast
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "reference/ai-data-extensions.html"
EXPECTED = {
    "chromadb": "0599", "neo4j": "0602", "crewai": "0610",
    "pydantic-ai": "0588", "duckdb": "0604", "graphrag": "0602",
    "kag": "0602", "lightrag": "0602", "self-rag": "0598",
    "hyde": "0596", "active-web-search": "0598", "mongodb": "0396",
}


class Reference(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.blocks = []
        self.mode = None
        self.code = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a":
            self.links.append(attrs.get("href", ""))
        if tag == "code" and "data-python" in attrs:
            self.mode = attrs["data-python"]
            self.code = []

    def handle_data(self, data):
        if self.mode:
            self.code.append(data)

    def handle_endtag(self, tag):
        if tag == "code" and self.mode:
            self.blocks.append((self.mode, "".join(self.code)))
            self.mode = None


def main():
    page = Reference()
    page.feed(PAGE.read_text())
    assert len(page.ids) == len(set(page.ids)), "duplicate anchors"
    assert set(page.ids) == set(EXPECTED), "missing or unexpected topics"
    for href in page.links:
        if href.startswith("#"):
            assert href[1:] in page.ids, href
    manifest = json.loads((ROOT / "lessons/manifest.json").read_text())
    lessons = {lesson["number"]: lesson for lesson in manifest["lessons"]}
    for topic, number in EXPECTED.items():
        lesson = (ROOT / lessons[number]["path"]).read_text()
        assert f'../reference/ai-data-extensions.html#{topic}' in lesson, topic
    offline = integration = 0
    for index, (mode, source) in enumerate(page.blocks, 1):
        tree = ast.parse(source, filename=f"{PAGE.name}:block{index}")
        assert mode in {"offline", "integration"}, mode
        if mode == "offline":
            assert any(isinstance(node, ast.Assert) for node in ast.walk(tree))
            # These are trusted repository fixtures, not arbitrary uploaded code.
            # External-library recipes are parsed above but NEVER executed here.
            exec(compile(tree, f"{PAGE.name}:block{index}", "exec"), {})
            offline += 1
        else:
            integration += 1
    assert (offline, integration) == (5, 4), (offline, integration)
    print(f"12 topics linked; {offline} offline fixtures passed; "
          f"{integration} Python integration recipes syntax-checked only.")


if __name__ == "__main__":
    main()
