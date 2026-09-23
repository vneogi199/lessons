// Optional static regression checks; does not start a server or install anything.
// Browser follow-up: 320/390/700px, desktop resize, keyboard Escape, long MCQs,
// search, catalog selection and previous/next navigation without sideways scroll.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const read = name => readFile(new URL(name, root), "utf8");
const html = await read("lesson.html");
const css = await read("styles.css");
const app = await read("app.js");
assert.match(html, /id="toggle-catalog"[^>]*aria-expanded="false"[^>]*aria-controls="course-sidebar"/);
assert.match(html, /id="course-sidebar"/);
assert.match(css, /\.sidebar\.catalog-open\s*\{\s*display:\s*block/);
assert.match(css, /#lesson-nav\s*\{\s*display:\s*block/);
assert.doesNotMatch(css, /\.lesson-status,\s*\.step-buttons\s*\{\s*display:\s*none/);
assert.match(app, /if \(mobileLayout\.matches\) setCatalogOpen\(false\)/);
assert.match(app, /event\.key === "Escape"/);
assert.doesNotMatch(app, /Math\.min\(12000/);
const manifest = JSON.parse(await read("lessons/manifest.json"));
for (const lesson of manifest.lessons) {
  const page = await read(lesson.path);
  assert.ok(page.includes("fieldset{min-inline-size:0"), `${lesson.number}: fieldsets can overflow`);
  assert.ok(page.includes("white-space:pre;overflow-wrap:normal"), `${lesson.number}: missing contained code scrolling`);
}
console.log("Mobile layout static contracts passed; real-browser checks are separate.");
