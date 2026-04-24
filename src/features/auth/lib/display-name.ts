// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

/**
 * Firebase Auth via Microsoft (Azure AD / Entra ID) frequently returns
 * displayName in "Last, First MI" format due to Active Directory conventions.
 * Normalize to natural reading order "First MI Last".
 */
export function normalizeDisplayName(displayName: string | null | undefined): string {
  if (!displayName) return ''
  const trimmed = displayName.trim()
  if (!trimmed) return ''
  if (trimmed.includes(',')) {
    const [last, firstAndMiddle] = trimmed.split(/,\s*/, 2)
    if (last && firstAndMiddle) {
      return `${firstAndMiddle.trim()} ${last.trim()}`.trim()
    }
  }
  return trimmed
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
