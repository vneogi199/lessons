// Static checks only: parse Python syntax without importing or executing Polars.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { POLARS_CONTENT, POLARS_SCENARIOS } from "./polars-content.mjs";
import { lessonHtml, parseRoadmap, teachingProfileFor, TRACK_PROFILES } from "./generate-lessons.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const track = parseRoadmap(await readFile(new URL("roadmap.yaml", root), "utf8")).find(x => x.id === "polars");
const entries = manifest.lessons.filter(x => x.trackId === "polars");
assert.equal(entries.length, 21);
assert.equal(track.topics.length, 21);
assert.equal(Object.keys(POLARS_CONTENT).length, 21);
for (const [index, entry] of entries.entries()) {
  assert.equal(entry.number, String(645 + index).padStart(4, "0"));
  const item = POLARS_CONTENT[entry.number];
  assert.equal(entry.title, item.title);
  assert.equal(track.topics[index].behind_the_scenes, item.model);
  const lesson = { ...entry, ...track.topics[index], index: Number(entry.number) - 1,
    total: String(manifest.totalLessons).padStart(4, "0") };
  const html = await readFile(new URL(entry.path, root), "utf8");
  assert.equal(html, lessonHtml(lesson, teachingProfileFor(lesson, TRACK_PROFILES.polars)), `${entry.number}: source parity`);
  assert.ok(html.includes(item.mechanism));
  assert.ok(html.includes('data-mcq-kind="scenario"'));
  assert.ok(html.includes("polars-quick-reference.html"));
  assert.ok(item.code.includes("assert"));
  const q = POLARS_SCENARIOS[entry.number];
  assert.equal(q.options.length, 4);
  assert.equal(q.explanations.length, 4);
  assert.ok(q.answer >= 0 && q.answer < 4);
  assert.equal(new Set(q.options.map(x => x.split(/\s+/).length)).size, 1, `${entry.number}: option word counts`);
}
assert.equal(new Set(Object.values(POLARS_CONTENT).map(x => x.code)).size, 21);
execFileSync(process.env.LESSON_PYTHON || "python3", ["-c", "import ast,json,sys; [ast.parse(code, filename=name) for name,code in json.load(sys.stdin).items()]"], {
  input: JSON.stringify(Object.fromEntries(Object.entries(POLARS_CONTENT).map(([n, x]) => [n, x.code])))
});
const map = await readFile(new URL("reference/polars-deep-dive-map.html", root), "utf8");
for (const entry of entries) assert.ok(map.includes(entry.path));
await readFile(new URL("reference/polars-quick-reference.html", root), "utf8");
console.log("21 Polars lessons: catalog, source parity, MCQs, links and Python syntax checked. No lesson code executed.");
