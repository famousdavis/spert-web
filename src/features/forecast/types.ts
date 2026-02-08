// Re-export burn-up types from shared location to avoid circular dependencies
export {
  type DistributionType,
  type ForecastLineConfig,
  type BurnUpConfig,
  DEFAULT_BURN_UP_CONFIG,
  DISTRIBUTION_LABELS,
  type ChartFontSize,
  type ChartFontSizes,
  CHART_FONT_SIZES,
  CHART_FONT_SIZE_LABELS,
  DEFAULT_CHART_FONT_SIZE,
} from '@/shared/types/burn-up'

import type { DistributionType } from '@/shared/types/burn-up'
import type { ForecastMode } from '@/shared/types'

/**
 * Returns the list of distributions to display for a given forecast mode.
 *
 * Subjective: T-Normal, Lognorm, Gamma, Triangular, Uniform (5)
 * History:    T-Normal, Lognorm, Gamma, + Bootstrap if available (3-4)
 */
export function getVisibleDistributions(
  forecastMode: ForecastMode,
  hasBootstrap: boolean
): DistributionType[] {
  if (forecastMode === 'subjective') {
    return ['truncatedNormal', 'lognormal', 'gamma', 'triangular', 'uniform']
  }
  const dists: DistributionType[] = ['truncatedNormal', 'lognormal', 'gamma']
  if (hasBootstrap) dists.push('bootstrap')
  return dists
}
