import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { ParamNotices } from '@/components/primitives/Feedback'
import { CalendarView, type CalendarMode } from '@/components/portal/calendar/CalendarView'
import { getCalendarItems, requireApprovedMember } from '@/lib/portal/data'
import { addDays, getTodayKey, isValidDateKey, monthGridKeys, startOfWeek } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'Members Calendar',
  description:
    'The Harrisonville Church of Christ members calendar by month, week, or day: assemblies and speakers, public church events, members-only events, and special events with sign-ups.',
  path: '/members/calendar',
  ogTitle: 'Church Calendar for Members',
  ogDescription: 'Everything happening at the building and beyond, in one place.',
  noindex: true,
})

const notices = {
  saved: 'Calendar updated.',
  deleted: 'Event removed from the calendar.',
  'error:event_fields': 'A title and a valid date are required.',
  'error:event_time': 'That start time does not exist on that date. Pick another time.',
  'error:event_end': 'The end has to come after the start.',
  error: 'That did not save. Check the form and try again.',
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string; saved?: string; deleted?: string; error?: string }> }) {
  const ctx = await requireApprovedMember()
  const params = await searchParams
  const mode: CalendarMode = params.view === 'week' || params.view === 'day' ? params.view : 'month'
  const today = getTodayKey()
  const date = params.date && isValidDateKey(params.date) ? params.date : today

  const range =
    mode === 'month'
      ? (() => {
          const keys = monthGridKeys(date)
          return { start: keys[0], end: keys[keys.length - 1] }
        })()
      : mode === 'week'
        ? { start: startOfWeek(date), end: addDays(startOfWeek(date), 6) }
        : { start: date, end: date }

  const items = await getCalendarItems(ctx, range)

  return (
    <>
      <PageHero eyebrow="Members" title="Calendar" lead="Assemblies and who is speaking, public events, members-only events, and special events with sign-ups. Times are church time." />
      <Section tone="light">
        <Container>
          <ParamNotices params={params} messages={notices} />
          <CalendarView mode={mode} date={date} todayKey={today} items={items} canManage={ctx.isEditor} />
        </Container>
      </Section>
    </>
  )
}
