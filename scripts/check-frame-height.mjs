import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const handler = read("app.js").match(/  function handleLessonMessage\(event\) \{[\s\S]*?\n  \}/)[0];
const frame = { contentWindow: {}, offsetHeight: 702, clientHeight: 700, style: {} };
const context = { window: { location: { origin: "https://example.test" }, requestAnimationFrame() {} },
  document: { querySelector: () => frame }, activeLessonId: "one", findLesson: () => true, updateReadingProgress() {} };
runInNewContext(`${handler}; this.handle = handleLessonMessage;`, context);
const send = height => context.handle({ origin: "https://example.test", source: frame.contentWindow,
  data: { version: 1, lessonId: "one", type: "teach:resize", height } });
send(2400.2);
assert.equal(frame.style.height, "2403px");
send(1100);
assert.equal(frame.style.height, "1102px"); // Collapsing content can shrink the frame.
frame.offsetHeight = frame.clientHeight; // Mobile has no border.
send(1100);
assert.equal(frame.style.height, "1100px");
send(NaN);
assert.equal(frame.style.height, "1100px");
for (const lesson of JSON.parse(read("lessons/manifest.json")).lessons) {
  assert.ok(read(lesson.path).includes('height: Math.ceil(document.body.getBoundingClientRect().height)'));
}
console.log("Frame sizing passed: border allowance, shrink, mobile and all lesson reporters. Browser verification separate.");
