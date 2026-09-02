import type { Metadata } from 'next'
import { ScheduleTable } from '@/components/portal/ScheduleTable'
import { PrintButton } from '@/components/portal/PrintButton'
import { getServiceMonth, requireApprovedMember } from '@/lib/portal/data'
import { buildPrintModel } from '@/lib/portal/service-schedule'
import { resolveMonth } from '@/app/members/schedule/page'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'Print the service schedule | Harrisonville Church of Christ' },
  description: 'Printable monthly service schedule.',
  robots: { index: false, follow: false },
}

export default async function PrintSchedulePage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const ctx = await requireApprovedMember()
  const { year, month } = resolveMonth(await searchParams)
  const { rows, monthRow } = await getServiceMonth(ctx, year, month)
  const model = buildPrintModel({ year, month, rows, arrangerName: monthRow?.arranger_name })

  return (
    <div className="print-schedule mx-auto max-w-3xl px-5 py-8">
      <style>{`@media print { header, footer, nav, .members-shell-bar, .no-print { display: none !important } body { background: #fff } .print-schedule { padding: 0 } } @page { size: letter portrait; margin: 0.5in }`}</style>
      <div className="no-print mb-6 flex flex-wrap gap-2">
        <PrintButton />
        <a href={`/members/schedule?year=${year}&month=${month}`} className="inline-flex items-center rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-primary-strong no-underline">
          Back to the schedule
        </a>
      </div>
      <h1 className="mb-1 text-3xl">
        {model.monthName} {year}
      </h1>
      <p className="m-0 mb-1 text-muted">{site.name} service schedule</p>
      <p className="m-0 mb-6 font-semibold text-heading">Arrange services: {model.arrangerName ?? '________________'}</p>
      <ScheduleTable model={model} />
    </div>
  )
}
