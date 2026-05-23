/* ============================================================
   FLARE — Pricing & Shipping
   Mirrors real pricing_impact_dash.py: filter row + 4 metrics + chart.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.stats = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const promos = FlareData.promos(biz);
  let promoIdx = 0;

  function render() {
    const test = FlareData.statTest(biz, promoIdx);
    const liftPct = ((test.postMean - test.preMean) / test.preMean) * 100;

    main.innerHTML = `
      <h1 class="page-title">Pricing &amp; Shipping</h1>
      <div class="page-subtitle">Analyse pricing impacts, model price-change scenarios, and test statistical significance — ${biz.name}.</div>

      <div class="filter-bar">
        <select id="promoSel">
          ${promos.map((p, i) => `<option value="${i}" ${i === promoIdx ? "selected" : ""}>${p.label}</option>`).join("")}
        </select>
        <span class="sig-flag ${test.sig ? "sig" : "nosig"}">${test.sig ? "p < 0.05 — Significant" : "Not significant"}</span>
      </div>

      <div class="metric-row">
        ${m("Pre-period mean", `£${test.preMean.toFixed(2)}`, `95% CI ±£${test.preCi.toFixed(2)}`, "neutral")}
        ${m("Post-period mean", `£${test.postMean.toFixed(2)}`, `95% CI ±£${test.postCi.toFixed(2)}`, "neutral")}
        ${m("Lift", `${liftPct >= 0 ? "+" : ""}${liftPct.toFixed(1)}%`, "post vs pre", liftPct > 0 ? "positive" : "negative")}
        ${m("p-value", test.pValue.toFixed(4), `n = ${test.n.toLocaleString()} baskets`, test.sig ? "positive" : "neutral")}
      </div>

      <hr class="divider" />

      <div class="section-head">
        <h2>Lift by category · with 95% confidence intervals</h2>
        <div class="meta">Welch's t-test · two-sided · α = 0.05</div>
      </div>
      <div class="chart-card tall"><canvas id="statsLift"></canvas></div>

      <div class="card" style="margin-top: 1rem; font-size: 0.9rem; color: var(--read);">
        <strong style="color: var(--instrument);">How to read this.</strong> Each bar is the per-category basket-value lift in the post-promotion window vs the pre-promotion baseline. Whiskers are the 95% confidence interval. Real FLARE runs this on daily-refreshed warehouse data with per-cohort stratification.
      </div>
    `;

    FlareCharts.categoryLiftBars("statsLift", test.perCat);
    document.getElementById("promoSel").addEventListener("change", (e) => { promoIdx = parseInt(e.target.value, 10); render(); });
  }

  render();
};

function m(label, value, delta, cls) {
  const arrow = cls === "positive" ? "▲" : cls === "negative" ? "▼" : "";
  return `
    <div class="metric">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="delta ${cls || "neutral"}"><span class="arrow">${arrow}</span>${delta}</div>
    </div>
  `;
}
