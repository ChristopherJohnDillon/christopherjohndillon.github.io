/* — Corona Clicker — a nanoflare incremental game —
   Heat the Sun's corona from the photosphere (5,800 K) toward a million+
   degrees using nanoflares. Click the Sun for energy, buy generators that
   fire nanoflares automatically, and unlock Projects (real solar-physics
   parameters) that transform the run — Paperclips-style, escalating from one
   patch of Sun to a galaxy-wide nanoflare census.
   Self-contained, no dependencies. */
(function () {
  var root = document.getElementById('corona-clicker');
  if (!root) return;

  /* ————— tunable constants ————— */
  var SAVE_KEY = 'corona-clicker';
  var T_BASE = 5800;          // photosphere, K
  var HEAT_K = 1000;          // Ttarget = T_BASE + HEAT_K * heatPower / cooling
  var T_TAU = 1.6;            // temperature response time, s
  var CLICK_TAU = 1.0;        // click-heat decay time, s
  var OFFLINE_CAP = 2 * 3600; // seconds of offline passive granted
  var AUTOSAVE_MS = 10000;

  /* ————— generators (auto nanoflare sources) ————— */
  var GENERATORS = [
    { id: 'granule', name: 'Convective granule', sub: 'photospheric bubbling jostles magnetic footpoints', baseCost: 15, rate: 0.2, low: true,
      unlock: function (S) { return true; } },
    { id: 'braid', name: 'Braided field line', sub: 'Parker (1988): convection tangles the coronal field', baseCost: 130, rate: 1.6, low: true,
      unlock: function (S) { return (S.gens.granule || 0) >= 1 || S.T >= 8000; } },
    { id: 'reconnect', name: 'Reconnection site', sub: 'tangled field snaps, releasing magnetic energy', baseCost: 1500, rate: 13,
      unlock: function (S) { return S.T >= 60000; } },
    { id: 'loop', name: 'Coronal loop', sub: 'a confined magnetic tube of hot plasma', baseCost: 17000, rate: 95,
      unlock: function (S) { return S.T >= 300000; } },
    { id: 'active', name: 'Active region', sub: 'a dense knot of loops, strong and frequent', baseCost: 190000, rate: 760,
      unlock: function (S) { return S.T >= 1000000; } },
    { id: 'storm', name: 'Nanoflare storm', sub: 'a synchronised swarm across the surface', baseCost: 2300000, rate: 7000,
      unlock: function (S) { return !!S.unlocked.storm; } },
    { id: 'mdwarf', name: 'M-dwarf', sub: 'ignite nanoflare activity on another star', baseCost: 95000000, rate: 100000,
      unlock: function (S) { return !!S.unlocked.mdwarf; } }
  ];

  /* ————— projects (one-time; appear when requires() is met, latch on reveal) ————— */
  var PROJECTS = [
    { id: 'helicity', name: 'Twist the field lines', sub: 'magnetic helicity stores more free energy → click power ×2', cost: 200,
      requires: function (S) { return (S.gens.granule || 0) >= 5; }, apply: function (m) { m.click *= 2; } },
    { id: 'bfield1', name: 'Boost field strength B', sub: 'released energy ∝ B² → all energy ×2', cost: 1100,
      requires: function (S) { return (S.gens.braid || 0) >= 1; }, apply: function (m) { m.allEnergy *= 2; } },
    { id: 'cadence', name: 'Sharpen observing cadence', sub: 'catch the faint events too → click power ×3', cost: 6500,
      requires: function (S) { return S.clicks >= 100; }, apply: function (m) { m.click *= 3; } },
    { id: 'reynolds', name: 'Lower the magnetic Reynolds number', sub: 'faster reconnection & diffusion → passive rate ×1.5', cost: 9000,
      requires: function (S) { return (S.gens.reconnect || 0) >= 1; }, apply: function (m) { m.passive *= 1.5; } },
    { id: 'powerlaw', name: 'Steepen the flare power-law (α > 2)', sub: 'Hudson (1991): low-energy nanoflares now dominate the heat budget → smallest sources ×5', cost: 42000,
      requires: function (S) { return S.T >= 100000 && (S.gens.braid || 0) >= 10; }, apply: function (m) { m.lowGen *= 5; } },
    { id: 'bfield2', name: 'Amplify the field further', sub: 'stronger B still → all energy ×2 again', cost: 70000,
      requires: function (S) { return !!S.projects.bfield1 && S.T >= 200000; }, apply: function (m) { m.allEnergy *= 2; } },
    { id: 'cooling1', name: 'Suppress radiative cooling', sub: 'ease the cooling drag → temperature climbs faster', cost: 130000,
      requires: function (S) { return S.T >= 300000; }, apply: function (m) { m.cooling *= 0.6; } },
    { id: 'alfven', name: 'Open an Alfvén-wave channel', sub: 'the wave-vs-reconnection debate, settled by adding both → +35% passive', cost: 420000,
      requires: function (S) { return (S.gens.loop || 0) >= 5; }, apply: function (m) { m.wave += 0.35; } },
    { id: 'storm', name: 'Trigger a nanoflare storm', sub: 'unlocks the nanoflare-storm generator', cost: 950000,
      requires: function (S) { return S.T >= 1000000; }, onBuy: function (S) { S.unlocked.storm = true; } },
    { id: 'cooling2', name: 'Suppress radiative cooling further', sub: 'still less loss → temperature climbs faster', cost: 2600000,
      requires: function (S) { return !!S.projects.cooling1 && S.T >= 3000000; }, apply: function (m) { m.cooling *= 0.6; } },
    { id: 'mdwarf', name: 'Point the detector at other stars', sub: 'the 2023 result — nanoflares on fully convective M-dwarfs. Unlocks the M-dwarf.', cost: 22000000,
      requires: function (S) { return S.T >= 10000000; }, onBuy: function (S) { S.unlocked.mdwarf = true; } },
    { id: 'census', name: 'Run a galactic nanoflare census', sub: 'detect every nanoflare in the galaxy, statistically → all energy ×10', cost: 6000000000,
      requires: function (S) { return (S.gens.mdwarf || 0) >= 10; }, apply: function (m) { m.allEnergy *= 10; }, onBuy: function (S) { S.won = true; } }
  ];

  /* ————— narrative milestones (temperature, K) ————— */
  var MILESTONES = [
    { t: 10000, text: 'wait — with height it should be cooling, not heating' },
    { t: 100000, text: 'transition region reached — 100,000 K' },
    { t: 1000000, text: 'corona reached — the heating problem, solved by clicking' },
    { t: 3000000, text: 'active-region corona — 3 MK' },
    { t: 10000000, text: 'flare-grade plasma — 10 MK. Time to look at other stars.' },
    { t: 1e9, text: 'a whole star lit up with nanoflares. Keep going.' },
    { t: 1e12, text: 'a galaxy of coronae, all heated. You win the coronal-heating debate.' }
  ];

  /* ————— state ————— */
  var S, m;
  function freshState() {
    return { energy: 0, clicks: 0, T: T_BASE, clickHeat: 0,
      gens: {}, projects: {}, revealed: {}, unlocked: {},
      milestoneIdx: -1, won: false, lastSave: Date.now() };
  }
  function computeMultipliers() {
    var mm = { allEnergy: 1, click: 1, passive: 1, lowGen: 1, wave: 0, cooling: 1 };
    for (var i = 0; i < PROJECTS.length; i++) {
      var p = PROJECTS[i];
      if (S.projects[p.id] && p.apply) p.apply(mm);
    }
    m = mm;
  }

  /* ————— economy ————— */
  function genById(id) { for (var i = 0; i < GENERATORS.length; i++) if (GENERATORS[i].id === id) return GENERATORS[i]; }
  function genCost(g) { return g.baseCost * Math.pow(1.15, S.gens[g.id] || 0); }
  function energyPerSec() {
    var base = 0;
    for (var i = 0; i < GENERATORS.length; i++) {
      var g = GENERATORS[i], c = S.gens[g.id] || 0;
      if (c) base += g.rate * c * (g.low ? m.lowGen : 1);
    }
    base *= m.allEnergy * m.passive;
    return base * (1 + m.wave);
  }
  function clickPower() { return 1 * m.allEnergy * m.click; }

  function buyGen(g) {
    var cost = genCost(g);
    if (S.energy >= cost) { S.energy -= cost; S.gens[g.id] = (S.gens[g.id] || 0) + 1; }
  }
  function buyProject(p) {
    if (S.projects[p.id]) return;
    if (S.energy >= p.cost) {
      S.energy -= p.cost;
      S.projects[p.id] = true;
      if (p.onBuy) p.onBuy(S);
      computeMultipliers();
      log('project: ' + p.name);
    }
  }
  function fireNanoflare() {
    var gain = clickPower();
    S.energy += gain;
    S.clickHeat += gain;
    S.clicks++;
    spawnSparks();
  }

  /* ————— simulation ————— */
  function step(dt) {
    var eps = energyPerSec();
    S.energy += eps * dt;
    S.clickHeat *= Math.exp(-dt / CLICK_TAU);
    var heat = eps + S.clickHeat;
    var target = T_BASE + HEAT_K * heat / m.cooling;
    S.T += (target - S.T) * (1 - Math.exp(-dt / T_TAU));
    if (S.T < T_BASE) S.T = T_BASE;
    for (var i = S.milestoneIdx + 1; i < MILESTONES.length; i++) {
      if (S.T >= MILESTONES[i].t) { S.milestoneIdx = i; log(MILESTONES[i].text); }
      else break;
    }
  }

  /* ————— formatting ————— */
  var UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1000) return n < 10 ? (Math.round(n * 10) / 10).toString() : Math.floor(n).toString();
    var i = Math.floor(Math.log(n) / Math.log(1000));
    if (i >= UNITS.length) return n.toExponential(2).replace('e+', 'e');
    var v = n / Math.pow(1000, i);
    return (v >= 100 ? v.toFixed(0) : v.toFixed(2)) + UNITS[i];
  }
  function tempParts(t) {
    if (t < 1e6) return { v: Math.round(t).toLocaleString('en-US'), u: 'K' };
    if (t < 1e9) return { v: (t / 1e6).toFixed(t < 1e7 ? 2 : 1), u: 'MK' };
    if (t < 1e12) return { v: (t / 1e9).toFixed(2), u: 'GK' };
    return { v: (t / 1e12).toFixed(2), u: 'TK' };
  }
  function tempStr(t) { var p = tempParts(t); return p.v + ' ' + p.u; }

  /* ————— logging (transient status line) ————— */
  var logMsg = '', logAt = 0;
  function log(msg) { logMsg = msg; logAt = Date.now(); }

  /* ————— DOM ————— */
  var el = {};
  function buildUI() {
    root.innerHTML =
      '<div class="cc-top">' +
        '<div class="cc-sun-wrap"><canvas class="cc-sun-canvas" tabindex="0" role="button" aria-label="Click the Sun to fire a nanoflare"></canvas></div>' +
        '<div class="cc-readout">' +
          '<div class="cc-temp"><span class="cc-temp-v">5,800</span> <small class="cc-temp-u">K</small></div>' +
          '<div class="cc-tempbar"><span></span></div>' +
          '<div class="cc-goal"></div>' +
          '<div class="cc-energy"><strong class="cc-e">0</strong> erg <span class="cc-rate"></span></div>' +
        '</div>' +
      '</div>' +
      '<div class="cc-cols">' +
        '<div class="cc-col"><div class="cc-col-title">Nanoflare sources</div><div class="cc-gen-list"></div></div>' +
        '<div class="cc-col"><div class="cc-col-title">Projects</div><div class="cc-proj-list"><div class="cc-empty">nothing to research yet — keep heating</div></div></div>' +
      '</div>' +
      '<div class="cc-foot"><span class="cc-log"></span><button class="cc-reset" type="button">reset</button></div>';

    el.canvas = root.querySelector('.cc-sun-canvas');
    el.tempV = root.querySelector('.cc-temp-v');
    el.tempU = root.querySelector('.cc-temp-u');
    el.bar = root.querySelector('.cc-tempbar span');
    el.goal = root.querySelector('.cc-goal');
    el.energy = root.querySelector('.cc-e');
    el.rate = root.querySelector('.cc-rate');
    el.genList = root.querySelector('.cc-gen-list');
    el.projList = root.querySelector('.cc-proj-list');
    el.projEmpty = el.projList.querySelector('.cc-empty');
    el.log = root.querySelector('.cc-log');
    el.reset = root.querySelector('.cc-reset');

    /* generator buttons (created once, shown/updated as needed) */
    for (var i = 0; i < GENERATORS.length; i++) {
      (function (g) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cc-btn cc-gen';
        b.style.display = 'none';
        b.innerHTML =
          '<div class="cc-btn-row"><span class="cc-btn-name"></span><span class="cc-btn-cost"></span></div>' +
          '<div class="cc-btn-sub"></div>' +
          '<div class="cc-btn-count"></div>';
        b.querySelector('.cc-btn-name').textContent = g.name;
        b.querySelector('.cc-btn-sub').textContent = g.sub;
        b.addEventListener('click', function () { buyGen(g); updateUI(true); });
        g._el = b;
        g._cost = b.querySelector('.cc-btn-cost');
        g._count = b.querySelector('.cc-btn-count');
        el.genList.appendChild(b);
      })(GENERATORS[i]);
    }
    /* project buttons */
    for (var j = 0; j < PROJECTS.length; j++) {
      (function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cc-btn cc-project';
        b.style.display = 'none';
        b.innerHTML =
          '<div class="cc-btn-row"><span class="cc-btn-name"></span><span class="cc-btn-cost"></span></div>' +
          '<div class="cc-btn-sub"></div>';
        b.querySelector('.cc-btn-name').textContent = p.name;
        b.querySelector('.cc-btn-sub').textContent = p.sub;
        b.addEventListener('click', function () { buyProject(p); updateUI(true); });
        p._el = b;
        p._cost = b.querySelector('.cc-btn-cost');
        el.projList.appendChild(b);
      })(PROJECTS[j]);
    }

    el.canvas.addEventListener('mousedown', function () { fireNanoflare(); });
    el.canvas.addEventListener('touchstart', function (e) { e.preventDefault(); fireNanoflare(); }, { passive: false });
    el.canvas.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') { e.preventDefault(); fireNanoflare(); }
    });
    setupReset();
  }

  var resetArmed = false, resetTimer = null;
  function setupReset() {
    el.reset.addEventListener('click', function () {
      if (!resetArmed) {
        resetArmed = true;
        el.reset.textContent = 'click again to wipe';
        resetTimer = setTimeout(function () { resetArmed = false; el.reset.textContent = 'reset'; }, 3000);
        return;
      }
      clearTimeout(resetTimer); resetArmed = false; el.reset.textContent = 'reset';
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      S = freshState(); computeMultipliers();
      for (var i = 0; i < PROJECTS.length; i++) PROJECTS[i]._el.style.display = 'none';
      log('reset — back to the photosphere');
      updateUI(true);
    });
  }

  function updateUI(force) {
    var eps = energyPerSec();
    var tp = tempParts(S.T);
    el.tempV.textContent = tp.v; el.tempU.textContent = tp.u;
    el.energy.textContent = fmt(S.energy);
    el.rate.textContent = '· ' + fmt(eps) + ' erg/s';

    /* goal + progress bar (log scale between last and next milestone) */
    var next = null;
    for (var i = 0; i < MILESTONES.length; i++) { if (S.T < MILESTONES[i].t) { next = MILESTONES[i]; break; } }
    if (S.won && !next) el.goal.textContent = '★ census complete — you win';
    else if (next) el.goal.textContent = '→ heat to ' + tempStr(next.t);
    else el.goal.textContent = 'the corona, mastered';
    var lo = S.milestoneIdx >= 0 ? MILESTONES[S.milestoneIdx].t : T_BASE;
    var hi = next ? next.t : S.T;
    var frac = hi > lo ? (Math.log(Math.max(S.T, lo)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : 1;
    el.bar.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';

    /* generators */
    for (var gI = 0; gI < GENERATORS.length; gI++) {
      var g = GENERATORS[gI];
      if (g.unlock(S)) {
        g._el.style.display = '';
        var cost = genCost(g);
        g._cost.textContent = fmt(cost) + ' erg';
        g._cost.className = 'cc-btn-cost' + (S.energy >= cost ? ' cc-afford' : '');
        var cnt = S.gens[g.id] || 0;
        g._count.textContent = cnt + ' · ' + fmt(g.rate * (g.low ? m.lowGen : 1)) + ' erg/s each';
        g._el.disabled = S.energy < cost;
      } else {
        g._el.style.display = 'none';
      }
    }
    /* projects (latch reveal) */
    var anyProj = false;
    for (var pI = 0; pI < PROJECTS.length; pI++) {
      var p = PROJECTS[pI];
      if (S.projects[p.id]) { p._el.style.display = 'none'; continue; }
      if (!S.revealed[p.id] && p.requires(S)) S.revealed[p.id] = true;
      if (S.revealed[p.id]) {
        p._el.style.display = '';
        p._cost.textContent = fmt(p.cost) + ' erg';
        p._cost.className = 'cc-btn-cost' + (S.energy >= p.cost ? ' cc-afford' : '');
        p._el.disabled = S.energy < p.cost;
        anyProj = true;
      } else {
        p._el.style.display = 'none';
      }
    }
    el.projEmpty.style.display = anyProj ? 'none' : '';

    /* log */
    var age = (Date.now() - logAt) / 1000;
    el.log.textContent = (logMsg && age < 7) ? logMsg : 'saves locally in this browser';
  }

  /* ————— sun rendering ————— */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx, cw = 0, ch = 0, dpr = 1, sparks = [];
  function fitSun() {
    var r = el.canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    el.canvas.width = Math.max(1, Math.round(r.width * dpr));
    el.canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cw = r.width; ch = r.height;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sunColor(T) {
    var loL = Math.log(5800), hiL = Math.log(1e10);
    var f = Math.max(0, Math.min(1, (Math.log(Math.max(T, 5800)) - loL) / (hiL - loL)));
    var stops = [[0, 255, 90, 20], [0.28, 255, 140, 45], [0.5, 255, 200, 120], [0.72, 255, 244, 225], [1, 190, 215, 255]];
    for (var i = 1; i < stops.length; i++) {
      if (f <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i], tt = (f - a[0]) / (b[0] - a[0]);
        return [Math.round(lerp(a[1], b[1], tt)), Math.round(lerp(a[2], b[2], tt)), Math.round(lerp(a[3], b[3], tt))];
      }
    }
    return [190, 215, 255];
  }
  function spawnSparks() {
    var n = 6;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 90;
      sparks.push({ x: 0, y: 0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.55 + Math.random() * 0.3, age: 0 });
    }
    if (sparks.length > 120) sparks.splice(0, sparks.length - 120);
  }
  function drawSun(dt, tphase) {
    ctx.clearRect(0, 0, cw, ch);
    var cx = cw / 2, cy = ch / 2;
    var loL = Math.log(5800), hiL = Math.log(1e12);
    var f = Math.max(0, Math.min(1, (Math.log(Math.max(S.T, 5800)) - loL) / (hiL - loL)));
    var col = sunColor(S.T);
    var pulse = reduced ? 0 : Math.sin(tphase * 2) * 0.02;
    var R = Math.min(cw, ch) * (0.16 + 0.10 * f + pulse);
    /* corona glow */
    var gr = R * (2.4 + 0.6 * f);
    var g = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, gr);
    g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.55)');
    g.addColorStop(0.35, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.18)');
    g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    /* core */
    var cg = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R);
    cg.addColorStop(0, 'rgba(255,255,255,0.95)');
    cg.addColorStop(0.4, 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')');
    cg.addColorStop(1, 'rgb(' + Math.round(col[0] * 0.7) + ',' + Math.round(col[1] * 0.55) + ',' + Math.round(col[2] * 0.4) + ')');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill();
    /* sparks */
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt;
      var a = 1 - s.age / s.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgb(255,' + (120 + Math.round(100 * a)) + ',40)';
      ctx.beginPath(); ctx.arc(cx + s.x, cy + s.y, 2 * a + 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /* ————— save / load ————— */
  function save() { S.lastSave = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    var raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) { S = freshState(); computeMultipliers(); return; }
    try {
      var d = JSON.parse(raw);
      S = freshState();
      for (var k in d) if (d.hasOwnProperty(k)) S[k] = d[k];
      S.gens = d.gens || {}; S.projects = d.projects || {};
      S.revealed = d.revealed || {}; S.unlocked = d.unlocked || {};
      computeMultipliers();
      /* offline passive */
      var elapsed = Math.min((Date.now() - (d.lastSave || Date.now())) / 1000, OFFLINE_CAP);
      if (elapsed > 5) {
        var gained = energyPerSec() * elapsed;
        if (gained > 0) { S.energy += gained; log('welcome back — nanoflares earned ' + fmt(gained) + ' erg while away'); }
      }
    } catch (e) { S = freshState(); computeMultipliers(); }
  }

  /* ————— loop ————— */
  var last = 0, uiAcc = 0, saveAcc = 0, phase = 0;
  function frame(ts) {
    if (!last) last = ts;
    var dt = Math.min((ts - last) / 1000, 0.25);
    last = ts; phase += dt;
    step(dt);
    drawSun(dt, phase);
    uiAcc += dt; saveAcc += dt;
    if (uiAcc >= 0.1) { updateUI(); uiAcc = 0; }
    if (saveAcc >= AUTOSAVE_MS / 1000) { save(); saveAcc = 0; }
    requestAnimationFrame(frame);
  }

  /* ————— boot ————— */
  buildUI();
  load();
  ctx = el.canvas.getContext('2d');
  fitSun();
  window.addEventListener('resize', fitSun);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  updateUI(true);
  requestAnimationFrame(frame);
})();
