'use client'

import type { ForecastResult } from '@/shared/types'
import type { PercentileResults } from '../lib/monte-carlo'

/**
 * Format a date with full month name (e.g., "January 15, 2026")
 */
function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface ForecastResultsProps {
  normalResults: PercentileResults
  lognormalResults: PercentileResults
  onExport?: () => void
}

export function ForecastResults({ normalResults, lognormalResults, onExport }: ForecastResultsProps) {
  const percentiles = [
    { key: 'p50', label: 'P50', normal: normalResults.p50, lognormal: lognormalResults.p50 },
    { key: 'p60', label: 'P60', normal: normalResults.p60, lognormal: lognormalResults.p60 },
    { key: 'p70', label: 'P70', normal: normalResults.p70, lognormal: lognormalResults.p70 },
    { key: 'p80', label: 'P80', normal: normalResults.p80, lognormal: lognormalResults.p80 },
    { key: 'p90', label: 'P90', normal: normalResults.p90, lognormal: lognormalResults.p90 },
  ]

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Forecast Results</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th
                rowSpan={2}
                className="px-4 py-3 text-left text-sm font-medium text-muted-foreground align-bottom"
              >
                Confidence
              </th>
              <th
                colSpan={2}
                className="px-4 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
              >
                Normal Distribution
              </th>
              <th
                colSpan={2}
                className="px-4 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
              >
                Lognormal Distribution
              </th>
            </tr>
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Finish Date
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                Sprints
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Finish Date
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                Sprints
              </th>
            </tr>
          </thead>
          <tbody>
            {percentiles.map(({ key, label, normal, lognormal }) => {
              const sameSprints = normal.sprintsRequired === lognormal.sprintsRequired
              const sameDate = normal.finishDate === lognormal.finishDate

              return (
                <tr key={key} className="border-b border-border">
                  <td className="px-4 py-3 text-sm font-medium">{label}</td>
                  <td className="px-4 py-3 text-sm">{formatDateLong(normal.finishDate)}</td>
                  <td className="px-4 py-3 text-right text-sm">{normal.sprintsRequired}</td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{
                      color: sameDate ? 'inherit' : '#0070f3',
                      fontWeight: sameDate ? 'normal' : 500,
                    }}
                  >
                    {formatDateLong(lognormal.finishDate)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-sm"
                    style={{
                      color: sameSprints ? 'inherit' : '#0070f3',
                      fontWeight: sameSprints ? 'normal' : 500,
                    }}
                  >
                    {lognormal.sprintsRequired}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            P80 means there is an 80% chance of finishing by that date <em>or sooner</em>. Higher
            percentiles are more conservative.
          </p>
          <p>
            <strong>Normal</strong> assumes symmetric velocity variation. <strong>Lognormal</strong> assumes
            right-skewed variation (always positive, occasional high-velocity sprints possible).
          </p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            title="Export simulation data to CSV"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              opacity: 0.5,
              transition: 'opacity 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
