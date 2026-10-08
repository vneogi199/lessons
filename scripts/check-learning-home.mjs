import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('lessons/manifest.json', root), 'utf8'));
const nodes = new Map();
const document = { querySelector(selector) {
  if (!nodes.has(selector)) nodes.set(selector, { style: {}, innerHTML: '', textContent: '', hidden: true });
  return nodes.get(selector);
}};
const context = {
  document,
  fetch: async () => ({ ok: true, json: async () => manifest }),
  window: { Tutorial: {
    createProgressStore: () => ({ isComplete: () => false }),
    calculateProgress: (_store, lessons) => ({ total: lessons.length, complete: 0, percent: 0 }),
    initializeLessonSearch: () => {},
    escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
  }},
};
vm.runInNewContext(await readFile(new URL('dashboard.js', root), 'utf8'), context);
await new Promise(resolve => setImmediate(resolve));
assert.notEqual(nodes.get('#dashboard-error')?.hidden, false);
const syllabus = nodes.get('#track-summary').innerHTML;
assert.equal((syllabus.match(/class="track-syllabus"/g) || []).length, manifest.tracks.length);
for (const lesson of manifest.lessons) {
  assert.ok(syllabus.includes(`lesson.html#${encodeURIComponent(lesson.id)}`), lesson.number);
}
const route = nodes.get('#learning-route').innerHTML;
assert.equal((route.match(/<li>/g) || []).length, 6);
for (const [, id] of route.matchAll(/href="#(track-[^"]+)"/g)) assert.ok(syllabus.includes(`id="${id}"`));
assert.ok(!syllabus.includes('lessons mastered'));
console.log(`Learning home: six route stages, ${manifest.tracks.length} syllabuses, all ${manifest.lessons.length} lessons reachable.`);
