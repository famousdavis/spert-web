import {
  randomNormal,
  randomLognormalFromMeanStdDev,
  percentileFromSorted,
} from '@/shared/lib/math'
import { addWeeks } from '@/shared/lib/dates'
import type { ForecastConfig, ForecastResult } from '@/shared/types'

export type DistributionType = 'normal' | 'lognormal'

export interface SimulationInput {
  remainingBacklog: number
  velocityMean: number
  velocityStdDev: number
  startDate: string
  sprintCadenceWeeks: number
  trialCount: number
  distributionType?: DistributionType
}

export interface SimulationOutput {
  sprintsRequired: number[] // Array of sprint counts from each trial
  percentiles: Map<number, ForecastResult>
  distributionType: DistributionType
}

export interface PercentileResults {
  p50: ForecastResult
  p60: ForecastResult
  p70: ForecastResult
  p80: ForecastResult
  p90: ForecastResult
}

export interface DualForecastResults {
  normal: PercentileResults
  lognormal: PercentileResults
}

/**
 * Run a single Monte Carlo trial using normal distribution
 * Returns the number of sprints required to complete the backlog
 */
export function runSingleTrialNormal(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = 1000 // Safety limit

  while (remaining > 0 && sprints < maxSprints) {
    // Generate velocity for this sprint from normal distribution
    // Ensure velocity is at least 0.1 to prevent infinite loops
    const velocity = Math.max(0.1, randomNormal(velocityMean, velocityStdDev))
    remaining -= velocity
    sprints++
  }

  return sprints
}

/**
 * Run a single Monte Carlo trial using lognormal distribution
 * Returns the number of sprints required to complete the backlog
 */
export function runSingleTrialLognormal(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = 1000 // Safety limit

  while (remaining > 0 && sprints < maxSprints) {
    // Generate velocity for this sprint from lognormal distribution
    // Lognormal is always positive, but we still apply a minimum for safety
    const velocity = Math.max(0.1, randomLognormalFromMeanStdDev(velocityMean, velocityStdDev))
    remaining -= velocity
    sprints++
  }

  return sprints
}

/**
 * Run a Monte Carlo simulation
 * Returns the distribution of sprint counts across all trials
 */
export function runSimulation(input: SimulationInput): SimulationOutput {
  const {
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    trialCount,
    distributionType = 'normal',
  } = input

  const trialFn =
    distributionType === 'lognormal' ? runSingleTrialLognormal : runSingleTrialNormal

  // Run all trials
  const sprintsRequired: number[] = []
  for (let i = 0; i < trialCount; i++) {
    sprintsRequired.push(trialFn(remainingBacklog, velocityMean, velocityStdDev))
  }

  // Sort for percentile calculation
  sprintsRequired.sort((a, b) => a - b)

  return {
    sprintsRequired,
    percentiles: new Map(),
    distributionType,
  }
}

/**
 * Calculate the finish date for a given percentile
 */
export function calculatePercentileResult(
  sortedSprintsRequired: number[],
  percentile: number,
  startDate: string,
  sprintCadenceWeeks: number
): ForecastResult {
  const sprintsRequired = Math.ceil(
    percentileFromSorted(sortedSprintsRequired, percentile)
  )
  const finishDate = addWeeks(startDate, sprintsRequired * sprintCadenceWeeks)

  return {
    percentile,
    sprintsRequired,
    finishDate,
  }
}

/**
 * Extract percentile results from a simulation
 */
function extractPercentileResults(
  sortedSprintsRequired: number[],
  startDate: string,
  sprintCadenceWeeks: number
): PercentileResults {
  return {
    p50: calculatePercentileResult(sortedSprintsRequired, 50, startDate, sprintCadenceWeeks),
    p60: calculatePercentileResult(sortedSprintsRequired, 60, startDate, sprintCadenceWeeks),
    p70: calculatePercentileResult(sortedSprintsRequired, 70, startDate, sprintCadenceWeeks),
    p80: calculatePercentileResult(sortedSprintsRequired, 80, startDate, sprintCadenceWeeks),
    p90: calculatePercentileResult(sortedSprintsRequired, 90, startDate, sprintCadenceWeeks),
  }
}

/**
 * Run a full forecast simulation and return results for standard percentiles
 * (backward compatible - uses normal distribution only)
 */
export function runForecast(config: ForecastConfig & { sprintCadenceWeeks: number }): PercentileResults {
  const simulation = runSimulation({
    remainingBacklog: config.remainingBacklog,
    velocityMean: config.velocityMean,
    velocityStdDev: config.velocityStdDev,
    startDate: config.startDate,
    sprintCadenceWeeks: config.sprintCadenceWeeks,
    trialCount: config.trialCount,
    distributionType: 'normal',
  })

  return extractPercentileResults(simulation.sprintsRequired, config.startDate, config.sprintCadenceWeeks)
}

/**
 * Run dual forecasts using both normal and lognormal distributions
 * Returns results from both simulations for comparison
 */
export function runDualForecast(
  config: ForecastConfig & { sprintCadenceWeeks: number }
): {
  normal: { results: PercentileResults; sprintsRequired: number[] }
  lognormal: { results: PercentileResults; sprintsRequired: number[] }
} {
  const baseInput = {
    remainingBacklog: config.remainingBacklog,
    velocityMean: config.velocityMean,
    velocityStdDev: config.velocityStdDev,
    startDate: config.startDate,
    sprintCadenceWeeks: config.sprintCadenceWeeks,
    trialCount: config.trialCount,
  }

  // Run normal distribution simulation
  const normalSimulation = runSimulation({ ...baseInput, distributionType: 'normal' })
  const normalResults = extractPercentileResults(
    normalSimulation.sprintsRequired,
    config.startDate,
    config.sprintCadenceWeeks
  )

  // Run lognormal distribution simulation
  const lognormalSimulation = runSimulation({ ...baseInput, distributionType: 'lognormal' })
  const lognormalResults = extractPercentileResults(
    lognormalSimulation.sprintsRequired,
    config.startDate,
    config.sprintCadenceWeeks
  )

  return {
    normal: { results: normalResults, sprintsRequired: normalSimulation.sprintsRequired },
    lognormal: { results: lognormalResults, sprintsRequired: lognormalSimulation.sprintsRequired },
  }
}

/**
 * Calculate a custom percentile result from existing simulation data
 */
export function calculateCustomPercentile(
  sortedSprintsRequired: number[],
  percentile: number,
  startDate: string,
  sprintCadenceWeeks: number
): ForecastResult {
  return calculatePercentileResult(
    sortedSprintsRequired,
    percentile,
    startDate,
    sprintCadenceWeeks
  )
}
