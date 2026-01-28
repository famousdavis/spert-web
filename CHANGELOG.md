# Changelog

## v0.7.0 - 2026-01-27

### Burn-Up Chart

- Probabilistic burn-up chart on Forecast tab showing work completed vs total scope
- Three configurable forecast lines with customizable labels, percentiles (P1-P99), and colors
- Selectable distribution (T-Normal, Lognormal, Gamma, Bootstrap) for projections
- Copy-to-clipboard button for chart image

### Sprint History

- Optional "Backlog at End" field enables stepped scope line on burn-up chart

### User Experience

- Custom Percentile selector moved above chart sections
- Burn-up chart configuration persists per project during session

## v0.6.0 - 2026-01-27

### Productivity Adjustments

- Define periods of reduced productivity (holidays, vacations, company events) that adjust forecasted velocity
- Each adjustment has name, date range, productivity factor (0-100%), and optional memo
- Enable/disable toggle for what-if scenario analysis without deleting adjustments
- Adjustments apply weighted factors per sprint based on working days overlap
- Only enabled adjustments are used in Monte Carlo simulation and CSV export

### User Experience

- Forecast form inputs (backlog, velocity overrides) now persist when navigating between tabs
- Each project maintains its own forecast inputs independently
- Sprint cadence displayed alongside start date in forecast form
- Shortened "Remaining Backlog" label to "Backlog" for compact display

### Code Quality

- Refactored forecast types and helper functions to monte-carlo.ts for better organization
- Added comprehensive test coverage for productivity factor calculations (70 tests total)

## v0.5.0 - 2026-01-26

### Features

- "View History" button on Projects tab navigates directly to Sprint History for that project
- Sprint configuration (cadence and start date) now required before adding sprints
- Forecast results show absolute sprint numbers (completed + remaining)
- Copy-to-clipboard buttons for forecast inputs/results, CDF chart, and custom percentile

## v0.4.0 - 2026-01-25

### Visualization

- Added CDF (Cumulative Distribution Function) chart to Forecast tab
- Chart shows probability of completing backlog within X sprints for all distributions
- X-axis displays sprint count with finish dates (Mon DD format)
- Horizontal reference line marks selected custom percentile (P85 default)
- Collapsible chart panel with discreet expand/collapse triangle
- Interactive tooltips show probability and date on hover

## v0.1.0 - 2026-01-24

### Initial Release

- Project management with CRUD operations
- Sprint history tracking
- Monte Carlo simulation with normal distribution
- Percentile-based forecasting (P50-P90)
- Custom percentile selector (P1-P99)
- LocalStorage persistence
