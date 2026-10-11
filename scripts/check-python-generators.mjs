import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { generatorDepth } from './python-generator-depth.mjs';
const manifest = JSON.parse(await readFile(new URL('../lessons/manifest.json', import.meta.url), 'utf8'));
const lesson = manifest.lessons.find(item => item.number === '0278');
assert.ok((await readFile(new URL('../' + lesson.path, import.meta.url), 'utf8')).includes(generatorDepth));
const examples = [...generatorDepth.matchAll(/<pre data-generator-example="([^"]+)"><code>([\s\S]*?)<\/code><\/pre>/g)];
assert.equal(examples.length, 6);
for (const [, name, source] of examples) {
  const result = spawnSync(process.env.LESSON_PYTHON || 'python3', ['-c', source], { encoding: 'utf8' });
  assert.equal(result.status, 0, name + ': ' + (result.stderr || String(result.error)));
  if (name === 'return') assert.equal(result.stdout, 'Start\nMiddle\nEnd\n');
}
console.log('Lesson 0278: six generator examples passed.');
