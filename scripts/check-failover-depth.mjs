import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { FAILOVER_LESSONS, failoverDepth, failoverSearch } from "./failover-depth.mjs";
const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
for (const number of FAILOVER_LESSONS) {
  const lesson = manifest.lessons.find(item => item.number === number);
  const html = fs.readFileSync(lesson.path, "utf8");
  assert.equal(html.split(failoverDepth).length, 2);
  assert.ok(lesson.searchTerms.includes(failoverSearch));
  assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
}
const reference = fs.readFileSync("reference/database-failover-practice.html", "utf8");
for (const id of ["positions", "ack", "managers", "fencing", "recovery"]) {
  assert.ok(reference.includes(`id="${id}"`));
}
const drill = fs.readFileSync("practice/database-failover/DRILL.md", "utf8");
assert.ok(drill.includes("Status: designed, not executed."));
assert.ok(drill.includes("independent journal"));
assert.ok(drill.includes("Former writer returns"));
console.log("Failover links, search metadata, revisions and drill structure passed.");
