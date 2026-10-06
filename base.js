(function () {
  function createProgressStore(storageKey) {
    function read() {
      try {
        const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
        return value && typeof value === "object" ? value : {};
      } catch {
        return {};
      }
    }

    function write(progress) {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    return {
      all: read,
      isComplete(lessonId) {
        return Boolean(read()[lessonId]?.completedAt);
      },
      complete(lessonId, score) {
        const progress = read();
        progress[lessonId] = { completedAt: new Date().toISOString(), score };
        write(progress);
      },
      markIncomplete(lessonId) {
        const progress = read();
        delete progress[lessonId];
        write(progress);
      },
      replace(progress) {
        write(progress);
      },
      reset() {
        localStorage.removeItem(storageKey);
      }
    };
  }

  function calculateProgress(store, lessons) {
    const complete = lessons.filter((lesson) => store.isComplete(lesson.id)).length;
    return {
      complete,
      total: lessons.length,
      percent: lessons.length ? Math.round((complete / lessons.length) * 100) : 0
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function copyHandoff(lesson, score) {
    const text = `I completed “${lesson.title}” in the Full Stack AI Engineer tutorial and scored ${score}%. The key idea was: ${lesson.feedback} Please check my understanding, answer my questions, and create a learning record if this is sufficient evidence.`;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      window.prompt("Copy this handoff for Codex:", text);
      return false;
    }
  }

  function matchesLesson(lesson, query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    const number = normalized.match(/^(?:lesson\s*#?\s*|#)?(\d+)$/);
    if (number) return Number(lesson.number) === Number(number[1]);
    const text = [lesson.title, lesson.trackTitle].filter(Boolean).join(" ").toLowerCase();
    return normalized.split(/\s+/).every(word => text.includes(word));
  }

  function initializeLessonSearch(lessons, navigate) {
    const root = document.querySelector("#universal-search");
    if (!root) return;
    root.innerHTML = `<label for="lesson-search">Search all lessons</label>
      <input id="lesson-search" type="search" placeholder="Lesson name or number" autocomplete="off" aria-controls="lesson-search-results" />
      <div class="lesson-search-panel" hidden><p role="status" aria-live="polite"></p>
      <ul id="lesson-search-results" aria-label="Matching lessons"></ul></div>`;
    const input = root.querySelector("input");
    const panel = root.querySelector(".lesson-search-panel");
    const status = root.querySelector("[role=status]");
    const results = root.querySelector("ul");
    input.addEventListener("input", () => {
      const query = input.value.trim();
      panel.hidden = !query;
      const matches = query ? lessons.filter(lesson => matchesLesson(lesson, query)) : [];
      status.textContent = matches.length ? `${matches.length} matching lessons` : "No matching lessons.";
      results.innerHTML = matches.map(lesson => `<li><a href="lesson.html#${encodeURIComponent(lesson.id)}" data-id="${escapeHtml(lesson.id)}">${escapeHtml(lesson.number)} · ${escapeHtml(lesson.title)}</a></li>`).join("");
    });
    root.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        input.focus();
        panel.hidden = true;
      } else if (event.key === "Enter" && event.target === input && !panel.hidden) {
        results.querySelector("a")?.click();
        event.preventDefault();
      }
    });
    input.addEventListener("focus", () => { if (input.value.trim()) panel.hidden = false; });
    root.addEventListener("focusout", event => {
      if (!root.contains(event.relatedTarget)) panel.hidden = true;
    });
    results.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (!link || !navigate || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      panel.hidden = true;
      navigate(link.dataset.id);
    });
  }

  window.Tutorial = { createProgressStore, calculateProgress, escapeHtml, copyHandoff, matchesLesson, initializeLessonSearch };
})();
