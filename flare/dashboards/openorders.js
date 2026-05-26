/* ============================================================
   FLARE — Open Order Pipeline
   Stage waterfall (Placed → Picking → Packing → Awaiting carrier → In transit)
   Aging buckets, queue triage table.
   URL filters: ?stage=Picking & ?aging=>7d
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.openorders = function (main, businessKey) {
  const biz = FlareData.business(businessKey);

  const STAGES = ["All", ...FlareData.orderStages];
  const AGING = ["All", "<1d", "1–2d", "2–4d", "4–7d", ">7d"];

  function readState() {
    const p = window.FlareUrl.read();
    return {
      stage: STAGES.includes(p.stage) ? p.stage : "All",
      aging: AGING.includes(p.aging) ? p.aging : "All",
    };
  }

  function render() {
    const { stage, aging } = readState();
    const d = FlareData.orderPipeline(biz, stage, aging);
    const slaBreach = d.aging.find((a) => a.bucket === ">7d").count;
    const slaPct = (slaBreach / d.totalOpen) * 100;
    const slaCls = slaPct < 4 ? "positive" : slaPct < 8 ? "warning" : "critical";

    main.innerHTML = `
      <div class="main-inner">
        ${FlareUI.pageHeader("Open Order Pipeline", "Stage waterfall, aging buckets, queue triage")}

        <div class="data-as-of">${new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${biz.name}</div>

        <div class="metric-row" style="margin-bottom: 1.5rem;">
          ${metric("Open orders", d.totalOpen.toLocaleString(), "", "neutral", false)}
          ${metric("Daily throughput", biz.ordersPerDay.toLocaleString(), "", "neutral", false)}
          ${metric("Pipeline cover", (d.totalOpen / biz.ordersPerDay).toFixed(1) + " days", "", "neutral", false)}
          ${metric("SLA breach (>7d)", slaBreach.toLocaleString() + " (" + slaPct.toFixed(1) + "%)", "", slaCls, false)}
        </div>

        <h2 style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--white); margin: 0.5rem 0 0.85rem;">By stage</h2>
        <div class="chip-rail" id="stageRail">
          ${STAGES.map((s) => `<button class="chip ${s === stage ? "active" : ""}" data-stage="${s}">${s}</button>`).join("")}
        </div>
        <div class="pipe-waterfall">
          ${d.stages.map((st, i) => `
            <div class="pipe-stage ${stage === st.stage ? "active" : ""}" data-stage="${st.stage}">
              <div class="ps-label">${st.stage}</div>
              <div class="ps-count">${st.count.toLocaleString()}</div>
              <div class="ps-sub">${(st.count / d.totalOpen * 100).toFixed(0)}% of pipeline</div>
              ${i < d.stages.length - 1 ? '<span class="ps-flow">›</span>' : ''}
            </div>
          `).join("")}
        </div>

        <h2 style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--white); margin: 0.5rem 0 0.85rem;">By age</h2>
        <div class="aging-row">
          ${d.aging.map((a) => {
            const cls = a.bucket === "4–7d" ? "warn" : a.bucket === ">7d" ? "crit" : "";
            const active = aging === a.bucket ? "active" : "";
            return `
              <div class="aging-cell ${cls} ${active}" data-aging="${a.bucket}">
                <div class="label">${a.bucket}</div>
                <div class="value">${a.count.toLocaleString()}</div>
              </div>
            `;
          }).join("")}
        </div>

        <h2 style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--white); margin: 1rem 0 0.85rem;">
          Oldest in queue
          ${(stage !== "All" || aging !== "All") ? `<span style="font-weight: 400; color: var(--mute); text-transform: none; letter-spacing: 0;"> · filtered: ${[stage !== "All" ? stage : null, aging !== "All" ? aging : null].filter(Boolean).join(", ")}</span>` : ""}
        </h2>
        <div style="overflow-x: auto;">
          <table class="tbl tbl-flare">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Stage</th>
                <th>Channel</th>
                <th class="num">Lines</th>
                <th class="num">Value</th>
                <th class="num">Age</th>
              </tr>
            </thead>
            <tbody>
              ${d.queue.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: var(--mute); padding: 1.5rem;">No orders match the current filter.</td></tr>` :
              d.queue.map((o) => {
                const ageCls = o.ageDays >= 7 ? "neg" : o.ageDays >= 4 ? "" : "";
                const ageStyle = o.ageDays >= 7 ? "color: var(--critical);" : o.ageDays >= 4 ? "color: var(--warning);" : "";
                return `<tr>
                  <td class="mono">${o.id}</td>
                  <td>${o.stage}</td>
                  <td>${o.channel}</td>
                  <td class="num">${o.lines}</td>
                  <td class="num">£${o.value.toFixed(0)}</td>
                  <td class="num" style="${ageStyle}">${o.ageDays.toFixed(1)}d</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    FlareUI.mountHeader(main);

    // Filter wiring
    main.querySelectorAll("#stageRail .chip").forEach((b) => {
      b.addEventListener("click", () => {
        const v = b.getAttribute("data-stage");
        FlareUrl.set({ stage: v === "All" ? null : v });
      });
    });
    main.querySelectorAll(".pipe-stage").forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-stage");
        FlareUrl.set({ stage: (stage === v) ? null : v });
      });
    });
    main.querySelectorAll(".aging-cell").forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-aging");
        FlareUrl.set({ aging: (aging === v) ? null : v });
      });
    });
  }

  const off = FlareUrl.onChange((_params, route) => {
    if (route === "#/openorders") render();
    else off();
  });

  render();
};
