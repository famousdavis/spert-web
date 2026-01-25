// General math utilities

/**
 * Calculate the arithmetic mean of an array of numbers
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calculate the sample standard deviation of an array of numbers
 * Uses Bessel's correction (n-1) for sample data
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2))
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

/**
 * Generate a random number from a normal distribution
 * using the Box-Muller transform
 */
export function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}

/**
 * Calculate the percentile value from a sorted array
 * @param sortedValues - Array of numbers, must be sorted ascending
 * @param percentile - Percentile to calculate (0-100)
 */
export function percentileFromSorted(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0
  const index = (percentile / 100) * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedValues[lower]
  const weight = index - lower
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

/**
 * Convert normal distribution parameters (mean, stdDev) to lognormal parameters (μ_ln, σ_ln)
 * so that the resulting lognormal distribution has the same mean and standard deviation.
 *
 * Given observed mean (μ) and standard deviation (σ):
 * σ_ln² = ln(1 + (σ/μ)²)
 * μ_ln = ln(μ) - σ_ln²/2
 */
export function normalToLognormalParams(
  mean: number,
  stdDev: number
): { muLn: number; sigmaLn: number } {
  if (mean <= 0) {
    // Lognormal requires positive mean; fall back to small positive value
    return { muLn: Math.log(0.1), sigmaLn: 0.1 }
  }

  const coefficientOfVariation = stdDev / mean
  const sigmaLnSquared = Math.log(1 + coefficientOfVariation * coefficientOfVariation)
  const sigmaLn = Math.sqrt(sigmaLnSquared)
  const muLn = Math.log(mean) - sigmaLnSquared / 2

  return { muLn, sigmaLn }
}

/**
 * Generate a random number from a lognormal distribution
 * using the Box-Muller transform for the underlying normal.
 *
 * @param muLn - Mean of the underlying normal distribution (not the lognormal mean)
 * @param sigmaLn - Std dev of the underlying normal distribution (not the lognormal stdDev)
 */
export function randomLognormal(muLn: number, sigmaLn: number): number {
  // Generate standard normal using Box-Muller
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)

  // Transform to lognormal
  return Math.exp(muLn + sigmaLn * z0)
}

/**
 * Generate a random number from a lognormal distribution
 * given the desired mean and standard deviation of the lognormal distribution.
 *
 * This is a convenience function that converts normal params to lognormal params first.
 */
export function randomLognormalFromMeanStdDev(mean: number, stdDev: number): number {
  const { muLn, sigmaLn } = normalToLognormalParams(mean, stdDev)
  return randomLognormal(muLn, sigmaLn)
}
