/* ============================================================
   FLARE — Bundle & basket intelligence dashboard
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.bundle = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const data = FlareData.bundle(biz);
  let selectedI = 0, selectedJ = 1;

  function render() {
    main.innerHTML = `
      <div class="page-head">
        <h1>Bundle &amp; basket intelligence</h1>
        <div class="crumbs">FLARE · <span class="accent">${biz.name}</span> · ${data.skus.length}×${data.skus.length} affinity</div>
      </div>

      <div class="bundle-layout">
        <div class="bundle-matrix">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem;">
            <span class="eyebrow">Co-purchase lift · click a cell to focus a pair</span>
            <span class="mono" style="color: var(--mute); font-size: 0.72rem;">Low <span style="display: inline-block; width: 60px; height: 8px; vertical-align: middle; margin: 0 0.4rem; border-radius: 2px; background: linear-gradient(to right, rgba(255,79,0,0.1), rgba(255,79,0,1));"></span> High</span>
          </div>
          ${matrixSvg(data)}
        </div>

        <div class="bundle-pairs">
          <div class="label">Top bundle suggestions · by lift × frequency</div>
          <div id="topPairs">${data.topPairs.map(pairRow).join("")}</div>

          <div class="label" style="margin-top: 1.4rem;">Focused pair</div>
          <div id="focusedPair">${focusedPairHtml(data, selectedI, selectedJ)}</div>
        </div>
      </div>

      <div class="card" style="margin-top: 0.85rem; font-size: 0.8rem; color: var(--mute);">
        <strong style="color: var(--read);">How lift is read.</strong> Lift > 1.0 means two SKUs are bought together more often than chance would predict. Real FLARE computes this per business on rolling 90-day baskets, with thresholds for minimum support before publishing a recommendation.
      </div>
    `;

    wireMatrix();
  }

  function matrixSvg(data) {
    const n = data.skus.length;
    const cellSize = 36, gap = 2, padX = 80, padY = 80;
    const w = padX + n * (cellSize + gap);
    const h = padY + n * (cellSize + gap);

    // Cells
    let cells = "";
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = data.matrix[i][j];
        if (v === null) {
          // diagonal
          const x = padX + j * (cellSize + gap);
          const y = padY + i * (cellSize + gap);
          cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="rgba(232,236,242,0.04)" />`;
          continue;
        }
        const norm = Math.min(1, Math.max(0, (v - 0.6) / 2.8));
        const a = 0.08 + norm * 0.92;
        const fill = `rgba(255,79,0,${a.toFixed(2)})`;
        const sel = (i === selectedI && j === selectedJ) || (i === selectedJ && j === selectedI);
        const x = padX + j * (cellSize + gap);
        const y = padY + i * (cellSize + gap);
        const strokeAttr = sel ? `stroke="#FF7A2E" stroke-width="2"` : `stroke="rgba(255,255,255,0.04)"`;
        cells += `<rect data-i="${i}" data-j="${j}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${fill}" ${strokeAttr} style="cursor:pointer" />`;
      }
    }
    // Row labels (left)
    let rowLabels = "";
    for (let i = 0; i < n; i++) {
      const y = padY + i * (cellSize + gap) + cellSize / 2 + 4;
      rowLabels += `<text x="${padX - 8}" y="${y}" text-anchor="end" fill="#B8C0D0" font-family="IBM Plex Mono, monospace" font-size="10">${data.skus[i].sku}</text>`;
    }
    // Col labels (top, rotated)
    let colLabels = "";
    for (let j = 0; j < n; j++) {
      const x = padX + j * (cellSize + gap) + cellSize / 2;
      const y = padY - 8;
      colLabels += `<text x="${x}" y="${y}" text-anchor="start" fill="#B8C0D0" font-family="IBM Plex Mono, monospace" font-size="10" transform="rotate(-50 ${x} ${y})">${data.skus[j].sku}</text>`;
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
           <span class="l">Lift</span>${lift.toFixed(2)}`,
          e.clientX, e.clientY
        );
      });
      rect.addEventListener("mousemove", (e) => FlareTooltip.move(e.clientX, e.clientY));
      rect.addEventListener("mouseleave", () => FlareTooltip.hide());
      rect.addEventListener("click", () => {
        selectedI = parseInt(rect.getAttribute("data-i"), 10);
        selectedJ = parseInt(rect.getAttribute("data-j"), 10);
        document.getElementById("focusedPair").innerHTML = focusedPairHtml(data, selectedI, selectedJ);
        // Update stroke highlighting
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
      <div style="background: var(--surface-alt); padding: 0.7rem 0.85rem; border-radius: 4px;">
        <div style="font-family: var(--f-mono); font-size: 0.78rem; color: var(--read);">
          <strong style="color: var(--instrument);">${a.sku}</strong> ${a.name}<br>
          <span style="color: var(--dim);">+</span> <strong style="color: var(--instrument);">${b.sku}</strong> ${b.name}
        </div>
        <div style="margin-top: 0.6rem; display: flex; gap: 0.8rem; font-family: var(--f-mono); font-size: 0.8rem;">
          <span><span style="color: var(--mute);">Lift</span> <span style="color: var(--accent);">${lift.toFixed(2)}×</span></span>
          <span><span style="color: var(--mute);">Est. baskets</span> ${baseFreq}/mo</span>
        </div>
      </div>
    `;
  }

  render();
};
