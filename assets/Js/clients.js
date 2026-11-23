/* ============================================================
   Clients — renders every logo listed in assets/data/clients.js

   Include on any page that has an element with [data-clients]:

     <section>
       <h1>Clients</h1>
       <div class="client-logos" data-clients></div>
     </section>

     <script src="assets/data/clients.js"></script>
     <script src="assets/Js/clients.js"></script>

   The logo list itself is generated from the folder by
   scripts/build-clients.js.
   ============================================================ */

(function () {
  function render(holder) {
    var logos = window.CLIENT_LOGOS || [];

    holder.textContent = "";

    if (!logos.length) {
      var empty = document.createElement("p");
      empty.className = "client-logos-empty";
      empty.textContent = "No logo yet.";
      holder.appendChild(empty);
      return;
    }

    logos.forEach(function (logo) {
      var img = document.createElement("img");
      img.className = "client-logo";
      img.src = logo.src;
      img.alt = logo.name;
      img.title = logo.name;
      img.loading = "lazy";
      img.decoding = "async";
      holder.appendChild(img);
    });
  }

  function mount() {
    document.querySelectorAll("[data-clients]").forEach(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.renderClients = mount;
})();
