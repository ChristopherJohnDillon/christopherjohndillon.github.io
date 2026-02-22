# Pascal Changelog

All notable changes to Pascal are documented here.

---

## [1.2] - 2026-02-22

### Added
- **Storm Alerts**: Push notifications for rapid pressure drops and storm conditions
- **Live Activities**: Dynamic Island and Lock Screen pressure display (iOS 16.1+)
- **Prediction Accuracy Tracking**: Records prediction outcomes for ML improvement
- **Flight Mode**: Cabin pressure tracking with altitude estimation
- **User Feedback System**: Rate prediction accuracy to improve future forecasts

### Technical
- `StormAlerts.swift` - Push notification system with cooldown
- `LiveActivityManager.swift` - ActivityKit integration
- `PredictionTracker.swift` - Prediction outcome tracking
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
