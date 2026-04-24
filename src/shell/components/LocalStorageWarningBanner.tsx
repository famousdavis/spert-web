// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

'use client'

import { useState } from 'react'
import { useStorageMode } from '@/shared/hooks/useStorageMode'
import { useSettingsStore } from '@/shared/state/settings-store'

export function LocalStorageWarningBanner() {
  const { mode } = useStorageMode()
  const suppressLocalStorageWarning = useSettingsStore((s) => s.suppressLocalStorageWarning)
  const shouldShow = mode === 'local' && !suppressLocalStorageWarning
  if (!shouldShow) return null
  // Remount via key so toggling the conditions off-then-on resets the
  // in-memory dismissal state (matches the pre-refactor effect behavior).
  return <DismissibleBanner key={`${mode}-${String(suppressLocalStorageWarning)}`} />
}

function DismissibleBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg flex items-start justify-between gap-3">
      <p className="text-sm text-spert-text dark:text-gray-200">
        <strong>Your data exists only in this browser</strong> and can be lost without warning.{' '}
        Export at the end of every session to protect your work.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 px-3 py-1 text-xs font-medium rounded border border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
      >
        Got it
      </button>
    </div>
  )
}
