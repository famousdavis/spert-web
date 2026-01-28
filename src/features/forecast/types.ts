// Re-export burn-up types from shared location to avoid circular dependencies
export {
  type DistributionType,
  type ForecastLineConfig,
  type BurnUpConfig,
  DEFAULT_BURN_UP_CONFIG,
  DISTRIBUTION_LABELS,
} from '@/shared/types/burn-up'
