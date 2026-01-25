'use client'

import { useState, useMemo } from 'react'
import {
  useProjectStore,
  selectActiveProject,
} from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { calculateVelocityStats } from '../lib/statistics'
import { runDualForecast, calculateCustomPercentile, type PercentileResults } from '../lib/monte-carlo'
import { ForecastForm } from './ForecastForm'
import { ForecastResults } from './ForecastResults'
import { PercentileSelector } from './PercentileSelector'
import { today, calculateSprintStartDate } from '@/shared/lib/dates'
import { TRIAL_COUNT } from '../constants'
import { generateForecastCsv, downloadCsv, generateFilename } from '../lib/export-csv'
import type { ForecastResult } from '@/shared/types'

interface DualResults {
  normal: PercentileResults
  lognormal: PercentileResults
}

interface DualSimulationData {
  normal: number[]
  lognormal: number[]
}

export function ForecastTab() {
  const isClient = useIsClient()
  const projects = useProjectStore((state) => state.projects)
  const activeProject = useProjectStore(selectActiveProject)
  const allSprints = useProjectStore((state) => state.sprints)

  // Local state for selected project (defaults to active project)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Determine which project to show
  const selectedProject = useMemo(() => {
    if (selectedProjectId) {
      return projects.find((p) => p.id === selectedProjectId) || activeProject
    }
    return activeProject
  }, [selectedProjectId, projects, activeProject])

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

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value
    setSelectedProjectId(newProjectId)
    // Clear results when switching projects
    setResults(null)
    setSimulationData(null)
    setCustomResults({ normal: null, lognormal: null })
  }

  // Form state
  const [remainingBacklog, setRemainingBacklog] = useState('')
  const [velocityMean, setVelocityMean] = useState('')
  const [velocityStdDev, setVelocityStdDev] = useState('')

  // Results state - now holds both normal and lognormal results
  const [results, setResults] = useState<DualResults | null>(null)
  const [simulationData, setSimulationData] = useState<DualSimulationData | null>(null)
  const [customPercentile, setCustomPercentile] = useState(85)
  const [customResults, setCustomResults] = useState<{
    normal: ForecastResult | null
    lognormal: ForecastResult | null
  }>({ normal: null, lognormal: null })

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

    // Run both simulations
    const dualResults = runDualForecast(config)

    setSimulationData({
      normal: dualResults.normal.sprintsRequired,
      lognormal: dualResults.lognormal.sprintsRequired,
    })

    setResults({
      normal: dualResults.normal.results,
      lognormal: dualResults.lognormal.results,
    })

    // Calculate custom percentile results for the default value
    const normalCustom = calculateCustomPercentile(
      dualResults.normal.sprintsRequired,
      customPercentile,
      forecastStartDate,
      selectedProject.sprintCadenceWeeks
    )
    const lognormalCustom = calculateCustomPercentile(
      dualResults.lognormal.sprintsRequired,
      customPercentile,
      forecastStartDate,
      selectedProject.sprintCadenceWeeks
    )
    setCustomResults({
      normal: normalCustom,
      lognormal: lognormalCustom,
    })
  }

  const handleCustomPercentileChange = (percentile: number) => {
    setCustomPercentile(percentile)
    if (simulationData && selectedProject) {
      const normalResult = calculateCustomPercentile(
        simulationData.normal,
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
      setCustomResults({
        normal: normalResult,
        lognormal: lognormalResult,
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
      normalResults: results.normal,
      lognormalResults: results.lognormal,
      normalSprintsRequired: simulationData.normal,
      lognormalSprintsRequired: simulationData.lognormal,
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

      {selectedProject && results && (
        <>
          <ForecastResults
            normalResults={results.normal}
            lognormalResults={results.lognormal}
            onExport={handleExportCsv}
          />
          <PercentileSelector
            percentile={customPercentile}
            normalResult={customResults.normal}
            lognormalResult={customResults.lognormal}
            onPercentileChange={handleCustomPercentileChange}
          />
        </>
      )}
    </div>
  )
}
