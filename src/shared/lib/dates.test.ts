import { describe, it, expect } from 'vitest'
import {
  getWorkingDaysInRange,
  countWorkingDays,
  calculateSprintProductivityFactor,
  isWeekend,
} from './dates'

describe('isWeekend', () => {
  it('identifies Saturday as weekend', () => {
    expect(isWeekend('2025-01-04')).toBe(true) // Saturday
  })

  it('identifies Sunday as weekend', () => {
    expect(isWeekend('2025-01-05')).toBe(true) // Sunday
  })

  it('identifies Monday as not weekend', () => {
    expect(isWeekend('2025-01-06')).toBe(false) // Monday
  })

  it('identifies Friday as not weekend', () => {
    expect(isWeekend('2025-01-03')).toBe(false) // Friday
  })
})

describe('getWorkingDaysInRange', () => {
  it('returns working days excluding weekends', () => {
    // Mon Jan 6 to Fri Jan 10, 2025 - all 5 days are weekdays
    const days = getWorkingDaysInRange('2025-01-06', '2025-01-10')
    expect(days).toEqual([
      '2025-01-06',
      '2025-01-07',
      '2025-01-08',
      '2025-01-09',
      '2025-01-10',
    ])
  })

  it('excludes Saturday and Sunday', () => {
    // Fri Jan 3 to Mon Jan 6, 2025 - should exclude Sat and Sun
    const days = getWorkingDaysInRange('2025-01-03', '2025-01-06')
    expect(days).toEqual(['2025-01-03', '2025-01-06'])
  })

  it('returns empty array for weekend-only range', () => {
    // Sat Jan 4 to Sun Jan 5, 2025
    const days = getWorkingDaysInRange('2025-01-04', '2025-01-05')
    expect(days).toEqual([])
  })

  it('handles single day that is a weekday', () => {
    const days = getWorkingDaysInRange('2025-01-06', '2025-01-06')
    expect(days).toEqual(['2025-01-06'])
  })

  it('handles single day that is a weekend', () => {
    const days = getWorkingDaysInRange('2025-01-04', '2025-01-04')
    expect(days).toEqual([])
  })

  it('handles two-week sprint period', () => {
    // Mon Jan 6 to Fri Jan 17, 2025 - two full work weeks = 10 days
    const days = getWorkingDaysInRange('2025-01-06', '2025-01-17')
    expect(days.length).toBe(10)
    // Verify no weekend days included
    days.forEach((day) => {
      expect(isWeekend(day)).toBe(false)
    })
  })
})

describe('countWorkingDays', () => {
  it('counts working days in a week', () => {
    // Mon Jan 6 to Fri Jan 10, 2025
    expect(countWorkingDays('2025-01-06', '2025-01-10')).toBe(5)
  })

  it('counts working days across weekend', () => {
    // Fri Jan 3 to Mon Jan 6, 2025
    expect(countWorkingDays('2025-01-03', '2025-01-06')).toBe(2)
  })

  it('returns 0 for weekend-only range', () => {
    expect(countWorkingDays('2025-01-04', '2025-01-05')).toBe(0)
  })

  it('counts working days in two-week sprint', () => {
    // Mon Jan 6 to Fri Jan 17, 2025
    expect(countWorkingDays('2025-01-06', '2025-01-17')).toBe(10)
  })
})

describe('calculateSprintProductivityFactor', () => {
  it('returns 1.0 when no adjustments are provided', () => {
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [])
    expect(factor).toBe(1.0)
  })

  it('returns 1.0 when sprint has no working days', () => {
    // Weekend only
    const factor = calculateSprintProductivityFactor('2025-01-04', '2025-01-05', [
      { startDate: '2025-01-01', endDate: '2025-01-31', factor: 0.5 },
    ])
    expect(factor).toBe(1.0)
  })

  it('applies full adjustment when entire sprint is covered', () => {
    // Mon-Fri fully covered by 0.5 adjustment
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-01', endDate: '2025-01-31', factor: 0.5 },
    ])
    expect(factor).toBe(0.5)
  })

  it('applies zero factor when entire sprint is covered', () => {
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-01', endDate: '2025-01-31', factor: 0.0 },
    ])
    expect(factor).toBe(0.0)
  })

  it('calculates weighted average for partial coverage', () => {
    // 5 working days: Mon-Fri Jan 6-10
    // Adjustment covers only Mon-Wed (3 days) at 0.5
    // Thu-Fri (2 days) at 1.0
    // Expected: (3*0.5 + 2*1.0) / 5 = (1.5 + 2) / 5 = 0.7
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-06', endDate: '2025-01-08', factor: 0.5 },
    ])
    expect(factor).toBeCloseTo(0.7, 5)
  })

  it('uses minimum factor when adjustments overlap', () => {
    // Two overlapping adjustments: 0.5 and 0.3
    // Should use 0.3 (most restrictive)
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-01', endDate: '2025-01-31', factor: 0.5 },
      { startDate: '2025-01-01', endDate: '2025-01-31', factor: 0.3 },
    ])
    expect(factor).toBe(0.3)
  })

  it('handles multiple non-overlapping adjustments', () => {
    // 5 working days: Mon-Fri Jan 6-10
    // Mon-Tue (2 days) at 0.5
    // Wed (1 day) at 1.0 (no adjustment)
    // Thu-Fri (2 days) at 0.0
    // Expected: (2*0.5 + 1*1.0 + 2*0.0) / 5 = (1 + 1 + 0) / 5 = 0.4
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-06', endDate: '2025-01-07', factor: 0.5 },
      { startDate: '2025-01-09', endDate: '2025-01-10', factor: 0.0 },
    ])
    expect(factor).toBeCloseTo(0.4, 5)
  })

  it('ignores adjustments that do not overlap with sprint', () => {
    // Adjustment is in February, sprint is in January
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-02-01', endDate: '2025-02-28', factor: 0.0 },
    ])
    expect(factor).toBe(1.0)
  })

  it('handles adjustment starting mid-sprint', () => {
    // 5 working days: Mon-Fri Jan 6-10
    // Adjustment starts Wed Jan 8, covers Wed-Fri (3 days) at 0.5
    // Mon-Tue (2 days) at 1.0
    // Expected: (2*1.0 + 3*0.5) / 5 = (2 + 1.5) / 5 = 0.7
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-08', endDate: '2025-01-31', factor: 0.5 },
    ])
    expect(factor).toBeCloseTo(0.7, 5)
  })

  it('handles adjustment ending mid-sprint', () => {
    // 5 working days: Mon-Fri Jan 6-10
    // Adjustment ends Tue Jan 7, covers Mon-Tue (2 days) at 0.5
    // Wed-Fri (3 days) at 1.0
    // Expected: (2*0.5 + 3*1.0) / 5 = (1 + 3) / 5 = 0.8
    const factor = calculateSprintProductivityFactor('2025-01-06', '2025-01-10', [
      { startDate: '2025-01-01', endDate: '2025-01-07', factor: 0.5 },
    ])
    expect(factor).toBeCloseTo(0.8, 5)
  })

  it('handles real-world December holiday scenario', () => {
    // Two-week sprint: Mon Dec 15 to Fri Dec 26, 2025
    // Working days: Dec 15-19 (5 days), Dec 22-26 (5 days) = 10 days total
    // But Dec 25 (Thu) and Dec 26 (Fri) have 0.0 factor (Christmas)
    // Dec 24 (Wed) has 0.5 factor (Christmas Eve)
    // Days at 1.0: Dec 15-19 (5) + Dec 22-23 (2) = 7 days
    // Days at 0.5: Dec 24 (1 day)
    // Days at 0.0: Dec 25-26 (2 days)
    // Expected: (7*1.0 + 1*0.5 + 2*0.0) / 10 = 7.5 / 10 = 0.75
    const factor = calculateSprintProductivityFactor('2025-12-15', '2025-12-26', [
      { startDate: '2025-12-24', endDate: '2025-12-24', factor: 0.5 },
      { startDate: '2025-12-25', endDate: '2025-12-26', factor: 0.0 },
    ])
    expect(factor).toBeCloseTo(0.75, 5)
  })
})
