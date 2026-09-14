# Tutorial Site Focus Mode

The self-contained focus-mode tutorial application.

## Run locally

From the project root (`full-stack-ai-engineer-lessons`):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. The lesson view is at <http://localhost:8000/lesson.html>.

The focus-mode variant is the currently preferred direction. It uses a dark, terminal-inspired interface and looks for the locally installed `BlexMono Nerd Font`/IBM Plex Mono Nerd Font before falling back to the web version of IBM Plex Mono.

Focus mode loads the generated `lessons/manifest.json` catalog. Every lesson is a standalone HTML file with a compact beginner foundation, term guide, mental model, blackboard, mechanism walkthrough, practical lab, code-reading guide, common mistakes, interview preparation, a primary source, and a retrieval check. Passing the check updates track and overall progress in the shell.

The curriculum targets senior interviews for a learner with around ten years of experience, while retaining clear entry explanations for unfamiliar subjects. Every lesson includes written senior rehearsal and links to a worked track case with reasoning, a changed constraint, and feedback criteria. Open the [senior practice reference](reference/senior-interview-practice.html) or the [content review of all 644 lessons](CONTENT-REVIEW.md).

Computer-science lessons 0018–0050 include curated, topic-specific LeetCode practice links with Blind 75, NeetCode 150, and Striver A2Z alignment badges.

All 644 lessons have completed individual content review for senior interviews as of 2026-09-14, with zero pending reviews or changed revisions at sign-off. The [per-lesson checklist](REVIEW-CHECKLIST.md) tracks these passes and any later content changes, separately from integration testing. Manual sign-offs live in `lesson-review-status.json`, with individual findings in [REVIEW-EVIDENCE.md](REVIEW-EVIDENCE.md); automated checks never mark content reviewed. No installations were needed. Live deployment and external integrations remain unverified. The existing automatic lesson check records orientation progress only; it does not prove knowledge or lab completion. Reading estimates exclude implementation and interview practice.

Focus mode uses the complete generated curriculum and its own versioned `localStorage` key. Its dashboard summarizes overall and per-track progress and links to each track's next unfinished lesson. Progress can be exported to or restored from a validated JSON backup. A mastered active lesson can be marked incomplete without resetting other progress by tabbing to `mark_incomplete()` or pressing Alt+U.

## GitHub Pages

Publish the repository root, including `index.html`, `lesson.html`, the JavaScript/CSS files, `lessons/` and `reference/`. Generated content must be committed or included in the deployment artifact; GitHub Pages does not run the lesson generator automatically.

Lesson manifest paths are relative to the site root (`lessons/…`), not the domain root. This preserves a project-site prefix such as `/lessons/`. After changing content or upgrading from the old `../../lessons/…` paths, regenerate and publish the manifest and reference pages together:

```bash
node scripts/generate-lessons.mjs
node scripts/check-pages-links.mjs
node scripts/validate-lessons.mjs
```

The link check verifies all lesson targets and local HTML links at `/`, `/lessons/` and `/nested/project/`. It does not deploy the site. For publishing-source problems, see [GitHub Pages 404 troubleshooting](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites).

## Curriculum authoring

The browser does not generate lesson content. After Codex changes `roadmap.yaml` or the lesson template, rebuild the checked-in lesson set explicitly:

```bash
node scripts/generate-lessons.mjs
```

This writes the standalone lesson files, deep-dive coverage references, and `lessons/manifest.json`. It is not part of startup.

Validate the complete generated set with:

```bash
node scripts/validate-lessons.mjs
node scripts/review-lessons.mjs
```

The review requires Python 3.12+ (set `LESSON_PYTHON=python3.13` if your default is older). It audits all 644 lessons and runs selected local examples across foundations, computer science, JavaScript, Node.js, low-level design and ML/LLM fundamentals. No fallback definitions or unexplained starter reuse remain: 83 lessons retain shared mechanisms with distinct exercises. See `CONTENT-REVIEW.md` for exact execution coverage and limitations; browser, database, cloud and framework integrations are not all executed.

The [TypeScript content review](TYPESCRIPT-CONTENT-REVIEW.md) covers all 45 lessons, including their senior reasoning and lab prerequisites. Run `node scripts/check-typescript-lessons.mjs` with `tsc` on PATH to compile and execute 26 selected snippets and their assertions/probes. The other 19 are explicitly scoped counterexamples, configuration/tooling recipes, integration sketches, or project assignments, not end-to-end-tested applications.

## What to compare

1. How quickly can you understand where you are?
2. How naturally can you choose the next lesson?
3. Does the lesson view help you focus?
4. Which progress visualization makes you want to continue?

Focus mode is a testable curriculum MVP. Account sync, country-specific relocation guidance, richer per-lesson exercises, and production-level validation remain future work.
