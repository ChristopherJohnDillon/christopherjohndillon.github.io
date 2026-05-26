/* ============================================================
   FLARE — Product Margin
   Matches real Product_Margin.py screenshot:
   - Title + subtitle + data-as-of caption
   - 4-col selectbox filter row (Currency / Period / Division / View)
   - 2-col multiselect (Company / Channel)
   - Date range line
   - 4 metrics with green pill deltas (last one no delta)
   - Section header + tracker table
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.sku = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const skus = FlareData.skus(biz);
  const cats = FlareData.categories(businessKey);

  function readState() {
    const p = FlareUrl.read();
    return {
      currency: ["GBP", "USD", "EUR"].includes(p.currency) ? p.currency : "GBP",
      period: ["MTD", "YTD", "Yesterday", "Last 30 Days", "Last 90 Days", "Last Month"].includes(p.period) ? p.period : "MTD",
      division: p.division || "All",
      view: ["Totals", "Channels"].includes(p.view) ? p.view : "Totals",
    };
  }
  let { currency, period, division, view } = readState();
  let selectedCats = ["All"];
  let selectedChans = ["All"];

  function filtered() {
    if (selectedCats.includes("All")) return skus;
    return skus.filter((s) => selectedCats.includes(s.category));
  }

  function totals() {
    const xs = filtered();
    const totalRev = xs.reduce((s, x) => s + x.revenueYTD, 0);
    const avgMargin = xs.length ? xs.reduce((s, x) => s + x.marginPct, 0) / xs.length : 0;
    const marginPounds = totalRev * avgMargin / 100;
    const budgetRev = totalRev * 0.93;
    const budgetMarginPct = biz.gmTarget;
    const revVsBudget = totalRev - budgetRev;
    const marginVsBudget = marginPounds - (budgetRev * budgetMarginPct / 100);
    const attainment = budgetRev ? (totalRev / budgetRev) * 100 : 100;
    return { totalRev, avgMargin, marginPounds, budgetMarginPct, revVsBudget, marginVsBudget, attainment, n: xs.length };
  }

  function render() {
    const t = totals();
    const dataAsOf = new Date().toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Product Margin", "Per-business, per-channel margin vs budget targets")}
        <div class="data-as-of">Data as of ${dataAsOf}</div>

        <div class="filter-row">
          <div class="field">
            <label class="field-label">Currency</label>
            <select class="st-select" id="fCurrency">
              <option ${currency === "GBP" ? "selected" : ""}>GBP</option>
              <option ${currency === "USD" ? "selected" : ""}>USD</option>
              <option ${currency === "EUR" ? "selected" : ""}>EUR</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Period</label>
            <select class="st-select" id="fPeriod">
              ${["MTD", "YTD", "Yesterday", "Last 30 Days", "Last 90 Days", "Last Month"].map((p) => `<option ${period === p ? "selected" : ""}>${p}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Division</label>
            <select class="st-select" id="fDiv">
              ${["All", ...FlareData.businesses.filter((b) => b.key !== "group").map((b) => b.name)].map((d) => `<option ${division === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label class="field-label">View</label>
            <select class="st-select" id="fView">
              ${["Totals", "Channels"].map((v) => `<option ${view === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="filter-row cols-2">
          <div class="field">
            <label class="field-label">Company</label>
            <div class="st-multi">
              ${selectedCats.map(chipHtml).join("")}
            </div>
          </div>
          <div class="field">
            <label class="field-label">Channel</label>
            <div class="st-multi">
              ${selectedChans.map(chipHtml).join("")}
            </div>
          </div>
        </div>

        <div class="data-as-of">${periodDates(period)}</div>

        <div class="metric-row">
          ${metric("Margin " + symbol(currency), fmtMoney(t.marginPounds, currency), `${arrow(t.marginVsBudget)} ${fmtMoney(Math.abs(t.marginVsBudget), currency)} vs budget`, t.marginVsBudget >= 0 ? "positive" : "negative")}
          ${metric("Margin %", `${t.avgMargin.toFixed(1)}%`, `${arrow(t.avgMargin - t.budgetMarginPct)} ${(t.avgMargin - t.budgetMarginPct >= 0 ? "+" : "")}${(t.avgMargin - t.budgetMarginPct).toFixed(1)}% vs target`, t.avgMargin >= t.budgetMarginPct ? "positive" : "negative")}
          ${metric("Revenue", fmtMoney(t.totalRev, currency), `${arrow(t.revVsBudget)} ${fmtMoney(Math.abs(t.revVsBudget), currency)} vs budget`, t.revVsBudget >= 0 ? "positive" : "negative")}
          ${metric("Rev Attainment", `${t.attainment.toFixed(1)}%`, "", "neutral", false)}
        </div>

        <hr class="divider" />

        <div style="margin-bottom: 1rem;">
          <span style="font-size: 1.5rem; font-weight: 700; color: var(--white);">Product Margin Tracker</span>
          <span style="color: var(--mute); font-size: 0.95rem; font-weight: 400;"> — Actual margin vs target by business &amp; channel</span>
          <div style="margin-top: 0.45rem; font-size: 0.85rem;">
            <span style="color: var(--positive); font-weight: 500;">Green = over target</span>
            <span style="color: var(--mute); margin: 0 0.4rem;">·</span>
            <span style="color: var(--critical); font-weight: 500;">Red = under target</span>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="tbl tbl-flare">
            <thead>
              <tr>
                <th>Business</th>
                <th>Channel</th>
                <th class="num">Rev Actual</th>
                <th class="num">Rev Budget</th>
                <th class="num">Margin $ Actual</th>
                <th class="num">Margin $ Budget</th>
                <th class="num">Margin $ Var</th>
                <th class="num">Margin % Actual</th>
                <th class="num">Margin % Target</th>
                <th class="num">Margin % Var</th>
              </tr>
            </thead>
            <tbody>${trackerRows(skus, biz, currency)}</tbody>
          </table>
        </div>
      </div>
    `;

    FlareUI.mountHeader(main);

    // Wire up selects → URL (which triggers a re-render via onChange)
    const keys = ["currency", "period", "division", "view"];
    const ids  = ["fCurrency", "fPeriod", "fDiv", "fView"];
    const defaults = { currency: "GBP", period: "MTD", division: "All", view: "Totals" };
    ids.forEach((id, i) => {
      document.getElementById(id).addEventListener("change", (e) => {
        const k = keys[i];
        const v = e.target.value;
        FlareUrl.set({ [k]: v === defaults[k] ? null : v });
      });
    });
  }

  function chipHtml(c) { return `<span class="st-chip">${c} <span class="x">×</span></span>`; }

  function trackerRows(skus, biz, currency) {
    // Group by category for the "TATTOO/BEAUTY/PET"-style section breaks
    const byCat = {};
    for (const s of skus) {
      if (!byCat[s.category]) byCat[s.category] = [];
      byCat[s.category].push(s);
    }
    let out = "";
    for (const cat of Object.keys(byCat)) {
      out += `<tr><td colspan="10" class="cat-sep">${cat.toUpperCase()}</td></tr>`;
      // Aggregate by business+channel within category — for the demo just show top 3 SKUs as rows
      const top = byCat[cat].slice().sort((a, b) => b.revenueYTD - a.revenueYTD).slice(0, 3);
      for (const s of top) {
        const revActual = s.revenueYTD;
        const revBudget = revActual * 0.94;
        const marginActual = revActual * s.marginPct / 100;
        const marginBudget = revBudget * biz.gmTarget / 100;
        const marginVar = marginActual - marginBudget;
        const marginPctVar = s.marginPct - biz.gmTarget;
        const marginVarCls = marginVar >= 0 ? "pos" : "neg";
        const pctVarCls = marginPctVar >= 0 ? "pos" : "neg";
        out += `<tr>
          <td>${s.name.split(" ").slice(0, 2).join(" ")}</td>
          <td class="mono">Direct</td>
          <td class="num">${fmtMoney(revActual, currency)}</td>
          <td class="num">${fmtMoney(revBudget, currency)}</td>
          <td class="num">${fmtMoney(marginActual, currency)}</td>
          <td class="num">${fmtMoney(marginBudget, currency)}</td>
          <td class="num ${marginVarCls}">${marginVar >= 0 ? "+" : ""}${fmtMoney(marginVar, currency)}</td>
          <td class="num">${s.marginPct.toFixed(1)}%</td>
          <td class="num">${biz.gmTarget.toFixed(1)}%</td>
          <td class="num ${pctVarCls}">${marginPctVar >= 0 ? "+" : ""}${marginPctVar.toFixed(1)}%</td>
        </tr>`;
      }
    }
    return out;
  }

  const off = FlareUrl.onChange((_p, route) => {
    if (route === "#/sku") { ({ currency, period, division, view } = readState()); render(); }
    else off();
  });
  render();
};

/* ============================================================
   Shared metric helper — KPI tile style
   ============================================================ */
function metric(label, value, delta, cls, showDelta = true) {
  if (!showDelta || !delta) {
    return `<div class="metric">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>`;
  }
  return `<div class="metric">
    <div class="label">${label}</div>
    <div class="value">${value}</div>
    <div class="delta ${cls || "neutral"}">${delta}</div>
  </div>`;
}

function symbol(c) { return c === "USD" ? "$" : c === "EUR" ? "€" : "£"; }
function fmtMoney(v, c) {
  const sym = symbol(c);
  const a = Math.abs(v);
  if (a >= 1e6) return `${sym}${(v/1e6).toFixed(1)}m`;
  if (a >= 1e3) return `${sym}${(v/1e3).toFixed(1)}k`;
  return `${sym}${v.toFixed(0)}`;
}
function arrow(v) { return v > 0 ? "↑" : v < 0 ? "↓" : ""; }
function periodDates(p) {
  const today = new Date();
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (p === "MTD") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return `${fmt(start)} → ${fmt(today)}`;
  }
  if (p === "YTD") {
    const start = new Date(today.getFullYear(), 0, 1);
    return `${fmt(start)} → ${fmt(today)}`;
  }
  if (p === "Yesterday") {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    return `${fmt(y)} → ${fmt(y)}`;
  }
  if (p === "Last 30 Days") {
    const s = new Date(today); s.setDate(s.getDate() - 30);
    return `${fmt(s)} → ${fmt(today)}`;
  }
  if (p === "Last 90 Days") {
    const s = new Date(today); s.setDate(s.getDate() - 90);
    return `${fmt(s)} → ${fmt(today)}`;
  }
  if (p === "Last Month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return `${fmt(start)} → ${fmt(end)}`;
  }
  return "";
}
