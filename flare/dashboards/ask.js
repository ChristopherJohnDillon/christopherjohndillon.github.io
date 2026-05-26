/* ============================================================
   FLARE — Ask FLARE (AI chat interface)
   Cosmetic chat surface — doesn't actually call an LLM.
   ============================================================ */
window.FlareDashboards = window.FlareDashboards || {};

window.FlareDashboards.ask = function (main, businessKey) {
  const biz = FlareData.business(businessKey);

  const examples = [
    "Which SKUs are at risk of stockout in the next 14 days?",
    "Show me revenue mix by channel for Q1 vs Q2",
    "What's driving the OTIF drop at Trailcraft?",
    "Forecast next month's revenue for Hearthline",
    "Top 5 customers at risk of churn this quarter",
    "Summarise this week's negative NPS comments",
  ];

  const conversation = [
    { role: "user", text: "What's the headline this week?" },
    {
      role: "assistant",
      text: `Three things stand out across **${biz.name}** this week:`,
      bullets: [
        "**Revenue** is tracking +6.2% vs prior 4w with **Velora** leading at +14.1% on the back of the May subscription push.",
        "**OTIF** dipped to 92.8% — driven mostly by Trailcraft's late inbound from supplier <code>SUP-441</code>. ETA recovered Friday.",
        "Two **Hearthline** SKUs (HEA-3120, HEA-7771) crossed the stockout threshold — recommend expedite.",
      ],
      sources: ["sales · last 7d", "otif · last 7d", "inventory · live"],
    },
  ];

  main.innerHTML = `
    <div class="main-inner">
      ${FlareUI.pageHeader("Ask FLARE", "Chat with the data. Backed by your own private model — nothing leaves the network.")}
      <div class="data-as-of">Model: <strong style="color: var(--white);">flare-llm-13b</strong> · self-hosted · context: ${biz.name} (last 90 days)</div>

      <div class="ask-window">
        ${conversation.map(messageHtml).join("")}

        <div class="ask-suggestions">
          <div class="suggestions-label">Try asking…</div>
          ${examples.map((e) => `<button class="chip" data-q="${escapeAttr(e)}">${e}</button>`).join("")}
        </div>

        <div class="ask-input-row">
          <span class="ms" style="color: var(--mute);">forum</span>
          <input class="ask-input" id="askInput" type="text" placeholder="Ask anything about ${biz.name}…" />
          <button class="pill-btn primary ask-send">
            <span>Send</span>
            <span class="ms ms-sm">send</span>
          </button>
        </div>
        <div class="ask-foot">Self-hosted local model. Your queries never leave the warehouse network. <span style="color: var(--accent); font-weight: 600;">Demo</span>: this is a static mockup — no live LLM is wired up.</div>
      </div>
    </div>
  `;

  function messageHtml(m) {
    if (m.role === "user") {
      return `
        <div class="ask-msg user">
          <div class="ask-bubble user-bubble">${m.text}</div>
        </div>
      `;
    }
    return `
      <div class="ask-msg assistant">
        <div class="ask-avatar"><span class="ms ms-sm">auto_awesome</span></div>
        <div class="ask-bubble assistant-bubble">
          <div>${m.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>")}</div>
          ${m.bullets ? `<ul style="margin: 0.7rem 0 0; padding-left: 1.1rem; line-height: 1.7;">${m.bullets.map((b) => `<li>${b.replace(/\*\*(.+?)\*\*/g, "<strong style='color: var(--instrument);'>$1</strong>").replace(/<code>(.+?)<\/code>/g, "<code style='background: var(--surface-alt); padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 0.85em;'>$1</code>")}</li>`).join("")}</ul>` : ""}
          ${m.sources ? `<div class="ask-sources">${m.sources.map((s) => `<span class="ask-source"><span class="ms ms-sm">database</span>${s}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    `;
  }

  function escapeAttr(s) { return s.replace(/"/g, "&quot;"); }

  // Chip click prefills input
  FlareUI.mountHeader(main);
  document.querySelectorAll(".ask-suggestions .chip").forEach((b) => {
    b.addEventListener("click", () => {
      const q = b.getAttribute("data-q");
      const input = document.getElementById("askInput");
      input.value = q;
      input.focus();
    });
  });
};
