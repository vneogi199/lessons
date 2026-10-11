export const greedyStockExplanation = `<section class="card mechanism-walkthrough" id="greedy-stock-reasoning">
<h2>How to recognize a safe greedy choice</h2>
<p>A greedy algorithm commits to a locally useful choice, then continues without reconsidering it. “Local” means the choice looks best at this step. “Global” means the final answer is best for the whole problem. A greedy algorithm is correct only when you can explain why its local choices preserve an optimal final answer.</p>
<p>Think of filling a small bag. Taking the most valuable item first sounds sensible, but it may leave no room for two items worth more together. “Choose the biggest” is a proposal, not a proof.</p>
<h3>Stock II: take each rise</h3>
<p>Suppose prices are [1, 4, 2, 7, 3, 8]. You may trade as many times as needed, but hold only one share at a time. There are no fees or cooldowns. Compare each day with the previous day:</p>
<pre>Move       Change     Take it?     Running profit
1 → 4        +3         yes              3
4 → 2        −2         no               3
2 → 7        +5         yes              8
7 → 3        −4         no               8
3 → 8        +5         yes             13</pre>
<p>These gains correspond to three legal transactions: buy at 1 and sell at 4, buy at 2 and sell at 7, then buy at 3 and sell at 8. You never hold two shares.</p>
<p>Why is this optimal? Any buy-to-sell profit equals the sum of the daily changes during that holding period. A negative change reduces the profit. No valid strategy can collect more than all the positive changes. Stock II lets us collect exactly those changes by trading each rising run. We reach that upper bound, so the greedy result is optimal.</p>
<p>For a continuous rise [1, 2, 4], adding 1 + 2 gives 3, just like buying at 1 and selling at 4. You do not need to physically sell and rebuy at every intermediate day. This is an offline exercise with the full price array, not a way to predict tomorrow's market.</p>
<h3>Stock III: a trade uses a limited slot</h3>
<p>Now keep the same prices but allow at most two transactions. The previous answer of 13 uses three, so it is invalid. The locally profitable sale at 4 uses a transaction that could instead remain open until 7.</p>
<pre>Pick the two largest separate rises:
2 → 7 gives 5; 3 → 8 gives 5. Total: 10.

Merge the first two rises into one longer holding:
1 → 7 gives 6; 3 → 8 gives 5. Total: 11.</pre>
<p>The merged holding accepts the drop from 4 to 2. That loses 2 compared with taking both early rises separately, but saves a transaction slot. So “take every rise” and “take the two biggest rises” both fail for III.</p>
<p>This does not mean every greedy idea is impossible. It means these rules have no valid proof under the new constraint. Dynamic programming gives a direct solution: retain the best outcome for each legal situation instead of committing to a sale immediately.</p>
<h3>Read the four states as choices</h3>
<p>In the Stock III code, buy1 is the best cash balance while holding before a first sale; sell1 is the best balance while not holding after at most one sale. buy2 is the best holding balance after at most one sale; sell2 is the best balance while not holding after at most two sales. These are alternative histories, not four accounts belonging to one trade sequence.</p>
<p>At price 4, the algorithm keeps both the option to remain holding from price 1 and the option to sell for profit 3. At price 7, the first option can sell for profit 6. The earlier sale did not erase it. That is the key difference from committing greedily to one history.</p>
<p>For every state, max means “keep yesterday's best result or take the permitted action today.” It does not make the algorithm greedy: the state table retains several alternatives with different remaining opportunities. Each state needs only its best balance because a worse balance in the same situation cannot improve any identical future sequence of actions.</p>
<h3>A checklist before choosing greedy</h3>
<ol><li>State the objective and constraints. How many trades? Any fee or cooldown?</li><li>Propose a precise local rule, such as collecting each positive adjacent difference.</li><li>Try to break it with a small input. A capacity or transaction limit often makes choices compete.</li><li>Prove it: show an upper bound that your result reaches, or show how an optimal solution can exchange its first choice for yours without becoming worse.</li><li>If the rule fails, identify the information the next decision needs. For Stock III that includes whether you hold a share and how many sales are allowed.</li></ol>
<p>Sorting is not a requirement for greedy algorithms. Do not sort stock prices: it would destroy the chronological constraint. Passing examples is useful evidence, but it is not a proof.</p>
<h3>Try a smaller case</h3>
<p>For [1, 3, 2, 4, 3, 5], find the unlimited profit and the best profit with two transactions. Try it on paper before opening the answer.</p>
<details><summary>Answer and reasoning</summary><p>Unlimited gives 2 + 2 + 2 = 6. Two transactions give 5: buy at 1, sell at 4, then buy at 3, sell at 5. The first transaction accepts one drop to preserve the second slot. Keeping just two of the individual rises would give only 4.</p></details>
<details><summary>Interview: How do I explain II versus III in one answer?</summary><p>In II, unlimited fee-free transactions let me collect every positive daily change, which is also an upper bound on profit. In III, transaction slots couple the decisions. I track the best holding and not-holding balances for up to two sales so an early sale does not discard a better later choice.</p></details>
<p>Once this reasoning is clear, work through the Stock I–III code and state trace in lesson 0041. Ask your teacher which step is unclear before memorizing the recurrence.</p>
<p>Problem rules: <a href="https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/">Stock II</a> · <a href="https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/">Stock III</a>.</p>
</section>`;
