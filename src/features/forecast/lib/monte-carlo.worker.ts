import { runQuadrupleForecast, runQuadrupleForecastWithMilestones } from './monte-carlo'
import type { SimulationContext } from './monte-carlo'

export interface WorkerInput extends SimulationContext {
  milestoneThresholds?: number[] // Cumulative backlog thresholds for milestone mode
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { config, historicalVelocities, productivityFactors, milestoneThresholds, scopeGrowthPerSprint } = e.data

  if (milestoneThresholds && milestoneThresholds.length > 0) {
    const result = runQuadrupleForecastWithMilestones(
      config, milestoneThresholds, historicalVelocities, productivityFactors, scopeGrowthPerSprint
    )
    self.postMessage(result)
  } else {
    const result = runQuadrupleForecast(config, historicalVelocities, productivityFactors, scopeGrowthPerSprint)
    self.postMessage(result)
  }
}
