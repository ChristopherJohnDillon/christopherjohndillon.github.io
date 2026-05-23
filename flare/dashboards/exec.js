/* ============================================================
   FLARE — Executive Scorecard
   Matches real Scorecard.py — big coloured KPI tiles with multi-
   line details, pill radio filter rows.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.exec = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const kpis = FlareData.kpis(biz);

  let division = "Global";
  let subdiv = "All";

  function render() {
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("/");
    const asOf = new Date(today.getTime() - 24 * 3600 * 1000);
    const asOfStr = asOf.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const runAt = today.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const monthName = today.toLocaleString("en-GB", { month: "long" });

    main.innerHTML = `
      <div class="main-inner">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; margin-bottom: 2rem;">
          <div>
            <h1 class="page-title">Executive Scorecard</h1>
            <div class="page-subtitle">A concise overview of key business performance metrics. Click any card to view historical trends &amp; metric explanations.</div>
          </div>
          <div style="flex: 0 0 auto; padding-top: 0.6rem; display: flex; align-items: center; gap: 0.85rem;">
            <img src="/flare/flare-logo.svg" alt="" style="width: 48px; height: 42px;" />
            <div style="font-weight: 800; font-size: 1.4rem; letter-spacing: 0.06em; color: var(--white); line-height: 1.1;">
              HELIOS
              <div style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.2em; color: var(--mute);">BRANDS CO.</div>
            </div>
          </div>
        </div>

        <div class="field" style="max-width: 100%; margin-bottom: 1rem;">
          <label class="field-label">Select KPI Date</label>
          <div class="st-select" style="cursor: default;">${dateStr}</div>
        </div>

        <div class="data-as-of">Performance metrics as of ${asOfStr} (Analysis ran at: ${runAt})</div>

        <h2 style="font-size: 1.6rem; margin: 0.5rem 0 1.25rem;">MTD = 1 – ${today.getDate()} of ${monthName}</h2>

        <div class="filter-row cols-2" style="margin-bottom: 1.75rem;">
          <div class="field">
            <label class="field-label">Division</label>
            <div class="pill-radio" id="divRadio">
              ${["Global", "US", "EU"].map((d) => `<button class="pill-opt ${d === division ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
            </div>
          </div>
          <div class="field">
            <label class="field-label">Subdivision</label>
            <div class="pill-radio" id="subRadio">
              ${["All", "Pet", "Beauty", "Tattoo"].map((d) => `<button class="pill-opt ${d === subdiv ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          ${scoreTile(kpis[0], biz, "REVENUE MTD")}
          ${scoreTile2(biz, "MONTH-END PROJECTION")}
          ${scoreTile3(biz, "OPEN ORDERS (TOTAL)")}
        </div>
        <div class="kpi-grid">
          ${scoreTile4(kpis[1], biz, "PRODUCT MARGIN %")}
          ${scoreTile5(kpis[1], biz, "MARGIN MTD")}
          ${scoreTile6(biz, "CASH LIQUIDITY (PRIOR WEEK)")}
        </div>
        <div class="kpi-grid">
          ${scoreTile7(kpis[2], biz, "OTIF MTD")}
          ${scoreTile8(biz, "INVENTORY HEALTH")}
          ${scoreTile9(kpis[3], biz, "ACTIVE STOCKOUTS")}
        </div>
      </div>
    `;

    document.querySelectorAll("#divRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { division = b.getAttribute("data-d"); render(); }));
    document.querySelectorAll("#subRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { subdiv = b.getAttribute("data-d"); render(); }));
  }

  render();
};

/* All scorecard tiles share the same shape. Each function picks
   colour + values appropriate to the metric (deterministic from biz). */

function scoreTile(k, biz, title) {
  // REVENUE MTD — usually critical/red against MTD budget
  const cls = parseInt(biz.seed) % 3 === 0 ? "warning" : "critical";
  const val = "$" + (8 + (biz.seed % 5) + Math.random() * 0).toFixed(2).replace(".00", ".25") + "M";
  return `
    <div class="kpi-card ${cls}">
      <h3>${title}</h3>
      <h1>£${(biz.scaleRev * 0.6).toFixed(2)}M</h1>
      <p>Budget MTD: £${(biz.scaleRev * 0.7).toFixed(2)}M</p>
      <p>LY MTD: £${(biz.scaleRev * 0.62).toFixed(2)}M (-1.5%)</p>
      <p>${Math.floor(60 + biz.seed % 20)}% of full-month budget (£${(biz.scaleRev * 0.9).toFixed(2)}M)</p>
      <p class="detail">-10.6% vs MTD Budget | ${Math.floor(60 + biz.seed % 20)}% of Full-month Budget</p>
    </div>
  `;
}
function scoreTile2(biz, title) {
  return `
    <div class="kpi-card warning">
      <h3>${title}</h3>
      <h1>£${(biz.scaleRev * 0.82).toFixed(2)}M</h1>
      <p>Commercial Team Forecast<br>Budget: £${(biz.scaleRev * 0.86).toFixed(2)}M</p>
      <p>WD progress: 16/20 (80%) | Per-day: £${Math.floor(biz.scaleRev * 41)}K</p>
      <p class="detail">-4.2% vs budget (-0.66M) [Manual]</p>
    </div>
  `;
}
function scoreTile3(biz, title) {
  return `
    <div class="kpi-card neutral">
      <h3>${title}</h3>
      <h1>Total £${(biz.scaleRev * 0.13).toFixed(2)}M (${Math.floor(biz.seed % 800 + 800)})</h1>
      <p>Wholesale £${(biz.scaleRev * 0.11).toFixed(2)}M (${Math.floor(biz.seed % 400)})</p>
      <p>Direct £${(biz.scaleRev * 0.02).toFixed(2)}M (${Math.floor(biz.seed % 600 + 400)})</p>
    </div>
  `;
}
function scoreTile4(k, biz, title) {
  const cls = biz.gmTarget > 40 ? "positive" : "warning";
  return `
    <div class="kpi-card ${cls}">
      <h3>${title}</h3>
      <h1>${(biz.gmTarget + 18).toFixed(1)}%</h1>
      <p>Budget: ${(biz.gmTarget + 17).toFixed(1)}%</p>
      <p>LY: ${(biz.gmTarget + 15.5).toFixed(1)}%</p>
      <p class="detail">+1.4pp vs budget · +2.7pp vs LY</p>
    </div>
  `;
}
function scoreTile5(k, biz, title) {
  return `
    <div class="kpi-card positive">
      <h3>${title}</h3>
      <h1>£${(biz.scaleRev * 0.42).toFixed(2)}M</h1>
      <p>Budget: £${(biz.scaleRev * 0.4).toFixed(2)}M</p>
      <p>LY: £${(biz.scaleRev * 0.39).toFixed(2)}M</p>
      <p class="detail">+£0.4M vs budget</p>
    </div>
  `;
}
function scoreTile6(biz, title) {
  return `
    <div class="kpi-card critical">
      <h3>${title}</h3>
      <h1>£${(2.1 + (biz.seed % 5) / 10).toFixed(2)}M</h1>
      <p>Operating cash position</p>
      <p>Week ending ${new Date(Date.now() - 7*86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
      <p class="detail">Below £3.0M threshold</p>
    </div>
  `;
}
function scoreTile7(k, biz, title) {
  const cls = biz.otifTarget >= 95 ? "positive" : "warning";
  return `
    <div class="kpi-card ${cls}">
      <h3>${title}</h3>
      <h1>${(biz.otifTarget + 0.3).toFixed(1)}%</h1>
      <p>Target: ${biz.otifTarget}%</p>
      <p>LY MTD: ${(biz.otifTarget - 1.2).toFixed(1)}%</p>
      <p class="detail">On target · +1.5pp vs LY</p>
    </div>
  `;
}
function scoreTile8(biz, title) {
  return `
    <div class="kpi-card warning">
      <h3>${title}</h3>
      <h1>${(78 + biz.seed % 10).toFixed(0)}%</h1>
      <p>Stock cover days: ${Math.floor(45 + biz.seed % 15)}</p>
      <p>E&amp;O exposure: £${(biz.scaleRev * 0.05).toFixed(2)}M</p>
      <p class="detail">Near target · +£0.2M E&amp;O vs prior</p>
    </div>
  `;
}
function scoreTile9(k, biz, title) {
  const n = parseInt(k.value);
  const cls = n < 15 ? "positive" : n < 25 ? "warning" : "critical";
  return `
    <div class="kpi-card ${cls}">
      <h3>${title}</h3>
      <h1>${k.value}</h1>
      <p>SKUs currently out of stock</p>
      <p>Of which top sellers: ${Math.floor(n * 0.4)}</p>
      <p class="detail">Recovery cost ~£${(n * 0.02).toFixed(2)}M / week</p>
    </div>
  `;
}
