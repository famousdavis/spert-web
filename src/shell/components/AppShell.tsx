'use client'

import { useState } from 'react'
import { TabNavigation, type TabId } from './TabNavigation'
import { Footer } from './Footer'
import { ProjectsTab } from '@/features/projects'
import { SprintHistoryTab } from '@/features/sprint-history'
import { ForecastTab } from '@/features/forecast'
import { AboutTab } from '@/features/about'
import { SettingsTab } from '@/features/settings'
import { APP_NAME, APP_DESCRIPTION } from '@/shared/constants'

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('projects')

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-[1200px] mx-auto px-8">
        <header className="mb-6">
          <h1 className="text-[2.1rem] mb-1">
            <span
              className="font-bold"
              style={{
                background: 'linear-gradient(90deg, #0099ff 0%, #0051cc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {APP_NAME}
            </span>
            <span className="text-gray-400 font-normal text-lg align-top">®</span>
          </h1>
          <p className="text-sm text-gray-500 italic">{APP_DESCRIPTION}</p>
        </header>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="mt-8">
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'sprint-history' && <SprintHistoryTab />}
          {activeTab === 'forecast' && <ForecastTab />}
          {activeTab === 'about' && <AboutTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>

        <Footer />
      </div>
    </div>
  )
}
