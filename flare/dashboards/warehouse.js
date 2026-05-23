/* ============================================================
   FLARE — Warehouse Heatmap
   Filter row + 4 metrics + heatmap with click-to-inspect.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.warehouse = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const wh = FlareData.warehouse(biz);
  const aisles = [...new Set(wh.bins.map((b) => b.aisle))];

  let filterAisle = "";
  let minUtil = 0;
  let selectedBin = null;

  function visibleBins() {
    return wh.bins.filter((b) => (!filterAisle || b.aisle === filterAisle) && b.utilisation >= minUtil);
  }

  function render() {
    const visible = visibleBins();
    const overall = visible.length ? visible.reduce((s, b) => s + b.utilisation, 0) / visible.length : 0;
    const hotCount  = visible.filter((b) => b.utilisation >= 0.8).length;
    const coldCount = visible.filter((b) => b.utilisation < 0.25).length;

    main.innerHTML = `
      <h1 class="page-title">Warehouse Heatmap</h1>
      <div class="page-subtitle">Bin-level utilisation across ${aisles.length} aisles — ${biz.name}.</div>

      <div class="filter-bar">
        <select id="whAisle">
          <option value="">All aisles</option>
          ${aisles.map((a) => `<option value="${a}" ${a === filterAisle ? "selected" : ""}>Aisle ${a}</option>`).join("")}
        </select>
        <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--read); font-size: 0.85rem;">
          <span>Min utilisation</span>
          <input type="range" id="whSlider" min="0" max="100" value="${Math.round(minUtil*100)}" />
          <span id="whSliderVal" style="font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums;">${Math.round(minUtil*100)}%</span>
        </label>
      </div>

      <div class="metric-row">
        ${mw("Bins in view", `${visible.length}`,                `of ${wh.bins.length} total`, "neutral")}
        ${mw("Avg utilisation", `${(overall*100).toFixed(0)}%`, "weighted across visible", overall >= 0.5 ? "positive" : "negative")}
        ${mw("Hot zones (≥80%)", `${hotCount}`,                 "high-velocity bins", "positive")}
        ${mw("Cold zones (<25%)", `${coldCount}`,               "candidates for consolidation", "neutral")}
      </div>

      <hr class="divider" />

      <div class="warehouse-wrap">
        <div class="warehouse-grid">
          ${gridSvg(visible, wh)}
          <div class="legend">
            <span>0%</span>
            <span class="legend-bar"></span>
            <span>100% utilisation</span>
          </div>
        </div>

        <div class="dd-panel" id="binPanel">${binPanelHtml(selectedBin, biz)}</div>
      </div>
    `;

    wireGrid();
    document.getElementById("whAisle").addEventListener("change", (e) => { filterAisle = e.target.value; render(); });
    const slider = document.getElementById("whSlider");
    slider.addEventListener("input", (e) => {
      minUtil = parseInt(e.target.value, 10) / 100;
      document.getElementById("whSliderVal").textContent = e.target.value + "%";
      const card = document.querySelector(".warehouse-grid");
      card.querySelector("svg").remove();
      card.insertAdjacentHTML("afterbegin", gridSvg(visibleBins(), wh));
      wireGrid();
    });
  }

  function gridSvg(visible, wh) {
    const cellW = 38, cellH = 30, gap = 3, padX = 20, padY = 14;
    const w = padX * 2 + wh.cols * (cellW + gap) - gap;
    const h = padY * 2 + wh.rows * (cellH + gap) - gap + 18;
    const visKeys = new Set(visible.map((b) => `${b.row}-${b.col}`));
    let cells = "";
    for (const b of wh.bins) {
      const x = padX + b.col * (cellW + gap);
      const y = padY + 16 + b.row * (cellH + gap);
      const inView = visKeys.has(`${b.row}-${b.col}`);
      const u = b.utilisation;
      const a = inView ? 0.08 + u * 0.92 : 0.04;
      const fill = `rgba(255,79,0,${a.toFixed(2)})`;
      const stroke = inView ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
      const sel = selectedBin && selectedBin.row === b.row && selectedBin.col === b.col ? `stroke="#FF7A2E" stroke-width="2"` : `stroke="${stroke}"`;
      cells += `<rect data-row="${b.row}" data-col="${b.col}" x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="3" fill="${fill}" ${sel} />`;
    }
    let labels = "";
    for (let c = 0; c < wh.cols; c++) {
      const aisle = String.fromCharCode(65 + Math.floor(c / 4));
      const slot = (c % 4) + 1;
      if (slot === 2) {
        const x = padX + (c - 1) * (cellW + gap) + cellW + gap / 2;
        labels += `<text x="${x}" y="12" fill="#8792A6" font-family="Inter, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Aisle ${aisle}</text>`;
      }
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${labels}${cells}</svg>`;
  }

  function wireGrid() {
    const svg = document.querySelector(".warehouse-grid svg");
    if (!svg) return;
    svg.querySelectorAll("rect[data-row]").forEach((rect) => {
      rect.style.cursor = "pointer";
      rect.addEventListener("mouseenter", (e) => {
        const r = parseInt(rect.getAttribute("data-row"), 10);
        const c = parseInt(rect.getAttribute("data-col"), 10);
        const b = wh.bins.find((x) => x.row === r && x.col === c);
        FlareTooltip.show(
          `<span class="l">Bin</span>${b.slot}<br>
           <span class="l">Util</span>${(b.utilisation*100).toFixed(0)}%
           &nbsp;·&nbsp;<span class="l">SKUs</span>${b.skuCount}<br>
           <span class="l">Last pick</span>${b.lastPickedDays}d ago`,
          e.clientX, e.clientY
        );
      });
      rect.addEventListener("mousemove", (e) => FlareTooltip.move(e.clientX, e.clientY));
      rect.addEventListener("mouseleave", () => FlareTooltip.hide());
      rect.addEventListener("click", () => {
        const r = parseInt(rect.getAttribute("data-row"), 10);
        const c = parseInt(rect.getAttribute("data-col"), 10);
        selectedBin = wh.bins.find((x) => x.row === r && x.col === c);
        document.getElementById("binPanel").innerHTML = binPanelHtml(selectedBin, biz);
        document.querySelectorAll(".warehouse-grid rect").forEach((rr) => rr.setAttribute("stroke", "rgba(255,255,255,0.05)"));
        rect.setAttribute("stroke", "#FF7A2E");
        rect.setAttribute("stroke-width", "2");
      });
    });
  }

  function binPanelHtml(bin, biz) {
    if (!bin) return `<div class="empty">Click a bin to inspect contents.</div>`;
    const contents = FlareData.binContents(biz, bin);
    return `
      <div class="label">Bin · ${bin.slot}</div>
      <h3>Aisle ${bin.aisle}</h3>
      <div class="meta">Row ${bin.row + 1} · Col ${(bin.col % 4) + 1}</div>

      <div class="stat-grid">
        <div class="stat"><div class="l">Utilisation</div><div class="v">${(bin.utilisation*100).toFixed(0)}%</div></div>
        <div class="stat"><div class="l">SKUs</div><div class="v">${bin.skuCount}</div></div>
        <div class="stat"><div class="l">Last picked</div><div class="v">${bin.lastPickedDays}d ago</div></div>
        <div class="stat"><div class="l">Traffic</div><div class="v">${bin.utilisation > 0.7 ? "High" : bin.utilisation > 0.4 ? "Mid" : "Low"}</div></div>
      </div>

      <div class="label" style="margin-top: 0.6rem;">Contents · top 5 by picks (30d)</div>
      <table class="tbl" style="margin-top: 0.4rem;">
        <tbody>
          ${contents.map((c) => `<tr><td class="mono">${c.sku}</td><td>${c.name}</td><td class="num">${c.picks30d}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  render();
};

function mw(label, value, delta, cls) {
  const arrow = cls === "positive" ? "▲" : cls === "negative" ? "▼" : "";
  return `
    <div class="metric">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="delta ${cls || "neutral"}"><span class="arrow">${arrow}</span>${delta}</div>
    </div>
  `;
}
