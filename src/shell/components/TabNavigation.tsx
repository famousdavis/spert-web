'use client'

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
    <div
      className="flex gap-2 border-b-2 border-gray-100"
      style={{ paddingLeft: '0.5rem' }}
    >
      {TABS.filter((tab) => !tab.hidden).map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="transition-all duration-200"
          style={{
            padding: '0.5rem 1.25rem',
            background: activeTab === tab.id ? '#0070f3' : 'transparent',
            color: activeTab === tab.id ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === tab.id ? '3px solid #0070f3' : '3px solid transparent',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = '#f5f5f5'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
