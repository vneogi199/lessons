import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { SPECIALIZATIONS, specializationDepth } from "./ai-specialization-depth.mjs";
const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
for (const [number, item] of Object.entries(SPECIALIZATIONS)) {
  const lesson = manifest.lessons.find(l => l.number === number);
  const html = fs.readFileSync(lesson.path, "utf8");
  assert.equal(html.split(specializationDepth(number)).length, 2);
  assert.ok(lesson.searchTerms.includes(item[2]));
  assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
  const guide = fs.readFileSync(`reference/${item[1]}`, "utf8");
  assert.ok(guide.includes('name="viewport"'));
  assert.ok(guide.includes("<details>"));
  assert.ok(guide.includes("https://"));
}
console.log("Six specialization lesson links, metadata and guide checks passed.");
