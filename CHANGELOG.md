# Changelog

## v0.5.0 - 2026-01-26

### Projects Tab

- Added "View History" button on project rows to navigate directly to Sprint History
- Clicking View History switches tab and selects the associated project
- Sprint cadence now shown only when configured (no default 2-week value)

### Sprint History Tab

- Sprint configuration (cadence and start date) now required before adding sprints
- Add Sprint button disabled with visual feedback until configuration complete
- Required field styling for Sprint Cadence and First Sprint Start Date

### Forecast Tab

- Sprint numbers now show absolute values (completed + remaining sprints)
- Reordered columns: Sprint before Date in Forecast Results table
- Spelled out "Sprint" instead of abbreviation "Spr"
- Velocity and Std Dev fields now display with white background and black text
- "Calculated:" helper text always visible below fields for reference

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
