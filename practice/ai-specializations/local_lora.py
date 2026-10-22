"""Optional local-only model recipe. No package installs or weight downloads.

Source-reviewed, not model-runtime verified. Run only on approved local artifacts.
"""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import time

from core import LABELS, completion_example, load_rows, prompt, score


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["train", "predict"])
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--data", type=Path, default=Path(__file__).with_name("cases.jsonl"))
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--adapter", type=Path)
    parser.add_argument("--split", choices=["validation", "test"], default="validation")
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--modules", default="q_proj,v_proj")
    args = parser.parse_args()
    if not args.model.is_dir() or (args.adapter and not args.adapter.is_dir()):
        parser.error("model and adapter must be existing local directories")
    if args.out.exists() or not 1 <= args.steps <= 200:
        parser.error("output must be new; training steps must be 1..200")
    if args.mode == "train" and args.adapter:
        parser.error("training starts from the base model, not another adapter")
    rows = load_rows(args.data)
    training = [r for r in rows if r["split"] == "train"]
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["HF_DATASETS_OFFLINE"] = "1"
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, set_seed
    from peft import LoraConfig, PeftModel, get_peft_model
    set_seed(17)
    tokenizer = AutoTokenizer.from_pretrained(str(args.model), local_files_only=True,
                                              trust_remote_code=False)
    if tokenizer.eos_token_id is None:
        raise ValueError("this recipe requires an EOS token")
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(str(args.model), local_files_only=True,
                                                trust_remote_code=False, use_safetensors=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.config.use_cache = False
    report = {"base_path": str(args.model.resolve()), "seed": 17,
              "data_sha256": hashlib.sha256(args.data.read_bytes()).hexdigest(),
              "versions": {p: importlib.metadata.version(p) for p in ("torch", "transformers", "peft")}}
    if args.mode == "train":
        modules = args.modules.split(",")
        names = [name for name, _ in model.named_modules()]
        if any(not name or not any(n.endswith("." + name) for n in names) for name in modules):
            raise ValueError("target modules do not match this architecture")
        model = get_peft_model(model, LoraConfig(task_type="CAUSAL_LM", r=8,
                               lora_alpha=16, lora_dropout=0.05, target_modules=modules))
        model.print_trainable_parameters()
        examples = []
        for row in training:
            prefix = tokenizer.encode(prompt(row["text"], training), add_special_tokens=True)
            target = tokenizer.encode(" " + row["label"], add_special_tokens=False)
            examples.append(completion_example(prefix, target, tokenizer.eos_token_id,
                                               tokenizer.pad_token_id, 512))
        args.out.mkdir(parents=True, exist_ok=False)
        optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=2e-4)
        model.train()
        losses = []
        started = time.perf_counter()
        for step in range(args.steps):
            item = examples[step % len(examples)]
            batch = {k: torch.tensor([v], device=device) for k, v in item.items()}
            optimizer.zero_grad()
            loss = model(**batch).loss
            if not torch.isfinite(loss):
                raise ValueError("non-finite loss; stop this run")
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            losses.append(float(loss.detach().cpu()))
        report.update(steps=args.steps, losses=losses, elapsed_seconds=time.perf_counter()-started,
                      modules=modules, rank=8, learning_rate=2e-4)
        model.save_pretrained(args.out, safe_serialization=True)
        tokenizer.save_pretrained(args.out)
        (args.out / "run.json").write_text(json.dumps(report, indent=2) + "\n")
    else:
        if args.adapter:
            model = PeftModel.from_pretrained(model, str(args.adapter), local_files_only=True)
        model.eval()
        selected = [r for r in rows if r["split"] == args.split]
        predictions, observations = {}, []
        for row in selected:
            batch = tokenizer(prompt(row["text"], training), return_tensors="pt").to(device)
            if batch["input_ids"].shape[1] > 504:
                raise ValueError("prompt exceeds this lab's budget")
            if device.type == "cuda":
                torch.cuda.synchronize()
            start = time.perf_counter()
            with torch.inference_mode():
                output = model.generate(**batch, do_sample=False, max_new_tokens=8,
                                        pad_token_id=tokenizer.pad_token_id,
                                        eos_token_id=tokenizer.eos_token_id)
            if device.type == "cuda":
                torch.cuda.synchronize()
            elapsed = time.perf_counter() - start
            new = output[0, batch["input_ids"].shape[1]:]
            prediction = tokenizer.decode(new, skip_special_tokens=True).strip()
            predictions[row["id"]] = prediction
            observations.append({"id": row["id"], "output": prediction,
                                 "seconds": elapsed, "output_tokens": len(new)})
        report.update(split=args.split, adapter=str(args.adapter) if args.adapter else None,
                      metrics=score(selected, predictions), observations=observations,
                      cost=None)
        # Exclusive creation avoids overwriting a previous experiment report.
        with args.out.open("x") as stream:
            json.dump(report, stream, indent=2)
            stream.write("\n")


if __name__ == "__main__":
    main()
