import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { stockDepth } from './stock-interview-depth.mjs';
import { greedyStockExplanation } from './greedy-stock-explanation.mjs';
const manifest = JSON.parse(await readFile(new URL('../lessons/manifest.json', import.meta.url), 'utf8'));
const lesson = manifest.lessons.find(item => item.number === '0041');
assert.ok((await readFile(new URL('../' + lesson.path, import.meta.url), 'utf8')).includes(stockDepth));
for (const number of ['0030', '0040', '0041']) {
  const target = manifest.lessons.find(item => item.number === number);
  assert.ok((await readFile(new URL('../' + target.path, import.meta.url), 'utf8')).includes(greedyStockExplanation));
}
const snippets = [...stockDepth.matchAll(/<pre data-stock-example="[^"]+"><code>([\s\S]*?)<\/code>/g)];
assert.equal(snippets.length, 3);
const oracle = `
from itertools import product
def brute(prices, limit):
    def visit(day, holding, remaining):
        if day == len(prices):
            return float('-inf') if holding else 0
        best = visit(day + 1, holding, remaining)
        if holding and remaining:
            best = max(best, prices[day] + visit(day + 1, False, remaining - 1))
        elif not holding and remaining:
            best = max(best, -prices[day] + visit(day + 1, True, remaining))
        return best
    return visit(0, False, limit)
for length in range(7):
    for prices in product(range(3), repeat=length):
        for fn, limit in ((profit_one, 1), (profit_many, length), (profit_two, 2)):
            assert fn(prices) == brute(prices, limit), (fn.__name__, prices)
assert [f([2,5,1,4,0,3]) for f in (profit_one,profit_many,profit_two)] == [3,9,6]
assert [f([1,3,2,4,3,5]) for f in (profit_many,profit_two)] == [6,5]
assert [f([1,4,2,7,3,8]) for f in (profit_many,profit_two)] == [13,11]
`;
const result = spawnSync(process.env.LESSON_PYTHON || 'python3', ['-c', snippets.map(x => x[1]).join('\n') + oracle], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || String(result.error));
console.log('Stock I/II/III: worked cases and 1,093 exhaustive small inputs passed against a brute-force oracle.');
