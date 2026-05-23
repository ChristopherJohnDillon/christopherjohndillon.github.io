/* ============================================================
   FLARE — "Welcome to FLARE" Home page
   Mirrors the real Home.py: FLARE + CORONA intro blocks
   followed by a grouped dashboard directory.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.home = function (main) {
  main.innerHTML = `
    <h1 class="page-title">Welcome to F.L.A.R.E</h1>
    <div class="page-subtitle">The analytics and reporting platform for Helios Brands Co.</div>

    <div class="home-intro">
      <div class="home-block">
        <span class="ms ms-lg home-icon fill">local_fire_department</span>
        <h2>FLARE</h2>
        <div class="home-caption">Flexible, Lightweight Analytics &amp; Reporting Engine</div>
        <p>FLARE is the analytics and reporting platform for the group. It provides real-time dashboards covering sales performance, supply chain operations, customer sentiment, e-commerce marketing, and executive scorecards. All data is refreshed automatically via scheduled ETL pipelines so teams always have the latest numbers without manual intervention.</p>
      </div>
      <div class="home-block">
        <span class="ms ms-lg home-icon">workspaces</span>
        <h2>CORONA</h2>
        <div class="home-caption">Centralized Operational Reporting for Optimal Nexus Analytics</div>
        <p>CORONA is the centralised data warehouse and single source of truth. Syncing hourly, it brings together disparate NetSuite instances alongside data from Shopify, Google, Plausible, and other platforms into one unified, analytics-ready dataset. Automated ETL pipelines run on a dedicated server around the clock so every FLARE dashboard reflects the latest numbers.</p>
      </div>
    </div>

    <hr class="divider" />

    <section class="dir-section">
      <h2>Dashboard Directory</h2>
      <div class="dir-grid" id="dirGrid"></div>
    </section>

    <hr class="divider" />

    <div class="card" style="background: var(--surface); font-size: 0.9rem; color: var(--read);">
      <strong style="color: var(--instrument);">About this demo.</strong> This is a static visual clone of FLARE — the real product is a self-hosted Streamlit application on a private warehouse with Microsoft Entra SSO. Numbers, SKUs, and warehouse layouts here are deterministically generated for a fictional Helios Brands Co. group (Trailcraft / Hearthline / Quill &amp; Press / Velora). Dashboards marked <span class="ms ms-sm" style="vertical-align: -3px; color: var(--dim);">lock</span> are not implemented in the demo — they exist in the real product.
    </div>
  `;

  // Build directory from NAV — query the registered routes
  const dir = document.getElementById("dirGrid");
  const groups = [
    {
      name: "Sales", icon: "trending_up", items: [
        { name: "Product Margin", desc: "Per-business, per-channel margin vs budget targets — exec. team only.", route: "#/sku", live: true },
        { name: "Pricing &amp; Shipping", desc: "Analyse pricing and shipping margin impacts, model price change scenarios, and test statistical significance.", route: "#/stats", live: true },
        { name: "Sales Tracker", desc: "Track sales across divisions, locations, and product categories with FX variance and SKU-level detail." },
        { name: "Open Orders", desc: "Monitor unbilled revenue from open sales orders across all divisions and locations." },
      ]
    },
    {
      name: "Operations", icon: "settings", items: [
        { name: "Warehouse Heatmap", desc: "Bin-level utilisation grid across aisles. Hover for live stats, click to inspect contents.", route: "#/warehouse", live: true },
        { name: "OTIF Tracker", desc: "Monitor on-time in-full delivery performance and fulfilment metrics." },
        { name: "Out of Stock", desc: "Track and analyse out-of-stock inventory across divisions, locations, and product categories." },
        { name: "Excess &amp; Obsolete", desc: "Identify and analyse excess and obsolete stock across the business." },
      ]
    },
    {
      name: "Customer", icon: "sentiment_satisfied", items: [
        { name: "Customer Intelligence", desc: "Customer segmentation, new vs returning analysis, cross-shopping, basket analysis, channel attribution.", route: "#/bundle", live: true },
        { name: "Delighted NPS Tracker", desc: "Track Net Promoter Score and Delighted survey responses over time." },
      ]
    },
    {
      name: "L10 EOS Scorecards", icon: "speed", items: [
        { name: "Executive Scorecard", desc: "Traffic-light KPI scorecard for the Executive L10 — company-wide revenue, margins, OTIF, and customer metrics.", route: "#/exec", live: true },
        { name: "GDC Scorecard", desc: "Traffic-light KPI scorecard for the GDC L10 — e-commerce sales, marketing, and digital performance." },
        { name: "Ops L10 Scorecard", desc: "Dense matrix scorecard for the Ops L10 — OOS, OTIF, and Manufacturing OTIF by division at a glance." },
      ]
    },
  ];

  dir.innerHTML = groups.map((g) => `
    <div class="dir-group">
      <div class="dir-group-head"><span class="ms">${g.icon}</span><span>${g.name}</span></div>
      ${g.items.map((it) => {
        const live = it.live;
        const tag = live ? "a" : "div";
        const href = live ? ` href="${it.route}"` : "";
        return `<${tag} class="dir-item ${live ? "live" : "locked"}"${href}>
          <span class="ms ms-sm">${live ? "arrow_outward" : "lock"}</span>
          <div>
            <div class="dir-item-name">${it.name}</div>
            <div class="dir-item-desc">${it.desc}</div>
          </div>
        </${tag}>`;
      }).join("")}
    </div>
  `).join("");
};
