'use client'

import { cn } from '@/lib/utils'
import type { PercentileResults } from '../lib/monte-carlo'
import type { MilestoneResults } from '../hooks/useForecastState'
import { formatDate } from '@/shared/lib/dates'
import type { Milestone } from '@/shared/types'

interface ForecastResultsProps {
  truncatedNormalResults: PercentileResults
  lognormalResults: PercentileResults
  gammaResults: PercentileResults
  bootstrapResults: PercentileResults | null
  completedSprintCount: number
  onExport?: () => void
  milestones?: Milestone[]
  milestoneResultsState?: MilestoneResults | null
  cumulativeThresholds?: number[]
  unitOfMeasure?: string
}

function buildPercentileRows(
  truncatedNormalResults: PercentileResults,
  lognormalResults: PercentileResults,
  gammaResults: PercentileResults,
  bootstrapResults: PercentileResults | null
) {
  return [
    { key: 'p50', label: 'P50', truncatedNormal: truncatedNormalResults.p50, lognormal: lognormalResults.p50, gamma: gammaResults.p50, bootstrap: bootstrapResults?.p50 ?? null },
    { key: 'p60', label: 'P60', truncatedNormal: truncatedNormalResults.p60, lognormal: lognormalResults.p60, gamma: gammaResults.p60, bootstrap: bootstrapResults?.p60 ?? null },
    { key: 'p70', label: 'P70', truncatedNormal: truncatedNormalResults.p70, lognormal: lognormalResults.p70, gamma: gammaResults.p70, bootstrap: bootstrapResults?.p70 ?? null },
    { key: 'p80', label: 'P80', truncatedNormal: truncatedNormalResults.p80, lognormal: lognormalResults.p80, gamma: gammaResults.p80, bootstrap: bootstrapResults?.p80 ?? null },
    { key: 'p90', label: 'P90', truncatedNormal: truncatedNormalResults.p90, lognormal: lognormalResults.p90, gamma: gammaResults.p90, bootstrap: bootstrapResults?.p90 ?? null },
  ]
}

function ResultsTable({
  percentiles,
  hasBootstrap,
  completedSprintCount,
}: {
  percentiles: ReturnType<typeof buildPercentileRows>
  hasBootstrap: boolean
  completedSprintCount: number
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th rowSpan={2} className="px-2 py-3 text-left text-sm font-medium text-muted-foreground align-bottom">Conf.</th>
          <th colSpan={2} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border">T-Normal</th>
          <th colSpan={2} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border">Lognorm</th>
          <th colSpan={2} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border">Gamma</th>
          {hasBootstrap && (
            <th colSpan={2} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border">Bootstrap</th>
          )}
        </tr>
        <tr className="border-b border-border">
          <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Sprint</th>
          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
          <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Sprint</th>
          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
          <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Sprint</th>
          <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
          {hasBootstrap && (
            <>
              <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Sprint</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {percentiles.map(({ key, label, truncatedNormal, lognormal, gamma, bootstrap }) => {
          const lognormalDiffSprints = truncatedNormal.sprintsRequired !== lognormal.sprintsRequired
          const lognormalDiffDate = truncatedNormal.finishDate !== lognormal.finishDate
          const gammaDiffSprints = truncatedNormal.sprintsRequired !== gamma.sprintsRequired
          const gammaDiffDate = truncatedNormal.finishDate !== gamma.finishDate
          const bootstrapDiffSprints = bootstrap && truncatedNormal.sprintsRequired !== bootstrap.sprintsRequired
          const bootstrapDiffDate = bootstrap && truncatedNormal.finishDate !== bootstrap.finishDate

          return (
            <tr key={key} className="border-b border-border">
              <td className="px-2 py-3 text-sm font-medium dark:text-gray-100">{label}</td>
              <td className="px-2 py-3 text-right text-sm dark:text-gray-100">{truncatedNormal.sprintsRequired + completedSprintCount}</td>
              <td className="px-2 py-3 text-sm dark:text-gray-100">{formatDate(truncatedNormal.finishDate)}</td>
              <td className={cn('px-2 py-3 text-right text-sm dark:text-gray-100', lognormalDiffSprints && 'text-spert-blue font-medium')}>
                {lognormal.sprintsRequired + completedSprintCount}
              </td>
              <td className={cn('px-2 py-3 text-sm dark:text-gray-100', lognormalDiffDate && 'text-spert-blue font-medium')}>
                {formatDate(lognormal.finishDate)}
              </td>
              <td className={cn('px-2 py-3 text-right text-sm dark:text-gray-100', gammaDiffSprints && 'text-spert-blue font-medium')}>
                {gamma.sprintsRequired + completedSprintCount}
              </td>
              <td className={cn('px-2 py-3 text-sm dark:text-gray-100', gammaDiffDate && 'text-spert-blue font-medium')}>
                {formatDate(gamma.finishDate)}
              </td>
              {hasBootstrap && bootstrap && (
                <>
                  <td className={cn('px-2 py-3 text-right text-sm dark:text-gray-100', bootstrapDiffSprints && 'text-spert-blue font-medium')}>
                    {bootstrap.sprintsRequired + completedSprintCount}
                  </td>
                  <td className={cn('px-2 py-3 text-sm dark:text-gray-100', bootstrapDiffDate && 'text-spert-blue font-medium')}>
                    {formatDate(bootstrap.finishDate)}
                  </td>
                </>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function ForecastResults({
  truncatedNormalResults,
  lognormalResults,
  gammaResults,
  bootstrapResults,
  completedSprintCount,
  onExport,
  milestones = [],
  milestoneResultsState,
  cumulativeThresholds = [],
  unitOfMeasure = '',
}: ForecastResultsProps) {
  const hasBootstrap = bootstrapResults !== null
  const hasMilestones = milestones.length > 0 && milestoneResultsState && milestoneResultsState.milestoneResults.length > 0

  return (
    <div className="space-y-4">
      <h3 className="font-medium dark:text-gray-100">Forecast Results</h3>

      {hasMilestones ? (
        // Milestone-grouped results
        <div className="space-y-6">
          {milestones.map((milestone, idx) => {
            const milestoneResult = milestoneResultsState.milestoneResults[idx]
            if (!milestoneResult) return null

            const isLast = idx === milestones.length - 1
            const cumulativeBacklog = cumulativeThresholds[idx] ?? 0
            const percentiles = buildPercentileRows(
              milestoneResult.truncatedNormal,
              milestoneResult.lognormal,
              milestoneResult.gamma,
              milestoneResult.bootstrap
            )

            return (
              <div key={milestone.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: milestone.color }}
                  />
                  <h4 className="text-sm font-semibold dark:text-gray-100">
                    {milestone.name}
                    <span className="ml-2 font-normal text-spert-text-muted">
                      ({milestone.backlogSize.toLocaleString()} {unitOfMeasure} remaining
                      {!isLast && ` \u2022 ${cumulativeBacklog.toLocaleString()} cumulative`})
                    </span>
                    {isLast && (
                      <span className="ml-2 text-xs font-normal text-spert-text-muted italic">
                        Total
                      </span>
                    )}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <ResultsTable
                    percentiles={percentiles}
                    hasBootstrap={hasBootstrap}
                    completedSprintCount={completedSprintCount}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Simple mode — single table
        <div className="overflow-x-auto">
          <ResultsTable
            percentiles={buildPercentileRows(truncatedNormalResults, lognormalResults, gammaResults, bootstrapResults)}
            hasBootstrap={hasBootstrap}
            completedSprintCount={completedSprintCount}
          />
        </div>
      )}

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
            aria-label="Export simulation data to CSV"
            className="bg-transparent border-none cursor-pointer p-1 opacity-50 hover:opacity-100 transition-opacity duration-200 shrink-0"
          >
            <svg
              aria-hidden="true"
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
