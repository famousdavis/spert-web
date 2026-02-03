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
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { calculateSprintStartDate, calculateSprintFinishDate, formatDateCompact } from '@/shared/lib/dates'
import { CopyImageButton } from '@/shared/components/CopyImageButton'
import { COLORS } from '@/shared/lib/colors'
import { type ChartFontSize, CHART_FONT_SIZES, CHART_FONT_SIZE_LABELS } from '../types'

const FONT_SIZES: ChartFontSize[] = ['small', 'medium', 'large']

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
  fontSize?: ChartFontSize
  onFontSizeChange?: (size: ChartFontSize) => void
}

interface CdfDataPoint {
  sprints: number
  dateLabel: string
  tNormal: number
  lognormal: number
  gamma: number
  bootstrap?: number
}

const CHART_COLORS = COLORS.chart

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
  fontSize = 'small',
  onFontSizeChange,
}: DistributionChartProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const fontSizes = CHART_FONT_SIZES[fontSize]

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
          className={cn(
            'inline-block text-[10px] text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        >
          ▶
        </span>
        <h3 className="text-sm font-medium text-muted-foreground">
          Cumulative Probability Distribution
        </h3>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 relative">
          {/* Configuration row */}
          {onFontSizeChange && (
            <div className="flex items-center gap-2 mb-4 justify-end mr-10">
              <label
                htmlFor="cdf-font-size"
                className="text-[0.8125rem] font-semibold text-spert-text-muted"
              >
                Text:
              </label>
              <select
                id="cdf-font-size"
                value={fontSize}
                onChange={(e) => onFontSizeChange(e.target.value as ChartFontSize)}
                className="px-1.5 py-1 text-[0.8125rem] border border-spert-border rounded bg-white"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {CHART_FONT_SIZE_LABELS[size]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div ref={chartRef} className="bg-white p-2">
            <p className="text-xs text-muted-foreground mb-4">
              Shows the probability of completing the backlog within a given number of sprints.
              The dashed line marks your selected P{customPercentile} confidence level.
            </p>
            <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.light} />
              <XAxis
                dataKey="sprints"
                tick={(props) => {
                  const { x, y, payload } = props
                  const dateLabel = sprintToDate.get(payload.value) || ''
                  const absoluteSprint = payload.value + completedSprintCount
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={fontSizes.axisTick} fill={COLORS.text.muted}>
                        {absoluteSprint}
                      </text>
                      <text x={0} y={0} dy={26} textAnchor="middle" fontSize={fontSizes.dateLabel} fill={COLORS.text.light}>
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
                label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', fontSize: fontSizes.axisLabel }}
                tick={{ fontSize: fontSizes.axisTick }}
              />
              <Tooltip
                formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, '']}
                labelFormatter={(sprints) => {
                  const dateLabel = sprintToDate.get(sprints as number) || ''
                  const absoluteSprint = (sprints as number) + completedSprintCount
                  return `Sprint ${absoluteSprint} (${dateLabel})`
                }}
                contentStyle={{ fontSize: fontSizes.axisTick }}
              />
              <Legend
                wrapperStyle={{ fontSize: fontSizes.legend, paddingTop: 20 }}
                verticalAlign="bottom"
              />
              <ReferenceLine
                y={customPercentile}
                stroke={COLORS.text.muted}
                strokeDasharray="5 5"
                label={{ value: `P${customPercentile}`, position: 'right', fontSize: fontSizes.axisTick }}
              />
              <Line
                type="stepAfter"
                dataKey="tNormal"
                name="T-Normal"
                stroke={CHART_COLORS.tNormal}
                dot={false}
                strokeWidth={2.5}
              />
              <Line
                type="stepAfter"
                dataKey="lognormal"
                name="Lognorm"
                stroke={CHART_COLORS.lognormal}
                dot={false}
                strokeWidth={2.5}
              />
              <Line
                type="stepAfter"
                dataKey="gamma"
                name="Gamma"
                stroke={CHART_COLORS.gamma}
                dot={false}
                strokeWidth={2.5}
              />
              {hasBootstrap && (
                <Line
                  type="stepAfter"
                  dataKey="bootstrap"
                  name="Bootstrap"
                  stroke={CHART_COLORS.bootstrap}
                  dot={false}
                  strokeWidth={2.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          </div>
          {chartRef && (
            <div className="absolute top-2 right-2">
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
