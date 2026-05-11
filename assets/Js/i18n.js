/* ============================================================
   i18n — Language detection, switching, and DOM updates.

   Detection priority:
     1. User's saved choice (localStorage)
     2. Browser locale  →  French only if navigator.language
        starts with "fr", English for everything else.
   ============================================================ */

(function () {
  /* ── helpers ──────────────────────────────────────────── */

  function detectLanguage() {
    var saved = localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') return saved;
    var lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return lang.startsWith('fr') ? 'fr' : 'en';
  }

  function applyTranslations(lang) {
    var t = i18nData[lang];
    if (!t) return;

    /* Plain-text replacements (data-i18n) */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });

    /* HTML replacements (data-i18n-html) */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    /* Keep <html lang="…"> in sync */
    document.documentElement.lang = lang;

    /* Highlight the active flag button */
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    localStorage.setItem('lang', lang);
  }

  /* ── public API ───────────────────────────────────────── */

  window.setLanguage = function (lang) {
    applyTranslations(lang);
  };

  /* ── init ─────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    applyTranslations(detectLanguage());
  });
})();
