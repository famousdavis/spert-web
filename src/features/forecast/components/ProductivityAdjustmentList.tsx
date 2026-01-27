'use client'

import type { ProductivityAdjustment } from '@/shared/types'
import { formatDate } from '@/shared/lib/dates'

interface ProductivityAdjustmentListProps {
  adjustments: ProductivityAdjustment[]
  onEdit: (adjustment: ProductivityAdjustment) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string) => void
}

export function ProductivityAdjustmentList({
  adjustments,
  onEdit,
  onDelete,
  onToggleEnabled,
}: ProductivityAdjustmentListProps) {
  if (adjustments.length === 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
        No productivity adjustments defined.
      </p>
    )
  }

  // Sort by start date ascending
  const sortedAdjustments = [...adjustments].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#555', fontWeight: 600, width: '50px' }}>
              On
            </th>
            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#555', fontWeight: 600 }}>
              Name
            </th>
            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#555', fontWeight: 600 }}>
              Date Range
            </th>
            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#555', fontWeight: 600 }}>
              Factor
            </th>
            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#555', fontWeight: 600 }}>
              Memo
            </th>
            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#555', fontWeight: 600 }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAdjustments.map((adj) => {
            const isEnabled = adj.enabled !== false // Default to true for backwards compatibility
            return (
              <tr
                key={adj.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  opacity: isEnabled ? 1 : 0.5,
                }}
              >
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => onToggleEnabled(adj.id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    title={isEnabled ? 'Click to disable' : 'Click to enable'}
                  />
                </td>
                <td style={{ padding: '0.5rem', fontWeight: 500 }}>{adj.name}</td>
                <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                  {formatDate(adj.startDate)} – {formatDate(adj.endDate)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor:
                        adj.factor === 0
                          ? '#fee2e2'
                          : adj.factor < 0.5
                            ? '#fef3c7'
                            : adj.factor < 1
                              ? '#dbeafe'
                              : '#d1fae5',
                      color:
                        adj.factor === 0
                          ? '#dc2626'
                          : adj.factor < 0.5
                            ? '#d97706'
                            : adj.factor < 1
                              ? '#2563eb'
                              : '#059669',
                    }}
                  >
                    {Math.round(adj.factor * 100)}%
                  </span>
                </td>
                <td style={{ padding: '0.5rem', color: '#666' }}>{adj.reason || '—'}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => onEdit(adj)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginRight: '0.5rem',
                    }}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(adj.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#f8d7da',
                      border: '1px solid #dc3545',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                    title="Delete"
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
