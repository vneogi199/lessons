"""Child entry point. Run only through ocr.extract in an approved Linux sandbox."""
import json
from pathlib import Path
import resource
import subprocess
import sys


def main():
    resource.setrlimit(resource.RLIMIT_AS, (2_000_000_000, 2_000_000_000))
    resource.setrlimit(resource.RLIMIT_CPU, (20, 20))
    resource.setrlimit(resource.RLIMIT_FSIZE, (20_000_000, 20_000_000))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    import pymupdf
    source, executable, mode = sys.argv[1:]
    document = pymupdf.open(source)
    if document.needs_pass or not 1 <= len(document) <= 8:
        raise ValueError('encrypted_or_page_budget')
    pages = []
    for index, page in enumerate(document):
        width, height = page.rect.width * 1.5, page.rect.height * 1.5
        if not 0 < width * height <= 4_000_000:
            raise ValueError('pixel_budget')
        image = Path(source).with_name(f'page-{index+1}.png')
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False,
                                 colorspace=pymupdf.csGRAY if mode == 'gray' else pymupdf.csRGB)
        pixmap.save(image)
        result = subprocess.run([executable, str(image), 'stdout', '-l', 'eng', '--psm', '3', 'tsv'],
                                capture_output=True, timeout=10, check=True)
        if len(result.stdout) > 200000:
            raise ValueError('tsv_budget')
        pages.append({'number': index+1, 'width': pixmap.width, 'height': pixmap.height,
            'rotation': page.rotation, 'coordinate_space': 'rendered_top_left_normalized',
            'preprocessing': mode, 'tsv': result.stdout.decode('utf-8')})
    document.close()
    print(json.dumps(pages))


if __name__ == '__main__':
    main()
