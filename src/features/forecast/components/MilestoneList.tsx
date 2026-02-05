'use client'

import type { Milestone } from '@/shared/types'
import { ListRowActions } from '@/shared/components/ListRowActions'

interface MilestoneListProps {
  milestones: Milestone[]
  unitOfMeasure: string
  onEdit: (milestone: Milestone) => void
  onDelete: (id: string) => void
  onToggleChart?: (id: string, showOnChart: boolean) => void
}

export function MilestoneList({
  milestones,
  unitOfMeasure,
  onEdit,
  onDelete,
  onToggleChart,
}: MilestoneListProps) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm italic text-spert-text-muted">
        No milestones defined. Add milestones to forecast individual release dates.
      </p>
    )
  }

  // Compute cumulative backlog for display
  let cumulative = 0
  const rows = milestones.map((m, idx) => {
    cumulative += m.backlogSize
    return { milestone: m, index: idx + 1, cumulative }
  })

  const total = cumulative

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-spert-border-light">
            <th className="w-[40px] p-2 text-center font-semibold text-spert-text-secondary">
              #
            </th>
            <th className="p-2 text-left font-semibold text-spert-text-secondary">
              Name
            </th>
            <th className="p-2 text-right font-semibold text-spert-text-secondary">
              Remaining
            </th>
            <th className="p-2 text-right font-semibold text-spert-text-secondary">
              Cumulative
            </th>
            <th className="w-[40px] p-2 text-center font-semibold text-spert-text-secondary">
              Color
            </th>
            <th className="w-[50px] p-2 text-center font-semibold text-spert-text-secondary" title="Show reference line on burn-up chart">
              Chart
            </th>
            <th className="p-2 text-right font-semibold text-spert-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ milestone: m, index, cumulative: cum }) => (
            <tr key={m.id} className="border-b border-spert-border-light">
              <td className="p-2 text-center text-spert-text-muted">{index}</td>
              <td className="p-2 font-medium dark:text-gray-100">{m.name}</td>
              <td className="whitespace-nowrap p-2 text-right dark:text-gray-100">
                {m.backlogSize.toLocaleString()} {unitOfMeasure}
              </td>
              <td className="whitespace-nowrap p-2 text-right text-spert-text-muted">
                {cum.toLocaleString()} {unitOfMeasure}
              </td>
              <td className="p-2 text-center">
                <span
                  className="inline-block size-4 rounded-full border border-spert-border dark:border-gray-600"
                  style={{ backgroundColor: m.color }}
                  title={m.color}
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={m.showOnChart !== false}
                  onChange={(e) => onToggleChart?.(m.id, e.target.checked)}
                  className="cursor-pointer accent-blue-600"
                  title={m.showOnChart !== false ? 'Shown on burn-up chart' : 'Hidden from burn-up chart'}
                  aria-label={`Show ${m.name} on chart`}
                />
              </td>
              <ListRowActions onEdit={() => onEdit(m)} onDelete={() => onDelete(m.id)} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-spert-border-light">
            <td colSpan={2} className="p-2 text-right font-semibold text-spert-text-secondary">
              Total remaining:
            </td>
            <td className="whitespace-nowrap p-2 text-right font-semibold dark:text-gray-100">
              {total.toLocaleString()} {unitOfMeasure}
            </td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
