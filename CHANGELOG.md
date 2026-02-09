# Changelog

## v0.17.1 - 2026-02-09

### Bug Fixes

- **Burn-up chart milestone data**: burn-up chart now uses overall simulation data instead of per-milestone data, so selecting a milestone in the Custom Percentile dropdown no longer corrupts forecast lines
- **Milestone dropdown index sync**: selecting the first visible milestone in Custom Percentile now shows correct results (auto-corrects stale index when milestones are filtered)
- **Burn-up scope line**: scope line no longer capped to milestone threshold when backlog exceeds it
- **Productivity adjustment date display**: restored year in date range display while keeping compact font

### Enhancements

- **Preset color swatches**: milestone color picker now shows 5 quick-pick swatches alongside the full custom color picker
- **Milestone dropdown filtering**: Custom Percentile dropdown only shows milestones checked for chart display
- **Milestone drag reorder**: milestones can be reordered via drag handles in the milestone list
- **Forecast summary sentence**: reordered to lead with distribution type ("Using the X distribution, there is a Y% chance...")
- **Burn-up chart sliders**: percentile sliders now step by 5 (range P5-P95) for easier control
- **Productivity end date auto-seed**: end date auto-adjusts to start + 1 day when creating/editing adjustments
- **Productivity form layout**: Name field shrunk, Memo field expanded for better space utilization
- **About page**: expanded SPERT description with full context on PERT origins and modern approach

### Decoupling

- **Backlog independence**: backlog field is fully decoupled from milestones — always editable, never auto-overridden by milestone totals

### Refactoring

- Introduced `overallSimulationData` state to separate burn-up chart data from per-milestone CDF/histogram data
- Removed dead `milestoneTotal` from `useForecastInputs` (leftover from backlog/milestone coupling)
- Hoisted duplicate `escCsv` helper to module scope in `export-csv.ts`
- Extracted milestone visibility filtering with `originalIndex` mapping for correct simulation data lookup

### Test Coverage

- Added test for CSV export with per-milestone data (`PER-MILESTONE PERCENTILE RESULTS` section)
- Added float-parsing edge cases for scope growth custom input
- Added sentence-order assertion for forecast summary text
- 390 tests passing (was 363)

## v0.17.0 - 2026-02-07

### Features

- **Subjective Forecasting (Cold-Start Mode)**: Teams with no sprint history can now produce probabilistic forecasts using a velocity estimate and variability level
- Forecast mode toggle: pill-style switch between History and Subjective modes
- Auto-detects mode based on sprint count (5+ sprints → History, otherwise Subjective)
- CV elicitation UI: 6 radio buttons (Very Low to Extreme) with dynamic velocity range labels
- Two new probability distributions: Triangular and Uniform
- Mode-aware results tables: Subjective shows T-Normal, Lognormal, Triangular, Uniform; History shows T-Normal, Lognormal, Gamma, Bootstrap
- All 6 distributions available in burn-up chart distribution selector regardless of mode
- CDF, histogram, and burn-up charts render mode-appropriate distributions
- CSV export includes forecast mode metadata and mode-appropriate distribution columns

### Volatility Adjuster (History Mode)

- **Opt-in volatility adjustment** for History mode: adjust the calculated standard deviation with human-readable multipliers
- 4 radio options: Less volatile (0.75x), Match history (1.0x), Slightly more volatile (1.25x), Much more volatile (1.5x)
- Each option shows a rounded velocity range preview (e.g., "45–95") using the existing `roundRange()` function
- Inline toggle link ("Adjust" / "Close") in the Std Dev helper text — zero layout disruption
- Std Dev field becomes read-only when adjuster is active; reverts to editable when closed
- Collapsing the adjuster resets multiplier to 1.0; expanding clears any manual SD override
- Amber color scheme distinguishes from Subjective mode's blue CV selector
- Volatility multiplier included in CSV export when ≠ 1.0

### Engine

- `createSampler` expanded with optional bounds parameter for Triangular/Uniform distributions
- `runAllDistributions` now sweeps all 6 distributions (was 4)
- `randomTriangular` and `randomUniform` math functions with floor-at-zero safety
- Expanded `QuadSimulationData`, `QuadCustomResults`, and milestone types for 6 distributions
- `effectiveStdDev` in History mode now applies `calculatedStdDev * volatilityMultiplier`

### Test Coverage

- New tests for `randomTriangular`, `randomUniform`, CV rounding helpers
- New tests for `VOLATILITY_OPTIONS` ordering, values, and `DEFAULT_VOLATILITY_MULTIPLIER`
- New tests for volatility multiplier in CSV export
- Updated existing tests for expanded data structures
- 363 tests passing (was 338)

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
