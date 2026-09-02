import { dutyLabel, type PrintModel } from '@/lib/portal/service-schedule'

/**
 * The month's service schedule as a table: one row per assembly, duties in
 * the printed order (Communion, Speaker, Short Talk, then the rest). Used on
 * screen and on the print page.
 */
export function ScheduleTable({ model, compact = false }: { model: PrintModel; compact?: boolean }) {
  if (!model.days.length) {
    return <p className="m-0 text-sm text-muted">No assignments have been entered for {model.monthName} {model.year} yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className={`schedule-table w-full border-collapse ${compact ? 'text-sm' : ''}`}>
        <caption className="sr-only">
          Service schedule for {model.monthName} {model.year}
        </caption>
        <thead>
          <tr className="border-b-2 border-heading text-left">
            <th scope="col" className="py-2 pr-3 font-display font-semibold text-heading">Day</th>
            <th scope="col" className="py-2 pr-3 font-display font-semibold text-heading">Assembly</th>
            <th scope="col" className="py-2 pr-3 font-display font-semibold text-heading">Duty</th>
            <th scope="col" className="py-2 font-display font-semibold text-heading">Brother</th>
          </tr>
        </thead>
        {model.days.map((day) => (
          <tbody key={day.dateKey} className="border-b border-border">
            {day.blocks.map((block, bi) => (
              <tr key={block.slot} className="align-top">
                {bi === 0 ? (
                  <th scope="rowgroup" rowSpan={day.blocks.length} className="py-2 pr-3 text-left font-semibold text-heading">
                    {day.dayLabel}
                  </th>
                ) : null}
                <td className="py-2 pr-3 text-ink">{block.label}</td>
                <td className="py-2 pr-3 text-ink">
                  {block.assignments.map((a) => (
                    <div key={a.id}>{dutyLabel(a.duty)}</div>
                  ))}
                </td>
                <td className="py-2 font-semibold text-heading">
                  {block.assignments.map((a) => (
                    <div key={a.id}>{a.name}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
