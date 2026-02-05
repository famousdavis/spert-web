import { describe, it, expect } from 'vitest'
import {
  runTrial,
  createSampler,
  createBootstrapSampler,
  runSimulation,
  calculatePercentileResult,
  runForecast,
  runQuadrupleForecast,
  runQuadrupleForecastWithMilestones,
} from './monte-carlo'

// Shared base config for milestone tests
const milestoneBaseConfig = {
  remainingBacklog: 500,
  velocityMean: 20,
  velocityStdDev: 0, // deterministic for predictable assertions
  startDate: '2024-01-01',
  sprintCadenceWeeks: 2,
  trialCount: 100,
}

describe('runTrial with truncated normal sampler', () => {
  it('returns a positive number of sprints', () => {
    const sampler = createSampler('truncatedNormal', 20, 5)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThan(0)
  })

  it('handles zero standard deviation (deterministic)', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    // 100 backlog / 20 velocity = 5 sprints
    const sprints = runTrial(100, sampler)
    expect(sprints).toBe(5)
  })

  it('handles small remaining backlog', () => {
    const sampler = createSampler('truncatedNormal', 20, 5)
    const sprints = runTrial(10, sampler)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })

  it('never produces negative velocity (truncation works)', () => {
    // Run many trials with high stdDev relative to mean
    const sampler = createSampler('truncatedNormal', 10, 8)
    for (let i = 0; i < 100; i++) {
      const sprints = runTrial(100, sampler)
      expect(sprints).toBeGreaterThan(0)
      expect(sprints).toBeLessThan(1000)
    }
  })
})

describe('runTrial with lognormal sampler', () => {
  it('returns a positive number of sprints', () => {
    const sampler = createSampler('lognormal', 20, 5)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThan(0)
  })

  it('handles small standard deviation', () => {
    const sampler = createSampler('lognormal', 20, 0.1)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThanOrEqual(4)
    expect(sprints).toBeLessThanOrEqual(6)
  })

  it('handles small remaining backlog', () => {
    const sampler = createSampler('lognormal', 20, 5)
    const sprints = runTrial(10, sampler)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })
})

describe('runTrial with gamma sampler', () => {
  it('returns a positive number of sprints', () => {
    const sampler = createSampler('gamma', 20, 5)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThan(0)
  })

  it('handles small standard deviation', () => {
    const sampler = createSampler('gamma', 20, 0.1)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThanOrEqual(4)
    expect(sprints).toBeLessThanOrEqual(6)
  })

  it('handles small remaining backlog', () => {
    const sampler = createSampler('gamma', 20, 5)
    const sprints = runTrial(10, sampler)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })

  it('always produces positive velocity', () => {
    const sampler = createSampler('gamma', 10, 8)
    for (let i = 0; i < 100; i++) {
      const sprints = runTrial(100, sampler)
      expect(sprints).toBeGreaterThan(0)
      expect(sprints).toBeLessThan(1000)
    }
  })
})

describe('runTrial with bootstrap sampler', () => {
  it('returns a positive number of sprints', () => {
    const sampler = createBootstrapSampler([15, 20, 25, 18, 22])
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThan(0)
  })

  it('throws error with empty historical data', () => {
    expect(() => createBootstrapSampler([])).toThrow('Bootstrap requires historical velocity data')
  })

  it('handles small remaining backlog', () => {
    const sampler = createBootstrapSampler([15, 20, 25, 18, 22])
    const sprints = runTrial(10, sampler)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })

  it('uses only values from historical data', () => {
    // With only one value, every sprint should use that value
    const sampler = createBootstrapSampler([20])
    // 100 / 20 = 5 sprints exactly
    for (let i = 0; i < 10; i++) {
      const sprints = runTrial(100, sampler)
      expect(sprints).toBe(5)
    }
  })

  it('produces reasonable results with varied history', () => {
    const sampler = createBootstrapSampler([10, 15, 20, 25, 30]) // mean ~20
    for (let i = 0; i < 100; i++) {
      const sprints = runTrial(100, sampler)
      expect(sprints).toBeGreaterThan(0)
      expect(sprints).toBeLessThan(20)
    }
  })
})

describe('runSimulation', () => {
  it('returns the correct number of trials with truncated normal distribution', () => {
    const result = runSimulation({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 100,
      distributionType: 'truncatedNormal',
    })
    expect(result.sprintsRequired).toHaveLength(100)
    expect(result.distributionType).toBe('truncatedNormal')
  })

  it('returns the correct number of trials with lognormal distribution', () => {
    const result = runSimulation({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 100,
      distributionType: 'lognormal',
    })
    expect(result.sprintsRequired).toHaveLength(100)
    expect(result.distributionType).toBe('lognormal')
  })

  it('returns the correct number of trials with gamma distribution', () => {
    const result = runSimulation({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 100,
      distributionType: 'gamma',
    })
    expect(result.sprintsRequired).toHaveLength(100)
    expect(result.distributionType).toBe('gamma')
  })

  it('returns sorted sprint counts', () => {
    const result = runSimulation({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 1000,
    })

    for (let i = 1; i < result.sprintsRequired.length; i++) {
      expect(result.sprintsRequired[i]).toBeGreaterThanOrEqual(
        result.sprintsRequired[i - 1]
      )
    }
  })
})

describe('calculatePercentileResult', () => {
  it('calculates correct finish date', () => {
    const sortedSprints = [3, 4, 5, 6, 7] // 5 trials
    const result = calculatePercentileResult(
      sortedSprints,
      50, // median
      '2024-01-01',
      2 // 2-week sprints
    )

    // Median of [3,4,5,6,7] is 5
    // Sprint 5 finishes on the Friday before sprint 6 starts
    // Sprint 6 would start on 2024-03-11 (Monday), so finish is 2024-03-08 (Friday)
    expect(result.sprintsRequired).toBe(5)
    expect(result.percentile).toBe(50)
    expect(result.finishDate).toBe('2024-03-08') // Friday finish of sprint 5
  })

  it('handles P90 correctly', () => {
    const sortedSprints = Array.from({ length: 100 }, (_, i) => i + 1)
    const result = calculatePercentileResult(sortedSprints, 90, '2024-01-01', 2)

    // P90 of 1-100 should be around 90-91
    expect(result.sprintsRequired).toBeGreaterThanOrEqual(90)
    expect(result.sprintsRequired).toBeLessThanOrEqual(92)
  })
})

describe('runForecast', () => {
  it('returns all standard percentiles', () => {
    const result = runForecast({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      trialCount: 1000,
      sprintCadenceWeeks: 2,
    })

    expect(result.p50).toBeDefined()
    expect(result.p60).toBeDefined()
    expect(result.p70).toBeDefined()
    expect(result.p80).toBeDefined()
    expect(result.p90).toBeDefined()
  })

  it('higher percentiles have later finish dates', () => {
    const result = runForecast({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      trialCount: 10000,
      sprintCadenceWeeks: 2,
    })

    expect(result.p50.sprintsRequired).toBeLessThanOrEqual(result.p60.sprintsRequired)
    expect(result.p60.sprintsRequired).toBeLessThanOrEqual(result.p70.sprintsRequired)
    expect(result.p70.sprintsRequired).toBeLessThanOrEqual(result.p80.sprintsRequired)
    expect(result.p80.sprintsRequired).toBeLessThanOrEqual(result.p90.sprintsRequired)
  })
})

describe('runQuadrupleForecast', () => {
  it('returns results for all four distributions when historical data provided', () => {
    const historicalVelocities = [15, 20, 25, 18, 22]
    const result = runQuadrupleForecast(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 5,
        startDate: '2024-01-01',
        trialCount: 1000,
        sprintCadenceWeeks: 2,
      },
      historicalVelocities
    )

    expect(result.truncatedNormal).toBeDefined()
    expect(result.lognormal).toBeDefined()
    expect(result.gamma).toBeDefined()
    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.results.p50).toBeDefined()
    expect(result.bootstrap!.sprintsRequired).toHaveLength(1000)
  })

  it('returns null for bootstrap when no historical data provided', () => {
    const result = runQuadrupleForecast({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      trialCount: 1000,
      sprintCadenceWeeks: 2,
    })

    expect(result.truncatedNormal).toBeDefined()
    expect(result.lognormal).toBeDefined()
    expect(result.gamma).toBeDefined()
    expect(result.bootstrap).toBeNull()
  })

  it('bootstrap produces reasonable results matching historical data', () => {
    // Historical velocities averaging ~20
    const historicalVelocities = [18, 19, 20, 21, 22]
    const result = runQuadrupleForecast(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 2,
        startDate: '2024-01-01',
        trialCount: 10000,
        sprintCadenceWeeks: 2,
      },
      historicalVelocities
    )

    // Bootstrap should also have P50 around 5 sprints (100/20)
    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.results.p50.sprintsRequired).toBeGreaterThanOrEqual(4)
    expect(result.bootstrap!.results.p50.sprintsRequired).toBeLessThanOrEqual(7)

    // Higher percentiles should require at least as many sprints
    expect(result.bootstrap!.results.p90.sprintsRequired).toBeGreaterThanOrEqual(
      result.bootstrap!.results.p50.sprintsRequired
    )
  })

  it('applies productivity factors when provided', () => {
    // Factors of 0.5 should roughly double the sprints needed
    const factors = new Array(1000).fill(0.5)
    const result = runQuadrupleForecast(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 0, // deterministic for predictability
        startDate: '2024-01-01',
        trialCount: 100,
        sprintCadenceWeeks: 2,
      },
      undefined,
      factors
    )

    // With factor 0.5, effective velocity = 10, so 100/10 = 10 sprints
    expect(result.truncatedNormal.results.p50.sprintsRequired).toBe(10)
  })

  it('all distributions produce reasonable P50 results', () => {
    const result = runQuadrupleForecast({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      trialCount: 10000,
      sprintCadenceWeeks: 2,
    })

    // All should have P50 around 5 sprints (100/20)
    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      expect(dist.results.p50.sprintsRequired).toBeGreaterThanOrEqual(4)
      expect(dist.results.p50.sprintsRequired).toBeLessThanOrEqual(7)
      // Higher percentiles require at least as many sprints
      expect(dist.results.p90.sprintsRequired).toBeGreaterThanOrEqual(dist.results.p50.sprintsRequired)
    }
  })

  it('returns null for bootstrap when historical velocities is empty', () => {
    const result = runQuadrupleForecast(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 5,
        startDate: '2024-01-01',
        sprintCadenceWeeks: 2,
        trialCount: 100,
      },
      [] // empty historical velocities
    )
    expect(result.bootstrap).toBeNull()
  })

  it('returns valid bootstrap with 5+ velocities', () => {
    const result = runQuadrupleForecast(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 5,
        startDate: '2024-01-01',
        sprintCadenceWeeks: 2,
        trialCount: 100,
      },
      [10, 20, 30, 40, 50] // 5 velocities
    )
    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.sprintsRequired).toHaveLength(100)
  })
})

// ============================================================================
// Edge Case Tests
// ============================================================================

describe('edge cases', () => {
  it('runSimulation with remainingBacklog = 0 returns all zeros', () => {
    const result = runSimulation({
      remainingBacklog: 0,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 100,
    })

    expect(result.sprintsRequired).toHaveLength(100)
    result.sprintsRequired.forEach((s) => expect(s).toBe(0))
  })

  it('runSimulation with very large backlog completes within MAX_TRIAL_SPRINTS', () => {
    const result = runSimulation({
      remainingBacklog: 100000,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 10,
    })

    expect(result.sprintsRequired).toHaveLength(10)
    result.sprintsRequired.forEach((s) => {
      expect(s).toBeLessThanOrEqual(1000)
      expect(s).toBeGreaterThan(0)
    })
  })

  it('productivity factors shorter than needed sprints use 1.0 fallback (BUG-1 regression)', () => {
    // Provide only 5 factors, but trial needs more sprints
    const factors = [0.5, 0.5, 0.5, 0.5, 0.5]
    const result = runSimulation(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 0, // deterministic
        startDate: '2024-01-01',
        sprintCadenceWeeks: 2,
        trialCount: 1,
      },
      factors
    )

    // First 5 sprints: velocity 20 * 0.5 = 10/sprint = 50 total
    // Remaining 50 backlog: velocity 20 * 1.0 = 20/sprint = 3 more sprints (20+20+10)
    // Total: 5 + 3 = 8 sprints
    expect(result.sprintsRequired[0]).toBe(8)
  })

  it('runSimulation with productivity factors works correctly', () => {
    // All factors 1.0 should produce same result as without factors
    const factors = new Array(1000).fill(1.0)
    const withFactors = runSimulation(
      {
        remainingBacklog: 100,
        velocityMean: 20,
        velocityStdDev: 0,
        startDate: '2024-01-01',
        sprintCadenceWeeks: 2,
        trialCount: 10,
      },
      factors
    )
    const withoutFactors = runSimulation({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 0,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 10,
    })

    // Deterministic: both should be identical
    expect(withFactors.sprintsRequired).toEqual(withoutFactors.sprintsRequired)
  })

  it('single trial in simulation produces valid result', () => {
    const result = runSimulation({
      remainingBacklog: 50,
      velocityMean: 10,
      velocityStdDev: 2,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 1,
    })

    expect(result.sprintsRequired).toHaveLength(1)
    expect(result.sprintsRequired[0]).toBeGreaterThan(0)
  })

  it('calculatePercentileResult with single trial', () => {
    const result = calculatePercentileResult([5], 50, '2024-01-01', 2)
    expect(result.sprintsRequired).toBe(5)
    expect(result.finishDate).toBeDefined()
  })
})

describe('runSimulation edge cases', () => {
  it('handles trialCount of 1', () => {
    const result = runSimulation({
      remainingBacklog: 50,
      velocityMean: 10,
      velocityStdDev: 0,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 1,
    })
    expect(result.sprintsRequired).toHaveLength(1)
    expect(result.sprintsRequired[0]).toBe(5)
  })
})

describe('calculatePercentileResult edge cases', () => {
  it('handles empty sorted array', () => {
    const result = calculatePercentileResult([], 50, '2024-01-01', 2)
    expect(result.sprintsRequired).toBe(0)
  })
})

// ============================================================================
// Milestone-aware simulation tests
// ============================================================================

describe('runQuadrupleForecastWithMilestones', () => {
  it('returns per-milestone results for all three parametric distributions', () => {
    const thresholds = [200, 350, 500] // cumulative: MVP=200, Beta=350, GA=500
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)

    expect(result.truncatedNormal.milestoneResults).toHaveLength(3)
    expect(result.lognormal.milestoneResults).toHaveLength(3)
    expect(result.gamma.milestoneResults).toHaveLength(3)
    expect(result.bootstrap).toBeNull()

    // Each milestone should have percentile results
    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      for (const ms of dist.milestoneResults) {
        expect(ms.results.p50).toBeDefined()
        expect(ms.results.p90).toBeDefined()
        expect(ms.sprintsRequired).toHaveLength(100)
      }
    }
  })

  it('milestone sprint counts are non-decreasing (deterministic)', () => {
    // With stdDev=0, velocity = 20 each sprint
    // Milestone 1 at 200: 200/20 = 10 sprints
    // Milestone 2 at 350: 350/20 = 17.5 => 18 sprints
    // Milestone 3 at 500: 500/20 = 25 sprints
    const thresholds = [200, 350, 500]
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)

    const tn = result.truncatedNormal.milestoneResults
    expect(tn[0].results.p50.sprintsRequired).toBe(10)
    expect(tn[1].results.p50.sprintsRequired).toBe(18)
    expect(tn[2].results.p50.sprintsRequired).toBe(25)

    // Earlier milestones always complete before later ones
    expect(tn[0].results.p50.sprintsRequired).toBeLessThanOrEqual(tn[1].results.p50.sprintsRequired)
    expect(tn[1].results.p50.sprintsRequired).toBeLessThanOrEqual(tn[2].results.p50.sprintsRequired)
  })

  it('last milestone matches simple forecast for total backlog', () => {
    const thresholds = [200, 350, 500]
    const milestoneResult = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)
    const simpleResult = runQuadrupleForecast(milestoneBaseConfig)

    // Last milestone (500 total) should match simple forecast (500 backlog)
    const lastMilestoneSprints = milestoneResult.truncatedNormal.milestoneResults[2].results.p50.sprintsRequired
    const simpleSprints = simpleResult.truncatedNormal.results.p50.sprintsRequired
    expect(lastMilestoneSprints).toBe(simpleSprints)
  })

  it('handles single milestone (equivalent to simple mode)', () => {
    const thresholds = [500]
    const milestoneResult = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)
    const simpleResult = runQuadrupleForecast(milestoneBaseConfig)

    expect(milestoneResult.truncatedNormal.milestoneResults).toHaveLength(1)
    expect(milestoneResult.truncatedNormal.milestoneResults[0].results.p50.sprintsRequired)
      .toBe(simpleResult.truncatedNormal.results.p50.sprintsRequired)
  })

  it('includes bootstrap when historical velocities provided', () => {
    const thresholds = [200, 500]
    const historicalVelocities = [18, 19, 20, 21, 22]
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds, historicalVelocities)

    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.milestoneResults).toHaveLength(2)
    expect(result.bootstrap!.milestoneResults[0].sprintsRequired).toHaveLength(100)
    expect(result.bootstrap!.milestoneResults[1].sprintsRequired).toHaveLength(100)

    // Bootstrap milestone sprint counts should also be non-decreasing per trial
    for (let i = 0; i < 100; i++) {
      expect(result.bootstrap!.milestoneResults[0].sprintsRequired[i])
        .toBeLessThanOrEqual(result.bootstrap!.milestoneResults[1].sprintsRequired[i] + 1)
      // +1 tolerance because arrays are independently sorted
    }
  })

  it('returns null bootstrap when no historical velocities', () => {
    const thresholds = [200, 500]
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)
    expect(result.bootstrap).toBeNull()
  })

  it('applies productivity factors correctly', () => {
    // Factor 0.5 for all sprints: effective velocity = 10
    // Milestone 1 at 100: 100/10 = 10 sprints
    // Milestone 2 at 200: 200/10 = 20 sprints
    const config = { ...milestoneBaseConfig, remainingBacklog: 200 }
    const thresholds = [100, 200]
    const factors = new Array(1000).fill(0.5)
    const result = runQuadrupleForecastWithMilestones(config, thresholds, undefined, factors)

    const tn = result.truncatedNormal.milestoneResults
    expect(tn[0].results.p50.sprintsRequired).toBe(10)
    expect(tn[1].results.p50.sprintsRequired).toBe(20)
  })

  it('each milestone sprint array is sorted', () => {
    const thresholds = [200, 350, 500]
    const config = { ...milestoneBaseConfig, velocityStdDev: 5, trialCount: 1000 }
    const result = runQuadrupleForecastWithMilestones(config, thresholds)

    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      for (const ms of dist.milestoneResults) {
        for (let i = 1; i < ms.sprintsRequired.length; i++) {
          expect(ms.sprintsRequired[i]).toBeGreaterThanOrEqual(ms.sprintsRequired[i - 1])
        }
      }
    }
  })

  it('produces reasonable P50 values with variance', () => {
    const config = { ...milestoneBaseConfig, velocityStdDev: 5, trialCount: 10000 }
    const thresholds = [200, 500]
    const result = runQuadrupleForecastWithMilestones(config, thresholds)

    // Milestone 1 (200 backlog, mean velocity 20): ~10 sprints
    // Milestone 2 (500 backlog, mean velocity 20): ~25 sprints
    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      expect(dist.milestoneResults[0].results.p50.sprintsRequired).toBeGreaterThanOrEqual(8)
      expect(dist.milestoneResults[0].results.p50.sprintsRequired).toBeLessThanOrEqual(13)
      expect(dist.milestoneResults[1].results.p50.sprintsRequired).toBeGreaterThanOrEqual(22)
      expect(dist.milestoneResults[1].results.p50.sprintsRequired).toBeLessThanOrEqual(30)
    }
  })

  it('P90 >= P50 for all milestones and distributions', () => {
    const config = { ...milestoneBaseConfig, velocityStdDev: 5, trialCount: 10000 }
    const thresholds = [200, 350, 500]
    const result = runQuadrupleForecastWithMilestones(config, thresholds)

    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      for (const ms of dist.milestoneResults) {
        expect(ms.results.p90.sprintsRequired).toBeGreaterThanOrEqual(ms.results.p50.sprintsRequired)
      }
    }
  })
})
