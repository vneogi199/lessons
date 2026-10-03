// Recall questions reuse the lesson's explanations, not invented false claims.
// These do not certify coding skill or senior interview readiness.
import { REVIEW_SCENARIOS } from "./reviewed-lesson-content.mjs";
import { POLARS_SCENARIOS } from "./polars-content.mjs";
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

function permutations(values) {
  if (values.length < 2) return [values];
  return values.flatMap((value, index) => permutations(values.filter((_, position) => position !== index))
    .map(rest => [value, ...rest]));
}

function choices(correct, seed) {
  // Four short mappings at most; never enumerate permutations of a long trace.
  const variants = permutations(correct).filter(value => value.join() !== correct.join());
  const wrong = variants.filter((_, index) => index % 2 === seed % 2).slice(0, 3);
  for (const variant of variants) {
    if (wrong.length === 3) break;
    if (!wrong.some(value => value.join() === variant.join())) wrong.push(variant);
  }
  const answer = seed % (wrong.length + 1);
  wrong.splice(answer, 0, correct);
  return { variants: wrong, answer };
}

function concealTerms(definition, terms) {
  let result = definition;
  for (const term of [...terms].sort((a, b) => b.length - a.length)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, "giu"), "$1[concept]");
  }
  return result;
}

export function lessonMcqs(lesson, diagram, concepts) {
  const questions = [];
  const authored = REVIEW_SCENARIOS[lesson.number] ?? POLARS_SCENARIOS[lesson.number] ?? {
    "0004": {
      kind: "scenario", terms: ["Debugging as hypothesis testing"],
      prompt: "A cache computes twice when its stored result is zero. The guard is if (!cache.get(key)). Which change directly addresses the reported cause while retaining caching?",
      context: ["Zero is a valid result. The computation is synchronous and there are no concurrent calls."],
      options: ["Increase cache capacity", "Test key membership", "Delay subsequent calls", "Convert zero values"],
      answer: 1,
      explanations: [
        "Capacity does not change how a cached zero is interpreted.",
        "Membership distinguishes an absent key from a present key whose value is zero.",
        "Waiting does not change the falsey-value check in this synchronous example.",
        "Changing valid data to fit a broken guard can change the function's contract."
      ],
      reasoning: ["Use cache.has(key) to decide whether computation is needed. A regression example should call the same zero-producing key twice and observe one computation, then use a different key to ensure misses still compute. This does not establish correctness for concurrent asynchronous calls."],
      followup: "Now make computation asynchronous. Explain whether simultaneous misses require sharing an in-flight promise and how a rejection should be handled."
    },
    "0345": {
      kind: "scenario", terms: ["FastAPI production architecture capstone"],
      prompt: "The capstone must create a project, enqueue a durable outbox event and remember an idempotent response. Which persistence boundary avoids a committed project with no recoverable event intent?",
      context: ["All three records use the same transactional database. The outbox publisher runs separately and may retry."],
      options: ["Commit project first", "Publish before persistence", "Cache response separately", "Commit records together"],
      answer: 3,
      explanations: [
        "A crash between the project commit and outbox write leaves a publication gap.",
        "A published event can describe a project whose database transaction subsequently fails.",
        "A separate cache does not make the project, outbox intent and replay record atomic.",
        "One transaction can commit or roll back the project, durable outbox intent and replay result together."
      ],
      reasoning: ["The adapter must also serialize competing scoped idempotency claims and compare request intent. The transaction protects these database writes, not arbitrary external side effects. The publisher and consumers must tolerate duplicate delivery. Thin route code alone does not implement those guarantees."],
      followup: "Describe the crash-after-commit-before-response test, a conflicting replay, cross-tenant key reuse and a duplicate event delivery."
    }
  }[lesson.number];
  if (authored) questions.push(authored);
  const uncoveredTerms = [];
  const unique = [];
  for (const concept of concepts) {
    if (authored?.terms.includes(concept.term)) continue;
    // Do not turn unresolved glossary placeholders into purported assessments.
    if (/ is one (?:part|responsibility|AWS)| is a technical term in /.test(concept.definition)
        || unique.some(item => item.definition === concept.definition)) {
      uncoveredTerms.push(concept.term);
    } else unique.push(concept);
  }

  for (let start = 0; start < unique.length; start += 4) {
    const group = unique.slice(start, start + 4);
    if (group.length === 1 && start > 0) group.unshift(unique[start - 1]);
    if (group.length < 2) {
      uncoveredTerms.push(...group.map(item => item.term));
      continue;
    }
    const seed = Number(lesson.number) + start;
    const offset = seed % group.length;
    const definitions = group.map((_, index) => group[(index + offset) % group.length]);
    const correct = group.map(item => definitions.indexOf(item) + 1);
    const { variants, answer } = choices(correct, seed);
    questions.push({
      kind: "concept-matching",
      terms: group.map(item => item.term),
      prompt: "Match each concept to its explanation.",
      context: definitions.map(item => concealTerms(item.definition, [item.term])),
      options: variants.map(mapping => group.map((item, index) => `${item.term}: ${mapping[index]}`).join("; ")),
      answer,
      explanations: variants.map(mapping => {
        const mismatches = group.flatMap((item, index) => mapping[index] === correct[index] ? []
          : [`“${item.term}” matches explanation ${correct[index]}, not ${mapping[index]}.`]);
        return mismatches.length ? mismatches.join(" ") : "Every concept matches its explanation.";
      }),
      reasoning: group.map(item => `${item.term}: ${item.definition}`),
      followup: "Without looking back, give a concrete example and a counterexample for each concept. Explain the distinction aloud tomorrow."
    });
  }

  // A trace is a teaching model, not necessarily a total ordering of real events.
  // Use bounded windows so concurrency diagrams and long traces stay manageable.
  for (let start = 0; start < diagram.stages.length - 1; start += 3) {
    const stages = diagram.stages.slice(start, start + 4);
    const seed = Number(lesson.number) + start + 1;
    const offset = (seed % (stages.length - 1)) + 1;
    const shuffled = stages.map((_, index) => stages[(index + offset) % stages.length]);
    const correct = stages.map(stage => shuffled.indexOf(stage) + 1);
    const { variants, answer } = choices(correct, seed);
    questions.push({
      kind: "mechanism-trace", terms: [],
      prompt: "Put these steps in the order used by the lesson's trace. This teaching order may differ from the order of events at runtime.",
      context: shuffled.map(stage => `${stage.name}: ${stage.detail}`),
      options: variants.map(mapping => mapping.join(" → ")),
      answer,
      explanations: variants.map(mapping => {
        const first = mapping.findIndex((value, index) => value !== correct[index]);
        return first < 0 ? "This reproduces the lesson’s trace."
          : `At position ${first + 1}, the trace uses “${stages[first].name}”, not “${shuffled[mapping[first] - 1].name}”.`;
      }),
      reasoning: stages.map(stage => `${stage.name}: ${stage.detail}`),
      followup: `${diagram.probe} Evidence to inspect: ${diagram.evidence}`
    });
  }
  return { questions, uncoveredTerms };
}

export function mcqMarkup(bank, source) {
  const e = escapeHtml;
  return `<section class="card lab" id="lesson-mcqs" data-mcq-count="${bank.questions.length}">
    <h2>Practice MCQs</h2>
    <p>Answer from memory, then read the explanation. These questions check recall of concepts and mechanisms. You still need the coding exercise and design rehearsal; a correct guess does not show that you understand the topic.</p>
    ${bank.questions.map((question, index) => `<article class="senior-practice" data-mcq-kind="${question.kind}">
      <h3>${index + 1}. ${e(question.prompt)}</h3>
      <ol>${question.context.map(text => `<li>${e(text)}</li>`).join("")}</ol>
      <fieldset><legend>Choose one answer</legend>
      ${question.options.map((option, choice) => `<label style="display:block;margin:10px 0"><input type="radio" name="mcq-${index}" value="${choice}"> ${String.fromCharCode(65 + choice)}. ${e(option)}</label>`).join("")}
      </fieldset>
      <details><summary>Answer and explanation</summary>
        <p><strong>Answer: ${String.fromCharCode(65 + question.answer)}.</strong> ${e(question.options[question.answer])}</p>
        <ul>${question.explanations.map((text, choice) => `<li>${String.fromCharCode(65 + choice)}. ${e(text)}</li>`).join("")}</ul>
        ${question.reasoning.map(text => `<p>${e(text)}</p>`).join("")}
        <p>${e(question.followup)}</p>
      </details>
    </article>`).join("")}
    <p><a href="${e(source.sourceUrl)}" target="_blank" rel="noreferrer">Review the lesson source: ${e(source.sourceLabel)}</a>. If a distinction remains unclear, ask for an explanation. Try missed questions again tomorrow and explain your reasoning before opening the answer.</p>
    ${bank.uncoveredTerms.length ? `<p>Separate term questions still need authoring for: ${bank.uncoveredTerms.map(e).join(", ")}. Their coverage is not implied by the mechanism questions.</p>` : ""}
  </section>`;
}
