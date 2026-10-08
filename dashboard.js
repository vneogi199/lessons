(function () {
  const { createProgressStore, calculateProgress, escapeHtml } = window.Tutorial;
  const store = createProgressStore("full-stack-ai-roadmap.progress.v1");

  async function initialize() {
    try {
      const response = await fetch("lessons/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest request failed with status ${response.status}`);
      const manifest = await response.json();
      if (manifest.version !== 1 || !Array.isArray(manifest.tracks) || !Array.isArray(manifest.lessons)) {
        throw new Error("The lesson manifest has an unsupported format.");
      }

      const lessonsById = new Map(manifest.lessons.map((lesson) => [lesson.id, lesson]));
      const route = [
        ["python", "1. Transform data", "Use dictionaries, collections, and clear functions to turn incoming records into a consistent result. Explain missing values and duplicates."],
        ["fastapi", "2. Expose an API", "Validate the request, return a useful error, and test a successful request and a rejected request."],
        ["data-systems", "3. Store and query", "Model the records, write a query, and explain a transaction boundary. Check the result with a small fixture."],
        ["retrieval-rag", "4. Add retrieval", "Keep ingestion separate from answering. Inspect retrieved evidence before judging the generated answer."],
        ["agents", "5. Add tools only when needed", "Start with a fixed workflow. Add a bounded agent loop only if choosing the next action needs model judgment."],
        ["ai-quality-safety", "6. Evaluate before expanding", "Record failed cases, compare changes against the same labelled examples, and inspect latency and cost."],
      ];
      document.querySelector("#learning-route").innerHTML = route.map(([id, title, purpose]) => {
        const first = manifest.lessons.find(lesson => lesson.trackId === id);
        if (!first) throw new Error(`Study route track missing: ${id}`);
        return `<li><a href="lesson.html#${encodeURIComponent(first.id)}">${escapeHtml(title)}</a><p>${escapeHtml(purpose)}</p><a href="#track-${escapeHtml(id)}">Browse this track's syllabus</a></li>`;
      }).join("");
      window.Tutorial.initializeLessonSearch(manifest.lessons);
      const overall = calculateProgress(store, manifest.lessons);
      const tracks = manifest.tracks.map((track) => {
        const lessons = track.lessonIds.map((id) => lessonsById.get(id)).filter(Boolean);
        return { ...track, lessons, progress: calculateProgress(store, lessons) };
      });
      const started = tracks.filter((track) => track.progress.complete > 0).length;
      const complete = tracks.filter((track) => track.progress.total && track.progress.complete === track.progress.total).length;

      document.querySelector("#dashboard-percent").textContent = `${overall.percent}%`;
      document.querySelector("#dashboard-bar").style.width = `${overall.percent}%`;
      document.querySelector("#dashboard-count").textContent = `${overall.complete} of ${overall.total} lessons marked complete. Progress is self-reported, not proof of interview readiness.`;
      document.querySelector("#stat-mastered").textContent = overall.complete;
      document.querySelector("#stat-remaining").textContent = overall.total - overall.complete;
      document.querySelector("#stat-started").textContent = `${started}/${tracks.length}`;
      document.querySelector("#stat-complete").textContent = `${complete}/${tracks.length}`;
      document.querySelector("#track-count").textContent = `${tracks.length} tracks`;
      document.querySelector("#track-summary").innerHTML = tracks.map((track) => {
        const next = track.lessons.find((lesson) => !store.isComplete(lesson.id));
        const first = next || track.lessons[0];
        const firstHref = first ? `lesson.html#${encodeURIComponent(first.id)}` : "#";
        return `<article class="track-summary-card" id="track-${escapeHtml(track.id)}">
          <div><h3><a class="track-title-link" href="${firstHref}">${escapeHtml(track.title)}</a></h3><strong>${track.progress.percent}%</strong></div>
          <p>${escapeHtml(track.lessons[0]?.goal || "")}</p>
          <p>${track.progress.complete}/${track.progress.total} lessons marked complete</p>
          <div class="dashboard-progress" aria-label="${escapeHtml(track.title)}: ${track.progress.percent}% complete"><span style="width:${track.progress.percent}%"></span></div>
          ${next ? `<a href="lesson.html#${encodeURIComponent(next.id)}">Next: ${escapeHtml(next.title)} →</a>` : "<span class=\"track-complete\">Track complete ✓</span>"}
          <details class="track-syllabus"><summary>Browse ${track.lessons.length} lessons in order</summary><ol>${track.lessons.map(lesson => `<li>
            <a href="lesson.html#${encodeURIComponent(lesson.id)}">${escapeHtml(lesson.number)} · ${escapeHtml(lesson.title)}</a>
            <p>${escapeHtml(lesson.behindTheScenes)}</p>
            <details><summary>Practice and interview goal</summary><p>Practice: ${escapeHtml(lesson.practical)}</p><p>Explain: ${escapeHtml(lesson.interview)}</p><p>About ${Number(lesson.duration)} minutes of reading; exercises take additional time.</p></details>
          </li>`).join("")}</ol></details>
        </article>`;
      }).join("");
    } catch (error) {
      document.querySelector("#universal-search").textContent = "Lesson search unavailable. Reload to retry.";
      const target = document.querySelector("#dashboard-error");
      target.hidden = false;
      target.innerHTML = `<h2>Could not load progress</h2><p>${escapeHtml(error.message)}</p>`;
    }
  }

  initialize();
})();
