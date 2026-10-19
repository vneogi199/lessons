import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { agileDeliveryDepth, agileDeliverySearch } from "./agile-delivery-depth.mjs";

const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
const lesson = manifest.lessons.find(item => item.number === "0507");
const html = fs.readFileSync(lesson.path, "utf8");
assert.equal(html.split(agileDeliveryDepth).length, 2);
assert.ok(lesson.searchTerms.includes(agileDeliverySearch));
assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
const reference = fs.readFileSync("reference/agile-delivery.html", "utf8");
for (const id of ["basics", "scrum", "rfq", "kanban", "judgment", "practice", "interview"]) {
  assert.ok(reference.includes(`id="${id}"`), id);
}
assert.equal((reference.match(/<details>/g) || []).length, 5);
console.log("Agile extension, search metadata, revision and exercise structure passed.");
