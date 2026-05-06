// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

import { describe, it, expect } from 'vitest'
import {
  slugifyProjectName,
  buildProjectSubsetExport,
  PROJECT_SUBSET_EXPORT_TYPE,
  type ExportProjectsState,
} from './export-project'
import type { Project, Sprint } from '@/shared/types'
import type { ChangeLogEntry } from '@/shared/state/storage'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'My Project',
    unitOfMeasure: 'Story Points',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function sprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: 's1',
    projectId: 'p1',
    sprintNumber: 1,
    sprintStartDate: '2026-01-06',
    sprintFinishDate: '2026-01-17',
    doneValue: 20,
    includedInForecast: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeState(overrides: Partial<ExportProjectsState> = {}): ExportProjectsState {
  return {
    projects: [],
    sprints: [],
    originRef: 'origin-uuid',
    storageRef: 'storage-uuid',
    changeLog: [],
    ...overrides,
  }
}

describe('slugifyProjectName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyProjectName('My Cool Project')).toBe('my-cool-project')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugifyProjectName('Project: v2.0!')).toBe('project-v20')
  })

  it('collapses repeated hyphens and trims edges', () => {
    expect(slugifyProjectName('  --foo--bar--  ')).toBe('foo-bar')
  })

  it('caps length at 40 chars', () => {
    const long = 'a'.repeat(100)
    expect(slugifyProjectName(long)).toHaveLength(40)
  })

  it('falls back to "project" for empty input', () => {
    expect(slugifyProjectName('')).toBe('project')
    expect(slugifyProjectName('!!!')).toBe('project')
  })
})

describe('buildProjectSubsetExport', () => {
  const p1 = project({ id: 'p1', name: 'Alpha' })
  const p2 = project({ id: 'p2', name: 'Beta' })
  const s1 = sprint({ id: 's1', projectId: 'p1', sprintNumber: 1 })
  const s2 = sprint({ id: 's2', projectId: 'p1', sprintNumber: 2 })
  const s3 = sprint({ id: 's3', projectId: 'p2', sprintNumber: 1 })

  const log: ChangeLogEntry[] = [
    { t: 1, op: 'add', entity: 'project', id: 'p1' },
    { t: 2, op: 'add', entity: 'project', id: 'p2' },
    { t: 3, op: 'add', entity: 'sprint', id: 's1' },
    { t: 4, op: 'add', entity: 'sprint', id: 's3' },
    { t: 5, op: 'import', entity: 'dataset' },
  ]

  it('throws when no project IDs given', () => {
    expect(() =>
      buildProjectSubsetExport([], makeState({ projects: [p1], sprints: [s1] })),
    ).toThrow(/No projects/)
  })

  it('throws when selected project not found', () => {
    expect(() =>
      buildProjectSubsetExport(['missing'], makeState({ projects: [p1], sprints: [s1] })),
    ).toThrow(/not found/)
  })

  it('tags the export with the subset export type', () => {
    const result = buildProjectSubsetExport(
      ['p1'],
      makeState({ projects: [p1, p2], sprints: [s1, s3], changeLog: log }),
    )
    expect(result._exportType).toBe(PROJECT_SUBSET_EXPORT_TYPE)
  })

  it('includes only the selected projects and their sprints', () => {
    const result = buildProjectSubsetExport(
      ['p1'],
      makeState({ projects: [p1, p2], sprints: [s1, s2, s3], changeLog: log }),
    )
    expect(result.projects).toEqual([p1])
    expect(result.sprints).toEqual([s1, s2])
  })

  it('filters _changeLog to only events for selected projects + dataset events', () => {
    const result = buildProjectSubsetExport(
      ['p1'],
      makeState({ projects: [p1, p2], sprints: [s1, s3], changeLog: log }),
    )
    const ids = result._changeLog.map((e) => e.id)
    expect(ids).toContain('p1')
    expect(ids).toContain('s1')
    expect(ids).not.toContain('p2')
    expect(ids).not.toContain('s3')
    // dataset event (no id) is preserved
    expect(result._changeLog.some((e) => e.op === 'import' && !e.id)).toBe(true)
  })

  it('includes attribution when provided', () => {
    const result = buildProjectSubsetExport(
      ['p1'],
      makeState({
        projects: [p1],
        sprints: [s1],
        exportedBy: 'Jane Doe',
        exportedById: 'UF12345',
      }),
    )
    expect(result._exportedBy).toBe('Jane Doe')
    expect(result._exportedById).toBe('UF12345')
  })

  it('omits attribution fields when not provided', () => {
    const result = buildProjectSubsetExport(
      ['p1'],
      makeState({ projects: [p1], sprints: [s1] }),
    )
    expect(result._exportedBy).toBeUndefined()
    expect(result._exportedById).toBeUndefined()
  })

  it('preserves origin and storage refs', () => {
    const result = buildProjectSubsetExport(
      ['p1'],
      makeState({
        projects: [p1],
        sprints: [s1],
        originRef: 'orig-1',
        storageRef: 'store-1',
      }),
    )
    expect(result._originRef).toBe('orig-1')
    expect(result._storageRef).toBe('store-1')
  })

  it('handles multi-project selection', () => {
    const result = buildProjectSubsetExport(
      ['p1', 'p2'],
      makeState({ projects: [p1, p2], sprints: [s1, s2, s3] }),
    )
    expect(result.projects).toHaveLength(2)
    expect(result.sprints).toHaveLength(3)
  })
})
