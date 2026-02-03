'use client'

import { cn } from '@/lib/utils'

export type TabId = 'projects' | 'sprint-history' | 'forecast' | 'about' | 'settings'

interface Tab {
  id: TabId
  label: string
  hidden?: boolean
}

const TABS: Tab[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'sprint-history', label: 'Sprint History' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'settings', label: 'Settings', hidden: true },
  { id: 'about', label: 'About' },
]

interface TabNavigationProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 border-b-2 border-gray-100 pl-2">
      {TABS.filter((tab) => !tab.hidden).map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-5 py-2 border-0 border-b-[3px] rounded-t-lg cursor-pointer font-semibold text-base transition-all duration-200',
            activeTab === tab.id
              ? 'bg-spert-blue text-white border-b-spert-blue'
              : 'bg-transparent text-spert-text-muted border-b-transparent hover:bg-spert-bg-hover'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
