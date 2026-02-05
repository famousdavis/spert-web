'use client'

import { useMemo } from 'react'
import { useProjectStore, selectViewingProject } from '@/shared/state/project-store'
import type { VelocityStats } from '@/shared/types'

/**
 * Form state for the forecast: backlog, velocity overrides, and milestone-derived values.
 * Persisted per project via the project store.
 */
export function useForecastInputs(calculatedStats: VelocityStats) {
  const selectedProject = useProjectStore(selectViewingProject)
  const setForecastInput = useProjectStore((state) => state.setForecastInput)
  const forecastInputs = useProjectStore((state) =>
    selectedProject ? state.forecastInputs[selectedProject.id] : undefined
  )

  // Milestones
  const milestones = useMemo(
    () => selectedProject?.milestones ?? [],
    [selectedProject?.milestones]
  )

  const hasMilestones = milestones.length > 0

  const cumulativeThresholds = useMemo(() => {
    let cumulative = 0
    return milestones.map((m) => {
      cumulative += m.backlogSize
      return cumulative
    })
  }, [milestones])

  const milestoneTotal = cumulativeThresholds.length > 0
    ? cumulativeThresholds[cumulativeThresholds.length - 1]
    : 0

  // Form values
  const remainingBacklog = hasMilestones
    ? String(milestoneTotal)
    : (forecastInputs?.remainingBacklog ?? '')
  const velocityMean = forecastInputs?.velocityMean ?? ''
  const velocityStdDev = forecastInputs?.velocityStdDev ?? ''

  const setRemainingBacklog = (value: string) => {
    if (selectedProject && !hasMilestones) setForecastInput(selectedProject.id, 'remainingBacklog', value)
  }
  const setVelocityMean = (value: string) => {
    if (selectedProject) setForecastInput(selectedProject.id, 'velocityMean', value)
  }
  const setVelocityStdDev = (value: string) => {
    if (selectedProject) setForecastInput(selectedProject.id, 'velocityStdDev', value)
  }

  // Effective values (user overrides or calculated)
  const effectiveMean = velocityMean ? Number(velocityMean) : calculatedStats.mean
  const effectiveStdDev = velocityStdDev ? Number(velocityStdDev) : calculatedStats.standardDeviation

  return {
    milestones,
    hasMilestones,
    cumulativeThresholds,
    milestoneTotal,
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    effectiveMean,
    effectiveStdDev,
    setRemainingBacklog,
    setVelocityMean,
    setVelocityStdDev,
  }
}
