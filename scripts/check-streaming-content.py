"""Static content and Python syntax checks; no clients, brokers or labs run."""
import ast
from html.parser import HTMLParser
from pathlib import Path


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.blocks = []
        self.code = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            assert attrs["id"] not in self.ids
            self.ids.add(attrs["id"])
        if tag == "a":
            self.links.append(attrs.get("href", ""))
        if tag == "code":
            self.code = ""

    def handle_data(self, data):
        if self.code is not None:
            self.code += data

    def handle_endtag(self, tag):
        if tag == "code" and self.code is not None:
            self.blocks.append(self.code)
            self.code = None


root = Path(__file__).resolve().parent.parent
path = root / "reference/streaming-platform-practice.html"
page = Page()
page.feed(path.read_text())
assert {"python-kafka", "streams", "spark", "grafana", "aws", "docker", "kubernetes", "capstone"} <= page.ids
for link in page.links:
    if link.startswith("https://"):
        continue
    target, _, anchor = link.partition("#")
    if target:
        assert (path.parent / target).is_file(), link
    else:
        assert anchor in page.ids, link
python_blocks = [code for code in page.blocks if code.startswith(("# Configuration", "# PySpark"))]
assert len(python_blocks) == 2
for code in python_blocks:
    ast.parse(code)
assert "persist_once(message.value())" in python_blocks[0]
assert python_blocks[0].index("persist_once(message.value())") < python_blocks[0].index("consumer.commit(")
print("Streaming guide: sections, local paths and Python syntax checked; no lab execution.")
