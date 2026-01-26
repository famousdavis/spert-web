'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useProjectStore,
  selectViewingProject,
} from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { calculateVelocityStats } from '../lib/statistics'
import { runQuadrupleForecast, calculateCustomPercentile, type PercentileResults } from '../lib/monte-carlo'
import { ForecastForm } from './ForecastForm'
import { ForecastResults } from './ForecastResults'
import { DistributionChart } from './DistributionChart'
import { PercentileSelector } from './PercentileSelector'
import { today, calculateSprintStartDate } from '@/shared/lib/dates'
import { TRIAL_COUNT, MIN_SPRINTS_FOR_BOOTSTRAP } from '../constants'
import { generateForecastCsv, downloadCsv, generateFilename } from '../lib/export-csv'
import type { ForecastResult } from '@/shared/types'

interface QuadResults {
  truncatedNormal: PercentileResults
  lognormal: PercentileResults
  gamma: PercentileResults
  bootstrap: PercentileResults | null
}

interface QuadSimulationData {
  truncatedNormal: number[]
  lognormal: number[]
  gamma: number[]
  bootstrap: number[] | null
}

export function ForecastTab() {
  const isClient = useIsClient()
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore(selectViewingProject)
  const allSprints = useProjectStore((state) => state.sprints)
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  // Track previous project to clear results when project changes
  const prevProjectIdRef = useRef<string | undefined>(selectedProject?.id)

  // Get all sprints for the selected project
  const projectSprints = useMemo(
    () => selectedProject
      ? allSprints.filter((s) => s.projectId === selectedProject.id)
      : [],
    [allSprints, selectedProject]
  )

  const includedSprints = useMemo(
    () => projectSprints.filter((s) => s.includedInForecast),
    [projectSprints]
  )

  const calculatedStats = useMemo(
    () => calculateVelocityStats(includedSprints),
    [includedSprints]
  )

  // Calculate the forecast start date (next sprint start date after the latest sprint)
  const forecastStartDate = useMemo(() => {
    if (!selectedProject?.firstSprintStartDate) return today()
    if (projectSprints.length === 0) return today()

    // Find the highest sprint number
    const highestSprintNumber = Math.max(...projectSprints.map((s) => s.sprintNumber))
    // Next sprint would be highestSprintNumber + 1
    return calculateSprintStartDate(
      selectedProject.firstSprintStartDate,
      highestSprintNumber + 1,
      selectedProject.sprintCadenceWeeks
    )
  }, [selectedProject, projectSprints])

  // Check if we have enough sprints for bootstrap
  const canUseBootstrap = includedSprints.length >= MIN_SPRINTS_FOR_BOOTSTRAP

  // Get historical velocities for bootstrap
  const historicalVelocities = useMemo(
    () => includedSprints.map((s) => s.doneValue),
    [includedSprints]
  )

  // Clear results when project changes (from either this tab or Sprint History tab)
  useEffect(() => {
    if (prevProjectIdRef.current !== selectedProject?.id) {
      setResults(null)
      setSimulationData(null)
      setCustomResults({ truncatedNormal: null, lognormal: null, gamma: null, bootstrap: null })
      prevProjectIdRef.current = selectedProject?.id
    }
  }, [selectedProject?.id])

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value
    setViewingProjectId(newProjectId)
  }

  // Form state
  const [remainingBacklog, setRemainingBacklog] = useState('')
  const [velocityMean, setVelocityMean] = useState('')
  const [velocityStdDev, setVelocityStdDev] = useState('')

  // Results state - now holds truncated normal, lognormal, gamma, and bootstrap results
  const [results, setResults] = useState<QuadResults | null>(null)
  const [simulationData, setSimulationData] = useState<QuadSimulationData | null>(null)
  const [customPercentile, setCustomPercentile] = useState(85)
  const [customResults, setCustomResults] = useState<{
    truncatedNormal: ForecastResult | null
    lognormal: ForecastResult | null
    gamma: ForecastResult | null
    bootstrap: ForecastResult | null
  }>({ truncatedNormal: null, lognormal: null, gamma: null, bootstrap: null })

  // Use calculated stats or overrides
  const effectiveMean = velocityMean ? Number(velocityMean) : calculatedStats.mean
  const effectiveStdDev = velocityStdDev ? Number(velocityStdDev) : calculatedStats.standardDeviation

  const handleRunForecast = () => {
    if (!selectedProject || !remainingBacklog) return

    const config = {
      remainingBacklog: Number(remainingBacklog),
      velocityMean: effectiveMean,
      velocityStdDev: effectiveStdDev,
      startDate: forecastStartDate,
      trialCount: TRIAL_COUNT,
      sprintCadenceWeeks: selectedProject.sprintCadenceWeeks,
    }

    // Run all simulations (bootstrap only if we have enough sprints)
    const quadResults = runQuadrupleForecast(
      config,
      canUseBootstrap ? historicalVelocities : undefined
    )

    setSimulationData({
      truncatedNormal: quadResults.truncatedNormal.sprintsRequired,
      lognormal: quadResults.lognormal.sprintsRequired,
      gamma: quadResults.gamma.sprintsRequired,
      bootstrap: quadResults.bootstrap?.sprintsRequired ?? null,
    })

    setResults({
      truncatedNormal: quadResults.truncatedNormal.results,
      lognormal: quadResults.lognormal.results,
      gamma: quadResults.gamma.results,
      bootstrap: quadResults.bootstrap?.results ?? null,
    })

    // Calculate custom percentile results for the default value
    const truncatedNormalCustom = calculateCustomPercentile(
      quadResults.truncatedNormal.sprintsRequired,
      customPercentile,
      forecastStartDate,
      selectedProject.sprintCadenceWeeks
    )
    const lognormalCustom = calculateCustomPercentile(
      quadResults.lognormal.sprintsRequired,
      customPercentile,
      forecastStartDate,
      selectedProject.sprintCadenceWeeks
    )
    const gammaCustom = calculateCustomPercentile(
      quadResults.gamma.sprintsRequired,
      customPercentile,
      forecastStartDate,
      selectedProject.sprintCadenceWeeks
    )
    let bootstrapCustom: ForecastResult | null = null
    if (quadResults.bootstrap) {
      bootstrapCustom = calculateCustomPercentile(
        quadResults.bootstrap.sprintsRequired,
        customPercentile,
        forecastStartDate,
        selectedProject.sprintCadenceWeeks
      )
    }
    setCustomResults({
      truncatedNormal: truncatedNormalCustom,
      lognormal: lognormalCustom,
      gamma: gammaCustom,
      bootstrap: bootstrapCustom,
    })
  }

  const handleCustomPercentileChange = (percentile: number) => {
    setCustomPercentile(percentile)
    if (simulationData && selectedProject) {
      const truncatedNormalResult = calculateCustomPercentile(
        simulationData.truncatedNormal,
        percentile,
        forecastStartDate,
        selectedProject.sprintCadenceWeeks
      )
      const lognormalResult = calculateCustomPercentile(
        simulationData.lognormal,
        percentile,
        forecastStartDate,
        selectedProject.sprintCadenceWeeks
      )
      const gammaResult = calculateCustomPercentile(
        simulationData.gamma,
        percentile,
        forecastStartDate,
        selectedProject.sprintCadenceWeeks
      )
      let bootstrapResult: ForecastResult | null = null
      if (simulationData.bootstrap) {
        bootstrapResult = calculateCustomPercentile(
          simulationData.bootstrap,
          percentile,
          forecastStartDate,
          selectedProject.sprintCadenceWeeks
        )
      }
      setCustomResults({
        truncatedNormal: truncatedNormalResult,
        lognormal: lognormalResult,
        gamma: gammaResult,
        bootstrap: bootstrapResult,
      })
    }
  }

  const handleExportCsv = () => {
    if (!selectedProject || !results || !simulationData) return

    const csvContent = generateForecastCsv({
      config: {
        projectName: selectedProject.name,
        remainingBacklog: Number(remainingBacklog),
        velocityMean: effectiveMean,
        velocityStdDev: effectiveStdDev,
        startDate: forecastStartDate,
        sprintCadenceWeeks: selectedProject.sprintCadenceWeeks,
        trialCount: TRIAL_COUNT,
      },
      truncatedNormalResults: results.truncatedNormal,
      lognormalResults: results.lognormal,
      gammaResults: results.gamma,
      bootstrapResults: results.bootstrap,
      truncatedNormalSprintsRequired: simulationData.truncatedNormal,
      lognormalSprintsRequired: simulationData.lognormal,
      gammaSprintsRequired: simulationData.gamma,
      bootstrapSprintsRequired: simulationData.bootstrap,
    })

    downloadCsv(csvContent, generateFilename(selectedProject.name))
  }

  if (!isClient) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">
          No projects yet. Create a project first to run forecasts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 style={{ fontSize: '1.25rem', color: '#666', display: 'flex', alignItems: 'baseline' }}>
        <span>Monte Carlo simulation for: </span>
        <select
          value={selectedProject?.id || ''}
          onChange={handleProjectChange}
          style={{
            fontSize: '1.25rem',
            color: '#333',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
            padding: 0,
            outline: 'none',
            marginLeft: 0,
          }}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </h2>

      {selectedProject && (
        <ForecastForm
          remainingBacklog={remainingBacklog}
          velocityMean={velocityMean}
          velocityStdDev={velocityStdDev}
          startDate={forecastStartDate}
          calculatedMean={calculatedStats.mean}
          calculatedStdDev={calculatedStats.standardDeviation}
          unitOfMeasure={selectedProject.unitOfMeasure}
          onRemainingBacklogChange={setRemainingBacklog}
          onVelocityMeanChange={setVelocityMean}
          onVelocityStdDevChange={setVelocityStdDev}
          onRunForecast={handleRunForecast}
          canRun={!!remainingBacklog && effectiveMean > 0}
        />
      )}

      {selectedProject && results && simulationData && (
        <>
          <ForecastResults
            truncatedNormalResults={results.truncatedNormal}
            lognormalResults={results.lognormal}
            gammaResults={results.gamma}
            bootstrapResults={results.bootstrap}
            onExport={handleExportCsv}
          />
          <DistributionChart
            truncatedNormal={simulationData.truncatedNormal}
            lognormal={simulationData.lognormal}
            gamma={simulationData.gamma}
            bootstrap={simulationData.bootstrap}
            customPercentile={customPercentile}
            startDate={forecastStartDate}
            sprintCadenceWeeks={selectedProject.sprintCadenceWeeks}
          />
          <PercentileSelector
            percentile={customPercentile}
            truncatedNormalResult={customResults.truncatedNormal}
            lognormalResult={customResults.lognormal}
            gammaResult={customResults.gamma}
            bootstrapResult={customResults.bootstrap}
            onPercentileChange={handleCustomPercentileChange}
          />
        </>
      )}
    </div>
  )
}
