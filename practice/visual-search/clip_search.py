"""Small exact image index with an optional approved local CLIP encoder."""
from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
from math import sqrt, isfinite
from pathlib import Path


def unit(vector):
    if not vector or len(vector) > 4096 or any(not isfinite(x) for x in vector):
        raise ValueError("invalid embedding")
    norm = sqrt(sum(x * x for x in vector))
    if norm == 0:
        raise ValueError("zero embedding")
    return tuple(x / norm for x in vector)


class LocalCLIP:
    def __init__(self, directory, *, revision, device="cpu"):
        from transformers import CLIPModel, CLIPProcessor
        import torch
        path = Path(directory).resolve()
        if not path.is_dir() or not revision:
            raise ValueError("approved local checkpoint and revision required")
        self.contract = f"clip:{revision}:processor-same-directory:cosine-v1"
        self.torch = torch
        self.model = CLIPModel.from_pretrained(str(path), local_files_only=True,
            trust_remote_code=False, use_safetensors=True).to(device).eval()
        self.processor = CLIPProcessor.from_pretrained(str(path), local_files_only=True)
        self.device = device

    def __call__(self, image_bytes):
        from PIL import Image
        if not isinstance(image_bytes, bytes) or not 1 <= len(image_bytes) <= 5_000_000:
            raise ValueError("image byte bound")
        with Image.open(BytesIO(image_bytes)) as image:
            if image.format not in {"PNG", "JPEG"} or image.width * image.height > 4_000_000:
                raise ValueError("image format or pixel bound")
            image.load()
            inputs = self.processor(images=image.convert("RGB"), return_tensors="pt").to(self.device)
        with self.torch.inference_mode():
            features = self.model.get_image_features(**inputs)
        return unit(features[0].float().cpu().tolist())


@dataclass(frozen=True)
class Record:
    image_id: str
    tenant: str
    version: str
    label: str
    digest: str
    vector: tuple[float, ...]


class ImageIndex:
    def __init__(self, encoder, contract):
        if not contract:
            raise ValueError("model/processor contract required")
        self.encoder, self.contract, self.records, self.dimension = encoder, contract, {}, None

    def upsert(self, image_id, tenant, version, label, image_bytes):
        if (not all(isinstance(x, str) and 1 <= len(x) <= 200 for x in (image_id, tenant, version, label))
                or not isinstance(image_bytes, bytes) or not 1 <= len(image_bytes) <= 5_000_000):
            raise ValueError("invalid image record")
        key = tenant, image_id
        if key not in self.records and len(self.records) >= 100:
            raise ValueError("exact index capacity")
        vector = unit(self.encoder(image_bytes))
        if self.dimension is not None and len(vector) != self.dimension:
            raise ValueError("embedding contract changed; rebuild index")
        self.dimension = len(vector)
        self.records[key] = Record(image_id, tenant, version, label, sha256(image_bytes).hexdigest(), vector)

    def delete(self, tenant, image_id):
        self.records.pop((tenant, image_id), None)

    def search(self, tenant, image_bytes, *, allowed, contract, limit=3):
        if contract != self.contract or type(limit) is not int or not 1 <= limit <= 10:
            raise ValueError("search contract")
        if not isinstance(image_bytes, bytes) or not 1 <= len(image_bytes) <= 5_000_000:
            raise ValueError("query image bound")
        query = unit(self.encoder(image_bytes))
        if self.dimension is not None and len(query) != self.dimension:
            raise ValueError("query dimension mismatch")
        candidates = [r for r in self.records.values() if r.tenant == tenant and allowed(r) is True]
        ranked = sorted(((sum(a * b for a, b in zip(query, r.vector)), r) for r in candidates),
                        key=lambda pair: (-pair[0], pair[1].image_id))
        # Return labelled results, never claim the score is calibrated probability.
        return [{"image_id": r.image_id, "version": r.version, "label": r.label,
                 "sha256": r.digest, "cosine": score} for score, r in ranked[:limit] if allowed(r) is True]
