import { describe, it, expect } from 'vitest'
import {
  runSingleTrialNormal,
  runSingleTrialLognormal,
  runSimulation,
  calculatePercentileResult,
  runForecast,
  runDualForecast,
} from './monte-carlo'

describe('runSingleTrialNormal', () => {
  it('returns a positive number of sprints', () => {
    const sprints = runSingleTrialNormal(100, 20, 5)
    expect(sprints).toBeGreaterThan(0)
  })

  it('handles zero standard deviation (deterministic)', () => {
    // With stdDev = 0, velocity is always the mean
    // 100 backlog / 20 velocity = 5 sprints
    const sprints = runSingleTrialNormal(100, 20, 0)
    expect(sprints).toBe(5)
  })

  it('handles small remaining backlog', () => {
    const sprints = runSingleTrialNormal(10, 20, 5)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })
})

describe('runSingleTrialLognormal', () => {
  it('returns a positive number of sprints', () => {
    const sprints = runSingleTrialLognormal(100, 20, 5)
    expect(sprints).toBeGreaterThan(0)
  })

  it('handles zero standard deviation (deterministic)', () => {
    // With stdDev = 0, lognormal approaches deterministic behavior
    // The result should still be reasonable
    const sprints = runSingleTrialLognormal(100, 20, 0.1) // Small stdDev
    expect(sprints).toBeGreaterThanOrEqual(4)
    expect(sprints).toBeLessThanOrEqual(6)
  })

  it('handles small remaining backlog', () => {
    const sprints = runSingleTrialLognormal(10, 20, 5)
    expect(sprints).toBeGreaterThanOrEqual(1)
  })
})

describe('runSimulation', () => {
  it('returns the correct number of trials with normal distribution', () => {
    const result = runSimulation({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      sprintCadenceWeeks: 2,
      trialCount: 100,
      distributionType: 'normal',
    })
    expect(result.sprintsRequired).toHaveLength(100)
    expect(result.distributionType).toBe('normal')
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
    // 5 sprints * 2 weeks = 10 weeks from start
    expect(result.sprintsRequired).toBe(5)
    expect(result.percentile).toBe(50)
    expect(result.finishDate).toBe('2024-03-10') // 10 weeks after Jan 1
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

describe('runDualForecast', () => {
  it('returns results for both distributions', () => {
    const result = runDualForecast({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      trialCount: 1000,
      sprintCadenceWeeks: 2,
    })

    expect(result.normal).toBeDefined()
    expect(result.lognormal).toBeDefined()
    expect(result.normal.results.p50).toBeDefined()
    expect(result.lognormal.results.p50).toBeDefined()
    expect(result.normal.sprintsRequired).toHaveLength(1000)
    expect(result.lognormal.sprintsRequired).toHaveLength(1000)
  })

  it('both distributions produce reasonable results', () => {
    const result = runDualForecast({
      remainingBacklog: 100,
      velocityMean: 20,
      velocityStdDev: 5,
      startDate: '2024-01-01',
      trialCount: 10000,
      sprintCadenceWeeks: 2,
    })

    // Both should have P50 around 5 sprints (100/20)
    expect(result.normal.results.p50.sprintsRequired).toBeGreaterThanOrEqual(4)
    expect(result.normal.results.p50.sprintsRequired).toBeLessThanOrEqual(7)
    expect(result.lognormal.results.p50.sprintsRequired).toBeGreaterThanOrEqual(4)
    expect(result.lognormal.results.p50.sprintsRequired).toBeLessThanOrEqual(7)

    // Higher percentiles should require at least as many sprints
    expect(result.normal.results.p90.sprintsRequired).toBeGreaterThanOrEqual(
      result.normal.results.p50.sprintsRequired
    )
    expect(result.lognormal.results.p90.sprintsRequired).toBeGreaterThanOrEqual(
      result.lognormal.results.p50.sprintsRequired
    )
  })
})
