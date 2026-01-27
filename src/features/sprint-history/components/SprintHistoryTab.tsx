'use client'

import { useState, useMemo } from 'react'
import {
  useProjectStore,
  selectViewingProject,
} from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { SprintList } from './SprintList'
import { SprintForm } from './SprintForm'
import { VelocityStats } from './VelocityStats'
import type { Sprint } from '@/shared/types'
import { isValidDateRange } from '@/shared/lib/dates'
import {
  SPRINT_CADENCE_OPTIONS,
  type SprintCadence,
} from '@/features/projects/constants'

export function SprintHistoryTab() {
  const isClient = useIsClient()
  const projects = useProjectStore((state) => state.projects)
  const selectedProject = useProjectStore(selectViewingProject)
  const allSprints = useProjectStore((state) => state.sprints)
  const addSprint = useProjectStore((state) => state.addSprint)
  const updateSprint = useProjectStore((state) => state.updateSprint)
  const deleteSprint = useProjectStore((state) => state.deleteSprint)
  const toggleSprintIncluded = useProjectStore((state) => state.toggleSprintIncluded)
  const updateProject = useProjectStore((state) => state.updateProject)
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  const sprints = useMemo(
    () => (selectedProject ? allSprints.filter((s) => s.projectId === selectedProject.id) : []),
    [allSprints, selectedProject]
  )

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [sortAscending, setSortAscending] = useState(false) // Default: descending (most recent first)
  const [firstSprintDateError, setFirstSprintDateError] = useState('')

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value
    setViewingProjectId(newProjectId)
    // Close form if open when switching projects
    setIsFormOpen(false)
    setEditingSprint(null)
  }

  const handleCreate = () => {
    setEditingSprint(null)
    setIsFormOpen(true)
  }

  const handleEdit = (sprint: Sprint) => {
    setEditingSprint(sprint)
    setIsFormOpen(true)
  }

  const handleFormSubmit = (
    data: Omit<Sprint, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingSprint) {
      updateSprint(editingSprint.id, data)
    } else if (selectedProject) {
      addSprint({ ...data, projectId: selectedProject.id })
    }
    setIsFormOpen(false)
    setEditingSprint(null)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingSprint(null)
  }

  const handleFirstSprintDateChange = (value: string) => {
    if (selectedProject) {
      updateProject(selectedProject.id, { firstSprintStartDate: value || undefined })
      setFirstSprintDateError('')
    }
  }

  const handleCadenceChange = (value: SprintCadence) => {
    if (selectedProject) {
      updateProject(selectedProject.id, { sprintCadenceWeeks: value })
    }
  }

  const validateFirstSprintDate = (value: string) => {
    if (value === '') {
      setFirstSprintDateError('')
      return true
    }
    if (value.length === 10 && !isValidDateRange(value)) {
      setFirstSprintDateError('Date must be between 2000 and 2050')
      return false
    }
    setFirstSprintDateError('')
    return true
  }

  const handleToggleSortOrder = () => {
    setSortAscending(!sortAscending)
  }

  // Check if firstSprintStartDate can be edited (only when no sprints exist)
  const canEditFirstSprintDate = sprints.length === 0

  // Check if sprint configuration is complete (both cadence and first sprint date are set)
  const isSprintConfigComplete =
    selectedProject?.sprintCadenceWeeks !== undefined &&
    selectedProject?.firstSprintStartDate !== undefined

  if (!isClient) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">
          No projects yet. Create a project first to add sprint history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.25rem', color: '#333', display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600 }}>Sprint History for </span>
          <select
            value={selectedProject?.id || ''}
            onChange={handleProjectChange}
            style={{
              fontSize: '1.25rem',
              color: '#333',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              padding: 0,
              outline: 'none',
              marginLeft: 0,
            }}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </h2>
        {!isFormOpen && (
          <button
            onClick={handleCreate}
            disabled={!isSprintConfigComplete}
            title={!isSprintConfigComplete ? 'Set sprint cadence and first sprint start date first' : undefined}
            style={{
              padding: '0.5rem 1rem',
              background: isSprintConfigComplete ? '#0070f3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSprintConfigComplete ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: 600,
              opacity: isSprintConfigComplete ? 1 : 0.6,
            }}
          >
            Add Sprint
          </button>
        )}
      </div>

      {/* Sprint Form - appears immediately after the Add Sprint button */}
      {selectedProject && isFormOpen && (
        <SprintForm
          sprint={editingSprint}
          project={selectedProject}
          existingSprintCount={sprints.length}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {selectedProject && (
        <>
          {/* Sprint Configuration - editable only when no sprints exist */}
          <div className="rounded-lg border border-border p-4" style={{ background: '#f9f9f9' }}>
            {canEditFirstSprintDate && !isSprintConfigComplete && (
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
                  {canEditFirstSprintDate && !selectedProject.sprintCadenceWeeks && (
                    <span style={{ color: '#dc3545', marginLeft: '2px' }}>*</span>
                  )}
                </label>
                <select
                  id="sprintCadence"
                  value={selectedProject.sprintCadenceWeeks ?? ''}
                  onChange={(e) => handleCadenceChange(Number(e.target.value) as SprintCadence)}
                  disabled={!canEditFirstSprintDate}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.9rem',
                    border: canEditFirstSprintDate && !selectedProject.sprintCadenceWeeks
                      ? '2px solid #0070f3'
                      : '1px solid #ddd',
                    borderRadius: '4px',
                    width: '90px',
                    backgroundColor: !canEditFirstSprintDate
                      ? '#e9ecef'
                      : !selectedProject.sprintCadenceWeeks
                        ? '#f0f7ff'
                        : 'white',
                    cursor: canEditFirstSprintDate ? 'pointer' : 'not-allowed',
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
                  {canEditFirstSprintDate && !selectedProject.firstSprintStartDate && (
                    <span style={{ color: '#dc3545', marginLeft: '2px' }}>*</span>
                  )}
                </label>
                <input
                  id="firstSprintStartDate"
                  type="date"
                  value={selectedProject.firstSprintStartDate ?? ''}
                  className={selectedProject.firstSprintStartDate ? 'has-value' : ''}
                  onChange={(e) => handleFirstSprintDateChange(e.target.value)}
                  onBlur={(e) => validateFirstSprintDate(e.target.value)}
                  disabled={!canEditFirstSprintDate}
                  min="2000-01-01"
                  max="2050-12-31"
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.9rem',
                    border: firstSprintDateError
                      ? '1px solid #dc3545'
                      : canEditFirstSprintDate && !selectedProject.firstSprintStartDate
                        ? '2px solid #0070f3'
                        : '1px solid #ddd',
                    borderRadius: '4px',
                    width: '150px',
                    color: '#333',
                    backgroundColor: !canEditFirstSprintDate
                      ? '#e9ecef'
                      : !selectedProject.firstSprintStartDate
                        ? '#f0f7ff'
                        : 'white',
                    cursor: canEditFirstSprintDate ? 'text' : 'not-allowed',
                  }}
                />
                {firstSprintDateError && (
                  <span style={{ color: '#dc3545', fontSize: '0.75rem' }}>
                    {firstSprintDateError}
                  </span>
                )}
              </div>

              {!canEditFirstSprintDate && (
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  (Delete all sprints to change)
                </span>
              )}
            </div>
          </div>

          <VelocityStats sprints={sprints} unitOfMeasure={selectedProject.unitOfMeasure} />

          {!isFormOpen && (
            <SprintList
              sprints={sprints}
              unitOfMeasure={selectedProject.unitOfMeasure}
              sortAscending={sortAscending}
              onToggleSortOrder={handleToggleSortOrder}
              onEdit={handleEdit}
              onDelete={deleteSprint}
              onToggleIncluded={toggleSprintIncluded}
            />
          )}
        </>
      )}
    </div>
  )
}
