// Burn-up chart configuration types
// Located in shared/types to avoid circular dependency with project-store

import { COLORS } from '@/shared/lib/colors'

export type DistributionType = 'truncatedNormal' | 'lognormal' | 'gamma' | 'bootstrap'

export interface ForecastLineConfig {
  label: string
  percentile: number // 1-99
  color: string // hex color
}

export interface BurnUpConfig {
  distribution: DistributionType
  lines: [ForecastLineConfig, ForecastLineConfig, ForecastLineConfig]
}

export const DEFAULT_BURN_UP_CONFIG: BurnUpConfig = {
  distribution: 'truncatedNormal',
  lines: [
    { label: 'Optimistic', percentile: 10, color: COLORS.burnUp.optimistic },
    { label: 'Expected', percentile: 50, color: COLORS.burnUp.expected },
    { label: 'Conservative', percentile: 90, color: COLORS.burnUp.conservative },
  ],
}

// Distribution display names for dropdown
export const DISTRIBUTION_LABELS: Record<DistributionType, string> = {
  truncatedNormal: 'T-Normal',
  lognormal: 'Lognorm',
  gamma: 'Gamma',
  bootstrap: 'Bootstrap',
}

// Chart font size configuration
export type ChartFontSize = 'small' | 'medium' | 'large'

export interface ChartFontSizes {
  axisTick: number
  axisLabel: number
  legend: number
  dateLabel: number
}

export const CHART_FONT_SIZES: Record<ChartFontSize, ChartFontSizes> = {
  small: { axisTick: 11, axisLabel: 12, legend: 13, dateLabel: 11 },
  medium: { axisTick: 13, axisLabel: 14, legend: 15, dateLabel: 13 },
  large: { axisTick: 15, axisLabel: 16, legend: 17, dateLabel: 15 },
}

export const CHART_FONT_SIZE_LABELS: Record<ChartFontSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}

export const DEFAULT_CHART_FONT_SIZE: ChartFontSize = 'medium'
