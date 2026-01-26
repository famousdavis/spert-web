import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Sprint } from '@/shared/types'
import { storage, STORAGE_KEY } from './storage'
import { APP_VERSION } from '@/shared/constants'

export interface ExportData {
  version: string
  exportedAt: string
  projects: Project[]
  sprints: Sprint[]
}

interface ProjectState {
  projects: Project[]
  sprints: Sprint[]
  viewingProjectId: string | null // Shared across Sprint History and Forecast tabs

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

  // Import/Export actions
  exportData: () => ExportData
  importData: (data: ExportData) => void
}

const generateId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [] as Project[],
      sprints: [] as Sprint[],
      viewingProjectId: null as string | null,

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
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          sprints: state.sprints.filter((s) => s.projectId !== id),
        })),

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

      exportData: (): ExportData => {
        const state = get()
        return {
          version: APP_VERSION,
          exportedAt: now(),
          projects: state.projects,
          sprints: state.sprints,
        }
      },

      importData: (data: ExportData) =>
        set(() => ({
          projects: data.projects,
          sprints: data.sprints,
        })),
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
      // Don't persist viewingProjectId - it's session-only state
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
