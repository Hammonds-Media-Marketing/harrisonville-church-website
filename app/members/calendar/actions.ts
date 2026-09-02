'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireApprovedMember, requireEditor } from '@/lib/portal/data'
import { CALENDAR_CATEGORIES } from '@/lib/portal/calendar'
import { chicagoToIso, getTodayKey, isValidDateKey } from '@/lib/portal/time'
import { isRecurrenceRule } from '@/lib/recurrence'
import { assemblyDates, isServiceDuty, isServiceSlot } from '@/lib/portal/service-schedule'

/**
 * Calendar, communion signup, and service schedule actions.
 */

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const flag = (form: FormData, key: string) => form.get(key) === 'on'

// ---------------------------------------------------------------------------
// Members-only calendar events (editors)
// ---------------------------------------------------------------------------

export async function saveCalendarEventAction(formData: FormData) {
  const ctx = await requireEditor()
  const id = text(formData, 'id')
  const back = `/members/calendar?date=${text(formData, 'event_date') || getTodayKey()}`
  const title = text(formData, 'title')
  const dateKey = text(formData, 'event_date')
  const allDay = flag(formData, 'all_day')
  const startTime = allDay ? '00:00' : text(formData, 'start_time') || '09:00'
  const endDate = text(formData, 'end_date') || dateKey
  const endTime = allDay ? '23:59' : text(formData, 'end_time')

  if (!title || !isValidDateKey(dateKey)) redirect(`${back}&error=event_fields`)
  const startsAt = chicagoToIso(dateKey, startTime)
  if (!startsAt) redirect(`${back}&error=event_time`)
  let endsAt: string | null = null
  if (endTime || endDate !== dateKey) {
    endsAt = chicagoToIso(isValidDateKey(endDate) ? endDate : dateKey, endTime || startTime)
    if (!endsAt || endsAt < startsAt) redirect(`${back}&error=event_end`)
  }
  const category = text(formData, 'category')
  const visibility = text(formData, 'visibility') === 'leaders' ? 'leaders' : 'members'
  const recurring = text(formData, 'recurring')
  const recurrenceEndsOn = text(formData, 'recurrence_ends_on')

  const values = {
    title,
    description: text(formData, 'description') || null,
    location: text(formData, 'location') || null,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    category: (CALENDAR_CATEGORIES as readonly string[]).includes(category) ? category : 'Fellowship',
    visibility,
    recurring: isRecurrenceRule(recurring) ? recurring : null,
    recurrence_ends_on: isRecurrenceRule(recurring) && isValidDateKey(recurrenceEndsOn) ? recurrenceEndsOn : null,
    updated_by: ctx.userId,
  }
  const { error } = id
    ? await ctx.supabase.from('calendar_events').update(values).eq('id', id)
    : await ctx.supabase.from('calendar_events').insert({ ...values, created_by: ctx.userId })
  if (error) {
    console.warn('[calendar] save failed:', error.message)
    redirect(`${back}&error=save`)
  }
  revalidatePath('/members/calendar')
  revalidatePath('/members')
  redirect(`${back}&saved=1`)
}

export async function deleteCalendarEventAction(formData: FormData) {
  const ctx = await requireEditor()
  const id = text(formData, 'id')
  const date = text(formData, 'date') || getTodayKey()
  const { error } = await ctx.supabase.from('calendar_events').delete().eq('id', id)
  if (error) redirect(`/members/calendar?date=${date}&error=save`)
  revalidatePath('/members/calendar')
  redirect(`/members/calendar?date=${date}&deleted=1`)
}

// ---------------------------------------------------------------------------
// Communion preparation signup
// ---------------------------------------------------------------------------

function parseYear(value: string): number {
  const current = Number(getTodayKey().slice(0, 4))
  const year = Number(value)
  return Number.isInteger(year) && Math.abs(year - current) <= 1 ? year : current
}

export async function claimCommunionMonthAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const year = parseYear(text(formData, 'year'))
  const month = Number(text(formData, 'month'))
  const back = `/members/communion?year=${year}`
  if (!Number.isInteger(month) || month < 1 || month > 12) redirect(`${back}&error=month`)

  // Editors may sign someone else up (for members who do not use the app).
  const forMember = text(formData, 'member_id')
  const memberId = ctx.isEditor && forMember ? forMember : ctx.userId

  const { error } = await ctx.supabase.from('communion_signups').insert({
    signup_year: year,
    signup_month: month,
    member_id: memberId,
    created_by: ctx.userId,
    notes: text(formData, 'notes') || null,
  })
  if (error) {
    // 23505: the partial unique index; someone claimed it first.
    redirect(`${back}&error=${error.code === '23505' ? 'taken' : 'save'}`)
  }
  revalidatePath('/members/communion')
  revalidatePath('/members')
  redirect(`${back}&saved=1`)
}

export async function releaseCommunionMonthAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const id = text(formData, 'id')
  const year = parseYear(text(formData, 'year'))
  const { data, error } = await ctx.supabase
    .from('communion_signups')
    .update({ removed_at: new Date().toISOString(), removed_by: ctx.userId })
    .eq('id', id)
    .is('removed_at', null)
    .select('id')
  if (error || !data?.length) redirect(`/members/communion?year=${year}&error=save`)
  revalidatePath('/members/communion')
  revalidatePath('/members')
  redirect(`/members/communion?year=${year}&deleted=1`)
}

// ---------------------------------------------------------------------------
// Service schedule (manual entry, editors)
// ---------------------------------------------------------------------------

/**
 * Saves a whole month at once. The form posts one field per
 * (date, slot, duty) named `a:<date>:<slot>:<duty>` with either a member id
 * (prefixed `m:`) or a typed name. Blank fields remove the row.
 */
export async function saveServiceMonthAction(formData: FormData) {
  const ctx = await requireEditor()
  const year = Number(text(formData, 'year'))
  const month = Number(text(formData, 'month'))
  const back = `/members/admin/schedule?year=${year}&month=${month}`
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) redirect('/members/admin/schedule?error=save')

  await ctx.supabase.from('service_schedule_months').upsert(
    {
      year,
      month,
      arranger_name: text(formData, 'arranger_name') || null,
      notes: text(formData, 'notes') || null,
      file_url: text(formData, 'file_url') || null,
      created_by: ctx.userId,
    },
    { onConflict: 'year,month' }
  )

  const upserts: Array<{ service_date: string; service_slot: string; duty: string; member_id: string | null; assignee_name: string | null; created_by: string }> = []
  const removals: Array<{ service_date: string; service_slot: string; duty: string }> = []
  const validDates = new Set(assemblyDates(year, month).map((d) => d.dateKey))

  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith('a:')) continue
    const [, date, slot, duty] = key.split(':')
    if (!validDates.has(date) || !isServiceSlot(slot) || !isServiceDuty(duty)) continue
    const value = String(raw).trim()
    if (!value) {
      removals.push({ service_date: date, service_slot: slot, duty })
      continue
    }
    const memberId = value.startsWith('m:') ? value.slice(2) : null
    upserts.push({
      service_date: date,
      service_slot: slot,
      duty,
      member_id: memberId,
      assignee_name: memberId ? null : value.slice(0, 120),
      created_by: ctx.userId,
    })
  }

  for (const r of removals) {
    await ctx.supabase.from('service_assignments').delete().match(r)
  }
  if (upserts.length) {
    const { error } = await ctx.supabase.from('service_assignments').upsert(upserts, { onConflict: 'service_date,service_slot,duty' })
    if (error) {
      console.warn('[schedule] save failed:', error.message)
      redirect(`${back}&error=save`)
    }
  }
  revalidatePath('/members/schedule')
  revalidatePath('/members/calendar')
  revalidatePath('/members')
  redirect(`${back}&saved=1`)
}
