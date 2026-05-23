/* ============================================================
   FLARE — Manufacturing OEE (Overall Equipment Effectiveness)
   Cross-industry demo · heavy industrial / production line.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.oee = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 23.1)) * 43758.5; return x - Math.floor(x); };

  const availability = 78 + r(1) * 14;
  const performance  = 82 + r(2) * 12;
  const quality      = 96 + r(3) * 3.5;
  const oee = (availability * performance * quality) / 10000;
  const target = 85;
  const oeeCls = oee >= target ? "positive" : oee >= target - 5 ? "warning" : "critical";

  const lines = ["Line A · Press", "Line B · Mill", "Line C · Assembly", "Line D · Pack", "Line E · QC"];
  const downtimeCauses = [
    { cause: "Planned changeover",    mins: Math.floor(80 + r(4) * 120) },
    { cause: "Unplanned breakdown",   mins: Math.floor(40 + r(5) * 90) },
    { cause: "Material shortage",     mins: Math.floor(20 + r(6) * 60) },
    { cause: "Tooling adjustment",    mins: Math.floor(15 + r(7) * 40) },
    { cause: "Quality stop",          mins: Math.floor(10 + r(8) * 30) },
    { cause: "Shift handover",        mins: Math.floor(8 + r(9) * 20) },
  ];
  const maxMins = Math.max(...downtimeCauses.map((d) => d.mins));

  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title">Manufacturing OEE</h1>
      <div class="page-subtitle">Overall Equipment Effectiveness · Availability × Performance × Quality across the production floor.</div>
      <div class="data-as-of">Last shift · Plant ${["North", "South", "East", "West"][biz.seed % 4]} · live telemetry from PLC backbone</div>

      <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 1.5rem; align-items: stretch; margin-bottom: 2rem;">
        <div class="kpi-card ${oeeCls}" style="min-height: 220px;">
          <h3>OEE</h3>
          <h1>${oee.toFixed(1)}%</h1>
          <p>Target: ${target}%</p>
          <p class="detail">${oee >= target ? "On target" : `${(target - oee).toFixed(1)}pp below`}</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; align-content: start;">
          ${metric("Availability", `${availability.toFixed(1)}%`, "Runtime ÷ Planned time", "neutral", false)}
          ${metric("Performance", `${performance.toFixed(1)}%`, "Actual ÷ Ideal cycle", "neutral", false)}
          ${metric("Quality", `${quality.toFixed(1)}%`, "Good units ÷ Total", "neutral", false)}
          ${metric("Throughput / hr", Math.floor(420 + r(10) * 280).toLocaleString(), "units this shift", "neutral", false)}
          ${metric("Scrap rate", `${(0.8 + r(11) * 1.4).toFixed(2)}%`, "vs 1.5% target", "neutral", false)}
          ${metric("MTBF", `${Math.floor(45 + r(12) * 40)}h`, "Mean Time Between Failures", "neutral", false)}
        </div>
      </div>

      <hr class="divider" />

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Downtime by cause · last 24h</h2>
          <div class="card" style="padding: 1.3rem 1.5rem;">
            ${downtimeCauses.map((d) => `
              <div style="margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.3rem;">
                  <span style="color: var(--instrument);">${d.cause}</span>
                  <span style="color: var(--mute); font-variant-numeric: tabular-nums;">${d.mins} min</span>
                </div>
                <div style="height: 6px; background: var(--surface-alt); border-radius: 3px;">
                  <div style="height: 100%; width: ${(d.mins/maxMins)*100}%; background: var(--accent); border-radius: 3px;"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Line-level OEE</h2>
          <table class="tbl tbl-flare">
            <thead><tr><th>Line</th><th class="num">OEE</th><th class="num">Avail.</th><th class="num">Perf.</th><th>Status</th></tr></thead>
            <tbody>
              ${lines.map((l, i) => {
                const o = 70 + (Math.sin(biz.seed + FlareData.salt * 0.0001 + i * 7) + 1) * 12;
                const a = 75 + (Math.sin(biz.seed + i * 11) + 1) * 10;
                const p = 80 + (Math.sin(biz.seed + i * 13) + 1) * 7;
                const cls = o >= 85 ? "positive" : o >= 78 ? "warning" : "critical";
                return `<tr>
                  <td>${l}</td>
                  <td class="num">${o.toFixed(1)}%</td>
                  <td class="num">${a.toFixed(1)}%</td>
                  <td class="num">${p.toFixed(1)}%</td>
                  <td><span class="pill ${cls}">${cls === "positive" ? "On target" : cls === "warning" ? "Watch" : "Below"}</span></td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};
