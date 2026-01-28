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
    <div style={{ marginBottom: '1rem' }}>
      {/* All controls in a single horizontal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Distribution selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label
            htmlFor="burnup-distribution"
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#555' }}
          >
            Dist:
          </label>
          <select
            id="burnup-distribution"
            value={config.distribution}
            onChange={(e) => handleDistributionChange(e.target.value as DistributionType)}
            style={{
              padding: '0.25rem 0.375rem',
              fontSize: '0.8125rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
            }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', marginRight: '2.5rem' }}>
            <label
              htmlFor="burnup-font-size"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#555' }}
            >
              Text:
            </label>
            <select
              id="burnup-font-size"
              value={fontSize}
              onChange={(e) => onFontSizeChange(e.target.value as ChartFontSize)}
              style={{
                padding: '0.25rem 0.375rem',
                fontSize: '0.8125rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
              }}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {/* Color picker */}
      <input
        type="color"
        value={line.color}
        onChange={(e) => onChange({ color: e.target.value })}
        style={{
          width: '24px',
          height: '24px',
          padding: 0,
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        title={`Line ${lineNumber} color`}
      />

      {/* Label input */}
      <input
        type="text"
        value={line.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder={`Line ${lineNumber}`}
        maxLength={16}
        style={{
          width: '105px',
          padding: '0.25rem 0.375rem',
          fontSize: '0.8125rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
        title="Forecast line label"
      />

      {/* Percentile slider */}
      <input
        type="range"
        min={MIN_PERCENTILE}
        max={MAX_PERCENTILE}
        value={line.percentile}
        onChange={(e) => onChange({ percentile: Number(e.target.value) })}
        style={{
          width: '60px',
          cursor: 'pointer',
        }}
        title={`Percentile: ${line.percentile}%`}
      />

      {/* Percentile value display */}
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#555',
          minWidth: '32px',
        }}
      >
        P{line.percentile}
      </span>
    </div>
  )
}
