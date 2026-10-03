// Static content checks only; does not run lesson code.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SIMPLE_EXAMPLES } from "./simple-examples.mjs";
import { BESPOKE_EXAMPLES } from "./bespoke-examples.mjs";
import { PYTHON_EXPLANATIONS, LESSON_EXPLANATIONS } from "./explanation-rewrites.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const python = manifest.lessons.filter(x => x.trackId === "python");
assert.equal(python.length, 43);
assert.deepEqual(Object.keys(PYTHON_EXPLANATIONS).sort(), python.map(x => x.number).sort());
assert.equal(Object.keys(SIMPLE_EXAMPLES).length, 64);
assert.equal(new Set(Object.values(SIMPLE_EXAMPLES).map(x => x[0])).size, 64);
assert.equal(new Set(Object.values(BESPOKE_EXAMPLES)).size, Object.keys(BESPOKE_EXAMPLES).length);
assert.deepEqual(Object.keys(BESPOKE_EXAMPLES).sort(), manifest.lessons.filter(lesson => lesson.number !== "0265").map(lesson => lesson.number).sort(), "Every catalog lesson needs its authored example; 0265 uses the separate shared-reference example");
for (const number of Object.keys(BESPOKE_EXAMPLES)) assert.ok(manifest.lessons.some(lesson => lesson.number === number), `Unknown bespoke lesson: ${number}`);
for (const lesson of manifest.lessons) {
  const html = await readFile(new URL(lesson.path, root), "utf8");
  assert.equal((html.match(/data-lesson-map=/g) || []).length, 1, `${lesson.number}: expected one visible mechanism map`);
  assert.ok(html.includes(`data-lesson-map="${lesson.number}"`));
  if (BESPOKE_EXAMPLES[lesson.number]) {
    assert.ok(html.includes(BESPOKE_EXAMPLES[lesson.number]), `${lesson.number}: missing authored example`);
    assert.ok(html.includes(`data-bespoke-example="${lesson.number}"`));
    assert.equal((BESPOKE_EXAMPLES[lesson.number].match(/<details>/g) || []).length, 2);
    assert.doesNotMatch(BESPOKE_EXAMPLES[lesson.number], /<script|<code|Map of the walkthrough/);
  } else if (lesson.number !== "0265") {
    const map = html.match(/<figure class="card mechanism-map"[\s\S]*?<\/figure>/)?.[0];
    assert.ok(map, `${lesson.number}: missing map`);
    assert.doesNotMatch(map, /<details/, `${lesson.number}: map must be visible without clicks`);
    const nodes = [...map.matchAll(/<li><span>(.*?)<\/span>/g)].map(match => match[1]);
    const traceNames = [...html.matchAll(/<details class="trace-explanation"(?: open)?><summary>(.*?)<\/summary>/g)].map(match => match[1]);
    assert.deepEqual(nodes, traceNames, `${lesson.number}: map differs from its explained mechanism`);
    assert.equal((map.match(/class="map-arrow"/g) || []).length, nodes.length - 1);
    assert.ok(html.includes('.map-arrow::after{content:"↓"}'));
  }
  const stages = [...html.matchAll(/<details class="trace-explanation"( open)?><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)];
  assert.ok(stages.length >= 3 && stages.length <= 4, `${lesson.number}: missing interactive trace`);
  assert.equal(stages.filter(stage => stage[1]).length, 1, `${lesson.number}: only the first step starts open`);
  assert.equal(stages[0][1], " open");
  assert.ok(stages.every(stage => stage[2].length && stage[3].length));
  assert.match(html, /<details class="trace-evidence"><summary>What should I inspect\?<\/summary>/);
  assert.equal((html.match(/<details class="concept-card"/g) || []).length, (html.match(/class="concept-definition"/g) || []).length, `${lesson.number}: definitions must remain available`);
  assert.doesNotMatch(html, /[.!?]”\./, `${lesson.number}: duplicate punctuation after a quotation`);
  if (lesson.number === "0265") {
    assert.match(html, /<figure[^>]*aria-labelledby="copy-map-caption"/);
    assert.match(html, /data-copy-map="shared-references"/);
    assert.match(html, /<details data-copy-prediction="mutate">/);
    assert.match(html, /<details data-copy-prediction="replace">/);
    assert.ok(html.includes("shallow is [[10, 20, 99], [70]]."));
    assert.ok(html.indexOf('data-copy-prediction="mutate"') < html.indexOf("shallow[0].append(99)"));
  }
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
console.log(`${Object.keys(BESPOKE_EXAMPLES).length + 1} bespoke example diagrams checked, including 0265; ${manifest.lessons.length - Object.keys(BESPOKE_EXAMPLES).length - 1} remain pending.`);
