'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/shared/state/project-store'
import type { ProductivityAdjustment } from '@/shared/types'
import { ProductivityAdjustmentForm } from './ProductivityAdjustmentForm'
import { ProductivityAdjustmentList } from './ProductivityAdjustmentList'

interface ProductivityAdjustmentsProps {
  projectId: string
}

export function ProductivityAdjustments({ projectId }: ProductivityAdjustmentsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState<ProductivityAdjustment | null>(null)

  // Get adjustments from store (derive from projects to avoid selector re-creation)
  const projects = useProjectStore((state) => state.projects)
  const adjustments = useMemo(() => {
    const project = projects.find((p) => p.id === projectId)
    return project?.productivityAdjustments ?? []
  }, [projects, projectId])
  const addProductivityAdjustment = useProjectStore((state) => state.addProductivityAdjustment)
  const updateProductivityAdjustment = useProjectStore((state) => state.updateProductivityAdjustment)
  const deleteProductivityAdjustment = useProjectStore((state) => state.deleteProductivityAdjustment)

  const handleSubmit = (data: Omit<ProductivityAdjustment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAdjustment) {
      updateProductivityAdjustment(projectId, editingAdjustment.id, data)
    } else {
      addProductivityAdjustment(projectId, data)
    }
    setIsAdding(false)
    setEditingAdjustment(null)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingAdjustment(null)
  }

  const handleEdit = (adjustment: ProductivityAdjustment) => {
    setEditingAdjustment(adjustment)
    setIsAdding(false)
  }

  const handleDelete = (adjustmentId: string) => {
    const adjustment = adjustments.find((a) => a.id === adjustmentId)
    if (window.confirm(`Delete adjustment "${adjustment?.name ?? 'Unknown'}"?`)) {
      deleteProductivityAdjustment(projectId, adjustmentId)
    }
  }

  const handleToggleEnabled = (adjustmentId: string) => {
    const adjustment = adjustments.find((a) => a.id === adjustmentId)
    if (adjustment) {
      updateProductivityAdjustment(projectId, adjustmentId, {
        enabled: adjustment.enabled === false ? true : false,
      })
    }
  }

  const showForm = isAdding || editingAdjustment !== null

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors"
      >
        <span
          className={cn(
            'inline-block text-[10px] text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        >
          ▶
        </span>
        <h3 className="text-sm font-medium text-muted-foreground">
          Productivity Adjustments
        </h3>
        {adjustments.length > 0 && (
          <span className="rounded-[10px] bg-spert-bg-disabled px-2 py-0.5 text-xs text-spert-text-muted">
            {adjustments.length}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-4">
            Define periods of reduced productivity (holidays, vacations, events) that will adjust
            the forecasted velocity. A factor of 50% means the team will complete half their normal
            velocity during that period.
          </p>

          {/* Add button - only show when not in form mode */}
          {!showForm && (
            <button
              onClick={() => setIsAdding(true)}
              className="mb-4 cursor-pointer rounded border-none bg-spert-blue px-4 py-2 text-sm font-medium text-white"
            >
              + Add Adjustment
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="mb-4">
              <ProductivityAdjustmentForm
                adjustment={editingAdjustment}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* List */}
          {!showForm && (
            <ProductivityAdjustmentList
              adjustments={adjustments}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
            />
          )}
        </div>
      )}
    </div>
  )
}
