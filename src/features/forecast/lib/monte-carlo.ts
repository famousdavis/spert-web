import {
  randomTruncatedNormal,
  randomLognormalFromMeanStdDev,
  randomGammaFromMeanStdDev,
  percentileFromSorted,
} from '@/shared/lib/math'
import { calculateSprintStartDate, calculateSprintFinishDate } from '@/shared/lib/dates'
import type { ForecastConfig, ForecastResult } from '@/shared/types'
import { MAX_TRIAL_SPRINTS } from '../constants'

export type DistributionType = 'truncatedNormal' | 'lognormal' | 'gamma' | 'bootstrap'

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

/**
 * Velocity sampler function type.
 * Each distribution provides a sampler that returns a raw velocity sample.
 */
type VelocitySampler = () => number

/**
 * Core trial runner: simulates sprints until backlog is exhausted.
 * All distribution-specific trial functions delegate to this.
 *
 * @param remainingBacklog - Work remaining
 * @param sampler - Function that returns a velocity sample from the chosen distribution
 * @param productivityFactors - Optional per-sprint multipliers (index 0 = first sprint)
 */
function runTrial(
  remainingBacklog: number,
  sampler: VelocitySampler,
  productivityFactors?: number[]
): number {
  let remaining = remainingBacklog
  let sprints = 0

  while (remaining > 0 && sprints < MAX_TRIAL_SPRINTS) {
    const baseVelocity = Math.max(0.1, sampler())
    const factor = productivityFactors?.[sprints] ?? 1.0
    remaining -= baseVelocity * factor
    sprints++
  }

  return sprints
}

// ============================================================================
// Distribution-specific trial functions (thin wrappers around runTrial)
// ============================================================================

export function runSingleTrialTruncatedNormal(backlog: number, mean: number, stdDev: number): number {
  return runTrial(backlog, () => randomTruncatedNormal(mean, stdDev, 0))
}

export function runSingleTrialLognormal(backlog: number, mean: number, stdDev: number): number {
  return runTrial(backlog, () => randomLognormalFromMeanStdDev(mean, stdDev))
}

export function runSingleTrialGamma(backlog: number, mean: number, stdDev: number): number {
  return runTrial(backlog, () => randomGammaFromMeanStdDev(mean, stdDev))
}

export function runSingleTrialBootstrap(backlog: number, velocities: number[]): number {
  if (velocities.length === 0) throw new Error('Bootstrap requires historical velocity data')
  return runTrial(backlog, () => velocities[Math.floor(Math.random() * velocities.length)])
}

export function runSingleTrialTruncatedNormalWithProductivity(
  backlog: number, mean: number, stdDev: number, factors: number[]
): number {
  return runTrial(backlog, () => randomTruncatedNormal(mean, stdDev, 0), factors)
}

export function runSingleTrialLognormalWithProductivity(
  backlog: number, mean: number, stdDev: number, factors: number[]
): number {
  return runTrial(backlog, () => randomLognormalFromMeanStdDev(mean, stdDev), factors)
}

export function runSingleTrialGammaWithProductivity(
  backlog: number, mean: number, stdDev: number, factors: number[]
): number {
  return runTrial(backlog, () => randomGammaFromMeanStdDev(mean, stdDev), factors)
}

export function runSingleTrialBootstrapWithProductivity(
  backlog: number, velocities: number[], factors: number[]
): number {
  if (velocities.length === 0) throw new Error('Bootstrap requires historical velocity data')
  return runTrial(backlog, () => velocities[Math.floor(Math.random() * velocities.length)], factors)
}

/**
 * Select the trial function for a given distribution type
 */
function getTrialFn(distributionType: DistributionType): (backlog: number, mean: number, stdDev: number) => number {
  switch (distributionType) {
    case 'lognormal': return runSingleTrialLognormal
    case 'gamma': return runSingleTrialGamma
    case 'truncatedNormal': default: return runSingleTrialTruncatedNormal
  }
}

/**
 * Select the productivity-adjusted trial function for a given distribution type
 */
function getTrialWithProductivityFn(
  distributionType: DistributionType
): (backlog: number, mean: number, stdDev: number, factors: number[]) => number {
  switch (distributionType) {
    case 'lognormal': return runSingleTrialLognormalWithProductivity
    case 'gamma': return runSingleTrialGammaWithProductivity
    case 'truncatedNormal': default: return runSingleTrialTruncatedNormalWithProductivity
  }
}

/**
 * Run a Monte Carlo simulation, optionally with productivity adjustments
 * Returns the distribution of sprint counts across all trials
 */
export function runSimulation(input: SimulationInput, productivityFactors?: number[]): SimulationOutput {
  const {
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    trialCount,
    distributionType = 'truncatedNormal',
  } = input

  const sprintsRequired: number[] = []
  const useProductivity = productivityFactors && productivityFactors.length > 0

  if (useProductivity) {
    const trialFn = getTrialWithProductivityFn(distributionType)
    for (let i = 0; i < trialCount; i++) {
      sprintsRequired.push(trialFn(remainingBacklog, velocityMean, velocityStdDev, productivityFactors))
    }
  } else {
    const trialFn = getTrialFn(distributionType)
    for (let i = 0; i < trialCount; i++) {
      sprintsRequired.push(trialFn(remainingBacklog, velocityMean, velocityStdDev))
    }
  }

  sprintsRequired.sort((a, b) => a - b)

  return {
    sprintsRequired,
    percentiles: new Map(),
    distributionType,
  }
}

/**
 * Run bootstrap simulation, optionally with productivity adjustments
 */
function runBootstrapSimulationInternal(
  remainingBacklog: number,
  historicalVelocities: number[],
  trialCount: number,
  productivityFactors?: number[]
): number[] {
  const sprintsRequired: number[] = []
  const useProductivity = productivityFactors && productivityFactors.length > 0

  for (let i = 0; i < trialCount; i++) {
    sprintsRequired.push(
      useProductivity
        ? runSingleTrialBootstrapWithProductivity(remainingBacklog, historicalVelocities, productivityFactors)
        : runSingleTrialBootstrap(remainingBacklog, historicalVelocities)
    )
  }

  sprintsRequired.sort((a, b) => a - b)
  return sprintsRequired
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
  // Calculate the finish date as the last business day of the final sprint
  // startDate is when sprint 1 starts, so sprint N starts at startDate + (N-1) * cadence
  const finalSprintStart = calculateSprintStartDate(startDate, sprintsRequired, sprintCadenceWeeks)
  const finishDate = calculateSprintFinishDate(finalSprintStart, sprintCadenceWeeks)

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
 * (backward compatible - uses truncated normal distribution)
 */
export function runForecast(config: ForecastConfig & { sprintCadenceWeeks: number }): PercentileResults {
  const simulation = runSimulation({
    remainingBacklog: config.remainingBacklog,
    velocityMean: config.velocityMean,
    velocityStdDev: config.velocityStdDev,
    startDate: config.startDate,
    sprintCadenceWeeks: config.sprintCadenceWeeks,
    trialCount: config.trialCount,
    distributionType: 'truncatedNormal',
  })

  return extractPercentileResults(simulation.sprintsRequired, config.startDate, config.sprintCadenceWeeks)
}

/**
 * Run triple forecasts using truncated normal, lognormal, and gamma distributions
 * Returns results from all three simulations for comparison
 */
export function runTripleForecast(
  config: ForecastConfig & { sprintCadenceWeeks: number }
): {
  truncatedNormal: { results: PercentileResults; sprintsRequired: number[] }
  lognormal: { results: PercentileResults; sprintsRequired: number[] }
  gamma: { results: PercentileResults; sprintsRequired: number[] }
} {
  const baseInput = {
    remainingBacklog: config.remainingBacklog,
    velocityMean: config.velocityMean,
    velocityStdDev: config.velocityStdDev,
    startDate: config.startDate,
    sprintCadenceWeeks: config.sprintCadenceWeeks,
    trialCount: config.trialCount,
  }

  // Run truncated normal distribution simulation
  const truncatedNormalSimulation = runSimulation({ ...baseInput, distributionType: 'truncatedNormal' })
  const truncatedNormalResults = extractPercentileResults(
    truncatedNormalSimulation.sprintsRequired,
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

  // Run gamma distribution simulation
  const gammaSimulation = runSimulation({ ...baseInput, distributionType: 'gamma' })
  const gammaResults = extractPercentileResults(
    gammaSimulation.sprintsRequired,
    config.startDate,
    config.sprintCadenceWeeks
  )

  return {
    truncatedNormal: { results: truncatedNormalResults, sprintsRequired: truncatedNormalSimulation.sprintsRequired },
    lognormal: { results: lognormalResults, sprintsRequired: lognormalSimulation.sprintsRequired },
    gamma: { results: gammaResults, sprintsRequired: gammaSimulation.sprintsRequired },
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

/**
 * Quadruple simulation data structure (raw sprint counts from each distribution)
 */
export interface QuadSimulationData {
  truncatedNormal: number[]
  lognormal: number[]
  gamma: number[]
  bootstrap: number[] | null
}

/**
 * Quadruple custom percentile results
 */
export interface QuadCustomResults {
  truncatedNormal: ForecastResult | null
  lognormal: ForecastResult | null
  gamma: ForecastResult | null
  bootstrap: ForecastResult | null
}

/**
 * Calculate custom percentile for all distributions in a quadruple forecast
 */
export function calculateAllCustomPercentiles(
  data: QuadSimulationData,
  percentile: number,
  startDate: string,
  sprintCadenceWeeks: number
): QuadCustomResults {
  return {
    truncatedNormal: calculateCustomPercentile(data.truncatedNormal, percentile, startDate, sprintCadenceWeeks),
    lognormal: calculateCustomPercentile(data.lognormal, percentile, startDate, sprintCadenceWeeks),
    gamma: calculateCustomPercentile(data.gamma, percentile, startDate, sprintCadenceWeeks),
    bootstrap: data.bootstrap
      ? calculateCustomPercentile(data.bootstrap, percentile, startDate, sprintCadenceWeeks)
      : null,
  }
}

/**
 * Run bootstrap simulation using historical sprint velocities
 * Returns the sorted distribution of sprint counts across all trials
 */
export function runBootstrapSimulation(
  remainingBacklog: number,
  historicalVelocities: number[],
  trialCount: number
): number[] {
  return runBootstrapSimulationInternal(remainingBacklog, historicalVelocities, trialCount)
}

/**
 * Helper to run a simulation for one distribution type and extract percentile results
 */
function runDistributionSimulation(
  baseInput: SimulationInput,
  distributionType: DistributionType,
  productivityFactors?: number[]
): { results: PercentileResults; sprintsRequired: number[] } {
  const sim = runSimulation({ ...baseInput, distributionType }, productivityFactors)
  const results = extractPercentileResults(sim.sprintsRequired, baseInput.startDate, baseInput.sprintCadenceWeeks)
  return { results, sprintsRequired: sim.sprintsRequired }
}

/**
 * Run quadruple forecasts using truncated normal, lognormal, gamma, and bootstrap distributions
 * Bootstrap is only included if historical velocities are provided
 * Optionally applies productivity adjustments if factors are provided
 */
export function runQuadrupleForecast(
  config: ForecastConfig & { sprintCadenceWeeks: number },
  historicalVelocities?: number[],
  productivityFactors?: number[]
): {
  truncatedNormal: { results: PercentileResults; sprintsRequired: number[] }
  lognormal: { results: PercentileResults; sprintsRequired: number[] }
  gamma: { results: PercentileResults; sprintsRequired: number[] }
  bootstrap: { results: PercentileResults; sprintsRequired: number[] } | null
} {
  const baseInput: SimulationInput = {
    remainingBacklog: config.remainingBacklog,
    velocityMean: config.velocityMean,
    velocityStdDev: config.velocityStdDev,
    startDate: config.startDate,
    sprintCadenceWeeks: config.sprintCadenceWeeks,
    trialCount: config.trialCount,
  }

  const truncatedNormal = runDistributionSimulation(baseInput, 'truncatedNormal', productivityFactors)
  const lognormal = runDistributionSimulation(baseInput, 'lognormal', productivityFactors)
  const gamma = runDistributionSimulation(baseInput, 'gamma', productivityFactors)

  let bootstrap: { results: PercentileResults; sprintsRequired: number[] } | null = null
  if (historicalVelocities && historicalVelocities.length > 0) {
    const sprintsRequired = runBootstrapSimulationInternal(
      config.remainingBacklog, historicalVelocities, config.trialCount, productivityFactors
    )
    bootstrap = {
      results: extractPercentileResults(sprintsRequired, config.startDate, config.sprintCadenceWeeks),
      sprintsRequired,
    }
  }

  return { truncatedNormal, lognormal, gamma, bootstrap }
}
