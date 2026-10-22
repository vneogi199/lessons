# Audio/video, fine-tuning and platform practice

Start with the linked explanations, not the commands:

- [Audio/video evidence](../../reference/audio-video-engineering.html)
- [Fine-tuning](../../reference/fine-tuning-lab.html)
- [Managed platform decisions](../../reference/managed-ai-platforms.html)

## Offline work first

From the repository root:

```sh
python3 -B -m unittest discover -s practice/ai-specializations -v
```

These tests cover split validation, completion-only loss masks, exact-label scoring
and timestamp overlap. They do not train a model or transcribe a recording.

For the timeline demo, from this directory:

```sh
python3 -B -c 'from core import overlapping_frames; print(overlapping_frames(12000, 15000, [14000, 20000]))'
```

Expected `[14000]`: the 14-second frame overlaps the 12–15-second utterance.
These are invented metadata records, not decoded media or semantic evidence.

## Optional local LoRA experiment

Prerequisites: an approved existing environment with compatible PyTorch,
Transformers and PEFT; a small local causal model with safetensors weights,
tokenizer and at least 512-token context; enough memory and explicit compute
approval. Nothing is installed or downloaded by this package. Stop if prerequisites
are missing. Do not use untrusted pickled weights or custom model code.

The code is a source-reviewed integration recipe, not runtime-certified training.
The default `q_proj,v_proj` modules fit some architectures; inspect your model.
The plain completion prompt is intentional and identical in both comparisons.
For a chat-specific checkpoint, adapt and test the chat template and loss boundaries
consistently for training and inference; do not mix formats mid-experiment.

`cases.jsonl` has 12 public synthetic examples. It is enough to inspect plumbing,
not to learn or certify a useful classifier. Replace it with an authorized labelled
dataset before making performance claims. The validator inspects all split metadata
but only training examples are used for updates or in-context examples. Human review
must catch paraphrase leakage and incorrect labels beyond the mechanical checks.

From this directory, substitute a real local model path. These commands are future
operator steps, not commands executed in this curriculum update:

```sh
python3 -B local_lora.py predict --model /approved/local/model --out baseline-validation.json
python3 -B local_lora.py train --model /approved/local/model --out adapter-run-1 --steps 20
python3 -B local_lora.py predict --model /approved/local/model --adapter adapter-run-1 --out tuned-validation.json
```

Each output must be new; the script refuses to overwrite it. The training directory
can contain partial artifacts after failure: inspect it, preserve evidence, and use
a new run name. GPU execution is selected only if CUDA is available; otherwise the
recipe uses CPU, which can be slow. There is a step cap, not a hard wall-clock or
currency limit. Monitor resource use and terminate an over-budget run. No quantized
training, distributed launch or telemetry upload is configured.

Inspect losses and validation predictions. The script masks prompt/padding labels
with -100, rejects examples over 512 tokens, trains only LoRA parameters, clips
gradients and rejects non-finite loss. It uses a fixed order and seed for teaching,
not a claim of hardware-independent reproducibility. Match base revision, tokenizer,
adapter, dataset, prompt, package versions and device in the experiment record.
Record the base artifact hash manually; a local path alone does not establish identity.

Freeze the selected configuration before test evaluation:

```sh
python3 -B local_lora.py predict --model /approved/local/model --split test --out baseline-test.json
python3 -B local_lora.py predict --model /approved/local/model --adapter adapter-run-1 --split test --out tuned-test.json
```

Reports contain accuracy, per-class recall, macro recall, invalid output count,
per-case generation time, output tokens and unknown cost (`null`). Invalid labels
count as wrong. Dataset/test selection is explicit; the script does not enforce a
one-time human holdout policy. Keep a separate protected final dataset in a serious
experiment. Add out-of-domain and critical-error slices. Do not present three toy
test cases as reliable accuracy estimates.

For serving, predict reloads the adapter in a separate process. Verify that exact
reload before packaging. Expose the same prompt and output validator behind the
existing authenticated API pattern. Add timeouts, request-size limits, admission
control and human review. A generated label never authorizes an irreversible action.
This package is a CLI training/inference recipe, not a deployed HTTP service.

## Evidence log for the roadmap's remaining practical outcomes

Use a separate report for each experiment. Never fill unknown results with examples.

| Experiment | Keep fixed | Record | Completion evidence |
| --- | --- | --- | --- |
| Two models | Dataset, scorer, task contract | Model versions, failures, tokens, latency, cost | Actual run reports and slice comparison |
| Two prompts | Model, cases, decoding | Prompt hashes, outputs, grades | Validation choice and final held-out result |
| Full vs selected context | Task set and required facts | Lost facts, task success, token use, latency | Provenance tests plus real-model comparison |
| Fine-tuning | Base, test set, prompt and scorer | Adapter/data hashes, training cost, regressions | Reloaded candidate beats approved baseline gates |
| Audio/video | Source versions and labelled events | WER, critical words, timestamp and citation errors | Human-checked recording examples |
| Managed deployment | Release artifact and policy | Quotas, denied requests, cold/warm latency, rollback | Approved live deployment and cleanup records |

Previously waived live integrations remain optional. Authored content and local
fixtures do not establish production experience. Keep private recordings, datasets,
weights, credentials and generated reports out of public commits until reviewed.
