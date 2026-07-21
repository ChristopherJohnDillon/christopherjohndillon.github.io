# Corona Clicker — design

An incremental / clicker game embedded in the About page's Research section,
after the "…pull their signals out of noisy data" paragraph. Inspired by
Universal Paperclips: minimalist text-and-numbers UI, a dynamic **Projects**
list of one-time unlocks, and a narrative that escalates from one patch of the
Sun to a galaxy-wide nanoflare census. The theme is the real coronal-heating
problem — the question at the centre of the PhD.

## The core number
Coronal **temperature**, starting at the photosphere (5,800 K) and climbing
toward the corona's 1,000,000 K and beyond, fought by radiative cooling. The
whole game is dragging that number up.

## Currency & loop
- **Energy** (ergs) is the currency, released by nanoflares.
- **Click the Sun** → fire a nanoflare → gain energy (× click multipliers).
- **Generators** fire nanoflares automatically → passive energy/sec.
- **Temperature** eases toward a target set by total heating power divided by a
  cooling coefficient: `Ttarget = 5800 + HEAT_K * heatingPower / cooling`.
  Heating power = passive energy/sec + a smoothed recent-click contribution.
- Spend energy on generators and projects. State saves to `localStorage`
  (`corona-clicker`), with capped offline passive earnings on return.

## Generators (auto nanoflare sources; unlock by temperature/ownership)
Cost grows `base * 1.15^count` (classic clicker curve).
1. **Convective granule** — photospheric bubbling jostles footpoints.
2. **Braided field line** — Parker's mechanism (1988); the origin of "nanoflare".
3. **Reconnection site** — tangled field snaps, releasing magnetic energy.
4. **Coronal loop** — confined magnetic tube of hot plasma.
5. **Active region** — dense knot of loops, strong and frequent.
6. **Nanoflare storm** — synchronised swarm (unlocked via a project).
7. **M-dwarf** — cosmic tier; ignite nanoflare activity on other stars
   (unlocked via the "point the detector at other stars" project).

## Projects (Paperclips-style; appear when `requires` is met)
Each has a title, cost, one-line flavour, and an effect. Real parameters:
- **Twist the field (magnetic helicity)** — store more free energy → click ×2.
- **Boost field strength B** — energy ∝ B² → all energy ×2 (tiered).
- **Lower the magnetic Reynolds number** — faster reconnection/diffusion →
  passive ×1.5. *(the mechanic the user specifically asked for)*
- **Sharpen observing cadence** — nod to the detection work → click power ×3.
- **Power-law index α > 2** — Hudson (1991) criterion; once the flare
  energy-distribution slope exceeds 2, low-energy nanoflares dominate the
  heating budget → the two smallest generators ×4.
- **Alfvén-wave heating channel** — the wave-vs-reconnection debate → +30%
  passive.
- **Suppress radiative cooling** — ease the cooling drag → cooling ×0.6 (tiered).
- **Trigger a nanoflare storm** — unlocks generator 6.
- **Point the detector at other stars** — unlocks the M-dwarf generator and the
  cosmic phase; flavour ties to the 2023 fully-convective M-dwarf paper.
- **Galactic nanoflare census** — endgame; huge multiplier, triggers a win
  screen with a statistical-detection callback.

## Narrative milestones (temperature thresholds)
Each fires a one-line caption and gates content:
- 10,000 K — "wait — it should be cooling with height…"
- 100,000 K — transition region
- 1,000,000 K — **corona reached — the heating problem, solved by clicking**
- 3 MK — active-region corona
- 10 MK — flare-grade plasma
- then the goal jumps to other stars → M-dwarfs → galaxy-wide census (win).

## UI & feel (minimalist, Paperclips-like)
- Plain, bordered buttons; JetBrains Mono numbers; sparse layout. Site dark
  theme + `#FF4F00`.
- A modest canvas **Sun** as the click target, its corona glow swelling and
  shifting colour with temperature; nanoflares spark on click. Everything else
  is text and buttons.
- Top readout: energy, energy/sec, temperature (+ current goal caption).
- Generators column and Projects column; projects appear/disappear as
  requirements are met.
- Large-number formatting (K/M/B/T… then scientific). Responsive: stacks on
  mobile. Respects `prefers-reduced-motion` (glow animation only).

## Structure
- `assets/js/corona-clicker.js` — one IIFE, no dependencies. Tunable constants
  at top; pure economy functions (cost, rates, temperature, multipliers)
  separate from rendering; save/load; render loop via `requestAnimationFrame`.
- CSS block added to `css/main.css`.
- Markup block + script include in `about/index.html`.
- The earlier detection game (`assets/js/detector.js`, its CSS, its markup) is
  removed.

## Out of scope (v1)
- Prestige / "Solar Cycle" rebirth (designed to slot in later).
- Sound.
