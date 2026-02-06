import { describe, it, expect } from 'vitest'
import { buildSummaryText, buildMilestoneSummaryText } from './ForecastSummary'

describe('buildSummaryText', () => {
  it('returns correct narrative for simple mode', () => {
    const text = buildSummaryText(
      'Project Alpha',
      150,
      'points',
      80,
      12,
      '2026-03-28',
      5,
      'T-Normal'
    )
    expect(text).toContain('80% chance')
    expect(text).toContain('Project Alpha')
    expect(text).toContain('150')
    expect(text).toContain('points')
    expect(text).toContain('Sprint 17') // 12 + 5
    expect(text).toContain('March 28, 2026')
    expect(text).toContain('T-Normal')
    expect(text).not.toContain('Scope growth')
  })

  it('includes calculated scope growth info when enabled', () => {
    const text = buildSummaryText(
      'Project Beta',
      200,
      'stories',
      90,
      15,
      '2026-06-15',
      3,
      'Lognorm',
      true,
      5.2,
      'calculated'
    )
    expect(text).toContain('90% chance')
    expect(text).toContain('Sprint 18') // 15 + 3
    expect(text).toContain('Scope growth of +5.2 stories/sprint is modeled (calculated)')
  })

  it('includes custom scope growth info when enabled', () => {
    const text = buildSummaryText(
      'Project Beta',
      200,
      'stories',
      90,
      15,
      '2026-06-15',
      3,
      'Lognorm',
      true,
      8.0,
      'custom'
    )
    expect(text).toContain('Scope growth of +8.0 stories/sprint is modeled (custom)')
  })

  it('handles negative scope growth (scope shrinking)', () => {
    const text = buildSummaryText(
      'Project',
      100,
      'pts',
      70,
      8,
      '2026-04-01',
      2,
      'Gamma',
      true,
      -3.5,
      'calculated'
    )
    expect(text).toContain('Scope growth of -3.5 pts/sprint is modeled (calculated)')
  })

  it('does not include scope growth when not enabled', () => {
    const text = buildSummaryText(
      'Project',
      100,
      'pts',
      80,
      10,
      '2026-05-01',
      0,
      'Bootstrap',
      false,
      5.0
    )
    expect(text).not.toContain('Scope growth')
  })

  it('formats large backlog numbers with commas', () => {
    const text = buildSummaryText(
      'Big Project',
      12500,
      'points',
      85,
      50,
      '2027-01-15',
      10,
      'T-Normal'
    )
    expect(text).toContain('12,500')
  })
})

describe('buildMilestoneSummaryText', () => {
  it('returns correct milestone sentence', () => {
    const text = buildMilestoneSummaryText(
      'MVP',
      8,
      '2026-04-15',
      5
    )
    expect(text).toBe('MVP: Sprint 13 (April 15, 2026)')
  })

  it('handles zero completed sprints', () => {
    const text = buildMilestoneSummaryText(
      'Beta Release',
      12,
      '2026-06-01',
      0
    )
    expect(text).toBe('Beta Release: Sprint 12 (June 1, 2026)')
  })
})
