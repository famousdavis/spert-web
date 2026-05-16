// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

// Sample project seeder for the empty-state "Load Sample Project" CTA.
// New users see a working forecast on first session instead of staring at empty form fields.
//
// Design constraints captured in the v0.31.1 plan:
//  - Generic agile content (NOT NCCI-flavored) to avoid optical concerns
//  - Name is the IDEMPOTENCY KEY: if a project with this name already exists, the seeder
//    no-ops and fires a friendly toast (Delta I). No deterministic ids because all
//    project-store add* actions generate ids internally.
//  - Required Project fields per src/shared/types/index.ts: name, unitOfMeasure, plus
//    firstSprintStartDate is technically optional in the type but the burn-up chart uses
//    a non-null assertion on it — undefined would crash. Set it explicitly.
//  - All sprint dates go through calculateSprintStartDate / calculateSprintFinishDate
//    (which ensures business-day finish dates via getPrecedingBusinessDay). Never
//    hand-roll dates.
//  - Every sprint MUST have includedInForecast: true. The Forecast tab's auto-derivation
//    of remainingBacklog (useForecastInputs.ts) reads from useSprintData's filtered set,
//    which keeps only includedInForecast === true. If any sprint has false, the seed's
//    "200 pre-fill backlog" promise breaks silently.
//  - Last sprint's backlogAtSprintEnd = 200 is the pre-fill source. No setForecastInput
//    needed — auto-derivation handles it on every page load (sprints are persisted,
//    forecastInputs are session-only).

import { toast } from 'sonner'
import { useProjectStore } from '@/shared/state/project-store'
import { addDays, addWeeks, today, calculateSprintStartDate, calculateSprintFinishDate } from '@/shared/lib/dates'

export const SAMPLE_PROJECT_NAME = 'Sample: Mobile App Launch'

// Hand-chosen velocity sequence: moderate variability with a couple of small dips.
// Tunable but deliberately not too noisy — the burn-up should look "well-behaved" but
// not perfectly flat. Eight sprints aligns with the MIN_SPRINTS_FOR_BOOTSTRAP threshold
// (5) so the Bootstrap distribution is available if the user re-enables it in Settings.
const SAMPLE_VELOCITIES = [38, 45, 42, 35, 48, 44, 41, 47] as const

// Declining backlog: starts at ~540 (sum of velocities + final backlog), ends at 200.
// The final entry (200) is what the Forecast tab pre-fills as remainingBacklog via the
// auto-derivation in useForecastInputs.ts:63-66.
const SAMPLE_BACKLOG_AT_SPRINT_END = [502, 457, 415, 380, 332, 288, 247, 200] as const

const SPRINT_CADENCE_WEEKS = 2 as const
const SPRINT_COUNT = 8

/**
 * Load the sample project into the store. Idempotent against double-clicks via name-guard:
 * if a project named SAMPLE_PROJECT_NAME already exists (regardless of whether the user
 * created it or this seeder did), the call is a no-op and a friendly toast surfaces.
 *
 * Plain module function — uses useProjectStore.getState() (NOT hooks) because it's invoked
 * from event handlers, not from a React render path.
 */
export function loadSampleProject(): void {
  const store = useProjectStore.getState()

  // Idempotency guard (Delta I)
  if (store.projects.find((p) => p.name === SAMPLE_PROJECT_NAME)) {
    toast.info(`A project named "${SAMPLE_PROJECT_NAME}" already exists.`)
    return
  }

  // First sprint date: walk back 16 weeks from today so the last sprint ends around now.
  // No bespoke "snap to Monday" — calculateSprintFinishDate uses getPrecedingBusinessDay
  // internally, which guarantees the finish-date side is always a business day. The
  // start-date weekday inherits from whatever today minus 16 weeks lands on.
  const firstSprintStartDate = addWeeks(today(), -16)

  store.addProject({
    name: SAMPLE_PROJECT_NAME,
    unitOfMeasure: 'story points',
    sprintCadenceWeeks: SPRINT_CADENCE_WEEKS,
    firstSprintStartDate,
    productivityAdjustments: [],
    milestones: [],
  })

  // addProject generates the id internally — recover it from store state (Zustand set
  // is synchronous, so this works without delay).
  const newProjectId = useProjectStore.getState().projects.find((p) => p.name === SAMPLE_PROJECT_NAME)?.id
  if (!newProjectId) {
    toast.error('Failed to seed sample project.')
    return
  }

  // Seed eight sprints. Dates flow through the shared date helpers so finish dates
  // always land on a business day.
  for (let i = 0; i < SPRINT_COUNT; i++) {
    const sprintNumber = i + 1
    const sprintStartDate = calculateSprintStartDate(firstSprintStartDate, sprintNumber, SPRINT_CADENCE_WEEKS)
    const sprintFinishDate = calculateSprintFinishDate(sprintStartDate, SPRINT_CADENCE_WEEKS)

    useProjectStore.getState().addSprint({
      projectId: newProjectId,
      sprintNumber,
      sprintStartDate,
      sprintFinishDate,
      doneValue: SAMPLE_VELOCITIES[i],
      backlogAtSprintEnd: SAMPLE_BACKLOG_AT_SPRINT_END[i],
      includedInForecast: true, // non-negotiable; see file header
    })
  }

  // One milestone and one productivity adjustment to illustrate the features. Both are
  // optional — could be dropped if seeder surface becomes a concern.
  useProjectStore.getState().addMilestone(newProjectId, {
    name: 'MVP Release',
    backlogSize: 100,
    color: '#3b82f6',
  })

  // Productivity adjustment: a five-day "Holiday Week" 10 weeks into the seeded timeline
  // (lands inside sprint 5 at 2-week cadence). Factor 0.5 = half productivity.
  const adjStart = addWeeks(firstSprintStartDate, 10)
  const adjEnd = addDays(adjStart, 4)
  useProjectStore.getState().addProductivityAdjustment(newProjectId, {
    name: 'Holiday Week',
    startDate: adjStart,
    endDate: adjEnd,
    factor: 0.5,
    enabled: true,
  })

  toast.success(`Loaded "${SAMPLE_PROJECT_NAME}" — eight sprints, one milestone, one productivity adjustment.`)
}
