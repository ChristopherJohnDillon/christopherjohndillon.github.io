/* ============================================================
   FLARE — small shared UI helpers
   - pageHeader(title, subtitle)  → HTML for the title row with Export menu
   - mountHeader(container)       → wires the Export dropdown after render
   - flash(msg)                   → bottom-right toast
   ============================================================ */
(function () {
  function pageHeader(title, subtitle, opts = {}) {
    const sub = subtitle ? `<div class="page-subtitle">${subtitle}</div>` : "";
    return `
      <div class="page-head">
        <div>
          <h1 class="page-title">${title}</h1>
          ${sub}
        </div>
        <div class="page-actions" data-export-anchor>
          <button class="export-btn" data-export-toggle title="Export this view">
            <span class="ms ms-sm">file_download</span>
            <span>Export</span>
            <span class="ms ms-sm">expand_more</span>
          </button>
          <div class="export-menu" data-export-menu>
            <div class="em-label">As file</div>
            <button data-export="csv"><span class="ms ms-sm">description</span>CSV</button>
            <button data-export="xlsx"><span class="ms ms-sm">table_chart</span>XLSX (Excel)</button>
            <button data-export="pdf"><span class="ms ms-sm">picture_as_pdf</span>PDF report</button>
            <div class="em-label">Send to</div>
            <button data-export="email"><span class="ms ms-sm">mail</span>Schedule email digest</button>
            <button data-export="slack"><span class="ms ms-sm">chat</span>Slack alert on threshold</button>
            <div class="em-foot">Outputs are placeholders in the public demo.</div>
          </div>
        </div>
      </div>
    `;
  }

  function mountHeader(root) {
    const anchor = root.querySelector("[data-export-anchor]");
    if (!anchor) return;
    const btn = anchor.querySelector("[data-export-toggle]");
    const menu = anchor.querySelector("[data-export-menu]");
    function close() { menu.classList.remove("open"); }
    function toggle(e) { e.stopPropagation(); menu.classList.toggle("open"); }
    btn.addEventListener("click", toggle);
    menu.querySelectorAll("button[data-export]").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const kind = b.getAttribute("data-export");
        flash(`Export queued: ${kind.toUpperCase()} · demo placeholder, no file generated.`);
        close();
      });
    });
    document.addEventListener("click", close, { once: true });
  }

  let toastTimer = null;
  function flash(msg) {
    let t = document.getElementById("flare-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "flare-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("visible"), 2600);
  }

  window.FlareUI = { pageHeader, mountHeader, flash };
})();
