import { runQuadrupleForecast } from './monte-carlo'
import type { ForecastConfig } from '@/shared/types'

export interface WorkerInput {
  config: ForecastConfig & { sprintCadenceWeeks: number }
  historicalVelocities?: number[]
  productivityFactors?: number[]
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { config, historicalVelocities, productivityFactors } = e.data
  const result = runQuadrupleForecast(config, historicalVelocities, productivityFactors)
  self.postMessage(result)
}
