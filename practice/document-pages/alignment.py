"""Align exact text offsets to source boxes, then rotate and scale for display."""
from dataclasses import dataclass
from html import escape
from math import isfinite


@dataclass(frozen=True)
class Word:
    start: int
    end: int
    text: str
    box: tuple[float, float, float, float]


@dataclass(frozen=True)
class TextPage:
    identity: tuple[str, str, int]
    text: str
    width: float
    height: float
    words: tuple[Word, ...]
    coordinates: str = "unrotated-top-left-points"


def align(page, identity, start, end):
    if (page.identity != identity or page.coordinates != "unrotated-top-left-points"
            or not all(isfinite(v) and 0 < v <= 100_000 for v in (page.width, page.height))
            or not 0 <= start < end <= len(page.text) or len(page.text) > 100_000):
        raise ValueError("identity, coordinate or chunk contract mismatch")
    selected = []
    covered = set()
    last_end = 0
    for word in page.words:
        if (not 0 <= word.start < word.end <= len(page.text) or word.start < last_end
                or page.text[word.start:word.end] != word.text):
            raise ValueError("word offsets do not match source text")
        last_end = word.end
        x0, y0, x1, y1 = word.box
        if not (0 <= x0 < x1 <= page.width and 0 <= y0 < y1 <= page.height):
            raise ValueError("source box outside page")
        if word.start < end and word.end > start:
            # Full word box is a conservative bound for a partial-word chunk.
            selected.append(word.box)
            covered.update(range(max(start, word.start), min(end, word.end)))
    if any(not page.text[i].isspace() and i not in covered for i in range(start, end)):
        raise ValueError("unmapped non-whitespace text")
    return tuple(selected)


def display_box(box, width, height, *, rotation=0, scale=1):
    if (rotation not in (0, 90, 180, 270) or not isfinite(scale) or not 0 < scale <= 10
            or not all(isfinite(v) and v > 0 for v in (width, height))):
        raise ValueError("invalid display transform")
    x0, y0, x1, y1 = box
    if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
        raise ValueError("invalid source box")
    def transform(x, y):
        if rotation == 90:
            return height - y, x
        if rotation == 180:
            return width - x, height - y
        if rotation == 270:
            return y, width - x
        return x, y
    points = [transform(x, y) for x in (x0, x1) for y in (y0, y1)]
    return (min(p[0] for p in points) * scale, min(p[1] for p in points) * scale,
            max(p[0] for p in points) * scale, max(p[1] for p in points) * scale)


def overlay(page, identity, start, end, *, rotation=0, scale=1):
    boxes = align(page, identity, start, end)
    w, h = (page.height, page.width) if rotation in (90, 270) else (page.width, page.height)
    # Validate even for whitespace-only chunks.
    display_box((0, 0, page.width, page.height), page.width, page.height,
                rotation=rotation, scale=scale)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w*scale} {h*scale}" role="img">',
             f'<title>{escape(str(identity))}: source words gray, selected chunk blue</title>',
             f'<rect width="{w*scale}" height="{h*scale}" fill="white"/>']
    for group, color in (([word.box for word in page.words], "#777"), (boxes, "#0674d8")):
        for box in group:
            x0, y0, x1, y1 = display_box(box, page.width, page.height, rotation=rotation, scale=scale)
            parts.append(f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="none" stroke="{color}"/>')
    return "".join(parts) + "</svg>"
