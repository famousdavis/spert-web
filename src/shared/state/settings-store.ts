import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from './storage'
import { type ChartFontSize, DEFAULT_CHART_FONT_SIZE } from '@/shared/types/burn-up'
import { DEFAULT_TRIAL_COUNT, DEFAULT_SELECTED_PERCENTILES, SELECTABLE_PERCENTILES } from '@/features/forecast/constants'

const SETTINGS_STORAGE_KEY = 'spert-settings'

export type TrialCount = 1000 | 5000 | 10000 | 25000 | 50000

export const TRIAL_COUNT_OPTIONS: { value: TrialCount; label: string }[] = [
  { value: 1000, label: '1,000' },
  { value: 5000, label: '5,000' },
  { value: 10000, label: '10,000' },
  { value: 25000, label: '25,000' },
  { value: 50000, label: '50,000' },
]

interface SettingsState {
  // Simulation
  autoRecalculate: boolean
  trialCount: TrialCount

  // Chart defaults
  defaultChartFontSize: ChartFontSize
  defaultCustomPercentile: number // 1-99
  defaultCustomPercentile2: number // 1-99
  defaultResultsPercentiles: number[] // subset of [10,20,...,90]

  // Export attribution
  exportName: string
  exportId: string

  // Actions
  setAutoRecalculate: (value: boolean) => void
  setTrialCount: (value: TrialCount) => void
  setDefaultChartFontSize: (value: ChartFontSize) => void
  setDefaultCustomPercentile: (value: number) => void
  setDefaultCustomPercentile2: (value: number) => void
  setDefaultResultsPercentiles: (value: number[]) => void
  setExportName: (value: string) => void
  setExportId: (value: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      autoRecalculate: false,
      trialCount: DEFAULT_TRIAL_COUNT as TrialCount,
      defaultChartFontSize: DEFAULT_CHART_FONT_SIZE,
      defaultCustomPercentile: 85,
      defaultCustomPercentile2: 50,
      defaultResultsPercentiles: [...DEFAULT_SELECTED_PERCENTILES],

      // Export attribution
      exportName: '',
      exportId: '',

      // Actions
      setAutoRecalculate: (value) => set({ autoRecalculate: value }),
      setTrialCount: (value) => set({ trialCount: value }),
      setDefaultChartFontSize: (value) => set({ defaultChartFontSize: value }),
      setDefaultCustomPercentile: (value) =>
        set({ defaultCustomPercentile: Math.max(1, Math.min(99, Math.round(value))) }),
      setDefaultCustomPercentile2: (value) =>
        set({ defaultCustomPercentile2: Math.max(1, Math.min(99, Math.round(value))) }),
      setDefaultResultsPercentiles: (value) =>
        set({
          defaultResultsPercentiles: value
            .filter((p) => (SELECTABLE_PERCENTILES as readonly number[]).includes(p))
            .sort((a, b) => a - b),
        }),
      setExportName: (value) => set({ exportName: value }),
      setExportId: (value) => set({ exportId: value }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const str = storage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          storage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          storage.removeItem(name)
        },
      },
    }
  )
)
