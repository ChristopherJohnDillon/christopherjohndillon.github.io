/* ============================================================
   FLARE — Pricing & Shipping Analytics
   Matches the real pricing_impact_dash.py screenshot pattern.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.stats = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const promos = FlareData.promos(biz);
  let promoIdx = 0;
  let tab = "Overview";

  function render() {
    const test = FlareData.statTest(biz, promoIdx);
    const liftPct = ((test.postMean - test.preMean) / test.preMean) * 100;
    const dataAsOf = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    main.innerHTML = `
      <div class="main-inner">
        <h1 class="page-title">Pricing &amp; Shipping Analytics</h1>
        <div class="data-as-of">Data as of ${dataAsOf} (8.5h ago)</div>

        <div class="expander" style="margin-bottom: 1.5rem;">
          <div class="expander-head"><span class="ms ms-sm">chevron_right</span> Filter Options</div>
        </div>

        <div class="pill-radio" id="tabRadio" style="margin-bottom: 2rem;">
          ${["Overview", "Trends", "Shipping", "Price Changes", "Instructions"].map((t) => `
            <button class="pill-opt ${t === tab ? "active" : ""}" data-tab="${t}">${t}</button>
          `).join("")}
        </div>

        <hr class="divider" />

        ${tab === "Overview" ? overviewHtml(test, liftPct) : tab === "Trends" ? trendsHtml() : tab === "Instructions" ? instructionsHtml() : placeholderHtml(tab)}
      </div>
    `;

    document.querySelectorAll("#tabRadio .pill-opt").forEach((b) => {
      b.addEventListener("click", () => { tab = b.getAttribute("data-tab"); render(); });
    });
    if (tab === "Overview") FlareCharts.categoryLiftBars("statsLift", test.perCat);
  }

  function overviewHtml(test, liftPct) {
    return `
      <div style="margin-bottom: 1.2rem;">
        <h2 style="font-size: 1.6rem; display: inline-flex; align-items: center; gap: 0.5rem;"><span class="ms" style="color: var(--accent);">insights</span>Pricing Impact Overview</h2>
      </div>

      <div class="filter-row cols-1" style="margin-bottom: 1.5rem;">
        <div class="field">
          <label class="field-label">Promotion under test</label>
          <select class="st-select" id="promoSel">
            ${promos.map((p, i) => `<option value="${i}" ${i === promoIdx ? "selected" : ""}>${p.label}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="metric-row">
        ${metric("Pre-period mean", `£${test.preMean.toFixed(2)}`, "", "neutral", false)}
        ${metric("Post-period mean", `£${test.postMean.toFixed(2)}`, `${liftPct >= 0 ? "↑" : "↓"} ${(liftPct >= 0 ? "+" : "")}${liftPct.toFixed(1)}% vs pre`, liftPct > 0 ? "positive" : "negative")}
        ${metric("p-value", test.pValue.toFixed(4), test.sig ? "↑ p < 0.05" : "not significant", test.sig ? "positive" : "neutral")}
        ${metric("Sample size", test.n.toLocaleString(), `n baskets matched`, "neutral", false)}
      </div>

      <hr class="divider" />

      <div style="margin-bottom: 1rem;">
        <h2 style="font-size: 1.6rem;">Lift by category</h2>
        <div style="color: var(--mute); font-size: 0.92rem; margin-top: 0.3rem;">With 95% confidence intervals · Welch's t-test · α = 0.05</div>
      </div>
      <div class="chart-card tall"><canvas id="statsLift"></canvas></div>
    `;
  }

  function trendsHtml() {
    return `
      <div style="margin-bottom: 1.2rem;">
        <h2 style="font-size: 1.6rem; display: inline-flex; align-items: center; gap: 0.5rem;"><span class="ms" style="color: var(--accent);">timeline</span>Trends</h2>
      </div>
      <div style="color: var(--read); font-size: 0.95rem;">12-month trend view. <em>(Demo: not implemented; real FLARE shows margin BPS change time series here.)</em></div>
    `;
  }

  function placeholderHtml(t) {
    return `<div style="color: var(--mute); font-size: 0.95rem; font-style: italic;">${t} view not implemented in this demo.</div>`;
  }

  function instructionsHtml() {
    return `
      <div style="margin-bottom: 1.2rem;">
        <h2 style="font-size: 1.6rem; display: inline-flex; align-items: center; gap: 0.5rem;"><span class="ms" style="color: var(--accent);">menu_book</span>Dashboard Guide</h2>
        <div style="color: var(--read); font-size: 0.95rem; margin-top: 0.4rem;">This dashboard tracks pricing and shipping strategy impact on margin and revenue.</div>
      </div>
      <hr class="divider" />
      <h3 style="font-size: 1.2rem; margin-bottom: 0.6rem;">Tab 1: Pricing Impact</h3>
      <p style="color: var(--instrument); margin-bottom: 0.5rem;"><strong>Purpose:</strong> Overall margin performance — revenue, margin $, margin %, BPS change.</p>
      <p style="color: var(--instrument); margin-bottom: 0.5rem;"><strong>How to use:</strong></p>
      <ol style="color: var(--instrument); padding-left: 1.5rem; line-height: 1.8;">
        <li>Start with <strong>All</strong> filters for total business view</li>
        <li>Use <strong>Quick Channel Filters</strong> to compare Direct/Marketplace/Wholesale</li>
        <li>Drill into divisions/companies</li>
        <li>Watch the <strong>Margin % Trend</strong> chart for direction</li>
      </ol>
      <p style="color: var(--instrument); margin-top: 0.8rem;"><strong>Key metrics:</strong> Margin BPS Change (core KPI), Trend slope, YoY comparison</p>
    `;
  }

  render();
};
