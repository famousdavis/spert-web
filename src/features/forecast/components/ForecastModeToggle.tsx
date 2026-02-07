'use client'

import { cn } from '@/lib/utils'
import type { ForecastMode } from '@/shared/types'

interface ForecastModeToggleProps {
  mode: ForecastMode
  onModeChange: (mode: ForecastMode) => void
  canUseHistory: boolean
  includedSprintCount: number
}

export function ForecastModeToggle({
  mode,
  onModeChange,
  canUseHistory,
  includedSprintCount,
}: ForecastModeToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-medium text-spert-text-muted">Mode:</span>
      <div className="inline-flex rounded-full border border-spert-border dark:border-gray-600 overflow-hidden">
        <button
          type="button"
          onClick={() => onModeChange('history')}
          disabled={!canUseHistory}
          title={
            canUseHistory
              ? 'Forecast from sprint history'
              : `Need ${5 - includedSprintCount} more sprint(s) for history mode`
          }
          className={cn(
            'px-3 py-1 text-xs font-medium transition-colors duration-150',
            mode === 'history'
              ? 'bg-spert-blue text-white'
              : canUseHistory
                ? 'bg-transparent text-spert-text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
        >
          History
        </button>
        <button
          type="button"
          onClick={() => onModeChange('subjective')}
          className={cn(
            'px-3 py-1 text-xs font-medium transition-colors duration-150',
            mode === 'subjective'
              ? 'bg-spert-blue text-white'
              : 'bg-transparent text-spert-text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          Subjective
        </button>
      </div>
    </div>
  )
}
