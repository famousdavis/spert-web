'use client'

import { useState, useCallback } from 'react'
import { TabNavigation, type TabId } from './TabNavigation'
import { Footer } from './Footer'
import { ProjectsTab } from '@/features/projects'
import { SprintHistoryTab } from '@/features/sprint-history'
import { ForecastTab } from '@/features/forecast'
import { AboutTab } from '@/features/about'
import { SettingsTab } from '@/features/settings'
import { APP_NAME, APP_DESCRIPTION } from '@/shared/constants'
import { useProjectStore } from '@/shared/state/project-store'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('projects')
  const setViewingProjectId = useProjectStore((state) => state.setViewingProjectId)

  const handleViewHistory = useCallback((projectId: string) => {
    setViewingProjectId(projectId)
    setActiveTab('sprint-history')
  }, [setViewingProjectId])

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-[1200px] mx-auto px-8">
        <header className="mb-6">
          <h1 className="text-[2.1rem] mb-1">
            <span
              className="font-bold bg-gradient-to-r from-spert-blue-light to-spert-blue-dark bg-clip-text text-transparent"
            >
              {APP_NAME}
            </span>
            <span className="text-gray-400 font-normal text-lg align-top">®</span>
          </h1>
          <p className="text-sm text-gray-500 italic">{APP_DESCRIPTION}</p>
        </header>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="mt-8">
          {activeTab === 'projects' && <ErrorBoundary><ProjectsTab onViewHistory={handleViewHistory} /></ErrorBoundary>}
          {activeTab === 'sprint-history' && <ErrorBoundary><SprintHistoryTab /></ErrorBoundary>}
          {activeTab === 'forecast' && <ErrorBoundary><ForecastTab /></ErrorBoundary>}
          {activeTab === 'about' && <ErrorBoundary><AboutTab /></ErrorBoundary>}
          {activeTab === 'settings' && <ErrorBoundary><SettingsTab /></ErrorBoundary>}
        </main>

        <Footer />
      </div>
    </div>
  )
}
