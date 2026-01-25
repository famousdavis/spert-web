'use client'

import { useMemo } from 'react'
import type { Sprint } from '@/shared/types'
import { formatDateRange } from '@/shared/lib/dates'

interface SprintListProps {
  sprints: Sprint[]
  unitOfMeasure: string
  sortAscending: boolean
  onToggleSortOrder: () => void
  onEdit: (sprint: Sprint) => void
  onDelete: (id: string) => void
  onToggleIncluded: (id: string) => void
}

export function SprintList({
  sprints,
  unitOfMeasure,
  sortAscending,
  onToggleSortOrder,
  onEdit,
  onDelete,
  onToggleIncluded,
}: SprintListProps) {
  // Sort sprints by sprint number
  const sortedSprints = useMemo(() => {
    return [...sprints].sort((a, b) =>
      sortAscending ? a.sprintNumber - b.sprintNumber : b.sprintNumber - a.sprintNumber
    )
  }, [sprints, sortAscending])

  // Find the highest sprint number (most recent sprint)
  const highestSprintNumber = useMemo(() => {
    if (sprints.length === 0) return 0
    return Math.max(...sprints.map((s) => s.sprintNumber))
  }, [sprints])

  if (sprints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No sprints recorded yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Include
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={onToggleSortOrder}
              title="Click to toggle sort order"
            >
              Sprint {sortAscending ? '↑' : '↓'}
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Done ({unitOfMeasure})
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSprints.map((sprint) => {
            const isLatestSprint = sprint.sprintNumber === highestSprintNumber
            const canDelete = isLatestSprint

            return (
              <tr
                key={sprint.id}
                className={`border-b border-border ${
                  !sprint.includedInForecast ? 'opacity-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={sprint.includedInForecast}
                    onChange={() => onToggleIncluded(sprint.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  Sprint {sprint.sprintNumber}: {formatDateRange(sprint.sprintStartDate, sprint.sprintFinishDate)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {sprint.doneValue}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(sprint)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => canDelete && onDelete(sprint.id)}
                    disabled={!canDelete}
                    title={canDelete ? 'Delete sprint' : 'Only the most recent sprint can be deleted'}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: canDelete ? '#f8d7da' : '#e9ecef',
                      border: canDelete ? '1px solid #dc3545' : '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: canDelete ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                      marginLeft: '0.5rem',
                      opacity: canDelete ? 1 : 0.5,
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
