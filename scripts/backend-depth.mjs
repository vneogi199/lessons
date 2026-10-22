export const BACKEND_DEPTH = {
  "0347": ["MySQL and InnoDB for PostgreSQL users", "mysql-innodb-practice.html", "MySQL InnoDB clustered secondary indexes buffer pool redo undo locking query planner"],
  "0365": ["Compare MySQL query plans and locking", "mysql-innodb-practice.html", "MySQL EXPLAIN ANALYZE next-key gap locks repeatable read migrations"],
  "0335": ["When a real-time feature needs WebRTC", "webrtc-practice.html", "WebRTC SDP ICE STUN TURN signaling data channels SFU media"],
  "0415": ["WebRTC connectivity and failure drills", "webrtc-practice.html", "WebRTC signaling ICE restart NAT TURN relay backpressure"],
  "0340": ["Follow a request through Datadog", "datadog-practice.html", "Datadog APM logs traces metrics Python FastAPI redaction correlation"],
  "0520": ["Datadog dashboards, alerts and costs", "datadog-practice.html", "Datadog monitors dashboards cardinality sampling ingestion cost"],
};
export function backendDepth(number) {
  const item = BACKEND_DEPTH[number];
  return item ? `<section class="card" data-backend-depth><h2>${item[0]}</h2><p>Use the <a href="../reference/${item[1]}" target="_blank" rel="noreferrer">worked explanation and guided practice</a> to learn the mechanism, investigate failures and rehearse interview answers. Database, browser-network and paid-service exercises require a separately approved environment; no live integration is claimed.</p></section>` : "";
}
