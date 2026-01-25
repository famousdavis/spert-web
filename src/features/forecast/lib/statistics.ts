import { mean, standardDeviation } from '@/shared/lib/math'
import type { Sprint, VelocityStats } from '@/shared/types'

/**
 * Calculate velocity statistics from a list of sprints
 */
export function calculateVelocityStats(sprints: Sprint[]): VelocityStats {
  const includedSprints = sprints.filter((s) => s.includedInForecast)
  const velocities = includedSprints.map((s) => s.doneValue)

  return {
    count: velocities.length,
    mean: mean(velocities),
    standardDeviation: standardDeviation(velocities),
  }
}
