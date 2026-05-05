// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

'use client'

import { Suspense } from 'react'
import { useInvitationLanding } from '@/features/auth/hooks/useInvitationLanding'
import { useAuth } from '@/shared/providers/AuthProvider'
import { useStorageModeStore } from '@/shared/state/storage-mode-store'
import { SignInButtons } from '@/features/auth/components/SignInButtons'

/**
 * Three-state landing banner for bulk invitations:
 *
 *   idle      — renders nothing
 *   pre_auth  — blue banner with sign-in CTAs (the SignInButtons component
 *               preserves the ToS consent gate and provider-logo styling)
 *   claimed   — green banner confirming the user was added to the project(s);
 *               when the local store is still in 'local' mode, also shows a
 *               "Switch to Cloud Storage in Settings" hint so the user knows
 *               where the project will appear
 *
 * Inner content is wrapped in `<Suspense fallback={null}>` because
 * useInvitationLanding calls `useSearchParams()`, which Next.js requires to
 * be inside a Suspense boundary in App Router builds.
 */
function InvitationBannerInner() {
  const { state, claimedNames, dismiss } = useInvitationLanding()
  const { isFirebaseAvailable } = useAuth()
  const mode = useStorageModeStore((s) => s.mode)

  if (state === 'idle') return null

  if (state === 'pre_auth') {
    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-sm text-spert-text dark:text-gray-200">
            You&apos;ve been invited to collaborate on a project. Sign in with the
            email address that received this invitation.
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss invitation banner"
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
          >
            ✕
          </button>
        </div>
        {isFirebaseAvailable ? (
          <SignInButtons fullLabel />
        ) : (
          <p className="text-sm text-spert-text-muted dark:text-gray-400">
            Cloud sign-in is unavailable in this build.
          </p>
        )}
      </div>
    )
  }

  // state === 'claimed'
  return (
    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-spert-text dark:text-gray-200">
          You&apos;ve been added to: <strong>{claimedNames.join(', ')}</strong>
        </p>
        {mode === 'local' && (
          <p className="text-xs text-spert-text-muted dark:text-gray-400 mt-1">
            Switch to Cloud Storage in Settings to view this project.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 px-3 py-1 text-xs font-medium rounded border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  )
}

export function InvitationBanner() {
  return (
    <Suspense fallback={null}>
      <InvitationBannerInner />
    </Suspense>
  )
}
