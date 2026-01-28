// Core domain types for SPERT

export interface ProductivityAdjustment {
  id: string
  name: string // e.g., "Holiday Season", "Team Vacation"
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string // ISO date string (YYYY-MM-DD)
  factor: number // 0.0 to 1.0 (0 = no productivity, 1 = normal)
  enabled: boolean // Whether this adjustment is active for forecasting
  reason?: string // Optional description
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  sprintCadenceWeeks?: 1 | 2 | 3 | 4 // Optional until configured on Sprint History tab
  projectStartDate?: string // ISO date string (YYYY-MM-DD)
  projectFinishDate?: string // ISO date string (YYYY-MM-DD)
  firstSprintStartDate?: string // ISO date string (YYYY-MM-DD) - when the team started their first sprint
  unitOfMeasure: string
  productivityAdjustments?: ProductivityAdjustment[] // Periods of reduced productivity for forecasting
  createdAt: string
  updatedAt: string
}

export interface Sprint {
  id: string
  projectId: string
  sprintNumber: number // Sequential sprint number (1, 2, 3, ...)
  sprintStartDate: string // ISO date string (YYYY-MM-DD) - calculated from firstSprintStartDate + cadence
  sprintFinishDate: string // ISO date string (YYYY-MM-DD) - calculated, always a business day (Mon-Fri)
  doneValue: number
  backlogAtSprintEnd?: number // Optional: total backlog remaining at sprint end (for burn-up chart)
  includedInForecast: boolean
  createdAt: string
  updatedAt: string
}

export interface VelocityStats {
  count: number
  mean: number
  standardDeviation: number
}

export interface ForecastConfig {
  remainingBacklog: number
  velocityMean: number
  velocityStdDev: number
  startDate: string // ISO date string
  trialCount: number
}

export interface ForecastResult {
  percentile: number
  finishDate: string // ISO date string
  sprintsRequired: number
}

export interface PercentileResult {
  p50: ForecastResult
  p60: ForecastResult
  p70: ForecastResult
  p80: ForecastResult
  p90: ForecastResult
  custom?: ForecastResult
}
