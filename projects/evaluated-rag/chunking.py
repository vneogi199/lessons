"""Character spans, not model-token spans."""
import hashlib
import json
import re


def fixed_spans(text, size=400, overlap=40):
    if type(size) is not int or type(overlap) is not int or not 0 <= overlap < size:
        raise ValueError("require 0 <= overlap < size")
    spans, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        spans.append((start, end))
        if end == len(text):
            break
        start = end - overlap
    return spans


def semantic_spans(text, similarity, size=400, threshold=0.5):
    """Split on low adjacent-sentence similarity; bound long sections.

    Sentence splitting is a teaching heuristic; abbreviations need a real parser.
    """
    if type(size) is not int or size < 1 or not -1 <= threshold <= 1:
        raise ValueError("invalid_chunk_settings")
    ends = [match.end() for match in re.finditer(r"[.!?](?:\s+|$)", text)]
    if not ends or ends[-1] != len(text):
        ends.append(len(text))
    result, group_start, previous_start, previous_end = [], 0, 0, 0
    for end in ends:
        if end == 0:
            continue
        sentence = text[previous_end:end]
        split = previous_end > group_start and (
            end - group_start > size or
            similarity(text[previous_start:previous_end], sentence) < threshold)
        if split:
            result.extend((group_start + a, group_start + b)
                          for a, b in fixed_spans(text[group_start:previous_end], size, 0))
            group_start = previous_end
        previous_start, previous_end = previous_end, end
    result.extend((group_start + a, group_start + b)
                  for a, b in fixed_spans(text[group_start:], size, 0))
    return result


def chunks(source, version, text, spans):
    result = []
    for start, end in spans:
        if not 0 <= start < end <= len(text):
            raise ValueError("invalid_span")
        content = text[start:end]
        identity = json.dumps([source, version, start, end, content], ensure_ascii=True)
        result.append({"id": hashlib.sha256(identity.encode()).hexdigest(), "source": source,
                       "version": version, "start": start, "end": end, "text": content})
    return result


def overlap_report(text, answer_spans, size, overlaps, context_chars=1200):
    """Gold-span containment is a chunking metric, not retrieval/answer recall."""
    if not text or any(not 0 <= a < b <= len(text) for a, b in answer_spans):
        raise ValueError("invalid_experiment")
    rows = []
    for overlap in overlaps:
        spans = fixed_spans(text, size, overlap)
        records = chunks("synthetic", "v1", text, spans)
        retained, used = [], 0
        for record in records:
            if used + len(record["text"]) > context_chars:
                break
            retained.append(record)
            used += len(record["text"])
        covered = {i for record in retained for i in range(record["start"], record["end"])}
        rows.append({"overlap": overlap, "chunks": len(records),
            "duplicated_characters": sum(b-a for a, b in spans) - len(text),
            "serialized_index_bytes": len(json.dumps(records).encode()),
            "gold_span_containment": (sum(any(a <= x and y <= b for a, b in spans)
                                          for x, y in answer_spans) / len(answer_spans)
                                      if answer_spans else None),
            "context_source_coverage": len(covered) / len(text)})
    return rows
