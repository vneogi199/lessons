export const stockDepth = `<section class="card mechanism-walkthrough" id="stock-interviews">
<h2>Buy and sell stock I, II, and III</h2>
<p>Start with the transaction limit. A transaction is one buy followed by one sell. In these exercises you hold at most one share, cannot sell before buying, and pay no fees. Doing nothing is allowed. The numbers are teaching fixtures, not a trading strategy.</p>
<p>Read each worked example before attempting the code. Ask the interviewer about transaction limits, fees, cooldowns, and whether the output needs actual buy/sell days. The solutions below return profit only.</p>
<h3>I: at most one transaction</h3>
<p>For prices [5, 2, 6, 1, 4], buy at 2 and sell later at 6. Profit is 4. Taking the global minimum 1 and maximum 6 would give 5, but the sale would occur before the purchase.</p>
<p>A brute-force solution checks every earlier buy for every sale: O(n²) time. Instead, keep the cheapest earlier price. For each possible sale today, that cheapest earlier purchase gives the best profit ending today. Compare it with the best profit seen so far.</p>
<pre data-stock-example="one"><code>def profit_one(prices):
    cheapest = float("inf")
    best = 0
    for price in prices:
        best = max(best, price - cheapest)
        cheapest = min(cheapest, price)
    return best

assert profit_one([5, 2, 6, 1, 4]) == 4</code></pre>
<p>We calculate the sale before updating cheapest, so it refers only to earlier days. On the first day the candidate is negative infinity and best stays zero. The loop invariant is: best is the best completed transaction so far, and cheapest is the minimum price processed so far. Time O(n), auxiliary space O(1).</p>
<h3>II: unlimited transactions</h3>
<p>For the same prices, buy at 2 and sell at 6, then buy at 1 and sell at 4. Total profit is 4 + 3 = 7. Add each positive change between adjacent days.</p>
<pre data-stock-example="many"><code>def profit_many(prices):
    profit = 0
    for day in range(1, len(prices)):
        profit += max(0, prices[day] - prices[day - 1])
    return profit

assert profit_many([5, 2, 6, 1, 4]) == 7</code></pre>
<p>Why does the greedy choice work? A rise from 2 to 4 to 6 gives (4 − 2) + (6 − 4) = 6 − 2. Consecutive positive changes can be combined into one valley-to-peak transaction. Holding through a decrease cannot improve the result when selling and buying again has no fee, cooldown, or transaction limit. Time O(n), auxiliary space O(1).</p>
<p>This proof depends on those rules. It does not justify adding positive changes when there is a transaction fee or a limit of two transactions.</p>
<h3>III: at most two transactions</h3>
<p>Use [1, 4, 2, 7, 3, 8]. One transaction earns 7. Unlimited transactions earn 3 + 5 + 5 = 13. With two transactions, buy at 1 and sell at 7, then buy at 3 and sell at 8: 6 + 5 = 11. Picking the two largest upward runs gives only 10; sometimes merging runs is better.</p>
<p>First derive a simpler O(n)-space solution: let left[i] be the best one-transaction profit on days 0 through i, and right[i] the best one-transaction profit from i onward. Compute each with a directional scan, then maximize left[i] + right[i + 1], also allowing just one transaction. The split prevents overlapping holdings. This takes O(n) time.</p>
<p>To reduce space, track four states. A state stores the best cash balance for that situation, not a stock price. Impossible holding states start at negative infinity.</p>
<ul><li>buy1: holding a share, with at most zero completed sales.</li><li>sell1: holding nothing, with at most one completed sale.</li><li>buy2: holding a share, with at most one completed sale.</li><li>sell2: holding nothing, with at most two completed sales.</li></ul>
<p>At price p, either keep a state or enter it from yesterday's preceding state: buy1 = max(old buy1, −p); sell1 = max(old sell1, old buy1 + p); buy2 = max(old buy2, old sell1 − p); sell2 = max(old sell2, old buy2 + p). Selling adds cash; buying subtracts cash.</p>
<pre data-stock-example="two"><code>def profit_two(prices):
    buy1 = buy2 = float("-inf")
    sell1 = sell2 = 0
    for price in prices:
        # Descending updates preserve yesterday's preceding states.
        sell2 = max(sell2, buy2 + price)
        buy2 = max(buy2, sell1 - price)
        sell1 = max(sell1, buy1 + price)
        buy1 = max(buy1, -price)
    return sell2

assert profit_two([1, 4, 2, 7, 3, 8]) == 11</code></pre>
<pre>Price   buy1   sell1   buy2   sell2
1        -1      0      -1      0
4        -1      3      -1      3
2        -1      3       1      3
7        -1      6       1      8
3        -1      6       3      8
8        -1      7       3     11</pre>
<p>A positive buy2 is possible: an earlier profit can exceed the next purchase cost. Zero in the sell states allows fewer than two transactions. We return a state with no share held. These descending updates forbid same-day chained actions; allowing a sale and repurchase at the same price adds no profit under these rules, so the optimal profit is unchanged. Time O(n), auxiliary space O(1).</p>
<h3>Practise before opening the answers</h3>
<p>For [2, 5, 1, 4, 0, 3], calculate the profits for I, II, and III. Hint: first count how many separate rises you can take under each limit.</p>
<details><summary>Check the three results</summary><p>I gives 3. II gives 9. III gives 6. Two transactions cannot capture all three rises.</p></details>
<p>Test an empty list, a single price, equal prices, decreasing prices, an increasing sequence, and the three-rise example. The official problems use nonempty arrays; these helpers also return zero for empty input. They assume valid nonnegative integer prices and do not implement API input validation.</p>
<details><summary>Interview: Why is max(prices) minus min(prices) wrong?</summary><p>It ignores time order. For [6, 1], it suggests a profit of 5 even though the only possible transaction loses money. The correct answer is zero.</p></details>
<details><summary>Interview: Why not apply the one-transaction algorithm twice?</summary><p>The best single transaction can occupy days needed by two better combined transactions. The state recurrence considers both choices at every day; it does not commit to one interval first.</p></details>
<details><summary>Interview: What if the limit is k?</summary><p>Track cash and holding states for each allowed transaction count. A straightforward DP takes O(nk) time and O(k) auxiliary space. With no other constraints, k at least floor(n/2) cannot restrict profitable transactions, so the unlimited solution suffices.</p></details>
<details><summary>Interview: What changes with a fee, cooldown, or required transaction days?</summary><p>A fee changes a buy or sell transition, charged once per transaction. A cooldown needs additional state or access to an earlier day's state. Returning buy/sell days requires recording decisions and a tie-breaking rule; these profit-only functions do not provide that history.</p></details>
<p>Tomorrow, explain why II is greedy but III needs a transaction-aware state. Ask your teacher to change one constraint and challenge the proof.</p>
<p>Practice statements: <a href="https://leetcode.com/problems/best-time-to-buy-and-sell-stock/">Stock I (121)</a> · <a href="https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/">Stock II (122)</a> · <a href="https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/">Stock III (123)</a>. These are standard practice variants; no employer-frequency ranking is claimed.</p>
</section>`;
