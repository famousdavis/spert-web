'use client'

import { useState } from 'react'
import type { Project } from '@/shared/types'
import { formatDate } from '@/shared/lib/dates'

interface ProjectListProps {
  projects: Project[]
  activeProjectId?: string
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  onReorder: (projectIds: string[]) => void
  onViewHistory: (projectId: string) => void
}

export function ProjectList({
  projects,
  activeProjectId,
  onEdit,
  onDelete,
  onReorder,
  onViewHistory,
}: ProjectListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newOrder = [...projects.map((p) => p.id)]
    const [removed] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, removed)
    onReorder(newOrder)

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (projects.length === 0) {
    return null
  }

  // Build sprint count summary
  const getProjectSummary = (project: Project) => {
    const parts: string[] = []
    // Only show sprint cadence if it's been configured
    if (project.sprintCadenceWeeks) {
      parts.push(`${project.sprintCadenceWeeks}-week sprints`)
    }
    parts.push(project.unitOfMeasure)
    if (project.projectFinishDate) {
      parts.push(`finish: ${formatDate(project.projectFinishDate)}`)
    }
    return parts.length > 0 ? `(${parts.join(', ')})` : ''
  }

  return (
    <div className="space-y-2">
      {projects.map((project, index) => (
        <div
          key={project.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className="rounded-lg border bg-white"
          style={{
            borderColor: dragOverIndex === index ? '#0070f3' : '#e5e7eb',
            borderWidth: dragOverIndex === index ? '2px' : '1px',
            opacity: draggedIndex === index ? 0.5 : 1,
            cursor: 'default',
          }}
        >
          <div className="flex items-center p-4">
            {/* Drag handle */}
            <div
              className="mr-3 cursor-grab active:cursor-grabbing"
              style={{ color: '#999' }}
              title="Drag to reorder"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
            </div>

            {/* Project info */}
            <div className="flex-1">
              <span className="font-semibold">{project.name}</span>
              <span className="ml-3 text-sm text-gray-500">
                {getProjectSummary(project)}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewHistory(project.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e7f3ff',
                  border: '1px solid #0070f3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#0070f3',
                }}
              >
                View History
              </button>
              <button
                onClick={() => onEdit(project)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(project.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f8d7da',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
