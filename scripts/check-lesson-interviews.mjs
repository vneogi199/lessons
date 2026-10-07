import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { diagramFor } from "./generate-lessons.mjs";
import { interviewQuestions } from "./lesson-interviews.mjs";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("lessons/manifest.json"));
let count = 0;
for (const lesson of manifest.lessons) {
  const expected = interviewQuestions(lesson, diagramFor(lesson));
  const html = read(lesson.path);
  assert.ok(html.includes(expected), lesson.number);
  const questions = [...expected.matchAll(/data-interview-question/g)].length;
  assert.ok(questions >= 4, lesson.number);
  assert.equal([...expected.matchAll(/<summary>Answer checkpoints<\/summary>/g)].length, questions);
  assert.equal([...html.matchAll(/class="lesson-interview-bank"/g)].length, 1);
  assert.ok(!expected.includes('id="mechanism-map-caption"'));
  count += questions;
}
console.log(`${manifest.lessons.length} lessons: ${count} oral interview questions with expandable checkpoints. Existing authored cases reused; not employer-question or editorial certification.`);
