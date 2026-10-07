import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const context = { window: {} };
runInNewContext(read("base.js"), context);
const { matchesLesson, initializeLessonSearch } = context.window.Tutorial;
const lessons = JSON.parse(read("lessons/manifest.json")).lessons;
for (const lesson of lessons) {
  for (const query of [lesson.number, String(Number(lesson.number)), `lesson ${lesson.number}`, `#${lesson.number}`]) {
    const matches = lessons.filter(item => matchesLesson(item, query));
    assert.equal(matches.length, 1, query);
    assert.equal(matches[0].id, lesson.id);
  }
  assert.ok(matchesLesson(lesson, lesson.title.toUpperCase()));
}
assert.ok(matchesLesson({ title: "Python async context managers" }, " context PYTHON "));
for (const query of ["Logfire", "Harness engineering", "Replayable traces", "Claude Agent SDK", "multi-turn", "p99"]) {
  assert.ok(lessons.some(lesson => matchesLesson(lesson, query)), query);
}
assert.equal(lessons.filter(lesson => matchesLesson(lesson, "999999")).length, 0);
assert.equal(lessons.filter(lesson => matchesLesson(lesson, "unlikely-no-such-lesson")).length, 0);

// Minimal DOM fixture: test input, result escaping, navigation and dismissal.
function element() { return { handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } }; }
const input = element(), panel = {}, status = {}, results = element(), root = element();
root.querySelector = selector => ({ input, ".lesson-search-panel": panel, "[role=status]": status, ul: results })[selector];
root.contains = target => target === input;
input.focus = () => input.handlers.focus();
context.document = { querySelector: () => root };
let selected;
initializeLessonSearch([{ id: "safe-id", number: "0001", title: "<Python> & lists" }], id => { selected = id; });
input.value = "python";
input.handlers.input();
assert.equal(panel.hidden, false);
assert.match(results.innerHTML, /&lt;Python&gt; &amp; lists/);
assert.match(results.innerHTML, /lesson.html#safe-id/);
let activated = false;
results.querySelector = () => ({ click() { activated = true; } });
root.handlers.keydown({ key: "Enter", target: input, preventDefault() {} });
assert.equal(activated, true);
results.handlers.click({ target: { closest: () => ({ dataset: { id: "safe-id" } }) }, preventDefault() {} });
assert.equal(selected, "safe-id");
assert.equal(panel.hidden, true);
root.handlers.keydown({ key: "Escape" });
assert.equal(panel.hidden, true);
input.value = "";
input.handlers.input();
assert.equal(panel.hidden, true);
assert.equal(results.innerHTML, "");
for (const page of ["index.html", "lesson.html"]) assert.match(read(page), /id="universal-search"/);
console.log(`Lesson search passed: ${lessons.length} titles, exact numbers, mocked input/navigation/escaping/dismissal. No browser verification.`);
