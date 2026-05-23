/* ============================================================
   FLARE — deterministic fake-data layer
   All numbers seeded so visitors get identical figures on reload.
   ============================================================ */

/* mulberry32 — fast deterministic RNG */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUSINESSES = [
  { key: "group",      name: "Group rollup",   shortName: "Group",     seed: 1001, color: "#FF4F00", currency: "£", scaleRev: 18.5, scaleOps: 1.0,  gmTarget: 42, otifTarget: 95 },
  { key: "trailcraft", name: "Trailcraft",     shortName: "Trailcraft", seed: 2002, color: "#3D8BFF", currency: "£", scaleRev: 5.2,  scaleOps: 1.05, gmTarget: 38, otifTarget: 94 },
  { key: "hearthline", name: "Hearthline",     shortName: "Hearthline", seed: 3003, color: "#C97EFF", currency: "£", scaleRev: 4.1,  scaleOps: 1.0,  gmTarget: 44, otifTarget: 96 },
  { key: "quill",      name: "Quill & Press",  shortName: "Quill",      seed: 4004, color: "#FFC857", currency: "£", scaleRev: 3.4,  scaleOps: 0.95, gmTarget: 46, otifTarget: 95 },
  { key: "velora",     name: "Velora",         shortName: "Velora",     seed: 5005, color: "#16A34A", currency: "£", scaleRev: 5.8,  scaleOps: 1.1,  gmTarget: 40, otifTarget: 95 },
];

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
  categories: (bizKey) => CATEGORIES[bizKey] || CATEGORIES.group,
};

window.FlareData = FlareData;
