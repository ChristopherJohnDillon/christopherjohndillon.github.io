# Pascal Changelog

All notable changes to Pascal are documented here.

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
