/* ============================================================
   FLARE — Guided tour
   "Take the tour" pill in topbar → spotlight overlay walks the visitor
   through 10 steps illustrating FLARE's capabilities and architecture.

   Claims-light: only assertions grounded in landing copy / visible repo /
   user-supplied facts. Specific TBDs left as inline notes for Chris.
   ============================================================ */
(function () {
  const STEPS = [
    {
      route: "#/home",
      target: ".main-inner .dir-grid",
      title: "Welcome to FLARE",
      body: `<p>FLARE is the analytics platform I built for Helios Brands Co. — replacing legacy reporting across multiple businesses with a single self-hosted stack.</p>
             <p>This tour walks through what makes it different. <em>~90 seconds.</em></p>`,
      pos: "top",
    },
    {
      route: "#/home",
      target: "#bizSwitcher",
      title: "One codebase, every brand",
      body: `<p>The same dashboards serve every Helios brand — switch context here and every page re-scopes its queries to that brand. No per-brand reports to maintain.</p>`,
      pos: "bottom",
    },
    {
      route: "#/home",
      target: "#userBadge",
      title: "Microsoft Entra SSO",
      body: `<p>Access is gated by Microsoft Entra with role-based permissions. Page visibility and data scope follow your Entra group memberships.</p>`,
      pos: "bottom",
    },
    {
      route: "#/home",
      target: ".sidebar",
      title: "Anything with an API becomes a table",
      body: `<p>Data lands from NetSuite, Shopify, Magento, Google Analytics, Meta, Bing, Klaviyo, Attentive, Salesforce and more — every source replicated into DuckDB/Parquet for fast aggregate scans.</p>
             <p>New source? It's a code change, not a vendor ticket.</p>`,
      pos: "right",
    },
    {
      route: "#/sales",
      target: ".sales-summary",
      title: "Top-down to per-order",
      body: `<p>Every KPI is live against the warehouse. Drill from group → brand → channel → order without rebuilding a semantic layer — DuckDB is fast enough to recompute on the fly.</p>`,
      pos: "bottom",
    },
    {
      route: "#/sku",
      target: ".tbl-flare",
      title: "Drill all the way down",
      body: `<p>From a top-level summary KPI to per-SKU per-day per-order — same warehouse, same query engine.</p>`,
      pos: "top",
    },
    {
      route: "#/stats",
      target: "#statsLift",
      title: "Custom statistics, on demand",
      body: `<p>Pricing/promo impact analysis with confidence intervals and per-category lift. Because we own the code, any analytical method we can write ships the same week.</p>`,
      pos: "top",
    },
    {
      route: "#/openorders",
      target: ".page-actions",
      title: "Outputs are as flexible as inputs",
      body: `<p>Export to CSV, XLSX, PDF. Schedule a digest email. Wire a Slack alert when a KPI breaches a threshold. New output channel? Add a function.</p>`,
      pos: "bottom",
    },
    {
      route: "#/openorders",
      target: "#versionChip",
      title: "Versioned and reviewable",
      body: `<p>Every dashboard is a Git-versioned file. Full history, per-line blame, side-by-side diffs, rollback via standard Git tooling.</p>`,
      pos: "top",
    },
    {
      route: "#/ask",
      target: ".ask-window",
      title: "Limited by what we can code",
      body: `<p>Self-hosted LLM with first-class FLARE context — answers cite the dashboards and queries behind them.</p>
             <p>That's the thesis: <strong>limited by what we can code, not what a platform allows.</strong> Entra SSO, zero per-seat licence cost, every team's needs ship as code.</p>`,
      pos: "top",
    },
  ];

  const STORAGE_DISMISSED = "flare:tour:dismissed";
  let state = { active: false, step: 0 };

  function $(sel, root = document) { return root.querySelector(sel); }

  function ensureDom() {
    if (document.getElementById("flare-tour-backdrop")) return;
    const bd = document.createElement("div");
    bd.id = "flare-tour-backdrop";
    document.body.appendChild(bd);

    const sp = document.createElement("div");
    sp.id = "flare-tour-spotlight";
    document.body.appendChild(sp);

    const card = document.createElement("div");
    card.id = "flare-tour-card";
    document.body.appendChild(card);

    bd.addEventListener("click", () => exitTour());
  }

  function positionFor(targetRect, pos, cardW, cardH) {
    const margin = 18;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top, left;
    if (pos === "bottom" || pos === "top" || !pos) {
      left = targetRect.left + targetRect.width / 2 - cardW / 2;
      top = pos === "top"
        ? targetRect.top - cardH - margin
        : targetRect.bottom + margin;
    } else if (pos === "right") {
      left = targetRect.right + margin;
      top = targetRect.top + targetRect.height / 2 - cardH / 2;
    } else if (pos === "left") {
      left = targetRect.left - cardW - margin;
      top = targetRect.top + targetRect.height / 2 - cardH / 2;
    }
    // Clamp into viewport
    left = Math.max(12, Math.min(left, vw - cardW - 12));
    top = Math.max(12, Math.min(top, vh - cardH - 12));
    return { top, left };
  }

  function renderStep() {
    const step = STEPS[state.step];
    if (!step) return exitTour();

    // Navigate if we're on the wrong route
    const currentRoute = window.FlareApp ? window.FlareApp.bareRoute(window.location.hash) : window.location.hash;
    if (step.route && currentRoute !== step.route) {
      window.location.hash = step.route;
      // Give the dashboard time to render
      setTimeout(renderStep, 220);
      return;
    }

    const target = step.target ? document.querySelector(step.target) : null;
    const bd = $("#flare-tour-backdrop");
    const sp = $("#flare-tour-spotlight");
    const card = $("#flare-tour-card");

    bd.classList.add("visible");

    if (target) {
      const r = target.getBoundingClientRect();
      const pad = 6;
      sp.style.top = (r.top - pad) + "px";
      sp.style.left = (r.left - pad) + "px";
      sp.style.width = (r.width + pad * 2) + "px";
      sp.style.height = (r.height + pad * 2) + "px";
      sp.classList.add("visible");
    } else {
      sp.classList.remove("visible");
    }

    card.innerHTML = `
      <button class="tc-skip" aria-label="Skip tour">×</button>
      <div class="tc-step">Tour · step ${state.step + 1} of ${STEPS.length}</div>
      <div class="tc-title">${step.title}</div>
      <div class="tc-body">${step.body}</div>
      <div class="tc-controls">
        <div class="tc-progress">${state.step + 1} / ${STEPS.length}</div>
        <div class="tc-btns">
          ${state.step > 0 ? '<button data-act="prev">Back</button>' : ''}
          <button class="primary" data-act="next">${state.step === STEPS.length - 1 ? "Finish" : "Next"}</button>
        </div>
      </div>
    `;
    card.classList.add("visible");

    // Position after layout
    requestAnimationFrame(() => {
      const cr = card.getBoundingClientRect();
      const tr = target ? target.getBoundingClientRect() : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150, right: 0, bottom: 0, width: 0, height: 0 };
      const { top, left } = positionFor(tr, step.pos, cr.width, cr.height);
      card.style.top = top + "px";
      card.style.left = left + "px";
    });

    // Wire controls
    card.querySelector('.tc-skip').addEventListener("click", () => exitTour());
    card.querySelectorAll("[data-act]").forEach((b) => {
      b.addEventListener("click", () => {
        const a = b.getAttribute("data-act");
        if (a === "next") {
          if (state.step >= STEPS.length - 1) return exitTour({ completed: true });
          state.step++;
          renderStep();
        } else if (a === "prev") {
          state.step = Math.max(0, state.step - 1);
          renderStep();
        }
      });
    });

    // Track in URL so tour state survives refresh
    if (window.FlareUrl) FlareUrl.set({ tour: "onboarding", step: state.step + 1 });
  }

  function startTour(opts = {}) {
    ensureDom();
    state.active = true;
    state.step = Math.max(0, Math.min(STEPS.length - 1, (opts.startAt || 1) - 1));
    document.body.classList.add("tour-active");
    renderStep();
  }

  function exitTour(opts = {}) {
    state.active = false;
    const bd = $("#flare-tour-backdrop");
    const sp = $("#flare-tour-spotlight");
    const card = $("#flare-tour-card");
    if (bd) bd.classList.remove("visible");
    if (sp) sp.classList.remove("visible");
    if (card) card.classList.remove("visible");
    document.body.classList.remove("tour-active");
    if (opts.completed) localStorage.setItem(STORAGE_DISMISSED, "1");
    if (window.FlareUrl) FlareUrl.set({ tour: null, step: null });
  }

  /* Reposition on resize / scroll while tour is active */
  function reposition() {
    if (!state.active) return;
    const step = STEPS[state.step];
    if (!step || !step.target) return;
    const target = document.querySelector(step.target);
    if (!target) return;
    const r = target.getBoundingClientRect();
    const sp = $("#flare-tour-spotlight");
    const card = $("#flare-tour-card");
    const pad = 6;
    if (sp) {
      sp.style.top = (r.top - pad) + "px";
      sp.style.left = (r.left - pad) + "px";
      sp.style.width = (r.width + pad * 2) + "px";
      sp.style.height = (r.height + pad * 2) + "px";
    }
    if (card) {
      const cr = card.getBoundingClientRect();
      const { top, left } = positionFor(r, step.pos, cr.width, cr.height);
      card.style.top = top + "px";
      card.style.left = left + "px";
    }
  }
  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, { capture: true, passive: true });

  /* Esc to dismiss */
  window.addEventListener("keydown", (e) => {
    if (state.active && e.key === "Escape") exitTour();
  });

  /* Wire the topbar pill once DOM ready */
  function init() {
    const pill = document.getElementById("tourPill");
    if (pill) pill.addEventListener("click", () => startTour());

    /* Auto-resume tour from URL */
    const params = window.FlareUrl ? FlareUrl.read() : {};
    if (params.tour === "onboarding") {
      const startAt = parseInt(params.step || "1", 10) || 1;
      setTimeout(() => startTour({ startAt }), 250);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.FlareTour = { start: startTour, exit: exitTour, steps: STEPS };
})();
