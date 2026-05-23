/* ============================================================
   FLARE — OTIF (On Time In Full) Dashboard
   Matches real Otif_Tracker.py pattern:
   - Title + orange-highlight definition lines + body text
   - Filter Options expander
   - Big green scorecard + row of plain metrics
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.otif = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + i * 17.7)) * 43758.5; return x - Math.floor(x); };

  const overall = biz.otifTarget + (r(1) - 0.45) * 4;
  const target  = biz.otifTarget;
  const totalOrders = Math.floor(15000 + r(2) * 40000);
  const onTime  = Math.min(99.9, target + 1 + (r(3) - 0.5) * 4);
  const inFull  = Math.min(99.9, 96 + (r(4) - 0.5) * 4);
  const inFullFT = Math.min(99.9, 90 + (r(5) - 0.5) * 6);
  const otifFT  = Math.min(99.9, overall - 4 + (r(6) - 0.5) * 4);
  const failures = Math.floor(totalOrders * (1 - overall / 100));

  const overallCls = overall >= target ? "positive" : overall >= target - 1.5 ? "warning" : "critical";

  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title">OTIF (On Time In Full) Dashboard</h1>

      <div style="margin-top: 1rem; font-size: 1.05rem; color: var(--white); font-weight: 700; line-height: 1.65;">
        <p style="margin-bottom: 0.5rem;"><span style="color: var(--accent);">On Time</span>: Order shipped on or before the promised SLA date, measured from payment date</p>
        <p style="margin-bottom: 0.5rem;"><span style="color: var(--accent);">In Full</span>: All items in the order are shipped</p>
        <p style="margin-bottom: 1.1rem;"><span style="color: var(--accent);">First Time</span>: Order is shipped in a single shipment</p>
        <p style="margin-bottom: 0.5rem;">Orders with a future shipping deadline are excluded, unless they have already shipped OTIF</p>
        <p style="margin-bottom: 0.5rem;">SLA details per business are shown at the bottom of this page</p>
        <p style="margin-bottom: 1.5rem;">E-marketplace orders are excluded from this report, as they are not shipped by us.</p>
      </div>

      <div class="expander" style="margin-bottom: 2rem;">
        <div class="expander-head"><span class="ms ms-sm">chevron_right</span> Filter Options</div>
      </div>

      <h2 style="font-size: 1.6rem; margin-bottom: 1.25rem;">Key Performance Indicators</h2>

      <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 1.5rem; align-items: stretch; margin-bottom: 2rem;">
        <div class="kpi-card ${overallCls}" style="min-height: 200px;">
          <h3>Overall OTIF %</h3>
          <h1>${overall.toFixed(1)}%</h1>
          <p>Target: ${target}%</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; align-content: start;">
          ${metric("Total Orders", totalOrders.toLocaleString(), "", "neutral", false)}
          ${metric("On-Time %", `${onTime.toFixed(1)}%`, "", "neutral", false)}
          ${metric("In-Full %", `${inFull.toFixed(1)}%`, "", "neutral", false)}
          ${metric("OTIF Failure Count", failures.toLocaleString(), "", "neutral", false)}
          ${metric("In-Full First Time %", `${inFullFT.toFixed(1)}%`, "", "neutral", false)}
          ${metric("OTIF First Time %", `${otifFT.toFixed(1)}%`, "", "neutral", false)}
        </div>
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.6rem; margin-bottom: 1rem;">OTIF by business</h2>
      <table class="tbl tbl-flare">
        <thead><tr>
          <th>Business</th>
          <th class="num">Orders</th>
          <th class="num">OTIF %</th>
          <th class="num">On-Time %</th>
          <th class="num">In-Full %</th>
          <th class="num">vs Target</th>
        </tr></thead>
        <tbody>
          ${FlareData.businesses.filter((b) => b.key !== "group").map((b, i) => {
            const o = b.otifTarget + (Math.sin(b.seed + 1.3) * 2.5);
            const orders = Math.floor(2000 + (Math.sin(b.seed) + 1) * 6000);
            const otd = b.otifTarget + 1 + (Math.cos(b.seed) * 2);
            const ifd = 95 + (Math.sin(b.seed * 1.7) * 3);
            const vt = o - b.otifTarget;
            const cls = vt >= 0 ? "pos" : "neg";
            return `<tr>
              <td>${b.name}</td>
              <td class="num">${orders.toLocaleString()}</td>
              <td class="num">${o.toFixed(1)}%</td>
              <td class="num">${otd.toFixed(1)}%</td>
              <td class="num">${ifd.toFixed(1)}%</td>
              <td class="num ${cls}">${vt >= 0 ? "+" : ""}${vt.toFixed(1)}pp</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
};
