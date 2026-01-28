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
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { calculateSprintStartDate, calculateSprintFinishDate, formatDateCompact } from '@/shared/lib/dates'
import { CopyImageButton } from '@/shared/components/CopyImageButton'

interface DistributionChartProps {
  truncatedNormal: number[]
  lognormal: number[]
  gamma: number[]
  bootstrap: number[] | null
  customPercentile: number
  startDate: string
  sprintCadenceWeeks: number
  completedSprintCount: number // Number of sprints already completed (to show absolute sprint numbers)
  chartRef?: RefObject<HTMLDivElement | null>
}

interface CdfDataPoint {
  sprints: number
  dateLabel: string
  tNormal: number
  lognormal: number
  gamma: number
  bootstrap?: number
}

const COLORS = {
  tNormal: '#0070f3',    // Brand blue
  lognormal: '#10b981',  // Green
  gamma: '#f59e0b',      // Amber
  bootstrap: '#8b5cf6',  // Purple
}

/**
 * Build CDF points from sorted simulation data.
 * Returns ~100 points for smooth curves without overwhelming the chart.
 */
function buildCdfPoints(sortedData: number[]): Map<number, number> {
  const n = sortedData.length
  const cdf = new Map<number, number>()

  // Sample at regular percentile intervals for smooth curve
  for (let p = 1; p <= 100; p++) {
    const index = Math.floor((p / 100) * n) - 1
    const sprints = sortedData[Math.max(0, index)]
    cdf.set(sprints, p)
  }

  return cdf
}

/**
 * Merge CDF data from all distributions into unified chart data
 */
function mergeDistributions(
  tNormal: number[],
  lognormal: number[],
  gamma: number[],
  bootstrap: number[] | null,
  startDate: string,
  sprintCadenceWeeks: number
): CdfDataPoint[] {
  const tNormalCdf = buildCdfPoints(tNormal)
  const lognormalCdf = buildCdfPoints(lognormal)
  const gammaCdf = buildCdfPoints(gamma)
  const bootstrapCdf = bootstrap ? buildCdfPoints(bootstrap) : null

  // Get all unique sprint values
  const allSprints = new Set<number>()
  tNormalCdf.forEach((_, sprints) => allSprints.add(sprints))
  lognormalCdf.forEach((_, sprints) => allSprints.add(sprints))
  gammaCdf.forEach((_, sprints) => allSprints.add(sprints))
  if (bootstrapCdf) {
    bootstrapCdf.forEach((_, sprints) => allSprints.add(sprints))
  }

  const sortedSprints = Array.from(allSprints).sort((a, b) => a - b)

  // For each sprint value, find the cumulative probability
  // by counting how many trials completed in that many sprints or fewer
  return sortedSprints.map((sprints) => {
    // Calculate finish date: startDate is when sprint 1 of remaining work begins
    // sprints = how many more sprints needed, so sprint N starts at calculateSprintStartDate(startDate, N, cadence)
    const sprintStart = calculateSprintStartDate(startDate, sprints, sprintCadenceWeeks)
    const finishDate = calculateSprintFinishDate(sprintStart, sprintCadenceWeeks)
    const point: CdfDataPoint = {
      sprints,
      dateLabel: formatDateCompact(finishDate),
      tNormal: calculateCumulativePercentage(tNormal, sprints),
      lognormal: calculateCumulativePercentage(lognormal, sprints),
      gamma: calculateCumulativePercentage(gamma, sprints),
    }
    if (bootstrap) {
      point.bootstrap = calculateCumulativePercentage(bootstrap, sprints)
    }
    return point
  })
}

/**
 * Calculate cumulative percentage: what % of trials finished in <= sprints
 */
function calculateCumulativePercentage(sortedData: number[], sprints: number): number {
  // Binary search for the last index where value <= sprints
  let low = 0
  let high = sortedData.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (sortedData[mid] <= sprints) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return (low / sortedData.length) * 100
}

export function DistributionChart({
  truncatedNormal,
  lognormal,
  gamma,
  bootstrap,
  customPercentile,
  startDate,
  sprintCadenceWeeks,
  completedSprintCount,
  chartRef,
}: DistributionChartProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const chartData = useMemo(
    () => mergeDistributions(truncatedNormal, lognormal, gamma, bootstrap, startDate, sprintCadenceWeeks),
    [truncatedNormal, lognormal, gamma, bootstrap, startDate, sprintCadenceWeeks]
  )

  const hasBootstrap = bootstrap !== null

  // Build a map of sprints -> dateLabel for the tooltip
  const sprintToDate = useMemo(() => {
    const map = new Map<number, string>()
    chartData.forEach(point => map.set(point.sprints, point.dateLabel))
    return map
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
        <h3 className="text-sm font-medium text-muted-foreground">
          Cumulative Probability Distribution
        </h3>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4" style={{ position: 'relative' }}>
          <div ref={chartRef} style={{ background: 'white', padding: '0.5rem' }}>
            <p className="text-xs text-muted-foreground mb-4">
              Shows the probability of completing the backlog within a given number of sprints.
              The dashed line marks your selected P{customPercentile} confidence level.
            </p>
            <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="sprints"
                tick={(props) => {
                  const { x, y, payload } = props
                  const dateLabel = sprintToDate.get(payload.value) || ''
                  const absoluteSprint = payload.value + completedSprintCount
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={11} fill="#666">
                        {absoluteSprint}
                      </text>
                      <text x={0} y={0} dy={26} textAnchor="middle" fontSize={10} fill="#999">
                        {dateLabel}
                      </text>
                    </g>
                  )
                }}
                tickLine={{ transform: 'translate(0, 0)' }}
                axisLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, '']}
                labelFormatter={(sprints) => {
                  const dateLabel = sprintToDate.get(sprints as number) || ''
                  const absoluteSprint = (sprints as number) + completedSprintCount
                  return `Sprint ${absoluteSprint} (${dateLabel})`
                }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 13, paddingTop: 20 }}
                verticalAlign="bottom"
              />
              <ReferenceLine
                y={customPercentile}
                stroke="#666"
                strokeDasharray="5 5"
                label={{ value: `P${customPercentile}`, position: 'right', fontSize: 11 }}
              />
              <Line
                type="stepAfter"
                dataKey="tNormal"
                name="T-Normal"
                stroke={COLORS.tNormal}
                dot={false}
                strokeWidth={2.5}
              />
              <Line
                type="stepAfter"
                dataKey="lognormal"
                name="Lognorm"
                stroke={COLORS.lognormal}
                dot={false}
                strokeWidth={2.5}
              />
              <Line
                type="stepAfter"
                dataKey="gamma"
                name="Gamma"
                stroke={COLORS.gamma}
                dot={false}
                strokeWidth={2.5}
              />
              {hasBootstrap && (
                <Line
                  type="stepAfter"
                  dataKey="bootstrap"
                  name="Bootstrap"
                  stroke={COLORS.bootstrap}
                  dot={false}
                  strokeWidth={2.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          </div>
          {chartRef && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
              <CopyImageButton
                targetRef={chartRef}
                title="Copy chart as image"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
