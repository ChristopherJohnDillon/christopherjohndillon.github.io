# Nanoflare Detector — design

## Summary
A small, self-contained interactive game embedded in the About page's Research
section, directly after the paragraph ending "…pull their signals out of noisy
data." A noisy light-curve scrolls right-to-left across a canvas; occasional
real nanoflares (sharp impulsive rise, slow exponential decay) hide in the
noise. The player clicks/taps when they believe a flare is occurring. It turns
the page's detection narrative into an interactive payoff — "here's the method,
now you try by eye."

## Core loop (endless + lives)
- **Hit:** a click while a real flare is inside its detectable window scores
  points. Fainter flares and faster reactions score more.
- **False alarm:** a click with no flare present costs one of 3 strikes.
- **Miss:** a real flare scrolls off undetected — no strike, no points. Keeps
  the game about precision, not click-spamming.
- **Difficulty ramp:** as score climbs, the noise floor rises and flare
  amplitudes shrink, so signals get progressively harder to pick out — the
  exact regime the PhD detection method fights.
- **Game over** at 3 false alarms. End card shows: final score, flares caught,
  and a science-flavoured stat (e.g. "median offset −0.7σ" — the mean/median
  asymmetry the real detection exploits). Best score persists in `localStorage`.

## Feel & visual fit
- Canvas rendered, matching the existing nanoflare triptych's visual language:
  deep-navy panel, `#FF4F00` (`--nanoflare`) for flares/hits, muted grey for
  the noise trace, JetBrains Mono HUD.
- A caught flare flashes orange with a small "+N"; a false alarm flashes a red
  strike marker.
- One-line intro framing, e.g. "Think you can spot them? The real detection was
  statistical — see how you do by eye."

## Structure
- `assets/js/detector.js` — one IIFE, no dependencies, same pattern as
  `assets/js/flare.js`. Pure game logic (flare scheduling, difficulty ramp,
  hit/false-alarm/miss resolution, scoring) kept in small functions separate
  from rendering.
- CSS added to `css/main.css` under the existing nanoflare block.
- Markup block added to `about/index.html` after the "noisy data" paragraph in
  the Research section.

## Robustness & accessibility
- **Mobile:** touch-enabled; canvas scales to container width and is DPR-aware,
  like the existing canvases.
- **Reduced motion:** respects `prefers-reduced-motion`. When set, the game does
  not auto-animate — it shows a static "Start" state and only runs on explicit
  tap (matching how `flare.js` gates animation).
- **Keyboard:** Space/Enter triggers a detection; visible focus state;
  descriptive `aria-label` on the game region.
- **No fail state leakage:** self-contained; if the canvas/JS is unavailable the
  surrounding prose is unaffected.

## Out of scope
- Leaderboards / server persistence (best score is local only).
- Sound.
