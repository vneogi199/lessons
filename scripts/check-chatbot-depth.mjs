import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { CHATBOT_LESSONS, chatbotDepth, chatbotSearch } from "./chatbot-depth.mjs";
const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
for (const number of CHATBOT_LESSONS) {
  const lesson = manifest.lessons.find(item => item.number === number);
  const html = fs.readFileSync(lesson.path, "utf8");
  assert.equal(html.split(chatbotDepth).length, 2);
  assert.ok(lesson.searchTerms.includes(chatbotSearch));
  assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
}
const reference = fs.readFileSync("reference/support-chatbot-design.html", "utf8");
for (const id of ["flow", "fraud", "sessions", "scale", "handoff", "practice"]) {
  assert.ok(reference.includes(`id="${id}"`));
}
assert.equal((reference.match(/<details>/g) || []).length, 5);
assert.equal((reference.match(/<tr><td>/g) || []).length, 7);
console.log("Chatbot lesson links, search metadata, revision pins and exercise structure passed.");
