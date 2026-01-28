'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useProjectStore,
  selectViewingProject,
} from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { calculateVelocityStats } from '../lib/statistics'
import {
  runQuadrupleForecast,
  calculateAllCustomPercentiles,
  type PercentileResults,
  type QuadSimulationData,
  type QuadCustomResults,
} from '../lib/monte-carlo'
import { preCalculateSprintFactors } from '../lib/productivity'
import { ForecastForm } from './ForecastForm'
import { ForecastResults } from './ForecastResults'
import { DistributionChart } from './DistributionChart'
import { PercentileSelector } from './PercentileSelector'
import { ProductivityAdjustments } from './ProductivityAdjustments'
import { BurnUpChart } from './BurnUpChart'
import { today, calculateSprintStartDate } from '@/shared/lib/dates'
import { TRIAL_COUNT, MIN_SPRINTS_FOR_BOOTSTRAP } from '../constants'
import { generateForecastCsv, downloadCsv, generateFilename } from '../lib/export-csv'
import { CopyImageButton } from '@/shared/components/CopyImageButton'
import { DEFAULT_CHART_FONT_SIZE, type ChartFontSize } from '@/shared/types/burn-up'
import { DEFAULT_BURN_UP_CONFIG, type BurnUpConfig } from '../types'

interface QuadResults {
  truncatedNormal: PercentileResults
  lognormal: PercentileResults
  gamma: PercentileResults
  bootstrap: PercentileResults | null
}

export function ForecastTab() {
  const isClient = useIsClient()
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore(selectViewingProject)
  const allSprints = useProjectStore((state) => state.sprints)
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  // Get productivity adjustments for the selected project (derived from project to avoid selector re-creation)
  const productivityAdjustments = useMemo(
    () => selectedProject?.productivityAdjustments ?? [],
    [selectedProject?.productivityAdjustments]
  )

  // Track previous project to clear results when project changes
  const prevProjectIdRef = useRef<string | undefined>(selectedProject?.id)

  // Refs for copy-to-clipboard functionality
  const forecastInputsResultsRef = useRef<HTMLDivElement>(null)
  const distributionChartRef = useRef<HTMLDivElement>(null)
  const percentileSelectorRef = useRef<HTMLDivElement>(null)
  const burnUpChartRef = useRef<HTMLDivElement>(null)

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

  // Calculate the number of completed sprints (highest sprint number in history)
  const completedSprintCount = useMemo(() => {
    if (projectSprints.length === 0) return 0
    return Math.max(...projectSprints.map((s) => s.sprintNumber))
  }, [projectSprints])

  // Calculate the forecast start date (next sprint start date after the latest sprint)
  const forecastStartDate = useMemo(() => {
    if (!selectedProject?.firstSprintStartDate || !selectedProject?.sprintCadenceWeeks) return today()
    if (projectSprints.length === 0) return today()

    // Next sprint would be completedSprintCount + 1
    return calculateSprintStartDate(
      selectedProject.firstSprintStartDate,
      completedSprintCount + 1,
      selectedProject.sprintCadenceWeeks
    )
  }, [selectedProject, projectSprints, completedSprintCount])

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

  // Form state - stored per project so it persists across tab navigation
  const setForecastInput = useProjectStore((state) => state.setForecastInput)
  const forecastInputs = useProjectStore((state) =>
    selectedProject ? state.forecastInputs[selectedProject.id] : undefined
  )
  const remainingBacklog = forecastInputs?.remainingBacklog ?? ''
  const velocityMean = forecastInputs?.velocityMean ?? ''
  const velocityStdDev = forecastInputs?.velocityStdDev ?? ''

  const setRemainingBacklog = (value: string) => {
    if (selectedProject) setForecastInput(selectedProject.id, 'remainingBacklog', value)
  }
  const setVelocityMean = (value: string) => {
    if (selectedProject) setForecastInput(selectedProject.id, 'velocityMean', value)
  }
  const setVelocityStdDev = (value: string) => {
    if (selectedProject) setForecastInput(selectedProject.id, 'velocityStdDev', value)
  }

  // Burn-up config state (per project, session only)
  const setBurnUpConfigStore = useProjectStore((state) => state.setBurnUpConfig)
  const burnUpConfigFromStore = useProjectStore((state) =>
    selectedProject ? state.burnUpConfigs[selectedProject.id] : undefined
  )
  const burnUpConfig = burnUpConfigFromStore ?? DEFAULT_BURN_UP_CONFIG

  const handleBurnUpConfigChange = (config: BurnUpConfig) => {
    if (selectedProject) {
      setBurnUpConfigStore(selectedProject.id, config)
    }
  }

  // Results state - now holds truncated normal, lognormal, gamma, and bootstrap results
  const [results, setResults] = useState<QuadResults | null>(null)
  const [simulationData, setSimulationData] = useState<QuadSimulationData | null>(null)
  const [customPercentile, setCustomPercentile] = useState(85)
  const [customResults, setCustomResults] = useState<QuadCustomResults>({
    truncatedNormal: null,
    lognormal: null,
    gamma: null,
    bootstrap: null,
  })

  // Chart font sizes (session only, not persisted) - one per chart
  const [burnUpFontSize, setBurnUpFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)
  const [distributionFontSize, setDistributionFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)

  // Use calculated stats or overrides
  const effectiveMean = velocityMean ? Number(velocityMean) : calculatedStats.mean
  const effectiveStdDev = velocityStdDev ? Number(velocityStdDev) : calculatedStats.standardDeviation

  const handleRunForecast = () => {
    if (!selectedProject || !remainingBacklog || !selectedProject.sprintCadenceWeeks) return
    if (!selectedProject.firstSprintStartDate) return

    const config = {
      remainingBacklog: Number(remainingBacklog),
      velocityMean: effectiveMean,
      velocityStdDev: effectiveStdDev,
      startDate: forecastStartDate,
      trialCount: TRIAL_COUNT,
      sprintCadenceWeeks: selectedProject.sprintCadenceWeeks,
    }

    // Pre-calculate productivity factors if enabled adjustments exist
    const enabledAdjustments = productivityAdjustments.filter((a) => a.enabled !== false)
    let productivityFactors: number[] | undefined
    if (enabledAdjustments.length > 0) {
      const { factors } = preCalculateSprintFactors(
        selectedProject.firstSprintStartDate,
        selectedProject.sprintCadenceWeeks,
        completedSprintCount + 1, // Starting sprint number for forecast
        enabledAdjustments
      )
      productivityFactors = factors
    }

    // Run all simulations (bootstrap only if we have enough sprints)
    const quadResults = runQuadrupleForecast(
      config,
      canUseBootstrap ? historicalVelocities : undefined,
      productivityFactors
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
    const simData: QuadSimulationData = {
      truncatedNormal: quadResults.truncatedNormal.sprintsRequired,
      lognormal: quadResults.lognormal.sprintsRequired,
      gamma: quadResults.gamma.sprintsRequired,
      bootstrap: quadResults.bootstrap?.sprintsRequired ?? null,
    }
    setCustomResults(calculateAllCustomPercentiles(
      simData,
      customPercentile,
      forecastStartDate,
      selectedProject.sprintCadenceWeeks
    ))
  }

  const handleCustomPercentileChange = (percentile: number) => {
    setCustomPercentile(percentile)
    if (simulationData && selectedProject?.sprintCadenceWeeks) {
      setCustomResults(calculateAllCustomPercentiles(
        simulationData,
        percentile,
        forecastStartDate,
        selectedProject.sprintCadenceWeeks
      ))
    }
  }

  const handleExportCsv = () => {
    if (!selectedProject || !results || !simulationData || !selectedProject.sprintCadenceWeeks) return

    const csvContent = generateForecastCsv({
      config: {
        projectName: selectedProject.name,
        remainingBacklog: Number(remainingBacklog),
        velocityMean: effectiveMean,
        velocityStdDev: effectiveStdDev,
        startDate: forecastStartDate,
        sprintCadenceWeeks: selectedProject.sprintCadenceWeeks,
        trialCount: TRIAL_COUNT,
        productivityAdjustments: productivityAdjustments.filter((a) => a.enabled !== false),
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

      {/* Productivity Adjustments - show when project is selected */}
      {selectedProject && (
        <ProductivityAdjustments projectId={selectedProject.id} />
      )}

      {selectedProject && (
        <div style={{ position: 'relative' }}>
          <div ref={forecastInputsResultsRef} style={{ background: 'white' }}>
            <ForecastForm
              remainingBacklog={remainingBacklog}
              velocityMean={velocityMean}
              velocityStdDev={velocityStdDev}
              startDate={forecastStartDate}
              sprintCadenceWeeks={selectedProject.sprintCadenceWeeks}
              calculatedMean={calculatedStats.mean}
              calculatedStdDev={calculatedStats.standardDeviation}
              unitOfMeasure={selectedProject.unitOfMeasure}
              onRemainingBacklogChange={setRemainingBacklog}
              onVelocityMeanChange={setVelocityMean}
              onVelocityStdDevChange={setVelocityStdDev}
              onRunForecast={handleRunForecast}
              canRun={!!remainingBacklog && effectiveMean > 0}
            />
            {selectedProject?.sprintCadenceWeeks && results && simulationData && (
              <div style={{ marginTop: '1.5rem' }}>
                <ForecastResults
                  truncatedNormalResults={results.truncatedNormal}
                  lognormalResults={results.lognormal}
                  gammaResults={results.gamma}
                  bootstrapResults={results.bootstrap}
                  completedSprintCount={completedSprintCount}
                  onExport={handleExportCsv}
                />
              </div>
            )}
          </div>
          {selectedProject?.sprintCadenceWeeks && results && simulationData && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
              <CopyImageButton
                targetRef={forecastInputsResultsRef}
                title="Copy inputs and results as image"
              />
            </div>
          )}
        </div>
      )}

      {selectedProject?.sprintCadenceWeeks && results && simulationData && (
        <>
          {/* Custom Percentile - moved above charts */}
          <PercentileSelector
            percentile={customPercentile}
            truncatedNormalResult={customResults.truncatedNormal}
            lognormalResult={customResults.lognormal}
            gammaResult={customResults.gamma}
            bootstrapResult={customResults.bootstrap}
            completedSprintCount={completedSprintCount}
            onPercentileChange={handleCustomPercentileChange}
            selectorRef={percentileSelectorRef}
          />

          {/* Burn-Up Chart - new in v0.7.0 */}
          <BurnUpChart
            sprints={projectSprints}
            forecastBacklog={Number(remainingBacklog) || 0}
            simulationData={simulationData}
            sprintCadenceWeeks={selectedProject.sprintCadenceWeeks}
            firstSprintStartDate={selectedProject.firstSprintStartDate!}
            completedSprintCount={completedSprintCount}
            config={burnUpConfig}
            onConfigChange={handleBurnUpConfigChange}
            chartRef={burnUpChartRef}
            fontSize={burnUpFontSize}
            onFontSizeChange={setBurnUpFontSize}
          />

          {/* Cumulative Probability Distribution */}
          <DistributionChart
            truncatedNormal={simulationData.truncatedNormal}
            lognormal={simulationData.lognormal}
            gamma={simulationData.gamma}
            bootstrap={simulationData.bootstrap}
            customPercentile={customPercentile}
            startDate={forecastStartDate}
            sprintCadenceWeeks={selectedProject.sprintCadenceWeeks}
            completedSprintCount={completedSprintCount}
            chartRef={distributionChartRef}
            fontSize={distributionFontSize}
            onFontSizeChange={setDistributionFontSize}
          />
        </>
      )}
    </div>
  )
}
