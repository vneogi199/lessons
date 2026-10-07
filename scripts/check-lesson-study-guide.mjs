import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { studyGuide, practiceGuide, recallGuide, finishGuide, addStudyGuide } from './lesson-study-guide.mjs';

const manifest = JSON.parse(await readFile(new URL('../lessons/manifest.json', import.meta.url), 'utf8'));
for (const lesson of manifest.lessons) {
  const html = await readFile(new URL('../' + lesson.path, import.meta.url), 'utf8');
  for (const fragment of [studyGuide, practiceGuide, recallGuide, finishGuide]) {
    assert.equal(html.split(fragment).length, 2, `${lesson.number}: missing or repeated guidance`);
  }
  for (const id of ['study-read', 'study-worked', 'study-guided', 'study-practice', 'study-recall', 'lesson-mcqs', 'study-finish']) {
    assert.equal(html.split(`id="${id}"`).length, 2, `${lesson.number}: invalid target ${id}`);
  }
  const stages = ['study-read', 'study-worked', 'study-guided', 'study-practice', 'study-recall', 'lesson-mcqs', 'study-finish'].map(id => html.indexOf(`id="${id}"`));
  assert.deepEqual(stages, [...stages].sort((a,b) => a-b), `${lesson.number}: teaching must precede practice`);
  assert.ok(html.indexOf('class="concept-section"') < stages[1]);
  const worked = html.slice(stages[1], stages[2]);
  assert.ok(!/<details(?![^>]*\bopen(?:\s|>))[^>]*>/.test(worked), `${lesson.number}: worked answers must be visible`);
  assert.equal(lesson.revision, createHash('sha256').update(html).digest('hex').slice(0, 12));
  assert.throws(() => addStudyGuide(html), /already exists/);
}
const generator = await readFile(new URL('./generate-lessons.mjs', import.meta.url), 'utf8');
assert.ok(generator.includes('return addStudyGuide(`<!doctype html>'));
assert.throws(() => addStudyGuide('<html></html>'), /Expected one marker/);
console.log(`Study guidance and revision checks passed for ${manifest.lessons.length} lessons.`);
