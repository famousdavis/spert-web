'use client'

import type { ForecastResult } from '@/shared/types'
import { MIN_PERCENTILE, MAX_PERCENTILE } from '../constants'

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

interface PercentileSelectorProps {
  percentile: number
  normalResult: ForecastResult | null
  lognormalResult: ForecastResult | null
  onPercentileChange: (percentile: number) => void
}

export function PercentileSelector({
  percentile,
  normalResult,
  lognormalResult,
  onPercentileChange,
}: PercentileSelectorProps) {
  const hasResults = normalResult && lognormalResult

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <h3 className="font-medium">Custom Percentile</h3>

      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <label htmlFor="customPercentile" className="text-sm font-medium">
            Select percentile (P{MIN_PERCENTILE}-P{MAX_PERCENTILE})
          </label>
          <div className="flex items-center gap-4">
            <input
              id="customPercentile"
              type="range"
              min={MIN_PERCENTILE}
              max={MAX_PERCENTILE}
              value={percentile}
              onChange={(e) => onPercentileChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-right text-sm font-medium">P{percentile}</span>
          </div>
        </div>
      </div>

      {hasResults && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Normal Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Normal Distribution
            </p>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p className="text-lg font-semibold">{formatDateLong(normalResult.finishDate)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {normalResult.sprintsRequired} sprints
              </p>
            </div>
          </div>

          {/* Lognormal Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lognormal Distribution
            </p>
            <div
              className="rounded-lg bg-muted/50 p-3"
              style={{
                borderLeft:
                  normalResult.finishDate !== lognormalResult.finishDate
                    ? '3px solid #0070f3'
                    : undefined,
              }}
            >
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p
                className="text-lg font-semibold"
                style={{
                  color:
                    normalResult.finishDate !== lognormalResult.finishDate ? '#0070f3' : 'inherit',
                }}
              >
                {formatDateLong(lognormalResult.finishDate)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {lognormalResult.sprintsRequired} sprints
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
