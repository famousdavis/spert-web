// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/shared/providers/AuthProvider'
import { useStorageModeStore } from '@/shared/state/storage-mode-store'
import { useProjectStore } from '@/shared/state/project-store'
import { INVITATIONS_ENABLED } from '@/lib/feature-flags'
import type { SpertModelsChangedDetail } from '@/shared/firebase/types'

const SESSION_KEY = 'spert_invite_token'
const CLAIM_GRACE_MS = 10000

type InvitationState = 'idle' | 'pre_auth' | 'claimed'

interface UseInvitationLandingResult {
  state: InvitationState
  claimedNames: string[]
  dismiss: () => void
}

/**
 * Drives the InvitationBanner state machine for the bulk-invitation landing
 * flow:
 *
 *   idle      — nothing to show
 *   pre_auth  — user hit /?invite=<token> and is not yet signed in (or signed
 *               in with an email that didn't match — see grace timer)
 *   claimed   — claimPendingInvitations succeeded and dispatched
 *               spert:models-changed; banner shows "you've been added to X"
 *
 * Three effects:
 *
 *   1. Mount + URL capture. Reads ?invite=, strips the param via router.replace,
 *      stores the token in sessionStorage so it survives the OAuth round-trip,
 *      and (when the local store is empty) flips storage mode to cloud so the
 *      claimed project is visible. `hasRunRef` body-guards re-runs from
 *      StrictMode and dep changes after the first execution.
 *
 *   2. 10-second grace timer. When `user` becomes non-null while in pre_auth,
 *      AuthProvider has already fired claimPendingInvitations. Wait up to
 *      CLAIM_GRACE_MS for the spert:models-changed event; on timeout, fall
 *      back to idle so the banner doesn't stick around when the user signed
 *      in with an email that didn't match the invitation. Cleanup clears the
 *      timer; if the user signs out (user → null) the cleanup fires and the
 *      state stays pre_auth (SignInButtons re-renders).
 *
 *   3. spert:models-changed listener. Mounted once at component mount
 *      (deps=[]). Handler does NOT gate on state — AuthProvider only
 *      dispatches when claimed.length > 0, so any non-empty event is a
 *      legitimate transition to `claimed`. Dropping the state gate avoids the
 *      stale-closure race that would otherwise come with deps=[user, state].
 *
 * Known v0.26.0 limitations (documented in PR body):
 *   - C1: setMode('cloud') only when localProjectCount === 0. Users with
 *     local content who click an invite link must migrate via Settings →
 *     Storage Mode to see the shared project. The banner shows a hint.
 *   - C3: signed-in user clicks an invite for a different email → banner
 *     auto-dismisses after 10 seconds with no visible error.
 *   - N9: hasRunRef prevents capturing a second invite link in the same
 *     session. Workaround: hard refresh.
 */
export function useInvitationLanding(): UseInvitationLandingResult {
  const { user, isFirebaseAvailable } = useAuth()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState<InvitationState>('idle')
  const [claimedNames, setClaimedNames] = useState<string[]>([])
  const hasRunRef = useRef(false)

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_KEY)
    setState('idle')
    setClaimedNames([])
  }, [])

  // Effect 1: URL param capture + sessionStorage restore.
  useEffect(() => {
    if (!INVITATIONS_ENABLED) return
    if (typeof window === 'undefined') return
    if (hasRunRef.current) return
    hasRunRef.current = true

    const tokenFromUrl = searchParams.get('invite')

    if (tokenFromUrl) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('invite')
      const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname
      router.replace(newUrl, { scroll: false })

      if (isFirebaseAvailable) {
        const localProjectCount = useProjectStore.getState().projects.length
        if (localProjectCount === 0) {
          useStorageModeStore.getState().setMode('cloud')
        }
      }

      sessionStorage.setItem(SESSION_KEY, tokenFromUrl)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external state (URL search params + sessionStorage) into local state on mount; the hasRunRef body-guard ensures this only runs once
      setState('pre_auth')
      return
    }

    const tokenFromSession = sessionStorage.getItem(SESSION_KEY)
    if (tokenFromSession) {
      if (isFirebaseAvailable) {
        const localProjectCount = useProjectStore.getState().projects.length
        if (localProjectCount === 0) {
          useStorageModeStore.getState().setMode('cloud')
        }
      }
      setState('pre_auth')
    }
  }, [searchParams, pathname, router, isFirebaseAvailable])

  // Effect 2: grace timer for the pre_auth → claimed transition.
  useEffect(() => {
    if (!INVITATIONS_ENABLED) return
    if (typeof window === 'undefined') return
    if (state !== 'pre_auth') return
    if (!user) return

    const timeout = setTimeout(() => {
      sessionStorage.removeItem(SESSION_KEY)
      setState('idle')
    }, CLAIM_GRACE_MS)

    return () => clearTimeout(timeout)
  }, [state, user])

  // Effect 3: spert:models-changed listener (mount-only).
  useEffect(() => {
    if (!INVITATIONS_ENABLED) return
    if (typeof window === 'undefined') return

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SpertModelsChangedDetail>).detail
      const names = (detail?.claimed ?? []).map((c) => c.modelName).filter(Boolean)
      if (names.length === 0) return
      sessionStorage.removeItem(SESSION_KEY)
      setClaimedNames(names)
      setState('claimed')
    }

    window.addEventListener('spert:models-changed', handler)
    return () => window.removeEventListener('spert:models-changed', handler)
  }, [])

  return { state, claimedNames, dismiss }
}
