import { describe, it, expect } from 'vitest'
import { calculateVelocityStats, calculateScopeChangeStats } from './statistics'
import type { Sprint } from '@/shared/types'

const createSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: 'test-id',
  projectId: 'project-id',
  sprintNumber: 1,
  sprintStartDate: '2025-01-06',
  sprintFinishDate: '2025-01-17',
  doneValue: 10,
  includedInForecast: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('calculateVelocityStats', () => {
  it('calculates mean and standard deviation for included sprints', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, doneValue: 10, includedInForecast: true }),
      createSprint({ sprintNumber: 2, doneValue: 20, includedInForecast: true }),
      createSprint({ sprintNumber: 3, doneValue: 30, includedInForecast: true }),
    ]

    const stats = calculateVelocityStats(sprints)

    expect(stats.count).toBe(3)
    expect(stats.mean).toBe(20)
    expect(stats.standardDeviation).toBeCloseTo(10, 1)
  })

  it('excludes sprints not included in forecast', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, doneValue: 10, includedInForecast: true }),
      createSprint({ sprintNumber: 2, doneValue: 100, includedInForecast: false }),
      createSprint({ sprintNumber: 3, doneValue: 20, includedInForecast: true }),
    ]

    const stats = calculateVelocityStats(sprints)

    expect(stats.count).toBe(2)
    expect(stats.mean).toBe(15)
  })

  it('handles empty sprints array', () => {
    const stats = calculateVelocityStats([])

    expect(stats.count).toBe(0)
    expect(stats.mean).toBe(0)
    expect(stats.standardDeviation).toBe(0)
  })
})

describe('calculateScopeChangeStats', () => {
  it('returns null for insufficient data (less than 2 sprints with backlog)', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).toBeNull()
  })

  it('returns null when no sprints have backlog data', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1 }),
      createSprint({ sprintNumber: 2 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).toBeNull()
  })

  it('calculates growing trend correctly', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
      createSprint({ sprintNumber: 2, backlogAtSprintEnd: 120 }),
      createSprint({ sprintNumber: 3, backlogAtSprintEnd: 140 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    expect(stats!.trend).toBe('growing')
    expect(stats!.averageChange).toBe(20)
    expect(stats!.totalChange).toBe(40)
    expect(stats!.sprintsWithData).toBe(3)
    expect(stats!.latestScope).toBe(140)
  })

  it('calculates shrinking trend correctly', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
      createSprint({ sprintNumber: 2, backlogAtSprintEnd: 80 }),
      createSprint({ sprintNumber: 3, backlogAtSprintEnd: 60 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    expect(stats!.trend).toBe('shrinking')
    expect(stats!.averageChange).toBe(-20)
    expect(stats!.totalChange).toBe(-40)
  })

  it('calculates stable trend correctly', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
      createSprint({ sprintNumber: 2, backlogAtSprintEnd: 101 }),
      createSprint({ sprintNumber: 3, backlogAtSprintEnd: 99 }),
      createSprint({ sprintNumber: 4, backlogAtSprintEnd: 100 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    expect(stats!.trend).toBe('stable')
  })

  it('sorts sprints by sprint number', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 3, backlogAtSprintEnd: 140 }),
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
      createSprint({ sprintNumber: 2, backlogAtSprintEnd: 120 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    expect(stats!.dataPoints[0].sprintNumber).toBe(1)
    expect(stats!.dataPoints[1].sprintNumber).toBe(2)
    expect(stats!.dataPoints[2].sprintNumber).toBe(3)
  })

  it('ignores sprints without backlog data', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
      createSprint({ sprintNumber: 2 }), // No backlog
      createSprint({ sprintNumber: 3, backlogAtSprintEnd: 120 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    expect(stats!.sprintsWithData).toBe(2)
    expect(stats!.dataPoints).toHaveLength(2)
  })

  it('calculates percent changes correctly', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 100 }),
      createSprint({ sprintNumber: 2, backlogAtSprintEnd: 150 }), // +50%
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    expect(stats!.dataPoints[1].percentChange).toBe(50)
    expect(stats!.averagePercentChange).toBe(50)
  })

  it('handles zero previous scope', () => {
    const sprints: Sprint[] = [
      createSprint({ sprintNumber: 1, backlogAtSprintEnd: 0 }),
      createSprint({ sprintNumber: 2, backlogAtSprintEnd: 100 }),
    ]

    const stats = calculateScopeChangeStats(sprints)

    expect(stats).not.toBeNull()
    // When previous scope is 0, percent change should be 0 (avoid division by zero)
    expect(stats!.dataPoints[1].percentChange).toBe(0)
  })
})
