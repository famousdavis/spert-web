'use client'

import { useState } from 'react'
import { useAuth } from '@/shared/providers/AuthProvider'
import { useStorageMode } from '@/shared/hooks/useStorageMode'
import { migrateLocalToCloud, type MigrationResult } from '@/shared/firebase/firestore-migration'
import { useProjectStore } from '@/shared/state/project-store'
import { SignInButtons } from './SignInButtons'

const sectionHeaderClass = 'text-lg font-semibold text-spert-blue mb-4'
const labelClass = 'text-sm font-semibold text-spert-text-secondary dark:text-gray-300'
const descriptionClass = 'text-xs text-spert-text-muted dark:text-gray-400 mt-0.5'

export function StorageModeSection() {
  const { user, isFirebaseAvailable, signOut } = useAuth()
  const { mode, setMode } = useStorageMode()
  const projects = useProjectStore((s) => s.projects)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false)

  if (!isFirebaseAvailable) return null

  const handleModeChange = (newMode: 'local' | 'cloud') => {
    if (newMode === 'cloud') {
      if (!user) return
      if (projects.length > 0 && mode === 'local') {
        setShowMigrationPrompt(true)
        return
      }
      setMode('cloud')
    } else {
      setMode('local')
      setMigrationResult(null)
    }
  }

  const handleMigrate = async () => {
    if (!user) return
    setIsMigrating(true)
    setMigrationResult(null)
    try {
      const result = await migrateLocalToCloud(user.uid, {
        displayName: user.displayName || '',
        email: user.email || '',
        lastSignIn: new Date().toISOString(),
      })
      setMigrationResult(result)
      setMode('cloud')
    } catch (err) {
      setMigrationResult({
        projectsUploaded: 0,
        projectsSkipped: 0,
        settingsUploaded: false,
        errors: [`Migration failed: ${err}`],
      })
    } finally {
      setIsMigrating(false)
      setShowMigrationPrompt(false)
    }
  }

  const handleSkipMigration = () => {
    setShowMigrationPrompt(false)
    setMode('cloud')
  }

  return (
    <>
      {/* Account */}
      <section>
        <h3 className={sectionHeaderClass}>Account</h3>
        <div className="space-y-3">
          {!user ? (
            <div className="space-y-2">
              <p className="text-sm text-spert-text dark:text-gray-200">
                Sign in to enable cloud storage and cross-device sync.
              </p>
              <SignInButtons />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-spert-text dark:text-gray-100">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-spert-text-muted dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-sm font-medium rounded border border-spert-border dark:border-gray-600 text-spert-text dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Storage */}
      <section>
        <h3 className={sectionHeaderClass}>Storage</h3>
        <div className="space-y-4">
          <div>
            <span className={labelClass}>Data storage mode</span>
            <p className={descriptionClass}>
              Local stores data in your browser only. Cloud syncs data to Firebase for cross-device access.
            </p>
          </div>

          {!user && (
            <p className="text-sm text-spert-text-muted dark:text-gray-400 italic">
              Sign in above to enable cloud storage.
            </p>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="storageMode"
                value="local"
                checked={mode === 'local'}
                onChange={() => handleModeChange('local')}
                className="cursor-pointer"
              />
              <span className="text-sm text-spert-text dark:text-gray-200">Local</span>
            </label>
            <label className={`flex items-center gap-2 ${user ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
              <input
                type="radio"
                name="storageMode"
                value="cloud"
                checked={mode === 'cloud'}
                onChange={() => handleModeChange('cloud')}
                disabled={!user}
                className={user ? 'cursor-pointer' : 'cursor-not-allowed'}
              />
              <span className="text-sm text-spert-text dark:text-gray-200">Cloud</span>
            </label>
          </div>

          {/* Migration prompt */}
          {showMigrationPrompt && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg space-y-2">
              <p className="text-sm text-spert-text dark:text-gray-200">
                You have {projects.length} project{projects.length !== 1 ? 's' : ''} stored locally.
                Would you like to upload them to the cloud?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="px-3 py-1.5 text-sm font-medium rounded bg-spert-blue text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  {isMigrating ? 'Uploading...' : 'Upload to Cloud'}
                </button>
                <button
                  onClick={handleSkipMigration}
                  disabled={isMigrating}
                  className="px-3 py-1.5 text-sm font-medium rounded border border-spert-border dark:border-gray-600 text-spert-text dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Migration result */}
          {migrationResult && (
            <div className={`p-3 rounded-lg text-sm ${
              migrationResult.errors.length > 0
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700'
                : 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
            }`}>
              <p className="text-spert-text dark:text-gray-200">
                Uploaded {migrationResult.projectsUploaded} project{migrationResult.projectsUploaded !== 1 ? 's' : ''} to the cloud.
                {migrationResult.settingsUploaded && ' Settings synced.'}
              </p>
              {migrationResult.errors.map((err, i) => (
                <p key={i} className="text-yellow-700 dark:text-yellow-300 mt-1">{err}</p>
              ))}
            </div>
          )}

          {/* Current status */}
          {user && (
            <p className="text-xs text-spert-text-muted dark:text-gray-400">
              Storage mode: <span className="font-semibold">{mode === 'cloud' ? 'Cloud' : 'Local'}</span>
            </p>
          )}
        </div>
      </section>
    </>
  )
}
