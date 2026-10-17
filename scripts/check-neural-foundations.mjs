import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { neuralFoundations, transformerFfn } from './neural-network-foundations.mjs';
const manifest = JSON.parse(await readFile(new URL('../lessons/manifest.json', import.meta.url), 'utf8'));
for (const [number, fragment] of [['0578', neuralFoundations], ['0582', transformerFfn]]) {
  const lesson = manifest.lessons.find(item => item.number === number);
  assert.ok((await readFile(new URL('../' + lesson.path, import.meta.url), 'utf8')).includes(fragment));
}
const examples = [...(neuralFoundations + transformerFfn).matchAll(/<pre data-neural-example="([^"]+)"><code>([\s\S]*?)<\/code>/g)];
assert.equal(examples.length, 5);
const source = examples.map(x => x[2].replaceAll('&lt;', '<').replaceAll('&gt;', '>')).join('\n');
const extra = `
assert dense_parameters(2, 3) + dense_parameters(3, 1) == 13
assert relu(-5) == 0
for run in (lambda: neuron([1], [1,2], 0), lambda: predict([1]), lambda: dense_parameters(0,2)):
    try:
        run()
    except ValueError:
        pass
    else:
        raise AssertionError('invalid dimensions accepted')
`;
const result = spawnSync(process.env.LESSON_PYTHON || 'python3', ['-c', source + extra], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || String(result.error));
console.log('Five neural-network examples passed: forward calculation, parameter counts, gradient step, transformer FFN, and dimension checks.');
