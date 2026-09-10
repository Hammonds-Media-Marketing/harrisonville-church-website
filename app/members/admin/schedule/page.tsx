import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { FieldShell, TextField } from '@/components/primitives/Field'
import { Notice, ParamNotices } from '@/components/primitives/Feedback'
import { getMembers, getServiceMonth, requireEditor } from '@/lib/portal/data'
import { GRID_DUTIES, assemblyDates, dutyLabel, slotLabel } from '@/lib/portal/service-schedule'
import { formatKey, monthName } from '@/lib/portal/time'
import { resolveMonth } from '@/app/members/schedule/page'
import { saveServiceMonthAction } from '@/app/members/calendar/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Enter the Service Schedule',
  description: 'Enter who is speaking, giving the short talk, serving communion, leading singing, and praying at each Harrisonville Church of Christ assembly for the month.',
  path: '/members/admin/schedule',
  ogTitle: 'Service Schedule Entry',
  ogDescription: 'Type the month’s assignments straight from the printed schedule.',
  noindex: true,
})

export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string; saved?: string; error?: string }> }) {
  const ctx = await requireEditor()
  const params = await searchParams
  const { year, month, prev, next } = resolveMonth(params)
  const [{ rows, monthRow }, members] = await Promise.all([getServiceMonth(ctx, year, month), getMembers()])
  const dates = assemblyDates(year, month)
  const existing = new Map(rows.map((r) => [`${r.service_date}:${r.service_slot}:${r.duty}`, r]))
  const valueFor = (key: string) => {
    const r = existing.get(key)
    if (!r) return ''
    return r.member_name ?? r.assignee_name ?? ''
  }

  return (
    <>
      <PageHero eyebrow="Site admin" title="Service schedule" lead={`${monthName(month)} ${year}. Type a name in each box, or start typing and pick a member so the assignment links to their profile. Leave a box blank to clear it.`}>
        <nav aria-label="Month" className="flex flex-wrap gap-2">
          <Button href={`/members/admin/schedule?year=${prev.year}&month=${prev.month}`} variant="ghost" size="sm">
            {monthName(prev.month)}
          </Button>
          <Button href={`/members/admin/schedule?year=${next.year}&month=${next.month}`} variant="ghost" size="sm">
            {monthName(next.month)}
          </Button>
          <Button href={`/members/schedule?year=${year}&month=${month}`} variant="secondary" size="sm">
            View as members see it
          </Button>
        </nav>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-5xl">
          <ParamNotices params={params} messages={{ saved: 'Schedule saved. Members see it on the schedule page, the calendar, and the home page.' }} />
          <form action={saveServiceMonthAction} className="flex flex-col gap-6">
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <datalist id="member-names">
              {members.map((m) => (
                <option key={m.id} value={m.fullName} />
              ))}
            </datalist>

            <Surface tone="card">
              <SectionHeading eyebrow="Month" title="Details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldShell id="arranger" label="Who arranged services this month">
                  <TextField id="arranger" name="arranger_name" defaultValue={monthRow?.arranger_name ?? ''} />
                </FieldShell>
                <FieldShell id="file-url" label="Link to the original schedule file" helper="Optional. A shared PDF or photo if you have one.">
                  <TextField id="file-url" name="file_url" type="url" defaultValue={monthRow?.file_url ?? ''} />
                </FieldShell>
              </div>
              <FieldShell id="notes" label="Notes shown under the schedule">
                <TextField id="notes" name="notes" defaultValue={monthRow?.notes ?? ''} />
              </FieldShell>
            </Surface>

            <Notice tone="info">
              <p>A name that exactly matches a member links to their profile and shows on their calendar. Anyone else is kept as typed.</p>
            </Notice>

            <div className="flex flex-col gap-4">
              {dates.map((d) => (
                <Surface key={d.dateKey} tone="card" as="fieldset" className="border-border-strong/40">
                  <legend className="px-1 font-display text-lg font-semibold text-heading">{formatKey(d.dateKey, { weekday: true, year: false })}</legend>
                  <div className={`grid gap-4 ${d.slots.length > 1 ? 'md:grid-cols-2' : ''}`}>
                    {d.slots.map((slot) => (
                      <div key={slot} className="rounded-md border border-border/60 bg-surface p-3">
                        <p className="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-primary-strong">{slotLabel(slot)}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {GRID_DUTIES.filter((duty) => slot !== 'wednesday' || duty !== 'communion').map((duty) => {
                            const key = `${d.dateKey}:${slot}:${duty}`
                            const id = `a-${key}`
                            return (
                              <div key={duty} className="flex flex-col gap-1">
                                <label htmlFor={id} className="text-xs font-semibold text-heading">
                                  {dutyLabel(duty)}
                                </label>
                                <input id={id} name={`a:${key}`} list="member-names" defaultValue={valueFor(key)} autoComplete="off" className="w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm text-ink focus:border-primary-strong" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>
              ))}
            </div>

            <div className="sticky bottom-20 flex justify-end md:bottom-4">
              <Button type="submit" variant="primary">
                Save {monthName(month)}
              </Button>
            </div>
          </form>
        </Container>
      </Section>
    </>
  )
}
