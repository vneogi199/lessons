import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const helper = source.match(/  function scrollActiveLessonIntoView\(\) \{[\s\S]*?\n  \}/)?.[0];
const render = source.match(/  function render\(\) \{[\s\S]*?\n  \}/)?.[0];
assert.ok(helper && render);
const sidebar = { scrollTop: 100, clientHeight: 600, getBoundingClientRect: () => ({ top: 0 }) };
let item = { top: 900, height: 60, left: 800, width: 200 };
const lessonNav = {
  scrollLeft: 20, clientWidth: 400,
  querySelector: () => item && { getBoundingClientRect: () => item },
  closest: () => sidebar,
  getBoundingClientRect: () => ({ left: 0 })
};
let frame;
const calls = [];
const context = {
  lessonNav,
  renderNav: () => calls.push("nav"),
  renderLesson: () => calls.push("lesson"),
  updateResumeButton: () => {},
  updateReadingProgress: () => {},
  window: { requestAnimationFrame: callback => { frame = callback; } }
};
runInNewContext(`${helper}\n${render}\nrender();`, context);
assert.deepEqual(calls, ["nav", "lesson"]);
assert.equal(sidebar.scrollTop, 100); // Wait for the rendered layout.
frame();
assert.equal(sidebar.scrollTop, 730);
assert.equal(lessonNav.scrollLeft, 720);
item = { top: -80, height: 60, left: -20, width: 200 };
frame();
assert.equal(sidebar.scrollTop, 380); // A previous lesson scrolls upward.
item = null;
frame();
assert.equal(sidebar.scrollTop, 380); // A filtered-out lesson leaves scrolling alone.
console.log("Sidebar scroll checks passed: deferred render, vertical/horizontal positioning and filtered lesson.");
