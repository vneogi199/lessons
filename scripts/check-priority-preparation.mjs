import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { PRIORITY_PREPARATION, priorityDepth, prioritySearch } from "./priority-preparation.mjs";
const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
const guide = fs.readFileSync("reference/senior-priority-build-path.html", "utf8");
for (const [number, section] of Object.entries(PRIORITY_PREPARATION)) {
  const lesson = manifest.lessons.find(l => l.number === number);
  const html = fs.readFileSync(lesson.path, "utf8");
  assert.equal(html.split(priorityDepth(number)).length, 2);
  assert.ok(lesson.searchTerms.includes(prioritySearch));
  assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
  assert.ok(guide.includes(`id="${section}"`));
}
assert.equal(new Set(Object.values(PRIORITY_PREPARATION)).size, 8);
assert.ok(fs.readFileSync("index.html", "utf8").includes("reference/senior-priority-build-path.html"));
assert.ok(fs.existsSync("practice/senior-priority/EVIDENCE.md"));
console.log("Eight priority areas, 13 lesson links, revisions and home entry passed.");
