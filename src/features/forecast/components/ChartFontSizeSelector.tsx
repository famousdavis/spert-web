'use client'

import { type ChartFontSize, CHART_FONT_SIZE_LABELS } from '../types'

interface ChartFontSizeSelectorProps {
  value: ChartFontSize
  onChange: (size: ChartFontSize) => void
}

const SIZES: ChartFontSize[] = ['small', 'medium', 'large']

export function ChartFontSizeSelector({ value, onChange }: ChartFontSizeSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label
        htmlFor="chart-font-size"
        style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#555' }}
      >
        Chart Text:
      </label>
      <select
        id="chart-font-size"
        value={value}
        onChange={(e) => onChange(e.target.value as ChartFontSize)}
        style={{
          padding: '0.25rem 0.375rem',
          fontSize: '0.8125rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
        }}
      >
        {SIZES.map((size) => (
          <option key={size} value={size}>
            {CHART_FONT_SIZE_LABELS[size]}
          </option>
        ))}
      </select>
    </div>
  )
}
