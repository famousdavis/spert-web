'use client'

import { type ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { useStorageMode } from '@/shared/hooks/useStorageMode'
import { useCloudSync } from '@/shared/hooks/useCloudSync'

/**
 * StorageProvider activates cloud sync when the user is authenticated
 * and storage mode is 'cloud'. In local mode, this is a passthrough.
 */
export function StorageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { mode } = useStorageMode()

  // This hook handles all Firestore subscription/sync logic
  useCloudSync(user, mode)

  return <>{children}</>
}
