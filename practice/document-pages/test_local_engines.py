"""Explicit existing-environment checks. Skipped unless the operator supplies assets."""
import os
import sys
import pytest


@pytest.mark.skipif(sys.platform != 'linux' or not os.environ.get('LESSON_TESSERACT'),
                    reason='Approved Linux OCR environment not selected')
def test_actual_render_and_ocr():
    from synthetic_pdf import fixture
    from ocr import extract
    pages = extract(fixture(), tesseract=os.environ['LESSON_TESSERACT'])
    assert [p['number'] for p in pages] == [1, 2]
    assert all(p['words'] and p['image'].startswith(b'\x89PNG') for p in pages)
    assert len({p['version'] for p in pages}) == 1


@pytest.mark.skipif(not os.environ.get('LESSON_COLPALI_MODEL'), reason='Approved local model not selected')
def test_actual_multivector_inference():
    from colpali import Index
    from test_document_rag import bundle
    index, source = Index(os.environ['LESSON_COLPALI_MODEL']), bundle()
    index.add(source.pages[0], tenant='tenant', readers={'reader'})
    assert index.search('policy', tenant='tenant', user='reader', current_version=source.version)
    assert index.search('policy', tenant='tenant', user='other', current_version=source.version) == []
    assert index.search('policy', tenant='tenant', user='reader', current_version='b'*64) == []
