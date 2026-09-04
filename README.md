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

All lessons define every title-level subtopic for a beginner, then connect those terms through one mechanism explanation. Generic headings, agenda, outcome, and repeated template prose are intentionally omitted. The prose applies core ASD-STE100 Simplified Technical English rules.

Focus mode uses the complete generated curriculum and its own versioned `localStorage` key. Its dashboard summarizes overall and per-track progress and links to each track's next unfinished lesson. Progress can be exported to or restored from a validated JSON backup. A mastered active lesson can be marked incomplete without resetting other progress by tabbing to `mark_incomplete()` or pressing Alt+U.

## Curriculum authoring

The browser does not generate lesson content. After Codex changes `roadmap.yaml` or the lesson template, rebuild the checked-in lesson set explicitly:

```bash
node scripts/generate-lessons.mjs
```

This writes the standalone lesson files, deep-dive coverage references, and `lessons/manifest.json`. It is not part of startup.

Validate the complete generated set with:

```bash
node scripts/validate-lessons.mjs
```

## What to compare

1. How quickly can you understand where you are?
2. How naturally can you choose the next lesson?
3. Does the lesson view help you focus?
4. Which progress visualization makes you want to continue?

Focus mode is a testable curriculum MVP. Account sync, country-specific relocation guidance, richer per-lesson exercises, and production-level validation remain future work.
