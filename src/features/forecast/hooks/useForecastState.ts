'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import {
  useProjectStore,
  selectViewingProject,
} from '@/shared/state/project-store'
import { useSettingsStore } from '@/shared/state/settings-store'
import { useIsClient, useDebounce } from '@/shared/hooks'
import { useSprintData } from './useSprintData'
import { useForecastInputs } from './useForecastInputs'
import { useChartSettings } from './useChartSettings'
import {
  calculateAllCustomPercentiles,
  type PercentileResults,
  type QuadSimulationData,
  type QuadCustomResults,
} from '../lib/monte-carlo'
import { useSimulationWorker } from './useSimulationWorker'
import { preCalculateSprintFactors } from '../lib/productivity'
import { generateForecastCsv, downloadCsv, generateFilename } from '../lib/export-csv'
import { safeParseNumber } from '@/shared/lib/validation'

interface QuadResults {
  truncatedNormal: PercentileResults
  lognormal: PercentileResults
  gamma: PercentileResults
  bootstrap: PercentileResults | null
}

/** Per-milestone QuadResults and QuadSimulationData */
export interface MilestoneResults {
  milestoneResults: QuadResults[]
  milestoneSimulationData: QuadSimulationData[]
}

export function useForecastState() {
  const isClient = useIsClient()
  const { runSimulation, runMilestoneSimulation, isSimulating } = useSimulationWorker()
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore(selectViewingProject)
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  // Global settings
  const trialCount = useSettingsStore((s) => s.trialCount)
  const autoRecalculate = useSettingsStore((s) => s.autoRecalculate)

  // Composed hooks
  const sprintData = useSprintData()
  const inputs = useForecastInputs(sprintData.calculatedStats)
  const charts = useChartSettings()

  // Productivity adjustments for the selected project
  const productivityAdjustments = useMemo(
    () => selectedProject?.productivityAdjustments ?? [],
    [selectedProject?.productivityAdjustments]
  )

  // Track previous project to clear results on change
  const prevProjectIdRef = useRef<string | undefined>(selectedProject?.id)

  // Track whether a forecast has been run at least once (for auto-recalc guard)
  const hasRunOnceRef = useRef(false)

  // Results state
  const [results, setResults] = useState<QuadResults | null>(null)
  const [simulationData, setSimulationData] = useState<QuadSimulationData | null>(null)
  const [milestoneResultsState, setMilestoneResultsState] = useState<MilestoneResults | null>(null)
  const defaultPercentile = useSettingsStore((s) => s.defaultCustomPercentile)
  const [customPercentile, setCustomPercentile] = useState(defaultPercentile)
  const [customResults, setCustomResults] = useState<QuadCustomResults>({
    truncatedNormal: null, lognormal: null, gamma: null, bootstrap: null,
  })

  // Scope growth modeling (session only)
  const [modelScopeGrowth, setModelScopeGrowth] = useState(false)
  const [scopeGrowthMode, setScopeGrowthMode] = useState<'calculated' | 'custom'>('calculated')
  const [customScopeGrowth, setCustomScopeGrowth] = useState('')

  // Milestone chart selector (which milestone to show on CDF/histogram)
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState(0)

  // Clear results when project changes
  useEffect(() => {
    if (prevProjectIdRef.current !== selectedProject?.id) {
      setResults(null)
      setSimulationData(null)
      setMilestoneResultsState(null)
      setCustomResults({ truncatedNormal: null, lognormal: null, gamma: null, bootstrap: null })
      setSelectedMilestoneIndex(0)
      setScopeGrowthMode('calculated')
      setCustomScopeGrowth('')
      hasRunOnceRef.current = false
      prevProjectIdRef.current = selectedProject?.id
    }
  }, [selectedProject?.id])

  const handleRunForecast = async () => {
    if (!selectedProject || !inputs.remainingBacklog || !selectedProject.sprintCadenceWeeks) return
    if (!selectedProject.firstSprintStartDate) return

    const parsedBacklog = safeParseNumber(inputs.remainingBacklog)
    if (parsedBacklog === null || parsedBacklog <= 0) return
    if (!Number.isFinite(inputs.effectiveMean) || inputs.effectiveMean <= 0) return
    if (!Number.isFinite(inputs.effectiveStdDev) || inputs.effectiveStdDev < 0) return

    const config = {
      remainingBacklog: parsedBacklog,
      velocityMean: inputs.effectiveMean,
      velocityStdDev: inputs.effectiveStdDev,
      startDate: sprintData.forecastStartDate,
      trialCount,
      sprintCadenceWeeks: selectedProject.sprintCadenceWeeks,
    }

    // Pre-calculate productivity factors if enabled adjustments exist
    const enabledAdjustments = productivityAdjustments.filter((a) => a.enabled !== false)
    let productivityFactors: number[] | undefined
    if (enabledAdjustments.length > 0) {
      const { factors } = preCalculateSprintFactors(
        selectedProject.firstSprintStartDate,
        selectedProject.sprintCadenceWeeks,
        sprintData.completedSprintCount + 1,
        enabledAdjustments
      )
      productivityFactors = factors
    }

    // Compute scope growth if enabled
    const scopeGrowthPerSprint = (() => {
      if (!modelScopeGrowth) return undefined
      if (scopeGrowthMode === 'custom') {
        const parsed = parseFloat(customScopeGrowth)
        return isNaN(parsed) ? undefined : parsed
      }
      return sprintData.scopeChangeStats?.averageScopeInjection
    })()

    try {
      if (inputs.hasMilestones && inputs.cumulativeThresholds.length > 0) {
        const milestoneResult = await runMilestoneSimulation({
          config,
          historicalVelocities: sprintData.canUseBootstrap ? sprintData.historicalVelocities : undefined,
          productivityFactors,
          milestoneThresholds: inputs.cumulativeThresholds,
          scopeGrowthPerSprint,
        })

        const milestoneCount = inputs.cumulativeThresholds.length
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

        const lastIdx = milestoneCount - 1
        setSimulationData(perMilestoneSimData[lastIdx])
        setResults(perMilestoneResults[lastIdx])
        setSelectedMilestoneIndex(lastIdx)
        setCustomResults(calculateAllCustomPercentiles(
          perMilestoneSimData[lastIdx], customPercentile,
          sprintData.forecastStartDate, selectedProject.sprintCadenceWeeks
        ))
      } else {
        const quadResults = await runSimulation({
          config,
          historicalVelocities: sprintData.canUseBootstrap ? sprintData.historicalVelocities : undefined,
          productivityFactors,
          scopeGrowthPerSprint,
        })

        setMilestoneResultsState(null)

        const simData: QuadSimulationData = {
          truncatedNormal: quadResults.truncatedNormal.sprintsRequired,
          lognormal: quadResults.lognormal.sprintsRequired,
          gamma: quadResults.gamma.sprintsRequired,
          bootstrap: quadResults.bootstrap?.sprintsRequired ?? null,
        }
        setSimulationData(simData)
        setResults({
          truncatedNormal: quadResults.truncatedNormal.results,
          lognormal: quadResults.lognormal.results,
          gamma: quadResults.gamma.results,
          bootstrap: quadResults.bootstrap?.results ?? null,
        })
        setCustomResults(calculateAllCustomPercentiles(
          simData, customPercentile,
          sprintData.forecastStartDate, selectedProject.sprintCadenceWeeks
        ))
      }
      hasRunOnceRef.current = true
    } catch {
      // Aborted simulation (new run started) — ignore
    }
  }

  // Auto-recalculation: re-run forecast when inputs change (after first manual run)
  const runForecastRef = useRef(handleRunForecast)
  runForecastRef.current = handleRunForecast

  const debouncedBacklog = useDebounce(inputs.remainingBacklog, 400)
  const debouncedMean = useDebounce(inputs.velocityMean, 400)
  const debouncedStdDev = useDebounce(inputs.velocityStdDev, 400)
  const debouncedCustomGrowth = useDebounce(customScopeGrowth, 400)

  useEffect(() => {
    if (!autoRecalculate || !hasRunOnceRef.current) return
    const canRun = !!debouncedBacklog && inputs.effectiveMean > 0
    if (!canRun) return
    runForecastRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoRecalculate,
    debouncedBacklog,
    debouncedMean,
    debouncedStdDev,
    modelScopeGrowth,
    scopeGrowthMode,
    debouncedCustomGrowth,
    productivityAdjustments,
    inputs.cumulativeThresholds,
    trialCount,
  ])

  const handleCustomPercentileChange = (percentile: number) => {
    setCustomPercentile(percentile)

    const activeSimData = milestoneResultsState && selectedMilestoneIndex < milestoneResultsState.milestoneSimulationData.length
      ? milestoneResultsState.milestoneSimulationData[selectedMilestoneIndex]
      : simulationData

    if (activeSimData && selectedProject?.sprintCadenceWeeks) {
      setCustomResults(calculateAllCustomPercentiles(
        activeSimData, percentile,
        sprintData.forecastStartDate, selectedProject.sprintCadenceWeeks
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
          simData, customPercentile,
          sprintData.forecastStartDate, selectedProject.sprintCadenceWeeks
        ))
      }
    }
  }

  const handleExportCsv = () => {
    if (!selectedProject || !results || !simulationData || !selectedProject.sprintCadenceWeeks) return

    let milestoneExportData: Parameters<typeof generateForecastCsv>[0]['milestoneData']
    if (inputs.hasMilestones && milestoneResultsState) {
      let cumulative = 0
      const msExport = inputs.milestones.map((m) => {
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
        remainingBacklog: safeParseNumber(inputs.remainingBacklog) ?? 0,
        velocityMean: inputs.effectiveMean,
        velocityStdDev: inputs.effectiveStdDev,
        startDate: sprintData.forecastStartDate,
        sprintCadenceWeeks: selectedProject.sprintCadenceWeeks,
        trialCount,
        productivityAdjustments: productivityAdjustments.filter((a) => a.enabled !== false),
        milestones: inputs.hasMilestones ? inputs.milestones : undefined,
        scopeGrowthPerSprint: (() => {
          if (!modelScopeGrowth) return undefined
          if (scopeGrowthMode === 'custom') {
            const parsed = parseFloat(customScopeGrowth)
            return isNaN(parsed) ? undefined : parsed
          }
          return sprintData.scopeChangeStats?.averageScopeInjection
        })(),
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
    setViewingProjectId(e.target.value)
  }

  return {
    // Loading / empty states
    isClient,
    projects,
    selectedProject,

    // Sprint data (from useSprintData)
    projectSprints: sprintData.projectSprints,
    completedSprintCount: sprintData.completedSprintCount,
    forecastStartDate: sprintData.forecastStartDate,
    calculatedStats: sprintData.calculatedStats,

    // Milestone data (from useForecastInputs)
    milestones: inputs.milestones,
    hasMilestones: inputs.hasMilestones,
    cumulativeThresholds: inputs.cumulativeThresholds,

    // Form state (from useForecastInputs)
    remainingBacklog: inputs.remainingBacklog,
    velocityMean: inputs.velocityMean,
    velocityStdDev: inputs.velocityStdDev,
    effectiveMean: inputs.effectiveMean,
    setRemainingBacklog: inputs.setRemainingBacklog,
    setVelocityMean: inputs.setVelocityMean,
    setVelocityStdDev: inputs.setVelocityStdDev,

    // Scope growth modeling
    scopeChangeStats: sprintData.scopeChangeStats,
    modelScopeGrowth,
    setModelScopeGrowth,
    scopeGrowthMode,
    setScopeGrowthMode,
    customScopeGrowth,
    setCustomScopeGrowth,

    // Simulation state
    isSimulating,

    // Results
    results,
    simulationData,
    milestoneResultsState,
    customPercentile,
    customResults,
    selectedMilestoneIndex,

    // Chart settings (from useChartSettings)
    ...charts,

    // Handlers
    handleRunForecast,
    handleCustomPercentileChange,
    handleMilestoneIndexChange,
    handleExportCsv,
    handleProjectChange,
  }
}
