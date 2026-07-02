/* Shared reading/watching charts. Bespoke inline SVG + vanilla interactions.
   Attaches window.ReadingCharts. No dependencies. */
(function () {
  var cs = getComputedStyle(document.documentElement);
  var DIM = cs.getPropertyValue('--dim').trim();
  var MUTE = cs.getPropertyValue('--mute').trim();
  var ACCENT = cs.getPropertyValue('--nanoflare').trim();
  var MONO = 'var(--f-mono)';

  // ---- pure helpers (also used by node test) ----
  function niceMax(v, step) { return Math.max(step, Math.ceil(v / step) * step); }
  function binCounts(values, edges) {
    // edges of length N produce N bins: [e0,e1),[e1,e2),...,[e(N-1), Infinity)
    var counts = edges.map(function () { return 0; });
    values.forEach(function (v) {
      for (var i = 0; i < edges.length; i++) {
        var hi = (i + 1 < edges.length) ? edges[i + 1] : Infinity;
        if (v >= edges[i] && v < hi) { counts[i]++; break; }
      }
    });
    return counts;
  }

  // ---- hover card (singleton) ----
  var card;
  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'chart-hover-card';
    card.style.display = 'none';
    document.body.appendChild(card);
    return card;
  }
  function showCard(pt, clientX, clientY) {
    var c = ensureCard();
    var img = pt.img ? '<img src="' + pt.img + '" alt="" onerror="this.style.display=\'none\'"/>' : '';
    c.innerHTML = img + '<div class="chc-text"><div class="chc-title">' + pt.title +
      '</div><div class="chc-sub">' + (pt.sub || '') + '</div>' +
      '<div class="chc-date">' + (pt.date || '') + '</div></div>';
    c.style.display = 'flex';
    // position, flipping to stay on-screen
    var w = c.offsetWidth, h = c.offsetHeight, pad = 14;
    var x = clientX + pad, y = clientY + pad;
    if (x + w > window.innerWidth) x = clientX - w - pad;
    if (y + h > window.innerHeight) y = clientY - h - pad;
    c.style.left = (x + window.scrollX) + 'px';
    c.style.top = (y + window.scrollY) + 'px';
  }
  function hideCard() { if (card) card.style.display = 'none'; }

  // ---- scatter with hover + drag-to-zoom + reset ----
  function scatter(elId, points, opts) {
    var el = document.getElementById(elId);
    if (!el || !points.length) return;
    opts = opts || {};
    var yMax = opts.yMax || niceMax(Math.max.apply(null, points.map(function (p) { return p.y; })), opts.yStep || 1);
    var fullMin = Math.min.apply(null, points.map(function (p) { return p.t; }));
    var fullMax = Math.max.apply(null, points.map(function (p) { return p.t; }));
    var domain = { min: fullMin, max: fullMax };
    var ctx = {};                 // current render context: {svgEl, band, pad, pw}
    var drag = { on: false, startX: 0 };

    function render() {
      var W = el.offsetWidth || 320, H = 220;
      var pad = { top: 18, right: 16, bottom: 40, left: 48 };
      var pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
      var span = (domain.max - domain.min) || 1;
      function xPos(t) { return pad.left + (t - domain.min) / span * pw; }
      function yPos(y) { return pad.top + ph - (y / yMax * ph); }
      var svg = '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      for (var t = 0; t <= yMax; t += (opts.yStep || Math.max(1, Math.round(yMax / 5)))) {
        var ty = yPos(t);
        svg += '<line x1="' + pad.left + '" y1="' + ty + '" x2="' + (W - pad.right) + '" y2="' + ty + '" stroke="' + DIM + '" stroke-opacity="0.3" stroke-width="0.5"/>';
        svg += '<text x="' + (pad.left - 8) + '" y="' + (ty + 4) + '" text-anchor="end" font-size="11" font-family="' + MONO + '" fill="' + DIM + '">' + t + '</text>';
      }
      svg += '<text x="10" y="' + (pad.top + ph / 2) + '" text-anchor="middle" font-size="11" font-family="' + MONO + '" fill="' + MUTE + '" transform="rotate(-90,10,' + (pad.top + ph / 2) + ')">' + (opts.yLabel || '') + '</text>';
      var minY = new Date(domain.min).getFullYear(), maxY = new Date(domain.max).getFullYear();
      for (var yr = minY; yr <= maxY; yr++) {
        var xd = xPos(new Date(yr, 0, 1).getTime());
        if (xd >= pad.left && xd <= W - pad.right) {
          svg += '<line x1="' + xd + '" y1="' + pad.top + '" x2="' + xd + '" y2="' + (H - pad.bottom) + '" stroke="' + DIM + '" stroke-opacity="0.25" stroke-width="0.5"/>';
          svg += '<text x="' + xd + '" y="' + (H - pad.bottom + 16) + '" text-anchor="middle" font-size="12" font-family="' + MONO + '" fill="' + DIM + '">' + yr + '</text>';
        }
      }
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (p.t < domain.min || p.t > domain.max) continue;
        var r = 2 + Math.sqrt(p.y / yMax) * 4.5;
        svg += '<circle class="chart-dot" data-i="' + i + '" cx="' + xPos(p.t) + '" cy="' + yPos(p.y) + '" r="' + r + '" fill="' + ACCENT + '" opacity="0.85"/>';
      }
      svg += '<rect class="chart-zoom-band" x="0" y="' + pad.top + '" width="0" height="' + ph + '" style="display:none"/>';
      svg += '</svg>';
      el.innerHTML = svg;
      var svgEl = el.querySelector('svg');
      ctx.svgEl = svgEl;
      ctx.band = svgEl.querySelector('.chart-zoom-band');
      ctx.pad = pad;
      ctx.pw = pw;
      wireDots(svgEl);
      wireDrag(svgEl);
    }

    function wireDots(svgEl) {
      svgEl.querySelectorAll('.chart-dot').forEach(function (dot) {
        dot.addEventListener('mouseenter', function (e) {
          dot.setAttribute('r', parseFloat(dot.getAttribute('r')) + 3);
          dot.setAttribute('opacity', '1');
          showCard(points[+dot.getAttribute('data-i')], e.clientX, e.clientY);
        });
        dot.addEventListener('mousemove', function (e) {
          showCard(points[+dot.getAttribute('data-i')], e.clientX, e.clientY);
        });
        dot.addEventListener('mouseleave', function () {
          dot.setAttribute('r', parseFloat(dot.getAttribute('r')) - 3);
          dot.setAttribute('opacity', '0.85');
          hideCard();
        });
        dot.addEventListener('click', function (e) {
          showCard(points[+dot.getAttribute('data-i')], e.clientX, e.clientY);
        });
      });
    }

    function wireDrag(svgEl) {
      function localX(e) { return e.clientX - svgEl.getBoundingClientRect().left; }
      svgEl.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('chart-dot')) return;
        drag.on = true; drag.startX = localX(e);
        ctx.band.style.display = '';
        ctx.band.setAttribute('x', drag.startX); ctx.band.setAttribute('width', 0);
        hideCard();
      });
      svgEl.addEventListener('mousemove', function (e) {
        if (!drag.on) return;
        var cx = localX(e), x0 = Math.min(drag.startX, cx), w = Math.abs(cx - drag.startX);
        ctx.band.setAttribute('x', x0); ctx.band.setAttribute('width', w);
      });
      svgEl.addEventListener('dblclick', function () {
        domain.min = fullMin; domain.max = fullMax; render();
      });
    }

    function onUp(e) {
      if (!drag.on) return;
      drag.on = false;
      if (ctx.band) ctx.band.style.display = 'none';
      var svgEl = ctx.svgEl;
      var cx = e.clientX - svgEl.getBoundingClientRect().left;
      var x0 = Math.min(drag.startX, cx), x1 = Math.max(drag.startX, cx);
      if (x1 - x0 < 6) return;
      var pad = ctx.pad, pw = ctx.pw;
      function tAt(px) { return domain.min + (px - pad.left) / pw * (domain.max - domain.min); }
      var nMin = Math.max(domain.min, tAt(x0)), nMax = Math.min(domain.max, tAt(x1));
      if (nMax > nMin) { domain.min = nMin; domain.max = nMax; render(); }
    }

    render();
    if (!el._rcWired) {
      el._rcWired = true;
      window.addEventListener('mouseup', onUp);
      window.addEventListener('resize', render);
    }
  }

  // ---- bars (books/films per year) ----
  function bars(elId, series, opts) {
    var el = document.getElementById(elId);
    if (!el || !series.length) return;
    opts = opts || {};
    function render() {
      var W = el.offsetWidth || 320, H = 155;
      var pad = { top: 18, right: 16, bottom: 40, left: 48 };
      var pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
      var yMax = niceMax(Math.max.apply(null, series.map(function (d) { return d.count; })), opts.yStep || 10);
      var slot = pw / series.length;
      var barW = Math.min(slot - 6, 64);   // cap so a lone/sparse bar reads as a bar, not a block
      var svg = '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      for (var t = 0; t <= yMax; t += (opts.yStep || 10)) {
        var ty = pad.top + ph - (t / yMax * ph);
        svg += '<line x1="' + pad.left + '" y1="' + ty + '" x2="' + (W - pad.right) + '" y2="' + ty + '" stroke="' + DIM + '" stroke-opacity="0.3" stroke-width="0.5"/>';
        svg += '<text x="' + (pad.left - 8) + '" y="' + (ty + 4) + '" text-anchor="end" font-size="11" font-family="' + MONO + '" fill="' + DIM + '">' + t + '</text>';
      }
      svg += '<text x="10" y="' + (pad.top + ph / 2) + '" text-anchor="middle" font-size="11" font-family="' + MONO + '" fill="' + MUTE + '" transform="rotate(-90,10,' + (pad.top + ph / 2) + ')">' + (opts.yLabel || '') + '</text>';
      for (var i = 0; i < series.length; i++) {
        var cx = pad.left + i * slot + slot / 2;   // centre of this slot
        var bh = series[i].count / yMax * ph, by = pad.top + ph - bh;
        svg += '<rect x="' + (cx - barW / 2) + '" y="' + by + '" width="' + barW + '" height="' + bh + '" fill="' + ACCENT + '" opacity="0.75" rx="1"/>';
        svg += '<text x="' + cx + '" y="' + (by - 5) + '" text-anchor="middle" font-size="11" font-family="' + MONO + '" fill="' + MUTE + '">' + series[i].count + '</text>';
        svg += '<text x="' + cx + '" y="' + (H - pad.bottom + 16) + '" text-anchor="middle" font-size="12" font-family="' + MONO + '" fill="' + DIM + '">' + series[i].label + '</text>';
      }
      svg += '</svg>';
      el.innerHTML = svg;
    }
    render();
    if (!el._rcResize) { el._rcResize = true; window.addEventListener('resize', render); }
  }

  // ---- histogram (page counts / rating distribution) ----
  function histogram(elId, points, opts) {
    var el = document.getElementById(elId);
    if (!el || !points.length) return;
    var values = points.map(function (p) { return p[opts.key]; });
    var counts = binCounts(values, opts.edges);
    var total = values.length || 1;
    function render() {
      var W = el.offsetWidth || 320, H = 155;
      var pad = { top: 18, right: 16, bottom: 42, left: 48 };
      var pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
      var barW = pw / counts.length;
      var svg = '<svg width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      for (var t = 0; t <= 1.001; t += 0.2) {
        var ty = pad.top + ph - (t * ph);
        svg += '<line x1="' + pad.left + '" y1="' + ty + '" x2="' + (W - pad.right) + '" y2="' + ty + '" stroke="' + DIM + '" stroke-opacity="0.3" stroke-width="0.5"/>';
        svg += '<text x="' + (pad.left - 8) + '" y="' + (ty + 4) + '" text-anchor="end" font-size="11" font-family="' + MONO + '" fill="' + DIM + '">' + t.toFixed(1) + '</text>';
      }
      svg += '<text x="10" y="' + (pad.top + ph / 2) + '" text-anchor="middle" font-size="11" font-family="' + MONO + '" fill="' + MUTE + '" transform="rotate(-90,10,' + (pad.top + ph / 2) + ')">density</text>';
      for (var i = 0; i < counts.length; i++) {
        var bx = pad.left + i * barW, bh = (counts[i] / total) * ph, by = pad.top + ph - bh;
        if (counts[i] > 0) svg += '<rect x="' + (bx + 1) + '" y="' + by + '" width="' + (barW - 2) + '" height="' + bh + '" fill="' + ACCENT + '" opacity="0.75" rx="1"/>';
        svg += '<text x="' + (bx + barW / 2) + '" y="' + (H - pad.bottom + 15) + '" text-anchor="middle" font-size="11" font-family="' + MONO + '" fill="' + DIM + '">' + opts.xLabels[i] + '</text>';
      }
      svg += '<text x="' + (pad.left + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" font-family="' + MONO + '" fill="' + MUTE + '">' + (opts.xLabel || '') + '</text>';
      svg += '</svg>';
      el.innerHTML = svg;
    }
    render();
    if (!el._rcResize) { el._rcResize = true; window.addEventListener('resize', render); }
  }

  window.ReadingCharts = { scatter: scatter, bars: bars, histogram: histogram, niceMax: niceMax, binCounts: binCounts };
})();
