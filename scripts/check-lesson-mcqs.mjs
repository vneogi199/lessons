// Optional check; not invoked by generation. Run only when tests are authorized.
import assert from "node:assert/strict";
import { lessonMcqs, mcqMarkup } from "./lesson-mcqs.mjs";

const concepts = [
  { term: "Lists", definition: "Lists preserve positional order." },
  { term: "Sets", definition: "Sets retain unique members." },
  { term: "Dictionaries", definition: "Dictionaries associate keys with values." },
  { term: "Tuples", definition: "Tuples have immutable outer structure." },
  { term: "Names", definition: "Names refer to objects." }
];
const diagram = {
  stages: ["Accept", "Validate", "Compute", "Return"].map(name => ({ name, detail: `Perform ${name}.` })),
  probe: "Change the input.", evidence: "Inspect the result."
};
for (let number = 10; number <= 17; number++) {
  const bank = lessonMcqs({ number }, diagram, concepts);
  assert.equal(bank.questions.length, 3);
  assert.deepEqual(bank.uncoveredTerms, []);
  assert.deepEqual(new Set(bank.questions.flatMap(question => question.terms)), new Set(concepts.map(item => item.term)));
  for (const question of bank.questions) {
    assert.equal(new Set(question.options).size, question.options.length);
    assert.equal(new Set(question.options.map(option => option.trim().split(/\s+/).length)).size, 1);
    assert.ok(question.answer >= 0 && question.answer < question.options.length);
    assert.equal(question.explanations.length, question.options.length);
  }
  assert.deepEqual(bank, lessonMcqs({ number }, diagram, concepts));
  const html = mcqMarkup(bank, { sourceUrl: "https://example.org/?a=1&b=2", sourceLabel: "A < B" });
  assert.ok(html.includes("A &lt; B"));
  assert.ok(!html.includes("<details open"));
  assert.ok(html.includes('name="mcq-0"'));
}
const unresolved = lessonMcqs({ number: 1 }, diagram, [{ term: "Unknown", definition: "Unknown is one part of a system." }]);
assert.deepEqual(unresolved.uncoveredTerms, ["Unknown"]);
assert.equal(unresolved.questions.length, 1);
const singleton = lessonMcqs({ number: 1 }, diagram, concepts.slice(0, 1));
assert.deepEqual(singleton.uncoveredTerms, ["Lists"]);
for (const [number, term] of [["0004", "Debugging as hypothesis testing"], ["0345", "FastAPI production architecture capstone"]]) {
  const bank = lessonMcqs({ number }, diagram, [{ term, definition: "Single-topic lesson." }]);
  assert.deepEqual(bank.uncoveredTerms, []);
  assert.equal(bank.questions[0].kind, "scenario");
  assert.equal(new Set(bank.questions[0].options.map(option => option.split(/\s+/).length)).size, 1);
}
console.log("MCQ construction checks passed.");
