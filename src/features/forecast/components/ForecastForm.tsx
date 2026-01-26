'use client'

interface ForecastFormProps {
  remainingBacklog: string
  velocityMean: string
  velocityStdDev: string
  startDate: string
  calculatedMean: number
  calculatedStdDev: number
  unitOfMeasure: string
  onRemainingBacklogChange: (value: string) => void
  onVelocityMeanChange: (value: string) => void
  onVelocityStdDevChange: (value: string) => void
  onRunForecast: () => void
  canRun: boolean
}

export function ForecastForm({
  remainingBacklog,
  velocityMean,
  velocityStdDev,
  startDate,
  calculatedMean,
  calculatedStdDev,
  unitOfMeasure,
  onRemainingBacklogChange,
  onVelocityMeanChange,
  onVelocityStdDevChange,
  onRunForecast,
  canRun,
}: ForecastFormProps) {
  return (
    <div className="rounded-lg border border-border p-4" style={{ background: '#f9f9f9' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Remaining Backlog */}
        <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
          <label
            htmlFor="remainingBacklog"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}
          >
            Remaining Backlog ({unitOfMeasure}) <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            id="remainingBacklog"
            type="number"
            min="0"
            step="any"
            value={remainingBacklog}
            onChange={(e) => onRemainingBacklogChange(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: remainingBacklog ? '1px solid #ddd' : '2px solid #0070f3',
              borderRadius: '4px',
              width: '100%',
              backgroundColor: remainingBacklog ? 'white' : '#f0f7ff',
            }}
            placeholder="Required"
          />
        </div>

        {/* Velocity */}
        <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
          <label
            htmlFor="velocityMean"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}
          >
            Velocity ({unitOfMeasure}/sprint)
          </label>
          <input
            id="velocityMean"
            type="number"
            min="0"
            step="any"
            value={velocityMean || (calculatedMean > 0 ? calculatedMean.toFixed(1) : '')}
            onChange={(e) => onVelocityMeanChange(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              backgroundColor: 'white',
              color: '#333',
            }}
            placeholder={calculatedMean > 0 ? '' : 'No data'}
          />
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            {calculatedMean > 0
              ? `Calculated: ${calculatedMean.toFixed(1)}`
              : 'Add sprints to calculate'}
          </p>
        </div>

        {/* Velocity Std Dev */}
        <div style={{ flex: '1 1 130px', minWidth: '110px' }}>
          <label
            htmlFor="velocityStdDev"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}
          >
            Std Dev
          </label>
          <input
            id="velocityStdDev"
            type="number"
            min="0"
            step="any"
            value={velocityStdDev || (calculatedStdDev > 0 ? calculatedStdDev.toFixed(1) : '')}
            onChange={(e) => onVelocityStdDevChange(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              backgroundColor: 'white',
              color: '#333',
            }}
            placeholder={calculatedStdDev > 0 ? '' : 'No data'}
          />
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            {calculatedStdDev > 0
              ? `Calculated: ${calculatedStdDev.toFixed(1)}`
              : 'Need 2+ sprints'}
          </p>
        </div>

        {/* Forecast Start Date */}
        <div style={{ flex: '0 0 150px' }}>
          <label
            htmlFor="startDate"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}
          >
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            readOnly
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '150px',
              backgroundColor: '#e9ecef',
              cursor: 'not-allowed',
              color: '#333',
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Next sprint start
          </p>
        </div>

        {/* Run Forecast Button */}
        <div style={{ flex: '0 0 auto', alignSelf: 'flex-end', paddingBottom: '1.25rem' }}>
          <button
            onClick={onRunForecast}
            disabled={!canRun}
            style={{
              padding: '0.5rem 1rem',
              background: canRun ? '#0070f3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canRun ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: 600,
              height: '38px',
            }}
          >
            Run Forecast
          </button>
        </div>
      </div>
    </div>
  )
}
