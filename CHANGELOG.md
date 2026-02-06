# Changelog

## v0.16.1 - 2026-02-06

### Bug Fixes

- Burn-up chart forecast lines now target highest visible milestone instead of always extending to total project scope
- Historical scope line capped to milestone target, eliminating misleading cliff at forecast boundary

### Dark Mode

- Active tab dimmed to `blue-700` for reduced glare against dark backgrounds
- Export/Import buttons switch to ghost variants (outlined with tinted background) in dark mode
- Add Milestone/Add Adjustment buttons use matching ghost variant in dark mode
- Tab container border visible in dark mode (`gray-700`)

## v0.16.0 - 2026-02-05

### Features

- Custom scope growth override: choose between calculated rate (from sprint history) or a user-specified custom rate
- Radio button UI with inline calculated stats and custom numeric input
- Summary text shows source label: "(calculated)" or "(custom)"

### Bug Fixes

- Fixed scope growth not affecting milestone forecasts (milestone check now uses remaining backlog instead of cumulative velocity)
- Fixed truthiness check allowing zero scope growth to be modeled correctly
- Fixed Windows scrollbar jitter with scrollbar gutter reservation
- Dynamic copyright year derived from system date

### Refactoring

- Extracted `resolveScopeGrowthPerSprint` helper (eliminates 3x duplicated IIFE)
- Introduced `SimulationContext` interface grouping related simulation parameters
- Added `runAllDistributions<T>()` generic sweep helper (adding a distribution is now a one-line change)
- Extracted `useScopeGrowthState` hook from `useForecastState` (392 → 367 LOC)
- Extracted `BurnUpChartCanvas` from `BurnUpChart` (349 → 179 + 195 LOC)
- Extracted `ScopeGrowthSection` from `ForecastForm` (298 → 228 + 115 LOC)
- `WorkerInput` extends `SimulationContext` instead of duplicating fields

### Test Coverage

- Added deterministic scope growth tests with exact sprint count assertions and sprint-by-sprint traces
- Added `resolveScopeGrowthPerSprint` unit tests (6 cases)
- 312 tests passing (was 305)

## v0.15.0 - 2026-02-04

### Settings

- Settings tab with persisted global preferences
- Auto-recalculate toggle (debounced 400ms for text, immediate for toggles)
- Configurable trial count (1K-50K, default 10K)
- Default chart font size and custom percentile preferences
- Theme selector moved from header to Settings

### Forecast Enhancements

- Forecast Summary Card with key metrics
- Velocity Sparkline on forecast form
- Velocity Trend Chart on Sprint History tab
- Scope creep forecasting with growth model
- Productivity Adjustments moved below forecast form

### Refactoring

- Decomposed `useForecastState` into focused hooks (useSprintData, useForecastInputs, useChartSettings)
- New settings-store (Zustand + localStorage) separate from project data

## v0.14.0 - 2026-02-03

### Milestones

- Ordered release milestones with per-milestone forecast dates
- Milestone reference lines on burn-up chart with show/hide toggles
- Scope line visibility control
- Milestone selectors on CDF and histogram charts

### Refactoring

- Extracted `CollapsibleCrudPanel` generic component (~200 LOC saved)
- Extracted import validation module from project-store
- Consolidated Monte Carlo simulation with sampler factory pattern (665 → 445 LOC)
- Extracted shared `ChartToolbar` component

### Test Coverage

- 271 tests passing

## v0.13.0 - 2026-02-03

### Visualization

- Histogram chart showing probability density distribution across sprint ranges
- Confidence interval shading on burn-up chart (toggleable)
- Scope change trend analysis with sparkline on Sprint History tab

### User Experience

- Dark mode support with system preference detection and manual toggle
- Keyboard shortcuts for tab navigation (1-4) and help modal (?)

### Test Coverage

- Added 22 new tests (242 → 264 total) for histogram binning and scope analysis

## v0.9.0 - 2026-02-02

### Dependencies

- Upgraded Next.js 16.1.4 → 16.1.6 (security patches for CVE-2025-55183, CVE-2025-55184)
- Upgraded React/React-DOM 19.2.3 → 19.2.4 (DoS mitigations, Server Components hardening)
- Upgraded eslint-config-next to 16.1.6
- Upgraded @types/node ^20 → ^24
- All caret-range dependencies resolved to latest stable

## v0.8.0 - 2026-01-29

### Bug Fixes

- Fixed productivity factor truncation that could silently bias forecasts when trials exceed 200 sprints
- Fixed burn-up chart crash when no forecast lines intersect scope
- Fixed CSV export not escaping newlines in adjustment names and memos
- Fixed percentile calculation for out-of-range input values

### Refactoring

- Consolidated 8 redundant trial functions into generic `runTrial()` with thin wrappers
- Removed deprecated dual-forecast API
- Extracted SprintConfig component from SprintHistoryTab (322 → 198 LOC)

### Test Coverage

- Added 62 new tests (89 → 151 total) for math, burn-up, export-csv, and monte-carlo edge cases

### Enhancements

- Console warnings for distribution parameter fallbacks
- Version mismatch logging on data import
- Orphaned session state cleaned up on project delete
- Import errors shown as dismissible inline messages instead of browser alerts

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

## v0.3.0 - 2026-01-25

### User Experience

- Project selection syncs between Sprint History and Forecast tabs
- Compact sprint form with visual cues for required fields

## v0.2.0 - 2026-01-25

### Distributions

- Truncated Normal, Gamma, and Bootstrap distributions added
- Four-column forecast display with highlighting for differences

## v0.1.0 - 2026-01-24

### Initial Release

- Project management with CRUD operations
- Sprint history tracking
- Monte Carlo simulation with normal distribution
- Percentile-based forecasting (P50-P90)
- Custom percentile selector (P1-P99)
- LocalStorage persistence
