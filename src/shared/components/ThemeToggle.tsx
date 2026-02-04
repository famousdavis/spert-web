'use client'

import { useTheme, type Theme } from '@/shared/hooks'

const THEME_ICONS: Record<Theme, string> = {
  light: 'sun',
  dark: 'moon',
  system: 'system',
}

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

export function ThemeToggle() {
  const { theme, setTheme, isInitialized } = useTheme()

  if (!isInitialized) {
    return (
      <div className="w-[90px] h-[28px] bg-muted rounded animate-pulse" />
    )
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="px-2 py-1 text-xs border border-spert-border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-spert-text dark:text-gray-200 cursor-pointer"
      aria-label="Select color theme"
    >
      {(['light', 'dark', 'system'] as Theme[]).map((t) => (
        <option key={t} value={t}>
          {THEME_LABELS[t]}
        </option>
      ))}
    </select>
  )
}
