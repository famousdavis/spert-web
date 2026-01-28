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
} from '@/shared/types/burn-up'
