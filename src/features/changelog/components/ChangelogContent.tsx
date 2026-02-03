'use client'

import { cn } from '@/lib/utils'
import { formatDateLong } from '@/shared/lib/dates'

interface ChangelogEntry {
  version: string
  date: string
  sections: {
    title: string
    items: string[]
  }[]
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.10.0',
    date: '2026-02-02',
    sections: [
      {
        title: 'Bug Fixes',
        items: [
          'Fixed viewingProjectId not reset when deleting the viewed project',
          'Fixed package.json version mismatch',
          'Added missing viewport export for mobile rendering',
          'Fixed changelog date formatting to use shared utility',
        ],
      },
      {
        title: 'Resilience',
        items: [
          'Added import data validation with descriptive error messages',
          'Added clipboard API availability check before copy-to-image',
          'Added delete confirmations for projects, sprints, and productivity adjustments',
          'Added gamma distribution iteration limit to prevent infinite loops',
          'Added truncated normal rejection sampling fallback warning',
          'Added React error boundaries around all tab components',
          'Added HTTP security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)',
        ],
      },
      {
        title: 'Refactoring',
        items: [
          'Extracted ForecastTab state and logic into useForecastState hook (410 → 186 LOC)',
        ],
      },
      {
        title: 'Test Coverage',
        items: [
          'Added 74 new tests (151 → 225 total) covering store selectors, mutations, import validation, math edge cases, date utilities, and simulation boundaries',
        ],
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-02-02',
    sections: [
      {
        title: 'Dependencies',
        items: [
          'Upgraded Next.js 16.1.4 → 16.1.6 (security patches)',
          'Upgraded React/React-DOM 19.2.3 → 19.2.4 (DoS mitigations)',
          'Upgraded eslint-config-next to 16.1.6',
          'Upgraded @types/node ^20 → ^24',
          'All caret-range dependencies resolved to latest stable',
        ],
      },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-01-29',
    sections: [
      {
        title: 'Bug Fixes',
        items: [
          'Fixed productivity factor truncation that could silently bias forecasts',
          'Fixed burn-up chart crash when no forecast lines intersect scope',
          'Fixed CSV export not escaping newlines in adjustment names and memos',
          'Fixed percentile calculation for out-of-range input values',
        ],
      },
      {
        title: 'Refactoring',
        items: [
          'Consolidated 8 redundant trial functions into generic runTrial() with thin wrappers',
          'Removed deprecated dual-forecast API',
          'Extracted SprintConfig component from SprintHistoryTab',
        ],
      },
      {
        title: 'Test Coverage',
        items: [
          'Added 62 new tests (89 → 151 total) for math, burn-up, export-csv, and monte-carlo edge cases',
        ],
      },
      {
        title: 'Enhancements',
        items: [
          'Console warnings for distribution parameter fallbacks',
          'Version mismatch logging on data import',
          'Orphaned session state cleaned up on project delete',
          'Import errors shown as dismissible inline messages instead of browser alerts',
        ],
      },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-01-27',
    sections: [
      {
        title: 'Burn-Up Chart',
        items: [
          'Probabilistic burn-up chart showing work completed vs total scope',
          'Three configurable forecast lines with labels, percentiles, and colors',
          'Selectable distribution for projections',
        ],
      },
      {
        title: 'Sprint History',
        items: [
          'Optional "Backlog at End" field enables stepped scope line',
        ],
      },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-01-27',
    sections: [
      {
        title: 'Productivity Adjustments',
        items: [
          'Define periods of reduced productivity that adjust forecasted velocity',
          'Each adjustment has name, date range, productivity factor, and optional memo',
          'Enable/disable toggle for what-if scenarios',
        ],
      },
      {
        title: 'User Experience',
        items: [
          'Forecast form inputs persist when navigating between tabs',
        ],
      },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-01-26',
    sections: [
      {
        title: 'Features',
        items: [
          '"View History" button navigates to Sprint History for that project',
          'Copy-to-clipboard buttons for forecast inputs/results and charts',
        ],
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-01-25',
    sections: [
      {
        title: 'Visualization',
        items: [
          'CDF chart showing probability of completion within X sprints',
          'X-axis displays sprint count with finish dates',
        ],
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-01-25',
    sections: [
      {
        title: 'User Experience',
        items: [
          'Project selection syncs between Sprint History and Forecast tabs',
          'Compact sprint form with visual cues for required fields',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-01-25',
    sections: [
      {
        title: 'Distributions',
        items: [
          'Truncated Normal, Gamma, and Bootstrap distributions added',
          'Four-column forecast display with highlighting for differences',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-01-24',
    sections: [
      {
        title: 'Initial Release',
        items: [
          'Project management, sprint history, Monte Carlo simulation',
          'Percentile-based forecasting (P50-P90) with custom selector',
          'CSV export and LocalStorage persistence',
        ],
      },
    ],
  },
]

export function ChangelogContent() {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="text-muted-foreground italic">
          Release history for SPERT®
        </p>
      </div>

      {CHANGELOG.map((entry, entryIndex) => (
        <section
          key={entry.version}
          className={cn(
            'space-y-4',
            entryIndex < CHANGELOG.length - 1 && 'pb-6 border-b border-spert-border-light'
          )}
        >
          <div className="flex items-baseline gap-3">
            <h2
              className="font-semibold text-lg text-spert-blue"
            >
              v{entry.version}
            </h2>
            <span className="text-sm text-muted-foreground">{formatDateLong(entry.date)}</span>
          </div>

          {entry.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              <h3
                className="font-medium text-[0.925rem] text-spert-text"
              >
                {section.title}
              </h3>
              <ul className="list-disc text-sm text-muted-foreground space-y-1 pl-5">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
