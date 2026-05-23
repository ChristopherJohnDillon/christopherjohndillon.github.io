/* ============================================================
   FLARE — Customer Intelligence
   4 metrics + affinity matrix + top-pairs list.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.bundle = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const data = FlareData.bundle(biz);
  let selectedI = 0, selectedJ = 1;

  const topLift = Math.max(...data.topPairs.map((p) => p.lift));
  const avgLift = data.topPairs.reduce((s, p) => s + p.lift, 0) / data.topPairs.length;
  const crossShop = 0.34 + (data.skus.length % 9) / 100;
  const avgBasket = 2.1 + (data.skus[0].avgBasket / 2);

  function render() {
    main.innerHTML = `
      <h1 class="page-title">Customer Intelligence</h1>
      <div class="page-subtitle">Basket affinity, cross-shopping, and bundle suggestions — ${biz.name}.</div>

      <div class="metric-row">
        ${mb("SKUs analysed", `${data.skus.length}`, "co-purchase pairs", "neutral")}
        ${mb("Top lift", `${topLift.toFixed(2)}×`, "strongest pair", "positive")}
        ${mb("Avg lift (top 10)", `${avgLift.toFixed(2)}×`, "across bundle list", "neutral")}
        ${mb("Cross-shop rate", `${(crossShop*100).toFixed(0)}%`, "multi-category baskets", "positive")}
      </div>

      <hr class="divider" />

      <div class="section-head">
        <h2>Co-purchase affinity matrix</h2>
        <div class="meta">Lift > 1.0 = bought together more often than chance. Click a cell to focus a pair.</div>
      </div>

      <div class="bundle-layout">
        <div class="bundle-matrix">${matrixSvg(data)}</div>
        <div class="bundle-pairs">
          <div class="label" style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mute); margin-bottom: 0.6rem;">Top bundle suggestions</div>
          <div id="topPairs">${data.topPairs.map(pairRow).join("")}</div>

          <div class="label" style="margin-top: 1.25rem;">Focused pair</div>
          <div id="focusedPair" style="margin-top: 0.4rem;">${focusedPairHtml(data, selectedI, selectedJ)}</div>
        </div>
      </div>

      <div class="card" style="margin-top: 1rem; font-size: 0.9rem; color: var(--read);">
        <strong style="color: var(--instrument);">How lift is read.</strong> Lift compares observed co-purchase frequency to what chance alone would predict. Real FLARE computes this per business on rolling 90-day baskets with minimum-support thresholds before publishing a recommendation.
      </div>
    `;

    wireMatrix();
  }

  function matrixSvg(data) {
    const n = data.skus.length;
    const cellSize = 36, gap = 2, padX = 80, padY = 80;
    const w = padX + n * (cellSize + gap);
    const h = padY + n * (cellSize + gap);

    let cells = "";
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = data.matrix[i][j];
        const x = padX + j * (cellSize + gap);
        const y = padY + i * (cellSize + gap);
        if (v === null) {
          cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="rgba(232,236,242,0.04)" />`;
          continue;
        }
        const norm = Math.min(1, Math.max(0, (v - 0.6) / 2.8));
        const a = 0.08 + norm * 0.92;
        const fill = `rgba(255,79,0,${a.toFixed(2)})`;
        const sel = (i === selectedI && j === selectedJ) || (i === selectedJ && j === selectedI);
        const strokeAttr = sel ? `stroke="#FF7A2E" stroke-width="2"` : `stroke="rgba(255,255,255,0.04)"`;
        cells += `<rect data-i="${i}" data-j="${j}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${fill}" ${strokeAttr} style="cursor:pointer" />`;
      }
    }
    let rowLabels = "";
    for (let i = 0; i < n; i++) {
      const y = padY + i * (cellSize + gap) + cellSize / 2 + 4;
      rowLabels += `<text x="${padX - 8}" y="${y}" text-anchor="end" fill="#B8C0D0" font-family="Inter, sans-serif" font-weight="500" font-size="11">${data.skus[i].sku}</text>`;
    }
    let colLabels = "";
    for (let j = 0; j < n; j++) {
      const x = padX + j * (cellSize + gap) + cellSize / 2;
      const y = padY - 8;
      colLabels += `<text x="${x}" y="${y}" text-anchor="start" fill="#B8C0D0" font-family="Inter, sans-serif" font-weight="500" font-size="11" transform="rotate(-50 ${x} ${y})">${data.skus[j].sku}</text>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${cells}${rowLabels}${colLabels}</svg>`;
  }

  function wireMatrix() {
    document.querySelectorAll(".bundle-matrix rect[data-i]").forEach((rect) => {
      rect.addEventListener("mouseenter", (e) => {
        const i = parseInt(rect.getAttribute("data-i"), 10);
        const j = parseInt(rect.getAttribute("data-j"), 10);
        const lift = data.matrix[i][j];
        FlareTooltip.show(
          `<span class="l">A</span>${data.skus[i].sku}<br>
           <span class="l">B</span>${data.skus[j].sku}<br>
           <span class="l">Lift</span>${lift.toFixed(2)}×`,
          e.clientX, e.clientY
        );
      });
      rect.addEventListener("mousemove", (e) => FlareTooltip.move(e.clientX, e.clientY));
      rect.addEventListener("mouseleave", () => FlareTooltip.hide());
      rect.addEventListener("click", () => {
        selectedI = parseInt(rect.getAttribute("data-i"), 10);
        selectedJ = parseInt(rect.getAttribute("data-j"), 10);
        document.getElementById("focusedPair").innerHTML = focusedPairHtml(data, selectedI, selectedJ);
        document.querySelectorAll(".bundle-matrix rect[data-i]").forEach((rr) => {
          rr.setAttribute("stroke", "rgba(255,255,255,0.04)");
          rr.removeAttribute("stroke-width");
        });
        document.querySelectorAll(`.bundle-matrix rect[data-i="${selectedI}"][data-j="${selectedJ}"], .bundle-matrix rect[data-i="${selectedJ}"][data-j="${selectedI}"]`).forEach((rr) => {
          rr.setAttribute("stroke", "#FF7A2E");
          rr.setAttribute("stroke-width", "2");
        });
      });
    });
  }

  function pairRow(p) {
    return `
      <div class="pair-row">
        <div class="skus">${p.a.sku} <span style="color: var(--dim);">+</span> ${p.b.sku}</div>
        <div class="lift">${p.lift.toFixed(2)}× <span style="color: var(--mute); font-weight: 400; margin-left: 0.4rem;">${p.freq}/mo</span></div>
      </div>
    `;
  }

  function focusedPairHtml(data, i, j) {
    if (i === j) return `<div class="meta">Pick a non-diagonal cell.</div>`;
    const a = data.skus[i], b = data.skus[j];
    const lift = data.matrix[i][j];
    const baseFreq = Math.round((lift * (a.velocity + b.velocity)) / 2);
    return `
      <div style="background: var(--surface-alt); padding: 0.85rem 1rem; border-radius: 10px;">
        <div style="font-size: 0.85rem; color: var(--read); line-height: 1.55;">
          <strong style="color: var(--instrument);">${a.sku}</strong> ${a.name}<br>
          <span style="color: var(--dim);">+</span> <strong style="color: var(--instrument);">${b.sku}</strong> ${b.name}
        </div>
        <div style="margin-top: 0.7rem; display: flex; gap: 1rem; font-size: 0.85rem;">
          <span><span style="color: var(--mute);">Lift</span> <strong style="color: var(--accent); margin-left: 0.3rem;">${lift.toFixed(2)}×</strong></span>
          <span><span style="color: var(--mute);">Est. baskets</span> <strong style="color: var(--instrument); margin-left: 0.3rem;">${baseFreq}/mo</strong></span>
        </div>
      </div>
    `;
  }

  render();
};

function mb(label, value, delta, cls) {
  const arrow = cls === "positive" ? "▲" : cls === "negative" ? "▼" : "";
  return `
    <div class="metric">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="delta ${cls || "neutral"}"><span class="arrow">${arrow}</span>${delta}</div>
    </div>
  `;
}
