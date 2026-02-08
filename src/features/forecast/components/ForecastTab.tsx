'use client'

import { cn } from '@/lib/utils'
import { useForecastState } from '../hooks/useForecastState'
import { ForecastForm } from './ForecastForm'
import { ForecastSummary } from './ForecastSummary'
import { ForecastResults } from './ForecastResults'
import { DistributionChart } from './DistributionChart'
import { HistogramChart } from './HistogramChart'
import { PercentileSelector } from './PercentileSelector'
import { ProductivityAdjustments } from './ProductivityAdjustments'
import { Milestones } from './Milestones'
import { BurnUpChart } from './BurnUpChart'
import { CopyImageButton } from '@/shared/components/CopyImageButton'

export function ForecastTab() {
  const {
    isClient,
    projects,
    selectedProject,
    projectSprints,
    completedSprintCount,
    forecastStartDate,
    calculatedStats,
    milestones,
    hasMilestones,
    cumulativeThresholds,
    forecastMode,
    setForecastMode,
    includedSprintCount,
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    effectiveMean,
    effectiveStdDev,
    setRemainingBacklog,
    setVelocityMean,
    setVelocityStdDev,
    velocityEstimate,
    selectedCV,
    setVelocityEstimate,
    setSelectedCV,
    volatilityMultiplier,
    setVolatilityMultiplier,
    scopeChangeStats,
    modelScopeGrowth,
    setModelScopeGrowth,
    scopeGrowthMode,
    setScopeGrowthMode,
    customScopeGrowth,
    setCustomScopeGrowth,
    scopeGrowthPerSprint,
    isSimulating,
    results,
    simulationData,
    milestoneResultsState,
    customPercentile,
    customResults,
    selectedMilestoneIndex,
    burnUpConfig,
    handleBurnUpConfigChange,
    burnUpFontSize,
    setBurnUpFontSize,
    distributionFontSize,
    setDistributionFontSize,
    histogramFontSize,
    setHistogramFontSize,
    forecastInputsResultsRef,
    distributionChartRef,
    histogramChartRef,
    percentileSelectorRef,
    burnUpChartRef,
    handleRunForecast,
    handleCustomPercentileChange,
    handleMilestoneIndexChange,
    handleExportCsv,
    handleProjectChange,
  } = useForecastState()

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

  const hasResults = selectedProject?.sprintCadenceWeeks && results && simulationData

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-spert-text-muted flex items-baseline">
        <span>Monte Carlo simulation for: </span>
        <select
          value={selectedProject?.id || ''}
          onChange={handleProjectChange}
          className="text-xl text-spert-text dark:text-gray-100 border-none bg-transparent cursor-pointer font-inherit font-semibold p-0 outline-none ml-0"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </h2>

      {/* Milestones - show when project is selected */}
      {selectedProject && (
        <Milestones
          projectId={selectedProject.id}
          unitOfMeasure={selectedProject.unitOfMeasure}
        />
      )}

      {selectedProject && (
        <div className="relative">
          <div ref={forecastInputsResultsRef} className="bg-white dark:bg-gray-900">
            <ForecastForm
              remainingBacklog={remainingBacklog}
              velocityMean={velocityMean}
              velocityStdDev={velocityStdDev}
              startDate={forecastStartDate}
              sprintCadenceWeeks={selectedProject.sprintCadenceWeeks}
              calculatedMean={calculatedStats.mean}
              calculatedStdDev={calculatedStats.standardDeviation}
              effectiveMean={effectiveMean}
              effectiveStdDev={effectiveStdDev}
              unitOfMeasure={selectedProject.unitOfMeasure}
              backlogReadOnly={hasMilestones}
              sprints={projectSprints}
              scopeChangeStats={scopeChangeStats}
              modelScopeGrowth={modelScopeGrowth}
              scopeGrowthMode={scopeGrowthMode}
              customScopeGrowth={customScopeGrowth}
              forecastMode={forecastMode}
              includedSprintCount={includedSprintCount}
              velocityEstimate={velocityEstimate}
              selectedCV={selectedCV}
              onForecastModeChange={setForecastMode}
              onVelocityEstimateChange={setVelocityEstimate}
              onCVChange={setSelectedCV}
              onModelScopeGrowthChange={setModelScopeGrowth}
              onScopeGrowthModeChange={setScopeGrowthMode}
              onCustomScopeGrowthChange={setCustomScopeGrowth}
              onRemainingBacklogChange={setRemainingBacklog}
              onVelocityMeanChange={setVelocityMean}
              onVelocityStdDevChange={setVelocityStdDev}
              volatilityMultiplier={volatilityMultiplier}
              onVolatilityMultiplierChange={setVolatilityMultiplier}
              onRunForecast={handleRunForecast}
              canRun={!!remainingBacklog && effectiveMean > 0}
              isSimulating={isSimulating}
            />
            {hasResults && (
              <div className={cn('mt-6 transition-opacity duration-300', isSimulating && 'opacity-50')}>
                <ForecastSummary
                  results={results}
                  simulationData={simulationData}
                  completedSprintCount={completedSprintCount}
                  remainingBacklog={Number(remainingBacklog) || 0}
                  unitOfMeasure={selectedProject.unitOfMeasure}
                  projectName={selectedProject.name}
                  sprintCadenceWeeks={selectedProject.sprintCadenceWeeks!}
                  startDate={forecastStartDate}
                  milestones={milestones}
                  milestoneResultsState={milestoneResultsState}
                  cumulativeThresholds={cumulativeThresholds}
                  hasBootstrap={results.bootstrap !== null}
                  forecastMode={forecastMode}
                  modelScopeGrowth={modelScopeGrowth}
                  scopeGrowthMode={scopeGrowthMode}
                  scopeGrowthPerSprint={scopeGrowthPerSprint}
                />
                <ForecastResults
                  results={results}
                  forecastMode={forecastMode}
                  completedSprintCount={completedSprintCount}
                  onExport={handleExportCsv}
                  milestones={milestones}
                  milestoneResultsState={milestoneResultsState}
                  cumulativeThresholds={cumulativeThresholds}
                  unitOfMeasure={selectedProject.unitOfMeasure}
                />
              </div>
            )}
          </div>
          {hasResults && (
            <div className="absolute top-2 right-2">
              <CopyImageButton
                targetRef={forecastInputsResultsRef}
                title="Copy inputs and results as image"
              />
            </div>
          )}
        </div>
      )}

      {/* Productivity Adjustments - below inputs, set-and-forget */}
      {selectedProject && (
        <ProductivityAdjustments projectId={selectedProject.id} />
      )}

      {hasResults && (
        <>
          {/* Custom Percentile */}
          <PercentileSelector
            percentile={customPercentile}
            truncatedNormalResult={customResults.truncatedNormal}
            lognormalResult={customResults.lognormal}
            gammaResult={customResults.gamma}
            bootstrapResult={customResults.bootstrap}
            triangularResult={customResults.triangular}
            uniformResult={customResults.uniform}
            forecastMode={forecastMode}
            completedSprintCount={completedSprintCount}
            onPercentileChange={handleCustomPercentileChange}
            selectorRef={percentileSelectorRef}
            milestones={milestones}
            selectedMilestoneIndex={selectedMilestoneIndex}
            onMilestoneIndexChange={handleMilestoneIndexChange}
          />

          {/* Burn-Up Chart */}
          <BurnUpChart
            sprints={projectSprints}
            forecastBacklog={Number(remainingBacklog) || 0}
            simulationData={simulationData}
            sprintCadenceWeeks={selectedProject!.sprintCadenceWeeks!}
            firstSprintStartDate={selectedProject!.firstSprintStartDate!}
            completedSprintCount={completedSprintCount}
            config={burnUpConfig}
            onConfigChange={handleBurnUpConfigChange}
            chartRef={burnUpChartRef}
            fontSize={burnUpFontSize}
            onFontSizeChange={setBurnUpFontSize}
            milestones={milestones}
            cumulativeThresholds={cumulativeThresholds}
          />

          {/* Cumulative Probability Distribution */}
          <DistributionChart
            truncatedNormal={simulationData.truncatedNormal}
            lognormal={simulationData.lognormal}
            gamma={simulationData.gamma}
            bootstrap={simulationData.bootstrap}
            triangular={simulationData.triangular}
            uniform={simulationData.uniform}
            forecastMode={forecastMode}
            customPercentile={customPercentile}
            startDate={forecastStartDate}
            sprintCadenceWeeks={selectedProject!.sprintCadenceWeeks!}
            completedSprintCount={completedSprintCount}
            chartRef={distributionChartRef}
            fontSize={distributionFontSize}
            onFontSizeChange={setDistributionFontSize}
            milestones={milestones}

            selectedMilestoneIndex={selectedMilestoneIndex}
            onMilestoneIndexChange={handleMilestoneIndexChange}
          />

          {/* Probability Distribution Histogram */}
          <HistogramChart
            truncatedNormal={simulationData.truncatedNormal}
            lognormal={simulationData.lognormal}
            gamma={simulationData.gamma}
            bootstrap={simulationData.bootstrap}
            triangular={simulationData.triangular}
            uniform={simulationData.uniform}
            forecastMode={forecastMode}
            startDate={forecastStartDate}
            sprintCadenceWeeks={selectedProject!.sprintCadenceWeeks!}
            completedSprintCount={completedSprintCount}
            chartRef={histogramChartRef}
            fontSize={histogramFontSize}
            onFontSizeChange={setHistogramFontSize}
            milestones={milestones}

            selectedMilestoneIndex={selectedMilestoneIndex}
            onMilestoneIndexChange={handleMilestoneIndexChange}
          />
        </>
      )}
    </div>
  )
}
