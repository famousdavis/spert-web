import { useState } from 'react'
import { isValidDateRange } from '@/shared/lib/dates'
import {
  SPRINT_CADENCE_OPTIONS,
  type SprintCadence,
} from '@/features/projects/constants'
import type { Project } from '@/shared/types'

interface SprintConfigProps {
  project: Project
  canEdit: boolean
  onCadenceChange: (cadence: SprintCadence) => void
  onFirstSprintDateChange: (date: string) => void
}

export function SprintConfig({
  project,
  canEdit,
  onCadenceChange,
  onFirstSprintDateChange,
}: SprintConfigProps) {
  const [firstSprintDateError, setFirstSprintDateError] = useState('')

  const isConfigComplete =
    project.sprintCadenceWeeks !== undefined &&
    project.firstSprintStartDate !== undefined

  const handleFirstSprintDateChange = (value: string) => {
    onFirstSprintDateChange(value)
    setFirstSprintDateError('')
  }

  const validateFirstSprintDate = (value: string) => {
    if (value === '') {
      setFirstSprintDateError('')
      return
    }
    if (value.length === 10 && !isValidDateRange(value)) {
      setFirstSprintDateError('Date must be between 2000 and 2050')
    } else {
      setFirstSprintDateError('')
    }
  }

  return (
    <div className="rounded-lg border border-border p-4" style={{ background: '#f9f9f9' }}>
      {canEdit && !isConfigComplete && (
        <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '0.75rem' }}>
          Configure the sprint cadence and first sprint start date before adding sprints.
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Sprint Cadence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label
            htmlFor="sprintCadence"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#555',
            }}
          >
            Sprint Cadence
            {canEdit && !project.sprintCadenceWeeks && (
              <span style={{ color: '#dc3545', marginLeft: '2px' }}>*</span>
            )}
          </label>
          <select
            id="sprintCadence"
            value={project.sprintCadenceWeeks ?? ''}
            onChange={(e) => onCadenceChange(Number(e.target.value) as SprintCadence)}
            disabled={!canEdit}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: canEdit && !project.sprintCadenceWeeks
                ? '2px solid #0070f3'
                : '1px solid #ddd',
              borderRadius: '4px',
              width: '90px',
              backgroundColor: !canEdit
                ? '#e9ecef'
                : !project.sprintCadenceWeeks
                  ? '#f0f7ff'
                  : 'white',
              cursor: canEdit ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="" disabled>
              Select
            </option>
            {SPRINT_CADENCE_OPTIONS.map((weeks) => (
              <option key={weeks} value={weeks}>
                {weeks} wk{weeks > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* First Sprint Start Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label
            htmlFor="firstSprintStartDate"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#555',
            }}
          >
            First Sprint Start Date
            {canEdit && !project.firstSprintStartDate && (
              <span style={{ color: '#dc3545', marginLeft: '2px' }}>*</span>
            )}
          </label>
          <input
            id="firstSprintStartDate"
            type="date"
            value={project.firstSprintStartDate ?? ''}
            className={project.firstSprintStartDate ? 'has-value' : ''}
            onChange={(e) => handleFirstSprintDateChange(e.target.value)}
            onBlur={(e) => validateFirstSprintDate(e.target.value)}
            disabled={!canEdit}
            min="2000-01-01"
            max="2050-12-31"
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: firstSprintDateError
                ? '1px solid #dc3545'
                : canEdit && !project.firstSprintStartDate
                  ? '2px solid #0070f3'
                  : '1px solid #ddd',
              borderRadius: '4px',
              width: '150px',
              color: '#333',
              backgroundColor: !canEdit
                ? '#e9ecef'
                : !project.firstSprintStartDate
                  ? '#f0f7ff'
                  : 'white',
              cursor: canEdit ? 'text' : 'not-allowed',
            }}
          />
          {firstSprintDateError && (
            <span style={{ color: '#dc3545', fontSize: '0.75rem' }}>
              {firstSprintDateError}
            </span>
          )}
        </div>

        {!canEdit && (
          <span style={{ fontSize: '0.75rem', color: '#666' }}>
            (Delete all sprints to change)
          </span>
        )}
      </div>
    </div>
  )
}
