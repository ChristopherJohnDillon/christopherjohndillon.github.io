/* ============================================================
   FLARE — Executive Scorecard
   Iconic scorecard-style coloured KPI tiles (real FLARE pattern)
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.exec = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const kpis = FlareData.kpis(biz);
  const ts = FlareData.timeSeries(biz);
  const movers = FlareData.topMovers(biz);
  const statusRow = FlareData.statusRow();

  main.innerHTML = `
    <h1 class="page-title">Executive Scorecard</h1>
    <div class="page-subtitle">Traffic-light KPIs for ${biz.name} — last 4 weeks vs prior period.</div>

    <div class="kpi-grid">
      ${kpis.map(scorecardCard).join("")}
    </div>

    <section class="section">
      <div class="section-head">
        <h2>Performance by business</h2>
        <div class="meta">Group rollup · weekly aggregate</div>
      </div>
      <div class="kpi-grid">
        ${statusRow.map(businessCard).join("")}
      </div>
    </section>

    <hr class="divider" />

    <div class="two-col">
      <section class="section" style="margin-bottom: 0;">
        <div class="section-head">
          <h2>Revenue &amp; gross margin · last 24 weeks</h2>
        </div>
        <div class="chart-card tall"><canvas id="execRev"></canvas></div>
      </section>

      <section class="section" style="margin-bottom: 0;">
        <div class="section-head"><h2>Top movers · last 4 weeks</h2></div>
        <div class="card">
          <div style="font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--positive); margin-bottom: 0.4rem;">Up most</div>
          <table class="tbl">
            <tbody>${movers.up.map(moverRow("pos")).join("")}</tbody>
          </table>
          <div style="font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--critical); margin: 1rem 0 0.4rem;">Down most</div>
          <table class="tbl">
            <tbody>${movers.down.map(moverRow("neg")).join("")}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  FlareCharts.dualAxisRevenueGM("execRev", ts, biz.color);
};

function scorecardCard(k) {
  const delta = k.sparkInvert ? -k.delta : k.delta;
  let cls = "neutral";
  if (k.label.toLowerCase().includes("stockout")) {
    cls = delta < -5 ? "positive" : delta > 5 ? "critical" : "warning";
  } else if (k.label.toLowerCase().includes("gm") || k.label.toLowerCase().includes("margin")) {
    cls = delta > 0 ? "positive" : delta < -1 ? "critical" : "warning";
  } else if (k.label.toLowerCase().includes("otif")) {
    cls = delta > 0 ? "positive" : delta < -0.5 ? "critical" : "warning";
  } else {
    cls = delta > 2 ? "positive" : delta < -2 ? "critical" : "warning";
  }
  const arrow = delta > 0.1 ? "▲" : delta < -0.1 ? "▼" : "·";
  return `
    <div class="kpi-card ${cls}">
      <h3>${k.label}</h3>
      <h1>${k.value}</h1>
      <p>${arrow} ${Math.abs(delta).toFixed(1)}${k.label.toLowerCase().includes("stockout") ? "" : "%"} vs prior</p>
    </div>
  `;
}

function businessCard(s) {
  return `
    <div class="kpi-card ${s.status}">
      <h3>${s.name}</h3>
      <h1 style="font-size: 1.4rem;">${s.statusText}</h1>
      <p>${s.sub}</p>
    </div>
  `;
}

function moverRow(cls) {
  return (s) => `
    <tr>
      <td class="mono">${s.sku}</td>
      <td>${s.name}</td>
      <td class="num ${cls}">${s.delta > 0 ? "+" : ""}${s.delta.toFixed(1)}%</td>
    </tr>
  `;
}
