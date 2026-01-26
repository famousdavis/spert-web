'use client'

import { useState, useMemo } from 'react'
import type { Sprint, Project } from '@/shared/types'
import {
  calculateSprintStartDate,
  calculateSprintFinishDate,
  formatDateRange,
} from '@/shared/lib/dates'

interface SprintFormProps {
  sprint: Sprint | null
  project: Project
  existingSprintCount: number
  onSubmit: (data: Omit<Sprint, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export function SprintForm({
  sprint,
  project,
  existingSprintCount,
  onSubmit,
  onCancel,
}: SprintFormProps) {
  const [doneValue, setDoneValue] = useState(sprint?.doneValue?.toString() ?? '')
  const [includedInForecast, setIncludedInForecast] = useState(
    sprint?.includedInForecast ?? true
  )

  // Calculate the sprint number and dates
  const sprintNumber = sprint?.sprintNumber ?? existingSprintCount + 1

  const { sprintStartDate, sprintFinishDate, dateLabel } = useMemo(() => {
    if (sprint) {
      // Editing existing sprint - use its stored dates
      return {
        sprintStartDate: sprint.sprintStartDate,
        sprintFinishDate: sprint.sprintFinishDate,
        dateLabel: `Sprint ${sprint.sprintNumber}: ${formatDateRange(
          sprint.sprintStartDate,
          sprint.sprintFinishDate
        )}`,
      }
    }

    // New sprint - calculate dates from firstSprintStartDate
    if (!project.firstSprintStartDate) {
      return {
        sprintStartDate: '',
        sprintFinishDate: '',
        dateLabel: 'Set First Sprint Start Date above to calculate dates',
      }
    }

    const startDate = calculateSprintStartDate(
      project.firstSprintStartDate,
      sprintNumber,
      project.sprintCadenceWeeks
    )
    const finishDate = calculateSprintFinishDate(startDate, project.sprintCadenceWeeks)

    return {
      sprintStartDate: startDate,
      sprintFinishDate: finishDate,
      dateLabel: `Sprint ${sprintNumber}: ${formatDateRange(startDate, finishDate)}`,
    }
  }, [sprint, project.firstSprintStartDate, project.sprintCadenceWeeks, sprintNumber])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sprintStartDate || !sprintFinishDate) return

    onSubmit({
      sprintNumber,
      sprintStartDate,
      sprintFinishDate,
      doneValue: Number(doneValue),
      includedInForecast,
    })
  }

  const isValid =
    sprintStartDate.length > 0 &&
    sprintFinishDate.length > 0 &&
    doneValue.length > 0 &&
    Number(doneValue) >= 0

  const needsFirstSprintDate = !project.firstSprintStartDate && !sprint

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
      <h3 className="font-medium">{sprint ? 'Edit Sprint' : 'Add Sprint'}</h3>

      {/* Single row: Sprint dates, Done input, Include checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Sprint dates display (read-only) */}
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: needsFirstSprintDate ? '#fff3cd' : '#e9ecef',
            border: needsFirstSprintDate ? '1px solid #ffc107' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: needsFirstSprintDate ? '#856404' : '#333',
          }}
        >
          {dateLabel}
        </div>

        {/* Done input - compact width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label
            htmlFor="doneValue"
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}
          >
            Done ({project.unitOfMeasure}) <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            id="doneValue"
            type="number"
            min="0"
            step="any"
            value={doneValue}
            onChange={(e) => setDoneValue(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: doneValue ? '1px solid #ddd' : '2px solid #0070f3',
              borderRadius: '4px',
              width: '80px',
              backgroundColor: doneValue ? 'white' : '#f0f7ff',
            }}
            placeholder="0"
            required
          />
        </div>

        {/* Include in forecast checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            id="includedInForecast"
            type="checkbox"
            checked={includedInForecast}
            onChange={(e) => setIncludedInForecast(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="includedInForecast" style={{ fontSize: '0.875rem', color: '#555' }}>
            Include in forecast
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.5rem 1rem',
            background: '#999',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          style={{
            padding: '0.5rem 1rem',
            background: isValid ? '#0070f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {sprint ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  )
}
