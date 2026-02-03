'use client'

import { useForecastState } from '../hooks/useForecastState'
import { ForecastForm } from './ForecastForm'
import { ForecastResults } from './ForecastResults'
import { DistributionChart } from './DistributionChart'
import { PercentileSelector } from './PercentileSelector'
import { ProductivityAdjustments } from './ProductivityAdjustments'
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
    remainingBacklog,
    velocityMean,
    velocityStdDev,
    effectiveMean,
    setRemainingBacklog,
    setVelocityMean,
    setVelocityStdDev,
    results,
    simulationData,
    customPercentile,
    customResults,
    burnUpConfig,
    handleBurnUpConfigChange,
    burnUpFontSize,
    setBurnUpFontSize,
    distributionFontSize,
    setDistributionFontSize,
    forecastInputsResultsRef,
    distributionChartRef,
    percentileSelectorRef,
    burnUpChartRef,
    handleRunForecast,
    handleCustomPercentileChange,
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
            {hasResults && (
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
          {hasResults && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
              <CopyImageButton
                targetRef={forecastInputsResultsRef}
                title="Copy inputs and results as image"
              />
            </div>
          )}
        </div>
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
            completedSprintCount={completedSprintCount}
            onPercentileChange={handleCustomPercentileChange}
            selectorRef={percentileSelectorRef}
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
          />

          {/* Cumulative Probability Distribution */}
          <DistributionChart
            truncatedNormal={simulationData.truncatedNormal}
            lognormal={simulationData.lognormal}
            gamma={simulationData.gamma}
            bootstrap={simulationData.bootstrap}
            customPercentile={customPercentile}
            startDate={forecastStartDate}
            sprintCadenceWeeks={selectedProject!.sprintCadenceWeeks!}
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
