/* ============================================================
   FLARE — app shell controller
   Routing, business switcher, render dispatch
   ============================================================ */

(function () {
  const ROUTES = {
    "#/exec":      { mod: "exec",      label: "Exec overview" },
    "#/sku":       { mod: "sku",       label: "Per-SKU analysis" },
    "#/stats":     { mod: "stats",     label: "Statistical analysis" },
    "#/warehouse": { mod: "warehouse", label: "Warehouse heatmap" },
    "#/bundle":    { mod: "bundle",    label: "Bundle & basket" },
  };
  const DEFAULT_ROUTE = "#/exec";

  const state = {
    business: localStorage.getItem("flare:business") || "group",
    route: window.location.hash in ROUTES ? window.location.hash : DEFAULT_ROUTE,
  };

  /* ---- Business switcher ---- */
  function renderSwitcher() {
    const menu = document.getElementById("bizMenu");
    const label = document.getElementById("bizLabel");
    const swatch = document.getElementById("bizSwatch");
    menu.innerHTML = "";
    for (const b of FlareData.businesses) {
      const item = document.createElement("div");
      item.className = "item" + (b.key === state.business ? " active" : "");
      item.setAttribute("role", "menuitem");
      item.innerHTML = `<span class="swatch" style="background:${b.color}"></span><span>${b.name}</span>`;
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        setBusiness(b.key);
        closeMenu();
      });
      menu.appendChild(item);
    }
    const biz = FlareData.business(state.business);
    label.textContent = biz.name;
    swatch.style.background = biz.color;
  }

  function toggleMenu() {
    document.getElementById("bizMenu").classList.toggle("open");
  }
  function closeMenu() {
    document.getElementById("bizMenu").classList.remove("open");
  }
  function setBusiness(key) {
    state.business = key;
    localStorage.setItem("flare:business", key);
    renderSwitcher();
    render();
  }

  document.addEventListener("click", (e) => {
    const sw = document.getElementById("bizSwitcher");
    if (sw && sw.contains(e.target)) toggleMenu();
    else closeMenu();
  });

  /* ---- Sidebar nav ---- */
  function highlightNav() {
    document.querySelectorAll(".sidebar .nav-item").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-route") === state.route);
    });
  }

  /* ---- Hash routing ---- */
  window.addEventListener("hashchange", () => {
    const next = window.location.hash;
    state.route = next in ROUTES ? next : DEFAULT_ROUTE;
    if (!(next in ROUTES)) window.location.hash = DEFAULT_ROUTE;
    render();
  });

  /* ---- Render dispatch ---- */
  function render() {
    highlightNav();
    const main = document.getElementById("main");
    main.innerHTML = "";
    const mod = ROUTES[state.route].mod;
    const renderer = window.FlareDashboards && window.FlareDashboards[mod];
    if (renderer) {
      renderer(main, state.business);
    } else {
      main.innerHTML = `<div class="card"><div class="label">Not found</div><p>Dashboard module "${mod}" is not loaded.</p></div>`;
    }
  }

  /* ---- Tooltip helper (shared) ---- */
  const tooltip = document.getElementById("flareTooltip");
  window.FlareTooltip = {
    show(html, x, y) {
      tooltip.innerHTML = html;
      tooltip.style.left = (x + 14) + "px";
      tooltip.style.top  = (y + 14) + "px";
      tooltip.classList.add("visible");
    },
    hide() { tooltip.classList.remove("visible"); },
    move(x, y) {
      tooltip.style.left = (x + 14) + "px";
      tooltip.style.top  = (y + 14) + "px";
    },
  };

  /* ---- Boot ---- */
  if (!(state.route in ROUTES)) {
    state.route = DEFAULT_ROUTE;
    window.location.hash = DEFAULT_ROUTE;
  }
  renderSwitcher();
  render();
})();

/* Global dashboards registry — each dashboard module attaches itself here */
window.FlareDashboards = window.FlareDashboards || {};
