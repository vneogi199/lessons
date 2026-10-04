"""Synthetic document observations, classification and immutable page identity."""
from dataclasses import dataclass
from hashlib import sha256


@dataclass(frozen=True)
class Block:
    block_id: str
    kind: str
    text: str
    box: tuple[float, float, float, float]


@dataclass(frozen=True)
class Page:
    source: str
    version: str
    number: int
    blocks: tuple[Block, ...]
    reading_order: tuple[str, ...]
    order_evidence: str

    def __post_init__(self):
        if (not self.source or len(self.version) != 64
                or any(c not in "0123456789abcdef" for c in self.version)
                or type(self.number) is not int or self.number < 1):
            raise ValueError("source, SHA-256 version and one-based page required")
        ids = [b.block_id for b in self.blocks]
        if len(ids) != len(set(ids)) or len(ids) > 1000:
            raise ValueError("duplicate block IDs or excessive blocks")
        if (len(self.reading_order) != len(ids) or set(self.reading_order) != set(ids)
                or not self.order_evidence):
            raise ValueError("explicit reading order and evidence required")
        for block in self.blocks:
            if not block.block_id or block.kind not in {
                "native_text", "scan", "form", "table", "chart"
            }:
                raise ValueError("unknown block")
            x0, y0, x1, y1 = block.box
            if not (0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1):
                raise ValueError("normalized top-left coordinates required")

    @property
    def identity(self):
        return self.source, self.version, self.number


def classify(page):
    kinds = {b.kind for b in page.blocks}
    labels = kinds & {"form", "table", "chart"}
    if "native_text" in kinds and "scan" in kinds:
        labels.add("mixed")
    elif "scan" in kinds:
        labels.add("scanned")
    elif "native_text" in kinds:
        labels.add("native")
    else:
        labels.add("unknown_text_source")
    return frozenset(labels)


def fixtures():
    # This digest identifies a synthetic source descriptor, not a real PDF.
    version = sha256(b"synthetic-handbook-v1; pages=6").hexdigest()
    kinds = [("native_text",), ("scan",), ("native_text", "scan"),
             ("native_text", "form"), ("native_text", "table"),
             ("scan", "chart")]
    pages = []
    for number, entries in enumerate(kinds, 1):
        blocks = tuple(Block(f"b{i}", kind, "synthetic label" if kind == "native_text" else "",
                             (0.1, 0.1 + i * 0.4, 0.9, 0.4 + i * 0.4))
                       for i, kind in enumerate(entries))
        pages.append(Page("synthetic-handbook", version, number, blocks,
                          tuple(b.block_id for b in blocks),
                          "Fixture author specified top-to-bottom order; no parser inference"))
    return tuple(pages)
