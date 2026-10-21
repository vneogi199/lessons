import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { COPILOT_LESSONS, copilotDepth, copilotSearch } from "./support-copilot-depth.mjs";
const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
for (const number of COPILOT_LESSONS) {
  const lesson = manifest.lessons.find(item => item.number === number);
  const html = fs.readFileSync(lesson.path, "utf8");
  assert.equal(html.split(copilotDepth).length, 2);
  assert.ok(lesson.searchTerms.includes(copilotSearch));
  assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
}
const guide = fs.readFileSync("reference/support-copilot-project.html", "utf8");
for (const id of ["product", "elastic", "data", "evaluation", "llm", "workflow", "operations", "deployment"]) {
  assert.ok(guide.includes(`id="${id}"`));
}
console.log("Support Copilot lesson links, revision metadata and guide sections passed.");
