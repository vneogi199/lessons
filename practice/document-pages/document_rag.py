"""PDF-to-page RAG assembly. Transport is injected; no provider client at import."""
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'model-boundaries'))
from vision import Page, answer_pages
from ocr import extract


@dataclass(frozen=True)
class Bundle:
    source: str
    tenant: str
    version: str
    readers: frozenset[str]
    pages: tuple[dict, ...]
    header_links: dict[int, tuple[int, ...]]


def ingest(pdf, *, source, tenant, readers, header_links, tesseract):
    pages = extract(pdf, tesseract=tesseract)
    bundle = Bundle(source, tenant, sha256(pdf).hexdigest(), frozenset(readers), tuple(pages), header_links)
    validate(bundle)
    return bundle


def validate(bundle):
    if not 1 <= len(bundle.pages) <= 8:
        raise ValueError('page_budget')
    numbers = {p['number'] for p in bundle.pages}
    if numbers != set(range(1, len(bundle.pages)+1)) or len(numbers) != len(bundle.pages):
        raise ValueError('missing_or_duplicate_pages')
    if any(p['version'] != bundle.version or p['coordinate_space'] != 'rendered_top_left_normalized'
           for p in bundle.pages):
        raise ValueError('mixed_versions_or_coordinates')
    if any(page not in numbers or not isinstance(headers, tuple) or len(headers) > 4
           or any(h not in numbers or h >= page for h in headers)
           for page, headers in bundle.header_links.items()):
        raise ValueError('invalid_header_dependencies')


async def ask(bundle, question, *, tenant, user, current, transport, visual_index=None, budget=12000):
    validate(bundle)
    if not isinstance(question, str) or not 1 <= len(question) <= 2000:
        raise ValueError('question_bounds')
    def permitted(page=None):
        latest = current(bundle.source)
        return (latest is not None and latest.version == bundle.version and latest.tenant == tenant
                and bundle.tenant == tenant and user in latest.readers and user in bundle.readers)
    if not permitted():
        raise PermissionError('document_forbidden_or_stale')
    if visual_index is not None:
        selected = visual_index.search(question, tenant=tenant, user=user,
                                       current_version=bundle.version, limit=2)
    else:
        terms = set(question.casefold().split())
        ranked = [(len(terms & {w['text'].casefold() for w in p['words']}), p) for p in bundle.pages]
        selected = [p for score, p in sorted(ranked, key=lambda item: (-item[0], item[1]['number']))
                    if score and p['quality'] == 'candidate'][:2]
    if not selected:
        return {'status': 'insufficient_evidence', 'answer': None}
    by_number = {p['number']: p for p in bundle.pages}
    chosen = {p['number'] for p in selected}
    if not chosen <= set(by_number) or any(p['version'] != bundle.version for p in selected):
        raise ValueError('retriever_returned_foreign_page')
    pending = list(chosen)
    while pending:
        for header in bundle.header_links.get(pending.pop(), ()):
            if header not in chosen:
                chosen.add(header)
                pending.append(header)
    if len(chosen) > 4:
        raise ValueError('multi_page_context_budget')
    images = [Page(f'p{n}', bundle.version, n, (0., 0., 1., 1.), by_number[n]['image']) for n in sorted(chosen)]
    result = await answer_pages(transport, question, images, permitted, budget=budget)
    result['source'] = bundle.source
    result['coordinate_space'] = 'rendered_top_left_normalized'
    return result
