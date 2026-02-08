# Architecture

SPERT® (Statistical PERT®) — Agile Release Forecasting with Monte Carlo Simulation.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript 5.9
- **UI**: React 19.2.4, Tailwind CSS 4.x, shadcn/ui
- **Charts**: Recharts 3.x
- **State**: Zustand 5.x with localStorage persistence
- **Testing**: Vitest 4.x, Testing Library, jsdom
- **Linting**: ESLint 9.x (flat config) with eslint-config-next
- **Deployment**: Vercel (auto-deploy from main)

## Directory Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (renders AppShell)
│   └── changelog/page.tsx      # Changelog route
├── features/                   # Feature-first modules
│   ├── about/                  # About tab content
│   ├── changelog/              # Changelog display component
│   ├── forecast/               # Monte Carlo simulation & charts
│   │   ├── components/         # UI: ForecastTab, charts, forms, mode toggle, ChartToolbar
│   │   │   ├── BurnUpChart.tsx           # Burn-up orchestration (config, data prep)
│   │   │   ├── BurnUpChartCanvas.tsx     # Pure Recharts burn-up rendering
│   │   │   ├── ForecastForm.tsx          # Forecast input form
│   │   │   ├── ForecastModeToggle.tsx    # History/Subjective pill-style toggle
│   │   │   ├── SubjectiveInputs.tsx      # CV elicitation for Subjective mode
│   │   │   ├── VolatilityAdjuster.tsx    # SD multiplier radio panel for History mode
│   │   │   ├── ScopeGrowthSection.tsx    # Scope growth modeling controls
│   │   │   └── ...                       # Results, CDF, histogram, milestones, etc.
│   │   ├── hooks/              # State orchestration
│   │   │   ├── useForecastState.ts       # Top-level simulation orchestration
│   │   │   ├── useScopeGrowthState.ts    # Scope growth state + resolution
│   │   │   ├── useSprintData.ts          # Sprint statistics & dates
│   │   │   ├── useForecastInputs.ts      # Form inputs & milestone thresholds
│   │   │   ├── useChartSettings.ts       # Chart config state
│   │   │   └── useSimulationWorker.ts    # Web Worker bridge
│   │   ├── lib/                # Pure logic: monte-carlo, burn-up, export-csv, productivity
│   │   │   ├── monte-carlo.ts            # Simulation engine (SimulationContext, runAllDistributions)
│   │   │   ├── monte-carlo.worker.ts     # Web Worker entry point
│   │   │   ├── scope-growth.ts           # Scope growth resolution helper
│   │   │   ├── burn-up.ts                # Burn-up chart data calculation
│   │   │   ├── export-csv.ts             # CSV generation & download
│   │   │   ├── productivity.ts           # Productivity adjustment factors
│   │   │   ├── statistics.ts             # Scope change analysis
│   │   │   └── cdf.ts                    # CDF calculation utilities
│   │   ├── constants.ts        # DEFAULT_TRIAL_COUNT, percentile bounds
│   │   └── types.ts            # Forecast-specific types
│   ├── projects/               # Project CRUD & reordering
│   ├── settings/               # Global settings (simulation, chart defaults, theme)
│   └── sprint-history/         # Sprint data entry & velocity stats
├── shared/                     # Cross-feature utilities
│   ├── components/             # UI primitives (CopyImageButton, CollapsibleCrudPanel, ListRowActions)
│   ├── constants.ts            # APP_VERSION, APP_NAME
│   ├── hooks/                  # Infrastructure hooks (useDebounce, useIsClient)
│   ├── lib/                    # Pure utilities: math, dates, copy-image, colors
│   ├── state/                  # Zustand stores (project-store, settings-store, import-validation, storage)
│   └── types/                  # Shared types (burn-up config, project/sprint)
├── shell/                      # App layout & navigation
│   └── components/             # AppShell, TabNavigation, Footer
└── lib/                        # shadcn utility (cn function)
```

## Key Design Decisions

**Feature-first modules**: Each feature owns its components, lib, constants, and types. No cross-feature imports except through shared/.

**Vertical slices**: Features are self-contained slices. No Clean Architecture layers or ceremony.

**~300 LOC cap**: Components are kept under ~300 lines. Larger components get split (e.g., BurnUpChartCanvas from BurnUpChart, ScopeGrowthSection from ForecastForm).

**Constants in narrowest scope**: Feature constants live in feature directories. Only truly global constants live in shared/constants.ts.

**Pure simulation logic**: Monte Carlo simulation, productivity calculations, burn-up projections, and CSV export are pure functions in `lib/` directories with colocated tests. The simulation engine uses:
- **Sampler factory pattern** (`createSampler`, `createBootstrapSampler`) to decouple distribution selection from trial execution
- **`SimulationContext`** interface to group related simulation parameters (config, velocities, productivity factors, scope growth)
- **`runAllDistributions<T>()`** generic helper to sweep all six distributions (T-Normal, Lognormal, Gamma, Bootstrap, Triangular, Uniform) with a single callback

**Hook decomposition**: `useForecastState` orchestrates forecast lifecycle by composing focused hooks: `useSprintData` (statistics), `useForecastInputs` (form state), `useChartSettings` (chart config), `useScopeGrowthState` (scope growth state + resolution), and `useSimulationWorker` (Web Worker bridge).

**Reusable CRUD pattern**: `CollapsibleCrudPanel<T>` provides a generic expand/collapse panel with add/edit/delete state machine, used by Milestones and Productivity Adjustments. `ListRowActions` provides shared Edit/Delete button markup.

**Date handling**: UTC for arithmetic (avoids DST drift), local timezone for user-facing display. Sprint finish dates always land on business days.

## Data Flow

1. **Projects & Sprints** are persisted in localStorage via Zustand middleware (`spert-data` key)
2. **Global settings** (trial count, auto-recalc, chart defaults, theme) persisted separately (`spert-settings` key)
3. **Forecast inputs** (backlog, velocity overrides, forecast mode, CV selection, volatility multiplier) are session-only state per project
4. **Monte Carlo simulation** runs in a Web Worker with configurable trial count (default 10,000) across six distributions (T-Normal, Lognormal, Gamma, Bootstrap, Triangular, Uniform); History mode displays five (T-Normal, Lognormal, Gamma, Triangular, Bootstrap), Subjective mode displays five (T-Normal, Lognormal, Gamma, Triangular, Uniform)
5. **Scope growth modeling** resolves per-sprint scope injection from calculated or custom rates via `resolveScopeGrowthPerSprint()`
6. **Productivity adjustments** modify velocity per sprint based on date-range overlap
7. **Milestone forecasts** use cumulative thresholds with remaining-backlog checks, correctly accounting for scope growth
8. **Auto-recalculation** (when enabled) debounces text inputs at 400ms, triggers immediately for toggles/dropdowns
9. **Charts** (CDF, burn-up, histogram) render from simulation results using Recharts

## Testing

Tests are colocated as `*.test.ts` files alongside source. Pure logic in `lib/` directories has the highest coverage priority. Deterministic tests (stdDev=0) verify exact sprint counts for scope growth and milestone scenarios. Run with `npm test`.
