# Pascal Changelog

All notable changes to Pascal are documented here.

---

## [1.6] - 2026-10-26

### Removed
- **Weather forecasts and the on-device ML model.** A single barometer cannot forecast reliably, and the model only checked itself against pressure, not weather. `WeatherPredictor`, `WeatherMLModel`, `FeatureExtractor`, `PredictionTracker` and `WeatherKitGroundTruth` are deleted; launch clears their stored state. The forecast-driven storm alert tier ("Moderate") is gone; saved "Moderate" settings fall back to Severe Only.

### Added
- **Trend card** (`PressureTrendCard.swift`): WMO 3-hour tendency bands (steady / rising / falling slowly, fast, very fast) with a hedged "usually means" line, plus Δ12h, Δ24h and the 12h swing. Live Activity shows the tendency.
- **Pressure swing alerts and log**: notify when pressure moves 4/6/8 hPa from any reading in the last 12 h; one event per 12 h, 60-day log, logged even when notifications are off.
- **History ranges**: 12H / 48H / 7D presets on the pressure and altitude charts; axis labels switch to days.
- **Climb and descent** in Altitude mode, with 10 m hysteresis against GPS jitter.
- **Adaptive layouts** for wide screens: unfolded iPhone Duo (portrait split; landscape stacks chart above readout so nothing crosses the fold in laptop posture), landscape iPhones.
- **Unit tests** (`PascalTests`, Swift Testing): altitude continuity scenarios, calibration maths, trend bands, swings, elevation, pressure scale.
- **Screenshot pipeline**: captures iPhone 18 Pro Max, iPhone 18 Pro and iPhone Duo, frames with frames-cli, adds copy (`Screenshots/marketing.json`); `release.py appstore --screenshots` uploads every set.

### Fixed
- **Readings tens of hPa off after a change of height.** A cached altitude was reused after the user moved (only a 900–1070 hPa sanity check), and the 12 h continuity anchor expired overnight so the next fix was accepted almost unchecked. Every altitude is now checked against the last published sea-level pressure (3 hPa + 2 hPa/h); after a move the altitude is re-derived from the barometer, a suspect flag gets a rate-limited GPS fix on the next movement wake, and three agreeing fixes recover from a wrong reference. Bootstrap needs ±30 m.
- **Significant-change wake locations** (cell/Wi-Fi, often stale) were trusted as altitude and blocked the real fix; they now count only if ≤ 60 s old and ±30 m.
- **Station and sea-level pressure mixed** in charts, deltas and the value display; `consistentScale` keeps them apart.
- **Background samples silently dropped** by the store outlier filter (in-memory counter never escaped in background processes); counter persisted, like-for-like comparison, rejections logged.
- **BGAppRefresh pushed back on every scene change**; a pending request is now kept.
- Chart labels "NOW" and the top value were clipped on every screen.

## [1.5.9] - 2026-10-21

### Changed
- Released the 1.5.8 build 41 GPS and altitude fixes to the App Store as 1.5.9. No code changes.

## [1.5.8] - 2026-10-15

### Fixed (build 41)
- **Pressure spikes of 80+ hPa since iOS 27.** CoreLocation now regularly returns altitudes hundreds of metres wrong (700 m for a 50 m location) while still reporting a valid `verticalAccuracy`. `AltitudeCache` accepted any altitude change once five minutes had passed, so one bad fix replaced the cache and every following sample was reduced with it: ~0.12 hPa/m turned 1000 hPa into ~1087. The store's outlier filter then accepted the spike as a "sustained shift" because the poisoned cache reproduced it every time. Every GPS altitude is now cross-checked against the barometer: the implied sea-level pressure must be physically plausible (900–1070 hPa) and continuous with the last GPS-anchored value (4 hPa + 2 hPa/h, max 15). A genuine move changes station pressure and GPS altitude together and passes; a bad fix changes only the altitude and is rejected. A cache already poisoned by an earlier build clears itself on the next sample, and stored readings with impossible sea-level values fall back to station pressure instead of spiking charts.
- **GPS altitude was lost or wrong because the request could not reach a satellite fix.** `requestLocation()` at `kCLLocationAccuracyHundredMeters` with a 3-second timeout either expired (no altitude) or caught the first wifi/cell position (estimated altitude). Altitude now comes from a short `startUpdatingLocation` window at Best accuracy — up to 8 s, ending early at ±15 m — that ignores CoreLocation's cached position and skips fetching when Precise Location is off. Timer wakes still never request GPS.
- **Movement wakes were suspended mid-sample.** Significant-location and visit events grant only a few seconds; the 5-second barometer sample plus the GPS window outlasted that. The wake now holds a background task assertion until the reading is stored.
- **Movement compensation double-counted climbs.** The relative-altitude layer added `relativeAltitude × 0.12` before sea-level reduction with the current GPS altitude, counting a climb twice (~12 hPa per 100 m), applied the live view's last offset to background samples for up to six hours, and cancelled real weather because CMAltimeter's relative altitude is itself pressure-derived. The layer is removed: sea-level pressure is raw station pressure reduced at the validated current altitude, and movement is handled by the existing rate-of-change filter. Legacy readings still decode.
- **Refreshing during the live view froze it.** A manual sample started and stopped the shared altimeter, tearing down the live stream. It now reuses the streamed value.

### Earlier 1.5.8 builds (36–40) - 2026-08-03

### Fixed
- **The kernel bandwidth made the ML layer nearly inert.** `featureDistance` already normalises each term, so realistic distances land in roughly 0–2 — but the bandwidth was 2.0, which meant `exp(-d²/(2·2²))` spanned only 1.00 (identical history) to 0.78 (a 3 hPa difference in the 3-hour delta). Every observation contributed almost equally regardless of similarity, so the likelihood collapsed to the class frequency of the observation set and the "personalized" posterior was just the Zambretti prior reweighted by whichever labels happened to be common lately. Reduced to 0.45, where the same comparison spans 1.00 to 0.16 and genuinely similar history dominates.
- **The observation buffer was flooded with near-duplicates.** Every call to `predict()` queued a prediction for evaluation, and `predict()` runs on each background wake (via the storm-alert check), app launch, watch sync and settings dismissal — roughly 100 queued predictions a day, each becoming an observation six hours later. The 200-slot buffer therefore held about two days of tightly correlated samples from a single weather episode. Queuing is now rate-limited to once every three hours, giving weeks of varied history instead of days.
- **The Zambretti archetypes were being evicted.** Trimming used `observations.suffix(200)`, which drops from the front — so the nine seeded archetypes went first, removing the only anchor points for rare conditions such as storms. Observations now carry a source, anchors are never evicted, and only learned observations age out. Existing installs re-seed their anchors on upgrade, since observations saved before this release have no source recorded.
- **Label confidence no longer depends on agreeing with the prediction.** An inferred outcome was stored with confidence 1.0 when it matched the prediction and 0.8 when it didn't, which made the model more certain of labels that confirmed itself. All pressure-inferred labels now carry the same weak confidence.

### Changed
- **"Accuracy" is now labelled "Consistency".** The figure compares each prediction against a label derived from the same pressure data, so it measures agreement with the pressure trend, not correctness against observed weather. The explanatory text says so plainly.
- **The ML badge now reflects what was actually learned.** Progress counted every observation, including the nine seeded archetypes and one per six hours of pre-existing history, so a user with a couple of days of data reached "personalized" on day one. Thresholds now count learned observations only.
- Learning progress is driven by one shared threshold. The UI had 25 hardcoded in one place and 30 in another while the model used 25.
- Learning UI no longer uses green and yellow, which broke the single-hue rule and implied a correctness verdict the number can't support. Hierarchy is by brightness within International Orange.
- The storm-alert background check no longer queues predictions or rewrites the observation buffer on every wake, removing a repeated JSON encode of the full observation set from inside the 30-second background window.

### Known limitation
- Predictions still learn from pressure-inferred labels: `inferActualCondition` derives the "actual" condition from pressure change over the following six hours, which is the same signal the features come from. The model therefore learns pressure-trend-to-pressure-trend rather than weather. `WeatherKitGroundTruth` exists to supply real observed conditions but remains unwired and disabled with no entitlement shipped. The fixes above make the existing model work as designed; they do not make it a weather observer.

---

## [1.5.7] - 2026-08-03

### Fixed
- **Background samples were destroying each other.** `PressureService` holds a single `CMAltimeter`, and `startRelativeAltitudeUpdates` / `stopRelativeAltitudeUpdates` act on that one object with no serialisation. When two samples overlapped, the first to finish called `stop` and tore the sensor stream out from under the second, which then collected zero samples and recorded a failure. 1.5.6 made this fire nightly: a refresh task plus two processing tasks were landing in the same minute, so the new battery task woke up and threw away every sample it took (`BG processing sample FAILED (batt)` at 03:35 and 04:47 in a field diagnostic). Concurrent callers now await the in-flight sample and share its result.
- **The three background tasks no longer converge on the same instant.** Every handler reschedules on wake, and identical delays re-based all three requests off the same moment, so they matured together — wasting wakes and colliding on the altimeter. Processing tasks now use staggered floors (22 and 37 minutes against the 15-minute refresh) so they interleave and fill gaps.
- **Pending tasks keep their clock.** Resubmitting a request resets `earliestBeginDate`, so a processing task rescheduled on every scenePhase change and every refresh wake kept being pushed out and could never mature during the long idle window it exists to cover. Already-pending requests are now left alone.
- **Background tasks were overrunning their window and misreporting completion to iOS.** Both handlers awaited a non-throwing `Task` with `try`, so the `catch` branch and its `setTaskCompleted(success: false)` were unreachable dead code. The expiration handler only called `cancel()`, and nothing in the sampling path checked cancellation, so on expiry the work kept running and reported *success* after iOS had already expired the task. iOS reduces an app's future background scheduling when it overruns or fails to report completion in time, so Pascal was plausibly teaching the system to defer it — the same throttling 1.5.3 through 1.5.7 have been chasing. Completion is now reported exactly once, immediately on expiry, and the work stops at the deadline instead of continuing.
- **Removed a misleading `useGPS` branch.** `handleAppRefresh` chose between two sampling paths on cache age behind a flag named `useGPS`, but since 1.5.4 neither path fetches GPS on a background trigger — it only varied how long the sensor was held open. Standardised on the multi-sample average, which was already the common case.

### Changed
- **Sample failures now record why.** `recordFailedSample()` stored only a timestamp and a counter, so a report could say "Failure Count: 112" with no way to distinguish a missing sensor from a timeout from a torn-down stream. The reason is captured at each failure path and shown in the diagnostic report as "Last Failure Reason".
- **Sea-level calibration no longer decays to day-old altitude.** 1.5.4 assumed a movement wake delivers a usable altitude for free, but significant-location-change fixes come from cell and wifi triangulation and usually report no valid vertical accuracy, so the cache went unrefreshed through a full day of movement — a field diagnostic showed the mix degraded to CACHE 26% / GPS 2% (from CACHE 2% / GPS 33%), with movement wakes at 19:34 and 20:05 both calibrating from altitude more than six hours old. A movement wake may now take one active GPS fix when the cache is no longer fresh, rate-limited to once per 30 minutes. Timer wakes remain strictly cache-only, so the throttle loop fixed in 1.5.4 cannot return.

### Infrastructure
- Added a shared Xcode scheme for the watch app. There wasn't one, so `-scheme "BarometerWatch Watch App"` fell back to an autocreated scheme that built *every* target — including the iOS widget, which fails to compile for watchOS (`systemSmall` / `systemMedium` are unavailable there). The watch app could not be built or verified from the command line at all.
- Added a `.gitignore`. The repo had none, so `xcodebuild` output in `build/` was committable (and got committed once).

---

## [1.5.6] - 2026-08-02

### Fixed
- **Overnight gaps on battery power**: Pascal's overnight fallback was a `BGProcessingTask` submitted with `requiresExternalPower = true`, so it could only ever run while charging. The intended battery-powered counterpart was described in the code comments but never implemented, leaving anyone who doesn't charge overnight with no processing coverage at all. A user diagnostic showed a healthy 15-minute daytime cadence collapsing to two consecutive dead nights (371 min and 343 min with zero samples, 23:40 → 05:25 both nights) on an unplugged phone with correct permissions. Both processing tasks are now submitted every cycle — the charging task and a new no-power-required task — so whichever the device qualifies for that night can run.
- Background timer wakes still use cached altitude only (the 1.5.4 trigger gate is unchanged), so the new task cannot reintroduce the active-GPS throttle loop.

### Changed
- **Background wakes now appear in the diagnostic report.** Both task handlers previously logged only through a `#if DEBUG` path that compiles out of release builds, so a diagnostic report showed no background activity even when sampling was working — and both handlers store readings under the same `BG` trigger, so the CSV couldn't distinguish a refresh wake from a processing wake either. Wakes, sample failures, and task expiries are now recorded with the task that produced them.
- The wake log no longer records a duplicate "Monitoring started" entry on every foreground/background transition, which had been crowding out real events.

---

## [1.5.4] - 2026-05-27

### Fixed
- **Background cadence regression still present in 1.5.3**: the 1.5.3 skip keyed off cache age (`.fresh` = altitude < 1h old), but once iOS had throttled wakes to more than an hour apart the cache was never fresh — so the skip never engaged and every wake still issued an active GPS request, reinforcing the throttle. Diagnostic CSVs showed the cadence cliff (15–30 min → 1–3 hour gaps) beginning the day 1.5.1 shipped and persisting on build 28.
- Active GPS (`requestLocation`) now fires **only on foreground triggers** (app open / tap refresh). Background timer wakes use cached altitude; movement wakes reuse the free `CLLocation` that the significant-location-change already delivers. GPS therefore still updates **when you move** — exactly when altitude can change — without the active background-location request that iOS was throttling on. Restores the 15-minute sampling cadence.

---

## [1.5.3] - 2026-05-26

### Fixed
- **Background polling regression from 1.5.1**: an interaction between the new sigloc-altitude caching and `allowsBackgroundLocationUpdates` on `PressureService` caused every wake to issue a redundant GPS request. iOS read the aggregate as heavy background-location usage and throttled wake frequency (3–4/hour → 1/several hours over ~24h).
- `sampleAndStore` now skips its own `fetchAltitude` when `AltitudeCache` already has a fresh value (which the sigloc wake just wrote). Restores the previous wake cadence without losing the 1.5.1 altitude-freshness win.

---

## [1.5.2] - 2026-05-25

### Fixed
- **Widget "Show Data Points" toggle** now propagates to home-screen widgets and complications (previously the widget extension kept a stale cached value across processes)
- **Outlier filter no longer deadlocks during real storms**: a genuine rapid pressure drop could be rejected as a "glitch" and stall the pressure history until weather recovered. Now accepts sustained shifts and post-gap readings.
- Sync merge no longer drops legitimate batches of storm-trend readings as outliers
- First-launch screen now shows the actual app version (was hardcoded to "v1.0")

### Added
- **Trial-ended notice** (one-time, dismissable) when the 2-day widget trial expires — directs to upgrade if interested, otherwise just goes away
- Weather prediction, storm alerts, and Live Activity all suppress themselves when local data is stale, instead of presenting forecasts based on week-old pressure

---

## [1.5.1] - 2026-05-23

### Fixed
- **GPS altitude refresh bug**: altitude was stuck at the home elevation in background, causing fake "weather change" readings whenever the user moved (e.g. driving to another town)
- Lower-tier GPS accuracy in `PressureService` so altitude fetches no longer time out and fall back to stale cache
- Significant-location-change wakes now write fresh altitude into `AltitudeCache` directly, bypassing the previous fetch-and-timeout path

### Added
- Precise Location warning banner in main view — alerts user when iOS can't refresh altitude because Precise Location is off
- `BackgroundScheduler.accuracyAuthorization` published property so views can observe Precise Location state
- WeatherKitGroundTruth manager (dormant — gated behind UserDefaults flag, defaults off, hard 1/day cap; scaffolding for future ML ground-truth labels)

### Improved
- More accurate sea-level pressure feeds cleaner features into the on-device ML model

---

## [1.5] - 2026-05-23

### Added
- **Notification Controls**: New Sensitivity (Severe / Moderate / All) and Daily Limit (1, 2, 3, or unlimited) settings
- **Altitude Chart**: Toggle between pressure and GPS altitude history views
- **Zambretti-Aligned Confidence**: Prediction confidence now follows classical meteorological research
- **Developer Tools**: Expanded debug mode with Data Inspector, ML Inspector, Sync Status, and Live Sensor

### Improved
- **Quieter by Default**: Storm alerts now fire only on storm-grade pressure drops, capped at 1 per day
- **Honest Notification Wording**: Alerts describe the measured pressure change instead of asserting weather outcomes
- **Longer Cooldown**: Minimum 6 hours between alerts (was 3 hours)

### Improved
- **Smarter Predictions**: Confidence properly reflects signal clarity (rapid changes = high confidence, slow changes = lower)
- **Level Confirmation**: Predictions boosted when pressure level confirms forecast (e.g., low pressure + storm)
- **Reversal Penalty**: Confidence reduced when trend just changed direction

### Developer Tools (tap version 7x to unlock)
- **Data Inspector**: View calibration breakdown, movement filtering stats, GPS coverage
- **ML Inspector**: Model state, observation count, condition distribution, force re-bootstrap
- **Sync Status**: Watch connectivity diagnostics, force sync
- **Live Sensor**: Real-time barometer readings with polling mode

### Technical
- `ZambrettiConfidence` struct for structured confidence calculation
- `InteractiveAltitudeChartView` for GPS altitude history
- `ChartDisplayMode` setting for pressure/altitude toggle
- Added `CaseIterable` to `CalibrationMethod` for debug UI

---

## [1.2] - 2026-02-23

### Added
- **On-Device Machine Learning**: Personalized weather predictions that learn automatically
- **Instant Bootstrapping**: Uses existing pressure history to personalize immediately
- **Adaptive Forecasting**: Combines 110-year-old Zambretti algorithm with modern ML
- **Overnight Sampling**: Charging-aware background scheduling for better overnight coverage
- **Diurnal Correction**: Removes natural daily pressure cycle for more accurate trend detection
- **Storm Alerts**: Push notifications for rapid pressure drops and storm conditions
- **Live Activities**: Dynamic Island and Lock Screen pressure display (iOS 16.1+)
- **Flight Mode**: Cabin pressure tracking with altitude estimation

### Fixed
- Background processing tasks now run properly overnight when charging

### How ML Works
Pascal learns your local weather patterns automatically — no user action required:

1. **Instant bootstrap** — Seeds model with Zambretti archetypes on first launch
2. **History training** — Walks through existing pressure data to create observations
3. **Auto-evaluation** — After 6 hours, Pascal checks what actually happened
4. **Kernel likelihood** — Similar past conditions inform future predictions

**Result:** If you have a week of pressure history, Pascal is personalized immediately. New users reach personalization after ~25 auto-evaluated predictions.

All learning happens silently in the background. No feedback buttons needed.

### Technical
- `WeatherMLModel.swift` - On-device ML with k-NN classification
- `FeatureExtractor.swift` - Rich feature engineering with diurnal correction
- `StormAlerts.swift` - Push notification system with cooldown
- `LiveActivityManager.swift` - ActivityKit integration
- `PredictionTracker.swift` - Prediction tracking + ML training data
- `FlightMode.swift` - Flight detection and cabin altitude

---

## [1.1] - 2026-02-22

### Added
- **Weather Forecasting**: On-device prediction using Zambretti algorithm
- **Prediction Confidence**: Visual confidence indicator (4-bar display)
- **Trend Classification**: 7-level trend system (Rising Rapidly → Falling Rapidly)
- **Forecast Card**: Weather prediction display in main app view

### Fixed
- GPS continuation double-resume crash
- Race condition in manual refresh
- Calibration data loss when storing readings
- Chart boundary interpolation
- Delta calculations with multi-tier fallback

### Technical
- `WeatherPredictor.swift` - Zambretti-based prediction engine
- `WeatherPredictionView.swift` - Forecast UI components
- IQR-based outlier detection in `PressureCalibration.swift`

---

## [1.0] - 2026-02-01

### Initial Release
- Real-time barometric pressure monitoring
- 12-hour interactive pressure chart
- Hybrid calibration system (movement + GPS)
- iOS Home Screen widgets (small, medium, large)
- Apple Watch app with complications
- Background sampling via location changes
- Rate-of-change filtering for movement detection
- Sea-level pressure reduction

### Technical
- SwiftUI throughout (100% native)
- CMAltimeter for pressure sampling
- CoreLocation for GPS altitude
- WidgetKit for widgets/complications
- WatchConnectivity for iPhone-Watch sync
