'use client'

import { cn } from '@/lib/utils'
import type { ScopeChangeStats } from '../lib/statistics'
import type { Sprint } from '@/shared/types'
import { VelocitySparkline } from './VelocitySparkline'

interface ForecastFormProps {
  remainingBacklog: string
  velocityMean: string
  velocityStdDev: string
  startDate: string
  sprintCadenceWeeks: number | undefined
  calculatedMean: number
  calculatedStdDev: number
  effectiveMean: number
  unitOfMeasure: string
  backlogReadOnly?: boolean // True when milestones control the backlog
  sprints: Sprint[]
  scopeChangeStats?: ScopeChangeStats | null
  modelScopeGrowth: boolean
  onModelScopeGrowthChange: (value: boolean) => void
  onRemainingBacklogChange: (value: string) => void
  onVelocityMeanChange: (value: string) => void
  onVelocityStdDevChange: (value: string) => void
  onRunForecast: () => void
  canRun: boolean
  isSimulating: boolean
}

// Shared label style: fixed height for consistent alignment, text pinned to bottom
const labelClass = 'flex items-end mb-1 text-sm font-semibold text-spert-text-secondary min-h-[1.75rem]'
// Shared helper text style: fixed height for consistent bottom alignment
const helperClass = 'text-xs text-spert-text-muted mt-1 h-4'

export function ForecastForm({
  remainingBacklog,
  velocityMean,
  velocityStdDev,
  startDate,
  sprintCadenceWeeks,
  calculatedMean,
  calculatedStdDev,
  effectiveMean,
  unitOfMeasure,
  backlogReadOnly = false,
  sprints,
  scopeChangeStats,
  modelScopeGrowth,
  onModelScopeGrowthChange,
  onRemainingBacklogChange,
  onVelocityMeanChange,
  onVelocityStdDevChange,
  onRunForecast,
  canRun,
  isSimulating,
}: ForecastFormProps) {
  return (
    <div className="rounded-lg border border-border dark:border-gray-700 p-4 bg-spert-bg-input dark:bg-gray-800">
      <div className="flex gap-4 items-end flex-wrap">
        {/* Remaining Backlog */}
        <div className="flex-[1.5_1_170px] min-w-[120px]">
          <label htmlFor="remainingBacklog" className={labelClass}>
            Backlog {!backlogReadOnly && <span className="text-spert-error ml-0.5">*</span>}<span className="ml-auto text-xs font-normal italic text-spert-text-muted">{unitOfMeasure}</span>
          </label>
          <input
            id="remainingBacklog"
            type="number"
            min="0"
            max="999999"
            step="any"
            value={remainingBacklog}
            onChange={(e) => onRemainingBacklogChange(e.target.value)}
            readOnly={backlogReadOnly}
            className={cn(
              'p-2 text-[0.9rem] rounded w-full dark:text-gray-100',
              backlogReadOnly
                ? 'border border-spert-border dark:border-gray-600 bg-spert-bg-disabled dark:bg-gray-700 cursor-not-allowed'
                : remainingBacklog
                  ? 'border border-spert-border dark:border-gray-600 bg-white dark:bg-gray-700'
                  : 'border-2 border-spert-blue bg-spert-bg-highlight dark:bg-blue-900/30'
            )}
            placeholder={backlogReadOnly ? '' : 'Required'}
          />
          <p className={helperClass}>
            {backlogReadOnly ? 'From milestones' : '\u00A0'}
          </p>
        </div>

        {/* Velocity */}
        <div className="flex-[1.5_1_170px] min-w-[120px]">
          <label htmlFor="velocityMean" className={labelClass}>
            Velocity
          </label>
          <input
            id="velocityMean"
            type="number"
            min="0"
            max="999999"
            step="any"
            value={velocityMean || (calculatedMean > 0 ? calculatedMean.toFixed(1) : '')}
            onChange={(e) => onVelocityMeanChange(e.target.value)}
            className="p-2 text-[0.9rem] border border-spert-border dark:border-gray-600 rounded w-full bg-white dark:bg-gray-700 text-spert-text dark:text-gray-100"
            placeholder={calculatedMean > 0 ? '' : 'No data'}
          />
          <p className={helperClass}>
            {calculatedMean > 0
              ? `Calc: ${calculatedMean.toFixed(1)}`
              : 'Add sprints to calculate'}
          </p>
        </div>

        {/* Velocity Std Dev */}
        <div className="flex-[0_0_90px]">
          <label htmlFor="velocityStdDev" className={labelClass}>
            Std Dev
          </label>
          <input
            id="velocityStdDev"
            type="number"
            min="0"
            max="999999"
            step="any"
            value={velocityStdDev || (calculatedStdDev > 0 ? calculatedStdDev.toFixed(1) : '')}
            onChange={(e) => onVelocityStdDevChange(e.target.value)}
            className="p-2 text-[0.9rem] border border-spert-border dark:border-gray-600 rounded w-full bg-white dark:bg-gray-700 text-spert-text dark:text-gray-100"
            placeholder={calculatedStdDev > 0 ? '' : 'No data'}
          />
          <p className={helperClass}>
            {calculatedStdDev > 0
              ? `Calc: ${calculatedStdDev.toFixed(1)}`
              : 'Need 2+ sprints'}
          </p>
        </div>

        {/* Velocity Sparkline — nudged up to visually center with input fields */}
        {sprints.length >= 2 && (
          <div className="flex-[0_0_auto] relative -top-2">
            <VelocitySparkline sprints={sprints} />
          </div>
        )}

        {/* Forecast Start Date */}
        <div className="flex-[0_0_130px]">
          <label htmlFor="startDate" className={labelClass}>
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            readOnly
            className="p-2 text-[0.9rem] border border-spert-border dark:border-gray-600 rounded w-[130px] bg-spert-bg-disabled dark:bg-gray-700 cursor-not-allowed text-spert-text dark:text-gray-100"
          />
          <p className={helperClass}>
            Next sprint start
          </p>
        </div>

        {/* Sprint Cadence (display only) */}
        <div className="flex-[0_0_80px]">
          <label className={labelClass}>
            Cadence
          </label>
          <div
            className="p-2 text-[0.9rem] border border-spert-border dark:border-gray-600 rounded bg-spert-bg-disabled dark:bg-gray-700 text-spert-text dark:text-gray-100 text-center"
          >
            {sprintCadenceWeeks ? `${sprintCadenceWeeks} Week${sprintCadenceWeeks > 1 ? 's' : ''}` : '—'}
          </div>
          <p className={helperClass}>
            &nbsp;
          </p>
        </div>

        {/* Run Forecast Button — same label/content/helper structure */}
        <div className="flex-[0_0_auto]">
          <div className="min-h-[1.75rem] mb-1" />
          <button
            onClick={onRunForecast}
            disabled={!canRun || isSimulating}
            className={cn(
              'px-4 py-2 text-white border-none rounded text-[0.9rem] font-semibold h-[38px] w-[140px] transition-[background-color,transform] duration-150 ease-in-out',
              isSimulating
                ? 'bg-spert-success cursor-not-allowed scale-[0.97]'
                : canRun
                  ? 'bg-spert-blue cursor-pointer scale-100'
                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed scale-100'
            )}
          >
            {isSimulating ? 'Running…' : 'Run Forecast'}
          </button>
          <p className="h-4 mt-1">
            {!canRun && remainingBacklog && effectiveMean <= 0 && (
              <span className="text-xs text-spert-error">
                Velocity must be &gt; 0
              </span>
            )}
            {canRun && '\u00A0'}
          </p>
        </div>
      </div>

      {/* Scope Growth Modeling */}
      {scopeChangeStats && (
        <div className="mt-3 rounded-md border border-border dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 flex items-center gap-3">
          <label htmlFor="modelScopeGrowth" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="modelScopeGrowth"
              checked={modelScopeGrowth}
              onChange={(e) => onModelScopeGrowthChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-500"
            />
            <span className="text-sm font-medium text-spert-text-secondary dark:text-gray-300">
              Model scope growth
            </span>
          </label>
          <span className="text-spert-border dark:text-gray-500">|</span>
          <span className={cn(
            'text-sm font-semibold tabular-nums',
            scopeChangeStats.averageScopeInjection > 0
              ? 'text-amber-600 dark:text-amber-400'
              : scopeChangeStats.averageScopeInjection < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-spert-text-muted'
          )}>
            {scopeChangeStats.averageScopeInjection > 0 ? '+' : ''}
            {scopeChangeStats.averageScopeInjection.toFixed(1)} {unitOfMeasure}/sprint
          </span>
          <span className="text-xs text-spert-text-muted dark:text-gray-400">
            from {scopeChangeStats.sprintsWithData} sprints
          </span>
          {modelScopeGrowth && scopeChangeStats.averageScopeInjection >= effectiveMean && (
            <span className="text-xs text-spert-error dark:text-red-400 font-medium ml-auto">
              ⚠ Scope growth ≥ velocity
            </span>
          )}
        </div>
      )}
    </div>
  )
}
