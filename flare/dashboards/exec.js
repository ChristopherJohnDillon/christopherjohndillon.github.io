/* ============================================================
   FLARE — Executive Scorecard
   L10/EOS-style traffic-light KPI tiles. All values anchored to the
   business's annualRev/aov/gmTarget/otifTarget so the numbers reconcile
   with Sales Tracker, Product Margin, OTIF, and Open Orders.
   URL filters: ?division=Global|US|EU & ?subdivision=All|Pet|Beauty|Tattoo
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.exec = function (main, businessKey) {
  const biz = FlareData.business(businessKey);

  const DIVS = ["Global", "US", "EU"];
  const SUBS = ["All", "Pet", "Beauty", "Tattoo"];

  function readState() {
    const p = FlareUrl.read();
    return {
      division: DIVS.includes(p.division) ? p.division : "Global",
      subdivision: SUBS.includes(p.subdivision) ? p.subdivision : "All",
    };
  }

  function divisionScale(div, sub) {
    /* Tilt rev by division/subdivision so filters do something visible
       without claiming a real-world geographical split. */
    let m = 1;
    if (div === "US") m *= 0.58;
    else if (div === "EU") m *= 0.42;
    if (sub === "Pet") m *= 0.35;
    else if (sub === "Beauty") m *= 0.30;
    else if (sub === "Tattoo") m *= 0.18;
    return m;
  }

  function render() {
    const { division, subdivision } = readState();
    const m = divisionScale(division, subdivision);
    const today = new Date();
    const day = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthFraction = day / daysInMonth;
    const monthName = today.toLocaleString("en-GB", { month: "long" });
    const asOf = new Date(today.getTime() - 24 * 3600 * 1000);
    const asOfStr = asOf.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const runAt = today.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    /* === Anchored numbers === */
    const annual = biz.annualRev * m;
    const monthlyBudget = annual / 12;
    const mtdBudget = monthlyBudget * monthFraction;
    /* Pull a deterministic "actual" close to budget */
    const seed = biz.seed + (division.charCodeAt(0) || 0) + (subdivision.charCodeAt(0) || 0);
    const r = ((Math.sin(seed) + 1) / 2);
    const mtdActual = mtdBudget * (0.91 + r * 0.14); /* between 91% and 105% of budget */
    const mtdLY = mtdBudget * (0.93 + ((Math.sin(seed + 1.7) + 1) / 2) * 0.10);

    const projection = monthlyBudget * (0.94 + r * 0.08);
    const orderCount = Math.floor(biz.ordersPerDay * day * (0.96 + r * 0.08));
    const openOrdersTotal = Math.floor(biz.ordersPerDay * 2.4 * m * (0.92 + r * 0.16));
    const openOrdersWholesale = Math.floor(openOrdersTotal * 0.62);
    const openOrdersDirect = openOrdersTotal - openOrdersWholesale;
    const openOrdersValue = (openOrdersTotal * biz.aov) / 1e6;
    const wholesaleValue = (openOrdersWholesale * biz.aov * 1.15) / 1e6;
    const directValue = openOrdersValue - wholesaleValue;

    const marginPct = biz.gmTarget + (r - 0.5) * 1.8;
    const marginPctBudget = biz.gmTarget;
    const marginMTD = mtdActual * marginPct / 100;
    const marginMTDBudget = mtdBudget * biz.gmTarget / 100;

    const cashWeeks = (1.5 + r * 1.4); /* £M */
    const otif = biz.otifTarget + (r - 0.45) * 1.8;
    const otifClass = otif >= biz.otifTarget ? "positive" : otif >= biz.otifTarget - 1.5 ? "warning" : "critical";
    const invHealth = 76 + Math.floor(r * 18);
    const stockDays = Math.floor(38 + r * 18);
    const eoExposure = (biz.annualRev * 0.012 * m) / 1e6;
    const activeStockouts = Math.max(2, Math.floor(8 + r * 18));
    const topSellerOos = Math.floor(activeStockouts * 0.4);
    const recoveryCostPerWeek = activeStockouts * 0.018;

    const cls = (actualVal, target, tolerance = 0.025) => {
      if (actualVal >= target) return "positive";
      if (actualVal >= target * (1 - tolerance)) return "warning";
      return "critical";
    };

    const mtdCls = cls(mtdActual, mtdBudget, 0.05);
    const projCls = cls(projection, monthlyBudget, 0.04);
    const marginPctCls = cls(marginPct, marginPctBudget, 0.01);
    const cashCls = cashWeeks >= 3 ? "positive" : cashWeeks >= 2 ? "warning" : "critical";
    const invCls = invHealth >= 85 ? "positive" : invHealth >= 78 ? "warning" : "critical";
    const stockoutsCls = activeStockouts < 15 ? "positive" : activeStockouts < 25 ? "warning" : "critical";

    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Executive Scorecard", "L10/EOS-style traffic-light KPIs. Click any tile to view the source dashboard.")}

        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.7rem;">
          <img src="/flare/flare-logo.svg" alt="" style="width: 36px; height: 32px;" />
          <div style="font-weight: 800; font-size: 1.1rem; letter-spacing: 0.06em; color: var(--white); line-height: 1.05;">
            HELIOS BRANDS CO.
            <div style="font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; color: var(--mute); margin-top: 1px;">${biz.name.toUpperCase()}</div>
          </div>
        </div>

        <div class="data-as-of">Performance as of ${asOfStr} · analysis ran ${runAt}</div>

        <h2 style="font-size: 1.4rem; margin: 0.4rem 0 1.2rem;">MTD · 1 – ${day} ${monthName}</h2>

        <div class="filter-row cols-2" style="margin-bottom: 1.75rem;">
          <div class="field">
            <label class="field-label">Division</label>
            <div class="pill-radio" id="divRadio">
              ${DIVS.map((d) => `<button class="pill-opt ${d === division ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
            </div>
          </div>
          <div class="field">
            <label class="field-label">Subdivision</label>
            <div class="pill-radio" id="subRadio">
              ${SUBS.map((d) => `<button class="pill-opt ${d === subdivision ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card ${mtdCls}">
            <h3>REVENUE MTD</h3>
            <h1>${fmtM(mtdActual)}</h1>
            <p>Budget MTD: ${fmtM(mtdBudget)}</p>
            <p>LY MTD: ${fmtM(mtdLY)} (${pp(mtdActual / mtdLY - 1)})</p>
            <p>${(mtdActual / monthlyBudget * 100).toFixed(0)}% of full-month budget (${fmtM(monthlyBudget)})</p>
            <p class="detail">${pp(mtdActual / mtdBudget - 1)} vs MTD budget · ${(mtdActual / monthlyBudget * 100).toFixed(0)}% of full-month</p>
          </div>
          <div class="kpi-card ${projCls}">
            <h3>MONTH-END PROJECTION</h3>
            <h1>${fmtM(projection)}</h1>
            <p>Run-rate forecast<br>Budget: ${fmtM(monthlyBudget)}</p>
            <p>WD progress: ${day}/${daysInMonth} (${Math.round(monthFraction * 100)}%) · Avg/day: ${fmtK(mtdActual / day)}</p>
            <p class="detail">${pp(projection / monthlyBudget - 1)} vs full-month budget</p>
          </div>
          <div class="kpi-card neutral">
            <h3>OPEN ORDERS (TOTAL)</h3>
            <h1>£${openOrdersValue.toFixed(2)}M (${openOrdersTotal.toLocaleString()})</h1>
            <p>Wholesale £${wholesaleValue.toFixed(2)}M (${openOrdersWholesale.toLocaleString()})</p>
            <p>Direct £${directValue.toFixed(2)}M (${openOrdersDirect.toLocaleString()})</p>
            <p class="detail"><a href="#/openorders" style="color: var(--accent); border-bottom: 1px dotted var(--accent);">View pipeline →</a></p>
          </div>
        </div>
        <div class="kpi-grid">
          <div class="kpi-card ${marginPctCls}">
            <h3>PRODUCT MARGIN %</h3>
            <h1>${marginPct.toFixed(1)}%</h1>
            <p>Budget: ${marginPctBudget.toFixed(1)}%</p>
            <p>LY: ${(marginPctBudget - 0.8).toFixed(1)}%</p>
            <p class="detail">${pp((marginPct - marginPctBudget) / 100)} vs budget</p>
          </div>
          <div class="kpi-card ${cls(marginMTD, marginMTDBudget, 0.05)}">
            <h3>MARGIN MTD</h3>
            <h1>${fmtM(marginMTD)}</h1>
            <p>Budget: ${fmtM(marginMTDBudget)}</p>
            <p>LY: ${fmtM(marginMTDBudget * 0.95)}</p>
            <p class="detail">${marginMTD >= marginMTDBudget ? "+" : ""}${fmtM(marginMTD - marginMTDBudget)} vs budget</p>
          </div>
          <div class="kpi-card ${cashCls}">
            <h3>CASH LIQUIDITY (PRIOR WEEK)</h3>
            <h1>£${cashWeeks.toFixed(2)}M</h1>
            <p>Operating cash position</p>
            <p>Week ending ${new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
            <p class="detail">${cashWeeks < 3 ? "Below £3.0M threshold" : "Above £3.0M threshold"}</p>
          </div>
        </div>
        <div class="kpi-grid">
          <div class="kpi-card ${otifClass}">
            <h3>OTIF MTD</h3>
            <h1>${otif.toFixed(1)}%</h1>
            <p>Target: ${biz.otifTarget}%</p>
            <p>LY MTD: ${(biz.otifTarget - 1.2).toFixed(1)}%</p>
            <p class="detail">${pp((otif - biz.otifTarget) / 100)} vs target</p>
          </div>
          <div class="kpi-card ${invCls}">
            <h3>INVENTORY HEALTH</h3>
            <h1>${invHealth}%</h1>
            <p>Stock cover days: ${stockDays}</p>
            <p>E&amp;O exposure: £${eoExposure.toFixed(2)}M</p>
            <p class="detail">${invHealth >= 85 ? "On target" : "Near target"}</p>
          </div>
          <div class="kpi-card ${stockoutsCls}">
            <h3>ACTIVE STOCKOUTS</h3>
            <h1>${activeStockouts}</h1>
            <p>SKUs currently out of stock</p>
            <p>Of which top sellers: ${topSellerOos}</p>
            <p class="detail">Recovery cost ~£${recoveryCostPerWeek.toFixed(2)}M/week</p>
          </div>
        </div>
      </div>
    `;

    FlareUI.mountHeader(main);

    main.querySelectorAll("#divRadio .pill-opt").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ division: b.getAttribute("data-d") === "Global" ? null : b.getAttribute("data-d") }));
    });
    main.querySelectorAll("#subRadio .pill-opt").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ subdivision: b.getAttribute("data-d") === "All" ? null : b.getAttribute("data-d") }));
    });
  }

  const off = FlareUrl.onChange((_params, route) => {
    if (route === "#/exec") render();
    else off();
  });

  render();
};

function fmtM(v) { return "£" + (v / 1e6).toFixed(2) + "M"; }
function fmtK(v) { return "£" + (v / 1e3).toFixed(0) + "k"; }
function pp(frac) {
  const x = frac * 100;
  return (x >= 0 ? "+" : "") + x.toFixed(1) + "%";
}
