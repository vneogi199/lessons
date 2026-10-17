import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { AGENT_PATH, agentPathMarkup } from "./agent-path-links.mjs";

const root = new URL("../", import.meta.url);
const guideURL = new URL("reference/production-agent-six-week-path.html", root);
const guide = await readFile(guideURL, "utf8");
const coverage = await readFile(new URL("AGENT-SYLLABUS-COVERAGE.md", root), "utf8");
const headings = [...guide.matchAll(/<h3 id="(w\d-[^"]+)">(\d+)\./g)];
assert.equal(headings.length, 30);
assert.equal(new Set(headings.map(h => h[1])).size, 30);
assert.deepEqual(headings.map(h => Number(h[2])), Array.from({length: 30}, (_, i) => i + 1));
for (const [, id] of headings) assert.ok(coverage.includes(`#${id})`), `Missing audit row: ${id}`);
for (const [, href] of guide.matchAll(/href="([^"]+)"/g)) {
  if (href.startsWith("https://")) continue;
  const target = new URL(href, guideURL);
  const hash = target.hash.slice(1);
  target.hash = "";
  await access(target);
  if (hash) assert.ok((await readFile(target, "utf8")).includes(`id="${hash}"`), href);
}
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
for (const [number, [week, label]] of Object.entries(AGENT_PATH)) {
  const lesson = manifest.lessons.find(l => l.number === number);
  const html = await readFile(new URL(lesson.path, root), "utf8");
  assert.ok(html.includes(agentPathMarkup(number)), number);
  assert.ok(lesson.searchTerms.includes(label), number);
  assert.equal(lesson.revision, createHash("sha256").update(html).digest("hex").slice(0, 12));
  assert.ok(guide.includes(`id="week-${week}"`));
}
const generator = await readFile(new URL("scripts/generate-lessons.mjs", root), "utf8");
assert.ok(generator.includes("${agentPathMarkup(lesson.number)}"));
const result = spawnSync(process.env.LESSON_PYTHON || "python3", ["-B", "-m", "unittest", "discover", "-s", "practice/incremental-publication", "-p", "test_*.py", "-v"], {cwd: root, encoding: "utf8"});
assert.equal(result.status, 0, result.stderr || String(result.error));
console.log(result.stderr.trim());
console.log("Checked 30 syllabus sections, local targets/anchors, six lesson links/revisions, generator hook and nine offline publication tests. No provider or deployment checks ran.");
