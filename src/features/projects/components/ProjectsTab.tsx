'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useProjectStore, selectActiveProject, type ExportData } from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { today } from '@/shared/lib/dates'
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
  const [importError, setImportError] = useState<string | null>(null)
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
    a.download = `spert-data-${today()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Project data exported')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData
        importData(data)
        toast.success('Project data imported')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setImportError(`Import failed: ${message}`)
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
            className="flex items-center gap-2 rounded border-none bg-[#28a745] px-4 py-2 text-[0.9rem] font-semibold text-white cursor-pointer"
          >
            <span role="img" aria-label="export">📤</span> Export Data
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 rounded border-none bg-spert-blue px-4 py-2 text-[0.9rem] font-semibold text-white cursor-pointer"
          >
            <span role="img" aria-label="import">📥</span> Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {importError && (
        <div
          className="flex items-center justify-between rounded border border-[#e53e3e] bg-[#fff3f3] px-4 py-3 text-[0.9rem] text-spert-error-dark"
        >
          <span>{importError}</span>
          <button
            onClick={() => setImportError(null)}
            className="border-none bg-transparent cursor-pointer text-spert-error-dark font-bold text-base"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <ProjectForm
        project={editingProject}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />

      <ProjectList
        projects={projects}
        activeProjectId={activeProject?.id}
        onEdit={handleEdit}
        onDelete={(id) => {
          const project = projects.find((p) => p.id === id)
          if (window.confirm(`Delete project "${project?.name ?? 'Unknown'}"? This will also delete all its sprint history.`)) {
            deleteProject(id)
          }
        }}
        onReorder={reorderProjects}
        onViewHistory={onViewHistory ?? (() => {})}
      />
    </div>
  )
}
