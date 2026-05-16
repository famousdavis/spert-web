// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

'use client'

import { cn } from '@/lib/utils'

// v0.31.1 — Option A empty-state with twin CTAs ("Create New Project" + "Load Sample Project").
// Same component used on both the Projects tab (Welcome variant) and the Forecast tab
// (Forecast-needs-project variant). Slight lead-in difference per context; everything else
// shared.

type EmptyStateVariant = 'welcome' | 'forecast-needs-project'

interface ProjectsEmptyStateProps {
  variant: EmptyStateVariant
  onCreateNew: () => void
  onLoadSample: () => void
}

const HEADINGS: Record<EmptyStateVariant, string> = {
  welcome: 'Welcome to SPERT Forecaster',
  'forecast-needs-project': "You'll need a project to forecast",
}

const SUBHEADS: Record<EmptyStateVariant, string> = {
  welcome:
    "Forecast project completion dates using Monte Carlo simulation and your team's velocity — historical or estimated.",
  'forecast-needs-project':
    "Forecast project completion dates using Monte Carlo simulation and your team's velocity.",
}

export function ProjectsEmptyState({ variant, onCreateNew, onLoadSample }: ProjectsEmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-dashed border-border dark:border-gray-700 p-8 text-center bg-card"
      role="region"
      aria-labelledby="empty-state-heading"
    >
      <h2
        id="empty-state-heading"
        className="text-xl font-semibold text-spert-text dark:text-gray-100 mb-3"
      >
        {HEADINGS[variant]}
      </h2>
      <p className="text-sm text-spert-text-muted dark:text-gray-400 max-w-prose mx-auto">
        {SUBHEADS[variant]}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCreateNew}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-colors',
            'bg-spert-blue text-white border-spert-blue hover:bg-spert-blue-dark',
          )}
        >
          Create New Project
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-colors',
            'bg-transparent text-spert-blue border-spert-blue hover:bg-spert-blue/10',
          )}
        >
          Load Sample Project
        </button>
      </div>
      <p className="mt-4 text-xs italic text-spert-text-muted dark:text-gray-500 max-w-prose mx-auto">
        The sample project is a working example with eight sprints of history. You can explore it,
        edit it, or delete it at any time.
      </p>
    </div>
  )
}
