'use client'

import { useState, useCallback, useEffect } from 'react'
import { isFirebaseAvailable } from '@/shared/firebase/config'
import type { StorageMode } from '@/shared/firebase/types'

const STORAGE_MODE_KEY = 'spert-storage-mode'

function getPersistedMode(): StorageMode {
  if (typeof window === 'undefined') return 'local'
  return (localStorage.getItem(STORAGE_MODE_KEY) as StorageMode) || 'local'
}

export function useStorageMode() {
  const [mode, setModeState] = useState<StorageMode>(getPersistedMode)

  // Sync on mount (SSR → client hydration)
  useEffect(() => {
    setModeState(getPersistedMode())
  }, [])

  const setMode = useCallback((newMode: StorageMode) => {
    setModeState(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_MODE_KEY, newMode)
    }
  }, [])

  return {
    mode,
    setMode,
    isFirebaseAvailable,
  }
}

export { STORAGE_MODE_KEY }
