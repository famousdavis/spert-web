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
  sprintsRequired: number[] // Sorted array of sprint counts from each trial
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
export type VelocitySampler = () => number

// ============================================================================
// Sampler factories
// ============================================================================

/**
 * Create a velocity sampler for a parametric distribution type.
 */
export function createSampler(distributionType: DistributionType, mean: number, stdDev: number): VelocitySampler {
  switch (distributionType) {
    case 'lognormal':
      return () => randomLognormalFromMeanStdDev(mean, stdDev)
    case 'gamma':
      return () => randomGammaFromMeanStdDev(mean, stdDev)
    case 'truncatedNormal':
    default:
      return () => randomTruncatedNormal(mean, stdDev, 0)
  }
}

/**
 * Create a velocity sampler that randomly selects from historical velocities.
 */
export function createBootstrapSampler(velocities: number[]): VelocitySampler {
  if (velocities.length === 0) throw new Error('Bootstrap requires historical velocity data')
  return () => velocities[Math.floor(Math.random() * velocities.length)]
}

// ============================================================================
// Core trial runners
// ============================================================================

/**
 * Core trial runner: simulates sprints until backlog is exhausted.
 *
 * @param remainingBacklog - Work remaining
 * @param sampler - Function that returns a velocity sample from the chosen distribution
 * @param productivityFactors - Optional per-sprint multipliers (index 0 = first sprint)
 * @param scopeGrowthPerSprint - Optional scope growth per sprint (positive = growing, negative = shrinking)
 */
export function runTrial(
  remainingBacklog: number,
  sampler: VelocitySampler,
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): number {
  let remaining = remainingBacklog
  let sprints = 0

  while (remaining > 0 && sprints < MAX_TRIAL_SPRINTS) {
    if (scopeGrowthPerSprint) remaining += scopeGrowthPerSprint
    const baseVelocity = Math.max(0.1, sampler())
    const factor = productivityFactors?.[sprints] ?? 1.0
    remaining -= baseVelocity * factor
    sprints++
  }

  return sprints
}

/**
 * Core trial runner with milestone checkpoints: records the sprint number
 * at which each cumulative backlog threshold is reached.
 *
 * @param remainingBacklog - Total work remaining (sum of all milestones)
 * @param cumulativeThresholds - Ascending cumulative backlog values for each milestone
 * @param sampler - Function that returns a velocity sample from the chosen distribution
 * @param productivityFactors - Optional per-sprint multipliers (index 0 = first sprint)
 * @param scopeGrowthPerSprint - Optional scope growth per sprint (positive = growing, negative = shrinking)
 * @returns Array of sprint counts, one per milestone
 */
function runTrialWithMilestones(
  remainingBacklog: number,
  cumulativeThresholds: number[],
  sampler: VelocitySampler,
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): number[] {
  let remaining = remainingBacklog
  let completed = 0
  let sprints = 0
  let nextIdx = 0
  const results = new Array<number>(cumulativeThresholds.length).fill(MAX_TRIAL_SPRINTS)

  while (remaining > 0 && sprints < MAX_TRIAL_SPRINTS) {
    if (scopeGrowthPerSprint) remaining += scopeGrowthPerSprint
    const baseVelocity = Math.max(0.1, sampler())
    const factor = productivityFactors?.[sprints] ?? 1.0
    const work = baseVelocity * factor
    remaining -= work
    completed += work
    sprints++

    // Check milestones (ascending order, pointer advances monotonically)
    while (nextIdx < cumulativeThresholds.length &&
           completed >= cumulativeThresholds[nextIdx]) {
      results[nextIdx] = sprints
      nextIdx++
    }
  }

  // Mark any remaining milestones as reached at the final sprint
  while (nextIdx < cumulativeThresholds.length) {
    results[nextIdx] = sprints
    nextIdx++
  }

  return results
}

// ============================================================================
// Simulation functions
// ============================================================================

/**
 * Run N trials with a given sampler and return sorted sprint counts.
 * Common kernel used by all simulation entry points.
 */
function runTrials(
  remainingBacklog: number,
  sampler: VelocitySampler,
  trialCount: number,
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): number[] {
  const factors = productivityFactors && productivityFactors.length > 0 ? productivityFactors : undefined
  const sprintsRequired: number[] = []
  for (let i = 0; i < trialCount; i++) {
    sprintsRequired.push(runTrial(remainingBacklog, sampler, factors, scopeGrowthPerSprint))
  }
  sprintsRequired.sort((a, b) => a - b)
  return sprintsRequired
}

/**
 * Run a Monte Carlo simulation, optionally with productivity adjustments and scope growth.
 * Returns the distribution of sprint counts across all trials.
 */
export function runSimulation(
  input: SimulationInput,
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): SimulationOutput {
  const {
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    trialCount,
    distributionType = 'truncatedNormal',
  } = input

  const sampler = createSampler(distributionType, velocityMean, velocityStdDev)

  return {
    sprintsRequired: runTrials(remainingBacklog, sampler, trialCount, productivityFactors, scopeGrowthPerSprint),
    distributionType,
  }
}

// ============================================================================
// Percentile calculation
// ============================================================================

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

// ============================================================================
// Quadruple distribution types and helpers
// ============================================================================

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
    truncatedNormal: calculatePercentileResult(data.truncatedNormal, percentile, startDate, sprintCadenceWeeks),
    lognormal: calculatePercentileResult(data.lognormal, percentile, startDate, sprintCadenceWeeks),
    gamma: calculatePercentileResult(data.gamma, percentile, startDate, sprintCadenceWeeks),
    bootstrap: data.bootstrap
      ? calculatePercentileResult(data.bootstrap, percentile, startDate, sprintCadenceWeeks)
      : null,
  }
}

/**
 * Helper to run a simulation for one distribution type and extract percentile results
 */
function runDistributionSimulation(
  baseInput: SimulationInput,
  distributionType: DistributionType,
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): { results: PercentileResults; sprintsRequired: number[] } {
  const sim = runSimulation({ ...baseInput, distributionType }, productivityFactors, scopeGrowthPerSprint)
  const results = extractPercentileResults(sim.sprintsRequired, baseInput.startDate, baseInput.sprintCadenceWeeks)
  return { results, sprintsRequired: sim.sprintsRequired }
}

/**
 * Run quadruple forecasts using truncated normal, lognormal, gamma, and bootstrap distributions.
 * Bootstrap is only included if historical velocities are provided.
 * Optionally applies productivity adjustments and scope growth if provided.
 */
export function runQuadrupleForecast(
  config: ForecastConfig & { sprintCadenceWeeks: number },
  historicalVelocities?: number[],
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
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

  const truncatedNormal = runDistributionSimulation(baseInput, 'truncatedNormal', productivityFactors, scopeGrowthPerSprint)
  const lognormal = runDistributionSimulation(baseInput, 'lognormal', productivityFactors, scopeGrowthPerSprint)
  const gamma = runDistributionSimulation(baseInput, 'gamma', productivityFactors, scopeGrowthPerSprint)

  let bootstrap: { results: PercentileResults; sprintsRequired: number[] } | null = null
  if (historicalVelocities && historicalVelocities.length > 0) {
    const factors = productivityFactors && productivityFactors.length > 0 ? productivityFactors : undefined
    const sprintsRequired = runTrials(
      config.remainingBacklog, createBootstrapSampler(historicalVelocities),
      config.trialCount, factors, scopeGrowthPerSprint
    )
    bootstrap = {
      results: extractPercentileResults(sprintsRequired, config.startDate, config.sprintCadenceWeeks),
      sprintsRequired,
    }
  }

  return { truncatedNormal, lognormal, gamma, bootstrap }
}

// ============================================================================
// Milestone-aware simulation functions
// ============================================================================

/**
 * Per-milestone simulation results for a single distribution
 */
export interface MilestoneDistributionResult {
  /** Per-milestone results: milestoneResults[milestoneIdx] = { results, sprintsRequired } */
  milestoneResults: Array<{ results: PercentileResults; sprintsRequired: number[] }>
}

/**
 * Full quadruple forecast result with milestone data
 */
export interface QuadMilestoneForecastResult {
  truncatedNormal: MilestoneDistributionResult
  lognormal: MilestoneDistributionResult
  gamma: MilestoneDistributionResult
  bootstrap: MilestoneDistributionResult | null
}

/**
 * Milestone-aware simulation data (raw sprint counts per milestone per distribution)
 */
export interface QuadMilestoneSimulationData {
  /** milestoneData[milestoneIdx] = { truncatedNormal, lognormal, gamma, bootstrap } sorted arrays */
  milestoneData: QuadSimulationData[]
}

/**
 * Run milestone-aware simulation for any distribution.
 * Each trial records the sprint at which each cumulative milestone threshold is reached.
 */
function runMilestoneSimulationInternal(
  remainingBacklog: number,
  cumulativeThresholds: number[],
  sampler: VelocitySampler,
  trialCount: number,
  startDate: string,
  sprintCadenceWeeks: number,
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): MilestoneDistributionResult {
  const milestoneCount = cumulativeThresholds.length

  // Collect per-milestone sprint counts across all trials
  const milestoneSprintArrays: number[][] = Array.from(
    { length: milestoneCount },
    () => new Array<number>(trialCount)
  )

  for (let i = 0; i < trialCount; i++) {
    const trialResults = runTrialWithMilestones(
      remainingBacklog, cumulativeThresholds, sampler, productivityFactors, scopeGrowthPerSprint
    )
    for (let m = 0; m < milestoneCount; m++) {
      milestoneSprintArrays[m][i] = trialResults[m]
    }
  }

  // Sort each milestone's array and extract percentile results
  const milestoneResults = milestoneSprintArrays.map((sprintArray) => {
    sprintArray.sort((a, b) => a - b)
    const results = extractPercentileResults(sprintArray, startDate, sprintCadenceWeeks)
    return { results, sprintsRequired: sprintArray }
  })

  return { milestoneResults }
}

/**
 * Run quadruple forecasts with milestone checkpoints.
 * Returns per-milestone percentile results and sorted sprint arrays for each distribution.
 *
 * @param config - Forecast configuration (remainingBacklog = total of all milestones)
 * @param cumulativeThresholds - Ascending cumulative backlog values for each milestone
 * @param historicalVelocities - Optional historical data for bootstrap distribution
 * @param productivityFactors - Optional per-sprint productivity multipliers
 * @param scopeGrowthPerSprint - Optional scope growth per sprint
 */
export function runQuadrupleForecastWithMilestones(
  config: ForecastConfig & { sprintCadenceWeeks: number },
  cumulativeThresholds: number[],
  historicalVelocities?: number[],
  productivityFactors?: number[],
  scopeGrowthPerSprint?: number
): QuadMilestoneForecastResult {
  const { remainingBacklog, velocityMean, velocityStdDev, startDate, sprintCadenceWeeks, trialCount } = config
  const factors = productivityFactors && productivityFactors.length > 0 ? productivityFactors : undefined

  const truncatedNormal = runMilestoneSimulationInternal(
    remainingBacklog, cumulativeThresholds,
    createSampler('truncatedNormal', velocityMean, velocityStdDev),
    trialCount, startDate, sprintCadenceWeeks, factors, scopeGrowthPerSprint
  )
  const lognormal = runMilestoneSimulationInternal(
    remainingBacklog, cumulativeThresholds,
    createSampler('lognormal', velocityMean, velocityStdDev),
    trialCount, startDate, sprintCadenceWeeks, factors, scopeGrowthPerSprint
  )
  const gamma = runMilestoneSimulationInternal(
    remainingBacklog, cumulativeThresholds,
    createSampler('gamma', velocityMean, velocityStdDev),
    trialCount, startDate, sprintCadenceWeeks, factors, scopeGrowthPerSprint
  )

  let bootstrap: MilestoneDistributionResult | null = null
  if (historicalVelocities && historicalVelocities.length > 0) {
    bootstrap = runMilestoneSimulationInternal(
      remainingBacklog, cumulativeThresholds,
      createBootstrapSampler(historicalVelocities),
      trialCount, startDate, sprintCadenceWeeks, factors, scopeGrowthPerSprint
    )
  }

  return { truncatedNormal, lognormal, gamma, bootstrap }
}
