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
      const overall = calculateProgress(store, manifest.lessons);
      const tracks = manifest.tracks.map((track) => {
        const lessons = track.lessonIds.map((id) => lessonsById.get(id)).filter(Boolean);
        return { ...track, lessons, progress: calculateProgress(store, lessons) };
      });
      const started = tracks.filter((track) => track.progress.complete > 0).length;
      const complete = tracks.filter((track) => track.progress.total && track.progress.complete === track.progress.total).length;

      document.querySelector("#dashboard-percent").textContent = `${overall.percent}%`;
      document.querySelector("#dashboard-bar").style.width = `${overall.percent}%`;
      document.querySelector("#dashboard-count").textContent = `${overall.complete} of ${overall.total} lessons mastered`;
      document.querySelector("#stat-mastered").textContent = overall.complete;
      document.querySelector("#stat-remaining").textContent = overall.total - overall.complete;
      document.querySelector("#stat-started").textContent = `${started}/${tracks.length}`;
      document.querySelector("#stat-complete").textContent = `${complete}/${tracks.length}`;
      document.querySelector("#track-count").textContent = `${tracks.length} tracks`;
      document.querySelector("#track-summary").innerHTML = tracks.map((track) => {
        const next = track.lessons.find((lesson) => !store.isComplete(lesson.id));
        return `<article class="track-summary-card">
          <div><h3>${escapeHtml(track.title)}</h3><strong>${track.progress.percent}%</strong></div>
          <p>${track.progress.complete}/${track.progress.total} lessons mastered</p>
          <div class="dashboard-progress" aria-label="${escapeHtml(track.title)}: ${track.progress.percent}% complete"><span style="width:${track.progress.percent}%"></span></div>
          ${next ? `<a href="./#${encodeURIComponent(next.id)}">Next: ${escapeHtml(next.title)} →</a>` : "<span class=\"track-complete\">Track complete ✓</span>"}
        </article>`;
      }).join("");
    } catch (error) {
      const target = document.querySelector("#dashboard-error");
      target.hidden = false;
      target.innerHTML = `<h2>Could not load progress</h2><p>${escapeHtml(error.message)}</p>`;
    }
  }

  initialize();
})();
