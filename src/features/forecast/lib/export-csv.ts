import type { PercentileResults } from './monte-carlo'

interface ExportConfig {
  projectName: string
  remainingBacklog: number
  velocityMean: number
  velocityStdDev: number
  startDate: string
  sprintCadenceWeeks: number
  trialCount: number
}

interface ExportData {
  config: ExportConfig
  normalResults: PercentileResults
  lognormalResults: PercentileResults
  normalSprintsRequired: number[]
  lognormalSprintsRequired: number[]
}

/**
 * Build frequency distribution from sorted sprint data
 */
function buildFrequencyDistribution(
  normalSprints: number[],
  lognormalSprints: number[]
): Map<number, { normal: number; lognormal: number }> {
  const freq = new Map<number, { normal: number; lognormal: number }>()

  // Count normal distribution
  for (const sprints of normalSprints) {
    const existing = freq.get(sprints) || { normal: 0, lognormal: 0 }
    existing.normal++
    freq.set(sprints, existing)
  }

  // Count lognormal distribution
  for (const sprints of lognormalSprints) {
    const existing = freq.get(sprints) || { normal: 0, lognormal: 0 }
    existing.lognormal++
    freq.set(sprints, existing)
  }

  return freq
}

/**
 * Generate CSV content for forecast export
 */
export function generateForecastCsv(data: ExportData): string {
  const lines: string[] = []
  const totalTrials = data.config.trialCount

  // Section 1: Parameters
  lines.push('SIMULATION PARAMETERS')
  lines.push('Parameter,Value')
  lines.push(`Project,${data.config.projectName}`)
  lines.push(`Remaining Backlog,${data.config.remainingBacklog}`)
  lines.push(`Velocity Mean,${data.config.velocityMean}`)
  lines.push(`Velocity Std Dev,${data.config.velocityStdDev}`)
  lines.push(`Start Date,${data.config.startDate}`)
  lines.push(`Sprint Cadence (weeks),${data.config.sprintCadenceWeeks}`)
  lines.push(`Trial Count,${totalTrials}`)
  lines.push('')

  // Section 2: Percentile Results
  lines.push('PERCENTILE RESULTS')
  lines.push('Percentile,Normal Sprints,Normal Finish Date,Lognormal Sprints,Lognormal Finish Date')

  const percentiles = [
    { key: 'p50', label: '50' },
    { key: 'p60', label: '60' },
    { key: 'p70', label: '70' },
    { key: 'p80', label: '80' },
    { key: 'p90', label: '90' },
  ] as const

  for (const p of percentiles) {
    const normal = data.normalResults[p.key]
    const lognormal = data.lognormalResults[p.key]
    lines.push(
      `P${p.label},${normal.sprintsRequired},${normal.finishDate},${lognormal.sprintsRequired},${lognormal.finishDate}`
    )
  }
  lines.push('')

  // Section 3: Frequency Distribution
  lines.push('FREQUENCY DISTRIBUTION')
  lines.push(
    'Sprints,Normal Count,Normal %,Normal Cumulative %,Lognormal Count,Lognormal %,Lognormal Cumulative %'
  )

  const freq = buildFrequencyDistribution(
    data.normalSprintsRequired,
    data.lognormalSprintsRequired
  )

  // Sort by sprint count
  const sortedSprints = Array.from(freq.keys()).sort((a, b) => a - b)

  let normalCumulative = 0
  let lognormalCumulative = 0

  for (const sprints of sortedSprints) {
    const counts = freq.get(sprints)!
    const normalPct = (counts.normal / totalTrials) * 100
    const lognormalPct = (counts.lognormal / totalTrials) * 100
    normalCumulative += normalPct
    lognormalCumulative += lognormalPct

    lines.push(
      `${sprints},${counts.normal},${normalPct.toFixed(2)}%,${normalCumulative.toFixed(2)}%,${counts.lognormal},${lognormalPct.toFixed(2)}%,${lognormalCumulative.toFixed(2)}%`
    )
  }
  lines.push('')

  // Section 4: Raw Trial Data
  lines.push('RAW TRIAL DATA (sorted)')
  lines.push('Trial,Normal Sprints,Lognormal Sprints')

  for (let i = 0; i < totalTrials; i++) {
    lines.push(
      `${i + 1},${data.normalSprintsRequired[i]},${data.lognormalSprintsRequired[i]}`
    )
  }

  return lines.join('\n')
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename for the export
 */
export function generateFilename(projectName: string): string {
  const date = new Date().toISOString().split('T')[0]
  const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  return `forecast-${safeName}-${date}.csv`
}
