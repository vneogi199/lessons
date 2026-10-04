"""Explicit Ragas 0.2.15 metric variants; no default provider or credentials."""
import asyncio
from importlib.metadata import version
import math


PIN = "0.2.15"
REFERENCE_METRICS = {"correctness", "context_recall", "context_precision"}
METRICS = REFERENCE_METRICS | {"faithfulness", "answer_relevance"}


def configured_metrics(llm, embeddings):
    if version("ragas") != PIN:
        raise RuntimeError(f"This recipe targets ragas=={PIN}; review adapters before upgrading")
    from ragas.llms import BaseRagasLLM
    from ragas.embeddings import BaseRagasEmbeddings
    from ragas.metrics import (Faithfulness, FactualCorrectness, LLMContextRecall,
                               LLMContextPrecisionWithReference, ResponseRelevancy)
    if not isinstance(llm, BaseRagasLLM) or not isinstance(embeddings, BaseRagasEmbeddings):
        raise TypeError("explicit Ragas judge and embedding adapters required")
    return {
        "faithfulness": Faithfulness(llm=llm),
        "correctness": FactualCorrectness(llm=llm, mode="f1"),
        "context_recall": LLMContextRecall(llm=llm),
        "context_precision": LLMContextPrecisionWithReference(llm=llm),
        "answer_relevance": ResponseRelevancy(llm=llm, embeddings=embeddings, strictness=3),
    }


async def score(sample, metrics, *, timeout=30):
    if not isinstance(metrics, dict) or not metrics or not set(metrics) <= METRICS:
        raise ValueError("use the five named metric variants")
    if not 0 < timeout <= 120:
        raise ValueError("metric timeout bound")
    if (not isinstance(sample.user_input, str) or not sample.user_input
            or not isinstance(sample.response, str) or not sample.response
            or not isinstance(sample.retrieved_contexts, list)
            or len(sample.retrieved_contexts) > 8
            or any(not isinstance(c, str) for c in sample.retrieved_contexts)
            or sum(map(len, sample.retrieved_contexts)) > 20_000
            or len(sample.user_input) > 4000 or len(sample.response) > 8000
            or (sample.reference is not None and
                (not isinstance(sample.reference, str) or len(sample.reference) > 8000))):
        raise ValueError("bounded question, response and contexts required")
    result = {}
    for name, metric in metrics.items():
        if name in REFERENCE_METRICS and not sample.reference:
            result[name] = {"value": None, "status": "missing_reference"}
            continue
        if name in {"faithfulness", "context_recall", "context_precision"} and not sample.retrieved_contexts:
            result[name] = {"value": None, "status": "empty_context"}
            continue
        try:
            value = float(await asyncio.wait_for(metric.single_turn_ascore(sample), timeout))
            lower = -1 if name == "answer_relevance" else 0
            if not math.isfinite(value) or not lower <= value <= 1:
                raise ValueError("metric score range")
            result[name] = {"value": value, "status": "scored"}
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            result[name] = {"value": None, "status": type(exc).__name__}
    return result
