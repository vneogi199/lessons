// Static content checks only; does not run lesson code.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SIMPLE_EXAMPLES } from "./simple-examples.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const python = manifest.lessons.filter(x => x.trackId === "python");
assert.equal(python.length, 43);
assert.equal(Object.keys(SIMPLE_EXAMPLES).length, 64);
assert.equal(new Set(Object.values(SIMPLE_EXAMPLES).map(x => x[0])).size, 64);
for (const lesson of manifest.lessons) {
  const html = await readFile(new URL(lesson.path, root), "utf8");
  assert.doesNotMatch(html, /<h3>Explaining the result<\/h3>|<h3>Checking your prediction<\/h3>|class="practice-notes"/);
  if (!["python", "polars"].includes(lesson.trackId)) continue;
  const example = SIMPLE_EXAMPLES[lesson.number];
  assert.equal(example.length, 4);
  assert.ok(example.every(text => typeof text === "string" && text.length > 20));
  assert.equal((html.match(/id="simple-example-title"/g) || []).length, 1);
  assert.ok(html.indexOf('id="simple-example-title"') < html.indexOf('class="card blackboard"'));
  const escapedAnswer = example[3].replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  assert.ok(html.includes(escapedAnswer), `${lesson.number}: missing answer`);
}
console.log("64 distinct Python/Polars ELI5 examples and catalog-wide cleanup checked. No lesson code executed.");
