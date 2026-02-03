import { calculateSprintStartDate, calculateSprintFinishDate, formatDateCompact } from '@/shared/lib/dates'

export interface CdfDataPoint {
  sprints: number
  dateLabel: string
  tNormal: number
  lognormal: number
  gamma: number
  bootstrap?: number
}

/**
 * Build CDF points from sorted simulation data.
 * Returns ~100 points for smooth curves without overwhelming the chart.
 */
export function buildCdfPoints(sortedData: number[]): Map<number, number> {
  const n = sortedData.length
  const cdf = new Map<number, number>()

  // Sample at regular percentile intervals for smooth curve
  for (let p = 1; p <= 100; p++) {
    const index = Math.floor((p / 100) * n) - 1
    const sprints = sortedData[Math.max(0, index)]
    cdf.set(sprints, p)
  }

  return cdf
}

/**
 * Calculate cumulative percentage: what % of trials finished in <= sprints
 * Uses binary search for efficiency on sorted data.
 */
export function calculateCumulativePercentage(sortedData: number[], sprints: number): number {
  // Binary search for the last index where value <= sprints
  let low = 0
  let high = sortedData.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (sortedData[mid] <= sprints) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return (low / sortedData.length) * 100
}

/**
 * Merge CDF data from all distributions into unified chart data
 */
export function mergeDistributions(
  tNormal: number[],
  lognormal: number[],
  gamma: number[],
  bootstrap: number[] | null,
  startDate: string,
  sprintCadenceWeeks: number
): CdfDataPoint[] {
  const tNormalCdf = buildCdfPoints(tNormal)
  const lognormalCdf = buildCdfPoints(lognormal)
  const gammaCdf = buildCdfPoints(gamma)
  const bootstrapCdf = bootstrap ? buildCdfPoints(bootstrap) : null

  // Get all unique sprint values
  const allSprints = new Set<number>()
  tNormalCdf.forEach((_, sprints) => allSprints.add(sprints))
  lognormalCdf.forEach((_, sprints) => allSprints.add(sprints))
  gammaCdf.forEach((_, sprints) => allSprints.add(sprints))
  if (bootstrapCdf) {
    bootstrapCdf.forEach((_, sprints) => allSprints.add(sprints))
  }

  const sortedSprints = Array.from(allSprints).sort((a, b) => a - b)

  // For each sprint value, find the cumulative probability
  // by counting how many trials completed in that many sprints or fewer
  return sortedSprints.map((sprints) => {
    // Calculate finish date: startDate is when sprint 1 of remaining work begins
    // sprints = how many more sprints needed, so sprint N starts at calculateSprintStartDate(startDate, N, cadence)
    const sprintStart = calculateSprintStartDate(startDate, sprints, sprintCadenceWeeks)
    const finishDate = calculateSprintFinishDate(sprintStart, sprintCadenceWeeks)
    const point: CdfDataPoint = {
      sprints,
      dateLabel: formatDateCompact(finishDate),
      tNormal: calculateCumulativePercentage(tNormal, sprints),
      lognormal: calculateCumulativePercentage(lognormal, sprints),
      gamma: calculateCumulativePercentage(gamma, sprints),
    }
    if (bootstrap) {
      point.bootstrap = calculateCumulativePercentage(bootstrap, sprints)
    }
    return point
  })
}
