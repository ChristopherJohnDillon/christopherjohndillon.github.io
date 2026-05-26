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
  const WINDOWS = [
    { key: "4w", label: "Last 4 weeks", days: 28 },
    { key: "12w", label: "Last 12 weeks", days: 84 },
    { key: "24w", label: "Last 24 weeks", days: 168 },
  ];
  const CHANNELS = ["All", ...FlareData.channels];

  function readState() {
    const p = FlareUrl.read();
    return {
      window: WINDOWS.find((w) => w.key === p.window) ? p.window : "12w",
      channel: CHANNELS.includes(p.channel) ? p.channel : "All",
    };
  }

  function render() {
    const { window: win, channel } = readState();
    const winDays = WINDOWS.find((w) => w.key === win).days;
    const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 17.7 + winDays * 0.013)) * 43758.5; return x - Math.floor(x); };

    /* Channel filter pulls OTIF slightly — Amazon/Wholesale are tighter SLA, Shopify looser */
    const chanAdj = ({ Shopify: -0.3, Amazon: +0.4, Wholesale: +0.5, eBay: -0.6, "Retail POS": +0.2, All: 0 }[channel]) || 0;

    const overall = Math.min(99.4, biz.otifTarget + chanAdj + (r(1) - 0.45) * 2.4);
    const target  = biz.otifTarget;
    /* Total orders = ordersPerDay × window × (channel share if filtered) */
    const mix = { Shopify: 0.36, Amazon: 0.22, Wholesale: 0.28, eBay: 0.08, "Retail POS": 0.06, All: 1 }[channel];
    const totalOrders = Math.floor(biz.ordersPerDay * winDays * mix * (0.96 + r(2) * 0.08));
    const onTime  = Math.min(99.9, overall + 1 + (r(3) - 0.5) * 2);
    const inFull  = Math.min(99.9, 96.5 + (r(4) - 0.5) * 2);
    const inFullFT = Math.min(99.9, 91.5 + (r(5) - 0.5) * 3);
    const otifFT  = Math.min(99.9, overall - 3.5 + (r(6) - 0.5) * 2);
    const failures = Math.floor(totalOrders * (1 - overall / 100));

    const overallCls = overall >= target ? "positive" : overall >= target - 1.5 ? "warning" : "critical";

  main.innerHTML = `
    <div class="main-inner">
      ${FlareUI.pageHeader("OTIF (On Time In Full)", "On-time-in-full delivery performance across orders we ship.")}

      <div style="font-size: 0.95rem; color: var(--read); line-height: 1.6; max-width: 80ch; margin-bottom: 1.25rem;">
        <p><span style="color: var(--accent); font-weight: 600;">On Time</span> — shipped on/before the promised SLA date, measured from payment date.
        <span style="color: var(--accent); font-weight: 600;">In Full</span> — all items shipped.
        <span style="color: var(--accent); font-weight: 600;">First Time</span> — single shipment.
        Orders with a future SLA deadline are excluded unless already OTIF. Marketplace orders shipped by the platform are excluded.</p>
      </div>

      <div class="chip-rail" id="winRail">
        ${WINDOWS.map((w) => `<button class="chip ${w.key === win ? "active" : ""}" data-window="${w.key}">${w.label}</button>`).join("")}
      </div>
      <div class="chip-rail" id="chanRail" style="margin-bottom: 1.25rem;">
        ${CHANNELS.map((c) => `<button class="chip ${c === channel ? "active" : ""}" data-channel="${c}">${c}</button>`).join("")}
      </div>

      <h2 style="font-size: 1.4rem; margin-bottom: 1.25rem;">Key Performance Indicators</h2>

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
            const o = Math.min(99.4, b.otifTarget + chanAdj + (Math.sin(b.seed + FlareData.salt * 0.0001 + 1.3) * 1.6));
            const orders = Math.floor(b.ordersPerDay * winDays * mix * (0.96 + ((Math.sin(b.seed + FlareData.salt * 0.0001) + 1) / 2) * 0.08));
            const otd = Math.min(99.9, o + 1 + (Math.cos(b.seed + FlareData.salt * 0.0001) * 1.4));
            const ifd = Math.min(99.9, 96.5 + (Math.sin(b.seed + FlareData.salt * 0.0001 * 1.7) * 2));
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

    FlareUI.mountHeader(main);
    main.querySelectorAll("#winRail .chip").forEach((b) => b.addEventListener("click", () => FlareUrl.set({ window: b.getAttribute("data-window") === "12w" ? null : b.getAttribute("data-window") })));
    main.querySelectorAll("#chanRail .chip").forEach((b) => b.addEventListener("click", () => FlareUrl.set({ channel: b.getAttribute("data-channel") === "All" ? null : b.getAttribute("data-channel") })));
  }

  const off = FlareUrl.onChange((_p, route) => { if (route === "#/otif") render(); else off(); });
  render();
};
