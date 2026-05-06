// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

import type { Project, Sprint, Milestone } from '@/shared/types'
import type { ExportData } from './import-validation'

// --- Types ---

export interface StoryMapExportData extends ExportData {
  source: 'spert-story-map'
}

export interface ProjectSubsetExportData extends ExportData {
  _exportType: 'spert-forecaster-project-export'
}

export interface MergeAction {
  type: 'update-existing' | 'add-new'
  importedProject: Project
  existingProject?: Project // only for 'update-existing'
  milestonesReplaced: number // existing milestone count being replaced
  milestonesIncoming: number // incoming milestone count
  newSprintCount: number // sprints that will be added
  skippedSprintCount: number // sprints skipped (already exist by sprintNumber)
}

export interface MergePlan {
  actions: MergeAction[]
  totalNewSprints: number
  totalUpdatedProjects: number
  totalNewProjects: number
}

// --- Detection ---

/**
 * Check whether parsed import data originated from SPERT Story Map.
 */
export function isStoryMapExport(data: unknown): data is StoryMapExportData {
  if (!data || typeof data !== 'object') return false
  return (data as Record<string, unknown>).source === 'spert-story-map'
}

/**
 * Check whether parsed import data is a per-project (or multi-project) subset
 * export produced by `exportSingleProject` / `exportSelectedProjects`. These
 * files merge additively into the existing workspace rather than replacing it.
 */
export function isProjectSubsetExport(data: unknown): data is ProjectSubsetExportData {
  if (!data || typeof data !== 'object') return false
  return (data as Record<string, unknown>)._exportType === 'spert-forecaster-project-export'
}

// --- Subset merge ---

export interface SubsetMergePlan {
  addedProjects: number
  updatedProjects: number
  addedSprints: number
  skippedSprints: number
}

/**
 * Build a plan describing what will happen when a project-subset export is
 * merged into existing state. Match by project ID first, then by case-
 * insensitive name. Sprints match within a project by `sprintNumber`.
 */
export function buildSubsetMergePlan(
  existingProjects: Project[],
  existingSprints: Sprint[],
  importData: ProjectSubsetExportData,
): SubsetMergePlan {
  let addedProjects = 0
  let updatedProjects = 0
  let addedSprints = 0
  let skippedSprints = 0

  for (const imported of importData.projects) {
    const match =
      existingProjects.find((p) => p.id === imported.id) ??
      existingProjects.find((p) => normalise(p.name) === normalise(imported.name))

    const targetId = match ? match.id : imported.id
    if (match) updatedProjects++
    else addedProjects++

    const existingSprintNumbers = new Set(
      existingSprints.filter((s) => s.projectId === targetId).map((s) => s.sprintNumber),
    )

    const importedSprints = importData.sprints.filter((s) => s.projectId === imported.id)
    for (const s of importedSprints) {
      if (existingSprintNumbers.has(s.sprintNumber)) skippedSprints++
      else addedSprints++
    }
  }

  return { addedProjects, updatedProjects, addedSprints, skippedSprints }
}

/**
 * Apply a subset import: existing projects (matched by ID or case-insensitive
 * name) are updated with imported fields (preserving existing milestones if
 * incoming has none); new projects are appended with fresh IDs. Sprints are
 * appended with fresh IDs, skipping any whose `sprintNumber` already exists
 * for the target project.
 */
export function applySubsetMerge(
  existingProjects: Project[],
  existingSprints: Sprint[],
  importData: ProjectSubsetExportData,
): { projects: Project[]; sprints: Sprint[] } {
  const projects = [...existingProjects]
  const sprints = [...existingSprints]
  const timestamp = now()

  for (const imported of importData.projects) {
    const matchIdx = projects.findIndex(
      (p) => p.id === imported.id || normalise(p.name) === normalise(imported.name),
    )

    let targetId: string

    if (matchIdx !== -1) {
      const existing = projects[matchIdx]
      targetId = existing.id
      projects[matchIdx] = {
        ...existing,
        name: imported.name,
        unitOfMeasure: imported.unitOfMeasure,
        sprintCadenceWeeks: imported.sprintCadenceWeeks ?? existing.sprintCadenceWeeks,
        firstSprintStartDate: imported.firstSprintStartDate ?? existing.firstSprintStartDate,
        projectStartDate: imported.projectStartDate ?? existing.projectStartDate,
        projectFinishDate: imported.projectFinishDate ?? existing.projectFinishDate,
        productivityAdjustments:
          imported.productivityAdjustments && imported.productivityAdjustments.length > 0
            ? freshAdjustments(imported.productivityAdjustments)
            : existing.productivityAdjustments,
        milestones:
          imported.milestones && imported.milestones.length > 0
            ? freshMilestones(imported.milestones)
            : existing.milestones,
        updatedAt: timestamp,
      }
    } else {
      targetId = generateId()
      projects.push({
        ...imported,
        id: targetId,
        productivityAdjustments: freshAdjustments(imported.productivityAdjustments),
        milestones: freshMilestones(imported.milestones),
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }

    const existingSprintNumbers = new Set(
      sprints.filter((s) => s.projectId === targetId).map((s) => s.sprintNumber),
    )

    const importedSprints = importData.sprints.filter((s) => s.projectId === imported.id)
    for (const s of importedSprints) {
      if (existingSprintNumbers.has(s.sprintNumber)) continue
      sprints.push({
        ...s,
        id: generateId(),
        projectId: targetId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }
  }

  return { projects, sprints }
}

function freshAdjustments(
  adjustments: Project['productivityAdjustments'],
): Project['productivityAdjustments'] {
  if (!adjustments) return []
  const timestamp = now()
  return adjustments.map((a) => ({
    ...a,
    id: generateId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}

// --- Plan building ---

function normalise(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Build a merge plan describing what will happen when the Story Map export
 * is merged into the existing Forecaster state.
 */
export function buildMergePlan(
  existingProjects: Project[],
  existingSprints: Sprint[],
  importData: StoryMapExportData,
): MergePlan {
  const actions: MergeAction[] = []

  for (const imported of importData.projects) {
    const match = existingProjects.find(
      (ep) => normalise(ep.name) === normalise(imported.name),
    )

    if (match) {
      // Find sprint numbers already recorded for this project
      const existingSprintNumbers = new Set(
        existingSprints
          .filter((s) => s.projectId === match.id)
          .map((s) => s.sprintNumber),
      )

      const importedSprintsForProject = importData.sprints.filter(
        (s) => s.projectId === imported.id,
      )

      const newSprints = importedSprintsForProject.filter(
        (s) => !existingSprintNumbers.has(s.sprintNumber),
      )
      const skippedSprints = importedSprintsForProject.filter(
        (s) => existingSprintNumbers.has(s.sprintNumber),
      )

      actions.push({
        type: 'update-existing',
        importedProject: imported,
        existingProject: match,
        milestonesReplaced: match.milestones?.length ?? 0,
        milestonesIncoming: imported.milestones?.length ?? 0,
        newSprintCount: newSprints.length,
        skippedSprintCount: skippedSprints.length,
      })
    } else {
      const importedSprintsForProject = importData.sprints.filter(
        (s) => s.projectId === imported.id,
      )

      actions.push({
        type: 'add-new',
        importedProject: imported,
        milestonesReplaced: 0,
        milestonesIncoming: imported.milestones?.length ?? 0,
        newSprintCount: importedSprintsForProject.length,
        skippedSprintCount: 0,
      })
    }
  }

  return {
    actions,
    totalNewSprints: actions.reduce((sum, a) => sum + a.newSprintCount, 0),
    totalUpdatedProjects: actions.filter((a) => a.type === 'update-existing').length,
    totalNewProjects: actions.filter((a) => a.type === 'add-new').length,
  }
}

// --- Plan application ---

const generateId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

function freshMilestones(milestones: Milestone[] | undefined): Milestone[] {
  if (!milestones) return []
  const timestamp = now()
  return milestones.map((m) => ({
    ...m,
    id: generateId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}

/**
 * Apply the merge plan, returning the new full state (projects + sprints).
 * Existing data not referenced in the import is preserved unchanged.
 */
export function applyMergePlan(
  existingProjects: Project[],
  existingSprints: Sprint[],
  importData: StoryMapExportData,
  plan: MergePlan,
): { projects: Project[]; sprints: Sprint[] } {
  // Start with copies
  const projects = [...existingProjects]
  const sprints = [...existingSprints]
  const timestamp = now()

  for (const action of plan.actions) {
    if (action.type === 'update-existing' && action.existingProject) {
      const existingId = action.existingProject.id
      const idx = projects.findIndex((p) => p.id === existingId)
      if (idx === -1) continue

      // Replace milestones, preserve everything else
      projects[idx] = {
        ...projects[idx],
        milestones: freshMilestones(action.importedProject.milestones),
        // Fill optional fields from import if not already set
        sprintCadenceWeeks:
          projects[idx].sprintCadenceWeeks ?? action.importedProject.sprintCadenceWeeks,
        firstSprintStartDate:
          projects[idx].firstSprintStartDate ?? action.importedProject.firstSprintStartDate,
        updatedAt: timestamp,
      }

      // Add only non-overlapping sprints
      const existingSprintNumbers = new Set(
        sprints
          .filter((s) => s.projectId === existingId)
          .map((s) => s.sprintNumber),
      )

      const importedSprintsForProject = importData.sprints.filter(
        (s) => s.projectId === action.importedProject.id,
      )

      for (const s of importedSprintsForProject) {
        if (!existingSprintNumbers.has(s.sprintNumber)) {
          sprints.push({
            ...s,
            id: generateId(),
            projectId: existingId,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        }
      }
    } else if (action.type === 'add-new') {
      const newProjectId = generateId()

      projects.push({
        ...action.importedProject,
        id: newProjectId,
        milestones: freshMilestones(action.importedProject.milestones),
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      const importedSprintsForProject = importData.sprints.filter(
        (s) => s.projectId === action.importedProject.id,
      )

      for (const s of importedSprintsForProject) {
        sprints.push({
          ...s,
          id: generateId(),
          projectId: newProjectId,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }
  }

  return { projects, sprints }
}
