'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useProjectStore, selectActiveProject, type ExportData } from '@/shared/state/project-store'
import { useIsClient } from '@/shared/hooks'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; projectId: string | null; projectName: string }>({
    isOpen: false,
    projectId: null,
    projectName: '',
  })

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

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)

    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportError('Import failed: Please select a JSON file (.json)')
      e.target.value = ''
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImportError(`Import failed: File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string

      // Parse JSON with better error handling
      let data: ExportData
      try {
        data = JSON.parse(content) as ExportData
      } catch {
        setImportError('Import failed: Invalid JSON format. Please check the file is a valid SPERT export.')
        return
      }

      // Validate and import
      try {
        importData(data)
        toast.success('Project data imported')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown validation error'
        setImportError(`Import failed: ${message}`)
      }
    }
    reader.onerror = () => {
      setImportError('Import failed: Could not read file')
    }
    reader.readAsText(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDeleteRequest = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    setDeleteConfirm({
      isOpen: true,
      projectId,
      projectName: project?.name ?? 'Unknown',
    })
  }, [projects])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.projectId) {
      deleteProject(deleteConfirm.projectId)
    }
    setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' })
  }, [deleteConfirm.projectId, deleteProject])

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' })
  }, [])

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
            className="flex items-center gap-2 rounded border-none dark:border dark:border-green-600 bg-[#28a745] dark:bg-green-900/30 px-4 py-2 text-[0.9rem] font-semibold text-white dark:text-green-400 cursor-pointer"
          >
            <span role="img" aria-label="export">📤</span> Export Data
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 rounded border-none dark:border dark:border-blue-600 bg-spert-blue dark:bg-blue-900/30 px-4 py-2 text-[0.9rem] font-semibold text-white dark:text-blue-400 cursor-pointer"
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
        onDelete={handleDeleteRequest}
        onReorder={reorderProjects}
        onViewHistory={onViewHistory ?? (() => {})}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Project"
        message={`Delete project "${deleteConfirm.projectName}"? This will also delete all its sprint history.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  )
}
