'use client'

interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-01-24',
    changes: [
      'Initial release',
      'Project management with CRUD operations',
      'Sprint history tracking',
      'Monte Carlo simulation with normal distribution',
      'Percentile-based forecasting (P50-P90)',
      'Custom percentile selector (P1-P99)',
      'LocalStorage persistence',
    ],
  },
]

export function ChangelogContent() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="text-muted-foreground">Release history for SPERT</p>
      </div>

      {CHANGELOG.map((entry) => (
        <section key={entry.version} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold">v{entry.version}</h2>
            <span className="text-sm text-muted-foreground">{entry.date}</span>
          </div>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {entry.changes.map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
