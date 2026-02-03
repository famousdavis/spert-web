'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
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
      <h4 className="font-medium text-[0.9rem]">
        {adjustment ? 'Edit Adjustment' : 'Add Productivity Adjustment'}
      </h4>

      {/* Single row: All inputs */}
      <div className="flex flex-wrap items-start gap-3">
        {/* Name */}
        <div className="min-w-[150px] flex-[2_1_180px]">
          <label
            htmlFor="adjName"
            className="mb-1 block text-[0.8rem] font-semibold text-spert-text-secondary"
          >
            Name <span className="text-spert-error">*</span>
          </label>
          <input
            id="adjName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Holiday"
            className={cn(
              'w-full rounded p-[0.4rem] text-[0.85rem]',
              name
                ? 'border border-spert-border bg-white'
                : 'border-2 border-spert-blue bg-spert-bg-highlight'
            )}
            required
          />
        </div>

        {/* Start Date */}
        <div className="flex-[0_0_130px]">
          <label
            htmlFor="adjStartDate"
            className="mb-1 block text-[0.8rem] font-semibold text-spert-text-secondary"
          >
            Start <span className="text-spert-error">*</span>
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
            className={cn(
              'w-full rounded p-[0.4rem] text-[0.85rem]',
              startDateError
                ? 'border border-spert-error bg-white'
                : startDate
                  ? 'border border-spert-border bg-white'
                  : 'border-2 border-spert-blue bg-spert-bg-highlight'
            )}
            required
          />
          {startDateError && (
            <div className="mt-[0.2rem] text-[0.7rem] text-spert-error">
              {startDateError}
            </div>
          )}
        </div>

        {/* End Date */}
        <div className="flex-[0_0_130px]">
          <label
            htmlFor="adjEndDate"
            className="mb-1 block text-[0.8rem] font-semibold text-spert-text-secondary"
          >
            End <span className="text-spert-error">*</span>
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
            className={cn(
              'w-full rounded p-[0.4rem] text-[0.85rem]',
              endDateError
                ? 'border border-spert-error bg-white'
                : endDate
                  ? 'border border-spert-border bg-white'
                  : 'border-2 border-spert-blue bg-spert-bg-highlight'
            )}
            required
          />
          {endDateError && (
            <div className="mt-[0.2rem] text-[0.7rem] text-spert-error">
              {endDateError}
            </div>
          )}
        </div>

        {/* Factor */}
        <div className="flex-[0_0_140px]">
          <label
            htmlFor="adjFactor"
            className="mb-1 block text-[0.8rem] font-semibold text-spert-text-secondary"
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
            className="mt-[0.3rem] w-full"
          />
          <div className="flex justify-between text-[0.65rem] text-spert-text-helper">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Memo */}
        <div className="min-w-[60px] flex-[0_0_80px]">
          <label
            htmlFor="adjReason"
            className="mb-1 block text-[0.8rem] font-semibold text-spert-text-secondary"
          >
            Memo
          </label>
          <input
            id="adjReason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder=""
            className="w-full rounded border border-spert-border p-[0.4rem] text-[0.85rem]"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded border-none bg-spert-text-light px-4 py-2 text-[0.9rem] text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={cn(
            'rounded border-none px-4 py-2 text-[0.9rem] font-semibold text-white',
            isValid
              ? 'cursor-pointer bg-spert-blue'
              : 'cursor-not-allowed bg-spert-border-medium'
          )}
        >
          {adjustment ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  )
}
