// localStorage abstraction for Zustand persistence

const STORAGE_KEY = 'spert-data'

export interface StorageData {
  projects: unknown[]
  sprints: unknown[]
  version: string
}

export const storage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
}

export { STORAGE_KEY }
