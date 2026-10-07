export const PRODUCTION_DEPTH = {
  "0340": ["Logfire and private structured traces", "logfire-production.html"],
  "0345": ["FastAPI production operations and incident practice", "fastapi-production-operations.html"],
  "0603": ["Harness engineering for bounded agents", "agent-harness-engineering.html"],
  "0605": ["Claude Agent SDK permissions, sessions and results", "claude-agent-sdk-practice.html"],
  "0609": ["Replayable traces and deterministic tool fixtures", "replayable-agent-traces.html"],
  "0611": ["Trajectory and multi-turn eval harnesses", "trajectory-multiturn-evals.html"],
  "0616": ["p50 p95 p99 by stage and latency diagnosis", "stage-latency-percentiles.html"],
};

export function productionDepthMarkup(number) {
  const entry = PRODUCTION_DEPTH[number];
  if (!entry) return "";
  return `<section class="card" data-production-depth="${number}"><h2>${entry[0]}</h2><p>Work through the <a href="../reference/${entry[1]}" target="_blank" rel="noreferrer">detailed explanation and practice</a>, including a small example, failure cases and interview answers.</p><p><a href="../reference/production-ai-depth.html" target="_blank" rel="noreferrer">Full production AI practice sequence</a></p></section>`;
}
