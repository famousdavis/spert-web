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
    version: '0.16.1',
    date: '2026-02-06',
    sections: [
      {
        title: 'Bug Fixes',
        items: [
          'Burn-up chart forecast lines now target highest visible milestone instead of total project scope',
          'Historical scope line capped to milestone target, eliminating misleading cliff at forecast boundary',
        ],
      },
      {
        title: 'Dark Mode',
        items: [
          'Active tab dimmed for reduced glare against dark backgrounds',
          'Export/Import buttons switch to ghost variants (outlined with tinted background)',
          'Add Milestone/Add Adjustment buttons use matching ghost variant',
          'Tab container border now visible in dark mode',
        ],
      },
    ],
  },
  {
    version: '0.16.0',
    date: '2026-02-05',
    sections: [
      {
        title: 'Custom Scope Growth Override',
        items: [
          'Choose between calculated scope growth (from sprint history) or a custom user-specified rate',
          'Radio button selection between Calculated and Custom when scope growth is enabled',
          'Custom input allows negative values for scope shrinking scenarios',
          'Warning indicator applies to whichever mode is active (calculated or custom)',
          'Summary text indicates source: "(calculated)" or "(custom)"',
          'Auto-recalculation supports both modes with debounced custom input',
        ],
      },
      {
        title: 'Bug Fixes',
        items: [
          'Fixed tab margin jitter on Windows caused by scrollbar appearing/disappearing between tabs',
          'Updated About page to not hardcode trial count',
          'Dynamic copyright year in footer',
        ],
      },
    ],
  },
  {
    version: '0.15.0',
    date: '2026-02-05',
    sections: [
      {
        title: 'Settings Tab',
        items: [
          'New Settings tab with persisted global preferences',
          'Auto-recalculate toggle: re-runs forecast automatically when inputs change (after first manual run)',
          'Configurable simulation trial count (1,000–50,000) with default of 10,000',
          'Default chart font size preference (Small/Medium/Large)',
          'Default custom percentile preference (1–99)',
          'Theme selector (Light/Dark/System) moved from header to Settings',
        ],
      },
      {
        title: 'User Experience',
        items: [
          'Debounced auto-recalculation (400ms) for text inputs, immediate for toggles and dropdowns',
          'Productivity Adjustments moved below forecast form as a set-and-forget section',
          'Keyboard shortcut 4 → Settings, 5 → About',
        ],
      },
      {
        title: 'Architecture',
        items: [
          'New settings-store (Zustand + localStorage) separate from project data store',
          'Trial count now configurable via settings instead of hard-coded constant',
        ],
      },
    ],
  },
  {
    version: '0.14.0',
    date: '2026-02-05',
    sections: [
      {
        title: 'Release Milestone Forecasts',
        items: [
          'Define ordered release milestones (e.g., MVP, Beta, GA) with remaining work per milestone',
          'Per-milestone forecast dates at all percentiles (P50, P60, P70, P80, P90)',
          'Single simulation with checkpoint recording preserves statistical correlation between milestones',
          'Milestone reference lines on burn-up chart at cumulative scope levels',
          'Milestone dropdown selector on CDF and histogram charts to view per-milestone distributions',
          'Custom percentile selector supports per-milestone results',
          'Remaining Backlog auto-computed from milestones when defined (read-only)',
        ],
      },
      {
        title: 'Chart Controls',
        items: [
          'Show/hide individual milestone lines on burn-up chart via checkbox toggle',
          'Show/hide scope line on burn-up chart for cleaner visualization',
        ],
      },
      {
        title: 'Data & Export',
        items: [
          'CSV export includes milestone definitions, per-milestone percentile results',
          'Import/export validation supports milestone data',
          'Milestone CRUD with edit, delete, and confirmation dialogs',
        ],
      },
      {
        title: 'Refactoring',
        items: [
          'Extracted generic CollapsibleCrudPanel component, reducing Milestones and Productivity Adjustments by ~200 LOC',
          'Extracted import validation from project-store into dedicated module (~170 LOC moved)',
          'Consolidated Monte Carlo simulation with sampler factory pattern (665 → 445 LOC)',
          'Extracted shared ChartToolbar component for CDF and histogram charts (~90 LOC saved)',
          'Removed dead code and unused props across forecast components',
        ],
      },
      {
        title: 'Test Coverage',
        items: [
          'Added 10 new tests for milestone-aware simulation logic (264 → 271 net, 3 removed with dead code)',
        ],
      },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-02-03',
    sections: [
      {
        title: 'Visualization',
        items: [
          'Histogram chart showing probability density distribution across sprint ranges',
          'Confidence interval shading on burn-up chart (toggleable)',
          'Scope change trend analysis with sparkline on Sprint History tab',
        ],
      },
      {
        title: 'User Experience',
        items: [
          'Dark mode support with system preference detection and manual toggle',
          'Keyboard shortcuts for tab navigation (1-4) and help modal (?)',
        ],
      },
      {
        title: 'Test Coverage',
        items: [
          'Added 22 new tests (242 → 264 total) for histogram binning and scope analysis',
        ],
      },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-02-03',
    sections: [
      {
        title: 'Accessibility',
        items: [
          'Added ARIA attributes to all collapsible sections (aria-expanded, aria-controls, aria-label)',
          'Replaced browser confirm dialogs with accessible modal dialog component',
          'Added aria-label to icon-only buttons (copy, export)',
          'Added keyboard support (Enter/Space) to sortable column header',
          'Added aria-label to sprint include/exclude checkboxes',
        ],
      },
      {
        title: 'Security',
        items: [
          'Strengthened import validation with numeric ranges, string length limits, and date format validation',
          'Added file type and size validation (10MB limit) on import',
          'Added Content-Security-Policy header for defense-in-depth',
          'Improved JSON parse error messages with specific failure context',
          'Added duplicate ID detection in import validation',
        ],
      },
      {
        title: 'UI Polish',
        items: [
          'Responsive padding and text sizing for mobile devices',
        ],
      },
      {
        title: 'Refactoring',
        items: [
          'Extracted CDF chart helpers to lib/cdf.ts (component now 232 LOC)',
          'Removed console.log statements from CopyImageButton',
        ],
      },
      {
        title: 'Test Coverage',
        items: [
          'Added 5 new validation tests (237 → 242 total)',
        ],
      },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-02-02',
    sections: [
      {
        title: 'Enhancements',
        items: [
          'Toast notifications for export, import, and clipboard operations (Sonner)',
          'Monte Carlo simulation moved to Web Worker for non-blocking UI',
          'Real loading state feedback during simulation runs',
          'Form validation tightened with max value constraints and NaN guards',
        ],
      },
      {
        title: 'Refactoring',
        items: [
          'Centralized 43 hardcoded colors into shared color constants',
          'Added SPERT color palette to Tailwind CSS theme',
          'Migrated 258 inline styles to Tailwind classes across 23 components',
        ],
      },
    ],
  },
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
    <div className="space-y-10 max-w-2xl mx-auto">
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
