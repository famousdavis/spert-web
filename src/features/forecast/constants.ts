// Forecast-specific constants

export const TRIAL_COUNT = 50000

export const DEFAULT_PERCENTILES = [50, 60, 70, 80, 90] as const
export const MIN_PERCENTILE = 1
export const MAX_PERCENTILE = 99

// Minimum number of included sprints required for bootstrap simulation
export const MIN_SPRINTS_FOR_BOOTSTRAP = 5

// Safety limit for maximum sprints in a single trial
// Prevents infinite loops when velocity is near zero
export const MAX_TRIAL_SPRINTS = 1000
