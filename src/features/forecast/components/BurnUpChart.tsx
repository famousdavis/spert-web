'use client'

import { useMemo, useState, type RefObject } from 'react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Sprint } from '@/shared/types'
import type { QuadSimulationData } from '../lib/monte-carlo'
import type { BurnUpConfig, ChartFontSize } from '../types'
import { CHART_FONT_SIZES } from '../types'
import { calculateBurnUpData, isBootstrapAvailable } from '../lib/burn-up'
import { BurnUpConfigUI } from './BurnUpConfig'
import { CopyImageButton } from '@/shared/components/CopyImageButton'
import { COLORS } from '@/shared/lib/colors'

// Fixed colors for backlog and done lines
const BACKLOG_COLOR = COLORS.burnUp.backlog
const DONE_COLOR = COLORS.burnUp.done

interface BurnUpChartProps {
  sprints: Sprint[]
  forecastBacklog: number
  simulationData: QuadSimulationData
  sprintCadenceWeeks: number
  firstSprintStartDate: string
  completedSprintCount: number
  productivityFactors?: number[]
  config: BurnUpConfig
  onConfigChange: (config: BurnUpConfig) => void
  chartRef?: RefObject<HTMLDivElement | null>
  fontSize?: ChartFontSize
  onFontSizeChange?: (size: ChartFontSize) => void
}

export function BurnUpChart({
  sprints,
  forecastBacklog,
  simulationData,
  sprintCadenceWeeks,
  firstSprintStartDate,
  completedSprintCount,
  config,
  onConfigChange,
  chartRef,
  fontSize = 'small',
  onFontSizeChange,
}: BurnUpChartProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const fontSizes = CHART_FONT_SIZES[fontSize]

  const hasBootstrap = isBootstrapAvailable(simulationData)

  const chartData = useMemo(
    () =>
      calculateBurnUpData({
        sprints,
        forecastBacklog,
        simulationData,
        config,
        sprintCadenceWeeks,
        firstSprintStartDate,
        completedSprintCount,
      }),
    [sprints, forecastBacklog, simulationData, config, sprintCadenceWeeks, firstSprintStartDate, completedSprintCount]
  )

  // Calculate Y-axis domain based on data
  const yAxisMax = useMemo(() => {
    let max = 0
    for (const point of chartData) {
      max = Math.max(max, point.backlog)
      if (point.cumulativeDone !== null) max = Math.max(max, point.cumulativeDone)
      if (point.line1 !== undefined) max = Math.max(max, point.line1)
      if (point.line2 !== undefined) max = Math.max(max, point.line2)
      if (point.line3 !== undefined) max = Math.max(max, point.line3)
    }
    // Add 10% padding
    return Math.ceil(max * 1.1)
  }, [chartData])

  const panelId = 'burn-up-chart-panel'

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label="Burn-Up Chart"
      >
        <span
          className={cn(
            'inline-block text-[10px] text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
          aria-hidden="true"
        >
          ▶
        </span>
        <h3 className="text-sm font-medium text-muted-foreground">Burn-Up Chart</h3>
      </button>

      {isExpanded && (
        <div id={panelId} role="region" aria-label="Burn-Up Chart" className="px-4 pb-4 relative">
          {/* Configuration UI */}
          <BurnUpConfigUI
            config={config}
            hasBootstrap={hasBootstrap}
            onChange={onConfigChange}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
          />

          <div ref={chartRef} className="bg-white p-2">
            <p className="text-xs text-muted-foreground mb-4">
              Shows cumulative work completed (Done) vs total product scope (Scope). Forecast lines
              show projected completion at different confidence levels.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.light} />
                <XAxis
                  dataKey="sprintNumber"
                  tick={(props) => {
                    const { x, y, payload } = props
                    const point = chartData.find((p) => p.sprintNumber === payload.value)
                    const dateLabel = point?.dateLabel || ''
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={14} textAnchor="middle" fontSize={fontSizes.axisTick} fill={COLORS.text.primary}>
                          {payload.value}
                        </text>
                        <text x={0} y={0} dy={30} textAnchor="middle" fontSize={fontSizes.dateLabel} fill={COLORS.text.secondary}>
                          {dateLabel}
                        </text>
                      </g>
                    )
                  }}
                  tickLine={{ transform: 'translate(0, 0)' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={chartData.length <= 25 ? 0 : chartData.length <= 50 ? 1 : chartData.length <= 80 ? 2 : Math.floor(chartData.length / 25)}
                />
                <YAxis
                  domain={[0, yAxisMax]}
                  label={{ value: 'Work Units', angle: -90, position: 'insideLeft', fontSize: fontSizes.axisLabel }}
                  tick={{ fontSize: fontSizes.axisTick }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (value === undefined || value === null) return ['-', name]
                    return [typeof value === 'number' ? value.toFixed(1) : value, name]
                  }}
                  labelFormatter={(sprintNumber) => {
                    const point = chartData.find((p) => p.sprintNumber === sprintNumber)
                    return point ? `Sprint ${sprintNumber} (${point.dateLabel})` : `Sprint ${sprintNumber}`
                  }}
                  contentStyle={{ fontSize: fontSizes.axisTick }}
                />
                <Legend wrapperStyle={{ fontSize: fontSizes.legend, paddingTop: 20 }} verticalAlign="bottom" />

                {/* Scope line (solid) - total product scope over time */}
                <Line
                  type="stepAfter"
                  dataKey="backlog"
                  name="Scope"
                  stroke={BACKLOG_COLOR}
                  dot={false}
                  strokeWidth={3.5}
                  connectNulls={false}
                />

                {/* Cumulative done line (solid) - stops at history end (nulls are not connected) */}
                <Line
                  type="stepAfter"
                  dataKey="cumulativeDone"
                  name="Done"
                  stroke={DONE_COLOR}
                  dot={false}
                  strokeWidth={3.5}
                  connectNulls={false}
                />

                {/* Forecast line 1 (dashed) */}
                <Line
                  type="linear"
                  dataKey="line1"
                  name={config.lines[0].label}
                  stroke={config.lines[0].color}
                  strokeDasharray="6 4"
                  dot={false}
                  strokeWidth={3}
                  connectNulls={false}
                />

                {/* Forecast line 2 (dashed) */}
                <Line
                  type="linear"
                  dataKey="line2"
                  name={config.lines[1].label}
                  stroke={config.lines[1].color}
                  strokeDasharray="6 4"
                  dot={false}
                  strokeWidth={3}
                  connectNulls={false}
                />

                {/* Forecast line 3 (dashed) */}
                <Line
                  type="linear"
                  dataKey="line3"
                  name={config.lines[2].label}
                  stroke={config.lines[2].color}
                  strokeDasharray="6 4"
                  dot={false}
                  strokeWidth={3}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {chartRef && (
            <div className="absolute top-2 right-2">
              <CopyImageButton targetRef={chartRef} title="Copy chart as image" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
