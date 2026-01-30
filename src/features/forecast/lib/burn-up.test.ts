import { describe, it, expect } from 'vitest'
import { calculateBurnUpData, isBootstrapAvailable } from './burn-up'
import type { BurnUpConfig } from '../types'
import type { Sprint } from '@/shared/types'
import type { QuadSimulationData } from './monte-carlo'

const DEFAULT_CONFIG: BurnUpConfig = {
  distribution: 'truncatedNormal',
  lines: [
    { label: 'Optimistic', percentile: 10, color: '#f97316' },
    { label: 'Expected', percentile: 50, color: '#eab308' },
    { label: 'Conservative', percentile: 90, color: '#3b82f6' },
  ],
}

function makeSprint(num: number, done: number, backlog?: number): Sprint {
  return {
    id: `s${num}`,
    projectId: 'p1',
    sprintNumber: num,
    sprintStartDate: '2024-01-01',
    sprintFinishDate: '2024-01-12',
    doneValue: done,
    backlogAtSprintEnd: backlog,
    includedInForecast: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

// Sorted simulation data for 10 trials
const simData: QuadSimulationData = {
  truncatedNormal: [3, 4, 4, 5, 5, 5, 6, 6, 7, 8],
  lognormal: [3, 4, 4, 5, 5, 5, 6, 6, 7, 8],
  gamma: [3, 4, 4, 5, 5, 5, 6, 6, 7, 8],
  bootstrap: null,
}

describe('calculateBurnUpData', () => {
  it('returns historical and forecast data points', () => {
    const sprints = [makeSprint(1, 20), makeSprint(2, 25), makeSprint(3, 15)]
    const result = calculateBurnUpData({
      sprints,
      forecastBacklog: 40,
      simulationData: simData,
      config: DEFAULT_CONFIG,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 3,
    })

    // Should have historical points (3) + forecast points
    expect(result.length).toBeGreaterThan(3)

    // Historical points should have cumulative done values
    expect(result[0].cumulativeDone).toBe(20)
    expect(result[1].cumulativeDone).toBe(45)
    expect(result[2].cumulativeDone).toBe(60)
  })

  it('generates forecast points starting at sprint 1 when no historical sprints', () => {
    const result = calculateBurnUpData({
      sprints: [],
      forecastBacklog: 100,
      simulationData: simData,
      config: DEFAULT_CONFIG,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 0,
    })

    expect(result.length).toBeGreaterThanOrEqual(1)
    // First point is sprint 1 (forecast), not sprint 0 (origin)
    expect(result[0].sprintNumber).toBe(1)
    expect(result[0].cumulativeDone).toBeNull()
    // Forecast lines should project work done from sprint 1
    expect(result[0].line1).toBeGreaterThan(0)
  })

  it('produces origin point when no sprints and no forecast points', () => {
    // When config has empty lines, no forecast points are generated
    const emptyLinesConfig = {
      distribution: 'truncatedNormal' as const,
      lines: [] as unknown as [any, any, any],
    }
    const result = calculateBurnUpData({
      sprints: [],
      forecastBacklog: 100,
      simulationData: simData,
      config: emptyLinesConfig,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 0,
    })

    expect(result.length).toBe(1)
    expect(result[0].sprintNumber).toBe(0)
    expect(result[0].cumulativeDone).toBe(0)
  })

  it('uses backlog history for scope when available', () => {
    const sprints = [makeSprint(1, 20, 80), makeSprint(2, 25, 60)]
    const result = calculateBurnUpData({
      sprints,
      forecastBacklog: 60,
      simulationData: simData,
      config: DEFAULT_CONFIG,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 2,
    })

    // Scope = cumDone + backlogAtSprintEnd
    expect(result[0].backlog).toBe(20 + 80)
    expect(result[1].backlog).toBe(45 + 60)
  })

  it('uses synthetic backlog when no backlog history', () => {
    const sprints = [makeSprint(1, 20), makeSprint(2, 25)]
    const result = calculateBurnUpData({
      sprints,
      forecastBacklog: 55,
      simulationData: simData,
      config: DEFAULT_CONFIG,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 2,
    })

    // syntheticBacklog = forecastBacklog + totalDone = 55 + 45 = 100
    expect(result[0].backlog).toBe(100)
    expect(result[1].backlog).toBe(100)
  })

  it('sets forecast points cumulativeDone to null', () => {
    const sprints = [makeSprint(1, 20)]
    const result = calculateBurnUpData({
      sprints,
      forecastBacklog: 80,
      simulationData: simData,
      config: DEFAULT_CONFIG,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 1,
    })

    const forecastPoints = result.filter((p) => p.sprintNumber > 1)
    expect(forecastPoints.length).toBeGreaterThan(0)
    forecastPoints.forEach((p) => {
      expect(p.cumulativeDone).toBeNull()
    })
  })

  it('connects forecast lines to last done point', () => {
    const sprints = [makeSprint(1, 20), makeSprint(2, 30)]
    const result = calculateBurnUpData({
      sprints,
      forecastBacklog: 50,
      simulationData: simData,
      config: DEFAULT_CONFIG,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 2,
    })

    // Last historical point should have line values = totalDone
    const lastHistorical = result[1]
    expect(lastHistorical.line1).toBe(50)
    expect(lastHistorical.line2).toBe(50)
    expect(lastHistorical.line3).toBe(50)
  })

  it('handles empty config.lines gracefully (BUG-2 regression)', () => {
    const emptyLinesConfig = {
      distribution: 'truncatedNormal' as const,
      lines: [] as unknown as [any, any, any],
    }
    const sprints = [makeSprint(1, 20)]

    // Should not throw
    const result = calculateBurnUpData({
      sprints,
      forecastBacklog: 80,
      simulationData: simData,
      config: emptyLinesConfig,
      sprintCadenceWeeks: 2,
      firstSprintStartDate: '2024-01-01',
      completedSprintCount: 1,
    })

    // Should have at least the historical point
    expect(result.length).toBeGreaterThanOrEqual(1)
  })
})

describe('isBootstrapAvailable', () => {
  it('returns true when bootstrap data is present', () => {
    expect(isBootstrapAvailable({ ...simData, bootstrap: [3, 4, 5] })).toBe(true)
  })

  it('returns false when bootstrap is null', () => {
    expect(isBootstrapAvailable(simData)).toBe(false)
  })

  it('returns false when bootstrap is empty array', () => {
    expect(isBootstrapAvailable({ ...simData, bootstrap: [] })).toBe(false)
  })
})
