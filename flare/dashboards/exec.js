/* ============================================================
   FLARE — Executive Scorecard
   Traffic-light KPI scorecard. All values anchored to the
   business's annualRev/aov/gmTarget/otifTarget so the numbers reconcile
   with Sales Tracker, Product Margin, OTIF, and Open Orders.
   URL filters: ?division=Global|Direct|Wholesale & ?channel=<channel name>
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.exec = function (main, businessKey) {
  const biz = FlareData.business(businessKey);

  const DIVS = ["Global", "Direct", "Wholesale"];
  const CHANS = ["All", ...FlareData.channels];

  function readState() {
    const p = FlareUrl.read();
    return {
      division: DIVS.includes(p.division) ? p.division : "Global",
      channel: CHANS.includes(p.channel) ? p.channel : "All",
    };
  }

  function divisionScale(div, chan) {
    let m = 1;
    if (div === "Direct") m *= 0.62;
    else if (div === "Wholesale") m *= 0.38;
    const chanMix = { Shopify: 0.36, Amazon: 0.22, Wholesale: 0.28, eBay: 0.08, "Retail POS": 0.06, All: 1 };
    m *= chanMix[chan] || 1;
    return m;
  }

  function render() {
    const { division, channel } = readState();
    const m = divisionScale(division, channel);
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
    /* Independent, salted draws per KPI. Each tile gets its own draw so tones
       move independently (a realistic mix of green / amber / red rather than
       one frozen colour), and FlareData.salt rotates every value on each
       page-load, matching the rest of the data layer. Stable within a session
       and per filter, so switching business/channel doesn't reshuffle. */
    const filterOffset = (division.charCodeAt(0) || 0) + (channel.charCodeAt(0) || 0);
    const gen = (function (seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })((biz.seed + filterOffset + (FlareData.salt >>> 0)) >>> 0);
    gen(); gen(); /* warm-up so the first pulls are well mixed */
    const stream = Array.from({ length: 16 }, () => gen());
    const draw = (n) => stream[n];

    /* Revenue vs budget — green-leaning, with an occasional miss (93%–109%) */
    const revRatio = 0.93 + draw(1) * 0.16;
    const mtdActual = mtdBudget * revRatio;
    const mtdLY = mtdBudget * (0.93 + draw(9) * 0.10);
    /* Month-end projection — run-rate off actual, nudged by a pace factor */
    const projection = monthlyBudget * revRatio * (0.97 + draw(2) * 0.07);

    /* Open orders — neutral tile */
    const openOrdersTotal = Math.floor(biz.ordersPerDay * 2.4 * m * (0.92 + draw(10) * 0.16));
    const openOrdersWholesale = Math.floor(openOrdersTotal * 0.62);
    const openOrdersDirect = openOrdersTotal - openOrdersWholesale;
    const openOrdersValue = (openOrdersTotal * biz.aov) / 1e6;
    const wholesaleValue = (openOrdersWholesale * biz.aov * 1.15) / 1e6;
    const directValue = openOrdersValue - wholesaleValue;

    /* Product margin % — clusters around target, rarely far below */
    const marginPct = biz.gmTarget + (draw(3) - 0.42) * 2.0;
    const marginPctBudget = biz.gmTarget;
    const marginMTD = mtdActual * marginPct / 100;
    const marginMTDBudget = mtdBudget * biz.gmTarget / 100;

    /* Cash — amber-leaning around the £3.0M threshold, occasional squeeze */
    const cashWeeks = 1.8 + draw(5) * 1.8; /* £1.8M–£3.6M */
    /* OTIF — around target, can dip below the critical line */
    const otif = biz.otifTarget + (draw(6) - 0.55) * 3.0;
    const otifClass = otif >= biz.otifTarget ? "positive" : otif >= biz.otifTarget - 1.5 ? "warning" : "critical";
    /* Inventory health */
    const invHealth = 74 + Math.floor(draw(7) * 20); /* 74%–93% */
    const stockDays = Math.floor(38 + draw(11) * 18);
    const eoExposure = (biz.annualRev * 0.012 * m) / 1e6;
    /* Active stockouts — lower is better (6–31) */
    const activeStockouts = Math.max(2, Math.floor(6 + draw(8) * 26));
    const topSellerOos = Math.floor(activeStockouts * 0.4);
    const recoveryCostPerWeek = activeStockouts * 0.018;

    const cls = (actualVal, target, tolerance = 0.025) => {
      if (actualVal >= target) return "positive";
      if (actualVal >= target * (1 - tolerance)) return "warning";
      return "critical";
    };

    const mtdCls = cls(mtdActual, mtdBudget, 0.05);
    const projCls = cls(projection, monthlyBudget, 0.04);
    const marginPctCls = cls(marginPct, marginPctBudget, 0.02);
    const cashCls = cashWeeks >= 3 ? "positive" : cashWeeks >= 2 ? "warning" : "critical";
    const invCls = invHealth >= 85 ? "positive" : invHealth >= 78 ? "warning" : "critical";
    const stockoutsCls = activeStockouts < 15 ? "positive" : activeStockouts < 25 ? "warning" : "critical";

    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Executive Scorecard", "Traffic-light KPIs. Click any tile to view the source dashboard.")}

        <div class="data-as-of">Performance as of ${asOfStr} · analysis ran ${runAt} · ${biz.name}</div>

        <h2 style="font-size: 1.4rem; margin: 0.4rem 0 1.2rem;">MTD · 1 – ${day} ${monthName}</h2>

        <div class="filter-row cols-2" style="margin-bottom: 1.75rem;">
          <div class="field">
            <label class="field-label">Channel mix</label>
            <div class="pill-radio" id="divRadio">
              ${DIVS.map((d) => `<button class="pill-opt ${d === division ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
            </div>
          </div>
          <div class="field">
            <label class="field-label">Channel</label>
            <div class="pill-radio" id="subRadio">
              ${CHANS.map((d) => `<button class="pill-opt ${d === channel ? "active" : ""}" data-d="${d}">${d}</button>`).join("")}
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
      b.addEventListener("click", () => FlareUrl.set({ channel: b.getAttribute("data-d") === "All" ? null : b.getAttribute("data-d") }));
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
