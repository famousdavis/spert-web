'use client'

import { cn } from '@/lib/utils'
import type { PercentileResults } from '../lib/monte-carlo'
import { formatDate } from '@/shared/lib/dates'

interface ForecastResultsProps {
  truncatedNormalResults: PercentileResults
  lognormalResults: PercentileResults
  gammaResults: PercentileResults
  bootstrapResults: PercentileResults | null
  completedSprintCount: number // Number of sprints already completed (to show absolute sprint numbers)
  onExport?: () => void
}

export function ForecastResults({
  truncatedNormalResults,
  lognormalResults,
  gammaResults,
  bootstrapResults,
  completedSprintCount,
  onExport,
}: ForecastResultsProps) {
  const hasBootstrap = bootstrapResults !== null

  const percentiles = [
    {
      key: 'p50',
      label: 'P50',
      truncatedNormal: truncatedNormalResults.p50,
      lognormal: lognormalResults.p50,
      gamma: gammaResults.p50,
      bootstrap: bootstrapResults?.p50 ?? null,
    },
    {
      key: 'p60',
      label: 'P60',
      truncatedNormal: truncatedNormalResults.p60,
      lognormal: lognormalResults.p60,
      gamma: gammaResults.p60,
      bootstrap: bootstrapResults?.p60 ?? null,
    },
    {
      key: 'p70',
      label: 'P70',
      truncatedNormal: truncatedNormalResults.p70,
      lognormal: lognormalResults.p70,
      gamma: gammaResults.p70,
      bootstrap: bootstrapResults?.p70 ?? null,
    },
    {
      key: 'p80',
      label: 'P80',
      truncatedNormal: truncatedNormalResults.p80,
      lognormal: lognormalResults.p80,
      gamma: gammaResults.p80,
      bootstrap: bootstrapResults?.p80 ?? null,
    },
    {
      key: 'p90',
      label: 'P90',
      truncatedNormal: truncatedNormalResults.p90,
      lognormal: lognormalResults.p90,
      gamma: gammaResults.p90,
      bootstrap: bootstrapResults?.p90 ?? null,
    },
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
                className="px-2 py-3 text-left text-sm font-medium text-muted-foreground align-bottom"
              >
                Conf.
              </th>
              <th
                colSpan={2}
                className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
              >
                T-Normal
              </th>
              <th
                colSpan={2}
                className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
              >
                Lognorm
              </th>
              <th
                colSpan={2}
                className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
              >
                Gamma
              </th>
              {hasBootstrap && (
                <th
                  colSpan={2}
                  className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
                >
                  Bootstrap
                </th>
              )}
            </tr>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                Sprint
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                Sprint
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                Sprint
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Date
              </th>
              {hasBootstrap && (
                <>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                    Sprint
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {percentiles.map(({ key, label, truncatedNormal, lognormal, gamma, bootstrap }) => {
              // Check if lognormal differs from truncatedNormal
              const lognormalDiffSprints = truncatedNormal.sprintsRequired !== lognormal.sprintsRequired
              const lognormalDiffDate = truncatedNormal.finishDate !== lognormal.finishDate

              // Check if gamma differs from truncatedNormal
              const gammaDiffSprints = truncatedNormal.sprintsRequired !== gamma.sprintsRequired
              const gammaDiffDate = truncatedNormal.finishDate !== gamma.finishDate

              // Check if bootstrap differs from truncatedNormal
              const bootstrapDiffSprints = bootstrap && truncatedNormal.sprintsRequired !== bootstrap.sprintsRequired
              const bootstrapDiffDate = bootstrap && truncatedNormal.finishDate !== bootstrap.finishDate

              return (
                <tr key={key} className="border-b border-border">
                  <td className="px-2 py-3 text-sm font-medium">{label}</td>
                  <td className="px-2 py-3 text-right text-sm">{truncatedNormal.sprintsRequired + completedSprintCount}</td>
                  <td className="px-2 py-3 text-sm">{formatDate(truncatedNormal.finishDate)}</td>
                  <td
                    className={cn(
                      'px-2 py-3 text-right text-sm',
                      lognormalDiffSprints && 'text-spert-blue font-medium'
                    )}
                  >
                    {lognormal.sprintsRequired + completedSprintCount}
                  </td>
                  <td
                    className={cn(
                      'px-2 py-3 text-sm',
                      lognormalDiffDate && 'text-spert-blue font-medium'
                    )}
                  >
                    {formatDate(lognormal.finishDate)}
                  </td>
                  <td
                    className={cn(
                      'px-2 py-3 text-right text-sm',
                      gammaDiffSprints && 'text-spert-blue font-medium'
                    )}
                  >
                    {gamma.sprintsRequired + completedSprintCount}
                  </td>
                  <td
                    className={cn(
                      'px-2 py-3 text-sm',
                      gammaDiffDate && 'text-spert-blue font-medium'
                    )}
                  >
                    {formatDate(gamma.finishDate)}
                  </td>
                  {hasBootstrap && bootstrap && (
                    <>
                      <td
                        className={cn(
                          'px-2 py-3 text-right text-sm',
                          bootstrapDiffSprints && 'text-spert-blue font-medium'
                        )}
                      >
                        {bootstrap.sprintsRequired + completedSprintCount}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-3 text-sm',
                          bootstrapDiffDate && 'text-spert-blue font-medium'
                        )}
                      >
                        {formatDate(bootstrap.finishDate)}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-start">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            P80 means there is an 80% chance of finishing by that date <em>or sooner</em>. Higher
            percentiles are more conservative.
          </p>
          <p>
            <strong>T-Normal</strong>: symmetric, bounded at zero.{' '}
            <strong>Lognorm</strong>: right-skewed.{' '}
            <strong>Gamma</strong>: flexible shape.
            {hasBootstrap && (
              <>
                {' '}<strong>Bootstrap</strong>: samples from actual sprint history (#NoEstimates).
              </>
            )}
          </p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            title="Export simulation data to CSV"
            className="bg-transparent border-none cursor-pointer p-1 opacity-50 hover:opacity-100 transition-opacity duration-200 shrink-0"
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
