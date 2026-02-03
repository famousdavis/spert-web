'use client'

import { useState, useMemo, useRef, useEffect, type RefObject } from 'react'
import { toast } from 'sonner'
import {
  useProjectStore,
  selectViewingProject,
} from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { calculateVelocityStats } from '../lib/statistics'
import {
  calculateAllCustomPercentiles,
  type PercentileResults,
  type QuadSimulationData,
  type QuadCustomResults,
} from '../lib/monte-carlo'
import { useSimulationWorker } from './useSimulationWorker'
import { preCalculateSprintFactors } from '../lib/productivity'
import { today, calculateSprintStartDate } from '@/shared/lib/dates'
import { TRIAL_COUNT, MIN_SPRINTS_FOR_BOOTSTRAP } from '../constants'
import { generateForecastCsv, downloadCsv, generateFilename } from '../lib/export-csv'
import { safeParseNumber } from '@/shared/lib/validation'
import { DEFAULT_CHART_FONT_SIZE, type ChartFontSize } from '@/shared/types/burn-up'
import { DEFAULT_BURN_UP_CONFIG, type BurnUpConfig } from '../types'

interface QuadResults {
  truncatedNormal: PercentileResults
  lognormal: PercentileResults
  gamma: PercentileResults
  bootstrap: PercentileResults | null
}

export function useForecastState() {
  const isClient = useIsClient()
  const { runSimulation, isSimulating } = useSimulationWorker()
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore(selectViewingProject)
  const allSprints = useProjectStore((state) => state.sprints)
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  // Get productivity adjustments for the selected project
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

  // Results state
  const [results, setResults] = useState<QuadResults | null>(null)
  const [simulationData, setSimulationData] = useState<QuadSimulationData | null>(null)
  const [customPercentile, setCustomPercentile] = useState(85)
  const [customResults, setCustomResults] = useState<QuadCustomResults>({
    truncatedNormal: null,
    lognormal: null,
    gamma: null,
    bootstrap: null,
  })

  // Chart font sizes (session only, not persisted)
  const [burnUpFontSize, setBurnUpFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)
  const [distributionFontSize, setDistributionFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)

  // Clear results when project changes
  useEffect(() => {
    if (prevProjectIdRef.current !== selectedProject?.id) {
      setResults(null)
      setSimulationData(null)
      setCustomResults({ truncatedNormal: null, lognormal: null, gamma: null, bootstrap: null })
      prevProjectIdRef.current = selectedProject?.id
    }
  }, [selectedProject?.id])

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

  // Use calculated stats or overrides
  const effectiveMean = velocityMean ? Number(velocityMean) : calculatedStats.mean
  const effectiveStdDev = velocityStdDev ? Number(velocityStdDev) : calculatedStats.standardDeviation

  const handleRunForecast = async () => {
    if (!selectedProject || !remainingBacklog || !selectedProject.sprintCadenceWeeks) return
    if (!selectedProject.firstSprintStartDate) return

    const parsedBacklog = safeParseNumber(remainingBacklog)
    if (parsedBacklog === null || parsedBacklog <= 0) return
    if (!Number.isFinite(effectiveMean) || effectiveMean <= 0) return
    if (!Number.isFinite(effectiveStdDev) || effectiveStdDev < 0) return

    const config = {
      remainingBacklog: parsedBacklog,
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
        completedSprintCount + 1,
        enabledAdjustments
      )
      productivityFactors = factors
    }

    // Run all simulations off the main thread via Web Worker
    try {
      const quadResults = await runSimulation({
        config,
        historicalVelocities: canUseBootstrap ? historicalVelocities : undefined,
        productivityFactors,
      })

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
    } catch {
      // Aborted simulation (new run started) — ignore
    }
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
        remainingBacklog: safeParseNumber(remainingBacklog) ?? 0,
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
    toast.success('Forecast exported to CSV')
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value
    setViewingProjectId(newProjectId)
  }

  return {
    // Loading / empty states
    isClient,
    projects,
    selectedProject,

    // Sprint data
    projectSprints,
    completedSprintCount,
    forecastStartDate,
    calculatedStats,

    // Form state
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    effectiveMean,
    setRemainingBacklog,
    setVelocityMean,
    setVelocityStdDev,

    // Simulation state
    isSimulating,

    // Results
    results,
    simulationData,
    customPercentile,
    customResults,

    // Burn-up config
    burnUpConfig,
    handleBurnUpConfigChange,

    // Chart font sizes
    burnUpFontSize,
    setBurnUpFontSize,
    distributionFontSize,
    setDistributionFontSize,

    // Refs
    forecastInputsResultsRef,
    distributionChartRef,
    percentileSelectorRef,
    burnUpChartRef,

    // Handlers
    handleRunForecast,
    handleCustomPercentileChange,
    handleExportCsv,
    handleProjectChange,
  }
}
