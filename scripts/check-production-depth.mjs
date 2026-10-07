import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PRODUCTION_DEPTH, productionDepthMarkup } from "./production-depth-links.mjs";
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("lessons/manifest.json"));
for (const [number, [title, page]] of Object.entries(PRODUCTION_DEPTH)) {
  const lesson = manifest.lessons.find(item => item.number === number);
  assert.ok(lesson, number);
  assert.equal(lesson.searchTerms, title);
  assert.ok(read(lesson.path).includes(productionDepthMarkup(number)));
  const content = read(`reference/${page}`);
  assert.match(content, /<details>/);
  assert.match(content, /MCQ:/);
  assert.match(content, /https:\/\//);
  assert.ok(content.replace(/<[^>]+>/g, " ").split(/\s+/).length > 400, page);
}
const dashboard = JSON.parse(read("practice/ai-metrics/dashboard.json"));
for (const q of ["0.50", "0.95", "0.99"]) {
  assert.ok(dashboard.panels.some(panel => panel.targets.some(target =>
    target.expr.includes(`histogram_quantile(${q}, sum by (le, stage)`))));
}
console.log("Seven production-depth links, search metadata, exercise/source structure and stage percentile panels checked; not runtime/browser certification.");
