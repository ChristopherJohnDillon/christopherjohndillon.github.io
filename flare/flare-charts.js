/* ============================================================
   FLARE — Chart.js theming + chart factory wrappers
   ============================================================ */

const T = {
  bg: "#0A2535",
  surface: "#133142",
  surfaceAlt: "#1C3D50",
  rule: "rgba(232,236,242,0.08)",
  ruleStrong: "rgba(232,236,242,0.18)",
  instrument: "#E8ECF2",
  read: "#B8C0D0",
  mute: "#8792A6",
  dim: "#5B657A",
  accent: "#FF4F00",
  accentHot: "#FF7A2E",
  accentDim: "rgba(255,79,0,0.18)",
  positive: "#16a34a",
  warning: "#eab308",
  critical: "#d4001a",
  blue: "#3D8BFF",
  purple: "#C97EFF",
  yellow: "#FFC857",
  green: "#16A34A",
};

if (window.Chart) {
  Chart.defaults.font.family = "IBM Plex Mono, ui-monospace, monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = T.mute;
  Chart.defaults.borderColor = T.rule;
  Chart.defaults.plugins.legend.labels.color = T.read;
  Chart.defaults.plugins.tooltip.backgroundColor = "#061C2A";
  Chart.defaults.plugins.tooltip.titleColor = T.instrument;
  Chart.defaults.plugins.tooltip.bodyColor = T.read;
  Chart.defaults.plugins.tooltip.borderColor = T.ruleStrong;
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 8;
  Chart.defaults.plugins.tooltip.titleFont = { family: "IBM Plex Sans", weight: "500" };
}

const FlareCharts = (function () {
  const registry = new Map(); // canvasId → Chart instance

  function destroy(canvasId) {
    const inst = registry.get(canvasId);
    if (inst) { inst.destroy(); registry.delete(canvasId); }
  }

  function register(canvasId, chart) {
    registry.set(canvasId, chart);
  }

  function axes(showY = true) {
    return {
      x: {
        grid: { color: T.rule, drawBorder: false },
        ticks: { color: T.mute, maxRotation: 0, autoSkipPadding: 12 },
      },
      y: showY ? {
        grid: { color: T.rule, drawBorder: false },
        ticks: { color: T.mute },
      } : { display: false },
    };
  }

  function spark(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroy(canvasId);
    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color || T.accent,
          borderWidth: 1.5,
          tension: 0.32,
          pointRadius: 0,
          fill: true,
          backgroundColor: (ctx) => {
            const c = ctx.chart.ctx;
            const g = c.createLinearGradient(0, 0, 0, 60);
            const stroke = color || T.accent;
            g.addColorStop(0, stroke + "40");
            g.addColorStop(1, stroke + "00");
            return g;
          },
        }],
      },
      options: {
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderJoinStyle: "round" } },
        maintainAspectRatio: false,
        responsive: true,
      },
    });
    register(canvasId, chart);
  }

  function dualAxisRevenueGM(canvasId, series, accentColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroy(canvasId);
    const labels = series.map((p) => p.week);
    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Revenue",
            yAxisID: "y",
            data: series.map((p) => p.revenue / 1000),
            backgroundColor: T.surfaceAlt,
            borderColor: accentColor || T.accent,
            borderWidth: 0,
            borderRadius: 2,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          },
          {
            type: "line",
            label: "GM %",
            yAxisID: "y1",
            data: series.map((p) => p.gmPct),
            borderColor: accentColor || T.accent,
            backgroundColor: T.accentDim,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false,
          },
        ],
      },
      options: {
        animation: { duration: 300 },
        plugins: {
          legend: { display: true, position: "top", align: "end", labels: { boxWidth: 8, boxHeight: 8, padding: 12 } },
          tooltip: { mode: "index", intersect: false },
        },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { color: T.rule }, ticks: { color: T.mute } },
          y: { position: "left", grid: { color: T.rule }, ticks: { color: T.mute, callback: (v) => "£" + v + "k" } },
          y1: { position: "right", grid: { display: false }, ticks: { color: T.mute, callback: (v) => v + "%" } },
        },
        maintainAspectRatio: false,
      },
    });
    register(canvasId, chart);
  }

  function categoryLiftBars(canvasId, perCat) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroy(canvasId);
    const labels = perCat.map((c) => c.category);
    const values = perCat.map((c) => c.lift);
    const colors = values.map((v) => (v >= 0 ? T.accent : T.critical));
    const errorBars = perCat.map((c) => [c.ciLow, c.ciHigh]);

    // CI whiskers as an overlay dataset using floating bars
    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Lift %",
            data: values,
            backgroundColor: colors.map((c) => c + "AA"),
            borderColor: colors,
            borderWidth: 1,
            borderRadius: 2,
            order: 2,
          },
          {
            label: "95% CI",
            data: errorBars,
            backgroundColor: "transparent",
            borderColor: T.mute,
            borderWidth: 1.5,
            barPercentage: 0.06,
            categoryPercentage: 0.6,
            order: 1,
          },
        ],
      },
      options: {
        animation: { duration: 300 },
        plugins: {
          legend: { display: true, position: "top", align: "end", labels: { boxWidth: 8, boxHeight: 8, padding: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 1) {
                  const [lo, hi] = ctx.raw;
                  return `CI: ${lo.toFixed(1)}% to ${hi.toFixed(1)}%`;
                }
                return `Lift: ${ctx.parsed.y.toFixed(1)}%`;
              },
            },
          },
        },
        scales: {
          x: { grid: { color: T.rule }, ticks: { color: T.mute } },
          y: { grid: { color: T.rule }, ticks: { color: T.mute, callback: (v) => v + "%" } },
        },
        maintainAspectRatio: false,
      },
    });
    register(canvasId, chart);
  }

  function skuSparkline(canvasId, points, color) {
    spark(canvasId, points, color);
  }

  return { spark, dualAxisRevenueGM, categoryLiftBars, skuSparkline, destroy, registry, tokens: T };
})();

window.FlareCharts = FlareCharts;
window.FLARE_T = T;
