'use client'

import type { RefObject } from 'react'
import type { ForecastResult, Milestone } from '@/shared/types'
import { cn } from '@/lib/utils'
import { MIN_PERCENTILE, MAX_PERCENTILE } from '../constants'
import { CopyImageButton } from '@/shared/components/CopyImageButton'
import { formatDate } from '@/shared/lib/dates'

interface PercentileSelectorProps {
  percentile: number
  truncatedNormalResult: ForecastResult | null
  lognormalResult: ForecastResult | null
  gammaResult: ForecastResult | null
  bootstrapResult: ForecastResult | null
  completedSprintCount: number
  onPercentileChange: (percentile: number) => void
  selectorRef?: RefObject<HTMLDivElement | null>
  milestones?: Milestone[]
  selectedMilestoneIndex?: number
  onMilestoneIndexChange?: (index: number) => void
}

export function PercentileSelector({
  percentile,
  truncatedNormalResult,
  lognormalResult,
  gammaResult,
  bootstrapResult,
  completedSprintCount,
  onPercentileChange,
  selectorRef,
  milestones = [],
  selectedMilestoneIndex = 0,
  onMilestoneIndexChange,
}: PercentileSelectorProps) {
  const hasResults = truncatedNormalResult && lognormalResult && gammaResult
  const hasBootstrap = bootstrapResult !== null

  return (
    <div className="relative">
      <div ref={selectorRef} className="space-y-4 rounded-lg border border-border dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <h3 className="font-medium dark:text-gray-100">Custom Percentile</h3>
          {milestones.length > 0 && onMilestoneIndexChange && (
            <select
              value={selectedMilestoneIndex}
              onChange={(e) => onMilestoneIndexChange(Number(e.target.value))}
              className="text-sm border border-spert-border dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-gray-100"
              aria-label="Select milestone for custom percentile"
            >
              {milestones.map((m, idx) => (
                <option key={m.id} value={idx}>
                  {m.name}{idx === milestones.length - 1 ? ' (Total)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

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
              <p className="text-base font-semibold">{formatDate(truncatedNormalResult.finishDate)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sprint {truncatedNormalResult.sprintsRequired + completedSprintCount}
              </p>
            </div>
          </div>

          {/* Lognormal Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lognorm
            </p>
            <div
              className={cn(
                'rounded-lg bg-muted/50 p-3',
                truncatedNormalResult.finishDate !== lognormalResult.finishDate && 'border-l-[3px] border-l-spert-blue'
              )}
            >
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p
                className={cn(
                  'text-base font-semibold',
                  truncatedNormalResult.finishDate !== lognormalResult.finishDate && 'text-spert-blue'
                )}
              >
                {formatDate(lognormalResult.finishDate)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sprint {lognormalResult.sprintsRequired + completedSprintCount}
              </p>
            </div>
          </div>

          {/* Gamma Distribution Results */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Gamma
            </p>
            <div
              className={cn(
                'rounded-lg bg-muted/50 p-3',
                truncatedNormalResult.finishDate !== gammaResult.finishDate && 'border-l-[3px] border-l-spert-blue'
              )}
            >
              <p className="text-sm text-muted-foreground">Finish Date</p>
              <p
                className={cn(
                  'text-base font-semibold',
                  truncatedNormalResult.finishDate !== gammaResult.finishDate && 'text-spert-blue'
                )}
              >
                {formatDate(gammaResult.finishDate)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sprint {gammaResult.sprintsRequired + completedSprintCount}
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
                className={cn(
                  'rounded-lg bg-muted/50 p-3',
                  truncatedNormalResult.finishDate !== bootstrapResult.finishDate && 'border-l-[3px] border-l-spert-blue'
                )}
              >
                <p className="text-sm text-muted-foreground">Finish Date</p>
                <p
                  className={cn(
                    'text-base font-semibold',
                    truncatedNormalResult.finishDate !== bootstrapResult.finishDate && 'text-spert-blue'
                  )}
                >
                  {formatDate(bootstrapResult.finishDate)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sprint {bootstrapResult.sprintsRequired + completedSprintCount}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      {selectorRef && hasResults && (
        <div className="absolute top-2 right-2">
          <CopyImageButton
            targetRef={selectorRef}
            title="Copy custom percentile as image"
          />
        </div>
      )}
    </div>
  )
}
