/* ============================================================
   FLARE — deterministic fake-data layer
   All numbers seeded so visitors get identical figures on reload.
   ============================================================ */

/* Per-visit salt — rotates the seeded values on every page load so the
   demo doesn't look frozen, while staying internally consistent for the
   duration of a session (so switching businesses doesn't reshuffle). */
const SESSION_SALT = ((Date.now() >>> 0) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

/* mulberry32 — fast deterministic RNG, seeded once per call site */
function rng(seed) {
  let a = ((seed >>> 0) + SESSION_SALT) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   ANCHORED P&L FOR HELIOS BRANDS CO. (fictional)
   Every dashboard derives from these — keep internally consistent.
   annualRev   : £ per year
   aov         : £ average order value
   ordersPerDay: round number ≈ annualRev / 365 / aov
   skuCount    : active SKUs
   gmTarget    : %
   otifTarget  : %
   ============================================================ */
const BUSINESSES = [
  { key: "group",      name: "Group rollup",   shortName: "Group",     seed: 1001, color: "#FF4F00", currency: "£",
    annualRev: 100_000_000, aov: 58, ordersPerDay: 4720, skuCount: 1240, gmTarget: 40, otifTarget: 95,
    scaleRev: 24.0, scaleOps: 1.0 },
  { key: "trailcraft", name: "Trailcraft",     shortName: "Trailcraft", seed: 2002, color: "#3D8BFF", currency: "£",
    annualRev: 30_000_000, aov: 95, ordersPerDay: 865, skuCount: 380, gmTarget: 38, otifTarget: 94,
    scaleRev: 7.2, scaleOps: 1.05 },
  { key: "hearthline", name: "Hearthline",     shortName: "Hearthline", seed: 3003, color: "#C97EFF", currency: "£",
    annualRev: 24_000_000, aov: 62, ordersPerDay: 1060, skuCount: 240, gmTarget: 44, otifTarget: 96,
    scaleRev: 5.8, scaleOps: 1.0 },
  { key: "quill",      name: "Quill & Press",  shortName: "Quill",      seed: 4004, color: "#FFC857", currency: "£",
    annualRev: 18_000_000, aov: 42, ordersPerDay: 1175, skuCount: 310, gmTarget: 46, otifTarget: 95,
    scaleRev: 4.3, scaleOps: 0.95 },
  { key: "velora",     name: "Velora",         shortName: "Velora",     seed: 5005, color: "#16A34A", currency: "£",
    annualRev: 28_000_000, aov: 46, ordersPerDay: 1670, skuCount: 290, gmTarget: 40, otifTarget: 95,
    scaleRev: 6.7, scaleOps: 1.1 },
];

const SALES_CHANNELS = ["Shopify", "Amazon", "Wholesale", "eBay", "Retail POS"];

/* Channel mix by brand — sums to 1.0 in the order above */
const CHANNEL_MIX = {
  group:      [0.36, 0.22, 0.28, 0.08, 0.06],
  trailcraft: [0.30, 0.18, 0.40, 0.06, 0.06],
  hearthline: [0.48, 0.20, 0.18, 0.06, 0.08],
  quill:      [0.42, 0.30, 0.14, 0.08, 0.06],
  velora:     [0.32, 0.18, 0.32, 0.10, 0.08],
};

const BUSINESS_BY_KEY = Object.fromEntries(BUSINESSES.map((b) => [b.key, b]));

/* SKU category vocabularies per business */
const CATEGORIES = {
  trailcraft: ["Tents", "Sleeping", "Cooking", "Apparel", "Lighting"],
  hearthline: ["Candles", "Diffusers", "Refills", "Gift sets", "Accessories"],
  quill:      ["Notebooks", "Pens", "Paper", "Desk", "Gifts"],
  velora:     ["Coffee", "Brewers", "Accessories", "Subscriptions", "Gift sets"],
  group:      ["Outdoor", "Home", "Stationery", "Coffee"],
};

/* SKU name fragments per business */
const SKU_FRAGS = {
  trailcraft: {
    pre: ["Summit", "Ridge", "Canyon", "Alpine", "Trailhead", "Basecamp", "Northwind", "Vista", "Granite", "Ember"],
    mid: ["2P", "3P", "Pro", "Lite", "Ultra", "Trek", "Hike", "Field"],
    suf: ["Tent", "Bag", "Stove", "Jacket", "Lantern", "Pad", "Pack"],
  },
  hearthline: {
    pre: ["Amber", "Cedar", "Vetiver", "Linen", "Bergamot", "Smoke", "Hearth", "Vellum", "Tonka", "Saffron"],
    mid: ["No.1", "No.2", "No.3", "No.4", "Classic", "Reserve", "Atelier"],
    suf: ["Candle", "Diffuser", "Refill", "Set", "Mist"],
  },
  quill: {
    pre: ["Folio", "Octavo", "Quarto", "Vellum", "Atlas", "Margin", "Prefect", "Notation", "Marble", "Edition"],
    mid: ["A5", "B5", "Pocket", "Standard", "Pro", "Studio", "Field"],
    suf: ["Notebook", "Pen", "Ream", "Tray", "Set", "Refill"],
  },
  velora: {
    pre: ["Aurora", "Caldera", "Mirador", "Solana", "Highline", "Pueblo", "Cresta", "Sundial", "Lumen", "Mesa"],
    mid: ["Bright", "Dark", "Decaf", "Single", "Reserve", "House"],
    suf: ["Roast", "Espresso", "Drip", "Beans", "Subscription", "Brewer"],
  },
};

function skuCode(rand, biz) {
  const prefix = biz.shortName.slice(0, 3).toUpperCase();
  const num = Math.floor(rand() * 9000 + 1000);
  return `${prefix}-${num}`;
}

function skuName(rand, biz) {
  if (biz.key === "group") return "Aggregate"; // never displayed
  const f = SKU_FRAGS[biz.key];
  const pre = f.pre[Math.floor(rand() * f.pre.length)];
  const mid = f.mid[Math.floor(rand() * f.mid.length)];
  const suf = f.suf[Math.floor(rand() * f.suf.length)];
  return `${pre} ${mid} ${suf}`;
}

/* Generate ~80 SKUs for a business */
function generateSkus(biz) {
  if (biz.key === "group") {
    // Group sees the union — pull from each child
    const all = [];
    for (const k of ["trailcraft", "hearthline", "quill", "velora"]) {
      all.push(...generateSkus(BUSINESS_BY_KEY[k]).slice(0, 22));
    }
    return all;
  }
  const r = rng(biz.seed + 11);
  const cats = CATEGORIES[biz.key];
  const out = [];
  for (let i = 0; i < 80; i++) {
    const cat = cats[Math.floor(r() * cats.length)];
    const code = skuCode(r, biz);
    const name = skuName(r, biz);
    const marginPct = 25 + r() * 35; // 25–60
    const velocity = Math.floor(5 + r() * 195); // 5–200 units/week
    const daysCover = Math.floor(7 + r() * 90); // 7–97 days
    const lastStockoutDaysAgo = r() < 0.18 ? Math.floor(r() * 60) : null;
    const revenueYTD = Math.floor(velocity * (50 + r() * 250) * 12 * biz.scaleOps);
    const unitsYTD = Math.floor(velocity * (35 + r() * 17));
    const returnRate = r() * 0.06;
    const avgBasket = 1.4 + r() * 2.6;
    let status = "positive";
    if (lastStockoutDaysAgo !== null && lastStockoutDaysAgo < 14) status = "critical";
    else if (daysCover < 14 || marginPct < 30) status = "warning";
    out.push({
      sku: code, name, category: cat, marginPct, velocity, daysCover,
      lastStockoutDaysAgo, revenueYTD, unitsYTD, returnRate, avgBasket, status,
    });
  }
  return out;
}

/* Time series — 24 weeks of revenue + GM% */
function generateTimeSeries(biz) {
  const r = rng(biz.seed + 22);
  const weeks = 24;
  const baseRev = biz.scaleRev * 80000; // weekly base
  const baseGm = biz.gmTarget;
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const seasonal = 1 + 0.18 * Math.sin((w / weeks) * Math.PI * 2 + biz.seed);
    const noise = 0.92 + r() * 0.16;
    const trend = 1 + (w / weeks) * 0.08;
    const rev = baseRev * seasonal * noise * trend;
    const gm = baseGm + (r() - 0.5) * 3.2;
    const label = `W${String(w + 1).padStart(2, "0")}`;
    out.push({ week: label, revenue: rev, gmPct: gm });
  }
  return out;
}

/* Top movers — derived from SKUs with synthetic deltas */
function generateTopMovers(biz) {
  const skus = generateSkus(biz);
  const r = rng(biz.seed + 33);
  const decorated = skus.map((s) => ({ ...s, delta: (r() - 0.5) * 80 }));
  decorated.sort((a, b) => b.delta - a.delta);
  return { up: decorated.slice(0, 5), down: decorated.slice(-5).reverse() };
}

/* KPIs */
function generateKpis(biz) {
  const r = rng(biz.seed + 44);
  const ts = generateTimeSeries(biz);
  const last4 = ts.slice(-4);
  const prev4 = ts.slice(-12, -8);
  const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
  const rev = sum(last4, "revenue");
  const revPrev = sum(prev4, "revenue") || 1;
  const revDelta = ((rev - revPrev) / revPrev) * 100;

  const gm = ts.slice(-4).reduce((s, x) => s + x.gmPct, 0) / 4;
  const gmDelta = gm - biz.gmTarget;

  const otif = biz.otifTarget + (r() - 0.6) * 4;
  const otifDelta = otif - biz.otifTarget;

  const stockouts = Math.floor(8 + r() * 22);
  const stockoutsDelta = (r() - 0.65) * 30;

  const spark = (offset) =>
    ts.slice(-12).map((p) => p.revenue * (0.9 + ((p.week.charCodeAt(2) + offset) % 7) / 50));

  return [
    { label: "Revenue · last 4w", value: `${biz.currency}${(rev / 1000).toFixed(0)}k`, delta: revDelta, spark: spark(0) },
    { label: "Gross margin", value: `${gm.toFixed(1)}%`, delta: gmDelta, spark: spark(1) },
    { label: "OTIF", value: `${otif.toFixed(1)}%`, delta: otifDelta, spark: spark(2) },
    { label: "Active stockouts", value: `${stockouts}`, delta: -stockoutsDelta, sparkInvert: true, spark: spark(3) },
  ];
}

/* Traffic-light status per business (for exec rollup row) */
function generateStatusRow() {
  return BUSINESSES.filter((b) => b.key !== "group").map((b) => {
    const r = rng(b.seed + 55);
    const otif = b.otifTarget + (r() - 0.55) * 4;
    const gm = b.gmTarget + (r() - 0.5) * 3;
    let status = "positive";
    if (otif < b.otifTarget - 1.5 || gm < b.gmTarget - 1.5) status = "critical";
    else if (otif < b.otifTarget - 0.5 || gm < b.gmTarget - 0.5) status = "warning";
    const statusText = status === "positive" ? "On target" : status === "warning" ? "Near target" : "Below target";
    return {
      key: b.key,
      name: b.name,
      status,
      statusText,
      sub: `OTIF ${otif.toFixed(1)}% · GM ${gm.toFixed(1)}%`,
    };
  });
}

/* Warehouse heatmap — 20×12 grid of bins */
function generateWarehouse(biz) {
  const r = rng(biz.seed + 66);
  const rows = 12, cols = 20;
  const bins = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const aisle = String.fromCharCode(65 + Math.floor(col / 4)); // A–E aisles
      const slot = `${aisle}${row + 1}-${(col % 4) + 1}`;
      // Hot zones near front, cold near back (with noise)
      const distFromFront = row / rows;
      const base = 1 - distFromFront * 0.55;
      const utilisation = Math.max(0, Math.min(1, base * (0.55 + r() * 0.55) + (r() - 0.5) * 0.18));
      const lastPickedDays = Math.floor(r() * (utilisation > 0.6 ? 4 : 18));
      const skuCount = Math.floor(utilisation * 18 + 1);
      bins.push({ row, col, aisle, slot, utilisation, lastPickedDays, skuCount });
    }
  }
  return { rows, cols, bins };
}

/* SKU list within a bin */
function generateBinContents(biz, bin) {
  const r = rng(biz.seed + bin.row * 1000 + bin.col);
  const skus = generateSkus(biz);
  const out = [];
  for (let i = 0; i < Math.min(5, bin.skuCount); i++) {
    const s = skus[Math.floor(r() * skus.length)];
    out.push({ sku: s.sku, name: s.name, picks30d: Math.floor(r() * 60 + 5) });
  }
  return out;
}

/* Statistical view — promo periods + comparison data */
function generatePromos(biz) {
  if (biz.key === "group") {
    return [
      { id: "g1", label: "Group · Q1 cross-brand promo" },
      { id: "g2", label: "Group · Bundle Friday wave" },
      { id: "g3", label: "Group · Loyalty boost week" },
    ];
  }
  const labels = {
    trailcraft: ["May Tent Promo", "Apparel discount window", "Lantern bundle wave"],
    hearthline: ["Candle gift-set wave", "Refill subscription push", "Atelier launch"],
    quill:      ["Back-to-desk promo", "Pen bundle wave", "Notebook clearance"],
    velora:     ["Single-origin launch", "Brewer + beans bundle", "Subscription push"],
  };
  return labels[biz.key].map((l, i) => ({ id: `${biz.key}-${i}`, label: `${biz.name} · ${l}` }));
}

function generateStatTest(biz, promoIdx) {
  const r = rng(biz.seed + 77 + (promoIdx || 0) * 13);
  const preMean = 38 + r() * 22; // basket value
  const postMean = preMean * (1.02 + r() * 0.18 - 0.04);
  const preCi = preMean * (0.04 + r() * 0.02);
  const postCi = postMean * (0.04 + r() * 0.02);
  const pValue = Math.max(0.0001, Math.min(0.49, Math.abs(r() - 0.35) ** 1.5));
  const n = Math.floor(800 + r() * 4200);
  const sig = pValue < 0.05;

  const cats = CATEGORIES[biz.key];
  const perCat = cats.map((cat) => {
    const lift = (r() - 0.35) * 28;
    const ci = 4 + r() * 6;
    return { category: cat, lift, ciLow: lift - ci, ciHigh: lift + ci };
  });
  return { preMean, postMean, preCi, postCi, pValue, n, sig, perCat };
}

/* Bundle / affinity matrix */
function generateBundle(biz) {
  const r = rng(biz.seed + 88);
  const skus = generateSkus(biz).slice(0, 12);
  const n = skus.length;
  const matrix = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      if (i === j) row.push(null);
      else {
        // Symmetric — seed by min/max
        const s = rng(biz.seed + Math.min(i, j) * 31 + Math.max(i, j))();
        row.push(0.6 + s * 2.8); // lift 0.6–3.4
      }
    }
    matrix.push(row);
  }
  // Top pairs by lift
  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push({ a: skus[i], b: skus[j], lift: matrix[i][j], freq: Math.floor(r() * 400 + 30) });
    }
  }
  pairs.sort((a, b) => b.lift * b.freq - a.lift * a.freq);
  return { skus, matrix, topPairs: pairs.slice(0, 10) };
}

/* ============================================================
   SALES TRACKER — today/yesterday/WTD/MTD, channel split
   Numbers anchored to annualRev so they reconcile with Exec/SKU.
   ============================================================ */
function generateSales(biz, period, channelFilter) {
  const r = rng(biz.seed + 99);
  const dailyAvg = biz.annualRev / 365;
  const days = { today: 0, yesterday: 1, wtd: new Date().getDay() || 7, mtd: new Date().getDate() }[period] || 0;
  // For "today" / "yesterday" we want a single-day actual; for WTD/MTD a multi-day sum.
  const span = period === "today" || period === "yesterday" ? 1 : days;
  // Daily seasonality: weekdays > weekends; small day-of-week noise
  let actual = 0;
  for (let d = 0; d < Math.max(1, span); d++) {
    const dow = (new Date().getDay() + 7 - d) % 7;
    const dowMul = [0.78, 1.05, 1.10, 1.08, 1.06, 1.02, 0.91][dow]; // Sun..Sat
    const noise = 0.92 + r() * 0.16;
    actual += dailyAvg * dowMul * noise;
  }
  // Forecast = clean expected for the span (no noise)
  let forecast = 0;
  for (let d = 0; d < Math.max(1, span); d++) {
    const dow = (new Date().getDay() + 7 - d) % 7;
    forecast += dailyAvg * [0.78, 1.05, 1.10, 1.08, 1.06, 1.02, 0.91][dow];
  }
  const mix = CHANNEL_MIX[biz.key] || CHANNEL_MIX.group;
  const channels = SALES_CHANNELS.map((c, i) => ({
    channel: c,
    revenue: actual * mix[i] * (0.93 + r() * 0.14),
    orders: Math.floor(biz.ordersPerDay * span * mix[i] * (0.95 + r() * 0.1)),
  }));
  // Normalise channels back to total
  const sum = channels.reduce((s, c) => s + c.revenue, 0);
  channels.forEach((c) => (c.revenue *= actual / sum));
  // Filter if requested
  const filteredChans = channelFilter && channelFilter !== "All"
    ? channels.filter((c) => c.channel === channelFilter)
    : channels;
  const filteredActual = filteredChans.reduce((s, c) => s + c.revenue, 0);
  const filteredOrders = filteredChans.reduce((s, c) => s + c.orders, 0);
  const filteredForecast = forecast * (filteredActual / actual || 1);
  // Hourly profile (for "today" view)
  const hourly = [];
  for (let h = 0; h < 24; h++) {
    const shape = h < 7 ? 0.1 : h < 10 ? 0.4 : h < 12 ? 0.7 : h < 14 ? 1.0 : h < 17 ? 0.9 : h < 20 ? 0.85 : h < 22 ? 0.55 : 0.25;
    hourly.push({
      hour: `${String(h).padStart(2, "0")}:00`,
      revenue: (filteredActual / 24) * shape * 2.2 * (0.9 + r() * 0.2),
    });
  }
  // Per-brand strip (group view)
  const perBrand = BUSINESSES.filter((b) => b.key !== "group").map((b) => {
    const br = rng(b.seed + 199);
    const bDaily = b.annualRev / 365;
    let bActual = 0, bForecast = 0;
    for (let d = 0; d < Math.max(1, span); d++) {
      const dow = (new Date().getDay() + 7 - d) % 7;
      const dowMul = [0.78, 1.05, 1.10, 1.08, 1.06, 1.02, 0.91][dow];
      bActual += bDaily * dowMul * (0.92 + br() * 0.16);
      bForecast += bDaily * dowMul;
    }
    return { key: b.key, name: b.name, color: b.color, actual: bActual, forecast: bForecast, attainment: bActual / bForecast };
  });
  return { period, span, actual: filteredActual, forecast: filteredForecast,
    orders: filteredOrders, channels, hourly, perBrand };
}

/* ============================================================
   OPEN ORDER PIPELINE — stage waterfall + aging
   ============================================================ */
const ORDER_STAGES = ["Placed", "Picking", "Packing", "Awaiting carrier", "In transit"];

function generateOrderPipeline(biz, stageFilter, agingFilter) {
  const r = rng(biz.seed + 144);
  // Open orders ≈ 2.4 days of throughput on average
  const totalOpen = Math.floor(biz.ordersPerDay * 2.4 * (0.92 + r() * 0.16));
  // Distribution across stages (sums to 1.0)
  const stageDist = [0.32, 0.18, 0.16, 0.12, 0.22];
  const stages = ORDER_STAGES.map((name, i) => ({
    stage: name,
    count: Math.floor(totalOpen * stageDist[i] * (0.92 + r() * 0.16)),
  }));
  // Aging buckets across the whole pipeline
  const agingDist = [0.46, 0.28, 0.14, 0.08, 0.04]; // <1d, 1-2d, 2-4d, 4-7d, >7d
  const agingLabels = ["<1d", "1–2d", "2–4d", "4–7d", ">7d"];
  const aging = agingLabels.map((label, i) => ({
    bucket: label,
    count: Math.floor(totalOpen * agingDist[i] * (0.92 + r() * 0.16)),
  }));
  // Queue table — top 20 oldest orders
  const queue = [];
  const mix = CHANNEL_MIX[biz.key] || CHANNEL_MIX.group;
  const cumMix = mix.reduce((acc, m, i) => { acc.push((acc[i - 1] || 0) + m); return acc; }, []);
  for (let i = 0; i < 24; i++) {
    const stageIdx = Math.floor(r() * 5);
    const stage = ORDER_STAGES[stageIdx];
    const ageDays = (4 + r() * 8) - i * 0.06; // older first
    const cm = r();
    const chanIdx = cumMix.findIndex((c) => c >= cm);
    const channel = SALES_CHANNELS[chanIdx === -1 ? 0 : chanIdx];
    const lines = Math.floor(1 + r() * 4);
    const value = biz.aov * (0.6 + r() * 2.4);
    queue.push({
      id: `${biz.shortName.slice(0, 3).toUpperCase()}-${100000 + Math.floor(r() * 899999)}`,
      stage, channel, ageDays, lines, value,
    });
  }
  queue.sort((a, b) => b.ageDays - a.ageDays);
  // Apply filters
  let filteredQueue = queue;
  if (stageFilter && stageFilter !== "All") filteredQueue = filteredQueue.filter((q) => q.stage === stageFilter);
  if (agingFilter && agingFilter !== "All") {
    filteredQueue = filteredQueue.filter((q) => {
      const a = q.ageDays;
      if (agingFilter === "<1d") return a < 1;
      if (agingFilter === "1–2d") return a >= 1 && a < 2;
      if (agingFilter === "2–4d") return a >= 2 && a < 4;
      if (agingFilter === "4–7d") return a >= 4 && a < 7;
      if (agingFilter === ">7d") return a >= 7;
      return true;
    });
  }
  return { totalOpen, stages, aging, queue: filteredQueue.slice(0, 20) };
}

/* Public API */
const FlareData = {
  businesses: BUSINESSES,
  business: (key) => BUSINESS_BY_KEY[key] || BUSINESS_BY_KEY.group,
  skus: generateSkus,
  timeSeries: generateTimeSeries,
  topMovers: generateTopMovers,
  kpis: generateKpis,
  statusRow: generateStatusRow,
  warehouse: generateWarehouse,
  binContents: generateBinContents,
  promos: generatePromos,
  statTest: generateStatTest,
  bundle: generateBundle,
  sales: generateSales,
  orderPipeline: generateOrderPipeline,
  channels: SALES_CHANNELS,
  orderStages: ORDER_STAGES,
  categories: (bizKey) => CATEGORIES[bizKey] || CATEGORIES.group,
};

FlareData.salt = SESSION_SALT;
window.FlareData = FlareData;
