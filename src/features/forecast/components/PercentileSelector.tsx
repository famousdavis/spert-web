'use client'

import type { RefObject } from 'react'
import type { ForecastResult, Milestone, ForecastMode } from '@/shared/types'
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
  triangularResult: ForecastResult | null
  uniformResult: ForecastResult | null
  forecastMode: ForecastMode
  completedSprintCount: number
  onPercentileChange: (percentile: number) => void
  selectorRef?: RefObject<HTMLDivElement | null>
  milestones?: Milestone[]
  selectedMilestoneIndex?: number
  onMilestoneIndexChange?: (index: number) => void
}

interface DistCard {
  label: string
  result: ForecastResult | null
}

function getDistCards(
  forecastMode: ForecastMode,
  props: PercentileSelectorProps
): DistCard[] {
  if (forecastMode === 'subjective') {
    return [
      { label: 'T-Normal', result: props.truncatedNormalResult },
      { label: 'Lognorm', result: props.lognormalResult },
      { label: 'Triangular', result: props.triangularResult },
      { label: 'Uniform', result: props.uniformResult },
    ]
  }
  const cards: DistCard[] = [
    { label: 'T-Normal', result: props.truncatedNormalResult },
    { label: 'Lognorm', result: props.lognormalResult },
    { label: 'Gamma', result: props.gammaResult },
  ]
  if (props.bootstrapResult !== null) {
    cards.push({ label: 'Bootstrap', result: props.bootstrapResult })
  }
  return cards
}

export function PercentileSelector(props: PercentileSelectorProps) {
  const {
    percentile,
    forecastMode,
    completedSprintCount,
    onPercentileChange,
    selectorRef,
    milestones = [],
    selectedMilestoneIndex = 0,
    onMilestoneIndexChange,
  } = props

  const cards = getDistCards(forecastMode, props)
  const baseResult = cards[0]?.result
  const hasResults = cards.every((c) => c.result !== null)

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
        <div className={`grid gap-4 sm:grid-cols-${cards.length}`}>
          {cards.map((card, idx) => {
            const result = card.result!
            const isDiff = idx > 0 && baseResult && result.finishDate !== baseResult.finishDate
            return (
              <div key={card.label} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </p>
                <div
                  className={cn(
                    'rounded-lg bg-muted/50 p-3',
                    isDiff && 'border-l-[3px] border-l-spert-blue'
                  )}
                >
                  <p className="text-sm text-muted-foreground">Finish Date</p>
                  <p
                    className={cn(
                      'text-base font-semibold',
                      isDiff && 'text-spert-blue'
                    )}
                  >
                    {formatDate(result.finishDate)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sprint {result.sprintsRequired + completedSprintCount}
                  </p>
                </div>
              </div>
            )
          })}
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
