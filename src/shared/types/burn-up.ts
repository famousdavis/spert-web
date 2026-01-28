// Burn-up chart configuration types
// Located in shared/types to avoid circular dependency with project-store

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
    { label: 'Optimistic', percentile: 10, color: '#f97316' }, // Orange
    { label: 'Expected', percentile: 50, color: '#eab308' }, // Yellow
    { label: 'Conservative', percentile: 90, color: '#3b82f6' }, // Blue
  ],
}

// Distribution display names for dropdown
export const DISTRIBUTION_LABELS: Record<DistributionType, string> = {
  truncatedNormal: 'T-Normal',
  lognormal: 'Lognorm',
  gamma: 'Gamma',
  bootstrap: 'Bootstrap',
}
