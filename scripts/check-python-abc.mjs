import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { abcDepth } from './python-abc-depth.mjs';
const manifest = JSON.parse(await readFile(new URL('../lessons/manifest.json', import.meta.url), 'utf8'));
const lesson = manifest.lessons.find(item => item.number === '0273');
assert.ok((await readFile(new URL('../' + lesson.path, import.meta.url), 'utf8')).includes(abcDepth));
const examples = [...abcDepth.matchAll(/<pre data-abc-example="([^"]+)"><code>([\s\S]*?)<\/code><\/pre>/g)];
assert.equal(examples.length, 3);
for (const [, name, source] of examples) {
  const result = spawnSync(process.env.LESSON_PYTHON || 'python3', ['-c', source], { encoding: 'utf8' });
  assert.equal(result.status, 0, name + ': ' + (result.stderr || String(result.error)));
}
console.log('Lesson 0273: registration, inherited methods, and abstract enforcement examples passed.');
