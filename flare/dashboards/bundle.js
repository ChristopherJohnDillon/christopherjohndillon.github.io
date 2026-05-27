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
        ${FlareUI.pageHeader("Customer Analysis", "E-commerce &amp; phone customer segmentation, churn prevention &amp; acquisition")}

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

        ${viewContent(view, biz, data, periodStart, periodEnd)}
      </div>
    `;

    FlareUI.mountHeader(main);
    document.querySelectorAll("#divRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { division = b.getAttribute("data-d"); render(); }));
    document.querySelectorAll("#subRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { subDiv = b.getAttribute("data-d"); render(); }));
    document.querySelectorAll(".view-grid .pill-opt").forEach((b) => b.addEventListener("click", () => { view = b.getAttribute("data-v"); render(); }));
  }

  function viewContent(v, biz, data, ps, pe) {
    if (v === "Lifecycle")           return lifecycleView(biz);
    if (v === "Retention and Churn") return retentionView(biz);
    if (v === "Channel Attribution") return channelView(biz);
    if (v === "Customers at Risk")   return atRiskView(biz);
    if (v === "Cross-Shopping")      return crossShopView(biz);
    if (v === "Basket Analysis")     return basketView(biz, data);
    return summaryView(biz, ps, pe);
  }

  function summaryView(biz, ps, pe) {
    return `
      <label class="checkbox-inline" style="margin-bottom: 0.85rem;">
        <input type="checkbox" /> Show detailed segment breakdown
      </label>
      <div style="color: var(--read); font-size: 0.9rem; margin-bottom: 1rem;">
        <strong style="color: var(--white);">${ps}</strong> — <strong style="color: var(--white);">${pe}</strong>
        vs same period ly: 01 Apr 2025 — 30 Apr 2025 ·
        Values with <span style="color: var(--positive); font-weight: 600;">green</span>/<span style="color: var(--critical); font-weight: 600;">red</span> YoY % beneath
      </div>
      <h2 style="font-size: 1.4rem; margin-bottom: 0.4rem;">Summary <span style="color: var(--mute); font-weight: 400; font-size: 0.9rem; margin-left: 0.5rem;">Click any column header to view its historical trend</span></h2>
      <table class="tbl tbl-flare tbl-customer" style="margin-top: 1rem;">
        <thead><tr>
          <th>Company</th><th>Segment</th>
          <th class="num accent-h">Cust</th><th class="num">% Base</th>
          <th class="num accent-h">Orders</th><th class="num accent-h">Revenue</th>
          <th class="num accent-h">Margin</th><th class="num accent-h">Margin %</th>
          <th class="num">SPC</th><th class="num">AOV</th><th class="num">Freq</th>
        </tr></thead>
        <tbody>${segmentRows()}</tbody>
      </table>
    `;
  }

  function lifecycleView(biz) {
    const totalCust = Math.floor(biz.scaleRev * 12000);
    const newCust = Math.floor(totalCust * 0.18);
    const active  = Math.floor(totalCust * 0.42);
    const lapsing = Math.floor(totalCust * 0.21);
    const lapsed  = Math.floor(totalCust * 0.19);
    return `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Customer Lifecycle</h2>
      <div class="metric-row">
        ${metric("New (last 90d)", newCust.toLocaleString(), "↑ +12% vs ly", "positive")}
        ${metric("Active", active.toLocaleString(), "↑ +4% vs ly", "positive")}
        ${metric("Lapsing", lapsing.toLocaleString(), "↓ −3% vs ly", "negative")}
        ${metric("Lapsed", lapsed.toLocaleString(), "↑ +6% vs ly", "negative")}
      </div>
      <hr class="divider" />
      <h2 style="font-size: 1.2rem; margin-bottom: 0.8rem;">Lifecycle by company</h2>
      ${simpleCompanyTable(biz, ["New", "Active", "Lapsing", "Lapsed"], [0.18, 0.42, 0.21, 0.19])}
    `;
  }

  function retentionView(biz) {
    return `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Customer Retention &amp; Churn</h2>
      <div class="metric-row">
        ${metric("Repeat rate", "47.2%", "↑ +2.1pp vs ly", "positive")}
        ${metric("12-month retention", "62.8%", "↓ −0.6pp vs ly", "negative")}
        ${metric("Avg time between orders", "84 days", "↓ −5d vs ly", "positive")}
        ${metric("Churn rate (annual)", "37.2%", "↑ +0.6pp vs ly", "negative")}
      </div>
      <hr class="divider" />
      <h2 style="font-size: 1.2rem; margin-bottom: 0.8rem;">Retention curve — cohort by acquisition month</h2>
      <div class="card" style="text-align: center; color: var(--mute); font-style: italic;">Cohort heatmap rendered here in real FLARE — 12 cohorts × 12 retention windows.</div>
    `;
  }

  function channelView(biz) {
    return `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Channel Attribution</h2>
      <div class="metric-row">
        ${metric("E-Commerce", "62.4%", "of revenue · ↑ +3.1pp", "positive")}
        ${metric("Phone", "21.8%", "of revenue · ↓ −1.5pp", "negative")}
        ${metric("Wholesale", "15.8%", "of revenue · ↓ −1.6pp", "negative")}
        ${metric("Cross-channel customers", "18.4%", "↑ +1.2pp", "positive")}
      </div>
      <hr class="divider" />
      ${simpleCompanyTable(biz, ["E-Com %", "Phone %", "Wholesale %"], [0.62, 0.22, 0.16])}
    `;
  }

  function atRiskView(biz) {
    return `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Customers at Risk</h2>
      <p style="color: var(--read); font-size: 0.95rem; margin-bottom: 1.5rem;">High-value customers whose order frequency has materially dropped vs their personal baseline. Sorted by potential revenue loss.</p>
      <table class="tbl tbl-flare">
        <thead><tr>
          <th>Customer ID</th><th>Company</th><th>Lifetime Orders</th>
          <th class="num">LTV</th><th class="num">Last order</th>
          <th class="num">Risk score</th><th class="num">Potential loss</th>
        </tr></thead>
        <tbody>
          ${atRiskRows(biz)}
        </tbody>
      </table>
    `;
  }

  function crossShopView(biz) {
    return `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Cross-Shopping</h2>
      <p style="color: var(--read); font-size: 0.95rem; margin-bottom: 1.5rem;">Customers who purchased from multiple group brands in the period.</p>
      <div class="metric-row">
        ${metric("Cross-shoppers", "18,432", "↑ +14% vs ly", "positive")}
        ${metric("Avg brands per customer", "1.34", "↑ +0.05 vs ly", "positive")}
        ${metric("Cross-shop revenue", "£2.8M", "↑ +18% vs ly", "positive")}
        ${metric("Cross-shop AOV uplift", "+24%", "vs single-brand baseline", "positive")}
      </div>
      <hr class="divider" />
      <h2 style="font-size: 1.2rem; margin-bottom: 0.8rem;">Brand affinity matrix</h2>
      <div class="card" style="text-align: center; color: var(--mute); font-style: italic;">4×4 brand co-purchase heatmap rendered here in real FLARE.</div>
    `;
  }

  function basketView(biz, data) {
    return `
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Basket Analysis</h2>
      <div class="metric-row">
        ${metric("Avg basket value", `£${(45 + biz.seed % 30).toFixed(2)}`, "↑ +4.2% vs ly", "positive")}
        ${metric("Items per basket", "2.84", "↑ +0.11 vs ly", "positive")}
        ${metric("Top bundle lift", `${data.topPairs[0].lift.toFixed(2)}×`, "strongest co-purchase", "positive")}
        ${metric("Pairs analysed", `${data.topPairs.length * 12}`, "co-purchase candidates", "neutral")}
      </div>
      <hr class="divider" />
      <h2 style="font-size: 1.2rem; margin-bottom: 0.8rem;">Top co-purchased pairs</h2>
      <table class="tbl tbl-flare">
        <thead><tr><th>SKU A</th><th>SKU B</th><th class="num">Lift</th><th class="num">Baskets / mo</th></tr></thead>
        <tbody>
          ${data.topPairs.slice(0, 10).map((p) => `<tr>
            <td class="mono">${p.a.sku} <span style="color: var(--mute);">${p.a.name}</span></td>
            <td class="mono">${p.b.sku} <span style="color: var(--mute);">${p.b.name}</span></td>
            <td class="num" style="color: var(--accent); font-weight: 700;">${p.lift.toFixed(2)}×</td>
            <td class="num">${p.freq}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function simpleCompanyTable(biz, cols, dist) {
    return `
      <table class="tbl tbl-flare">
        <thead><tr><th>Company</th>${cols.map((c) => `<th class="num">${c}</th>`).join("")}<th class="num">Total</th></tr></thead>
        <tbody>
          ${FlareData.businesses.filter((b) => b.key !== "group").map((b) => {
            const total = Math.floor(2000 + Math.abs(Math.sin(b.seed + FlareData.salt * 0.0001)) * 12000);
            const vals = dist.map((d, i) => Math.floor(total * d * (0.85 + Math.sin(b.seed + FlareData.salt * 0.0001 + i) * 0.2)));
            return `<tr>
              <td>${b.name}</td>
              ${vals.map((v) => `<td class="num">${v.toLocaleString()}</td>`).join("")}
              <td class="num" style="font-weight: 700;">${total.toLocaleString()}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  function atRiskRows(biz) {
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const seed = biz.seed + i * 41;
      const r = (k) => { const x = Math.sin(seed + k * 13.7) * 43758.5; return x - Math.floor(x); };
      const cid = `C-${Math.floor(r(1) * 90000 + 10000)}`;
      const bizName = FlareData.businesses[1 + Math.floor(r(2) * 4)].shortName;
      const lifetimeOrders = Math.floor(8 + r(3) * 40);
      const ltv = Math.floor(800 + r(4) * 8000);
      const lastOrder = Math.floor(90 + r(5) * 200);
      const risk = (0.55 + r(6) * 0.4).toFixed(2);
      const loss = Math.floor(ltv * 0.3);
      const riskCls = parseFloat(risk) > 0.8 ? "neg" : parseFloat(risk) > 0.65 ? "" : "pos";
      rows.push(`<tr>
        <td class="mono">${cid}</td>
        <td>${bizName}</td>
        <td class="num">${lifetimeOrders}</td>
        <td class="num">£${ltv.toLocaleString()}</td>
        <td class="num">${lastOrder}d ago</td>
        <td class="num ${riskCls}">${risk}</td>
        <td class="num neg">£${loss.toLocaleString()}</td>
      </tr>`);
    }
    return rows.join("");
  }

  function segmentRows() {
    const segments = ["New", "Reactivated", "Loyal", "Lapsing", "Churned"];
    const out = [];
    for (const b of FlareData.businesses.filter((x) => x.key !== "group")) {
      out.push(`<tr><td colspan="11" class="cat-sep">${b.name.toUpperCase()}</td></tr>`);
      for (const seg of segments) {
        const r1 = Math.sin(b.seed + FlareData.salt * 0.0001 + seg.length * 3.7) * 0.5 + 0.5;
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
