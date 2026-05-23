/* ============================================================
   FLARE — Per-SKU analysis dashboard
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.sku = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const skus = FlareData.skus(biz);
  const cats = FlareData.categories(businessKey);

  let sortKey = "revenueYTD";
  let sortDir = "desc";
  let searchText = "";
  let selectedCat = null;
  let selectedSku = skus[0];

  function filtered() {
    let xs = skus.slice();
    if (selectedCat) xs = xs.filter((s) => s.category === selectedCat);
    if (searchText) {
      const q = searchText.toLowerCase();
      xs = xs.filter((s) => s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }
    xs.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return xs;
  }

  function render() {
    main.innerHTML = `
      <div class="page-head">
        <h1>Per-SKU analysis</h1>
        <div class="crumbs">FLARE · <span class="accent">${biz.name}</span> · ${skus.length} SKUs</div>
      </div>

      <div class="filter-bar">
        <input class="search" id="skuSearch" placeholder="Search SKU code, name…" value="${escapeHtml(searchText)}" />
        ${["All", ...cats].map((c) => {
          const isAll = c === "All";
          const active = (isAll && !selectedCat) || c === selectedCat;
          return `<button class="chip ${active ? "active" : ""}" data-cat="${isAll ? "" : c}">${c}</button>`;
        }).join("")}
      </div>

      <div class="dd-layout">
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="max-height: 560px; overflow-y: auto;">
            <table class="tbl">
              <thead>
                <tr>
                  ${col("sku", "SKU")}
                  ${col("name", "Name")}
                  ${col("category", "Category")}
                  ${col("marginPct", "Margin")}
                  ${col("velocity", "Velocity")}
                  ${col("daysCover", "Cover")}
                  ${col("revenueYTD", "Rev YTD")}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="skuBody">
                ${filtered().map(rowHtml).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="dd-panel" id="skuPanel">${drilldownHtml(selectedSku, biz)}</div>
      </div>
    `;

    // Sparkline if selected SKU drawn
    if (selectedSku) drawSpark(selectedSku, biz);

    // Wire events
    document.getElementById("skuSearch").addEventListener("input", (e) => {
      searchText = e.target.value;
      updateTable();
    });
    document.querySelectorAll(".chip[data-cat]").forEach((el) => {
      el.addEventListener("click", () => {
        selectedCat = el.getAttribute("data-cat") || null;
        render();
      });
    });
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.getAttribute("data-sort");
        if (sortKey === k) sortDir = sortDir === "asc" ? "desc" : "asc";
        else { sortKey = k; sortDir = "desc"; }
        updateTable();
      });
    });
    wireRowClicks();
  }

  function col(key, label) {
    const ind = sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : "";
    return `<th data-sort="${key}">${label}<span class="sort-ind">${ind}</span></th>`;
  }

  function rowHtml(s) {
    return `
      <tr data-sku="${s.sku}" class="${selectedSku && selectedSku.sku === s.sku ? "selected" : ""}">
        <td class="mono">${s.sku}</td>
        <td>${s.name}</td>
        <td class="mono">${s.category}</td>
        <td class="num">${s.marginPct.toFixed(1)}%</td>
        <td class="num">${s.velocity}/w</td>
        <td class="num">${s.daysCover}d</td>
        <td class="num">£${(s.revenueYTD / 1000).toFixed(0)}k</td>
        <td><span class="pill ${s.status}">${s.status}</span></td>
      </tr>
    `;
  }

  function updateTable() {
    const body = document.getElementById("skuBody");
    body.innerHTML = filtered().map(rowHtml).join("");
    // Header sort indicators
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      const k = th.getAttribute("data-sort");
      const ind = th.querySelector(".sort-ind");
      ind.textContent = sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "";
    });
    wireRowClicks();
  }

  function wireRowClicks() {
    document.querySelectorAll("tr[data-sku]").forEach((tr) => {
      tr.addEventListener("click", () => {
        const code = tr.getAttribute("data-sku");
        selectedSku = skus.find((s) => s.sku === code);
        document.getElementById("skuPanel").innerHTML = drilldownHtml(selectedSku, biz);
        drawSpark(selectedSku, biz);
        document.querySelectorAll("tr[data-sku]").forEach((r) => r.classList.toggle("selected", r.getAttribute("data-sku") === code));
      });
    });
  }

  function drawSpark(s, biz) {
    // 52 weeks of synthetic units
    const r = (i) => {
      const x = Math.sin((s.sku.charCodeAt(0) + i * 7) * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    const seasonal = (i) => 1 + 0.25 * Math.sin((i / 52) * Math.PI * 2);
    const data = [];
    for (let i = 0; i < 52; i++) data.push(s.velocity * seasonal(i) * (0.7 + r(i) * 0.6));
    FlareCharts.spark("skuSpark", data, biz.color);
  }

  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  render();
};

function drilldownHtml(s, biz) {
  if (!s) return `<div class="empty">Select a SKU to drill down.</div>`;
  const stockoutTxt = s.lastStockoutDaysAgo === null ? "—" : `${s.lastStockoutDaysAgo}d ago`;
  return `
    <div class="label">Drill-down · ${s.category}</div>
    <h3>${s.name}</h3>
    <div class="meta">${s.sku} · <span style="color: var(--accent);">${biz.name}</span></div>

    <div class="stat-grid">
      <div class="stat"><div class="l">Revenue YTD</div><div class="v">£${(s.revenueYTD/1000).toFixed(0)}k</div></div>
      <div class="stat"><div class="l">Units YTD</div><div class="v">${s.unitsYTD.toLocaleString()}</div></div>
      <div class="stat"><div class="l">Avg basket</div><div class="v">${s.avgBasket.toFixed(1)}</div></div>
      <div class="stat"><div class="l">Return rate</div><div class="v">${(s.returnRate*100).toFixed(1)}%</div></div>
      <div class="stat"><div class="l">Days cover</div><div class="v">${s.daysCover}d</div></div>
      <div class="stat"><div class="l">Last stockout</div><div class="v">${stockoutTxt}</div></div>
    </div>

    <div class="label" style="margin-top: 0.5rem;">Units · last 52 weeks</div>
    <div class="spark" style="height: 70px;"><canvas id="skuSpark"></canvas></div>

    <div class="activity">
      <div class="label" style="margin: 0.75rem 0 0.4rem;">Recent activity</div>
      ${activityHtml(s)}
    </div>
  `;
}

function activityHtml(s) {
  // Deterministic per-SKU log
  const r = (i) => {
    const x = Math.sin((s.sku.charCodeAt(0) + i * 17.3)) * 43758.5453;
    return x - Math.floor(x);
  };
  const events = [
    { d: 1, t: "Replenishment received · 240 units" },
    { d: 3, t: "Promo price tested · −10% applied" },
    { d: 7, t: "Bin moved · A2-1 → B3-2 (velocity)" },
    { d: 12, t: "Forecast updated · +12% next 4w" },
    { d: 18, t: "Pack revision logged" },
  ];
  return events.map((e, i) => `
    <div class="activity-row">
      <span class="what">${e.t}</span>
      <span class="when">${e.d}d ago</span>
    </div>
  `).join("");
}
