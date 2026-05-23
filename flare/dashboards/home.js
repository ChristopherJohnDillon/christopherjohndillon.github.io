/* ============================================================
   FLARE — "Welcome to FLARE" Home page
   Mirrors the real Home.py landing.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.home = function (main) {
  main.innerHTML = `
    <h1 class="page-title">Welcome to F.L.A.R.E</h1>
    <div class="page-subtitle">The analytics and reporting platform for Helios Brands Co.</div>

    <div style="display: flex; align-items: center; gap: 1.5rem; margin: 1rem 0 2rem; padding: 1.5rem 1.7rem; background: var(--surface); border: 1px solid var(--rule); border-radius: 16px;">
      <img src="/flare/flare-logo.svg" alt="FLARE" style="width: 80px; height: 70px; flex: 0 0 auto;" />
      <div>
        <div style="font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mute); margin-bottom: 0.4rem;">Flexible, Lightweight Analytics &amp; Reporting Engine</div>
        <p style="color: var(--read); font-size: 0.95rem; line-height: 1.65; margin: 0;">FLARE provides real-time dashboards covering sales performance, supply chain operations, customer intelligence, and executive scorecards. All data is refreshed automatically via scheduled ETL pipelines so teams always have the latest numbers without manual intervention.</p>
      </div>
    </div>

    <hr class="divider" />

    <section class="dir-section">
      <h2>Dashboard Directory</h2>
      <div class="dir-grid" id="dirGrid"></div>
    </section>

    <hr class="divider" />

    <div class="card" style="background: var(--surface); font-size: 0.9rem; color: var(--read);">
      <strong style="color: var(--instrument);">About this demo.</strong> This is a static visual clone of FLARE — the real product is a self-hosted Streamlit application on a private warehouse with Microsoft Entra SSO. Numbers, SKUs, and warehouse layouts here are deterministically generated for a fictional Helios Brands Co. group (Trailcraft / Hearthline / Quill &amp; Press / Velora).
    </div>
  `;

  const dir = document.getElementById("dirGrid");
  const groups = [
    {
      name: "Sales", icon: "trending_up", items: [
        { name: "Product Margin", desc: "Per-business, per-channel margin vs budget targets.", route: "#/sku" },
        { name: "Pricing &amp; Shipping", desc: "Analyse pricing and shipping margin impacts with statistical significance testing.", route: "#/stats" },
      ]
    },
    {
      name: "Operations", icon: "settings", items: [
        { name: "Warehouse Heatmap", desc: "Bin-level utilisation grid across aisles. Hover for live stats, click to inspect contents.", route: "#/warehouse" },
      ]
    },
    {
      name: "Customer", icon: "sentiment_satisfied", items: [
        { name: "Customer Intelligence", desc: "Customer segmentation, cross-shopping, basket and bundle analysis.", route: "#/bundle" },
      ]
    },
    {
      name: "L10 EOS Scorecards", icon: "speed", items: [
        { name: "Executive Scorecard", desc: "Traffic-light KPI scorecard — company-wide revenue, margins, OTIF, and customer metrics.", route: "#/exec" },
      ]
    },
  ];

  dir.innerHTML = groups.map((g) => `
    <div class="dir-group">
      <div class="dir-group-head"><span class="ms">${g.icon}</span><span>${g.name}</span></div>
      ${g.items.map((it) => `
        <a class="dir-item live" href="${it.route}">
          <span class="ms ms-sm">arrow_outward</span>
          <div>
            <div class="dir-item-name">${it.name}</div>
            <div class="dir-item-desc">${it.desc}</div>
          </div>
        </a>
      `).join("")}
    </div>
  `).join("");
};
