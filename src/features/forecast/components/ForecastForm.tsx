'use client'

import { cn } from '@/lib/utils'

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
  onRemainingBacklogChange: (value: string) => void
  onVelocityMeanChange: (value: string) => void
  onVelocityStdDevChange: (value: string) => void
  onRunForecast: () => void
  canRun: boolean
  isSimulating: boolean
}

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
  onRemainingBacklogChange,
  onVelocityMeanChange,
  onVelocityStdDevChange,
  onRunForecast,
  canRun,
  isSimulating,
}: ForecastFormProps) {
  return (
    <div className="rounded-lg border border-border p-4 bg-spert-bg-input">
      <div className="flex gap-4 items-start flex-wrap">
        {/* Remaining Backlog */}
        <div className="flex-[1_1_150px] min-w-[120px]">
          <label
            htmlFor="remainingBacklog"
            className="block mb-1 text-sm font-semibold text-spert-text-secondary"
          >
            Backlog ({unitOfMeasure}) <span className="text-spert-error">*</span>
          </label>
          <input
            id="remainingBacklog"
            type="number"
            min="0"
            max="999999"
            step="any"
            value={remainingBacklog}
            onChange={(e) => onRemainingBacklogChange(e.target.value)}
            className={cn(
              'p-2 text-[0.9rem] rounded w-full',
              remainingBacklog
                ? 'border border-spert-border bg-white'
                : 'border-2 border-spert-blue bg-spert-bg-highlight'
            )}
            placeholder="Required"
          />
        </div>

        {/* Velocity */}
        <div className="flex-[1_1_150px] min-w-[120px]">
          <label
            htmlFor="velocityMean"
            className="block mb-1 text-sm font-semibold text-spert-text-secondary"
          >
            Velocity ({unitOfMeasure}/sprint)
          </label>
          <input
            id="velocityMean"
            type="number"
            min="0"
            max="999999"
            step="any"
            value={velocityMean || (calculatedMean > 0 ? calculatedMean.toFixed(1) : '')}
            onChange={(e) => onVelocityMeanChange(e.target.value)}
            className="p-2 text-[0.9rem] border border-spert-border rounded w-full bg-white text-spert-text"
            placeholder={calculatedMean > 0 ? '' : 'No data'}
          />
          <p className="text-xs text-spert-text-muted mt-1">
            {calculatedMean > 0
              ? `Calculated: ${calculatedMean.toFixed(1)}`
              : 'Add sprints to calculate'}
          </p>
        </div>

        {/* Velocity Std Dev */}
        <div className="flex-[1_1_130px] min-w-[110px]">
          <label
            htmlFor="velocityStdDev"
            className="block mb-1 text-sm font-semibold text-spert-text-secondary"
          >
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
            className="p-2 text-[0.9rem] border border-spert-border rounded w-full bg-white text-spert-text"
            placeholder={calculatedStdDev > 0 ? '' : 'No data'}
          />
          <p className="text-xs text-spert-text-muted mt-1">
            {calculatedStdDev > 0
              ? `Calculated: ${calculatedStdDev.toFixed(1)}`
              : 'Need 2+ sprints'}
          </p>
        </div>

        {/* Forecast Start Date */}
        <div className="flex-[0_0_150px]">
          <label
            htmlFor="startDate"
            className="block mb-1 text-sm font-semibold text-spert-text-secondary"
          >
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            readOnly
            className="p-2 text-[0.9rem] border border-spert-border rounded w-[150px] bg-spert-bg-disabled cursor-not-allowed text-spert-text"
          />
          <p className="text-xs text-spert-text-muted mt-1">
            Next sprint start
          </p>
        </div>

        {/* Sprint Cadence (display only) */}
        <div className="flex-[0_0_80px]">
          <label
            className="block mb-1 text-sm font-semibold text-spert-text-secondary"
          >
            Cadence
          </label>
          <div
            className="p-2 text-[0.9rem] border border-spert-border rounded bg-spert-bg-disabled text-spert-text text-center"
          >
            {sprintCadenceWeeks ? `${sprintCadenceWeeks} Week${sprintCadenceWeeks > 1 ? 's' : ''}` : '—'}
          </div>
          <p className="text-xs text-spert-text-muted mt-1">
            &nbsp;
          </p>
        </div>

        {/* Run Forecast Button */}
        <div className="flex-[0_0_auto] self-end pb-5">
          <button
            onClick={onRunForecast}
            disabled={!canRun || isSimulating}
            className={cn(
              'px-4 py-2 text-white border-none rounded text-[0.9rem] font-semibold h-[38px] w-[140px] transition-[background-color,transform] duration-150 ease-in-out',
              isSimulating
                ? 'bg-spert-success cursor-not-allowed scale-[0.97]'
                : canRun
                  ? 'bg-spert-blue cursor-pointer scale-100'
                  : 'bg-[#ccc] cursor-not-allowed scale-100'
            )}
          >
            {isSimulating ? 'Running…' : 'Run Forecast'}
          </button>
          {!canRun && remainingBacklog && effectiveMean <= 0 && (
            <p className="text-xs text-spert-error mt-1">
              Velocity must be &gt; 0
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
