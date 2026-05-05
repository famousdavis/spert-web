// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

// Feature flags for staged client rollouts. Toggle in a separate, single-file
// PR after the corresponding server-side prerequisites (Cloud Functions, CSP,
// Firestore rules) have shipped.

/**
 * Bulk email-based invitation flow.
 *
 * Flag-OFF: SharingSection renders the legacy single-email shareProject path.
 *           AuthProvider does not call claimPendingInvitations.
 *           InvitationBanner / useInvitationLanding short-circuit to idle.
 *
 * Flag-ON:  SharingSection renders the bulk textarea + pending list +
 *           Resend/Revoke. AuthProvider claims pending tokens on every auth
 *           resolution. InvitationBanner becomes active.
 *
 * Prerequisites for flag flip:
 *   - PR 2 (spert-landing-page) deployed: spertforecaster registered in
 *     functions/src/invitationMailer.tsx, Cloud Functions deployed, CORS
 *     smoke-test passing.
 *   - CSP gate verified on a Vercel preview URL (zero CSP errors during
 *     callable invocations).
 *   - spertsuite_invitations / spertsuite_profiles / spertsuite_rate_limits /
 *     spertsuite_notification_throttle Firestore rules deployed in spert-suite
 *     project.
 */
export const INVITATIONS_ENABLED = false
