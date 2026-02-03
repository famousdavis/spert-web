'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/shared/state/project-store'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; adjustmentId: string | null; adjustmentName: string }>({
    isOpen: false,
    adjustmentId: null,
    adjustmentName: '',
  })

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

  const handleDeleteRequest = useCallback((adjustmentId: string) => {
    const adjustment = adjustments.find((a) => a.id === adjustmentId)
    setDeleteConfirm({
      isOpen: true,
      adjustmentId,
      adjustmentName: adjustment?.name ?? 'Unknown',
    })
  }, [adjustments])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.adjustmentId) {
      deleteProductivityAdjustment(projectId, deleteConfirm.adjustmentId)
    }
    setDeleteConfirm({ isOpen: false, adjustmentId: null, adjustmentName: '' })
  }, [deleteConfirm.adjustmentId, deleteProductivityAdjustment, projectId])

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ isOpen: false, adjustmentId: null, adjustmentName: '' })
  }, [])

  const handleToggleEnabled = (adjustmentId: string) => {
    const adjustment = adjustments.find((a) => a.id === adjustmentId)
    if (adjustment) {
      updateProductivityAdjustment(projectId, adjustmentId, {
        enabled: adjustment.enabled === false ? true : false,
      })
    }
  }

  const showForm = isAdding || editingAdjustment !== null

  const panelId = `productivity-adjustments-panel-${projectId}`

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={`Productivity Adjustments${adjustments.length > 0 ? ` (${adjustments.length})` : ''}`}
      >
        <span
          className={cn(
            'inline-block text-[10px] text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
          aria-hidden="true"
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
        <div id={panelId} role="region" aria-label="Productivity Adjustments" className="px-4 pb-4">
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
              onDelete={handleDeleteRequest}
              onToggleEnabled={handleToggleEnabled}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Adjustment"
        message={`Delete adjustment "${deleteConfirm.adjustmentName}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  )
}
