/* ============================================================
   FLARE — Customer Intelligence (was bundle.js)
   Matches real Customer_Dashboard.py layout pattern.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.bundle = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const data = FlareData.bundle(biz);

  let division = "All";
  let subDiv = "All";
  let view = "Overview";

  function render() {
    const periodStart = "01 Apr 2026";
    const periodEnd = "30 Apr 2026";

    main.innerHTML = `
      <div class="main-inner">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; margin-bottom: 1rem;">
          <div>
            <h1 class="page-title">Customer Analysis Dashboard</h1>
            <div class="page-subtitle">E-Commerce &amp; Phone customer segmentation, churn prevention &amp; acquisition analysis</div>
          </div>
          <div style="flex: 0 0 auto; padding-top: 0.6rem; display: flex; align-items: center; gap: 0.85rem;">
            <img src="/flare/flare-logo.svg" alt="" style="width: 48px; height: 42px;" />
            <div style="font-weight: 800; font-size: 1.4rem; letter-spacing: 0.06em; color: var(--white); line-height: 1.1;">
              HELIOS
              <div style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; color: var(--mute);">BRANDS CO.</div>
            </div>
          </div>
        </div>

        <hr class="divider" />

        <div class="filter-inline">
          <span class="inline-label">DIVISION:</span>
          <div class="pill-radio" id="divRadio">
            ${["All", "EU", "US"].map((d) => `<button class="pill-opt pill-sm ${d === division ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
          </div>
          <span class="inline-label" style="margin-left: 1.5rem;">SUB-DIVISION:</span>
          <div class="pill-radio" id="subRadio">
            ${["All", "Outdoor", "Home", "Stationery", "Coffee"].map((d) => `<button class="pill-opt pill-sm ${d === subDiv ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
          </div>
          <label class="checkbox-inline" style="margin-left: 1.5rem;">
            <input type="checkbox" /> Include pre-2024 in base
          </label>
        </div>

        <div class="expander" style="margin: 1.25rem 0 1.5rem;">
          <div class="expander-head"><span class="ms ms-sm">chevron_right</span> Filters</div>
        </div>

        <div style="margin-bottom: 1.2rem;"><strong style="color: var(--white);">Prior Month</strong> · ${periodStart} – ${periodEnd} · Channel: <strong style="color: var(--white);">Combined (E-Commerce &amp; Phone)</strong></div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <button class="pill-btn primary" style="padding: 1.1rem; font-size: 1.05rem; justify-content: center; border-radius: 10px;">
            <span class="ms ms-sm">dashboard</span>
            <span>Customer Analytics Overview</span>
          </button>
          <button class="pill-btn" style="padding: 1.1rem; font-size: 1.05rem; justify-content: center; border-radius: 10px;">
            <span class="ms ms-sm">menu_book</span>
            <span>Glossary &amp; Definitions</span>
          </button>
        </div>

        <div style="color: var(--read); font-size: 0.92rem; margin-bottom: 0.7rem;">Choose a detailed view:</div>
        <div class="pill-radio view-grid" style="margin-bottom: 2rem;">
          ${[
            { v: "Lifecycle", icon: "autorenew" },
            { v: "Retention and Churn", icon: "person_add" },
            { v: "Channel Attribution", icon: "share" },
            { v: "Customers at Risk", icon: "shield" },
            { v: "Cross-Shopping", icon: "swap_horiz" },
            { v: "Basket Analysis", icon: "shopping_basket" },
          ].map((it) => `
            <button class="pill-opt pill-view ${view === it.v ? "active" : ""}" data-v="${it.v}">
              <span class="ms ms-sm">${it.icon}</span>
              <span>${it.v.includes("and") ? `Customer ${it.v}` : (it.v === "Lifecycle" ? "Customer Lifecycle" : it.v)}</span>
            </button>
          `).join("")}
        </div>

        <hr class="divider" />

        <label class="checkbox-inline" style="margin-bottom: 0.85rem;">
          <input type="checkbox" /> Show detailed segment breakdown
        </label>

        <div style="color: var(--read); font-size: 0.9rem; margin-bottom: 1rem;">
          <strong style="color: var(--white);">${periodStart}</strong> — <strong style="color: var(--white);">${periodEnd}</strong>
          vs same period ly: 01 Apr 2025 — 30 Apr 2025 ·
          Values with <span style="color: var(--positive); font-weight: 600;">green</span>/<span style="color: var(--critical); font-weight: 600;">red</span> YoY % beneath
        </div>

        <h2 style="font-size: 1.4rem; margin-bottom: 0.4rem;">Summary <span style="color: var(--mute); font-weight: 400; font-size: 0.9rem; margin-left: 0.5rem;">Click any column header to view its historical trend</span></h2>

        <table class="tbl tbl-flare tbl-customer" style="margin-top: 1rem;">
          <thead><tr>
            <th>Company</th>
            <th>Segment</th>
            <th class="num accent-h">Cust</th>
            <th class="num">% Base</th>
            <th class="num accent-h">Orders</th>
            <th class="num accent-h">Revenue</th>
            <th class="num accent-h">Margin</th>
            <th class="num accent-h">Margin %</th>
            <th class="num">SPC</th>
            <th class="num">AOV</th>
            <th class="num">Freq</th>
          </tr></thead>
          <tbody>
            ${segmentRows()}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll("#divRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { division = b.getAttribute("data-d"); render(); }));
    document.querySelectorAll("#subRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { subDiv = b.getAttribute("data-d"); render(); }));
    document.querySelectorAll(".view-grid .pill-opt").forEach((b) => b.addEventListener("click", () => { view = b.getAttribute("data-v"); render(); }));
  }

  function segmentRows() {
    const segments = ["New", "Reactivated", "Loyal", "Lapsing", "Churned"];
    const out = [];
    for (const b of FlareData.businesses.filter((x) => x.key !== "group")) {
      out.push(`<tr><td colspan="11" class="cat-sep">${b.name.toUpperCase()}</td></tr>`);
      for (const seg of segments) {
        const r1 = Math.sin(b.seed + seg.length * 3.7) * 0.5 + 0.5;
        const cust = Math.floor(800 + r1 * 8000);
        const pct = Math.floor(8 + r1 * 22);
        const orders = Math.floor(cust * (1.1 + r1 * 0.9));
        const aov = 35 + r1 * 60;
        const rev = orders * aov;
        const marginPct = b.gmTarget + (r1 - 0.5) * 6;
        const margin = rev * marginPct / 100;
        const spc = rev / cust;
        const freq = orders / cust;
        const yoy = (r1 - 0.45) * 30;
        const yoyCls = yoy >= 0 ? "pos" : "neg";
        out.push(`<tr>
          <td></td>
          <td>${seg}</td>
          <td class="num">${cust.toLocaleString()}<div class="yoy ${yoyCls}">${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%</div></td>
          <td class="num">${pct}%</td>
          <td class="num">${orders.toLocaleString()}<div class="yoy ${yoyCls}">${yoy >= 0 ? "+" : ""}${(yoy * 0.9).toFixed(1)}%</div></td>
          <td class="num">£${(rev/1000).toFixed(1)}k<div class="yoy ${yoyCls}">${yoy >= 0 ? "+" : ""}${(yoy * 0.8).toFixed(1)}%</div></td>
          <td class="num">£${(margin/1000).toFixed(1)}k<div class="yoy ${yoyCls}">${yoy >= 0 ? "+" : ""}${(yoy * 0.7).toFixed(1)}%</div></td>
          <td class="num">${marginPct.toFixed(1)}%<div class="yoy ${yoyCls}">${yoy >= 0 ? "+" : ""}${(yoy * 0.1).toFixed(1)}pp</div></td>
          <td class="num">£${spc.toFixed(0)}</td>
          <td class="num">£${aov.toFixed(0)}</td>
          <td class="num">${freq.toFixed(2)}</td>
        </tr>`);
      }
    }
    return out.join("");
  }

  render();
};
