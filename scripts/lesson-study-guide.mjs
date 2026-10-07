export const studyGuide = `<nav class="card study-guide" aria-label="Lesson study steps">
    <h2>Start here</h2>
    <p>Work through one lesson at a time. Keep a note open for your predictions and questions.</p>
    <ol>
      <li><a href="#study-read">Learn the concept.</a> Read the definitions and explanation first. You do not need to answer questions yet.</li>
      <li><a href="#study-worked">Follow the worked example.</a> Read the steps and their explained results. The answers are visible so you can learn how the example works.</li>
      <li><a href="#study-guided">Try with help.</a> Use the trace to practise the steps. Keep the worked example open and use the hints when needed.</li>
      <li><a href="#study-practice">Try it yourself.</a> Attempt the practice task. Change one input or assumption and explain what changes.</li>
      <li><a href="#study-recall">Explain it without notes.</a> Answer one interview question aloud, then check the answer. Complete the <a href="#lesson-mcqs">MCQs</a> before opening their answers.</li>
      <li><a href="#study-finish">Review and move on.</a> Correct one mistake and record anything you cannot explain yet.</li>
    </ol>
    <p>Short on time? Learn the concept and follow the worked example today. Resume with the guided trace next time. Save linked labs and deeper track cases for a separate session; the reading estimate excludes them.</p>
  </nav>
  <div id="study-read"></div>`;

export const practiceGuide = `<p data-study-instruction="practice">Now try the task before reading more answers. Write the expected result first. Run code only in a suitable isolated environment after checking the setup and safety notes. If you cannot run it, trace it on paper and mark it as untested. For a design or discussion task, write your own example. When you finish, continue to <a href="#study-recall">Interview practice</a>.</p>`;

export const recallGuide = `<p data-study-instruction="recall">Hide your notes. Choose one question and answer aloud in about 90 seconds. Then open its answer checkpoints. Add what you missed and try again in your own words. Use the remaining questions for another session. Next, answer the <a href="#lesson-mcqs">MCQs</a>, then <a href="#study-finish">review your progress</a>.</p>`;

export const finishGuide = `<div data-study-instruction="finish">
    <h2>Before you move on</h2>
    <p>Can you explain the example, predict the effect of one change, and describe one failure or limitation? If not, return to the <a href="#study-read">explanation</a> or <a href="#study-practice">practice task</a>. Ask your teacher about the exact step that is unclear; include your prediction and what confused you.</p>
    <p>Write one sentence about what you learned and one question to revisit. Tomorrow, explain the example again without notes. The check below records progress only; it does not prove mastery. When you are ready, use the next-lesson arrow in the reader.</p>
  </div>`;

export function addStudyGuide(html) {
  if (html.includes('class="card study-guide"')) throw new Error('Study guide already exists');
  const explanation = html.match(/<div class="grid">\s*(<section class="card">[\s\S]*?<\/section>)\s*(?=<aside class="card blackboard">)/);
  const terms = html.match(/<section class="concept-section"[^>]*>[\s\S]*?<\/section>/);
  if (!explanation || !terms) throw new Error('Expected one marker: explanation and definitions');
  html = html.replace(explanation[0], '<div class="grid">\n')
    .replace(terms[0], '')
    .replace('<aside class="card blackboard">', '<aside class="card blackboard" id="study-guided" style="grid-column:1 / -1">')
    .replace('Read the first step. Predict what each next step does, then open it to compare.', 'Now use what you learned. Read the first step, then try to explain the next one. Open each step for help or feedback. Refer to the worked example whenever you need it. After the trace, continue to Practice.');
  // Keep teaching answers visible; independent interview and MCQ answers stay closed.
  const start = html.indexOf('  </header>') + '  </header>'.length;
  const end = html.indexOf('<div class="grid">', start);
  const worked = html.slice(start, end).replace(/<details(?![^>]*\bopen(?:\s|>))([^>]*)>/g, '<details open$1>');
  html = html.slice(0, start) + '\n<section id="study-worked" aria-label="Worked example"><p>Follow this example with the answers visible. Read why each result occurs before trying a task yourself.</p>' + worked + '</section>\n' + html.slice(end);
  const changes = [
    ['  </header>\n', '  </header>\n\n  ' + studyGuide + '\n' + terms[0].replace(/<details /g, '<details open ') + '\n' + explanation[1] + '\n'],
    ['  <section class="card lab">\n    <h2>Practice</h2>', '  <section class="card lab" id="study-practice">\n    <h2>Practice</h2>\n    ' + practiceGuide],
    ['  <section class="card interview">', '  <section class="card interview" id="study-recall">'],
    ['    <h2>Interview practice</h2>', '    <h2>Interview practice</h2>\n    ' + recallGuide],
    ['  <section class="card mastery">', '  <section class="card mastery" id="study-finish">\n    ' + finishGuide],
  ];
  for (const [before, after] of changes) {
    if (html.split(before).length !== 2) throw new Error('Expected one marker: ' + before);
    html = html.replace(before, after);
  }
  return html.replace(/^[ \t]+$/gm, '');
}
