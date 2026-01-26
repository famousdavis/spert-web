'use client'

import { useState, useRef } from 'react'
import { useProjectStore, selectActiveProject, type ExportData } from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { ProjectList } from './ProjectList'
import { ProjectForm } from './ProjectForm'
import type { Project } from '@/shared/types'

interface ProjectsTabProps {
  onViewHistory?: (projectId: string) => void
}

export function ProjectsTab({ onViewHistory }: ProjectsTabProps) {
  const isClient = useIsClient()
  const projects = useProjectStore((state) => state.projects)
  const activeProject = useProjectStore(selectActiveProject)
  const addProject = useProjectStore((state) => state.addProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const reorderProjects = useProjectStore((state) => state.reorderProjects)
  const exportData = useProjectStore((state) => state.exportData)
  const importData = useProjectStore((state) => state.importData)

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEdit = (project: Project) => {
    setEditingProject(project)
  }

  const handleFormSubmit = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      updateProject(editingProject.id, data)
      setEditingProject(null)
    } else {
      addProject(data)
    }
  }

  const handleFormCancel = () => {
    setEditingProject(null)
  }

  const handleExport = () => {
    const data = exportData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spert-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData
        if (data.projects && data.sprints) {
          importData(data)
        } else {
          alert('Invalid file format. Please select a valid SPERT export file.')
        }
      } catch {
        alert('Failed to parse file. Please select a valid JSON file.')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  if (!isClient) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span role="img" aria-label="export">📤</span> Export Data
          </button>
          <button
            onClick={handleImportClick}
            style={{
              padding: '0.5rem 1rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span role="img" aria-label="import">📥</span> Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <ProjectForm
        project={editingProject}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />

      <ProjectList
        projects={projects}
        activeProjectId={activeProject?.id}
        onEdit={handleEdit}
        onDelete={deleteProject}
        onReorder={reorderProjects}
        onViewHistory={onViewHistory ?? (() => {})}
      />
    </div>
  )
}
