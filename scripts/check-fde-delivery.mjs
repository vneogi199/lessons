import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { FDE_DELIVERY, fdeDeliveryDepth } from "./fde-delivery-depth.mjs";
const manifest = JSON.parse(fs.readFileSync("lessons/manifest.json", "utf8"));
for (const [number, [terms, target]] of Object.entries(FDE_DELIVERY)) {
  const lesson = manifest.lessons.find(item => item.number === number);
  const html = fs.readFileSync(lesson.path, "utf8");
  assert.equal(html.split(fdeDeliveryDepth(number)).length, 2);
  assert.ok(lesson.searchTerms.includes(terms));
  assert.equal(lesson.revision, crypto.createHash("sha256").update(html).digest("hex").slice(0, 12));
  const [file, anchor] = target.split("#");
  const reference = fs.readFileSync(`reference/${file}`, "utf8");
  if (anchor) assert.ok(reference.includes(`id="${anchor}"`));
}
assert.equal(fdeDeliveryDepth("0001"), "");
const pack = fs.readFileSync("practice/client-delivery/FIELD-SERVICE-PACK.md", "utf8");
assert.equal((pack.match(/^\| F\d\d \|/gm) || []).length, 12);
assert.equal((pack.match(/^\| UAT\d\d \|/gm) || []).length, 15);
assert.equal((pack.match(/^\| (POST|GET|PATCH) \//gm) || []).length, 10);
assert.ok(pack.includes("Not run"));
console.log("FDE lesson links, revision pins, search and pack structure passed.");
