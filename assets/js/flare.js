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
