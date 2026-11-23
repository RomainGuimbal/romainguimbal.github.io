/* ============================================================
   Topbar loader

   Include one line on any page that should have the bar:

     <script src="assets/Js/topbar.js"></script>

   The paths are resolved from this script's own URL, so the same
   line works from any folder depth (assets/html/items/… included).
   ============================================================ */

(function () {
  var script = document.currentScript;
  if (!script) return;

  /* …/assets/Js/topbar.js  ->  …/ */
  var root = script.src.replace(/assets\/Js\/topbar\.js(\?.*)?$/, "");

  /* Stylesheet first, so the bar is styled by the time it is inserted */
  if (!document.querySelector('link[data-topbar-css]')) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = root + "assets/css/topbar.css";
    link.setAttribute("data-topbar-css", "");
    document.head.appendChild(link);
  }

  function currentPage() {
    var segments = window.location.pathname.split("/");
    var last = segments[segments.length - 1];
    return last === "" ? "index.html" : last;
  }

  function mount() {
    var page = currentPage();

    fetch(root + "assets/html/topbar.html")
      .then(function (response) {
        if (!response.ok) throw new Error("topbar: " + response.status);
        return response.text();
      })
      .then(function (markup) {
        var holder = document.createElement("div");
        holder.innerHTML = markup.trim();
        var bar = holder.firstElementChild;
        if (!bar) return;

        bar.querySelectorAll("[data-href]").forEach(function (el) {
          el.setAttribute("href", root + el.getAttribute("data-href"));
        });

        var active = bar.querySelector('[data-page="' + page + '"]');
        if (active) active.classList.add("active");

        document.body.prepend(bar);

        /* Re-run i18n so the tabs follow the language set on the page */
        if (typeof window.setLanguage === "function") {
          window.setLanguage(
            document.documentElement.lang ||
              localStorage.getItem("lang") ||
              "en",
          );
        }
      })
      .catch(function (error) {
        console.warn("topbar: could not load", error);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
