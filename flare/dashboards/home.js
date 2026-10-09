/* ============================================================
   FLARE — "Welcome to FLARE" Home page
   Matches real Home.py — FLARE intro block + dashboard directory.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.home = function (main) {
  main.innerHTML = `
    <div class="main-inner">
      <div class="home-hero">
        <div class="home-kicker">Flexible, Lightweight Analytics &amp; Reporting Engine</div>
        <h1 class="page-title">Welcome to FLARE</h1>
        <p class="home-lede">Dashboards for Helios Brands Co. — sales, operations, customers and the exec scorecard, refreshed automatically by scheduled pipelines. Pick a dashboard below, switch brands from the top bar, or <button class="row-link" id="homeTour">take the 90-second tour</button>.</p>
      </div>

      <hr class="divider" />

      <h2 class="sec-h" style="margin-bottom: 1.5rem;">Dashboard directory</h2>

      <div class="dir-grid" id="dirGrid"></div>

      <hr class="divider" />

      <div style="padding: 1.25rem 1.5rem; background: var(--surface); border: 1px solid var(--rule); border-left: 3px solid var(--accent); border-radius: 12px; font-size: 0.92rem; color: var(--read);">
        <strong style="color: var(--instrument);">About this demo.</strong> Numbers, SKUs, and warehouse layouts are deterministically generated for a fictional Helios Brands Co. group (Trailcraft / Hearthline / Quill &amp; Press / Velora). Nothing here represents a real company.
      </div>
    </div>
  `;

  const tourLink = document.getElementById("homeTour");
  if (tourLink) tourLink.addEventListener("click", () => window.FlareTour && window.FlareTour.start());

  const dir = document.getElementById("dirGrid");
  const groups = [
    { name: "Sales", icon: "trending_up", items: [
      { name: "Sales Tracker", desc: "Today vs forecast, WTD/MTD, channel split, by-brand attainment strip. The daily driver page.", route: "#/sales" },
      { name: "Product Margin", desc: "Per-business, per-channel margin vs budget targets — exec. team only.", route: "#/sku" },
      { name: "Pricing &amp; Shipping", desc: "Analyse pricing and shipping margin impacts, model price-change scenarios, and test statistical significance.", route: "#/stats" },
    ] },
    { name: "Operations", icon: "settings", items: [
      { name: "OTIF Tracker", desc: "Monitor on-time in-full delivery performance and fulfilment metrics.", route: "#/otif" },
      { name: "Open Order Pipeline", desc: "Stage waterfall (placed → picking → packing → carrier → transit) with aging buckets and queue triage.", route: "#/openorders" },
      { name: "Warehouse Heatmap", desc: "Bin-level utilisation grid across aisles. Hover for live stats, click to inspect contents.", route: "#/warehouse" },
    ] },
    { name: "Customer", icon: "sentiment_satisfied", items: [
      { name: "Customer Intelligence", desc: "E-commerce &amp; phone customer segmentation, churn prevention, lifecycle, cross-shopping, basket analysis.", route: "#/bundle" },
      { name: "Delighted NPS Tracker", desc: "Track Net Promoter Score and Delighted survey responses over time across all brands.", route: "#/nps" },
    ] },
    { name: "Scorecards", icon: "speed", items: [
      { name: "Executive Scorecard", desc: "Traffic-light KPI scorecard — group revenue, margins, OTIF, and customer metrics.", route: "#/exec" },
    ] },
    { name: "AI", icon: "auto_awesome", items: [
      { name: "Ask FLARE", desc: "Chat with your data. Self-hosted local LLM — nothing leaves the warehouse network.", route: "#/ask" },
      { name: "Document Intelligence", desc: "Local-LLM classification, tagging, and routing for support tickets, contracts, and unstructured docs.", route: "#/docintel" },
    ] },
  ];

  dir.innerHTML = groups.map((g) => `
    <div class="dir-group">
      <div class="dir-group-head"><span class="ms" style="color: var(--accent);">${g.icon}</span><span style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.95rem;">${g.name}</span></div>
      ${g.items.map((it) => `
        <a class="dir-item live" href="${it.route}">
          <div>
            <div class="dir-item-name">${it.name}</div>
            <div class="dir-item-desc">${it.desc}</div>
          </div>
        </a>
      `).join("")}
    </div>
  `).join("");
};
