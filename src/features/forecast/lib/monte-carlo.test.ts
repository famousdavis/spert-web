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

// ============================================================================
// Shared test configs (DRY)
// ============================================================================

/** Stochastic config for tests that don't need deterministic results */
const stochasticConfig = {
  remainingBacklog: 100,
  velocityMean: 20,
  velocityStdDev: 5,
  startDate: '2024-01-01',
  sprintCadenceWeeks: 2,
  trialCount: 100,
}

/** Deterministic config (stdDev=0) for exact assertions */
const deterministicConfig = {
  ...stochasticConfig,
  velocityStdDev: 0,
}

/** Milestone config for milestone-aware tests */
const milestoneBaseConfig = {
  remainingBacklog: 500,
  velocityMean: 20,
  velocityStdDev: 0, // deterministic for predictable assertions
  startDate: '2024-01-01',
  sprintCadenceWeeks: 2,
  trialCount: 100,
}

// ============================================================================
// Sampler tests — parametric distributions (collapsed via describe.each)
// ============================================================================

describe.each([
  { distribution: 'truncatedNormal' as const },
  { distribution: 'lognormal' as const },
  { distribution: 'gamma' as const },
])('runTrial with $distribution sampler', ({ distribution }) => {
  it('returns a positive number of sprints', () => {
    const sampler = createSampler(distribution, 20, 5)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThan(0)
  })

  it('handles small standard deviation (near-deterministic)', () => {
    const sampler = createSampler(distribution, 20, distribution === 'truncatedNormal' ? 0 : 0.1)
    const sprints = runTrial(100, sampler)
    expect(sprints).toBeGreaterThanOrEqual(4)
    expect(sprints).toBeLessThanOrEqual(6)
  })

  it('handles small remaining backlog', () => {
    const sampler = createSampler(distribution, 20, 5)
    const sprints = runTrial(10, sampler)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })

  it('always produces positive velocity (bounded at zero)', () => {
    const sampler = createSampler(distribution, 10, 8)
    for (let i = 0; i < 100; i++) {
      const sprints = runTrial(100, sampler)
      expect(sprints).toBeGreaterThan(0)
      expect(sprints).toBeLessThan(1000)
    }
  })
})

// Truncated normal with exactly zero stdDev is perfectly deterministic
describe('runTrial with truncatedNormal sampler (deterministic)', () => {
  it('returns exact sprint count with zero standard deviation', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    expect(runTrial(100, sampler)).toBe(5) // 100 / 20 = 5
  })
})

// ============================================================================
// Bootstrap sampler tests
// ============================================================================

describe('runTrial with bootstrap sampler', () => {
  it('returns a positive number of sprints', () => {
    const sampler = createBootstrapSampler([15, 20, 25, 18, 22])
    expect(runTrial(100, sampler)).toBeGreaterThan(0)
  })

  it('throws error with empty historical data', () => {
    expect(() => createBootstrapSampler([])).toThrow('Bootstrap requires historical velocity data')
  })

  it('handles small remaining backlog', () => {
    const sampler = createBootstrapSampler([15, 20, 25, 18, 22])
    expect(runTrial(10, sampler)).toBeGreaterThanOrEqual(1)
  })

  it('uses only values from historical data', () => {
    const sampler = createBootstrapSampler([20]) // single value → deterministic
    for (let i = 0; i < 10; i++) {
      expect(runTrial(100, sampler)).toBe(5) // 100 / 20 = 5
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

// ============================================================================
// runSimulation tests (collapsed via describe.each where possible)
// ============================================================================

describe.each([
  { dist: 'truncatedNormal' as const },
  { dist: 'lognormal' as const },
  { dist: 'gamma' as const },
])('runSimulation with $dist distribution', ({ dist }) => {
  it('returns the correct number of trials', () => {
    const result = runSimulation({ ...stochasticConfig, distributionType: dist })
    expect(result.sprintsRequired).toHaveLength(100)
    expect(result.distributionType).toBe(dist)
  })
})

describe('runSimulation', () => {
  it('returns sorted sprint counts', () => {
    const result = runSimulation({ ...stochasticConfig, trialCount: 1000 })
    for (let i = 1; i < result.sprintsRequired.length; i++) {
      expect(result.sprintsRequired[i]).toBeGreaterThanOrEqual(result.sprintsRequired[i - 1])
    }
  })
})

// ============================================================================
// calculatePercentileResult
// ============================================================================

describe('calculatePercentileResult', () => {
  it('calculates correct finish date', () => {
    const result = calculatePercentileResult([3, 4, 5, 6, 7], 50, '2024-01-01', 2)
    // Median of [3,4,5,6,7] is 5
    // Sprint 5 finishes on the Friday before sprint 6 starts (2024-03-08)
    expect(result.sprintsRequired).toBe(5)
    expect(result.percentile).toBe(50)
    expect(result.finishDate).toBe('2024-03-08')
  })

  it('handles P90 correctly', () => {
    const sortedSprints = Array.from({ length: 100 }, (_, i) => i + 1)
    const result = calculatePercentileResult(sortedSprints, 90, '2024-01-01', 2)
    expect(result.sprintsRequired).toBeGreaterThanOrEqual(90)
    expect(result.sprintsRequired).toBeLessThanOrEqual(92)
  })

  it('handles empty sorted array', () => {
    const result = calculatePercentileResult([], 50, '2024-01-01', 2)
    expect(result.sprintsRequired).toBe(0)
  })

  it('handles single trial', () => {
    const result = calculatePercentileResult([5], 50, '2024-01-01', 2)
    expect(result.sprintsRequired).toBe(5)
    expect(result.finishDate).toBeDefined()
  })
})

// ============================================================================
// runForecast
// ============================================================================

describe('runForecast', () => {
  it('returns all standard percentiles', () => {
    const result = runForecast({ ...stochasticConfig, trialCount: 1000 })
    expect(result.p50).toBeDefined()
    expect(result.p60).toBeDefined()
    expect(result.p70).toBeDefined()
    expect(result.p80).toBeDefined()
    expect(result.p90).toBeDefined()
  })

  it('higher percentiles have later or equal finish dates', () => {
    const result = runForecast({ ...stochasticConfig, trialCount: 10000 })
    expect(result.p50.sprintsRequired).toBeLessThanOrEqual(result.p60.sprintsRequired)
    expect(result.p60.sprintsRequired).toBeLessThanOrEqual(result.p70.sprintsRequired)
    expect(result.p70.sprintsRequired).toBeLessThanOrEqual(result.p80.sprintsRequired)
    expect(result.p80.sprintsRequired).toBeLessThanOrEqual(result.p90.sprintsRequired)
  })
})

// ============================================================================
// runQuadrupleForecast
// ============================================================================

describe('runQuadrupleForecast', () => {
  it('returns results for all four distributions when historical data provided', () => {
    const result = runQuadrupleForecast(
      { ...stochasticConfig, trialCount: 1000 },
      [15, 20, 25, 18, 22]
    )
    expect(result.truncatedNormal).toBeDefined()
    expect(result.lognormal).toBeDefined()
    expect(result.gamma).toBeDefined()
    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.results.p50).toBeDefined()
    expect(result.bootstrap!.sprintsRequired).toHaveLength(1000)
  })

  it('returns null for bootstrap when no historical data provided', () => {
    const result = runQuadrupleForecast(stochasticConfig)
    expect(result.truncatedNormal).toBeDefined()
    expect(result.lognormal).toBeDefined()
    expect(result.gamma).toBeDefined()
    expect(result.bootstrap).toBeNull()
  })

  it('returns null for bootstrap when historical velocities is empty', () => {
    const result = runQuadrupleForecast(stochasticConfig, [])
    expect(result.bootstrap).toBeNull()
  })

  it('returns valid bootstrap with 5+ velocities', () => {
    const result = runQuadrupleForecast(stochasticConfig, [10, 20, 30, 40, 50])
    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.sprintsRequired).toHaveLength(100)
  })

  it('bootstrap produces reasonable results matching historical data', () => {
    const result = runQuadrupleForecast(
      { ...stochasticConfig, velocityStdDev: 2, trialCount: 10000 },
      [18, 19, 20, 21, 22]
    )
    expect(result.bootstrap).not.toBeNull()
    expect(result.bootstrap!.results.p50.sprintsRequired).toBeGreaterThanOrEqual(4)
    expect(result.bootstrap!.results.p50.sprintsRequired).toBeLessThanOrEqual(7)
    expect(result.bootstrap!.results.p90.sprintsRequired).toBeGreaterThanOrEqual(
      result.bootstrap!.results.p50.sprintsRequired
    )
  })

  it('applies productivity factors when provided', () => {
    const factors = new Array(1000).fill(0.5) // 50% productivity → effective velocity 10
    const result = runQuadrupleForecast(deterministicConfig, undefined, factors)
    // 100 / (20 * 0.5) = 10 sprints
    expect(result.truncatedNormal.results.p50.sprintsRequired).toBe(10)
  })

  it('all distributions produce reasonable P50 results', () => {
    const result = runQuadrupleForecast({ ...stochasticConfig, trialCount: 10000 })
    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      expect(dist.results.p50.sprintsRequired).toBeGreaterThanOrEqual(4)
      expect(dist.results.p50.sprintsRequired).toBeLessThanOrEqual(7)
      expect(dist.results.p90.sprintsRequired).toBeGreaterThanOrEqual(dist.results.p50.sprintsRequired)
    }
  })
})

// ============================================================================
// Edge cases
// ============================================================================

describe('edge cases', () => {
  it('runSimulation with remainingBacklog = 0 returns all zeros', () => {
    const result = runSimulation({ ...stochasticConfig, remainingBacklog: 0 })
    expect(result.sprintsRequired).toHaveLength(100)
    result.sprintsRequired.forEach((s) => expect(s).toBe(0))
  })

  it('runSimulation with very large backlog completes within MAX_TRIAL_SPRINTS', () => {
    const result = runSimulation({ ...stochasticConfig, remainingBacklog: 100000, trialCount: 10 })
    expect(result.sprintsRequired).toHaveLength(10)
    result.sprintsRequired.forEach((s) => {
      expect(s).toBeLessThanOrEqual(1000)
      expect(s).toBeGreaterThan(0)
    })
  })

  it('productivity factors shorter than needed sprints use 1.0 fallback (BUG-1 regression)', () => {
    const factors = [0.5, 0.5, 0.5, 0.5, 0.5]
    const result = runSimulation(
      { ...deterministicConfig, trialCount: 1 },
      factors
    )
    // First 5 sprints: velocity 20 * 0.5 = 10/sprint = 50 total
    // Remaining 50 backlog: velocity 20 * 1.0 = 20/sprint → 3 more sprints (20+20+10)
    // Total: 5 + 3 = 8 sprints
    expect(result.sprintsRequired[0]).toBe(8)
  })

  it('productivity factors of 1.0 produce same result as no factors', () => {
    const factors = new Array(1000).fill(1.0)
    const withFactors = runSimulation({ ...deterministicConfig, trialCount: 10 }, factors)
    const withoutFactors = runSimulation({ ...deterministicConfig, trialCount: 10 })
    expect(withFactors.sprintsRequired).toEqual(withoutFactors.sprintsRequired)
  })

  it('single trial in simulation produces valid result', () => {
    const result = runSimulation({ ...stochasticConfig, remainingBacklog: 50, velocityMean: 10, velocityStdDev: 2, trialCount: 1 })
    expect(result.sprintsRequired).toHaveLength(1)
    expect(result.sprintsRequired[0]).toBeGreaterThan(0)
  })
})

// ============================================================================
// Milestone-aware simulation tests
// ============================================================================

describe('runQuadrupleForecastWithMilestones', () => {
  it('returns per-milestone results for all three parametric distributions', () => {
    const thresholds = [200, 350, 500]
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)

    expect(result.truncatedNormal.milestoneResults).toHaveLength(3)
    expect(result.lognormal.milestoneResults).toHaveLength(3)
    expect(result.gamma.milestoneResults).toHaveLength(3)
    expect(result.bootstrap).toBeNull()

    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      for (const ms of dist.milestoneResults) {
        expect(ms.results.p50).toBeDefined()
        expect(ms.results.p90).toBeDefined()
        expect(ms.sprintsRequired).toHaveLength(100)
      }
    }
  })

  it('milestone sprint counts are non-decreasing (deterministic)', () => {
    const thresholds = [200, 350, 500]
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)
    const tn = result.truncatedNormal.milestoneResults

    // With stdDev=0, velocity=20: 200/20=10, 350/20=17.5→18, 500/20=25
    expect(tn[0].results.p50.sprintsRequired).toBe(10)
    expect(tn[1].results.p50.sprintsRequired).toBe(18)
    expect(tn[2].results.p50.sprintsRequired).toBe(25)

    expect(tn[0].results.p50.sprintsRequired).toBeLessThanOrEqual(tn[1].results.p50.sprintsRequired)
    expect(tn[1].results.p50.sprintsRequired).toBeLessThanOrEqual(tn[2].results.p50.sprintsRequired)
  })

  it('last milestone matches simple forecast for total backlog', () => {
    const thresholds = [200, 350, 500]
    const milestoneResult = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds)
    const simpleResult = runQuadrupleForecast(milestoneBaseConfig)

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
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, thresholds, [18, 19, 20, 21, 22])

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
    const result = runQuadrupleForecastWithMilestones(milestoneBaseConfig, [200, 500])
    expect(result.bootstrap).toBeNull()
  })

  it('applies productivity factors correctly', () => {
    const config = { ...milestoneBaseConfig, remainingBacklog: 200 }
    const thresholds = [100, 200]
    const factors = new Array(1000).fill(0.5) // effective velocity = 10

    const result = runQuadrupleForecastWithMilestones(config, thresholds, undefined, factors)
    const tn = result.truncatedNormal.milestoneResults
    expect(tn[0].results.p50.sprintsRequired).toBe(10) // 100/10
    expect(tn[1].results.p50.sprintsRequired).toBe(20) // 200/10
  })

  it('each milestone sprint array is sorted', () => {
    const config = { ...milestoneBaseConfig, velocityStdDev: 5, trialCount: 1000 }
    const result = runQuadrupleForecastWithMilestones(config, [200, 350, 500])

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
    const result = runQuadrupleForecastWithMilestones(config, [200, 500])

    // Milestone 1 (200/20 ≈ 10 sprints), Milestone 2 (500/20 ≈ 25 sprints)
    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      expect(dist.milestoneResults[0].results.p50.sprintsRequired).toBeGreaterThanOrEqual(8)
      expect(dist.milestoneResults[0].results.p50.sprintsRequired).toBeLessThanOrEqual(13)
      expect(dist.milestoneResults[1].results.p50.sprintsRequired).toBeGreaterThanOrEqual(22)
      expect(dist.milestoneResults[1].results.p50.sprintsRequired).toBeLessThanOrEqual(30)
    }
  })

  it('P90 >= P50 for all milestones and distributions', () => {
    const config = { ...milestoneBaseConfig, velocityStdDev: 5, trialCount: 10000 }
    const result = runQuadrupleForecastWithMilestones(config, [200, 350, 500])

    for (const dist of [result.truncatedNormal, result.lognormal, result.gamma]) {
      for (const ms of dist.milestoneResults) {
        expect(ms.results.p90.sprintsRequired).toBeGreaterThanOrEqual(ms.results.p50.sprintsRequired)
      }
    }
  })
})

// ============================================================================
// Scope growth modeling
// ============================================================================

describe('runTrial with scope growth', () => {
  it('produces same result without scope growth parameter', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    expect(runTrial(100, sampler)).toBe(5)
    expect(runTrial(100, sampler, undefined, 0)).toBe(5) // 0 is falsy → no growth
  })

  it('increases sprint count with positive scope growth (deterministic)', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    // Growth of 5/sprint: each sprint completes net 15, so 100/15 ≈ 7 sprints
    expect(runTrial(100, sampler, undefined, 5)).toBe(7)
  })

  it('decreases sprint count with negative scope growth (scope shrinking)', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    // Growth of -5/sprint: each sprint completes net 25, so 100/25 = 4 sprints
    expect(runTrial(100, sampler, undefined, -5)).toBe(4)
  })

  it('hits MAX_TRIAL_SPRINTS when scope growth exceeds velocity', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    expect(runTrial(100, sampler, undefined, 25)).toBe(1000) // MAX_TRIAL_SPRINTS
  })

  it('combines with productivity factors correctly', () => {
    const sampler = createSampler('truncatedNormal', 20, 0)
    // Sprint 1: 100 + 3 = 103, velocity = 20 * 0.5 = 10, remaining = 93
    // Sprint 2-7: growth=3, velocity=20 → net 17/sprint
    // 93 → 76 → 59 → 42 → 25 → 8 → -9 (done)
    const factors = [0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    expect(runTrial(100, sampler, factors, 3)).toBe(7)
  })
})

describe('runSimulation with scope growth', () => {
  it('produces sorted results with scope growth', () => {
    const result = runSimulation(stochasticConfig, undefined, 3)
    for (let i = 1; i < result.sprintsRequired.length; i++) {
      expect(result.sprintsRequired[i]).toBeGreaterThanOrEqual(result.sprintsRequired[i - 1])
    }
  })

  it('scope growth increases sprint count vs no growth', () => {
    const withGrowth = runSimulation({ ...stochasticConfig, trialCount: 1000 }, undefined, 3)
    const noGrowth = runSimulation({ ...stochasticConfig, trialCount: 1000 })
    // Compare medians (index 500)
    expect(withGrowth.sprintsRequired[500]).toBeGreaterThanOrEqual(noGrowth.sprintsRequired[500])
  })
})

describe('runQuadrupleForecast with scope growth', () => {
  it('threads scope growth to all distributions', () => {
    const withGrowth = runQuadrupleForecast(deterministicConfig, undefined, undefined, 5)
    const withoutGrowth = runQuadrupleForecast(deterministicConfig)

    // With growth=5, velocity=20: net 15/sprint → 100/15 ≈ 7; without: 100/20 = 5
    expect(withGrowth.truncatedNormal.results.p50.sprintsRequired).toBe(7)
    expect(withoutGrowth.truncatedNormal.results.p50.sprintsRequired).toBe(5)
    expect(withGrowth.lognormal.results.p50.sprintsRequired).toBeGreaterThan(
      withoutGrowth.lognormal.results.p50.sprintsRequired
    )
    expect(withGrowth.gamma.results.p50.sprintsRequired).toBeGreaterThan(
      withoutGrowth.gamma.results.p50.sprintsRequired
    )
  })

  it('threads scope growth to bootstrap distribution', () => {
    const velocities = [20, 20, 20, 20, 20] // deterministic bootstrap
    const withGrowth = runQuadrupleForecast(deterministicConfig, velocities, undefined, 5)
    const withoutGrowth = runQuadrupleForecast(deterministicConfig, velocities)

    expect(withGrowth.bootstrap).not.toBeNull()
    expect(withGrowth.bootstrap!.results.p50.sprintsRequired).toBe(7)
    expect(withoutGrowth.bootstrap!.results.p50.sprintsRequired).toBe(5)
  })
})

describe('runQuadrupleForecastWithMilestones with scope growth', () => {
  it('preserves milestone ordering with scope growth', () => {
    const thresholds = [40, 70, 100]
    const result = runQuadrupleForecastWithMilestones(deterministicConfig, thresholds, undefined, undefined, 3)

    const tn = result.truncatedNormal.milestoneResults
    expect(tn[0].results.p50.sprintsRequired).toBeLessThanOrEqual(tn[1].results.p50.sprintsRequired)
    expect(tn[1].results.p50.sprintsRequired).toBeLessThanOrEqual(tn[2].results.p50.sprintsRequired)
  })

  it('scope growth does not change milestone completion when based on cumulative work', () => {
    // Milestone thresholds check cumulative completed work, not remaining backlog.
    // With stdDev=0 (deterministic), milestone sprint counts should be identical
    // regardless of scope growth, because completed work rate is unchanged.
    const thresholds = [40, 80, 100]
    const withGrowth = runQuadrupleForecastWithMilestones(deterministicConfig, thresholds, undefined, undefined, 3)
    const withoutGrowth = runQuadrupleForecastWithMilestones(deterministicConfig, thresholds)

    for (let m = 0; m < thresholds.length; m++) {
      expect(withGrowth.truncatedNormal.milestoneResults[m].results.p50.sprintsRequired)
        .toBe(withoutGrowth.truncatedNormal.milestoneResults[m].results.p50.sprintsRequired)
    }
  })
})
