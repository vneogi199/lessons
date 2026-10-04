# Search for a similar image with a local CLIP encoder

`LocalCLIP` uses Transformers `CLIPModel`, its matching processor and Torch inference mode. It accepts only an existing local checkpoint directory, requires safetensors and uses local-only loading. It does not download weights or enable remote model code. Supply an approved revision and record artifact hashes, library versions, processor configuration, device and dtype before a real run.

`ImageIndex` stores at most 100 labelled images in memory. It normalizes embeddings and ranks by exact cosine similarity. Each record carries tenant, image ID, content hash and source version. Query and index contracts must match. Changing model, preprocessing or embedding dimensions requires re-embedding the corpus. The caller supplies current permission/version checks; deleted/revoked records must be denied before ranking and again before return.

Worked fixture: query vector `(1,0)` is closer to an invoice vector `(1,0.1)` than to a cat vector `(0,1)`. Returned results retain labels and provenance. These are fake embeddings used to test ranking mechanics. They are not measured CLIP outputs and say nothing about model accuracy.

For approved local inference, construct `encoder = LocalCLIP(local_directory, revision=approved_revision)`, then `index = ImageIndex(encoder, encoder.contract)`. Load synthetic PNG/JPEG bytes through your controlled file boundary, call `upsert`, then `search` with the same contract and a current permission callback. The adapter caps file bytes and pixels; a production image decoder still belongs in an isolated worker with memory and time limits. No inference is performed here.

Identity, similarity and relevance differ. Equal byte hashes establish byte identity. High cosine similarity reflects the encoder's representation. Task relevance requires labels for the actual question. Two invoices can look alike while belonging to different customers or dates. Similarity must never bypass permissions or choose an exact financial record by appearance alone.

Evaluation: label relevant/not-relevant pairs before inspecting scores. Include duplicate bytes, visually similar wrong documents and different renderings of the same page. Record recall at k and ranking failures on held-out source families. A cosine value is not a calibrated probability. Recheck protected query images too; local processing does not grant the caller permission to upload them.

Tests are supplied and unexecuted. They use fake vectors and require no model libraries. After approval run `python3 -m unittest -v` from this directory. Actual inference needs already-provisioned Transformers, Torch, Pillow and approved local weights. Primary source: [CLIP model API](https://huggingface.co/docs/transformers/model_doc/clip). Ask your teacher to review a false-positive pair before setting a threshold.
