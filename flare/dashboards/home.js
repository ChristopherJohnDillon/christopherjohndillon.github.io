/* ============================================================
   FLARE — "Welcome to FLARE" Home page
   Matches real Home.py — FLARE intro block + dashboard directory.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.home = function (main) {
  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title" style="margin-bottom: 2rem;">Welcome to FLARE</h1>

      <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 2rem;">
        <div>
          <div style="font-size: 2.5rem; color: var(--accent); line-height: 1; margin-bottom: 0.6rem;">◢</div>
          <h2 style="font-size: 1.7rem; margin-bottom: 0.3rem;">FLARE</h2>
          <div style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mute); margin-bottom: 1rem;">Flexible, Lightweight Analytics &amp; Reporting Engine</div>
          <p style="color: var(--instrument); font-size: 0.98rem; line-height: 1.7; max-width: 75ch;">FLARE is the analytics and reporting platform for Helios Brands Co. It provides real-time dashboards covering sales performance, supply chain operations, customer sentiment, e-commerce marketing, and executive scorecards. All data is refreshed automatically via scheduled ETL pipelines so teams always have the latest numbers without manual intervention.</p>
        </div>
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: var(--white); margin-bottom: 1.5rem;">Dashboard Directory</h2>

      <div class="dir-grid" id="dirGrid"></div>

      <hr class="divider" />

      <div style="padding: 1.25rem 1.5rem; background: var(--surface); border: 1px solid var(--rule); border-left: 3px solid var(--accent); border-radius: 12px; font-size: 0.92rem; color: var(--read);">
        <strong style="color: var(--instrument);">About this demo.</strong> This is a static visual clone of FLARE — the real product is a self-hosted Streamlit application on a private warehouse with Microsoft Entra SSO. Numbers, SKUs, and warehouse layouts here are deterministically generated for a fictional Helios Brands Co. group (Trailcraft / Hearthline / Quill &amp; Press / Velora).
      </div>
    </div>
  `;

  const dir = document.getElementById("dirGrid");
  const groups = [
    { name: "Sales", icon: "trending_up", items: [
      { name: "Product Margin", desc: "Per-business, per-channel margin vs budget targets — exec. team only.", route: "#/sku" },
      { name: "Pricing &amp; Shipping", desc: "Analyse pricing and shipping margin impacts, model price-change scenarios, and test statistical significance.", route: "#/stats" },
    ] },
    { name: "Operations", icon: "settings", items: [
      { name: "Warehouse Heatmap", desc: "Bin-level utilisation grid across aisles. Hover for live stats, click to inspect contents.", route: "#/warehouse" },
    ] },
    { name: "Customer", icon: "sentiment_satisfied", items: [
      { name: "Customer Intelligence", desc: "Customer segmentation, cross-shopping, basket and bundle analysis across channels.", route: "#/bundle" },
    ] },
    { name: "L10 EOS Scorecards", icon: "speed", items: [
      { name: "Executive Scorecard", desc: "Traffic-light KPI scorecard — company-wide revenue, margins, OTIF, and customer metrics.", route: "#/exec" },
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
