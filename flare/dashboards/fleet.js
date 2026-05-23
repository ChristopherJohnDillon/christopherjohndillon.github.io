/* ============================================================
   FLARE — Fleet Operations
   Cross-industry demo · trucking / logistics fleet.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.fleet = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 37.1)) * 43758.5; return x - Math.floor(x); };

  const totalVehicles = 248;
  const active = Math.floor(totalVehicles * (0.78 + r(1) * 0.15));
  const utilisation = (active / totalVehicles) * 100;
  const fuelPerMile = 0.42 + r(2) * 0.08;
  const onTimePickup = 92 + r(3) * 5;
  const driverHourBreach = Math.floor(r(4) * 5);

  // 12 vehicle rows
  const fleet = [];
  for (let i = 0; i < 12; i++) {
    const id = `HV-${String(1000 + i * 7 + (biz.seed % 50)).padStart(4, "0")}`;
    const milesToday = Math.floor(80 + r(10 + i) * 320);
    const fuel = (milesToday * (0.4 + r(20 + i) * 0.12)).toFixed(2);
    const status = i % 5 === 0 ? "Maintenance" : i % 7 === 0 ? "Idle" : "Active";
    const driver = ["J. Patel", "S. Chen", "M. O'Brien", "K. Andersson", "R. Doyle", "L. Khoury", "T. Foster", "B. Akande", "G. Cassidy", "N. Petrov", "E. Mitchell", "C. Ng"][i];
    const route = ["Belfast → Larne", "Dublin → Cork", "Manchester → Leeds", "Glasgow → Inverness", "Cardiff → Bristol", "London → Norwich"][i % 6];
    fleet.push({ id, driver, route, milesToday, fuel, status });
  }

  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title">Fleet Operations</h1>
      <div class="page-subtitle">Live vehicle telemetry, route efficiency, and driver-hour compliance.</div>
      <div class="data-as-of">Telemetry · 30s refresh · TomTom WEBFLEET integration</div>

      <div class="metric-row">
        ${metric("Vehicles active", `${active} / ${totalVehicles}`, `${utilisation.toFixed(0)}% utilisation`, utilisation >= 80 ? "positive" : "neutral")}
        ${metric("Fuel · £ / mile", `£${fuelPerMile.toFixed(3)}`, "vs £0.45 baseline", fuelPerMile <= 0.45 ? "positive" : "negative")}
        ${metric("On-time pickup", `${onTimePickup.toFixed(1)}%`, "vs 95% SLA", onTimePickup >= 95 ? "positive" : "negative")}
        ${metric("Driver-hr breaches", `${driverHourBreach}`, driverHourBreach === 0 ? "all compliant" : "review required", driverHourBreach === 0 ? "positive" : "negative")}
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Active fleet</h2>
      <table class="tbl tbl-flare">
        <thead><tr><th>Vehicle</th><th>Driver</th><th>Route</th><th class="num">Miles today</th><th class="num">Fuel £</th><th>Status</th></tr></thead>
        <tbody>
          ${fleet.map((f) => `<tr>
            <td class="mono">${f.id}</td>
            <td>${f.driver}</td>
            <td style="color: var(--read);">${f.route}</td>
            <td class="num">${f.milesToday}</td>
            <td class="num">£${f.fuel}</td>
            <td><span class="pill ${f.status === "Active" ? "positive" : f.status === "Idle" ? "warning" : "critical"}">${f.status}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>

      <hr class="divider" />

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Route efficiency</h2>
          <div class="card" style="padding: 1.5rem;">
            ${["Belfast → Larne", "Dublin → Cork", "Manchester → Leeds", "Glasgow → Inverness", "Cardiff → Bristol"].map((route, i) => {
              const eff = 78 + (Math.sin(biz.seed + i * 5 + FlareData.salt * 0.0001) + 1) * 11;
              return `<div style="margin-bottom: 0.9rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.3rem;">
                  <span style="color: var(--instrument);">${route}</span>
                  <span style="color: var(--accent); font-variant-numeric: tabular-nums; font-weight: 600;">${eff.toFixed(0)}%</span>
                </div>
                <div style="height: 6px; background: var(--surface-alt); border-radius: 3px;">
                  <div style="height: 100%; width: ${eff}%; background: linear-gradient(to right, var(--accent), var(--accent-hot)); border-radius: 3px;"></div>
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>
        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Maintenance pipeline</h2>
          <table class="tbl tbl-flare">
            <thead><tr><th>Vehicle</th><th>Service</th><th class="num">Due in</th></tr></thead>
            <tbody>
              ${[
                ["HV-1034", "Tyre rotation", "320 mi"],
                ["HV-1217", "Engine service", "12 days"],
                ["HV-1428", "MOT", "3 days"],
                ["HV-1602", "Brake check", "180 mi"],
                ["HV-1741", "DPF clean", "8 days"],
              ].map(([v, s, d]) => `<tr><td class="mono">${v}</td><td>${s}</td><td class="num">${d}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};
