(function () {
  const { createProgressStore, calculateProgress, escapeHtml } = window.Tutorial;
  const store = createProgressStore("full-stack-ai-roadmap.progress.v1");
  const activeLessonKey = "full-stack-ai-roadmap.active.v1";
  const lessonView = document.querySelector("#lesson-view");
  const lessonNav = document.querySelector("#lesson-nav");
  const searchInput = document.querySelector("#catalog-search");
  const trackPalette = ["#ff8c70", "#79e8ff", "#b6f36b", "#c2a8ff", "#ffd277", "#70e8c3", "#ff9ac0"];

  let curriculum = { tracks: [], lessons: [] };
  let activeLessonId = null;
  let searchQuery = "";
  const expandedTracks = new Set();

  function validateManifest(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.tracks) || !Array.isArray(value.lessons)) {
      throw new Error("lessons/manifest.json has an unsupported format.");
    }
    if (value.totalLessons !== value.lessons.length || value.lessons.length === 0) {
      throw new Error("The generated lesson count does not match the manifest.");
    }
    const knownIds = new Set();
    value.lessons.forEach((lesson) => {
      if (!lesson.id || !lesson.path || !lesson.trackId || !/^[a-f0-9]{12}$/.test(lesson.revision) || knownIds.has(lesson.id)) {
        throw new Error(`Invalid or duplicate lesson entry: ${lesson.id || "unknown"}`);
      }
      knownIds.add(lesson.id);
    });
    const tracks = value.tracks.map((track, index) => {
      const lessons = track.lessonIds.map((id) => value.lessons.find((lesson) => lesson.id === id));
      if (lessons.some((lesson) => !lesson)) throw new Error(`Track ${track.id} references a missing lesson.`);
      return { ...track, color: trackPalette[index % trackPalette.length], lessons };
    });
    return { tracks, lessons: value.lessons, totalLessons: value.totalLessons };
  }

  function findLesson(lessonId) {
    return curriculum.lessons.find((lesson) => lesson.id === lessonId);
  }

  function nextLesson() {
    return curriculum.lessons.find((lesson) => !store.isComplete(lesson.id));
  }

  function readSavedLesson() {
    try {
      return localStorage.getItem(activeLessonKey);
    } catch {
      return null;
    }
  }

  function lessonFromHash() {
    try {
      return findLesson(decodeURIComponent(window.location.hash.slice(1)));
    } catch {
      return null;
    }
  }

  function saveActiveLesson() {
    try {
      localStorage.setItem(activeLessonKey, activeLessonId);
    } catch {
      // Navigation still works when storage is unavailable.
    }
  }

  function navigateTo(lessonId, options = {}) {
    const lesson = findLesson(lessonId);
    if (!lesson) return;
    activeLessonId = lessonId;
    expandedTracks.add(lesson.trackId);
    saveActiveLesson();
    if (!options.fromHistory) {
      const nextHash = `#${encodeURIComponent(lessonId)}`;
      if (window.location.hash !== nextHash) window.history.pushState(null, "", nextHash);
    }
    render();
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
      lessonView.focus({ preventScroll: true });
    }
  }

  function lessonMatches(lesson, query) {
    if (!query) return true;
    return [lesson.title, lesson.trackTitle, lesson.goal, lesson.behindTheScenes, lesson.practical, lesson.interview]
      .filter(Boolean).join(" ").toLowerCase().includes(query);
  }

  function renderNav() {
    const overall = calculateProgress(store, curriculum.lessons);
    document.querySelector("#overall-percent").textContent = `${overall.percent}%`;
    document.querySelector("#overall-bar").style.width = `${overall.percent}%`;
    document.querySelector("#overall-count").textContent = `${overall.complete}/${overall.total} lessons mastered`;

    let visibleCount = 0;
    const markup = curriculum.tracks.map((track) => {
      const trackNameMatches = track.title.toLowerCase().includes(searchQuery);
      const matchingLessons = track.lessons.filter((lesson) => trackNameMatches || lessonMatches(lesson, searchQuery));
      if (!matchingLessons.length) return "";
      visibleCount += matchingLessons.length;
      const progress = calculateProgress(store, track.lessons);
      const expanded = Boolean(searchQuery) || expandedTracks.has(track.id);
      return `<section class="nav-track ${expanded ? "" : "collapsed"}">
        <button class="nav-track-label" data-track="${escapeHtml(track.id)}" type="button" aria-expanded="${expanded}">
          <span>${escapeHtml(track.title.toUpperCase())}</span><span>${progress.complete}/${progress.total}</span>
        </button>
        ${expanded ? matchingLessons.map((lesson) => `<button class="nav-lesson ${lesson.id === activeLessonId ? "active" : ""} ${store.isComplete(lesson.id) ? "complete" : ""}" data-lesson="${escapeHtml(lesson.id)}" type="button">
          <span class="nav-number">${escapeHtml(lesson.number)}</span>
          <span>${escapeHtml(lesson.title)}</span>
          <span class="nav-check">${store.isComplete(lesson.id) ? "✓" : ""}</span>
        </button>`).join("") : ""}
      </section>`;
    }).join("");

    lessonNav.innerHTML = markup || `<p class="loading-state">No lessons match “${escapeHtml(searchQuery)}”.</p>`;
    document.querySelector("#catalog-count").textContent = searchQuery
      ? `${visibleCount} generated lessons match`
      : `${curriculum.tracks.length} tracks · ${curriculum.lessons.length} generated lessons`;
    lessonNav.querySelectorAll("[data-track]").forEach((button) => {
      button.addEventListener("click", () => {
        const trackId = button.dataset.track;
        if (expandedTracks.has(trackId)) expandedTracks.delete(trackId);
        else expandedTracks.add(trackId);
        renderNav();
      });
    });
    lessonNav.querySelectorAll("[data-lesson]").forEach((button) => {
      button.addEventListener("click", () => navigateTo(button.dataset.lesson));
    });
  }

  function pagerMarkup(previous, following) {
    return `<nav class="lesson-pager shell-pager" aria-label="Previous and next lessons">
      <button class="pager-button previous" id="pager-previous" type="button" ${previous ? "" : "disabled"}>
        <span>← PREVIOUS</span><strong>${previous ? escapeHtml(previous.title) : "Start of path"}</strong>
      </button>
      <button class="pager-button next" id="pager-next" type="button" ${following ? "" : "disabled"}>
        <span>NEXT →</span><strong>${following ? escapeHtml(following.title) : "End of path"}</strong>
      </button>
    </nav>`;
  }

  function renderLesson() {
    const lesson = findLesson(activeLessonId) || curriculum.lessons[0];
    const index = curriculum.lessons.findIndex((item) => item.id === lesson.id);
    const previous = curriculum.lessons[index - 1];
    const following = curriculum.lessons[index + 1];
    const track = curriculum.tracks.find((item) => item.id === lesson.trackId);

    document.querySelector("#breadcrumb").textContent = `${lesson.trackId} / lesson_${lesson.number}`;
    document.querySelector("#lesson-time").textContent = `~${lesson.duration} min`;
    updateLessonStatus(store.isComplete(lesson.id) ? "mastered" : "in_progress");
    updateStepButtons(index);
    lessonView.style.setProperty("--track-color", track.color);
    lessonView.innerHTML = `<div class="frame-loading" aria-hidden="true">loading lesson_${escapeHtml(lesson.number)}...</div>
      <iframe class="lesson-frame" id="lesson-frame" src="${escapeHtml(`${lesson.path}?v=${lesson.revision}`)}" title="Lesson ${escapeHtml(lesson.number)}: ${escapeHtml(lesson.title)}"></iframe>
      ${pagerMarkup(previous, following)}`;

    const frame = document.querySelector("#lesson-frame");
    frame.addEventListener("load", () => {
      lessonView.querySelector(".frame-loading")?.remove();
      frame.contentWindow.addEventListener("keydown", handleKeyboardShortcut);
    });
    document.querySelector("#pager-previous").addEventListener("click", () => previous && navigateTo(previous.id));
    document.querySelector("#pager-next").addEventListener("click", () => following && navigateTo(following.id));
  }

  function updateLessonStatus(statusValue) {
    const status = document.querySelector("#lesson-status");
    const markIncomplete = document.querySelector("#mark-incomplete");
    status.textContent = statusValue;
    status.classList.toggle("complete", statusValue === "mastered");
    markIncomplete.hidden = statusValue !== "mastered";
  }

  function updateStepButtons(index) {
    document.querySelector("#previous-lesson").disabled = index <= 0;
    document.querySelector("#next-lesson").disabled = index >= curriculum.lessons.length - 1;
  }

  function updateResumeButton() {
    const button = document.querySelector("#resume-next");
    const recommended = nextLesson();
    button.disabled = !recommended;
    button.innerHTML = recommended ? "resume_next() <span>↵</span>" : "curriculum_complete() ✓";
  }

  function goToRecommended() {
    const recommended = nextLesson();
    if (!recommended) return;
    if (recommended.id === activeLessonId) {
      document.querySelector("#lesson-frame")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigateTo(recommended.id);
  }

  function markActiveLessonIncomplete() {
    if (!store.isComplete(activeLessonId)) return;
    store.markIncomplete(activeLessonId);
    render();
    lessonView.focus({ preventScroll: true });
  }

  function showProgressFeedback(message) {
    document.querySelector("#progress-feedback").textContent = message;
  }

  function normalizeProgress(value) {
    const knownIds = new Set(curriculum.lessons.map((lesson) => lesson.id));
    const progress = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return progress;
    Object.entries(value).forEach(([lessonId, record]) => {
      if (!knownIds.has(lessonId) || !record || record.score !== 100 || !Number.isFinite(Date.parse(record.completedAt))) return;
      progress[lessonId] = { completedAt: new Date(record.completedAt).toISOString(), score: 100 };
    });
    return progress;
  }

  function exportProgress() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeLessonId,
      progress: normalizeProgress(store.all())
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `deepstep-progress-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showProgressFeedback("Progress exported.");
  }

  async function importProgress(file) {
    if (!file) return;
    if (file.size > 1_000_000) throw new Error("Backup file is too large.");
    const backup = JSON.parse(await file.text());
    if (!backup || backup.version !== 1 || !backup.progress || typeof backup.progress !== "object" || Array.isArray(backup.progress)) {
      throw new Error("This is not a Deepstep progress backup.");
    }
    store.replace(normalizeProgress(backup.progress));
    const restoredLesson = findLesson(backup.activeLessonId);
    if (restoredLesson) activeLessonId = restoredLesson.id;
    expandedTracks.add(findLesson(activeLessonId).trackId);
    saveActiveLesson();
    window.history.replaceState(null, "", `#${encodeURIComponent(activeLessonId)}`);
    render();
    showProgressFeedback("Progress imported.");
  }

  function handleKeyboardShortcut(event) {
    if (!event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveLinear(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveLinear(1);
    }
    if (event.code === "KeyU") {
      event.preventDefault();
      markActiveLessonIncomplete();
    }
  }

  function render() {
    renderNav();
    renderLesson();
    updateResumeButton();
    window.requestAnimationFrame(updateReadingProgress);
  }

  function moveLinear(offset) {
    const index = curriculum.lessons.findIndex((lesson) => lesson.id === activeLessonId);
    const target = curriculum.lessons[index + offset];
    if (target) navigateTo(target.id);
  }

  function updateReadingProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    document.querySelector("#reading-progress").style.width = `${percent}%`;
  }

  function handleLessonMessage(event) {
    if (event.origin !== window.location.origin) return;
    const frame = document.querySelector("#lesson-frame");
    if (!frame || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || data.version !== 1 || data.lessonId !== activeLessonId || !findLesson(data.lessonId)) return;
    if (data.type === "teach:resize" && Number.isFinite(data.height)) {
      frame.style.height = `${Math.min(12000, Math.max(700, data.height))}px`;
      window.requestAnimationFrame(updateReadingProgress);
      return;
    }
    if (data.type === "teach:mastery" && data.passed === true && data.score === 100) {
      store.complete(data.lessonId, data.score);
      updateLessonStatus("mastered");
      renderNav();
      updateResumeButton();
    }
  }

  function bindStaticEvents() {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderNav();
    });
    document.querySelector("#resume-next").addEventListener("click", goToRecommended);
    document.querySelector("#previous-lesson").addEventListener("click", () => moveLinear(-1));
    document.querySelector("#next-lesson").addEventListener("click", () => moveLinear(1));
    document.querySelector("#mark-incomplete").addEventListener("click", markActiveLessonIncomplete);
    document.querySelector("#export-progress").addEventListener("click", exportProgress);
    document.querySelector("#import-progress").addEventListener("click", () => document.querySelector("#progress-file").click());
    document.querySelector("#progress-file").addEventListener("change", async (event) => {
      try {
        await importProgress(event.currentTarget.files[0]);
      } catch (error) {
        showProgressFeedback(error.message);
      } finally {
        event.currentTarget.value = "";
      }
    });
    document.querySelector("#reset-progress").addEventListener("click", () => {
      if (!window.confirm(`Reset mastery progress for all ${curriculum.lessons.length} lessons?`)) return;
      store.reset();
      activeLessonId = curriculum.lessons[0].id;
      expandedTracks.clear();
      expandedTracks.add(curriculum.lessons[0].trackId);
      saveActiveLesson();
      window.history.replaceState(null, "", `#${encodeURIComponent(activeLessonId)}`);
      render();
      showProgressFeedback("Progress reset.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("message", handleLessonMessage);
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("popstate", () => {
      const lesson = lessonFromHash();
      if (lesson && lesson.id !== activeLessonId) navigateTo(lesson.id, { fromHistory: true });
    });
    window.addEventListener("keydown", handleKeyboardShortcut);
  }

  function renderLoadError(error) {
    lessonView.innerHTML = `<section class="load-error"><h2>Could not load the generated curriculum</h2><p>${escapeHtml(error.message)}</p><p>From the project root, run:</p><code>python3 -m http.server 8000</code><p>Then open <code>/</code>.</p></section>`;
    document.querySelector("#overall-count").textContent = "Curriculum unavailable";
    document.querySelector("#catalog-count").textContent = "Start the local server";
  }

  async function initialize() {
    try {
      const response = await fetch("lessons/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest request failed with status ${response.status}`);
      curriculum = validateManifest(await response.json());
      const initialLesson = lessonFromHash() || findLesson(readSavedLesson()) || nextLesson() || curriculum.lessons[0];
      activeLessonId = initialLesson.id;
      expandedTracks.add(initialLesson.trackId);
      saveActiveLesson();
      if (!window.location.hash) window.history.replaceState(null, "", `#${encodeURIComponent(activeLessonId)}`);
      bindStaticEvents();
      render();
    } catch (error) {
      renderLoadError(error);
    }
  }

  initialize();
})();
