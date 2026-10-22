export const SPECIALIZATIONS = {
  "0583": ["Fine-tuning lab: data, LoRA, evaluation and release", "fine-tuning-lab.html", "LoRA supervised fine tuning held-out labels adapter training serving baseline"],
  "0586": ["Audio and video with timestamped evidence", "audio-video-engineering.html", "audio video transcription diarization speaker attribution timestamps frame sampling WER"],
  "0590": ["Choose a managed AI platform", "managed-ai-platforms.html", "managed platform selection model hosting router quotas residency TCO cold starts"],
  "0602": ["Audio/video retrieval project", "audio-video-engineering.html", "multimodal audio video evidence project"],
  "0614": ["Compare a tuned model with its baseline", "fine-tuning-lab.html", "fine tuning evaluation baseline validation test exact match invalid outputs"],
  "0620": ["Managed deployment decision and acceptance checks", "managed-ai-platforms.html", "managed platforms hosting evidence deployment rollback cost"],
};
export function specializationDepth(number) {
  const item = SPECIALIZATIONS[number];
  return item ? `<section class="card" data-ai-specialization><h2>${item[0]}</h2><p>Follow the <a href="../reference/${item[1]}" target="_blank" rel="noreferrer">explanation, worked example and guided lab</a>. Start with the offline exercises. Model training, media decoding and cloud checks require an approved environment and are not claimed as executed.</p></section>` : "";
}
