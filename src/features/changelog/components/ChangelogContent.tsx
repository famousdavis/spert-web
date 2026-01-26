'use client'

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
    version: '0.3.0',
    date: '2026-01-25',
    sections: [
      {
        title: 'User Experience',
        items: [
          'Project selection now syncs between Sprint History and Forecast tabs',
          'Compact sprint form: Done input and Include checkbox on same line as sprint dates',
          'Visual cues for required Done field (blue border, light blue background when empty)',
        ],
      },
      {
        title: 'About Page',
        items: [
          'Redesigned About page with GanttApp-style formatting',
          'Added Author & Source Code section with GitHub link button',
          'Added Your Data & Privacy section explaining local storage',
          'Added No Warranty Disclaimer from GNU GPL v3',
          'Updated trademark text with full USPTO reference',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-01-25',
    sections: [
      {
        title: 'Distribution Enhancements',
        items: [
          'Replaced normal distribution with truncated normal (bounded at zero) using rejection sampling',
          'Added Gamma distribution using Marsaglia-Tsang method',
          'Added Bootstrap simulation (#NoEstimates) that samples from actual sprint history',
          'Bootstrap automatically enabled when 5+ sprints are included in forecast',
        ],
      },
      {
        title: 'UI Improvements',
        items: [
          'Four-column forecast display: T-Normal, Lognorm, Gamma, Bootstrap',
          'Blue highlighting for results that differ from truncated normal baseline',
          'Responsive grid layout adapts based on bootstrap availability',
        ],
      },
      {
        title: 'Export',
        items: [
          'CSV export updated to include all four distributions',
          'Frequency distribution and raw trial data for all simulation methods',
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
          'Project management with CRUD operations',
          'Sprint history tracking with include/exclude toggle',
          'Monte Carlo simulation with 50,000 trials',
          'Percentile-based forecasting (P50-P90)',
          'Custom percentile selector (P1-P99)',
          'CSV export with simulation parameters and results',
          'LocalStorage persistence',
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
        <p className="text-muted-foreground" style={{ fontStyle: 'italic' }}>
          Release history for SPERT®
        </p>
      </div>

      {CHANGELOG.map((entry, entryIndex) => (
        <section
          key={entry.version}
          className="space-y-4"
          style={{
            paddingBottom: entryIndex < CHANGELOG.length - 1 ? '1.5rem' : 0,
            borderBottom: entryIndex < CHANGELOG.length - 1 ? '1px solid #e5e7eb' : 'none',
          }}
        >
          <div className="flex items-baseline gap-3">
            <h2
              className="font-semibold"
              style={{
                fontSize: '1.125rem',
                color: '#0070f3',
              }}
            >
              v{entry.version}
            </h2>
            <span className="text-sm text-muted-foreground">{entry.date}</span>
          </div>

          {entry.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              <h3
                className="font-medium"
                style={{ fontSize: '0.925rem', color: '#333' }}
              >
                {section.title}
              </h3>
              <ul className="list-disc text-sm text-muted-foreground space-y-1" style={{ paddingLeft: '1.25rem' }}>
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
