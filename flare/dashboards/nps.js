/* ============================================================
   FLARE — Delighted NPS Tracker
   Matches real NPS_Tracker.py pattern:
   - Title + body description (white, bold)
   - Region + Vertical pill radio rows
   - "Choose a view" pill button row
   - NPS Scorecard with big green cards
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.nps = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const r = (i) => { const x = Math.sin((biz.seed + FlareData.salt * 0.0001 + i * 13.2)) * 43758.5; return x - Math.floor(x); };

  let region = "All";
  let vertical = "All";
  let view = "Overview";

  function render() {
    const npsMTD = 7.5 + r(1) * 1.5;
    const npsYTD = npsMTD - 0.15 + r(2) * 0.3;
    const nResponsesMTD = Math.floor(40 + r(3) * 80);
    const nResponsesYTD = Math.floor(700 + r(4) * 400);
    const target = 7.0;

    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Delighted NPS Tracker", "Net Promoter Score from Delighted across all brands. Min 30 responses for significance.")}
        <div class="data-as-of"><strong style="color: var(--white);">Data last refreshed:</strong> ${Math.floor(r(7) * 600 + 200)} minutes ago (${new Date().toLocaleDateString("en-CA")} ${new Date().toLocaleTimeString("en-GB").slice(0, 5)})</div>

        <div style="display: grid; grid-template-columns: 1fr 1.4fr; gap: 2rem; margin-bottom: 1.5rem;">
          <div>
            <label class="field-label" style="font-size: 0.9rem;">Region</label>
            <div class="pill-radio" id="regionRadio" style="margin-top: 0.45rem;">
              ${["All", "US", "EU"].map((d) => `<button class="pill-opt ${d === region ? "active" : ""}" data-r="${d}">${d}</button>`).join("")}
            </div>
          </div>
          <div>
            <label class="field-label" style="font-size: 0.9rem;">Vertical</label>
            <div class="pill-radio" id="verticalRadio" style="margin-top: 0.45rem;">
              ${["All", "Outdoor", "Home", "Stationery", "Coffee"].map((d) => `<button class="pill-opt ${d === vertical ? "active" : ""}" data-v="${d}">${d}</button>`).join("")}
            </div>
          </div>
        </div>

        <div class="expander" style="margin-bottom: 1.25rem;">
          <div class="expander-head"><span class="ms ms-sm">chevron_right</span> Filters</div>
        </div>

        <label class="field-label" style="font-size: 0.9rem;">Choose a view</label>
        <div class="pill-radio" id="viewRadio" style="margin: 0.45rem 0 2rem;">
          ${["Overview", "Trends", "By Company", "Comments", "Sentiment"].map((v) => `<button class="pill-opt ${v === view ? "active" : ""}" data-v="${v}">${v}</button>`).join("")}
        </div>

        <h2 style="font-size: 1.6rem; margin-bottom: 1.25rem;">NPS Scorecard</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
          <div class="kpi-card positive" style="min-height: 220px;">
            <h3>NPS MTD</h3>
            <h1>${npsMTD.toFixed(2)}</h1>
            <p>Target: ${target.toFixed(1)} | n=${nResponsesMTD}</p>
            <p class="detail">+${(npsMTD - target).toFixed(2)} vs target</p>
          </div>
          <div class="kpi-card positive" style="min-height: 220px;">
            <h3>NPS YTD</h3>
            <h1>${npsYTD.toFixed(2)}</h1>
            <p>Target: ${target.toFixed(1)} | n=${nResponsesYTD}</p>
            <p class="detail">+${(npsYTD - target).toFixed(2)} vs target</p>
          </div>
        </div>

        <h2 style="font-size: 1.3rem; margin-bottom: 1rem;">By company</h2>
        <table class="tbl tbl-flare">
          <thead><tr>
            <th>Company</th>
            <th class="num">NPS</th>
            <th class="num">Responses</th>
            <th class="num">Promoters</th>
            <th class="num">Passives</th>
            <th class="num">Detractors</th>
            <th class="num">vs Target</th>
          </tr></thead>
          <tbody>
            ${FlareData.businesses.filter((b) => b.key !== "group").map((b) => {
              const nps = 6.8 + Math.abs(Math.sin(b.seed + FlareData.salt * 0.0001 * 1.4)) * 2.5;
              const n = Math.floor(80 + Math.abs(Math.sin(b.seed + FlareData.salt * 0.0001)) * 180);
              const promPct = 0.55 + Math.sin(b.seed + FlareData.salt * 0.0001) * 0.15;
              const detPct  = Math.max(0.05, 0.15 - Math.sin(b.seed + FlareData.salt * 0.0001) * 0.08);
              const passPct = 1 - promPct - detPct;
              const vt = nps - target;
              const cls = vt >= 0 ? "pos" : "neg";
              return `<tr>
                <td>${b.name}</td>
                <td class="num">${nps.toFixed(2)}</td>
                <td class="num">${n}</td>
                <td class="num">${Math.round(promPct * n)}</td>
                <td class="num">${Math.round(passPct * n)}</td>
                <td class="num">${Math.round(detPct * n)}</td>
                <td class="num ${cls}">${vt >= 0 ? "+" : ""}${vt.toFixed(2)}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    FlareUI.mountHeader(main);
    document.querySelectorAll("#regionRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { region = b.getAttribute("data-r"); render(); }));
    document.querySelectorAll("#verticalRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { vertical = b.getAttribute("data-v"); render(); }));
    document.querySelectorAll("#viewRadio .pill-opt").forEach((b) => b.addEventListener("click", () => { view = b.getAttribute("data-v"); render(); }));
  }
  render();
};
