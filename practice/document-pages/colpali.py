"""Actual local ColPali inference, opt-in and separate from the synthetic MaxSim lab."""
import io
from pathlib import Path


class Index:
    def __init__(self, model_directory):
        directory = Path(model_directory).resolve(strict=True)
        if not directory.is_dir() or not (directory/'config.json').is_file():
            raise ValueError('provisioned_model_directory_required')
        import torch
        from transformers import ColPaliForRetrieval, ColPaliProcessor
        self.torch = torch
        self.model = ColPaliForRetrieval.from_pretrained(str(directory), local_files_only=True,
            trust_remote_code=False, use_safetensors=True).eval()
        self.processor = ColPaliProcessor.from_pretrained(str(directory), local_files_only=True,
                                                          trust_remote_code=False)
        self.rows = []

    def add(self, page, *, tenant, readers):
        from PIL import Image
        if len(self.rows) >= 8 or len(page['image']) > 4_000_000:
            raise ValueError('visual_index_capacity')
        if any(p['number'] == page['number'] and p['version'] == page['version'] and t == tenant
               for p, t, r, e in self.rows):
            raise ValueError('duplicate_page')
        with Image.open(io.BytesIO(page['image'])) as image:
            if image.width * image.height > 4_000_000 or image.format != 'PNG':
                raise ValueError('bounded_render_required')
            inputs = self.processor(images=[image.convert('RGB')], return_tensors='pt')
        with self.torch.inference_mode():
            embeddings = self.model(**inputs).embeddings.detach().cpu()
        if embeddings.ndim != 3 or embeddings.shape[0] != 1 or embeddings.shape[1] > 4096 or not self.torch.isfinite(embeddings).all():
            raise ValueError('multivector_contract')
        self.rows.append((page, tenant, frozenset(readers), embeddings))

    def search(self, question, *, tenant, user, current_version, limit=3):
        if not isinstance(question, str) or not 1 <= len(question) <= 500 or type(limit) is not int or not 1 <= limit <= 4:
            raise ValueError('query_budget')
        candidates = [(p, e) for p, t, r, e in self.rows
                      if t == tenant and user in r and p['version'] == current_version]
        if not candidates:
            return []
        inputs = self.processor(text=[question], return_tensors='pt')
        with self.torch.inference_mode():
            query = self.model(**inputs).embeddings.detach().cpu()
            scored = [(float(self.processor.score_retrieval(query, embedding)[0, 0]), page)
                      for page, embedding in candidates]
        if any(not self.torch.isfinite(self.torch.tensor(score)) for score, _ in scored):
            raise ValueError('invalid_score')
        return [page for score, page in sorted(scored, key=lambda item: (-item[0], item[1]['number']))[:limit]]
