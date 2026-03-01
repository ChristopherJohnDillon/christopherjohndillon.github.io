# Pascal Changelog

All notable changes to Pascal are documented here.

---

## [1.3] - 2026-03-01

### Added
- **Altitude Chart**: Toggle between pressure and GPS altitude history views
- **Zambretti-Aligned Confidence**: Prediction confidence now follows classical meteorological research
- **Developer Tools**: Expanded debug mode with Data Inspector, ML Inspector, Sync Status, and Live Sensor

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
