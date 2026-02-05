'use client'

import { useSettingsStore, TRIAL_COUNT_OPTIONS, type TrialCount } from '@/shared/state/settings-store'
import { CHART_FONT_SIZE_LABELS, type ChartFontSize } from '@/shared/types/burn-up'
import { useTheme, type Theme } from '@/shared/hooks/useTheme'
import { MIN_PERCENTILE, MAX_PERCENTILE } from '@/features/forecast/constants'

const sectionHeaderClass = 'text-lg font-semibold text-spert-blue mb-4'
const labelClass = 'text-sm font-semibold text-spert-text-secondary dark:text-gray-300'
const descriptionClass = 'text-xs text-spert-text-muted dark:text-gray-400 mt-0.5'
const selectClass = 'p-2 text-sm border border-spert-border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-spert-text dark:text-gray-100 cursor-pointer'
const inputClass = 'p-2 text-sm border border-spert-border dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-spert-text dark:text-gray-100 w-20'

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const FONT_SIZE_OPTIONS: { value: ChartFontSize; label: string }[] = [
  { value: 'small', label: CHART_FONT_SIZE_LABELS.small },
  { value: 'medium', label: CHART_FONT_SIZE_LABELS.medium },
  { value: 'large', label: CHART_FONT_SIZE_LABELS.large },
]

export function SettingsTab() {
  const {
    autoRecalculate,
    setAutoRecalculate,
    trialCount,
    setTrialCount,
    defaultChartFontSize,
    setDefaultChartFontSize,
    defaultCustomPercentile,
    setDefaultCustomPercentile,
  } = useSettingsStore()

  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-8 max-w-[800px]">
      <div>
        <h2 className="text-xl font-semibold text-spert-text dark:text-gray-100">Settings</h2>
        <p className="text-sm text-spert-text-muted dark:text-gray-400 italic">
          Global preferences for simulation and display
        </p>
      </div>

      {/* Simulation Settings */}
      <section>
        <h3 className={sectionHeaderClass}>Simulation</h3>
        <div className="space-y-5">
          {/* Auto-recalculate */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="autoRecalculate"
              checked={autoRecalculate}
              onChange={(e) => setAutoRecalculate(e.target.checked)}
              className="mt-1 rounded border-gray-300 dark:border-gray-500 cursor-pointer"
            />
            <div>
              <label htmlFor="autoRecalculate" className={`${labelClass} cursor-pointer`}>
                Auto-recalculate
              </label>
              <p className={descriptionClass}>
                Automatically re-run the forecast when inputs change. Takes effect after the first manual run.
              </p>
            </div>
          </div>

          {/* Trial count */}
          <div className="flex items-start gap-3">
            <div>
              <label htmlFor="trialCount" className={labelClass}>
                Number of simulations
              </label>
              <p className={descriptionClass}>
                More trials produce smoother distributions but take longer. Each distribution runs this many trials.
              </p>
            </div>
            <select
              id="trialCount"
              value={trialCount}
              onChange={(e) => setTrialCount(Number(e.target.value) as TrialCount)}
              className={`${selectClass} ml-auto flex-shrink-0`}
            >
              {TRIAL_COUNT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Chart Defaults */}
      <section>
        <h3 className={sectionHeaderClass}>Chart Defaults</h3>
        <div className="space-y-5">
          {/* Default chart font size */}
          <div className="flex items-start gap-3">
            <div>
              <label htmlFor="defaultFontSize" className={labelClass}>
                Chart font size
              </label>
              <p className={descriptionClass}>
                Default font size for new chart sessions. Individual charts can still be overridden.
              </p>
            </div>
            <select
              id="defaultFontSize"
              value={defaultChartFontSize}
              onChange={(e) => setDefaultChartFontSize(e.target.value as ChartFontSize)}
              className={`${selectClass} ml-auto flex-shrink-0`}
            >
              {FONT_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default custom percentile */}
          <div className="flex items-start gap-3">
            <div>
              <label htmlFor="defaultPercentile" className={labelClass}>
                Default custom percentile
              </label>
              <p className={descriptionClass}>
                Initial percentile for the custom percentile selector ({MIN_PERCENTILE}&ndash;{MAX_PERCENTILE}).
              </p>
            </div>
            <input
              id="defaultPercentile"
              type="number"
              min={MIN_PERCENTILE}
              max={MAX_PERCENTILE}
              value={defaultCustomPercentile}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val)) setDefaultCustomPercentile(val)
              }}
              className={`${inputClass} ml-auto flex-shrink-0`}
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section>
        <h3 className={sectionHeaderClass}>Appearance</h3>
        <div className="space-y-5">
          {/* Theme */}
          <div className="flex items-start gap-3">
            <div>
              <label htmlFor="theme" className={labelClass}>
                Theme
              </label>
              <p className={descriptionClass}>
                Choose between light, dark, or system-default appearance.
              </p>
            </div>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              className={`${selectClass} ml-auto flex-shrink-0`}
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  )
}
