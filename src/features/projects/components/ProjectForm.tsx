'use client'

import { useState, useEffect } from 'react'
import type { Project } from '@/shared/types'
import { DEFAULT_UNIT_OF_MEASURE } from '../constants'

interface ProjectFormProps {
  project: Project | null
  onSubmit: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

// Date validation: must be between 2000-2050
function isValidDateRange(dateStr: string): boolean {
  if (!dateStr || dateStr.length !== 10) return true // Empty or incomplete is ok
  return dateStr >= '2000-01-01' && dateStr <= '2050-12-31'
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [projectStartDate, setProjectStartDate] = useState(project?.projectStartDate ?? '')
  const [projectFinishDate, setProjectFinishDate] = useState(project?.projectFinishDate ?? '')
  const [unitOfMeasure, setUnitOfMeasure] = useState(
    project?.unitOfMeasure ?? DEFAULT_UNIT_OF_MEASURE
  )

  // Error states for date validation on blur
  const [startDateError, setStartDateError] = useState('')
  const [finishDateError, setFinishDateError] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Update form when editing project changes
  useEffect(() => {
    if (project) {
      setName(project.name)
      setProjectStartDate(project.projectStartDate ?? '')
      setProjectFinishDate(project.projectFinishDate ?? '')
      setUnitOfMeasure(project.unitOfMeasure)
    } else {
      setName('')
      setProjectStartDate('')
      setProjectFinishDate('')
      setUnitOfMeasure(DEFAULT_UNIT_OF_MEASURE)
    }
    // Clear errors when switching projects
    setStartDateError('')
    setFinishDateError('')
    setSubmitError('')
  }, [project])

  const validateProjectStartDate = (date: string) => {
    if (date === '') {
      setStartDateError('')
      return true
    }
    if (date.length === 10 && !isValidDateRange(date)) {
      setStartDateError('Date must be between 2000 and 2050')
      return false
    }
    setStartDateError('')
    return true
  }

  const validateProjectFinishDate = (date: string) => {
    if (date === '') {
      setFinishDateError('')
      return true
    }
    if (date.length === 10 && !isValidDateRange(date)) {
      setFinishDateError('Date must be between 2000 and 2050')
      return false
    }
    setFinishDateError('')
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    // Validate date comparison only on submit
    if (projectStartDate && projectFinishDate && projectStartDate.length === 10 && projectFinishDate.length === 10) {
      if (projectStartDate >= projectFinishDate) {
        setSubmitError('Start Date must be before Finish Date')
        return
      }
    }

    // Check for any existing date errors
    if (startDateError || finishDateError) {
      return
    }

    onSubmit({
      name: name.trim(),
      sprintCadenceWeeks: project?.sprintCadenceWeeks, // Not set until configured on Sprint History tab
      projectStartDate: projectStartDate || undefined,
      projectFinishDate: projectFinishDate || undefined,
      unitOfMeasure: unitOfMeasure.trim(),
    })
    // Reset form after submission (if adding new project)
    if (!project) {
      setName('')
      setProjectStartDate('')
      setProjectFinishDate('')
    }
  }

  const isValid = name.trim().length > 0 && unitOfMeasure.trim().length > 0 && !startDateError && !finishDateError

  const isEditing = project !== null

  // Shared date input styles
  const dateInputStyle = {
    padding: '0.5rem',
    fontSize: '0.9rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '150px',
    color: '#333',
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border p-4"
      style={{ background: '#f9f9f9' }}
    >
      <style jsx>{`
        input[type="date"]::-webkit-datetime-edit-text,
        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: #999;
        }
        input[type="date"].has-value::-webkit-datetime-edit-text,
        input[type="date"].has-value::-webkit-datetime-edit-month-field,
        input[type="date"].has-value::-webkit-datetime-edit-day-field,
        input[type="date"].has-value::-webkit-datetime-edit-year-field {
          color: #333;
        }
      `}</style>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Project Name - wider */}
        <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
            }}
            placeholder="Project name"
            required
          />
        </div>

        {/* Unit of Measure */}
        <div style={{ flex: '0 0 130px' }}>
          <label htmlFor="unitOfMeasure" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>
            Unit of Measure
          </label>
          <input
            id="unitOfMeasure"
            type="text"
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
            }}
            placeholder="story points"
            required
          />
        </div>

        {/* Start Date */}
        <div style={{ flex: '0 0 150px' }}>
          <label htmlFor="projectStartDate" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>
            Start Date (Optional)
          </label>
          <input
            id="projectStartDate"
            type="date"
            value={projectStartDate}
            className={projectStartDate ? 'has-value' : ''}
            onChange={(e) => {
              setProjectStartDate(e.target.value)
              setStartDateError('') // Clear error while typing
              setSubmitError('')
            }}
            onBlur={(e) => validateProjectStartDate(e.target.value)}
            min="2000-01-01"
            max="2050-12-31"
            style={{
              ...dateInputStyle,
              borderColor: startDateError ? '#dc3545' : '#ddd',
            }}
          />
          {startDateError && (
            <div style={{ color: '#dc3545', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {startDateError}
            </div>
          )}
        </div>

        {/* Finish Date - immediately after Start Date */}
        <div style={{ flex: '0 0 150px' }}>
          <label htmlFor="projectFinishDate" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>
            Finish Date (Optional)
          </label>
          <input
            id="projectFinishDate"
            type="date"
            value={projectFinishDate}
            className={projectFinishDate ? 'has-value' : ''}
            onChange={(e) => {
              setProjectFinishDate(e.target.value)
              setFinishDateError('') // Clear error while typing
              setSubmitError('')
            }}
            onBlur={(e) => validateProjectFinishDate(e.target.value)}
            min="2000-01-01"
            max="2050-12-31"
            style={{
              ...dateInputStyle,
              borderColor: finishDateError ? '#dc3545' : '#ddd',
            }}
          />
          {finishDateError && (
            <div style={{ color: '#dc3545', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {finishDateError}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ flex: '0 0 auto', alignSelf: 'flex-end', display: 'flex', gap: '0.5rem' }}>
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
              height: '38px',
              opacity: isValid ? 1 : 0.6,
            }}
          >
            {isEditing ? 'Update Project' : 'Add Project'}
          </button>

          {isEditing && (
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
                height: '38px',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Submit error message */}
      {submitError && (
        <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.75rem' }}>
          {submitError}
        </div>
      )}
    </form>
  )
}
