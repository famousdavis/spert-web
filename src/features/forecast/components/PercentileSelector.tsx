'use client'

import type { ForecastResult } from '@/shared/types'
import { MIN_PERCENTILE, MAX_PERCENTILE } from '../constants'

/**
 * Format a date with abbreviated month (e.g., "Jan 15, 2026")
 */
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface PercentileSelectorProps {
  percentile: number
  truncatedNormalResult: ForecastResult | null
  lognormalResult: ForecastResult | null
  gammaResult: ForecastResult | null
  bootstrapResult: ForecastResult | null
  onPercentileChange: (percentile: number) => void
}

export function PercentileSelector({
  percentile,
  truncatedNormalResult,
  lognormalResult,
  gammaResult,
  bootstrapResult,
  onPercentileChange,
}: PercentileSelectorProps) {
  const hasResults = truncatedNormalResult && lognormalResult && gammaResult
  const hasBootstrap = bootstrapResult !== null

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
        <div className={`grid gap-4 ${hasBootstrap ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
          {/* Truncated Normal Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              T-Normal
            </p>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p className="text-base font-semibold">{formatDateShort(truncatedNormalResult.finishDate)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {truncatedNormalResult.sprintsRequired} sprints
              </p>
            </div>
          </div>

          {/* Lognormal Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lognorm
            </p>
            <div
              className="rounded-lg bg-muted/50 p-3"
              style={{
                borderLeft:
                  truncatedNormalResult.finishDate !== lognormalResult.finishDate
                    ? '3px solid #0070f3'
                    : undefined,
              }}
            >
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p
                className="text-base font-semibold"
                style={{
                  color:
                    truncatedNormalResult.finishDate !== lognormalResult.finishDate ? '#0070f3' : 'inherit',
                }}
              >
                {formatDateShort(lognormalResult.finishDate)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {lognormalResult.sprintsRequired} sprints
              </p>
            </div>
          </div>

          {/* Gamma Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Gamma
            </p>
            <div
              className="rounded-lg bg-muted/50 p-3"
              style={{
                borderLeft:
                  truncatedNormalResult.finishDate !== gammaResult.finishDate
                    ? '3px solid #0070f3'
                    : undefined,
              }}
            >
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p
                className="text-base font-semibold"
                style={{
                  color:
                    truncatedNormalResult.finishDate !== gammaResult.finishDate ? '#0070f3' : 'inherit',
                }}
              >
                {formatDateShort(gammaResult.finishDate)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {gammaResult.sprintsRequired} sprints
              </p>
            </div>
          </div>

          {/* Bootstrap Distribution Results */}
          {hasBootstrap && bootstrapResult && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Bootstrap
              </p>
              <div
                className="rounded-lg bg-muted/50 p-3"
                style={{
                  borderLeft:
                    truncatedNormalResult.finishDate !== bootstrapResult.finishDate
                      ? '3px solid #0070f3'
                      : undefined,
                }}
              >
                <p className="text-sm text-muted-foreground">Finish Date</p>
                <p
                  className="text-base font-semibold"
                  style={{
                    color:
                      truncatedNormalResult.finishDate !== bootstrapResult.finishDate ? '#0070f3' : 'inherit',
                  }}
                >
                  {formatDateShort(bootstrapResult.finishDate)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bootstrapResult.sprintsRequired} sprints
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
