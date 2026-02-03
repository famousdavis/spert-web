import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Sprint, ProductivityAdjustment } from '@/shared/types'
import { storage, STORAGE_KEY } from './storage'
import { APP_VERSION } from '@/shared/constants'
import { type BurnUpConfig, DEFAULT_BURN_UP_CONFIG } from '@/shared/types/burn-up'

export interface ExportData {
  version: string
  exportedAt: string
  projects: Project[]
  sprints: Sprint[]
}

// Session-only forecast inputs (per project, not persisted to localStorage)
interface ForecastInputs {
  remainingBacklog: string
  velocityMean: string
  velocityStdDev: string
}

interface ProjectState {
  projects: Project[]
  sprints: Sprint[]
  viewingProjectId: string | null // Shared across Sprint History and Forecast tabs
  forecastInputs: Record<string, ForecastInputs> // projectId -> inputs (session only)
  burnUpConfigs: Record<string, BurnUpConfig> // projectId -> config (session only)

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void
  deleteProject: (id: string) => void
  reorderProjects: (projectIds: string[]) => void
  setViewingProjectId: (id: string | null) => void

  // Sprint actions
  addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSprint: (id: string, updates: Partial<Omit<Sprint, 'id' | 'projectId' | 'createdAt'>>) => void
  deleteSprint: (id: string) => void
  toggleSprintIncluded: (id: string) => void

  // Productivity Adjustment actions
  addProductivityAdjustment: (
    projectId: string,
    adjustment: Omit<ProductivityAdjustment, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  updateProductivityAdjustment: (
    projectId: string,
    adjustmentId: string,
    updates: Partial<Omit<ProductivityAdjustment, 'id' | 'createdAt'>>
  ) => void
  deleteProductivityAdjustment: (projectId: string, adjustmentId: string) => void

  // Import/Export actions
  exportData: () => ExportData
  importData: (data: ExportData) => void

  // Forecast input actions (session only)
  setForecastInput: (projectId: string, field: keyof ForecastInputs, value: string) => void
  getForecastInputs: (projectId: string) => ForecastInputs

  // Burn-up config actions (session only)
  setBurnUpConfig: (projectId: string, config: BurnUpConfig) => void
  getBurnUpConfig: (projectId: string) => BurnUpConfig
}

const generateId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

// Validation constants
const MAX_STRING_LENGTH = 200
const MAX_NUMERIC_VALUE = 999999
const MIN_SPRINT_NUMBER = 1
const MAX_SPRINT_NUMBER = 10000
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validate ISO date string format (YYYY-MM-DD) and check if it's a valid date
 */
function isValidIsoDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false
  if (!DATE_REGEX.test(dateStr)) return false

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return false

  // Verify the date wasn't auto-corrected (e.g., "2026-02-30" -> "2026-03-02")
  const [year, month, day] = dateStr.split('-').map(Number)
  return date.getUTCFullYear() === year &&
         date.getUTCMonth() === month - 1 &&
         date.getUTCDate() === day
}

/**
 * Validate a number is finite and within bounds
 */
function isValidNumber(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

/**
 * Validate that imported data has the expected shape before loading it into the store.
 * Throws a descriptive error if validation fails.
 */
export function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') {
    throw new Error('Import data must be a JSON object.')
  }

  const d = data as Record<string, unknown>

  if (!Array.isArray(d.projects)) {
    throw new Error('Import data is missing a valid "projects" array.')
  }
  if (!Array.isArray(d.sprints)) {
    throw new Error('Import data is missing a valid "sprints" array.')
  }

  // Track project IDs to detect duplicates
  const projectIds = new Set<string>()

  for (let i = 0; i < d.projects.length; i++) {
    const p = d.projects[i] as Record<string, unknown> | null
    if (!p || typeof p !== 'object') {
      throw new Error(`Project at index ${i} is not a valid object.`)
    }
    if (typeof p.id !== 'string' || !p.id) {
      throw new Error(`Project at index ${i} is missing a valid "id".`)
    }
    if (projectIds.has(p.id)) {
      throw new Error(`Duplicate project ID "${p.id}" found at index ${i}.`)
    }
    projectIds.add(p.id)

    if (typeof p.name !== 'string' || !p.name) {
      throw new Error(`Project at index ${i} is missing a valid "name".`)
    }
    if (p.name.length > MAX_STRING_LENGTH) {
      throw new Error(`Project at index ${i} has a name exceeding ${MAX_STRING_LENGTH} characters.`)
    }
    if (typeof p.unitOfMeasure !== 'string') {
      throw new Error(`Project at index ${i} is missing a valid "unitOfMeasure".`)
    }
    if (p.unitOfMeasure.length > MAX_STRING_LENGTH) {
      throw new Error(`Project at index ${i} has a unitOfMeasure exceeding ${MAX_STRING_LENGTH} characters.`)
    }

    // Validate optional sprintCadenceWeeks
    if (p.sprintCadenceWeeks !== undefined && !isValidNumber(p.sprintCadenceWeeks, 1, 52)) {
      throw new Error(`Project at index ${i} has invalid sprintCadenceWeeks (must be 1-52).`)
    }

    // Validate optional firstSprintStartDate
    if (p.firstSprintStartDate !== undefined && !isValidIsoDate(p.firstSprintStartDate)) {
      throw new Error(`Project at index ${i} has invalid firstSprintStartDate (must be YYYY-MM-DD format).`)
    }
  }

  // Track sprint IDs to detect duplicates
  const sprintIds = new Set<string>()

  for (let i = 0; i < d.sprints.length; i++) {
    const s = d.sprints[i] as Record<string, unknown> | null
    if (!s || typeof s !== 'object') {
      throw new Error(`Sprint at index ${i} is not a valid object.`)
    }
    if (typeof s.id !== 'string' || !s.id) {
      throw new Error(`Sprint at index ${i} is missing a valid "id".`)
    }
    if (sprintIds.has(s.id)) {
      throw new Error(`Duplicate sprint ID "${s.id}" found at index ${i}.`)
    }
    sprintIds.add(s.id)

    if (typeof s.projectId !== 'string' || !s.projectId) {
      throw new Error(`Sprint at index ${i} is missing a valid "projectId".`)
    }

    // Validate sprintNumber is a positive integer within range
    if (!isValidNumber(s.sprintNumber, MIN_SPRINT_NUMBER, MAX_SPRINT_NUMBER)) {
      throw new Error(`Sprint at index ${i} has invalid sprintNumber (must be ${MIN_SPRINT_NUMBER}-${MAX_SPRINT_NUMBER}).`)
    }
    if (!Number.isInteger(s.sprintNumber)) {
      throw new Error(`Sprint at index ${i} has non-integer sprintNumber.`)
    }

    // Validate doneValue is non-negative and within range
    if (!isValidNumber(s.doneValue, 0, MAX_NUMERIC_VALUE)) {
      throw new Error(`Sprint at index ${i} has invalid doneValue (must be 0-${MAX_NUMERIC_VALUE}).`)
    }

    // Validate optional backlogAtSprintEnd
    if (s.backlogAtSprintEnd !== undefined && !isValidNumber(s.backlogAtSprintEnd, 0, MAX_NUMERIC_VALUE)) {
      throw new Error(`Sprint at index ${i} has invalid backlogAtSprintEnd (must be 0-${MAX_NUMERIC_VALUE}).`)
    }

    // Validate sprint dates
    if (s.sprintStartDate !== undefined && !isValidIsoDate(s.sprintStartDate)) {
      throw new Error(`Sprint at index ${i} has invalid sprintStartDate (must be YYYY-MM-DD format).`)
    }
    if (s.sprintFinishDate !== undefined && !isValidIsoDate(s.sprintFinishDate)) {
      throw new Error(`Sprint at index ${i} has invalid sprintFinishDate (must be YYYY-MM-DD format).`)
    }
  }

  return true
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [] as Project[],
      sprints: [] as Sprint[],
      viewingProjectId: null as string | null,
      forecastInputs: {} as Record<string, ForecastInputs>,
      burnUpConfigs: {} as Record<string, BurnUpConfig>,

      addProject: (projectData) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              ...projectData,
              id: generateId(),
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => {
          const { [id]: _forecastInputs, ...remainingForecastInputs } = state.forecastInputs
          const { [id]: _burnUpConfig, ...remainingBurnUpConfigs } = state.burnUpConfigs
          const remainingProjects = state.projects.filter((p) => p.id !== id)
          return {
            projects: remainingProjects,
            sprints: state.sprints.filter((s) => s.projectId !== id),
            forecastInputs: remainingForecastInputs,
            burnUpConfigs: remainingBurnUpConfigs,
            viewingProjectId:
              state.viewingProjectId === id
                ? (remainingProjects[0]?.id ?? null)
                : state.viewingProjectId,
          }
        }),

      reorderProjects: (projectIds) =>
        set((state) => {
          const projectMap = new Map(state.projects.map((p) => [p.id, p]))
          return {
            projects: projectIds
              .map((id) => projectMap.get(id))
              .filter((p): p is Project => p !== undefined),
          }
        }),

      setViewingProjectId: (id) => set({ viewingProjectId: id }),

      addSprint: (sprintData) =>
        set((state) => ({
          sprints: [
            ...state.sprints,
            {
              ...sprintData,
              id: generateId(),
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        })),

      updateSprint: (id, updates) =>
        set((state) => ({
          sprints: state.sprints.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: now() } : s
          ),
        })),

      deleteSprint: (id) =>
        set((state) => ({
          sprints: state.sprints.filter((s) => s.id !== id),
        })),

      toggleSprintIncluded: (id) =>
        set((state) => ({
          sprints: state.sprints.map((s) =>
            s.id === id
              ? { ...s, includedInForecast: !s.includedInForecast, updatedAt: now() }
              : s
          ),
        })),

      addProductivityAdjustment: (projectId, adjustmentData) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  productivityAdjustments: [
                    ...(p.productivityAdjustments || []),
                    {
                      ...adjustmentData,
                      id: generateId(),
                      createdAt: now(),
                      updatedAt: now(),
                    },
                  ],
                  updatedAt: now(),
                }
              : p
          ),
        })),

      updateProductivityAdjustment: (projectId, adjustmentId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  productivityAdjustments: (p.productivityAdjustments || []).map((adj) =>
                    adj.id === adjustmentId
                      ? { ...adj, ...updates, updatedAt: now() }
                      : adj
                  ),
                  updatedAt: now(),
                }
              : p
          ),
        })),

      deleteProductivityAdjustment: (projectId, adjustmentId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  productivityAdjustments: (p.productivityAdjustments || []).filter(
                    (adj) => adj.id !== adjustmentId
                  ),
                  updatedAt: now(),
                }
              : p
          ),
        })),

      exportData: (): ExportData => {
        const state = get()
        return {
          version: APP_VERSION,
          exportedAt: now(),
          projects: state.projects,
          sprints: state.sprints,
        }
      },

      importData: (data: ExportData) => {
        validateImportData(data)
        if (data.version && data.version !== APP_VERSION) {
          console.info(`Importing data from version ${data.version} (current: ${APP_VERSION})`)
        }
        set(() => ({
          projects: data.projects,
          sprints: data.sprints,
        }))
      },

      setForecastInput: (projectId, field, value) =>
        set((state) => ({
          forecastInputs: {
            ...state.forecastInputs,
            [projectId]: {
              ...(state.forecastInputs[projectId] || { remainingBacklog: '', velocityMean: '', velocityStdDev: '' }),
              [field]: value,
            },
          },
        })),

      getForecastInputs: (projectId) => {
        const state = get()
        return state.forecastInputs[projectId] || { remainingBacklog: '', velocityMean: '', velocityStdDev: '' }
      },

      setBurnUpConfig: (projectId, config) =>
        set((state) => ({
          burnUpConfigs: {
            ...state.burnUpConfigs,
            [projectId]: config,
          },
        })),

      getBurnUpConfig: (projectId) => {
        const state = get()
        return state.burnUpConfigs[projectId] || DEFAULT_BURN_UP_CONFIG
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const value = storage.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: (name, value) => {
          storage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          storage.removeItem(name)
        },
      },
      // Only persist projects and sprints - viewingProjectId and forecastInputs are session-only
      partialize: (state) => ({
        projects: state.projects,
        sprints: state.sprints,
      } as ProjectState),
    }
  )
)

// Selectors
export const selectActiveProject = (state: ProjectState): Project | undefined =>
  state.projects[0]

export const selectViewingProject = (state: ProjectState): Project | undefined => {
  if (state.viewingProjectId) {
    return state.projects.find((p) => p.id === state.viewingProjectId) || state.projects[0]
  }
  return state.projects[0]
}

export const selectProjectSprints = (projectId: string) => (state: ProjectState): Sprint[] =>
  state.sprints.filter((s) => s.projectId === projectId)

export const selectIncludedSprints = (projectId: string) => (state: ProjectState): Sprint[] =>
  state.sprints.filter((s) => s.projectId === projectId && s.includedInForecast)

export const selectProjectAdjustments =
  (projectId: string) =>
  (state: ProjectState): ProductivityAdjustment[] => {
    const project = state.projects.find((p) => p.id === projectId)
    return project?.productivityAdjustments || []
  }
