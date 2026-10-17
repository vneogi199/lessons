export const AGENT_PATH = {
  "0603": [1, "Agent design, context, memory and baseline evaluations"],
  "0602": [2, "Incremental ingestion, permission-aware retrieval and guardrails"],
  "0614": [3, "Action datasets, judge calibration, regression and security tests"],
  "0526": [4, "Secure APIs, durable workers and cloud delivery"],
  "0616": [5, "Agent and MCP traces, stage latency, budgets and outage response"],
  "0620": [6, "Architecture review, production readiness and capstone evidence"],
};

export function agentPathMarkup(number) {
  const item = AGENT_PATH[number];
  if (!item) return "";
  return `<section class="card" data-agent-path="${item[0]}"><h2>Apply this in the six-week project</h2><p><a href="../reference/production-agent-six-week-path.html#week-${item[0]}" target="_blank" rel="noreferrer">Week ${item[0]}: ${item[1]}</a>. Read the explanation, follow the linked lab, then check the acceptance criteria. Keep simulated results separate from live deployment evidence.</p></section>`;
}
