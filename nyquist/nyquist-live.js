(function () {
  var cvMain = document.getElementById('nyquist-spectrum');
  var cvMini = document.getElementById('nyquist-mini');
  var label = document.getElementById('spectrum-label');
  if (!cvMain || !cvMini) return;

  var ctxMain = cvMain.getContext('2d');
  var ctxMini = cvMini.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var nBands = 64;

  /* State */
  var heights = new Float32Array(nBands);
  var analyser = null;
  var audioCtx = null;
  var audioStream = null;
  var freqData = null;
  var isLive = false;

  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect();
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    return r;
  }

  /* Simulation: music-like spectrum */
  var simTime = 0;
  var simPhases = [];
  var simFreqs = [];
  for (var i = 0; i < nBands; i++) {
    simPhases.push(Math.random() * Math.PI * 2);
    simFreqs.push(1.5 + Math.random() * 4);
  }

  function simFrame() {
    simTime += 0.016;
    for (var i = 0; i < nBands; i++) {
      var freq = i / nBands;
      var base = Math.max(0, 1 - freq * 1.3) * 0.6;
      var mid = Math.exp(-Math.pow((freq - 0.25) * 4, 2)) * 0.3;
      var beat = 0;
      if (i < 8) beat = Math.max(0, Math.sin(simTime * 5.5)) * 0.35;
      var wander = Math.sin(simTime * simFreqs[i] + simPhases[i]) * 0.2;
      wander += Math.sin(simTime * simFreqs[i] * 2.7 + simPhases[i] * 1.7) * 0.12;
      var target = Math.max(0, Math.min(1, base + mid + beat + wander));
      /* Fast attack, slightly slower release — like the real app */
      var diff = target - heights[i];
      heights[i] += diff * (diff > 0 ? 0.6 : 0.35);
    }
  }

  function liveFrame() {
    if (!analyser || !freqData) return;
    analyser.getByteFrequencyData(freqData);
    var bufLen = analyser.frequencyBinCount;
    for (var i = 0; i < nBands; i++) {
      var frac = i / nBands;
      var logStart = Math.pow(frac, 2);
      var logEnd = Math.pow((i + 1) / nBands, 2);
      var binStart = Math.floor(logStart * bufLen);
      var binEnd = Math.max(binStart + 1, Math.floor(logEnd * bufLen));
      var sum = 0;
      for (var b = binStart; b < binEnd && b < bufLen; b++) sum += freqData[b];
      var avg = sum / (binEnd - binStart);
      var target = avg / 255;
      heights[i] += (target - heights[i]) * 0.3;
    }
  }

  /* Draw spectrum — matching Metal shader */
  function drawSpectrum(cv, ctx, compact) {
    var r = fitCanvas(cv);
    var w = r.width, h = r.height;

    /* Black background */
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    /* Equal-width bars — matching the real shader */
    var plotH = h;
    var col = 'rgb(255,79,0)';

    for (var i = 0; i < nBands; i++) {
      var x0 = Math.round(w * i / nBands);
      var x1 = Math.round(w * (i + 1) / nBands);
      var barH = heights[i] * plotH;

      if (barH > 0.5) {
        ctx.fillStyle = col;
        ctx.fillRect(x0, Math.round(h - barH), x1 - x0, Math.round(barH));
      }
    }

    /* Vignette — matching shader: color *= 1.0 - dot(vc,vc) * 0.25 */
    if (!compact) {
      var vGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, w, h);
    }

    /* Film grain omitted — too expensive on canvas, handled by CSS instead */
  }

  /* Animation loop */
  function tick() {
    if (isLive) liveFrame();
    else simFrame();
    drawSpectrum(cvMain, ctxMain, false);
    drawSpectrum(cvMini, ctxMini, true);
    requestAnimationFrame(tick);
  }

  /* Mic toggle */
  function toggleMic() {
    if (isLive) {
      /* Switch back to sim */
      isLive = false;
      if (audioStream) {
        audioStream.getTracks().forEach(function (t) { t.stop(); });
        audioStream = null;
      }
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
      }
      analyser = null;
      freqData = null;
      label.textContent = 'DEMO';
      label.style.color = '';
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      label.textContent = 'MICROPHONE NOT AVAILABLE';
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      audioStream = stream;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      freqData = new Uint8Array(analyser.frequencyBinCount);
      isLive = true;
      label.textContent = 'LIVE';
      label.style.color = '#FF4F00';
    }).catch(function () {
      label.textContent = 'MICROPHONE ACCESS DENIED';
    });
  }

  cvMain.addEventListener('click', toggleMic);
  cvMini.addEventListener('click', toggleMic);
  if (label) label.addEventListener('click', toggleMic);

  tick();
})();
