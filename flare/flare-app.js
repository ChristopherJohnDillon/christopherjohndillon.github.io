/* ============================================================
   FLARE — app shell controller
   Routing, grouped sidebar, business switcher, render dispatch
   ============================================================ */

(function () {
  /* ============================================================
     Navigation structure — mirrors real FLARE's PAGE_GROUPS
     ============================================================ */
  const NAV = [
    {
      group: "Home",
      icon: "home",
      items: [
        { route: "#/home", label: "Home", icon: "home", mod: "home", default: true },
      ],
    },
    {
      group: "Sales",
      icon: "trending_up",
      items: [
        { route: "#/sales", label: "Sales Tracker",      icon: "monitoring",   mod: "sales" },
        { route: "#/sku",   label: "Product Margin",     icon: "insights",     mod: "sku" },
        { route: "#/stats", label: "Pricing & Shipping", icon: "price_change", mod: "stats" },
      ],
    },
    {
      group: "Operations",
      icon: "settings",
      items: [
        { route: "#/otif",       label: "OTIF Tracker",        icon: "local_shipping", mod: "otif" },
        { route: "#/openorders", label: "Open Order Pipeline", icon: "pending_actions", mod: "openorders" },
        { route: "#/warehouse",  label: "Warehouse Heatmap",   icon: "warehouse",      mod: "warehouse" },
      ],
    },
    {
      group: "Customer",
      icon: "sentiment_satisfied",
      items: [
        { route: "#/bundle", label: "Customer Intelligence",   icon: "people_alt", mod: "bundle" },
        { route: "#/nps",    label: "Delighted NPS Tracker",   icon: "thumb_up",   mod: "nps" },
      ],
    },
    {
      group: "Scorecards",
      icon: "speed",
      items: [
        { route: "#/exec", label: "Executive Scorecard", icon: "leaderboard", mod: "exec" },
      ],
    },
    {
      group: "AI",
      icon: "auto_awesome",
      items: [
        { route: "#/ask",      label: "Ask FLARE",            icon: "forum",      mod: "ask" },
        { route: "#/docintel", label: "Document Intelligence", icon: "psychology", mod: "docintel" },
      ],
    },
  ];

  /* Flatten routes for lookup */
  const ROUTES = {};
  const ROUTE_TO_NAV = {};
  for (const g of NAV) {
    for (const it of g.items) {
      if (it.route && it.mod) {
        ROUTES[it.route] = { mod: it.mod, label: it.label, group: g.group };
        ROUTE_TO_NAV[it.route] = it;
      }
    }
  }
  const DEFAULT_ROUTE = "#/home";

  /* Strip the query string off the hash to find the bare route. */
  function bareRoute(hash) {
    const h = hash || "";
    const qIdx = h.indexOf("?");
    return qIdx === -1 ? h : h.slice(0, qIdx);
  }

  const initialBare = bareRoute(window.location.hash);
  /* URL ?biz= takes precedence over localStorage so shared links work. */
  const urlBiz = window.FlareUrl ? window.FlareUrl.get("biz") : null;

  const state = {
    business: urlBiz || localStorage.getItem("flare:business") || "group",
    route: initialBare in ROUTES ? initialBare : DEFAULT_ROUTE,
    collapsed: localStorage.getItem("flare:collapsed") === "1",  /* default = expanded so visitors can see nav */
  };

  /* ============================================================
     SIDEBAR RENDER
     ============================================================ */
  function renderSidebar() {
    const body = document.getElementById("sbBody");
    body.innerHTML = "";
    for (const g of NAV) {
      const wrap = document.createElement("div");
      wrap.className = "nav-group";

      const head = document.createElement("div");
      head.className = "group-label";
      head.innerHTML = `<span class="ms ms-sm">${g.icon}</span><span class="label-text">${g.group}</span>`;
      wrap.appendChild(head);

      for (const it of g.items) {
        const a = document.createElement("a");
        a.className = "nav-item" + (it.locked ? " locked" : "") + (it.route === state.route ? " active" : "");
        a.setAttribute("data-route", it.route || "");
        if (it.route && !it.locked) a.href = it.route;
        a.innerHTML = `
          <span class="ms ms-sm">${it.locked ? "lock" : it.icon}</span>
          <span class="item-label">${it.label}</span>
        `;
        if (it.locked) a.addEventListener("click", (e) => e.preventDefault());
        wrap.appendChild(a);
      }
      body.appendChild(wrap);
    }
  }

  /* ============================================================
     BUSINESS SWITCHER
     ============================================================ */
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

  function toggleMenu() { document.getElementById("bizMenu").classList.toggle("open"); }
  function closeMenu() { document.getElementById("bizMenu").classList.remove("open"); }

  function setBusiness(key) {
    state.business = key;
    localStorage.setItem("flare:business", key);
    if (window.FlareUrl) window.FlareUrl.set({ biz: key === "group" ? null : key });
    renderSwitcher();
    render();
  }

  document.addEventListener("click", (e) => {
    const sw = document.getElementById("bizSwitcher");
    if (sw && sw.contains(e.target)) toggleMenu();
    else closeMenu();
  });

  /* ============================================================
     SIDEBAR COLLAPSE TOGGLE
     ============================================================ */
  function applyCollapsed() {
    const shell = document.getElementById("appShell");
    shell.classList.toggle("collapsed", state.collapsed);
    const ico = document.querySelector("#sbToggle .ms");
    if (ico) ico.textContent = state.collapsed ? "menu" : "menu_open";
  }
  document.getElementById("sbToggle").addEventListener("click", () => {
    state.collapsed = !state.collapsed;
    localStorage.setItem("flare:collapsed", state.collapsed ? "1" : "0");
    applyCollapsed();
  });

  /* ============================================================
     ROUTING + RENDER DISPATCH
     ============================================================ */
  window.addEventListener("hashchange", () => {
    const next = bareRoute(window.location.hash);
    const prev = state.route;
    state.route = next in ROUTES ? next : DEFAULT_ROUTE;
    if (!(next in ROUTES)) window.location.hash = DEFAULT_ROUTE;
    /* Pick up biz from URL params (e.g. someone shared a link) */
    const urlBiz = window.FlareUrl ? window.FlareUrl.get("biz") : null;
    if (urlBiz && urlBiz !== state.business && FlareData.business(urlBiz)) {
      state.business = urlBiz;
      localStorage.setItem("flare:business", urlBiz);
      renderSwitcher();
    }
    /* Only re-render the body if we changed routes — filter changes within a route
       are handled by each dashboard's own FlareUrl.onChange subscription. */
    if (state.route !== prev) render();
  });

  function render() {
    renderSidebar();
    const meta = ROUTES[state.route];
    if (meta) {
      const crumb = meta.group === meta.label ? meta.label : `${meta.group} · ${meta.label}`;
      document.getElementById("crumbSection").textContent = crumb;
    }
    const main = document.getElementById("main");
    main.innerHTML = "";
    const mod = meta ? meta.mod : null;
    const renderer = mod && window.FlareDashboards && window.FlareDashboards[mod];
    if (renderer) {
      renderer(main, state.business);
    } else {
      main.innerHTML = `<div class="card"><h2>Not found</h2><p>Dashboard module is not loaded.</p></div>`;
    }
  }

  /* ============================================================
     TOOLTIP
     ============================================================ */
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

  /* ============================================================
     BOOT
     ============================================================ */
  if (!(state.route in ROUTES)) {
    state.route = DEFAULT_ROUTE;
    window.location.hash = DEFAULT_ROUTE;
  }
  /* expose route lookup so dashboards can construct correct hashes for links */
  window.FlareApp = { bareRoute };
  applyCollapsed();
  renderSwitcher();
  render();
})();

window.FlareDashboards = window.FlareDashboards || {};
