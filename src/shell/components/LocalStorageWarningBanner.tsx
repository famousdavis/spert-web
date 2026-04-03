// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

'use client'

import { useState, useEffect } from 'react'
import { useStorageMode } from '@/shared/hooks/useStorageMode'
import { useSettingsStore } from '@/shared/state/settings-store'

export function LocalStorageWarningBanner() {
  const [visible, setVisible] = useState(false)
  const { mode } = useStorageMode()
  const suppressLocalStorageWarning = useSettingsStore((s) => s.suppressLocalStorageWarning)

  useEffect(() => {
    if (mode === 'local' && !suppressLocalStorageWarning) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [mode, suppressLocalStorageWarning])

  if (!visible) return null

  return (
    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg flex items-start justify-between gap-3">
      <p className="text-sm text-spert-text dark:text-gray-200">
        <strong>Your data exists only in this browser</strong> and can be lost without warning.{' '}
        Export at the end of every session to protect your work.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 px-2 py-0.5 text-xs font-medium rounded border border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
        aria-label="Dismiss warning"
      >
        ×
      </button>
    </div>
  )
}
