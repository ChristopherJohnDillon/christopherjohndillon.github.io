/* ============================================================
   FLARE — Document Intelligence (AI/LLM)
   Local-LLM classifier throughput, accuracy, drift, cost.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.docintel = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 19.3)) * 43758.5; return x - Math.floor(x); };

  const docsToday = Math.floor(4200 + r(1) * 8000);
  const accuracy = 88 + r(2) * 9;
  const cost = (docsToday * (0.0008 + r(3) * 0.0006));
  const queueDepth = Math.floor(r(4) * 800);
  const tags = [
    { name: "Support · billing",        n: Math.floor(800 + r(5) * 1200), pct: 0 },
    { name: "Support · technical",      n: Math.floor(600 + r(6) * 1000), pct: 0 },
    { name: "Support · returns",        n: Math.floor(400 + r(7) * 700),  pct: 0 },
    { name: "Marketing · feedback",     n: Math.floor(300 + r(8) * 500),  pct: 0 },
    { name: "Legal · contract clause",  n: Math.floor(150 + r(9) * 300),  pct: 0 },
    { name: "Other / ambiguous",        n: Math.floor(80 + r(10) * 200),  pct: 0 },
  ];
  const totalTagged = tags.reduce((s, t) => s + t.n, 0);
  tags.forEach((t) => t.pct = (t.n / totalTagged) * 100);

  main.innerHTML = `
    <div class="main-inner">
      <h1 class="page-title">Document Intelligence</h1>
      <div class="page-subtitle">Local-LLM classification, tagging, and routing pipeline.</div>
      <div class="data-as-of">Model: <strong style="color: var(--white);">flare-llm-13b</strong> · self-hosted · zero per-doc cloud cost</div>

      <div class="metric-row">
        ${metric("Docs processed today", docsToday.toLocaleString(), "↑ +18% vs 7d avg", "positive")}
        ${metric("Classification accuracy", `${accuracy.toFixed(1)}%`, "vs 87% baseline", "positive")}
        ${metric("Queue depth", queueDepth.toString(), queueDepth > 400 ? "↑ rising" : "stable", queueDepth > 400 ? "negative" : "neutral")}
        ${metric("Cost · today", `£${cost.toFixed(2)}`, "self-hosted · electricity only", "positive")}
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Tag distribution · last 24h</h2>
      <div class="card" style="padding: 1.5rem;">
        ${tags.map((t) => `
          <div style="margin-bottom: 0.9rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; font-size: 0.92rem;">
              <span style="color: var(--instrument); font-weight: 500;">${t.name}</span>
              <span style="color: var(--mute); font-variant-numeric: tabular-nums;">${t.n.toLocaleString()} <span style="color: var(--accent); margin-left: 0.5rem;">${t.pct.toFixed(1)}%</span></span>
            </div>
            <div style="height: 8px; background: var(--surface-alt); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${t.pct}%; background: linear-gradient(to right, var(--accent), var(--accent-hot)); border-radius: 4px;"></div>
            </div>
          </div>
        `).join("")}
      </div>

      <hr class="divider" />

      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Model health</h2>
      <table class="tbl tbl-flare">
        <thead><tr><th>Check</th><th class="num">Value</th><th class="num">Threshold</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            { check: "Drift score (PSI)", v: (0.04 + r(11) * 0.06).toFixed(3), t: "0.20", ok: true },
            { check: "P95 latency",       v: `${Math.floor(180 + r(12) * 120)}ms`, t: "500ms", ok: true },
            { check: "False positive rate", v: `${(2 + r(13) * 3).toFixed(2)}%`, t: "5.0%", ok: true },
            { check: "Coverage (auto-tag rate)", v: `${(82 + r(14) * 12).toFixed(1)}%`, t: "75%", ok: true },
            { check: "Human escalation rate", v: `${(3 + r(15) * 4).toFixed(2)}%`, t: "10%", ok: true },
          ].map((row) => `<tr>
            <td>${row.check}</td>
            <td class="num" style="color: var(--instrument); font-weight: 500;">${row.v}</td>
            <td class="num" style="color: var(--mute);">${row.t}</td>
            <td><span class="pill ${row.ok ? "positive" : "warning"}">${row.ok ? "OK" : "Watch"}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
};
