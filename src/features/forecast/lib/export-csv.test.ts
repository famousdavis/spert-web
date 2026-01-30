import { describe, it, expect } from 'vitest'
import { generateForecastCsv, generateFilename } from './export-csv'
import type { PercentileResults } from './monte-carlo'

function makePercentileResults(base: number): PercentileResults {
  return {
    p50: { percentile: 50, sprintsRequired: base, finishDate: '2024-03-01' },
    p60: { percentile: 60, sprintsRequired: base + 1, finishDate: '2024-03-15' },
    p70: { percentile: 70, sprintsRequired: base + 2, finishDate: '2024-03-29' },
    p80: { percentile: 80, sprintsRequired: base + 3, finishDate: '2024-04-12' },
    p90: { percentile: 90, sprintsRequired: base + 4, finishDate: '2024-04-26' },
  }
}

const baseExportData = {
  config: {
    projectName: 'Test Project',
    remainingBacklog: 100,
    velocityMean: 20,
    velocityStdDev: 5,
    startDate: '2024-01-01',
    sprintCadenceWeeks: 2,
    trialCount: 5,
  },
  truncatedNormalResults: makePercentileResults(5),
  lognormalResults: makePercentileResults(5),
  gammaResults: makePercentileResults(5),
  bootstrapResults: null,
  truncatedNormalSprintsRequired: [4, 5, 5, 6, 7],
  lognormalSprintsRequired: [4, 5, 5, 6, 7],
  gammaSprintsRequired: [4, 5, 5, 6, 7],
  bootstrapSprintsRequired: null,
}

describe('generateForecastCsv', () => {
  it('contains all section headers', () => {
    const csv = generateForecastCsv(baseExportData)
    expect(csv).toContain('SIMULATION PARAMETERS')
    expect(csv).toContain('PRODUCTIVITY ADJUSTMENTS')
    expect(csv).toContain('PERCENTILE RESULTS')
    expect(csv).toContain('FREQUENCY DISTRIBUTION')
    expect(csv).toContain('RAW TRIAL DATA (sorted)')
  })

  it('includes all config values in parameters section', () => {
    const csv = generateForecastCsv(baseExportData)
    expect(csv).toContain('Test Project')
    expect(csv).toContain('100')
    expect(csv).toContain('Velocity Mean,20')
    expect(csv).toContain('Velocity Std Dev,5')
    expect(csv).toContain('Sprint Cadence (weeks),2')
    expect(csv).toContain('Trial Count,5')
  })

  it('shows "None" when no productivity adjustments', () => {
    const csv = generateForecastCsv(baseExportData)
    expect(csv).toContain('None')
  })

  it('includes productivity adjustments when provided', () => {
    const data = {
      ...baseExportData,
      config: {
        ...baseExportData.config,
        productivityAdjustments: [
          {
            id: '1',
            name: 'Holiday',
            startDate: '2024-12-20',
            endDate: '2025-01-03',
            factor: 0.5,
            enabled: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
    }
    const csv = generateForecastCsv(data)
    expect(csv).toContain('"Holiday"')
    expect(csv).toContain('2024-12-20')
    expect(csv).toContain('50%')
  })

  it('escapes double quotes in adjustment names', () => {
    const data = {
      ...baseExportData,
      config: {
        ...baseExportData.config,
        productivityAdjustments: [
          {
            id: '1',
            name: 'Team "Alpha" break',
            startDate: '2024-12-20',
            endDate: '2025-01-03',
            factor: 0.5,
            enabled: true,
            reason: 'The "annual" break',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
    }
    const csv = generateForecastCsv(data)
    expect(csv).toContain('"Team ""Alpha"" break"')
    expect(csv).toContain('"The ""annual"" break"')
  })

  it('escapes newlines in adjustment names and reasons (BUG-3 regression)', () => {
    const data = {
      ...baseExportData,
      config: {
        ...baseExportData.config,
        productivityAdjustments: [
          {
            id: '1',
            name: 'Line1\nLine2',
            startDate: '2024-12-20',
            endDate: '2025-01-03',
            factor: 0.5,
            enabled: true,
            reason: 'Reason\r\nwith newline',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
    }
    const csv = generateForecastCsv(data)
    // Newlines should be replaced with spaces
    expect(csv).toContain('"Line1 Line2"')
    expect(csv).toContain('"Reason with newline"')
    // No raw newlines within quoted fields
    const lines = csv.split('\n')
    const adjLine = lines.find((l) => l.includes('Line1'))
    expect(adjLine).toBeDefined()
    expect(adjLine).not.toContain('\r')
  })

  it('has correct column count without bootstrap', () => {
    const csv = generateForecastCsv(baseExportData)
    const lines = csv.split('\n')
    const percentileHeader = lines.find((l) => l.startsWith('Percentile,'))!
    // 7 columns: Percentile, T-Normal Sprints, T-Normal Date, Lognorm Sprints, Lognorm Date, Gamma Sprints, Gamma Date
    expect(percentileHeader.split(',').length).toBe(7)
    expect(csv).toContain('Bootstrap Enabled,No')
  })

  it('has correct column count with bootstrap', () => {
    const data = {
      ...baseExportData,
      bootstrapResults: makePercentileResults(5),
      bootstrapSprintsRequired: [4, 5, 5, 6, 7],
    }
    const csv = generateForecastCsv(data)
    const lines = csv.split('\n')
    const percentileHeader = lines.find((l) => l.startsWith('Percentile,'))!
    // 9 columns: +2 for Bootstrap Sprints and Bootstrap Date
    expect(percentileHeader.split(',').length).toBe(9)
    expect(csv).toContain('Bootstrap Enabled,Yes')
  })

  it('includes correct number of raw trial data rows', () => {
    const csv = generateForecastCsv(baseExportData)
    const lines = csv.split('\n')
    const rawHeaderIdx = lines.findIndex((l) => l.startsWith('RAW TRIAL DATA'))
    const dataHeader = lines[rawHeaderIdx + 1]
    expect(dataHeader).toContain('Trial,')

    // Count data rows (trialCount = 5)
    let dataRows = 0
    for (let i = rawHeaderIdx + 2; i < lines.length; i++) {
      if (lines[i].trim() === '') break
      dataRows++
    }
    expect(dataRows).toBe(5)
  })
})

describe('generateFilename', () => {
  it('generates filename with sanitized project name', () => {
    const filename = generateFilename('My Project!')
    expect(filename).toMatch(/^forecast-my-project--.*\.csv$/)
  })

  it('lowercases the project name', () => {
    const filename = generateFilename('UPPER CASE')
    expect(filename).toContain('upper-case')
  })

  it('replaces special characters with hyphens', () => {
    const filename = generateFilename('project@#$%name')
    expect(filename).not.toMatch(/[@#$%]/)
  })

  it('includes .csv extension', () => {
    const filename = generateFilename('test')
    expect(filename).toMatch(/\.csv$/)
  })
})
