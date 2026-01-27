import {
  randomTruncatedNormal,
  randomLognormalFromMeanStdDev,
  randomGammaFromMeanStdDev,
  percentileFromSorted,
} from '@/shared/lib/math'
import { addWeeks } from '@/shared/lib/dates'
import type { ForecastConfig, ForecastResult } from '@/shared/types'

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

export interface DualForecastResults {
  normal: PercentileResults
  lognormal: PercentileResults
}

export interface TripleForecastResults {
  truncatedNormal: PercentileResults
  lognormal: PercentileResults
  gamma: PercentileResults
}

export interface QuadrupleForecastResults {
  truncatedNormal: PercentileResults
  lognormal: PercentileResults
  gamma: PercentileResults
  bootstrap: PercentileResults
}

/**
 * Run a single Monte Carlo trial using truncated normal distribution
 * Returns the number of sprints required to complete the backlog
 *
 * Truncated normal is bounded at 0, properly handling the impossibility
 * of negative velocity without artificial clamping.
 */
export function runSingleTrialTruncatedNormal(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = 1000 // Safety limit

  while (remaining > 0 && sprints < maxSprints) {
    // Generate velocity from truncated normal (bounded at 0)
    // Apply minimum of 0.1 as safety fallback for edge cases
    const velocity = Math.max(0.1, randomTruncatedNormal(velocityMean, velocityStdDev, 0))
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
 * Run a single Monte Carlo trial using gamma distribution
 * Returns the number of sprints required to complete the backlog
 *
 * Gamma distribution is always positive and commonly used for
 * modeling throughput and waiting times.
 */
export function runSingleTrialGamma(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = 1000 // Safety limit

  while (remaining > 0 && sprints < maxSprints) {
    // Generate velocity for this sprint from gamma distribution
    // Gamma is always positive, but we still apply a minimum for safety
    const velocity = Math.max(0.1, randomGammaFromMeanStdDev(velocityMean, velocityStdDev))
    remaining -= velocity
    sprints++
  }

  return sprints
}

/**
 * Run a single Monte Carlo trial using bootstrap (sampling with replacement)
 * Returns the number of sprints required to complete the backlog
 *
 * Bootstrap (#NoEstimates) samples from actual historical sprint velocities
 * with replacement, making no assumptions about the underlying distribution.
 */
export function runSingleTrialBootstrap(
  remainingBacklog: number,
  historicalVelocities: number[]
): number {
  if (historicalVelocities.length === 0) {
    throw new Error('Bootstrap requires historical velocity data')
  }

  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = 1000 // Safety limit

  while (remaining > 0 && sprints < maxSprints) {
    // Sample with replacement from historical velocities
    const randomIndex = Math.floor(Math.random() * historicalVelocities.length)
    const velocity = Math.max(0.1, historicalVelocities[randomIndex])
    remaining -= velocity
    sprints++
  }

  return sprints
}

// ============================================================================
// Productivity-Adjusted Trial Functions
// ============================================================================

/**
 * Run a single trial with productivity adjustments applied.
 * The productivityFactors array is indexed by sprint number (0 = first forecast sprint).
 * Each sampled velocity is multiplied by the corresponding factor.
 */
export function runSingleTrialTruncatedNormalWithProductivity(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number,
  productivityFactors: number[]
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = Math.min(1000, productivityFactors.length)

  while (remaining > 0 && sprints < maxSprints) {
    const baseVelocity = Math.max(0.1, randomTruncatedNormal(velocityMean, velocityStdDev, 0))
    const factor = productivityFactors[sprints] ?? 1.0
    const adjustedVelocity = baseVelocity * factor
    remaining -= adjustedVelocity
    sprints++
  }

  return sprints
}

export function runSingleTrialLognormalWithProductivity(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number,
  productivityFactors: number[]
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = Math.min(1000, productivityFactors.length)

  while (remaining > 0 && sprints < maxSprints) {
    const baseVelocity = Math.max(0.1, randomLognormalFromMeanStdDev(velocityMean, velocityStdDev))
    const factor = productivityFactors[sprints] ?? 1.0
    const adjustedVelocity = baseVelocity * factor
    remaining -= adjustedVelocity
    sprints++
  }

  return sprints
}

export function runSingleTrialGammaWithProductivity(
  remainingBacklog: number,
  velocityMean: number,
  velocityStdDev: number,
  productivityFactors: number[]
): number {
  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = Math.min(1000, productivityFactors.length)

  while (remaining > 0 && sprints < maxSprints) {
    const baseVelocity = Math.max(0.1, randomGammaFromMeanStdDev(velocityMean, velocityStdDev))
    const factor = productivityFactors[sprints] ?? 1.0
    const adjustedVelocity = baseVelocity * factor
    remaining -= adjustedVelocity
    sprints++
  }

  return sprints
}

export function runSingleTrialBootstrapWithProductivity(
  remainingBacklog: number,
  historicalVelocities: number[],
  productivityFactors: number[]
): number {
  if (historicalVelocities.length === 0) {
    throw new Error('Bootstrap requires historical velocity data')
  }

  let remaining = remainingBacklog
  let sprints = 0
  const maxSprints = Math.min(1000, productivityFactors.length)

  while (remaining > 0 && sprints < maxSprints) {
    const randomIndex = Math.floor(Math.random() * historicalVelocities.length)
    const baseVelocity = Math.max(0.1, historicalVelocities[randomIndex])
    const factor = productivityFactors[sprints] ?? 1.0
    const adjustedVelocity = baseVelocity * factor
    remaining -= adjustedVelocity
    sprints++
  }

  return sprints
}

/**
 * Run simulation with productivity adjustments
 */
function runSimulationWithProductivity(
  input: SimulationInput,
  productivityFactors: number[]
): SimulationOutput {
  const {
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    trialCount,
    distributionType = 'truncatedNormal',
  } = input

  const sprintsRequired: number[] = []

  switch (distributionType) {
    case 'lognormal':
      for (let i = 0; i < trialCount; i++) {
        sprintsRequired.push(
          runSingleTrialLognormalWithProductivity(
            remainingBacklog,
            velocityMean,
            velocityStdDev,
            productivityFactors
          )
        )
      }
      break
    case 'gamma':
      for (let i = 0; i < trialCount; i++) {
        sprintsRequired.push(
          runSingleTrialGammaWithProductivity(
            remainingBacklog,
            velocityMean,
            velocityStdDev,
            productivityFactors
          )
        )
      }
      break
    case 'truncatedNormal':
    default:
      for (let i = 0; i < trialCount; i++) {
        sprintsRequired.push(
          runSingleTrialTruncatedNormalWithProductivity(
            remainingBacklog,
            velocityMean,
            velocityStdDev,
            productivityFactors
          )
        )
      }
      break
  }

  sprintsRequired.sort((a, b) => a - b)

  return {
    sprintsRequired,
    percentiles: new Map(),
    distributionType,
  }
}

/**
 * Run bootstrap simulation with productivity adjustments
 */
function runBootstrapSimulationWithProductivity(
  remainingBacklog: number,
  historicalVelocities: number[],
  trialCount: number,
  productivityFactors: number[]
): number[] {
  const sprintsRequired: number[] = []

  for (let i = 0; i < trialCount; i++) {
    sprintsRequired.push(
      runSingleTrialBootstrapWithProductivity(remainingBacklog, historicalVelocities, productivityFactors)
    )
  }

  sprintsRequired.sort((a, b) => a - b)

  return sprintsRequired
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
    distributionType = 'truncatedNormal',
  } = input

  let trialFn: (backlog: number, mean: number, stdDev: number) => number
  switch (distributionType) {
    case 'lognormal':
      trialFn = runSingleTrialLognormal
      break
    case 'gamma':
      trialFn = runSingleTrialGamma
      break
    case 'truncatedNormal':
    default:
      trialFn = runSingleTrialTruncatedNormal
      break
  }

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
 * Run dual forecasts using both normal and lognormal distributions
 * Returns results from both simulations for comparison
 * @deprecated Use runTripleForecast instead
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

  // Run truncated normal distribution simulation (renamed from 'normal')
  const normalSimulation = runSimulation({ ...baseInput, distributionType: 'truncatedNormal' })
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
 * Returns the distribution of sprint counts across all trials
 */
export function runBootstrapSimulation(
  remainingBacklog: number,
  historicalVelocities: number[],
  trialCount: number
): number[] {
  const sprintsRequired: number[] = []

  for (let i = 0; i < trialCount; i++) {
    sprintsRequired.push(runSingleTrialBootstrap(remainingBacklog, historicalVelocities))
  }

  // Sort for percentile calculation
  sprintsRequired.sort((a, b) => a - b)

  return sprintsRequired
}

/**
 * Run quadruple forecasts using truncated normal, lognormal, gamma, and bootstrap distributions
 * Bootstrap is only included if historical velocities are provided
 * Optionally applies productivity adjustments if factors are provided
 * Returns results from all simulations for comparison
 *
 * @param config - Forecast configuration
 * @param historicalVelocities - Optional array of historical velocities for bootstrap
 * @param productivityFactors - Optional array of productivity factors per sprint (0 = first forecast sprint)
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
  const baseInput = {
    remainingBacklog: config.remainingBacklog,
    velocityMean: config.velocityMean,
    velocityStdDev: config.velocityStdDev,
    startDate: config.startDate,
    sprintCadenceWeeks: config.sprintCadenceWeeks,
    trialCount: config.trialCount,
  }

  // Determine if we should use productivity-adjusted simulations
  const useProductivityAdjustment = productivityFactors && productivityFactors.length > 0

  // Run truncated normal distribution simulation
  const truncatedNormalSimulation = useProductivityAdjustment
    ? runSimulationWithProductivity({ ...baseInput, distributionType: 'truncatedNormal' }, productivityFactors)
    : runSimulation({ ...baseInput, distributionType: 'truncatedNormal' })
  const truncatedNormalResults = extractPercentileResults(
    truncatedNormalSimulation.sprintsRequired,
    config.startDate,
    config.sprintCadenceWeeks
  )

  // Run lognormal distribution simulation
  const lognormalSimulation = useProductivityAdjustment
    ? runSimulationWithProductivity({ ...baseInput, distributionType: 'lognormal' }, productivityFactors)
    : runSimulation({ ...baseInput, distributionType: 'lognormal' })
  const lognormalResults = extractPercentileResults(
    lognormalSimulation.sprintsRequired,
    config.startDate,
    config.sprintCadenceWeeks
  )

  // Run gamma distribution simulation
  const gammaSimulation = useProductivityAdjustment
    ? runSimulationWithProductivity({ ...baseInput, distributionType: 'gamma' }, productivityFactors)
    : runSimulation({ ...baseInput, distributionType: 'gamma' })
  const gammaResults = extractPercentileResults(
    gammaSimulation.sprintsRequired,
    config.startDate,
    config.sprintCadenceWeeks
  )

  // Run bootstrap simulation only if historical velocities are provided
  let bootstrapData: { results: PercentileResults; sprintsRequired: number[] } | null = null
  if (historicalVelocities && historicalVelocities.length > 0) {
    const bootstrapSprintsRequired = useProductivityAdjustment
      ? runBootstrapSimulationWithProductivity(
          config.remainingBacklog,
          historicalVelocities,
          config.trialCount,
          productivityFactors
        )
      : runBootstrapSimulation(config.remainingBacklog, historicalVelocities, config.trialCount)
    const bootstrapResults = extractPercentileResults(
      bootstrapSprintsRequired,
      config.startDate,
      config.sprintCadenceWeeks
    )
    bootstrapData = { results: bootstrapResults, sprintsRequired: bootstrapSprintsRequired }
  }

  return {
    truncatedNormal: { results: truncatedNormalResults, sprintsRequired: truncatedNormalSimulation.sprintsRequired },
    lognormal: { results: lognormalResults, sprintsRequired: lognormalSimulation.sprintsRequired },
    gamma: { results: gammaResults, sprintsRequired: gammaSimulation.sprintsRequired },
    bootstrap: bootstrapData,
  }
}
