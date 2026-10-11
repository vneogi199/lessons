import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { decoratorDepth } from './python-decorator-depth.mjs';
const manifest = JSON.parse(await readFile(new URL('../lessons/manifest.json', import.meta.url), 'utf8'));
const lesson = manifest.lessons.find(item => item.number === '0280');
assert.ok((await readFile(new URL('../' + lesson.path, import.meta.url), 'utf8')).includes(decoratorDepth));
for (const [, name, source] of decoratorDepth.matchAll(/<pre data-decorator-example="([^"]+)"><code>([\s\S]*?)<\/code><\/pre>/g)) {
  const result = spawnSync(process.env.LESSON_PYTHON || 'python3', ['-c', source], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || String(result.error));
  if (name === 'simple') assert.equal(result.stdout, 'deco2 applied\ndeco1 applied\ndeco1 before\ndeco2 before\noriginal function\ndeco2 after\ndeco1 after\n');
}
console.log('Lesson 0280: three decorator examples passed, including exact printed execution order.');
