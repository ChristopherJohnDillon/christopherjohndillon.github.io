(function () {
  var canvas = document.getElementById('pascal-chart');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;

  /* Colours — International Orange, matching the real app */
  var IO = '#FF4F00';
  var GRID = 'rgba(255,255,255,0.06)';
  var TEXT_DIM = 'rgba(255,255,255,0.35)';
  var BG = '#000000';

  /* 12-hour pressure data — realistic falling front */
  var BASE_PRESSURE = 1027;
  var END_PRESSURE = 1013;
  var NUM_POINTS = 144;
  var pressureData = [];
  var time = 0;
  var isAltMode = false;

  function generatePressureCurve() {
    pressureData = [];
    for (var i = 0; i < NUM_POINTS; i++) {
      var t = i / (NUM_POINTS - 1);
      /* Match the screenshot: starts flat-ish at top, gentle concave descent,
         steepens slightly in the middle, then levels off a bit at the end */
      var fall = 0.15 * t + 0.85 * Math.pow(t, 1.8);
      var base = BASE_PRESSURE - (BASE_PRESSURE - END_PRESSURE) * fall;
      /* Small natural wobble — not too noisy */
      var noise = Math.sin(i * 0.4) * 0.2 + Math.sin(i * 1.1) * 0.1;
      pressureData.push(base + noise);
    }
  }

  generatePressureCurve();

  /* Altitude data */
  var altData = [];
  function generateAltitudeCurve() {
    altData = [];
    for (var i = 0; i < NUM_POINTS; i++) {
      var t = i / (NUM_POINTS - 1);
      var base = 53;
      var walk = Math.sin(t * 4) * 3 + Math.sin(t * 7) * 1.5 + Math.cos(t * 11) * 0.8;
      var bump = Math.exp(-Math.pow((t - 0.6) * 8, 2)) * 8;
      altData.push(base + walk + bump);
    }
  }
  generateAltitudeCurve();


  function fitCanvas() {
    var r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return r;
  }

  /* Shared grid + axis drawing */
  function drawGrid(w, h, ml, mr, mt, mb, pw, ph, yMin, yMax, yTopLabel, yBotLabel, timeLabels) {
    /* Horizontal dashed grid — 5 evenly spaced lines */
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (var g = 0; g < 5; g++) {
      var frac = g / 4;
      var gy = mt + ph * frac;
      ctx.beginPath();
      ctx.moveTo(ml, gy);
      ctx.lineTo(ml + pw, gy);
      ctx.stroke();
    }

    /* Vertical dashed grid */
    for (var v = 0; v < timeLabels.length; v++) {
      var vx = ml + pw * timeLabels[v].t;
      ctx.beginPath();
      ctx.moveTo(vx, mt);
      ctx.lineTo(vx, mt + ph);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Y-axis labels — top-left and bottom-left like the real app */
    ctx.font = '10px "SF Mono", Menlo, Monaco, monospace';
    ctx.fillStyle = TEXT_DIM;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(yTopLabel, ml - 6, mt + 4);
    ctx.fillText(yBotLabel, ml - 6, mt + ph - 4);

    /* X-axis labels */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var x = 0; x < timeLabels.length; x++) {
      ctx.fillText(timeLabels[x].label, ml + pw * timeLabels[x].t, mt + ph + 6);
    }
  }

  /* Draw dots — the real app renders individual data points, not a connected line */
  function drawDots(data, w, h, ml, mr, mt, mb, pw, ph, yMin, yMax, numVisible) {
    var yRange = yMax - yMin;

    for (var i = 0; i < numVisible; i += 2) {
      var px = ml + pw * (i / (NUM_POINTS - 1));
      var py = mt + ph * (1 - (data[i] - yMin) / yRange);
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = IO;
      ctx.fill();
    }

    /* Endpoint dot — slightly larger than the data dots */
    if (numVisible > 1) {
      var lastI = Math.min(numVisible - 1, NUM_POINTS - 1);
      var lx = ml + pw * (lastI / (NUM_POINTS - 1));
      var ly = mt + ph * (1 - (data[lastI] - yMin) / yRange);
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = IO;
      ctx.fill();
    }
  }

  var timeLabels = [
    { t: 0, label: '-12H' },
    { t: 0.25, label: '-9H' },
    { t: 0.5, label: '-6H' },
    { t: 0.75, label: '-3H' },
    { t: 1, label: '...' }
  ];

  function drawChart() {
    var r = fitCanvas();
    var w = r.width, h = r.height;
    var ml = 38, mr = 8, mt = 6, mb = 22;
    var pw = w - ml - mr;
    var ph = h - mt - mb;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    var visiblePoints = Math.min(NUM_POINTS, Math.floor(time * 120));
    if (visiblePoints < 2) visiblePoints = 2;

    if (isAltMode) {
      var aMin = 30, aMax = 75;
      drawGrid(w, h, ml, mr, mt, mb, pw, ph, aMin, aMax, '72', '32', timeLabels);
      drawDots(altData, w, h, ml, mr, mt, mb, pw, ph, aMin, aMax, NUM_POINTS);
    } else {
      var pMin = END_PRESSURE - 2;
      var pMax = BASE_PRESSURE + 2;
      drawGrid(w, h, ml, mr, mt, mb, pw, ph, pMin, pMax, '1027', '1012', timeLabels);
      drawDots(pressureData, w, h, ml, mr, mt, mb, pw, ph, pMin, pMax, visiblePoints);
    }
  }

  /* Animation loop — only animates the initial draw-in, then stays static */
  function tick() {
    time += 0.016;
    drawChart();
    /* Stop animating once all points are visible */
    if (time * 120 < NUM_POINTS + 10) {
      requestAnimationFrame(tick);
    }
  }

  /* Set DOM readout once from generated data */
  function updateReadout() {
    var p = pressureData[NUM_POINTS - 1];
    var el = document.getElementById('pascal-reading');
    if (el) el.textContent = p.toFixed(1);
    var p3h = pressureData[Math.floor(NUM_POINTS * 0.75)];
    var p6h = pressureData[Math.floor(NUM_POINTS * 0.5)];
    var d3 = (p - p3h).toFixed(1);
    var d6 = (p - p6h).toFixed(1);
    var el3 = document.getElementById('pascal-d3h');
    var el6 = document.getElementById('pascal-d6h');
    if (el3) el3.textContent = (d3 > 0 ? '+' : '') + d3;
    if (el6) el6.textContent = (d6 > 0 ? '+' : '') + d6;
  }

  /* Tab switching */
  var pressureTab = document.getElementById('pascal-tab-pressure');
  var altTab = document.getElementById('pascal-tab-altitude');

  function switchMode(mode) {
    isAltMode = (mode === 'altitude');
    if (pressureTab && altTab) {
      pressureTab.classList.toggle('active', !isAltMode);
      altTab.classList.toggle('active', isAltMode);
    }
    var readoutUnit = document.getElementById('pascal-unit');
    var readoutEl = document.getElementById('pascal-reading');
    var d3El = document.getElementById('pascal-d3h');
    var d6El = document.getElementById('pascal-d6h');
    var warnEl = document.getElementById('pascal-d6h-warn');
    if (isAltMode) {
      if (readoutUnit) readoutUnit.textContent = 'M';
      if (readoutEl) readoutEl.textContent = '53';
      if (d3El) d3El.textContent = '+0';
      if (d6El) d6El.textContent = '+1';
      if (warnEl) warnEl.style.display = 'none';
    } else {
      if (readoutUnit) readoutUnit.textContent = 'HPA';
      if (warnEl) warnEl.style.display = '';
    }
  }

  if (pressureTab) pressureTab.addEventListener('click', function () { switchMode('pressure'); });
  if (altTab) altTab.addEventListener('click', function () { switchMode('altitude'); });

  tick();
  updateReadout();
})();
