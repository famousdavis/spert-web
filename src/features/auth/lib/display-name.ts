// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

import { denormalizeLastFirst } from '@/lib/auth-name'

/**
 * Firebase Auth via Microsoft (Azure AD / Entra ID) frequently returns
 * displayName in "Last, First MI" format due to Active Directory conventions.
 * Normalize to natural reading order "First MI Last".
 *
 * Delegates to the suite-wide canonical algorithm (denormalizeLastFirst,
 * mirrored from spert-landing-page/functions/src/mailHeaders.ts) so display
 * names rendered in the UI match the names the invitation mailer writes to
 * outgoing email From-headers.
 */
export function normalizeDisplayName(displayName: string | null | undefined): string {
  if (!displayName) return ''
  return denormalizeLastFirst(displayName)
}

/** Extract first-word first name from a (possibly unnormalized) display name. */
export function firstNameFromDisplayName(
  displayName: string | null | undefined,
  fallback = ''
): string {
  const normalized = normalizeDisplayName(displayName)
  if (!normalized) return fallback
  return normalized.split(/\s+/)[0] ?? fallback
}
