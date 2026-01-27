'use client'

import { useState } from 'react'
import type { ProductivityAdjustment } from '@/shared/types'
import { isValidDateRange } from '@/shared/lib/dates'

interface ProductivityAdjustmentFormProps {
  adjustment: ProductivityAdjustment | null
  onSubmit: (data: Omit<ProductivityAdjustment, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export function ProductivityAdjustmentForm({
  adjustment,
  onSubmit,
  onCancel,
}: ProductivityAdjustmentFormProps) {
  const [name, setName] = useState(adjustment?.name ?? '')
  const [startDate, setStartDate] = useState(adjustment?.startDate ?? '')
  const [endDate, setEndDate] = useState(adjustment?.endDate ?? '')
  const [factorPercent, setFactorPercent] = useState(
    adjustment ? Math.round(adjustment.factor * 100) : 50
  )
  const [reason, setReason] = useState(adjustment?.reason ?? '')

  // Validation
  const [startDateError, setStartDateError] = useState('')
  const [endDateError, setEndDateError] = useState('')

  const validateStartDate = () => {
    if (!isValidDateRange(startDate, true)) {
      setStartDateError('Date must be between 2000 and 2050')
    } else {
      setStartDateError('')
    }
  }

  const validateEndDate = () => {
    if (!isValidDateRange(endDate, true)) {
      setEndDateError('Date must be between 2000 and 2050')
    } else if (endDate && startDate && endDate < startDate) {
      setEndDateError('End date must be on or after start date')
    } else {
      setEndDateError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      name: name.trim(),
      startDate,
      endDate,
      factor: factorPercent / 100,
      enabled: adjustment?.enabled ?? true, // New adjustments are enabled by default
      reason: reason.trim() || undefined,
    })
  }

  const isValid =
    name.trim().length > 0 &&
    startDate.length === 10 &&
    endDate.length === 10 &&
    isValidDateRange(startDate) &&
    isValidDateRange(endDate) &&
    endDate >= startDate &&
    !startDateError &&
    !endDateError

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
      <h4 className="font-medium" style={{ fontSize: '0.9rem' }}>
        {adjustment ? 'Edit Adjustment' : 'Add Productivity Adjustment'}
      </h4>

      {/* Single row: All inputs */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Name */}
        <div style={{ flex: '2 1 180px', minWidth: '150px' }}>
          <label
            htmlFor="adjName"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}
          >
            Name <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            id="adjName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Holiday"
            style={{
              width: '100%',
              padding: '0.4rem',
              fontSize: '0.85rem',
              border: name ? '1px solid #ddd' : '2px solid #0070f3',
              borderRadius: '4px',
              backgroundColor: name ? 'white' : '#f0f7ff',
            }}
            required
          />
        </div>

        {/* Start Date */}
        <div style={{ flex: '0 0 130px' }}>
          <label
            htmlFor="adjStartDate"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}
          >
            Start <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            id="adjStartDate"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setStartDateError('')
            }}
            onBlur={validateStartDate}
            min="2000-01-01"
            max="2050-12-31"
            style={{
              width: '100%',
              padding: '0.4rem',
              fontSize: '0.85rem',
              border: startDateError
                ? '1px solid #dc3545'
                : startDate
                  ? '1px solid #ddd'
                  : '2px solid #0070f3',
              borderRadius: '4px',
              backgroundColor: startDateError ? '#fff' : startDate ? 'white' : '#f0f7ff',
            }}
            required
          />
          {startDateError && (
            <div style={{ color: '#dc3545', fontSize: '0.7rem', marginTop: '0.2rem' }}>
              {startDateError}
            </div>
          )}
        </div>

        {/* End Date */}
        <div style={{ flex: '0 0 130px' }}>
          <label
            htmlFor="adjEndDate"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}
          >
            End <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            id="adjEndDate"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setEndDateError('')
            }}
            onBlur={validateEndDate}
            min="2000-01-01"
            max="2050-12-31"
            style={{
              width: '100%',
              padding: '0.4rem',
              fontSize: '0.85rem',
              border: endDateError
                ? '1px solid #dc3545'
                : endDate
                  ? '1px solid #ddd'
                  : '2px solid #0070f3',
              borderRadius: '4px',
              backgroundColor: endDateError ? '#fff' : endDate ? 'white' : '#f0f7ff',
            }}
            required
          />
          {endDateError && (
            <div style={{ color: '#dc3545', fontSize: '0.7rem', marginTop: '0.2rem' }}>
              {endDateError}
            </div>
          )}
        </div>

        {/* Factor */}
        <div style={{ flex: '0 0 140px' }}>
          <label
            htmlFor="adjFactor"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}
          >
            Factor: {factorPercent}%
          </label>
          <input
            id="adjFactor"
            type="range"
            min="0"
            max="100"
            step="5"
            value={factorPercent}
            onChange={(e) => setFactorPercent(Number(e.target.value))}
            style={{ width: '100%', marginTop: '0.3rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#888' }}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Memo */}
        <div style={{ flex: '0 0 80px', minWidth: '60px' }}>
          <label
            htmlFor="adjReason"
            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}
          >
            Memo
          </label>
          <input
            id="adjReason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder=""
            style={{
              width: '100%',
              padding: '0.4rem',
              fontSize: '0.85rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.5rem 1rem',
            background: '#999',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          style={{
            padding: '0.5rem 1rem',
            background: isValid ? '#0070f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {adjustment ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  )
}
