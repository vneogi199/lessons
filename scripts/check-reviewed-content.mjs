// Static content checks only. Does not execute lesson starters or integrations.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { REVIEWED_CONTENT, REVIEW_SCENARIOS } from "./reviewed-lesson-content.mjs";
import { lessonHtml, parseRoadmap, teachingProfileFor, TRACK_PROFILES } from "./generate-lessons.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const topics = parseRoadmap(await readFile(new URL("roadmap.yaml", root), "utf8"))
  .flatMap(track => track.topics);
const required = {
  "0090": ["Count: 0", "3,3,3", "registry.delete"],
  "0140": ["@ts-expect-error", "Box&lt;T = string&gt;", "Map.get"],
  "0176": ["pending values become 5, 6 and 2", "Strict Mode", "Object.is"],
  "0216": ["Promise.all", "process.version", "I/O immediate"],
  "0358": ["lesson_mvcc_accounts", "still 100", "VACUUM"],
  "0447": ["at most one", "current-term", "joint-consensus"],
  "0582": ["3 × 4", "LayerNorm", "KV cache"],
  "0629": ["25-minute", "O(n + k)", "[0,2]"]
};
assert.equal(Object.keys(REVIEWED_CONTENT).length, 8);
for (const [number, markers] of Object.entries(required)) {
  const entry = manifest.lessons.find(item => item.number === number);
  assert.ok(entry, number);
  const lesson = { ...entry, ...topics[Number(number) - 1], index: Number(number) - 1,
    total: String(manifest.totalLessons).padStart(4, "0") };
  const html = await readFile(new URL(entry.path, root), "utf8");
  assert.equal(html, lessonHtml(lesson, teachingProfileFor(lesson, TRACK_PROFILES[lesson.trackId])), `${number}: regeneration differs`);
  assert.equal(createHash("sha256").update(html).digest("hex").slice(0, 12), entry.revision);
  for (const marker of markers) assert.ok(html.includes(marker), `${number}: missing ${marker}`);
  assert.doesNotMatch(html, /Visible UI changes atomically|Elect one leader per term|choose now|The old sketch|No installs are performed by this review|This content review installs nothing/);
  const question = REVIEW_SCENARIOS[number];
  assert.equal(question.options.length, question.explanations.length);
  assert.ok(question.answer >= 0 && question.answer < question.options.length);
  assert.equal(new Set(question.options.map(option => option.split(/\s+/).length)).size, 1, `${number}: unequal option word counts`);
  assert.ok(html.includes('data-mcq-kind="scenario"'));
  assert.equal(Number(html.match(/data-mcq-count="(\d+)"/)[1]), entry.mcqCount);
}
console.log("Eight reviewed lessons: source parity, content markers, revision hashes and scenario structure verified. No lesson code executed.");
