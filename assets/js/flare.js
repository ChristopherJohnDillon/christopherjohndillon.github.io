(function () {
  /* — Nanoflare draw-on animation — */
  var svg = document.querySelector('.flare-mark');
  if (svg) {
    var path = svg.querySelector('.curve');
    if (path) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      svg.style.setProperty('--flare-len', len);

      function playFlare() {
        svg.classList.remove('is-animating');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            svg.classList.add('is-animating');
          });
        });
      }

      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        path.style.strokeDashoffset = '0';
      } else {
        path.style.strokeDashoffset = len;
        requestAnimationFrame(function () {
          svg.classList.add('is-animating');
        });
        setInterval(playFlare, 30000);
      }

      svg.style.cursor = 'pointer';
      svg.addEventListener('click', playFlare);
    }
  }

  /* — Nanoflare triptych: signal → signal+noise → histogram — */
  var cvSig = document.getElementById('nf-signal');
  var cvNoisy = document.getElementById('nf-noisy');
  var cvHist = document.getElementById('nf-hist');
  if (cvSig && cvNoisy && cvHist) {
    var dpr = window.devicePixelRatio || 1;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = getComputedStyle(document.documentElement);
    var colFlare = style.getPropertyValue('--nanoflare').trim();
    var colDim = style.getPropertyValue('--dim').trim();
    var colMute = style.getPropertyValue('--mute').trim();

    function fitCanvas(cv) {
      var r = cv.getBoundingClientRect();
      cv.width = r.width * dpr;
      cv.height = r.height * dpr;
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      return r;
    }

    /* Seeded RNG for reproducibility */
    var seed = 42;
    function sRand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function sRandn() {
      var u = sRand(), v = sRand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    /* Generate time series: 600 points displayed */
    var Npts = 600;
    var flareOnly = new Float32Array(Npts);
    var noisy = new Float32Array(Npts);
    var noise = new Float32Array(Npts);

    /* Gaussian noise — dominates the signal */
    for (var i = 0; i < Npts; i++) noise[i] = sRandn() * 3.5;

    /* Superimpose nanoflare events on clean signal */
    for (var f = 0; f < 12; f++) {
      var t0 = 20 + Math.floor(sRand() * (Npts - 80));
      var amp = 0.8 + sRand() * 1.5;
      var decayL = 15 + Math.floor(sRand() * 50);
      /* 1-sample impulsive rise */
      flareOnly[t0] += amp;
      for (var d = 1; d < decayL && t0 + d < Npts; d++)
        flareOnly[t0 + d] += amp * Math.exp(-d / (decayL * 0.25));
    }

    /* Combine */
    for (var i = 0; i < Npts; i++) noisy[i] = flareOnly[i] + noise[i];

    /* Normalise noisy for histogram */
    var hN = 8000, hSeries = new Float32Array(hN);
    seed = 42;
    for (var i = 0; i < hN; i++) hSeries[i] = sRandn();
    for (var f = 0; f < 50; f++) {
      var t0 = Math.floor(sRand() * hN);
      var amp = 2 + sRand() * 4;
      var decayL = 30 + Math.floor(sRand() * 100);
      if (t0 < hN) hSeries[t0] += amp;
      for (var d = 1; d < decayL && t0 + d < hN; d++)
        hSeries[t0 + d] += amp * Math.exp(-d / (decayL * 0.3));
    }
    var hMean = 0;
    for (var i = 0; i < hN; i++) hMean += hSeries[i];
    hMean /= hN;
    var hSd = 0;
    for (var i = 0; i < hN; i++) { hSeries[i] -= hMean; hSd += hSeries[i] * hSeries[i]; }
    hSd = Math.sqrt(hSd / hN);
    for (var i = 0; i < hN; i++) hSeries[i] /= hSd;

    /* Bin */
    var nBins = 28, binMin = -3.5, binMax = 4.5;
    var binW = (binMax - binMin) / nBins;
    var bins = new Float32Array(nBins);
    for (var i = 0; i < hN; i++) {
      var b = Math.floor((hSeries[i] - binMin) / binW);
      if (b >= 0 && b < nBins) bins[b]++;
    }
    var maxBin = 0;
    for (var i = 0; i < nBins; i++) if (bins[i] > maxBin) maxBin = bins[i];

    var hSorted = Array.from(hSeries).sort(function (a, b) { return a - b; });
    var hMedian = hSorted[Math.floor(hN / 2)];

    var pad = 12;

    /* — Draw a simple time series on a canvas — */
    function drawTS(cv, data, yMin, yMax, progress, col) {
      var r = fitCanvas(cv);
      var ctx = cv.getContext('2d');
      var w = r.width, h = r.height;
      var pw = w - pad * 2, ph = h - pad * 2;
      ctx.clearRect(0, 0, w, h);

      var nShow = Math.floor(progress * Npts);
      if (nShow < 2) return;

      ctx.beginPath();
      for (var i = 0; i < nShow; i++) {
        var px = pad + (i / Npts) * pw;
        var val = Math.max(yMin, Math.min(yMax, data[i]));
        var py = pad + ph * (1 - (val - yMin) / (yMax - yMin));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    /* — Draw noisy panel: noise + signal separate, then merge — */
    /* merge: 0 = fully separate, 1 = fully combined */
    function drawNoisy(merge) {
      var r = fitCanvas(cvNoisy);
      var ctx = cvNoisy.getContext('2d');
      var w = r.width, h = r.height;
      var pw = w - pad * 2, ph = h - pad * 2;
      ctx.clearRect(0, 0, w, h);

      /* Use combined scale always so merge is smooth */
      var yMin = noisyMin - 0.3, yMax = noisyMax + 0.3;
      var range = yMax - yMin;

      function toY(val) {
        return pad + ph * (1 - (Math.max(yMin, Math.min(yMax, val)) - yMin) / range);
      }
      function toX(i) { return pad + (i / Npts) * pw; }

      if (merge < 1) {
        /* Draw noise line (grey/white) */
        ctx.beginPath();
        for (var i = 0; i < Npts; i++) {
          var px = toX(i);
          /* When separate (merge=0), noise sits at centre; as merge→1, shifts to combined */
          var nVal = noise[i] * (1 - merge) + noisy[i] * merge;
          if (i === 0) ctx.moveTo(px, toY(nVal)); else ctx.lineTo(px, toY(nVal));
        }
        ctx.strokeStyle = 'rgba(184,192,208,' + (0.7 * (1 - merge) + 0.5 * merge) + ')';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        ctx.stroke();

        /* Draw signal line (orange), fading out */
        ctx.beginPath();
        for (var i = 0; i < Npts; i++) {
          var px = toX(i);
          var sVal = flareOnly[i] * (1 - merge) + noisy[i] * merge;
          if (i === 0) ctx.moveTo(px, toY(sVal)); else ctx.lineTo(px, toY(sVal));
        }
        ctx.strokeStyle = colFlare;
        ctx.globalAlpha = 1 - merge * 0.85;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        /* Fully merged: single grey line */
        ctx.beginPath();
        for (var i = 0; i < Npts; i++) {
          if (i === 0) ctx.moveTo(toX(i), toY(noisy[i]));
          else ctx.lineTo(toX(i), toY(noisy[i]));
        }
        ctx.strokeStyle = colMute;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    /* — Draw histogram — */
    function drawHist(p) {
      var r = fitCanvas(cvHist);
      var ctx = cvHist.getContext('2d');
      var w = r.width, h = r.height;
      var pw = w - pad * 2;
      var ph = h - pad * 2 - 16; /* extra room at top for labels */
      var top = pad + 16;
      ctx.clearRect(0, 0, w, h);

      /* Bars */
      var barW = pw / nBins;
      var barsToShow = Math.floor(p * nBins);
      for (var i = 0; i < barsToShow; i++) {
        var barH = (bins[i] / maxBin) * ph;
        var x = pad + i * barW;
        var y = top + ph - barH;
        ctx.fillStyle = colFlare;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 1, y, barW - 1, barH);
        ctx.globalAlpha = 1;
      }

      if (p < 0.5) return;

      /* Mean line at 0 */
      var zeroX = pad + ((0 - binMin) / (binMax - binMin)) * pw;
      ctx.strokeStyle = colMute;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(zeroX, top);
      ctx.lineTo(zeroX, top + ph);
      ctx.stroke();
      ctx.setLineDash([]);

      /* Median line */
      if (p > 0.75) {
        var medX = pad + ((hMedian - binMin) / (binMax - binMin)) * pw;
        ctx.strokeStyle = colFlare;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(medX, top);
        ctx.lineTo(medX, top + ph);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Arrow + label between mean and median */
        var midY = pad + 8;
        ctx.font = '11px monospace';
        ctx.fillStyle = colFlare;
        ctx.textAlign = 'right';
        ctx.fillText('median', medX - 4, midY);
        ctx.fillStyle = colMute;
        ctx.textAlign = 'left';
        ctx.fillText('mean', zeroX + 4, midY);

        /* Bracket arrow between them */
        var arrowY = midY + 5;
        ctx.strokeStyle = colFlare;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(medX, arrowY);
        ctx.lineTo(zeroX, arrowY);
        ctx.stroke();
        /* Arrow head */
        ctx.beginPath();
        ctx.moveTo(medX + 4, arrowY - 3);
        ctx.lineTo(medX, arrowY);
        ctx.lineTo(medX + 4, arrowY + 3);
        ctx.stroke();
      }
    }

    /* Find ranges for signal panel */
    var sigMax = 0;
    for (var i = 0; i < Npts; i++) if (flareOnly[i] > sigMax) sigMax = flareOnly[i];
    var noisyMin = Infinity, noisyMax = -Infinity;
    for (var i = 0; i < Npts; i++) {
      if (noisy[i] < noisyMin) noisyMin = noisy[i];
      if (noisy[i] > noisyMax) noisyMax = noisy[i];
    }

    /* Animation — strict sequence:
       0.0–0.25  panel 1: nanoflare signal draws
       0.28–0.45 panel 2: noise(grey) + signal(orange) appear separate
       0.45–0.62 panel 2: merge into one indistinguishable line
       0.65–1.0  panel 3: histogram bars, then mean/median lines */
    var animId = null;
    var duration = 5500;

    function animateAll() {
      if (animId) cancelAnimationFrame(animId);
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / duration, 1);

        /* Panel 1: signal finishes first */
        var pSig = Math.min(t / 0.25, 1);
        drawTS(cvSig, flareOnly, -0.3, sigMax * 1.1, pSig, colFlare);

        /* Panel 2: starts after signal finishes */
        if (t < 0.28) {
          fitCanvas(cvNoisy);
          cvNoisy.getContext('2d').clearRect(0, 0, cvNoisy.width, cvNoisy.height);
        } else {
          var merge = Math.min(Math.max((t - 0.45) / 0.17, 0), 1);
          merge = merge * merge * (3 - 2 * merge);
          drawNoisy(merge);
        }

        /* Panel 3: starts after merge finishes */
        if (t < 0.65) {
          fitCanvas(cvHist);
          cvHist.getContext('2d').clearRect(0, 0, cvHist.width, cvHist.height);
        } else {
          var pHist = Math.min((t - 0.65) / 0.35, 1);
          drawHist(pHist);
        }

        if (t < 1) animId = requestAnimationFrame(step);
      }
      animId = requestAnimationFrame(step);
    }

    function drawAll() {
      drawTS(cvSig, flareOnly, -0.3, sigMax * 1.1, 1, colFlare);
      drawNoisy(1);
      drawHist(1);
    }

    if (reduced) {
      drawAll();
    } else {
      var played = false;
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !played) {
          played = true;
          animateAll();
        }
      }, { threshold: 0.3 });
      observer.observe(cvSig);
    }

    [cvSig, cvNoisy, cvHist].forEach(function (cv) {
      cv.addEventListener('click', function () { animateAll(); });
    });

    var nfResizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(nfResizeTimer);
      nfResizeTimer = setTimeout(drawAll, 150);
    });
  }

  /* — Starfield scroll parallax — */
  var starfield = document.querySelector('.starfield');
  if (starfield) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          starfield.style.setProperty('--star-drift', (-window.scrollY * 0.12) + 'px');
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
})();
