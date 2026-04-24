// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

'use client'

import { useState, useCallback } from 'react'
import { migrateLocalToCloud, type MigrationResult } from '@/shared/firebase/firestore-migration'

interface UploadConfirmPanelProps {
  /** Authenticated user's UID */
  uid: string
  /** Authenticated user's display name (raw; not normalized) */
  displayName: string
  /** Authenticated user's email */
  email: string
  /** Number of local projects to upload */
  projectCount: number
  /** Fires after a successful migration (0 errors). Caller is responsible for flipping storage mode. */
  onSuccess: (result: MigrationResult) => void
  /** Fires on cancel — parent should dismiss the panel and stay in local mode. */
  onCancel: () => void
  /** Optional secondary message displayed above the action buttons */
  helperText?: string
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/**
 * Shared upload-confirm UI for local→cloud migration.
 *
 * Consumed by both StorageModeSection (Settings) and CloudStorageModal
 * (header auth chip) so the confirm flow is defined once.
 */
export function UploadConfirmPanel({
  uid,
  displayName,
  email,
  projectCount,
  onSuccess,
  onCancel,
  helperText,
}: UploadConfirmPanelProps) {
  const [isMigrating, setIsMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = useCallback(async () => {
    setError(null)
    setIsMigrating(true)
    try {
      const result = await migrateLocalToCloud(uid, {
        displayName,
        email,
        lastSignIn: new Date().toISOString(),
      })
      if (result.errors.length === 0) {
        onSuccess(result)
      } else {
        setError(result.errors.join(' '))
      }
    } catch (err) {
      setError(`Migration failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsMigrating(false)
    }
  }, [uid, displayName, email, onSuccess])

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg space-y-2">
      <p className="text-sm text-spert-text dark:text-gray-200">
        You have {projectCount} project{projectCount !== 1 ? 's' : ''} stored locally.
        Upload them to the cloud to continue in cloud mode.
      </p>
      {helperText && (
        <p className="text-xs text-spert-text-muted dark:text-gray-400">{helperText}</p>
      )}
      {isMigrating ? (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Spinner />
          <span className="text-sm">Uploading data to cloud…</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            className="px-3 py-1.5 text-sm font-medium rounded bg-spert-blue text-white hover:bg-blue-600 cursor-pointer"
          >
            Upload to Cloud
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium rounded border border-spert-border dark:border-gray-600 text-spert-text dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
