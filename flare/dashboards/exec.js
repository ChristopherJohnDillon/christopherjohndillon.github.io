/* ============================================================
   FLARE — Exec overview dashboard
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.exec = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const kpis = FlareData.kpis(biz);
  const ts = FlareData.timeSeries(biz);
  const movers = FlareData.topMovers(biz);
  const statusRow = FlareData.statusRow();

  main.innerHTML = `
    <div class="page-head">
      <h1>Exec overview</h1>
      <div class="crumbs">FLARE · <span class="accent">${biz.name}</span> · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
    </div>

    <div class="kpi-row">
      ${kpis.map((k, i) => kpiCard(k, i)).join("")}
    </div>

    <div class="section">
      <div class="section-title"><h2>By business — status</h2><div class="meta">Group rollup · weekly aggregate</div></div>
      <div class="tl-row">
        ${statusRow.map(statusCard).join("")}
      </div>
    </div>

    <div class="two-col">
      <div class="section">
        <div class="section-title"><h2>Revenue &amp; GM% · last 24 weeks</h2></div>
        <div class="chart-card tall"><canvas id="execRev"></canvas></div>
      </div>
      <div class="section">
        <div class="section-title"><h2>Top movers · last 4 weeks</h2></div>
        <div class="card">
          <div class="label" style="color: var(--positive);">Up most</div>
          <table class="tbl">
            <tbody>${movers.up.map(moverRow("pos")).join("")}</tbody>
          </table>
          <div class="label" style="margin-top: 0.9rem; color: var(--critical);">Down most</div>
          <table class="tbl">
            <tbody>${movers.down.map(moverRow("neg")).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Sparkline canvases (one per KPI tile)
  kpis.forEach((k, i) => {
    const color = i === 1 ? FLARE_T.blue : i === 2 ? FLARE_T.green : i === 3 ? FLARE_T.warning : FLARE_T.accent;
    FlareCharts.spark(`spark-${i}`, k.spark, color);
  });
  FlareCharts.dualAxisRevenueGM("execRev", ts, biz.color);
};

function kpiCard(k, i) {
  const sign = k.delta > 0.05 ? "positive" : k.delta < -0.05 ? "negative" : "neutral";
  const arrow = k.delta > 0.05 ? "▲" : k.delta < -0.05 ? "▼" : "·";
  const display = (k.sparkInvert ? -k.delta : k.delta);
  const cls = (k.sparkInvert ? -k.delta : k.delta) > 0 ? "positive" : (k.sparkInvert ? -k.delta : k.delta) < 0 ? "negative" : "neutral";
  return `
    <div class="card">
      <div class="label">${k.label}</div>
      <div class="value">${k.value}</div>
      <div class="delta ${cls}">${arrow} ${Math.abs(display).toFixed(1)}${k.label.toLowerCase().includes("stockout") ? "" : "%"} vs prior</div>
      <div class="spark"><canvas id="spark-${i}"></canvas></div>
    </div>
  `;
}

function statusCard(s) {
  return `
    <div class="tl-card ${s.status}">
      <div class="bar"></div>
      <div class="biz">${s.name}</div>
      <div class="status">${s.statusText}</div>
      <div class="sub">${s.sub}</div>
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
