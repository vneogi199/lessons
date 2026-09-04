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

  window.Tutorial = { createProgressStore, calculateProgress, escapeHtml, copyHandoff };
})();
