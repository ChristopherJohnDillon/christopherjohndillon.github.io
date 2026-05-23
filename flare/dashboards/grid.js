/* ============================================================
   FLARE — Energy Grid Load
   Cross-industry demo · utility / power network ops.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.grid = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 29.7)) * 43758.5; return x - Math.floor(x); };

  const peakLoad = 2400 + r(1) * 800;
  const currentLoad = 1700 + r(2) * 600;
  const capacityMW = 3200;
  const capFactor = (currentLoad / capacityMW) * 100;
  const renewableMix = 38 + r(3) * 18;
  const outageMins = Math.floor(r(4) * 240);

  // 24-hour load curve as SVG path
  const W = 720, H = 200, pad = 10;
  const points = [];
  for (let h = 0; h < 24; h++) {
    const t = h / 24;
    const base = 0.45 + 0.35 * Math.sin((t - 0.25) * Math.PI * 2);
    const noise = (Math.sin(biz.seed + h * 1.7 + FlareData.salt * 0.0001) * 0.5 + 0.5) * 0.1;
    const v = base + noise;
    const x = pad + (h / 23) * (W - pad * 2);
    const y = H - pad - v * (H - pad * 2);
    points.push([x, y, v]);
  }
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const fillPath = path + ` L ${points[points.length-1][0]} ${H - pad} L ${pad} ${H - pad} Z`;

  // Regional heatmap (simulated grid of 8x4 substations)
  const regions = [];
  for (let i = 0; i < 32; i++) {
    const load = 0.3 + ((Math.sin(biz.seed + i * 3.7 + FlareData.salt * 0.0001) + 1) / 2) * 0.65;
    regions.push(load);
  }

  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title">Grid Load &amp; Capacity</h1>
      <div class="page-subtitle">Regional substation telemetry, demand forecast, and renewable mix.</div>
      <div class="data-as-of">Telemetry refresh · 5s · ISO-grid integration</div>

      <div class="metric-row">
        ${metric("Current load", `${currentLoad.toFixed(0)} MW`, `${capFactor.toFixed(0)}% of capacity`, capFactor < 80 ? "positive" : capFactor < 92 ? "neutral" : "negative")}
        ${metric("Peak today", `${peakLoad.toFixed(0)} MW`, `at ${String(17 + (biz.seed % 3)).padStart(2,"0")}:${String((biz.seed * 7) % 60).padStart(2,"0")}`, "neutral", false)}
        ${metric("Renewable mix", `${renewableMix.toFixed(1)}%`, "wind 22% · solar 11% · hydro 5%", "positive")}
        ${metric("Outage minutes (SAIDI)", `${outageMins}`, outageMins < 60 ? "within SLA" : "exceeds 1h SLA", outageMins < 60 ? "positive" : "negative")}
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Load curve · today</h2>
      <div class="card" style="padding: 1.5rem;">
        <svg viewBox="0 0 ${W + 20} ${H + 30}" style="width: 100%; height: auto; display: block;">
          ${[0, 0.25, 0.5, 0.75, 1].map((g) => `<line x1="${pad}" y1="${pad + g * (H - pad * 2)}" x2="${W - pad}" y2="${pad + g * (H - pad * 2)}" stroke="rgba(232,236,242,0.06)" stroke-width="1" />`).join("")}
          <path d="${fillPath}" fill="rgba(255,79,0,0.18)" />
          <path d="${path}" fill="none" stroke="#FF4F00" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          ${[0, 6, 12, 18, 23].map((h) => `<text x="${pad + (h / 23) * (W - pad * 2)}" y="${H + 14}" text-anchor="middle" fill="#8792A6" font-size="11" font-family="Inter, sans-serif">${String(h).padStart(2, "0")}:00</text>`).join("")}
          <text x="${pad}" y="${pad + 5}" fill="#8792A6" font-size="10" font-family="Inter, sans-serif">3200 MW</text>
          <text x="${pad}" y="${H - pad}" fill="#8792A6" font-size="10" font-family="Inter, sans-serif">0</text>
        </svg>
      </div>

      <hr class="divider" />

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Regional load · substations</h2>
          <div class="card" style="padding: 1.5rem;">
            <svg viewBox="0 0 400 200" style="width: 100%; height: auto; display: block;">
              ${regions.map((load, i) => {
                const col = i % 8, row = Math.floor(i / 8);
                const x = 12 + col * 47;
                const y = 12 + row * 47;
                const fill = `rgba(255,79,0,${(0.1 + load * 0.85).toFixed(2)})`;
                return `<rect x="${x}" y="${y}" width="40" height="40" rx="4" fill="${fill}" stroke="rgba(255,255,255,0.04)" />`;
              }).join("")}
            </svg>
            <div style="display: flex; justify-content: space-between; margin-top: 0.8rem; font-size: 0.78rem; color: var(--mute);">
              <span>Low load</span>
              <span style="display: inline-block; flex: 1; height: 6px; margin: 8px 0.8rem 0; background: linear-gradient(to right, rgba(255,79,0,0.1), rgba(255,79,0,1)); border-radius: 3px;"></span>
              <span>Peak</span>
            </div>
          </div>
        </div>
        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Generation mix</h2>
          <table class="tbl tbl-flare">
            <thead><tr><th>Source</th><th class="num">MW</th><th class="num">Share</th></tr></thead>
            <tbody>
              ${[
                ["Natural gas", 0.32], ["Wind", 0.22], ["Nuclear", 0.15],
                ["Solar", 0.11], ["Hydro", 0.05], ["Coal", 0.08], ["Imports", 0.07]
              ].map(([s, p]) => `<tr>
                <td>${s}</td>
                <td class="num">${(currentLoad * p).toFixed(0)} MW</td>
                <td class="num">${(p * 100).toFixed(1)}%</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};
