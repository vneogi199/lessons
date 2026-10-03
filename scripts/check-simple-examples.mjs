// Static content checks only; does not run lesson code.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SIMPLE_EXAMPLES } from "./simple-examples.mjs";
import { PYTHON_EXPLANATIONS, LESSON_EXPLANATIONS } from "./explanation-rewrites.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const python = manifest.lessons.filter(x => x.trackId === "python");
assert.equal(python.length, 43);
assert.deepEqual(Object.keys(PYTHON_EXPLANATIONS).sort(), python.map(x => x.number).sort());
assert.equal(Object.keys(SIMPLE_EXAMPLES).length, 64);
assert.equal(new Set(Object.values(SIMPLE_EXAMPLES).map(x => x[0])).size, 64);
for (const lesson of manifest.lessons) {
  const html = await readFile(new URL(lesson.path, root), "utf8");
  assert.doesNotMatch(html, /[.!?]”\./, `${lesson.number}: duplicate punctuation after a quotation`);
  assert.doesNotMatch(html, /<h3>Explaining the result<\/h3>|<h3>Checking your prediction<\/h3>|class="practice-notes"/);
  if (lesson.trackId === "typescript") {
    assert.doesNotMatch(html, /Trace a database query|Trace a token sequence|Primary documentation for this review/);
  }
  if (lesson.number === "0145") {
    assert.ok(html.includes("A key path describes access through nested properties."));
    assert.doesNotMatch(html, /The paths option redirects/);
  }
  if (LESSON_EXPLANATIONS[lesson.number]) {
    const explanation = LESSON_EXPLANATIONS[lesson.number].replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    assert.ok(html.includes(explanation), `${lesson.number}: missing reviewed explanation`);
    assert.doesNotMatch(html, /Software design is arranging a workshop/);
  }
  if (!["python", "polars"].includes(lesson.trackId)) continue;
  const example = SIMPLE_EXAMPLES[lesson.number];
  assert.equal(example.length, 4);
  assert.ok(example.every(text => typeof text === "string" && text.length > 20));
  assert.equal((html.match(/id="simple-example-title"/g) || []).length, 1);
  assert.ok(html.indexOf('id="simple-example-title"') < html.indexOf('class="card blackboard"'));
  const escapedAnswer = example[3].replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  assert.ok(html.includes(escapedAnswer), `${lesson.number}: missing answer`);
  if (lesson.trackId === "python") {
    const explanation = PYTHON_EXPLANATIONS[lesson.number].replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    assert.ok(html.includes(explanation), `${lesson.number}: missing reviewed explanation`);
    assert.doesNotMatch(html, /Python names are sticky notes|Core: inspect the supplied Python fixture|which evidence would prove the result/);
  }
}
console.log("43 Python explanations, 64 Python/Polars ELI5 examples and catalog-wide cleanup checked. No lesson code executed.");
