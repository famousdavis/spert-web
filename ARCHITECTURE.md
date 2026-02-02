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
│   │   ├── components/         # UI: ForecastTab, charts, forms
│   │   ├── lib/                # Pure logic: monte-carlo, burn-up, export-csv, productivity
│   │   ├── constants.ts        # TRIAL_COUNT, percentile bounds
│   │   └── types.ts            # Forecast-specific types
│   ├── projects/               # Project CRUD & reordering
│   ├── settings/               # Settings tab (hidden)
│   └── sprint-history/         # Sprint data entry & velocity stats
├── shared/                     # Cross-feature utilities
│   ├── components/             # UI primitives only (CopyImageButton)
│   ├── constants.ts            # APP_VERSION, APP_NAME
│   ├── hooks/                  # Infrastructure hooks (useDebounce, useIsClient)
│   ├── lib/                    # Pure utilities: math, dates, copy-image
│   ├── state/                  # Zustand store (project-store, storage)
│   └── types/                  # Shared types (burn-up config, project/sprint)
├── shell/                      # App layout & navigation
│   └── components/             # AppShell, TabNavigation, Footer
└── lib/                        # shadcn utility (cn function)
```

## Key Design Decisions

**Feature-first modules**: Each feature owns its components, lib, constants, and types. No cross-feature imports except through shared/.

**Vertical slices**: Features are self-contained slices. No Clean Architecture layers or ceremony.

**~300 LOC cap**: Components are kept under ~300 lines. Larger components get split (e.g., SprintConfig extracted from SprintHistoryTab).

**Constants in narrowest scope**: Feature constants live in feature directories. Only truly global constants live in shared/constants.ts.

**Pure simulation logic**: Monte Carlo simulation, productivity calculations, burn-up projections, and CSV export are pure functions in `lib/` directories with colocated tests.

**Date handling**: UTC for arithmetic (avoids DST drift), local timezone for user-facing display. Sprint finish dates always land on business days.

## Data Flow

1. **Projects & Sprints** are persisted in localStorage via Zustand middleware
2. **Forecast inputs** (backlog, velocity overrides) are session-only state per project
3. **Monte Carlo simulation** runs client-side with 50,000 trials across four distributions
4. **Productivity adjustments** modify velocity per sprint based on date-range overlap
5. **Charts** (CDF, burn-up) render from simulation results using Recharts

## Testing

Tests are colocated as `*.test.ts` files alongside source. Pure logic in `lib/` directories has the highest coverage priority. Run with `npm test`.
