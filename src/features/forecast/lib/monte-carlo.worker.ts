import { runQuadrupleForecast, runQuadrupleForecastWithMilestones } from './monte-carlo'
import type { ForecastConfig } from '@/shared/types'

export interface WorkerInput {
  config: ForecastConfig & { sprintCadenceWeeks: number }
  historicalVelocities?: number[]
  productivityFactors?: number[]
  milestoneThresholds?: number[] // Cumulative backlog thresholds for milestone mode
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { config, historicalVelocities, productivityFactors, milestoneThresholds } = e.data

  if (milestoneThresholds && milestoneThresholds.length > 0) {
    const result = runQuadrupleForecastWithMilestones(
      config, milestoneThresholds, historicalVelocities, productivityFactors
    )
    self.postMessage(result)
  } else {
    const result = runQuadrupleForecast(config, historicalVelocities, productivityFactors)
    self.postMessage(result)
  }
}
