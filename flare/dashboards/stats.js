/* ============================================================
   FLARE — Statistical analysis dashboard
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.stats = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const promos = FlareData.promos(biz);
  let promoIdx = 0;

  function render() {
    const test = FlareData.statTest(biz, promoIdx);
    main.innerHTML = `
      <div class="page-head">
        <h1>Statistical analysis</h1>
        <div class="crumbs">FLARE · <span class="accent">${biz.name}</span> · promo impact</div>
      </div>

      <div class="stats-promo">
        <div>
          <span class="l">Promotion under test</span><br/>
          <select id="promoSel" style="margin-top: 0.4rem;">
            ${promos.map((p, i) => `<option value="${i}" ${i === promoIdx ? "selected" : ""}>${p.label}</option>`).join("")}
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="l">n = ${test.n.toLocaleString()}</span>
          <span class="l">p = ${test.pValue.toFixed(4)}</span>
          <span class="sig-flag ${test.sig ? "sig" : "nosig"}">${test.sig ? "SIGNIFICANT" : "NOT SIGNIFICANT"}</span>
        </div>
      </div>

      <div class="stats-cmp">
        <div class="card">
          <div class="label">Pre-period · mean basket value</div>
          <div class="value">£${test.preMean.toFixed(2)}</div>
          <div class="ci">95% CI: £${(test.preMean - test.preCi).toFixed(2)} – £${(test.preMean + test.preCi).toFixed(2)}</div>
        </div>
        <div class="card" style="border-left: 2px solid ${test.sig ? "var(--accent)" : "var(--mute)"};">
          <div class="label">Post-period · mean basket value</div>
          <div class="value">£${test.postMean.toFixed(2)} <span style="font-size: 0.85rem; color: ${test.postMean > test.preMean ? "var(--positive)" : "var(--critical)"}; margin-left: 0.4rem;">${test.postMean > test.preMean ? "+" : ""}${(((test.postMean - test.preMean) / test.preMean) * 100).toFixed(1)}%</span></div>
          <div class="ci">95% CI: £${(test.postMean - test.postCi).toFixed(2)} – £${(test.postMean + test.postCi).toFixed(2)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h2>Lift by category · with 95% confidence intervals</h2>
          <div class="meta">Welch's t-test · two-sided · α = 0.05</div>
        </div>
        <div class="chart-card tall"><canvas id="statsLift"></canvas></div>
      </div>

      <div class="card" style="margin-top: 0.85rem; font-size: 0.8rem; color: var(--mute);">
        <strong style="color: var(--read);">Methodology.</strong> Pre/post comparison uses a Welch's two-sample t-test on the basket-value distributions, with unequal variances assumed. CIs are derived from the t-distribution at α = 0.05. n shown reflects unique baskets matched to the promo window. Real FLARE pipes the same logic but on live warehouse data with daily refresh and per-cohort stratification.
      </div>
    `;

    FlareCharts.categoryLiftBars("statsLift", test.perCat);

    document.getElementById("promoSel").addEventListener("change", (e) => {
      promoIdx = parseInt(e.target.value, 10);
      render();
    });
  }

  render();
};
