/* ============================================================
   FLARE — Product Margin
   Mirrors real Product_Margin.py: filter row + 4 metrics + table.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.sku = function (main, businessKey) {
  const biz = FlareData.business(businessKey);
  const skus = FlareData.skus(biz);
  const cats = FlareData.categories(businessKey);

  let sortKey = "revenueYTD";
  let sortDir = "desc";
  let searchText = "";
  let selectedCat = "All";

  function filtered() {
    let xs = skus.slice();
    if (selectedCat && selectedCat !== "All") xs = xs.filter((s) => s.category === selectedCat);
    if (searchText) {
      const q = searchText.toLowerCase();
      xs = xs.filter((s) => s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    xs.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return xs;
  }

  function metrics() {
    const xs = filtered();
    const totalRev = xs.reduce((s, x) => s + x.revenueYTD, 0);
    const avgMargin = xs.length ? xs.reduce((s, x) => s + x.marginPct, 0) / xs.length : 0;
    const avgVel = xs.length ? xs.reduce((s, x) => s + x.velocity, 0) / xs.length : 0;
    const stockouts = xs.filter((x) => x.lastStockoutDaysAgo !== null && x.lastStockoutDaysAgo < 14).length;
    return { totalRev, avgMargin, avgVel, stockouts, n: xs.length };
  }

  function render() {
    const m = metrics();
    main.innerHTML = `
      <h1 class="page-title">Product Margin</h1>
      <div class="page-subtitle">Per-business, per-channel margin vs budget targets — ${biz.name}.</div>

      <div class="filter-bar">
        <select id="catSel">
          <option value="All">All categories</option>
          ${cats.map((c) => `<option value="${c}" ${c === selectedCat ? "selected" : ""}>${c}</option>`).join("")}
        </select>
        <input class="search-input" id="skuSearch" placeholder="Search SKU code or name…" value="${escapeHtml(searchText)}" />
      </div>

      <div class="metric-row">
        ${metric("Revenue YTD",   `£${(m.totalRev/1000).toFixed(0)}k`, `${m.n} SKUs in view`, "neutral")}
        ${metric("Avg margin",    `${m.avgMargin.toFixed(1)}%`,         `vs ${biz.gmTarget}% target`, m.avgMargin >= biz.gmTarget ? "positive" : "negative")}
        ${metric("Avg velocity",  `${m.avgVel.toFixed(0)}/w`,           "units per SKU per week", "neutral")}
        ${metric("Active stockouts", `${m.stockouts}`,                  m.stockouts === 0 ? "none in 14d" : "in last 14d", m.stockouts === 0 ? "positive" : "negative")}
      </div>

      <hr class="divider" />

      <div class="section-head">
        <h2>Product Margin Tracker</h2>
        <div class="meta">Sortable — click any column header. <span style="color: var(--positive);">Green</span> over target · <span style="color: var(--critical);">red</span> under target.</div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="max-height: 640px; overflow-y: auto;">
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
    `;

    document.getElementById("catSel").addEventListener("change", (e) => { selectedCat = e.target.value; render(); });
    document.getElementById("skuSearch").addEventListener("input", (e) => { searchText = e.target.value; updateTable(); });
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.getAttribute("data-sort");
        if (sortKey === k) sortDir = sortDir === "asc" ? "desc" : "asc";
        else { sortKey = k; sortDir = "desc"; }
        updateTable();
      });
    });
  }

  function col(key, label) {
    const ind = sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : "";
    return `<th data-sort="${key}">${label}<span class="sort-ind">${ind}</span></th>`;
  }

  function rowHtml(s) {
    const marginCls = s.marginPct >= biz.gmTarget ? "pos" : s.marginPct < biz.gmTarget - 5 ? "neg" : "";
    return `
      <tr data-sku="${s.sku}">
        <td class="mono">${s.sku}</td>
        <td>${s.name}</td>
        <td class="mono">${s.category}</td>
        <td class="num ${marginCls}">${s.marginPct.toFixed(1)}%</td>
        <td class="num">${s.velocity}/w</td>
        <td class="num">${s.daysCover}d</td>
        <td class="num">£${(s.revenueYTD/1000).toFixed(0)}k</td>
        <td><span class="pill ${s.status}">${s.status}</span></td>
      </tr>
    `;
  }

  function updateTable() {
    const m = metrics();
    document.getElementById("skuBody").innerHTML = filtered().map(rowHtml).join("");
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      const k = th.getAttribute("data-sort");
      const ind = th.querySelector(".sort-ind");
      ind.textContent = sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "";
    });
  }

  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  render();
};

function metric(label, value, delta, cls) {
  const arrow = cls === "positive" ? "▲" : cls === "negative" ? "▼" : "";
  return `
    <div class="metric">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="delta ${cls || "neutral"}"><span class="arrow">${arrow}</span>${delta}</div>
    </div>
  `;
}
