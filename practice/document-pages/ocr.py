"""Bounded Linux subprocess boundary for approved PDF bytes. No engine downloads."""
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile


def words(tsv, width, height):
    if len(tsv) > 1_000_000 or width <= 0 or height <= 0:
        raise ValueError('ocr_bounds')
    result = []
    for row in csv.DictReader(io.StringIO(tsv), delimiter='\t'):
        if row['level'] != '5' or not row['text'].strip():
            continue
        confidence = float(row['conf'])
        x, y, w, h = (int(row[k]) for k in ('left', 'top', 'width', 'height'))
        if not math.isfinite(confidence) or not 0 <= confidence <= 100 or not (
                0 <= x < x+w <= width and 0 <= y < y+h <= height):
            raise ValueError('invalid_ocr_word')
        if len(row['text']) > 500 or len(result) >= 2000:
            raise ValueError('ocr_capacity')
        result.append({'text': row['text'], 'confidence': confidence,
            'line': [int(row[k]) for k in ('block_num', 'par_num', 'line_num')],
            'box': [x/width, y/height, (x+w)/width, (y+h)/height]})
    return result


def extract(pdf, *, tesseract, grayscale=False):
    if sys.platform != 'linux':
        raise RuntimeError('Use the approved Linux worker environment')
    if not isinstance(pdf, bytes) or not pdf.startswith(b'%PDF-') or len(pdf) > 10_000_000:
        raise ValueError('bounded_pdf_required')
    executable = Path(tesseract).resolve(strict=True)
    if not executable.is_file() or not os.access(executable, os.X_OK) or type(grayscale) is not bool:
        raise ValueError('approved_engine_required')
    with tempfile.TemporaryDirectory(prefix='lesson-ocr-') as directory:
        source = Path(directory)/'source.pdf'
        source.write_bytes(pdf)
        with tempfile.TemporaryFile() as output, tempfile.TemporaryFile() as errors:
            process = subprocess.Popen([sys.executable, '-I', str(Path(__file__).with_name('ocr_worker.py')),
                str(source), str(executable), 'gray' if grayscale else 'color'],
                stdout=output, stderr=errors, start_new_session=True,
                env={'PATH': '/usr/bin:/bin', 'OMP_THREAD_LIMIT': '1', 'LANG': 'C.UTF-8'})
            try:
                process.wait(timeout=30)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
                raise TimeoutError('document_worker_timeout') from None
            if process.returncode or output.tell() > 2_000_000:
                raise ValueError('document_worker_failed')
            output.seek(0)
            pages = json.load(output)
        version = hashlib.sha256(pdf).hexdigest()
        for page in pages:
            image = Path(directory)/f"page-{page['number']}.png"
            if image.stat().st_size > 4_000_000:
                raise ValueError('image_budget')
            page['image'] = image.read_bytes()
            page['version'] = version
            page['words'] = words(page.pop('tsv'), page['width'], page['height'])
            confidence = sum(w['confidence'] for w in page['words']) / max(len(page['words']), 1)
            page['quality'] = 'review_required' if not page['words'] or confidence < 60 else 'candidate'
            page['mean_confidence'] = confidence
        return pages
