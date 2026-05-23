/* ============================================================
   FLARE — Clinical Trial Monitor
   Cross-industry demo · pharma / biotech.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.trial = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 31.4)) * 43758.5; return x - Math.floor(x); };

  const target = 480;
  const enrolled = Math.floor(target * (0.74 + r(1) * 0.2));
  const screened = Math.floor(enrolled * 1.55);
  const screenFails = screened - enrolled;
  const dropouts = Math.floor(enrolled * (0.06 + r(2) * 0.04));
  const ae = Math.floor(8 + r(3) * 22);
  const sae = Math.floor(r(4) * 5);
  const deviations = Math.floor(r(5) * 12);
  const pct = (enrolled / target) * 100;

  const funnelStages = [
    { name: "Pre-screened",   n: Math.floor(screened * 1.4), pct: 100 },
    { name: "Screened",       n: screened,                   pct: 0 },
    { name: "Eligible",       n: Math.floor(screened * 0.78), pct: 0 },
    { name: "Enrolled",       n: enrolled,                   pct: 0 },
    { name: "Active on trial", n: enrolled - dropouts,       pct: 0 },
  ];
  const maxN = funnelStages[0].n;
  funnelStages.forEach((s) => (s.pct = (s.n / maxN) * 100));

  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title">Clinical Trial Monitor</h1>
      <div class="page-subtitle">Protocol HELIO-${String(biz.seed % 1000).padStart(3, "0")} · Phase II · Multi-site enrolment &amp; safety tracking.</div>
      <div class="data-as-of">Sponsor: redacted · Sites active: 14 · Database lock: pending end of Q3</div>

      <div class="metric-row">
        ${metric("Enrolment", `${enrolled} / ${target}`, `${pct.toFixed(1)}% of target`, pct >= 75 ? "positive" : pct >= 60 ? "neutral" : "negative")}
        ${metric("Screen fail rate", `${((screenFails/screened)*100).toFixed(1)}%`, `${screenFails} screen failures`, "neutral", false)}
        ${metric("Adverse events", `${ae}`, `${sae} serious (SAE)`, sae <= 2 ? "neutral" : "negative")}
        ${metric("Protocol deviations", `${deviations}`, deviations < 8 ? "within tolerance" : "review at next DMC", deviations < 8 ? "positive" : "negative")}
      </div>

      <hr class="divider" />

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Enrolment funnel</h2>
          <div class="card" style="padding: 1.5rem;">
            ${funnelStages.map((s, i) => `
              <div style="margin-bottom: 0.9rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; font-size: 0.92rem;">
                  <span style="color: var(--instrument); font-weight: 500;">${s.name}</span>
                  <span style="color: var(--mute); font-variant-numeric: tabular-nums;">${s.n.toLocaleString()}</span>
                </div>
                <div style="height: 22px; background: var(--surface-alt); border-radius: 4px; overflow: hidden;">
                  <div style="height: 100%; width: ${s.pct}%; background: linear-gradient(to right, var(--accent), var(--accent-hot)); border-radius: 4px;"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div>
          <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Site performance</h2>
          <table class="tbl tbl-flare">
            <thead><tr><th>Site</th><th class="num">Enrolled</th><th class="num">Target</th><th class="num">Rate</th><th>Status</th></tr></thead>
            <tbody>
              ${["Manchester", "Edinburgh", "Cardiff", "Belfast", "Dublin", "Brussels"].map((city, i) => {
                const tgt = 60 + Math.floor((Math.sin(biz.seed + i * 3) + 1) * 30);
                const enr = Math.floor(tgt * (0.55 + (Math.sin(biz.seed + i * 5 + FlareData.salt * 0.0001) + 1) / 2 * 0.45));
                const rate = enr / tgt;
                const cls = rate >= 0.85 ? "positive" : rate >= 0.65 ? "warning" : "critical";
                return `<tr>
                  <td>${city}</td>
                  <td class="num">${enr}</td>
                  <td class="num">${tgt}</td>
                  <td class="num">${(rate * 100).toFixed(0)}%</td>
                  <td><span class="pill ${cls}">${cls === "positive" ? "On pace" : cls === "warning" ? "Behind" : "At risk"}</span></td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">Safety review · last 28 days</h2>
      <table class="tbl tbl-flare">
        <thead><tr><th>Event class</th><th class="num">Count</th><th class="num">Rate / 100 pt-months</th><th>Trend</th></tr></thead>
        <tbody>
          ${[
            ["Mild AE",              ae,                       (ae / enrolled * 100).toFixed(2)],
            ["Moderate AE",          Math.floor(ae * 0.35),    (ae * 0.35 / enrolled * 100).toFixed(2)],
            ["Severe AE",            Math.floor(ae * 0.12),    (ae * 0.12 / enrolled * 100).toFixed(2)],
            ["Serious AE (SAE)",     sae,                      (sae / enrolled * 100).toFixed(3)],
            ["Treatment-related SAE", Math.floor(sae * 0.4),   (sae * 0.4 / enrolled * 100).toFixed(3)],
          ].map(([k, n, rate]) => `<tr>
            <td>${k}</td>
            <td class="num">${n}</td>
            <td class="num">${rate}</td>
            <td><span class="pill ${parseFloat(rate) < 2 ? "positive" : "warning"}">${parseFloat(rate) < 2 ? "Within expected" : "Monitor"}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
};
