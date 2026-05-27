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
  const VIEWS = [
    { key: "summary",   label: "Summary",     icon: "dashboard" },
    { key: "skus",      label: "By SKU",      icon: "inventory_2" },
    { key: "customers", label: "By customer", icon: "person" },
  ];

  function readState() {
    const p = window.FlareUrl.read();
    const period = PERIODS.find((x) => x.key === p.period) ? p.period : "today";
    const channel = CHANNELS.includes(p.channel) ? p.channel : "All";
    const view = VIEWS.find((x) => x.key === p.view) ? p.view : "summary";
    return { period, channel, view };
  }

  function render() {
    const { period, channel, view } = readState();
    const s = FlareData.sales(biz, period, channel);
    const attainment = s.actual / s.forecast;
    const attainPct = (attainment * 100).toFixed(1);
    const delta = s.actual - s.forecast;
    const deltaPct = ((delta / s.forecast) * 100);
    const periodLabel = PERIODS.find((p) => p.key === period).label;

    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Sales Tracker", "Today vs forecast · channel split · per-SKU and per-customer detail")}

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
              <span style="color: ${delta >= 0 ? "var(--positive)" : "var(--critical)"};">
                ${delta >= 0 ? "+" : ""}${fmtMoneyShort(delta)} (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)
              </span>
            </div>
            <div class="attain-bar"><span style="width: ${Math.min(100, attainment * 100).toFixed(1)}%; background: ${attainment >= 1 ? "var(--positive)" : attainment >= 0.95 ? "var(--accent)" : "var(--critical)"};"></span></div>
          </div>
          ${metric("Orders", s.orders.toLocaleString(), "", "neutral", false)}
          ${metric("AOV", "£" + (s.actual / Math.max(1, s.orders)).toFixed(2), "", "neutral", false)}
          ${metric("Attainment", attainPct + "%", "", attainment >= 1 ? "positive" : attainment >= 0.95 ? "neutral" : "negative", false)}
        </div>

        <div class="view-tabs" id="viewTabs">
          ${VIEWS.map((v) => `<button class="vt ${v.key === view ? "active" : ""}" data-view="${v.key}"><span class="ms ms-sm">${v.icon}</span>${v.label}</button>`).join("")}
        </div>

        <div id="viewBody">${
          view === "skus"      ? skusView(biz, period, channel)
        : view === "customers" ? customersView(biz, period, channel)
        :                        summaryView(biz, businessKey, s, periodLabel)
        }</div>
      </div>
    `;

    FlareUI.mountHeader(main);

    // Wire filter chips → URL
    main.querySelectorAll("#periodRail .chip").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ period: b.getAttribute("data-period") }));
    });
    main.querySelectorAll("#channelRail .chip").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ channel: b.getAttribute("data-channel") === "All" ? null : b.getAttribute("data-channel") }));
    });
    main.querySelectorAll("#viewTabs .vt").forEach((b) => {
      b.addEventListener("click", () => FlareUrl.set({ view: b.getAttribute("data-view") === "summary" ? null : b.getAttribute("data-view") }));
    });

    // Wire SKU/customer table actions
    main.querySelectorAll("[data-row-action]").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        FlareUI.flash(`Drill placeholder · ${b.getAttribute("data-row-action")}`);
      });
    });

    // Hourly chart only renders on Summary view
    if (view !== "summary") return;
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

function summaryView(biz, businessKey, s, periodLabel) {
  return `
    ${businessKey === "group" ? `
      <h2 class="sec-h">By brand</h2>
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
      <div class="card-soft">
        <h3 class="card-h">Revenue by hour · ${periodLabel === "Today" || periodLabel === "Yesterday" ? periodLabel : "Today shape"}</h3>
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
  `;
}

function skusView(biz, period, channel) {
  const rows = FlareData.skuPerf(biz, period, channel);
  return `
    <div class="card-soft">
      <h3 class="card-h">Top SKUs · ${rows.length} of ${biz.skuCount} active</h3>
      <div style="overflow-x: auto;">
        <table class="tbl tbl-flare">
          <thead>
            <tr>
              <th style="width: 28px;">#</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              ${biz.key === "group" ? "<th>Brand</th>" : ""}
              <th class="num">Orders</th>
              <th class="num">Revenue</th>
              <th class="num">AOV</th>
              <th class="num">Margin %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td style="color: var(--mute);">${i + 1}</td>
                <td class="mono"><button class="row-link" data-row-action="sku:${r.sku}">${r.sku}</button></td>
                <td>${r.name}</td>
                <td><span class="pill-soft">${r.category}</span></td>
                ${biz.key === "group" ? `<td>${r.brand}</td>` : ""}
                <td class="num">${r.orders.toLocaleString()}</td>
                <td class="num"><strong style="color: var(--instrument);">${fmtMoneyShort(r.revenue)}</strong></td>
                <td class="num">£${r.aov.toFixed(2)}</td>
                <td class="num">${r.marginPct.toFixed(1)}%</td>
                <td><span class="dot ${r.status}"></span>${statusLabel(r.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function customersView(biz, period, channel) {
  const rows = FlareData.customers(biz, period, channel);
  const concentration = rows.reduce((s, r) => s + r.revenue, 0);
  return `
    <div class="card-soft" style="margin-bottom: 0.75rem;">
      <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
        <div>
          <div class="card-mini-l">Top 40 customers (${period.toUpperCase()})</div>
          <div class="card-mini-v">${fmtMoneyShort(concentration)}</div>
        </div>
        <div>
          <div class="card-mini-l">Avg orders / cust</div>
          <div class="card-mini-v">${(rows.reduce((s, r) => s + r.orders, 0) / rows.length).toFixed(1)}</div>
        </div>
        <div>
          <div class="card-mini-l">Avg AOV</div>
          <div class="card-mini-v">£${(rows.reduce((s, r) => s + r.aov, 0) / rows.length).toFixed(2)}</div>
        </div>
        <div>
          <div class="card-mini-l">New this period</div>
          <div class="card-mini-v">${rows.filter((r) => r.status === "new").length}</div>
        </div>
      </div>
    </div>
    <div class="card-soft">
      <h3 class="card-h">Top customers</h3>
      <div style="overflow-x: auto;">
        <table class="tbl tbl-flare">
          <thead>
            <tr>
              <th style="width: 28px;">#</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Channel</th>
              <th class="num">Orders</th>
              <th class="num">Revenue</th>
              <th class="num">AOV</th>
              <th class="num">First seen</th>
              <th class="num">Last seen</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td style="color: var(--mute);">${i + 1}</td>
                <td class="mono"><button class="row-link" data-row-action="customer:${r.id}">${r.id}</button> <span style="color: var(--read);">${r.name}</span></td>
                <td style="color: var(--mute);">${r.email}</td>
                <td>${r.channel}</td>
                <td class="num">${r.orders}</td>
                <td class="num"><strong style="color: var(--instrument);">${fmtMoneyShort(r.revenue)}</strong></td>
                <td class="num">£${r.aov.toFixed(2)}</td>
                <td class="num" style="color: var(--mute);">${r.firstYearsAgo < 1 ? Math.round(r.firstYearsAgo * 12) + "mo" : r.firstYearsAgo.toFixed(1) + "y"} ago</td>
                <td class="num" style="color: var(--mute);">${r.lastDays}d ago</td>
                <td><span class="dot ${r.status}"></span>${statusLabel(r.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function statusLabel(s) {
  if (s === "positive" || s === "active") return s === "active" ? "Active" : "Healthy";
  if (s === "warning" || s === "returning") return s === "returning" ? "Returning" : "Watch";
  if (s === "critical") return "Risk";
  if (s === "new") return "New";
  return s;
}

function fmtMoneyShort(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return `£${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `£${(v / 1e3).toFixed(1)}k`;
  return `£${v.toFixed(0)}`;
}
