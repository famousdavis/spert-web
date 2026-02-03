'use client'

import type { BurnUpConfig, DistributionType, ForecastLineConfig, ChartFontSize } from '../types'
import { DISTRIBUTION_LABELS, CHART_FONT_SIZE_LABELS } from '../types'
import { MIN_PERCENTILE, MAX_PERCENTILE } from '../constants'

const FONT_SIZES: ChartFontSize[] = ['small', 'medium', 'large']

interface BurnUpConfigProps {
  config: BurnUpConfig
  hasBootstrap: boolean
  onChange: (config: BurnUpConfig) => void
  fontSize?: ChartFontSize
  onFontSizeChange?: (size: ChartFontSize) => void
}

export function BurnUpConfigUI({ config, hasBootstrap, onChange, fontSize = 'small', onFontSizeChange }: BurnUpConfigProps) {
  const handleDistributionChange = (distribution: DistributionType) => {
    onChange({ ...config, distribution })
  }

  const handleLineChange = (index: 0 | 1 | 2, updates: Partial<ForecastLineConfig>) => {
    const newLines = [...config.lines] as [ForecastLineConfig, ForecastLineConfig, ForecastLineConfig]
    newLines[index] = { ...newLines[index], ...updates }
    onChange({ ...config, lines: newLines })
  }

  // Available distributions (bootstrap only if available)
  const availableDistributions: DistributionType[] = hasBootstrap
    ? ['truncatedNormal', 'lognormal', 'gamma', 'bootstrap']
    : ['truncatedNormal', 'lognormal', 'gamma']

  return (
    <div className="mb-4">
      {/* All controls in a single horizontal row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Distribution selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="burnup-distribution"
            className="text-[0.8125rem] font-semibold text-spert-text-muted"
          >
            Dist:
          </label>
          <select
            id="burnup-distribution"
            value={config.distribution}
            onChange={(e) => handleDistributionChange(e.target.value as DistributionType)}
            className="px-1.5 py-1 text-[0.8125rem] border border-spert-border rounded bg-white"
          >
            {availableDistributions.map((dist) => (
              <option key={dist} value={dist}>
                {DISTRIBUTION_LABELS[dist]}
              </option>
            ))}
          </select>
        </div>

        {/* Forecast line configuration - all inline */}
        {config.lines.map((line, index) => (
          <ForecastLineRow
            key={index}
            line={line}
            lineNumber={index + 1}
            onChange={(updates) => handleLineChange(index as 0 | 1 | 2, updates)}
          />
        ))}

        {/* Font size selector */}
        {onFontSizeChange && (
          <div className="flex items-center gap-2 ml-auto mr-10">
            <label
              htmlFor="burnup-font-size"
              className="text-[0.8125rem] font-semibold text-spert-text-muted"
            >
              Text:
            </label>
            <select
              id="burnup-font-size"
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
      </div>
    </div>
  )
}

interface ForecastLineRowProps {
  line: ForecastLineConfig
  lineNumber: number
  onChange: (updates: Partial<ForecastLineConfig>) => void
}

function ForecastLineRow({ line, lineNumber, onChange }: ForecastLineRowProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Color picker */}
      <input
        type="color"
        value={line.color}
        onChange={(e) => onChange({ color: e.target.value })}
        className="w-6 h-6 p-0 border border-spert-border rounded cursor-pointer"
        title={`Line ${lineNumber} color`}
      />

      {/* Label input */}
      <input
        type="text"
        value={line.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder={`Line ${lineNumber}`}
        maxLength={16}
        className="w-[105px] px-1.5 py-1 text-[0.8125rem] border border-spert-border rounded"
        title="Forecast line label"
      />

      {/* Percentile slider */}
      <input
        type="range"
        min={MIN_PERCENTILE}
        max={MAX_PERCENTILE}
        value={line.percentile}
        onChange={(e) => onChange({ percentile: Number(e.target.value) })}
        className="w-[60px] cursor-pointer"
        title={`Percentile: ${line.percentile}%`}
      />

      {/* Percentile value display */}
      <span
        className="text-[0.8125rem] font-semibold text-spert-text-muted min-w-[32px]"
      >
        P{line.percentile}
      </span>
    </div>
  )
}
