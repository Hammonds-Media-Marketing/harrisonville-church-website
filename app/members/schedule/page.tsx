import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { ScheduleTable } from '@/components/portal/ScheduleTable'
import { getServiceMonth, requireApprovedMember } from '@/lib/portal/data'
import { buildPrintModel } from '@/lib/portal/service-schedule'
import { getTodayKey, monthName } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'Service Schedule',
  description: 'Who is speaking, leading singing, praying, and serving the Lord’s Supper at each Harrisonville Church of Christ assembly this month.',
  path: '/members/schedule',
  ogTitle: 'Monthly Service Schedule',
  ogDescription: 'Assignments for every Sunday and Wednesday assembly.',
  noindex: true,
})

export function resolveMonth(params: { year?: string; month?: string }, today = getTodayKey()) {
  const y = Number(params.year)
  const m = Number(params.month)
  const year = Number.isInteger(y) && y >= 2020 && y <= 2100 ? y : Number(today.slice(0, 4))
  const month = Number.isInteger(m) && m >= 1 && m <= 12 ? m : Number(today.slice(5, 7))
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
  return { year, month, prev, next }
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const ctx = await requireApprovedMember()
  const { year, month, prev, next } = resolveMonth(await searchParams)
  const { rows, monthRow } = await getServiceMonth(ctx, year, month)
  const model = buildPrintModel({ year, month, rows, arrangerName: monthRow?.arranger_name })

  return (
    <>
      <PageHero eyebrow="Members" title="Service schedule" lead={`${model.monthName} ${year}${model.arrangerName ? `, arranged by ${model.arrangerName}` : ''}.`}>
        <nav aria-label="Month" className="flex flex-wrap gap-2">
          <Button href={`/members/schedule?year=${prev.year}&month=${prev.month}`} variant="ghost" size="sm">
            {monthName(prev.month)}
          </Button>
          <Button href={`/members/schedule?year=${next.year}&month=${next.month}`} variant="ghost" size="sm">
            {monthName(next.month)}
          </Button>
          <Button href={`/members/schedule/print?year=${year}&month=${month}`} variant="secondary" size="sm">
            Print
          </Button>
          {ctx.isEditor ? (
            <Button href={`/members/admin/schedule?year=${year}&month=${month}`} variant="ghost" size="sm">
              Edit this month
            </Button>
          ) : null}
        </nav>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <Surface tone="card">
            <ScheduleTable model={model} />
            {monthRow?.notes ? <p className="m-0 mt-4 text-sm text-muted">{monthRow.notes}</p> : null}
            {monthRow?.file_url ? (
              <p className="m-0 mt-2 text-sm">
                <a href={monthRow.file_url} target="_blank" rel="noopener noreferrer">
                  Open the original schedule file
                </a>
              </p>
            ) : null}
          </Surface>
        </Container>
      </Section>
    </>
  )
}
