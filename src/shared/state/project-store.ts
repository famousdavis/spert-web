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
          return {
            projects: state.projects.filter((p) => p.id !== id),
            sprints: state.sprints.filter((s) => s.projectId !== id),
            forecastInputs: remainingForecastInputs,
            burnUpConfigs: remainingBurnUpConfigs,
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
