/* ============================================================
   FLARE — Sales Tracker
   Today vs forecast, WTD/MTD, channel split, by-brand strip.
   All filters reflected in URL: ?period=today|yesterday|wtd|mtd & ?channel=...
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.sales = function (main, businessKey) {
  const biz = FlareData.business(businessKey);

  const PERIODS = [
    { key: "today",     label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "wtd",       label: "Week-to-date" },
    { key: "mtd",       label: "Month-to-date" },
  ];
  const CHANNELS = ["All", ...FlareData.channels];

  function readState() {
    const p = window.FlareUrl.read();
    const period = PERIODS.find((x) => x.key === p.period) ? p.period : "today";
    const channel = CHANNELS.includes(p.channel) ? p.channel : "All";
    return { period, channel };
  }

  function render() {
    const { period, channel } = readState();
    const s = FlareData.sales(biz, period, channel);
    const attainment = s.actual / s.forecast;
    const attainPct = (attainment * 100).toFixed(1);
    const delta = s.actual - s.forecast;
    const deltaPct = ((delta / s.forecast) * 100);
    const periodLabel = PERIODS.find((p) => p.key === period).label;

    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Sales Tracker", "Today vs forecast · channel split · by-brand attainment")}

        <div class="chip-rail" id="periodRail">
          ${PERIODS.map((p) => `<button class="chip ${p.key === period ? "active" : ""}" data-period="${p.key}">${p.label}</button>`).join("")}
        </div>
        <div class="chip-rail" id="channelRail">
          ${CHANNELS.map((c) => `<button class="chip ${c === channel ? "active" : ""}" data-channel="${c}">${c}</button>`).join("")}
        </div>

        <div class="data-as-of">${new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${periodLabel} · ${channel === "All" ? "All channels" : channel}</div>

        <div class="sales-summary">
          <div class="big-actual">
            <div class="label">${periodLabel} actual</div>
            <div class="value">${fmtMoneyShort(s.actual)}</div>
            <div class="sub">
              Forecast ${fmtMoneyShort(s.forecast)} ·
              <span class="${delta >= 0 ? "pos" : "neg"}" style="color: ${delta >= 0 ? "var(--positive)" : "var(--critical)"};">
                ${delta >= 0 ? "+" : ""}${fmtMoneyShort(delta)} (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)
              </span>
            </div>
            <div class="attain-bar"><span style="width: ${Math.min(100, attainment * 100).toFixed(1)}%; background: ${attainment >= 1 ? "var(--positive)" : attainment >= 0.95 ? "var(--accent)" : "var(--critical)"};"></span></div>
          </div>
          ${metric("Orders", s.orders.toLocaleString(), "", "neutral", false)}
          ${metric("AOV", "£" + (s.actual / Math.max(1, s.orders)).toFixed(2), "", "neutral", false)}
          ${metric("Attainment", attainPct + "%", "", attainment >= 1 ? "positive" : attainment >= 0.95 ? "neutral" : "negative", false)}
        </div>

        ${businessKey === "group" ? `
          <h2 style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--white); margin: 0.5rem 0 0.85rem;">By brand</h2>
          <div class="brand-strip">
            ${s.perBrand.map((b) => {
              const atn = b.actual / b.forecast;
              const cls = atn >= 1 ? "pos" : "neg";
              const barCol = atn >= 1 ? "var(--positive)" : atn >= 0.95 ? "var(--accent)" : "var(--critical)";
              return `
                <div class="bs-cell">
                  <div class="bs-name"><span class="swatch" style="background: ${b.color};"></span>${b.name}</div>
                  <div class="bs-rev">${fmtMoneyShort(b.actual)}</div>
                  <div class="bs-attain ${cls}">${atn >= 1 ? "+" : ""}${((atn - 1) * 100).toFixed(1)}% vs forecast</div>
                  <div class="bs-bar"><span style="width: ${Math.min(100, atn * 100)}%; background: ${barCol};"></span></div>
                </div>
              `;
            }).join("")}
          </div>
        ` : ""}

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
          <div class="card" style="background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; padding: 1.1rem 1.25rem;">
            <h3 style="font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mute); font-weight: 700; margin-bottom: 0.5rem;">Revenue by hour · ${periodLabel === "Today" || periodLabel === "Yesterday" ? periodLabel : "Today shape"}</h3>
            <div style="height: 200px;"><canvas id="salesHourly"></canvas></div>
          </div>
          <div class="chan-list">
            <h3>By channel</h3>
            ${(() => {
              const max = Math.max(...s.channels.map((c) => c.revenue), 1);
              return s.channels.map((c) => `
                <div class="row">
                  <div class="name">${c.channel}</div>
                  <div class="bar"><span style="width: ${(c.revenue / max * 100).toFixed(1)}%;"></span></div>
                  <div class="val">${fmtMoneyShort(c.revenue)}</div>
                  <div class="orders">${c.orders.toLocaleString()} ord</div>
                </div>
              `).join("");
            })()}
          </div>
        </div>
      </div>
    `;

    FlareUI.mountHeader(main);

    // Wire filter chips → URL
    main.querySelectorAll("#periodRail .chip").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ period: b.getAttribute("data-period") }));
    });
    main.querySelectorAll("#channelRail .chip").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ channel: b.getAttribute("data-channel") }));
    });

    // Hourly chart
    const canvas = document.getElementById("salesHourly");
    if (canvas && window.Chart) {
      FlareCharts.destroy("salesHourly");
      const points = s.hourly;
      const chart = new Chart(canvas, {
        type: "bar",
        data: {
          labels: points.map((p) => p.hour),
          datasets: [{
            data: points.map((p) => p.revenue / 1000),
            backgroundColor: FLARE_T.surfaceAlt,
            borderColor: FLARE_T.accent,
            borderWidth: 0,
            borderRadius: 2,
            barPercentage: 0.85,
            categoryPercentage: 0.95,
          }],
        },
        options: {
          animation: { duration: 220 },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => "£" + ctx.parsed.y.toFixed(1) + "k" } } },
          scales: {
            x: { grid: { color: FLARE_T.rule }, ticks: { color: FLARE_T.mute, maxRotation: 0, autoSkipPadding: 16 } },
            y: { grid: { color: FLARE_T.rule }, ticks: { color: FLARE_T.mute, callback: (v) => "£" + v + "k" } },
          },
          maintainAspectRatio: false,
        },
      });
      FlareCharts.registry.set("salesHourly", chart);
    }
  }

  /* Re-render on URL filter changes for THIS route only */
  const off = FlareUrl.onChange((_params, route) => {
    if (route === "#/sales") render();
    else off();
  });

  render();
};

function fmtMoneyShort(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return `£${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `£${(v / 1e3).toFixed(1)}k`;
  return `£${v.toFixed(0)}`;
}
