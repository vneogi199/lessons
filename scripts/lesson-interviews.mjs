import { BESPOKE_EXAMPLES } from "./bespoke-examples.mjs";

const escape = value => String(value).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

// Reuse authored cases and mechanism evidence. These are rehearsal checkpoints,
// not a claim of new employer questions or independently reviewed new facts.
export function interviewQuestions(lesson, diagram) {
  const example = lesson.number === "0265"
    ? `<p>Consider rows = [[0]] * 2. Then execute rows[0][0] = 7.</p><details><summary>What does rows contain, and why?</summary><p>It contains [[7], [7]]. Both outer entries refer to the same inner list. Multiplication repeats references; it does not create independent children.</p></details><details><summary>Would rows[:] make the children independent?</summary><p>No. It copies the outer list and retains the child references. Construct each child separately when independent mutable rows are required.</p></details>`
    : BESPOKE_EXAMPLES[lesson.number];
  if (!example) throw new Error(`Missing interview case for ${lesson.number}`);
  const cases = [...example.matchAll(/<details><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)];
  if (cases.length < 2) throw new Error(`Insufficient case answers for ${lesson.number}`);
  const context = example.replace(/<details>[\s\S]*?<\/details>/g, "")
    .replace(/<figcaption[^>]*>/g, '<p class="interview-case-title">').replace(/<\/figcaption>/g, "</p>");
  const question = (prompt, answer, followup) => `<article class="senior-practice" data-interview-question><h3>${prompt}</h3><details><summary>Answer checkpoints</summary>${answer}<p>Follow-up: ${followup}</p></details></article>`;
  return `<div class="lesson-interview-bank" data-interview-count="${cases.length + 2}">
    <p>Answer aloud before opening the checkpoints. These questions reuse this lesson's worked case and mechanism. Explain the reason, not just the yes/no result. They supplement the MCQs and track design case.</p>
    <div class="interview-case">${context}</div>
    ${cases.map(([_, prompt, answer], index) => question(`${index + 1}. ${prompt}`, answer,
      "Change one input or assumption in this case. Predict the outcome, then check it against the explanation or a safe local experiment. State which boundary your change tests.")).join("\n")}
    ${question(`${cases.length + 1}. Explain the mechanism behind ${escape(lesson.title)}.`,
      `<ol>${diagram.stages.map(stage => `<li><strong>${escape(stage.name)}.</strong> ${escape(stage.detail)}</li>`).join("")}</ol><p>This is the lesson's teaching sequence. Distinguish it from actual runtime ordering, especially when work is concurrent.</p>`, escape(diagram.probe))}
    ${question(`${cases.length + 2}. How would you test this claim: ${escape(diagram.probe)}`,
      `<p>Evidence to inspect: ${escape(diagram.evidence)}</p><p>Write the initial state, one changed condition and the expected observation before running the check. Use the worked case above to justify the expectation. Distinguish what your fixture proves from what requires a real integration.</p>`,
      "Give a counterexample to an overbroad conclusion from your test. Explain one cost or constraint that would change your approach.")}
    ${Number(lesson.number) >= 622 && Number(lesson.number) <= 644 ? '<p><a href="../reference/behavioral-culture-interview-prep.html" target="_blank" rel="noreferrer">Behavioral and culture interviews: 24 questions, answer checkpoints, story worksheet and mock interview</a></p>\n    ' : ""}<p>Self-check: can you explain the mechanism, defend the result and handle the changed condition? Rehearse missed questions tomorrow without notes. Ask your teacher to review any result you cannot justify.</p>
  </div>`;
}
