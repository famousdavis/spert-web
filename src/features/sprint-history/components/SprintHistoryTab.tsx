'use client'

import { useState, useMemo } from 'react'
import {
  useProjectStore,
  selectViewingProject,
} from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { SprintList } from './SprintList'
import { SprintForm } from './SprintForm'
import { SprintConfig } from './SprintConfig'
import { VelocityStats } from './VelocityStats'
import type { Sprint } from '@/shared/types'
import type { SprintCadence } from '@/features/projects/constants'

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

  const handleCadenceChange = (value: SprintCadence) => {
    if (selectedProject) {
      updateProject(selectedProject.id, { sprintCadenceWeeks: value })
    }
  }

  const handleFirstSprintDateChange = (value: string) => {
    if (selectedProject) {
      updateProject(selectedProject.id, { firstSprintStartDate: value || undefined })
    }
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
          <SprintConfig
            project={selectedProject}
            canEdit={canEditFirstSprintDate}
            onCadenceChange={handleCadenceChange}
            onFirstSprintDateChange={handleFirstSprintDateChange}
          />

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
