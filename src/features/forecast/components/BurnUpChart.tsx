'use client'

import { useMemo, useState, type RefObject } from 'react'
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
import type { BurnUpConfig } from '../types'
import { calculateBurnUpData, isBootstrapAvailable } from '../lib/burn-up'
import { BurnUpConfigUI } from './BurnUpConfig'
import { CopyImageButton } from '@/shared/components/CopyImageButton'

// Fixed colors for backlog and done lines
const BACKLOG_COLOR = '#22c55e' // Green
const DONE_COLOR = '#8b5cf6' // Purple

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
}: BurnUpChartProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors"
      >
        <span
          className="text-muted-foreground transition-transform duration-200"
          style={{
            display: 'inline-block',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '10px',
          }}
        >
          ▶
        </span>
        <h3 className="text-sm font-medium text-muted-foreground">Burn-Up Chart</h3>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4" style={{ position: 'relative' }}>
          {/* Configuration UI */}
          <BurnUpConfigUI
            config={config}
            hasBootstrap={hasBootstrap}
            onChange={onConfigChange}
          />

          <div ref={chartRef} style={{ background: 'white', padding: '0.5rem' }}>
            <p className="text-xs text-muted-foreground mb-4">
              Shows cumulative work completed (Done) vs total product scope (Scope). Forecast lines
              show projected completion at different confidence levels.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="sprintNumber"
                  tick={(props) => {
                    const { x, y, payload } = props
                    const point = chartData.find((p) => p.sprintNumber === payload.value)
                    const dateLabel = point?.dateLabel || ''
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={14} textAnchor="middle" fontSize={12} fill="#333">
                          {payload.value}
                        </text>
                        <text x={0} y={0} dy={30} textAnchor="middle" fontSize={11} fill="#555">
                          {dateLabel}
                        </text>
                      </g>
                    )
                  }}
                  tickLine={{ transform: 'translate(0, 0)' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={chartData.length <= 15 ? 0 : chartData.length <= 25 ? 1 : chartData.length <= 40 ? 2 : Math.floor(chartData.length / 15)}
                />
                <YAxis
                  domain={[0, yAxisMax]}
                  label={{ value: 'Work Units', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  tick={{ fontSize: 11 }}
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
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 20 }} verticalAlign="bottom" />

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
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
              <CopyImageButton targetRef={chartRef} title="Copy chart as image" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
