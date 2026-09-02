'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireApprovedMember } from '@/lib/portal/data'
import { AUDIENCES, SPECIAL_EVENT_CATEGORIES } from '@/lib/portal/special-events'
import { chicagoToIso, isValidDateKey } from '@/lib/portal/time'
import { isUuid } from '@/lib/portal/chat'

/**
 * Special events: create and edit (any approved member for their own
 * events; editors for all), exclusions, signup items, RSVPs, and volunteer
 * signups. Notifications fan out from database triggers on publish.
 */

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const flag = (form: FormData, key: string) => form.get(key) === 'on'

type SignupItemInput = { id?: string; title: string; description?: string; volunteersNeeded: number; neededAt?: string | null }

function parseItems(raw: string): SignupItemInput[] | null {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const out: SignupItemInput[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') return null
      const i = item as Record<string, unknown>
      const title = String(i.title ?? '').trim()
      if (!title) return null
      const needed = Math.floor(Number(i.volunteersNeeded ?? 1))
      if (!Number.isInteger(needed) || needed < 1 || needed > 500) return null
      out.push({
        id: typeof i.id === 'string' && isUuid(i.id) ? i.id : undefined,
        title: title.slice(0, 160),
        description: String(i.description ?? '').trim() || undefined,
        volunteersNeeded: needed,
        neededAt: typeof i.neededAt === 'string' && i.neededAt ? i.neededAt : null,
      })
    }
    return out
  } catch {
    return null
  }
}

export async function saveSpecialEventAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const id = text(formData, 'id')
  const back = id ? `/members/events/${id}/edit` : '/members/events/new'
  const title = text(formData, 'title')
  if (!title) redirect(`${back}?error=title`)

  const status = text(formData, 'status') === 'published' ? 'published' : 'draft'
  const audience = text(formData, 'audience')
  if (!AUDIENCES.some((a) => a.value === audience)) redirect(`${back}?error=audience`)
  const category = text(formData, 'category')
  const dateKey = text(formData, 'event_date')
  const allDay = flag(formData, 'all_day')

  let startsAt: string | null = null
  let endsAt: string | null = null
  if (dateKey) {
    if (!isValidDateKey(dateKey)) redirect(`${back}?error=date`)
    startsAt = chicagoToIso(dateKey, allDay ? '00:00' : text(formData, 'start_time') || '18:00')
    if (!startsAt) redirect(`${back}?error=date`)
    const endDate = text(formData, 'end_date') || dateKey
    const endTime = text(formData, 'end_time')
    if (endTime || endDate !== dateKey) {
      endsAt = chicagoToIso(isValidDateKey(endDate) ? endDate : dateKey, allDay ? '23:59' : endTime || text(formData, 'start_time') || '18:00')
      if (!endsAt || endsAt < startsAt) redirect(`${back}?error=end`)
    }
  }
  if (status === 'published' && !startsAt) redirect(`${back}?error=publish_date`)

  const items = parseItems(text(formData, 'signup_items'))
  if (items === null) redirect(`${back}?error=items`)
  const exclusionIds = text(formData, 'exclusion_ids')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => isUuid(s) && s !== ctx.userId)

  const values = {
    title: title.slice(0, 160),
    category: SPECIAL_EVENT_CATEGORIES.some((c) => c.value === category) ? category : null,
    description: text(formData, 'description'),
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    location: text(formData, 'location') || null,
    audience,
    rsvp_enabled: flag(formData, 'rsvp_enabled'),
    updated_by: ctx.userId,
  }

  let eventId = id
  if (id) {
    // Publish in a separate step so the status trigger sees the final row.
    const { error } = await ctx.supabase.from('special_events').update({ ...values, status }).eq('id', id)
    if (error) redirect(`${back}?error=save`)
  } else {
    const { data, error } = await ctx.supabase.from('special_events').insert({ ...values, status: 'draft', created_by: ctx.userId }).select('id').single()
    if (error || !data) redirect(`${back}?error=save`)
    eventId = data.id
  }

  // Exclusions: diff against what is stored.
  const { data: existingExclusions } = await ctx.supabase.from('special_event_exclusions').select('member_id').eq('event_id', eventId)
  const existing = new Set((existingExclusions ?? []).map((x) => x.member_id))
  const wanted = new Set(exclusionIds)
  const toAdd = exclusionIds.filter((m) => !existing.has(m))
  const toRemove = Array.from(existing).filter((m) => !wanted.has(m))
  if (toAdd.length) await ctx.supabase.from('special_event_exclusions').insert(toAdd.map((member_id) => ({ event_id: eventId, member_id, created_by: ctx.userId })))
  if (toRemove.length) await ctx.supabase.from('special_event_exclusions').delete().eq('event_id', eventId).in('member_id', toRemove)

  // Signup items: remove the ones dropped from the form, upsert the rest.
  const keepIds = items.map((i) => i.id).filter((x): x is string => Boolean(x))
  const { data: currentItems } = await ctx.supabase.from('special_event_signup_items').select('id').eq('event_id', eventId)
  const dropIds = (currentItems ?? []).map((i) => i.id).filter((x) => !keepIds.includes(x))
  if (dropIds.length) await ctx.supabase.from('special_event_signup_items').delete().in('id', dropIds)
  for (const [index, item] of items.entries()) {
    const neededAt = item.neededAt && isValidDateKey(item.neededAt.slice(0, 10)) ? chicagoToIso(item.neededAt.slice(0, 10), item.neededAt.length >= 16 ? item.neededAt.slice(11, 16) : '12:00') : null
    const row = { event_id: eventId, title: item.title, description: item.description ?? null, volunteers_needed: item.volunteersNeeded, needed_at: neededAt, display_order: index }
    const { error } = item.id
      ? await ctx.supabase.from('special_event_signup_items').update(row).eq('id', item.id)
      : await ctx.supabase.from('special_event_signup_items').insert(row)
    if (error) redirect(`/members/events/${eventId}/edit?error=capacity`)
  }

  if (!id && status === 'published') {
    const { error } = await ctx.supabase.from('special_events').update({ status: 'published' }).eq('id', eventId)
    if (error) redirect(`/members/events/${eventId}/edit?error=save`)
  }

  revalidatePath('/members/events')
  revalidatePath('/members/calendar')
  revalidatePath('/members')
  redirect(`/members/events/${eventId}?saved=1`)
}

export async function archiveSpecialEventAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const id = text(formData, 'id')
  const { data, error } = await ctx.supabase.from('special_events').update({ archived_at: new Date().toISOString(), updated_by: ctx.userId }).eq('id', id).select('id')
  if (error || !data?.length) redirect(`/members/events/${id}?error=save`)
  revalidatePath('/members/events')
  revalidatePath('/members/calendar')
  redirect('/members/events?deleted=1')
}

export async function rsvpAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const eventId = text(formData, 'event_id')
  const response = text(formData, 'response')
  const guests = Math.min(20, Math.max(0, Math.floor(Number(text(formData, 'guest_count')) || 0)))
  if (!isUuid(eventId) || !['yes', 'maybe', 'no'].includes(response)) redirect(`/members/events/${eventId}?error=rsvp`)
  const { error } = await ctx.supabase
    .from('special_event_rsvps')
    .upsert({ event_id: eventId, member_id: ctx.userId, response, guest_count: response === 'yes' ? guests : 0 }, { onConflict: 'event_id,member_id' })
  if (error) redirect(`/members/events/${eventId}?error=rsvp`)
  revalidatePath(`/members/events/${eventId}`)
  redirect(`/members/events/${eventId}?saved=rsvp`)
}

export async function claimSignupAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const eventId = text(formData, 'event_id')
  const itemId = text(formData, 'item_id')
  const { error } = await ctx.supabase.rpc('claim_signup_item', { target_item_id: itemId, target_note: text(formData, 'note') || null })
  if (error) redirect(`/members/events/${eventId}?error=${/filled/i.test(error.message) ? 'full' : 'signup'}#signups`)
  revalidatePath(`/members/events/${eventId}`)
  redirect(`/members/events/${eventId}?saved=signup#signups`)
}

export async function withdrawSignupAction(formData: FormData) {
  const ctx = await requireApprovedMember()
  const eventId = text(formData, 'event_id')
  const itemId = text(formData, 'item_id')
  const memberId = text(formData, 'member_id') || ctx.userId
  const { error } = await ctx.supabase.from('special_event_signups').delete().eq('signup_item_id', itemId).eq('member_id', memberId)
  if (error) redirect(`/members/events/${eventId}?error=signup#signups`)
  revalidatePath(`/members/events/${eventId}`)
  redirect(`/members/events/${eventId}?saved=withdrawn#signups`)
}
