'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
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

/** Per-milestone QuadResults and QuadSimulationData */
export interface MilestoneResults {
  /** milestoneResults[milestoneIdx] = QuadResults for that milestone */
  milestoneResults: QuadResults[]
  /** milestoneSimulationData[milestoneIdx] = QuadSimulationData for that milestone */
  milestoneSimulationData: QuadSimulationData[]
}

export function useForecastState() {
  const isClient = useIsClient()
  const { runSimulation, runMilestoneSimulation, isSimulating } = useSimulationWorker()
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore(selectViewingProject)
  const allSprints = useProjectStore((state) => state.sprints)
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  // Get productivity adjustments for the selected project
  const productivityAdjustments = useMemo(
    () => selectedProject?.productivityAdjustments ?? [],
    [selectedProject?.productivityAdjustments]
  )

  // Get milestones for the selected project
  const milestones = useMemo(
    () => selectedProject?.milestones ?? [],
    [selectedProject?.milestones]
  )

  const hasMilestones = milestones.length > 0

  // Compute cumulative thresholds from milestone order
  const cumulativeThresholds = useMemo(() => {
    let cumulative = 0
    return milestones.map((m) => {
      cumulative += m.backlogSize
      return cumulative
    })
  }, [milestones])

  // Total backlog from milestones (sum of incremental sizes)
  const milestoneTotal = cumulativeThresholds.length > 0
    ? cumulativeThresholds[cumulativeThresholds.length - 1]
    : 0

  // Track previous project to clear results when project changes
  const prevProjectIdRef = useRef<string | undefined>(selectedProject?.id)

  // Refs for copy-to-clipboard functionality
  const forecastInputsResultsRef = useRef<HTMLDivElement>(null)
  const distributionChartRef = useRef<HTMLDivElement>(null)
  const histogramChartRef = useRef<HTMLDivElement>(null)
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
  const [milestoneResultsState, setMilestoneResultsState] = useState<MilestoneResults | null>(null)
  const [customPercentile, setCustomPercentile] = useState(85)
  const [customResults, setCustomResults] = useState<QuadCustomResults>({
    truncatedNormal: null,
    lognormal: null,
    gamma: null,
    bootstrap: null,
  })

  // Milestone chart selector (which milestone to show on CDF/histogram)
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState(0)

  // Chart font sizes (session only, not persisted)
  const [burnUpFontSize, setBurnUpFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)
  const [distributionFontSize, setDistributionFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)
  const [histogramFontSize, setHistogramFontSize] = useState<ChartFontSize>(DEFAULT_CHART_FONT_SIZE)

  // Clear results when project changes
  useEffect(() => {
    if (prevProjectIdRef.current !== selectedProject?.id) {
      setResults(null)
      setSimulationData(null)
      setMilestoneResultsState(null)
      setCustomResults({ truncatedNormal: null, lognormal: null, gamma: null, bootstrap: null })
      setSelectedMilestoneIndex(0)
      prevProjectIdRef.current = selectedProject?.id
    }
  }, [selectedProject?.id])

  // Form state - stored per project so it persists across tab navigation
  const setForecastInput = useProjectStore((state) => state.setForecastInput)
  const forecastInputs = useProjectStore((state) =>
    selectedProject ? state.forecastInputs[selectedProject.id] : undefined
  )
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

    try {
      if (hasMilestones && cumulativeThresholds.length > 0) {
        // Milestone mode: run simulation with checkpoints
        const milestoneResult = await runMilestoneSimulation({
          config,
          historicalVelocities: canUseBootstrap ? historicalVelocities : undefined,
          productivityFactors,
          milestoneThresholds: cumulativeThresholds,
        })

        // Extract per-milestone results and simulation data
        const milestoneCount = cumulativeThresholds.length
        const perMilestoneResults: QuadResults[] = []
        const perMilestoneSimData: QuadSimulationData[] = []

        for (let m = 0; m < milestoneCount; m++) {
          perMilestoneResults.push({
            truncatedNormal: milestoneResult.truncatedNormal.milestoneResults[m].results,
            lognormal: milestoneResult.lognormal.milestoneResults[m].results,
            gamma: milestoneResult.gamma.milestoneResults[m].results,
            bootstrap: milestoneResult.bootstrap?.milestoneResults[m].results ?? null,
          })
          perMilestoneSimData.push({
            truncatedNormal: milestoneResult.truncatedNormal.milestoneResults[m].sprintsRequired,
            lognormal: milestoneResult.lognormal.milestoneResults[m].sprintsRequired,
            gamma: milestoneResult.gamma.milestoneResults[m].sprintsRequired,
            bootstrap: milestoneResult.bootstrap?.milestoneResults[m].sprintsRequired ?? null,
          })
        }

        setMilestoneResultsState({ milestoneResults: perMilestoneResults, milestoneSimulationData: perMilestoneSimData })

        // Set the "total" (last milestone) as the primary results for backward compatibility
        const lastIdx = milestoneCount - 1
        const totalSimData = perMilestoneSimData[lastIdx]
        const totalResults = perMilestoneResults[lastIdx]

        setSimulationData(totalSimData)
        setResults(totalResults)
        setSelectedMilestoneIndex(lastIdx)

        setCustomResults(calculateAllCustomPercentiles(
          totalSimData,
          customPercentile,
          forecastStartDate,
          selectedProject.sprintCadenceWeeks
        ))
      } else {
        // Simple mode: run standard simulation
        const quadResults = await runSimulation({
          config,
          historicalVelocities: canUseBootstrap ? historicalVelocities : undefined,
          productivityFactors,
        })

        setMilestoneResultsState(null)

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
    } catch {
      // Aborted simulation (new run started) — ignore
    }
  }

  const handleCustomPercentileChange = (percentile: number) => {
    setCustomPercentile(percentile)

    // Determine which simulation data to use for custom percentile
    const activeSimData = milestoneResultsState && selectedMilestoneIndex < milestoneResultsState.milestoneSimulationData.length
      ? milestoneResultsState.milestoneSimulationData[selectedMilestoneIndex]
      : simulationData

    if (activeSimData && selectedProject?.sprintCadenceWeeks) {
      setCustomResults(calculateAllCustomPercentiles(
        activeSimData,
        percentile,
        forecastStartDate,
        selectedProject.sprintCadenceWeeks
      ))
    }
  }

  const handleMilestoneIndexChange = (index: number) => {
    setSelectedMilestoneIndex(index)

    if (milestoneResultsState && index < milestoneResultsState.milestoneSimulationData.length) {
      const simData = milestoneResultsState.milestoneSimulationData[index]
      setSimulationData(simData)
      setResults(milestoneResultsState.milestoneResults[index])

      if (selectedProject?.sprintCadenceWeeks) {
        setCustomResults(calculateAllCustomPercentiles(
          simData,
          customPercentile,
          forecastStartDate,
          selectedProject.sprintCadenceWeeks
        ))
      }
    }
  }

  const handleExportCsv = () => {
    if (!selectedProject || !results || !simulationData || !selectedProject.sprintCadenceWeeks) return

    // Build milestone export data if milestones exist
    let milestoneExportData: Parameters<typeof generateForecastCsv>[0]['milestoneData']
    if (hasMilestones && milestoneResultsState) {
      let cumulative = 0
      const msExport = milestones.map((m) => {
        cumulative += m.backlogSize
        return { name: m.name, backlogSize: m.backlogSize, cumulativeBacklog: cumulative }
      })
      milestoneExportData = {
        milestones: msExport,
        distributions: {
          truncatedNormal: milestoneResultsState.milestoneResults.map((r) => r.truncatedNormal),
          lognormal: milestoneResultsState.milestoneResults.map((r) => r.lognormal),
          gamma: milestoneResultsState.milestoneResults.map((r) => r.gamma),
          bootstrap: milestoneResultsState.milestoneResults[0]?.bootstrap
            ? milestoneResultsState.milestoneResults.map((r) => r.bootstrap!)
            : null,
        },
      }
    }

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
        milestones: hasMilestones ? milestones : undefined,
      },
      truncatedNormalResults: results.truncatedNormal,
      lognormalResults: results.lognormal,
      gammaResults: results.gamma,
      bootstrapResults: results.bootstrap,
      truncatedNormalSprintsRequired: simulationData.truncatedNormal,
      lognormalSprintsRequired: simulationData.lognormal,
      gammaSprintsRequired: simulationData.gamma,
      bootstrapSprintsRequired: simulationData.bootstrap,
      milestoneData: milestoneExportData,
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

    // Milestone data
    milestones,
    hasMilestones,
    cumulativeThresholds,
    milestoneTotal,

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
    milestoneResultsState,
    customPercentile,
    customResults,
    selectedMilestoneIndex,

    // Burn-up config
    burnUpConfig,
    handleBurnUpConfigChange,

    // Chart font sizes
    burnUpFontSize,
    setBurnUpFontSize,
    distributionFontSize,
    setDistributionFontSize,
    histogramFontSize,
    setHistogramFontSize,

    // Refs
    forecastInputsResultsRef,
    distributionChartRef,
    histogramChartRef,
    percentileSelectorRef,
    burnUpChartRef,

    // Handlers
    handleRunForecast,
    handleCustomPercentileChange,
    handleMilestoneIndexChange,
    handleExportCsv,
    handleProjectChange,
  }
}
