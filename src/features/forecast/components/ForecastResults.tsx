'use client'

import { cn } from '@/lib/utils'
import type { PercentileResults, QuadResults } from '../lib/monte-carlo'
import type { MilestoneResults } from '../hooks/useForecastState'
import { formatDate } from '@/shared/lib/dates'
import type { Milestone, ForecastMode } from '@/shared/types'
import { getVisibleDistributions, DISTRIBUTION_LABELS } from '../types'

interface ForecastResultsProps {
  results: QuadResults
  forecastMode: ForecastMode
  completedSprintCount: number
  onExport?: () => void
  milestones?: Milestone[]
  milestoneResultsState?: MilestoneResults | null
  cumulativeThresholds?: number[]
  unitOfMeasure?: string
}

interface DistColumn {
  key: keyof QuadResults
  label: string
}

function getDistributionColumns(forecastMode: ForecastMode, hasBootstrap: boolean): DistColumn[] {
  return getVisibleDistributions(forecastMode, hasBootstrap).map((key) => ({
    key,
    label: DISTRIBUTION_LABELS[key],
  }))
}

type PercentileKey = 'p50' | 'p60' | 'p70' | 'p80' | 'p90'

interface PercentileRow {
  key: string
  label: string
  values: ({ sprintsRequired: number; finishDate: string } | null)[]
}

function buildPercentileRows(
  results: QuadResults,
  columns: DistColumn[]
): PercentileRow[] {
  const percentiles: { key: PercentileKey; label: string }[] = [
    { key: 'p50', label: 'P50' },
    { key: 'p60', label: 'P60' },
    { key: 'p70', label: 'P70' },
    { key: 'p80', label: 'P80' },
    { key: 'p90', label: 'P90' },
  ]
  return percentiles.map(({ key, label }) => ({
    key,
    label,
    values: columns.map((col) => {
      const distResults = results[col.key]
      if (!distResults) return null
      return (distResults as PercentileResults)[key]
    }),
  }))
}

function ResultsTable({
  rows,
  columns,
  completedSprintCount,
}: {
  rows: PercentileRow[]
  columns: DistColumn[]
  completedSprintCount: number
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th rowSpan={2} className="px-2 py-3 text-left text-sm font-medium text-muted-foreground align-bottom">Conf.</th>
          {columns.map((col) => (
            <th key={col.key} colSpan={2} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b border-border">
              {col.label}
            </th>
          ))}
        </tr>
        <tr className="border-b border-border">
          {columns.map((col) => [
            <th key={`${col.key}-sprint`} className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Sprint</th>,
            <th key={`${col.key}-date`} className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const baseResult = row.values[0]
          return (
            <tr key={row.key} className="border-b border-border">
              <td className="px-2 py-3 text-sm font-medium dark:text-gray-100">{row.label}</td>
              {row.values.map((result, colIdx) => {
                const col = columns[colIdx]
                if (!result) return (
                  <td key={col.key} colSpan={2} className="px-2 py-3 text-sm text-muted-foreground text-center">—</td>
                )
                const diffSprints = colIdx > 0 && baseResult && result.sprintsRequired !== baseResult.sprintsRequired
                const diffDate = colIdx > 0 && baseResult && result.finishDate !== baseResult.finishDate
                return [
                  <td key={`${col.key}-sprint`} className={cn('px-2 py-3 text-right text-sm dark:text-gray-100', diffSprints && 'text-spert-blue font-medium')}>
                    {result.sprintsRequired + completedSprintCount}
                  </td>,
                  <td key={`${col.key}-date`} className={cn('px-2 py-3 text-sm dark:text-gray-100', diffDate && 'text-spert-blue font-medium')}>
                    {formatDate(result.finishDate)}
                  </td>,
                ]
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function ForecastResults({
  results,
  forecastMode,
  completedSprintCount,
  onExport,
  milestones = [],
  milestoneResultsState,
  cumulativeThresholds = [],
  unitOfMeasure = '',
}: ForecastResultsProps) {
  const hasBootstrap = results.bootstrap !== null
  const columns = getDistributionColumns(forecastMode, hasBootstrap)
  const hasMilestones = milestones.length > 0 && milestoneResultsState && milestoneResultsState.milestoneResults.length > 0

  return (
    <div className="space-y-4">
      <h3 className="font-medium dark:text-gray-100">Forecast Results</h3>

      {hasMilestones ? (
        <div className="space-y-6">
          {milestones.map((milestone, idx) => {
            const milestoneResult = milestoneResultsState.milestoneResults[idx]
            if (!milestoneResult) return null

            const isLast = idx === milestones.length - 1
            const cumulativeBacklog = cumulativeThresholds[idx] ?? 0
            const rows = buildPercentileRows(milestoneResult as QuadResults, columns)

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
                    rows={rows}
                    columns={columns}
                    completedSprintCount={completedSprintCount}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ResultsTable
            rows={buildPercentileRows(results, columns)}
            columns={columns}
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
            {forecastMode === 'subjective' ? (
              <>
                <strong>T-Normal</strong>: symmetric, bounded at zero.{' '}
                <strong>Lognorm</strong>: right-skewed.{' '}
                <strong>Gamma</strong>: flexible shape.{' '}
                <strong>Triangular</strong>: peak at estimate.{' '}
                <strong>Uniform</strong>: equal probability across range.
              </>
            ) : (
              <>
                <strong>T-Normal</strong>: symmetric, bounded at zero.{' '}
                <strong>Lognorm</strong>: right-skewed.{' '}
                <strong>Gamma</strong>: flexible shape.{' '}
                <strong>Triangular</strong>: peak at mean.
                {hasBootstrap && (
                  <>
                    {' '}<strong>Bootstrap</strong>: samples from actual sprint history (#NoEstimates).
                  </>
                )}
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
