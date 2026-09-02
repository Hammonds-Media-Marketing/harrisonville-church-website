import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getAuthContext, getSupabaseServer, isAdminRole, isEditorRole } from '@/lib/supabase-server'
import { upcomingOccurrences } from '@/lib/recurrence'
import { getSupabase } from '@/lib/supabase'
import {
  CHAT_PAGE_SIZE,
  conversationPreview,
  isValidCursor,
  normalizeUnreadSummary,
} from '@/lib/portal/chat'
import { bucketByDay, occurrencesInRange, sortItems, type CalendarRange } from '@/lib/portal/calendar'
import { assemblyStartsAt, dutyLabel, type AssignmentInput } from '@/lib/portal/service-schedule'
import { addDays, getTodayKey, type DateKey } from '@/lib/portal/time'
import type {
  CalendarItem,
  ChatCursor,
  ChatMessage,
  ChatPage,
  ChatReactionSummary,
  ChatUnreadSummary,
  ConversationSummary,
  DirectoryChild,
  DirectoryFamily,
  DirectoryMember,
  Gender,
  GroupKind,
  GroupRow,
  MemberProfileRow,
  PersonSummary,
  SpecialEventRow,
} from '@/lib/portal/types'

/**
 * Member portal data access. Every read runs under the signed-in member's
 * cookie session, so Row Level Security decides what comes back. Functions
 * return empty results (never throw) when Supabase is not configured, so the
 * pages still render their setup notices.
 */

type Client = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Context and guards
// ---------------------------------------------------------------------------

export type PortalContext = {
  supabase: Client
  userId: string
  profile: MemberProfileRow
  approved: boolean
  isEditor: boolean
  isAdmin: boolean
}

/** Signed-in member with a profile, or a redirect to sign in. */
export const requireMember = cache(async (): Promise<PortalContext> => {
  const { user, profile } = await getAuthContext()
  if (!user) redirect('/members/login')
  const supabase = await getSupabaseServer()
  if (!supabase || !profile) redirect('/members')
  return {
    supabase,
    userId: user.id,
    profile,
    approved: Boolean(profile.approved),
    isEditor: isEditorRole(profile),
    isAdmin: isAdminRole(profile),
  }
})

/** Approved member, or back to the members home (which explains the wait). */
export async function requireApprovedMember(): Promise<PortalContext> {
  const ctx = await requireMember()
  if (!ctx.approved) redirect('/members')
  return ctx
}

export async function requireEditor(): Promise<PortalContext> {
  const ctx = await requireApprovedMember()
  if (!ctx.isEditor) redirect('/members')
  return ctx
}

export async function requireAdmin(): Promise<PortalContext> {
  const ctx = await requireApprovedMember()
  if (!ctx.isAdmin) redirect('/members/admin')
  return ctx
}

/** Records activity at most once an hour; used by the readiness dashboard. */
export async function touchLastSeen(ctx: PortalContext): Promise<void> {
  const last = ctx.profile.last_seen_at ? new Date(ctx.profile.last_seen_at).getTime() : 0
  if (Date.now() - last < 60 * 60 * 1000) return
  await ctx.supabase.from('member_profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', ctx.userId)
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

type DirectoryViewRow = Database['public']['Views']['member_directory']['Row']

function personFromRow(row: Pick<DirectoryViewRow, 'id' | 'full_name' | 'first_name' | 'photo' | 'photo_position'>): PersonSummary {
  return { id: row.id, fullName: row.full_name || 'Member', firstName: row.first_name || row.full_name || 'Member', photo: row.photo, photoPosition: row.photo_position }
}

function memberFromRow(row: DirectoryViewRow, familyName: string | null): DirectoryMember {
  return {
    ...personFromRow(row),
    email: row.email,
    phone: row.phone,
    address: row.address,
    about: row.about,
    birthday: row.birthday,
    anniversary: row.anniversary,
    gender: (row.gender as Gender | null) ?? null,
    role: row.role,
    familyId: row.family_id,
    familyName,
    lastSeenAt: row.last_seen_at,
  }
}

/** Every approved member (privacy toggles already applied), with family names. */
export const getMembers = cache(async (opts: { listedOnly?: boolean } = {}): Promise<DirectoryMember[]> => {
  const supabase = await getSupabaseServer()
  if (!supabase) return []
  const [{ data: rows }, { data: families }] = await Promise.all([
    supabase.from('member_directory').select('*').order('full_name'),
    supabase.from('families').select('id, family_name'),
  ])
  const familyNames = new Map((families ?? []).map((f) => [f.id, f.family_name]))
  return (rows ?? [])
    .filter((r) => (opts.listedOnly ? r.show_in_directory : true))
    .map((r) => memberFromRow(r, r.family_id ? familyNames.get(r.family_id) ?? null : null))
})

/** Lightweight lookup for names and photos by id. */
export const getPeopleIndex = cache(async (): Promise<Map<string, PersonSummary>> => {
  const members = await getMembers()
  return new Map(members.map((m) => [m.id, m]))
})

export async function getMember(id: string): Promise<DirectoryMember | null> {
  return (await getMembers()).find((m) => m.id === id) ?? null
}

function childFromRow(row: Database['public']['Tables']['family_children']['Row'], familyName: string): DirectoryChild {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ')
  return {
    id: row.id,
    familyId: row.family_id,
    familyName,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName,
    birthday: row.show_birthday ? row.birthday : null,
    gender: (row.gender as Gender | null) ?? null,
    photo: row.photo,
    photoPosition: row.photo_position,
  }
}

export function formatFamilyAddress(f: { address_line1: string | null; address_line2: string | null; city: string | null; state: string | null; postal_code: string | null; show_address: boolean }): string[] {
  if (!f.show_address) return []
  const cityLine = [f.city, [f.state, f.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [f.address_line1, f.address_line2, cityLine].filter((l): l is string => Boolean(l && l.trim()))
}

/** Families with their approved members and children. */
export const getFamilies = cache(async (): Promise<DirectoryFamily[]> => {
  const supabase = await getSupabaseServer()
  if (!supabase) return []
  const [{ data: families }, { data: children }, members] = await Promise.all([
    supabase.from('families').select('*').order('family_name'),
    supabase.from('family_children').select('*').order('birthday', { ascending: true, nullsFirst: false }),
    getMembers(),
  ])
  return (families ?? []).map((f) => ({
    id: f.id,
    familyName: f.family_name,
    photo: f.photo,
    photoPosition: f.photo_position,
    address: formatFamilyAddress(f),
    members: members.filter((m) => m.familyId === f.id),
    children: (children ?? []).filter((c) => c.family_id === f.id).map((c) => childFromRow(c, f.family_name)),
  }))
})

export async function getFamily(id: string): Promise<DirectoryFamily | null> {
  return (await getFamilies()).find((f) => f.id === id) ?? null
}

export async function getChild(id: string): Promise<DirectoryChild | null> {
  for (const f of await getFamilies()) {
    const c = f.children.find((x) => x.id === id)
    if (c) return c
  }
  return null
}

/** The signed-in member's own family with raw rows for editing. */
export async function getMyFamily(ctx: PortalContext) {
  if (!ctx.profile.family_id) return null
  const { data: family } = await ctx.supabase.from('families').select('*').eq('id', ctx.profile.family_id).maybeSingle()
  if (!family) return null
  const { data: children } = await ctx.supabase.from('family_children').select('*').eq('family_id', family.id).order('created_at')
  const members = (await getMembers()).filter((m) => m.familyId === family.id)
  return { family, children: children ?? [], members }
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

const MESSAGE_SELECT = 'id, sender_id, group_id, recipient_id, body, message_type, image_path, image_width, image_height, edited_at, deleted_at, created_at'

type RawMessage = Pick<
  Database['public']['Tables']['messages']['Row'],
  'id' | 'sender_id' | 'group_id' | 'recipient_id' | 'body' | 'message_type' | 'image_path' | 'image_width' | 'image_height' | 'edited_at' | 'deleted_at' | 'created_at'
>

async function signChatImages(supabase: Client, paths: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)))
  if (!unique.length) return new Map()
  const { data } = await supabase.storage.from('chat-media').createSignedUrls(unique, 60 * 60)
  const out = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out.set(item.path, item.signedUrl)
  }
  return out
}

/** Attach sender names, reactions, and signed image URLs to raw rows. */
export async function hydrateMessages(supabase: Client, rows: RawMessage[], userId: string): Promise<ChatMessage[]> {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const [people, { data: reactions }, images] = await Promise.all([
    getPeopleIndex(),
    supabase.from('chat_message_reactions').select('message_id, member_id, emoji').in('message_id', ids),
    signChatImages(supabase, rows.filter((r) => r.image_path && !r.deleted_at).map((r) => r.image_path as string)),
  ])
  const reactionsByMessage = new Map<string, ChatReactionSummary[]>()
  for (const r of reactions ?? []) {
    const list = reactionsByMessage.get(r.message_id) ?? []
    let entry = list.find((x) => x.emoji === r.emoji)
    if (!entry) {
      entry = { emoji: r.emoji, count: 0, reactedByMe: false, names: [] }
      list.push(entry)
    }
    entry.count += 1
    if (r.member_id === userId) entry.reactedByMe = true
    entry.names.push(people.get(r.member_id)?.fullName ?? 'Member')
    reactionsByMessage.set(r.message_id, list)
  }
  return rows.map((r) => {
    const sender = people.get(r.sender_id)
    return {
      id: r.id,
      senderId: r.sender_id,
      senderName: sender?.fullName ?? 'Member',
      senderPhoto: sender?.photo ?? null,
      senderPhotoPosition: sender?.photoPosition ?? '50% 50%',
      groupId: r.group_id,
      recipientId: r.recipient_id,
      body: r.deleted_at ? '' : r.body,
      messageType: (r.message_type === 'image' ? 'image' : 'text') as 'text' | 'image',
      imageUrl: r.deleted_at || !r.image_path ? null : images.get(r.image_path) ?? null,
      imageWidth: r.image_width,
      imageHeight: r.image_height,
      editedAt: r.edited_at,
      deletedAt: r.deleted_at,
      createdAt: r.created_at,
      reactions: (reactionsByMessage.get(r.id) ?? []).sort((a, b) => a.emoji.localeCompare(b.emoji)),
    }
  })
}

export type ConversationTarget = { groupId: string; recipientId?: undefined } | { groupId?: undefined; recipientId: string }

/** Newest-first keyset page, returned in chronological order. */
export async function getMessagePage(ctx: PortalContext, target: ConversationTarget, cursor: ChatCursor | null): Promise<ChatPage> {
  let query = ctx.supabase.from('messages').select(MESSAGE_SELECT).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(CHAT_PAGE_SIZE + 1)
  if (target.groupId) {
    query = query.eq('group_id', target.groupId)
  } else {
    query = query
      .is('group_id', null)
      .or(`and(sender_id.eq.${ctx.userId},recipient_id.eq.${target.recipientId}),and(sender_id.eq.${target.recipientId},recipient_id.eq.${ctx.userId})`)
  }
  if (cursor && isValidCursor(cursor)) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
  }
  const { data, error } = await query
  if (error || !data) {
    if (error) console.warn('[chat] page read failed:', error.message)
    return { messages: [], nextCursor: null, hasMore: false }
  }
  const hasMore = data.length > CHAT_PAGE_SIZE
  const rows = data.slice(0, CHAT_PAGE_SIZE)
  const oldest = rows[rows.length - 1]
  const messages = await hydrateMessages(ctx.supabase, rows.slice().reverse(), ctx.userId)
  return { messages, nextCursor: hasMore && oldest ? { createdAt: oldest.created_at, id: oldest.id } : null, hasMore }
}

export async function getMessagesByIds(ctx: PortalContext, ids: string[]): Promise<ChatMessage[]> {
  if (!ids.length) return []
  const { data } = await ctx.supabase.from('messages').select(MESSAGE_SELECT).in('id', ids)
  return hydrateMessages(ctx.supabase, data ?? [], ctx.userId)
}

export async function getChatUnread(ctx: PortalContext): Promise<ChatUnreadSummary> {
  if (!ctx.approved) return { total: 0, groups: {}, direct: {} }
  const { data, error } = await ctx.supabase.rpc('chat_unread_summary')
  if (error) return { total: 0, groups: {}, direct: {} }
  return normalizeUnreadSummary(data)
}

export async function getAccessibleGroups(ctx: PortalContext): Promise<GroupRow[]> {
  const { data } = await ctx.supabase.from('groups').select('*').is('archived_at', null).order('kind').order('name')
  return (data ?? []).filter((g) => g.kind !== 'event')
}

export async function getGroup(ctx: PortalContext, id: string): Promise<GroupRow | null> {
  const { data } = await ctx.supabase.from('groups').select('*').eq('id', id).maybeSingle()
  return data ?? null
}

const kindOrder: Record<GroupKind, number> = { congregation: 0, men: 1, women: 1, custom: 2, event: 3 }

/** Group and direct conversations for the chat list, unread counts attached. */
export async function getConversations(ctx: PortalContext): Promise<{ groups: ConversationSummary[]; direct: ConversationSummary[] }> {
  const [groups, unread, { data: directRows }, people] = await Promise.all([
    getAccessibleGroups(ctx),
    getChatUnread(ctx),
    ctx.supabase.rpc('direct_conversations'),
    getPeopleIndex(),
  ])
  const groupIds = groups.map((g) => g.id)
  const latestByGroup = new Map<string, RawMessage>()
  if (groupIds.length) {
    const { data: recent } = await ctx.supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(200)
    for (const m of recent ?? []) {
      if (m.group_id && !latestByGroup.has(m.group_id)) latestByGroup.set(m.group_id, m)
    }
  }
  const groupSummaries: ConversationSummary[] = groups
    .map((g) => {
      const last = latestByGroup.get(g.id) ?? null
      return {
        kind: 'group' as const,
        id: g.id,
        name: g.name,
        photo: null,
        photoPosition: '50% 50%',
        groupKind: g.kind as GroupKind,
        preview: conversationPreview(last ? { body: last.body, messageType: last.message_type as 'text' | 'image', deletedAt: last.deleted_at } : null),
        lastAt: last?.created_at ?? null,
        unread: unread.groups[g.id] ?? 0,
      }
    })
    .sort((a, b) => kindOrder[a.groupKind ?? 'custom'] - kindOrder[b.groupKind ?? 'custom'] || (b.lastAt ?? '').localeCompare(a.lastAt ?? '') || a.name.localeCompare(b.name))

  const direct: ConversationSummary[] = (directRows ?? [])
    .map((row): ConversationSummary | null => {
      const person = people.get(row.member_id)
      if (!person) return null
      return {
        kind: 'direct',
        id: row.member_id,
        name: person.fullName,
        photo: person.photo,
        photoPosition: person.photoPosition,
        groupKind: null,
        preview: conversationPreview({ body: row.last_body, messageType: row.last_type as 'text' | 'image', deletedAt: row.last_body === '' && row.last_type === 'text' ? row.last_at : null }),
        lastAt: row.last_at,
        unread: unread.direct[row.member_id] ?? 0,
      }
    })
    .filter((x): x is ConversationSummary => Boolean(x))
    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))

  return { groups: groupSummaries, direct }
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

/** Every occurrence in the range from all four sources, sorted. */
export async function getCalendarItems(ctx: PortalContext, range: CalendarRange): Promise<CalendarItem[]> {
  const publicClient = getSupabase()
  const [publicEvents, { data: memberEvents }, { data: specials }, { data: assignments }, people] = await Promise.all([
    publicClient ? publicClient.from('events').select('*').eq('published', true) : Promise.resolve({ data: [] as Database['public']['Tables']['events']['Row'][] }),
    ctx.supabase.from('calendar_events').select('*'),
    ctx.supabase.from('special_events').select('*').eq('status', 'published').is('archived_at', null).not('starts_at', 'is', null),
    ctx.supabase.from('service_assignments').select('*').gte('service_date', addDays(range.start, -1)).lte('service_date', addDays(range.end, 1)).eq('duty', 'speaker'),
    getPeopleIndex(),
  ])

  const items: CalendarItem[] = []

  for (const e of publicEvents.data ?? []) {
    items.push(
      ...occurrencesInRange(
        {
          id: `public:${e.id}`,
          source: 'public',
          title: e.title,
          startsAt: e.start_date,
          endsAt: e.end_date,
          allDay: false,
          category: e.category,
          location: e.location_name,
          description: e.summary,
          href: `/events/${e.slug}`,
          editableId: null,
          recurring: e.recurring,
          visibility: 'public',
        },
        range
      )
    )
  }

  for (const e of memberEvents ?? []) {
    items.push(
      ...occurrencesInRange(
        {
          id: `members:${e.id}`,
          source: 'members',
          title: e.title,
          startsAt: e.starts_at,
          endsAt: e.ends_at,
          allDay: e.all_day,
          category: e.category,
          location: e.location,
          description: e.description,
          href: null,
          editableId: e.id,
          recurring: e.recurring,
          recurrenceEndsOn: e.recurrence_ends_on,
          visibility: e.visibility as 'members' | 'leaders',
        },
        range
      )
    )
  }

  for (const s of specials ?? []) {
    if (!s.starts_at) continue
    items.push(
      ...occurrencesInRange(
        {
          id: `special:${s.id}`,
          source: 'special',
          title: s.title,
          startsAt: s.starts_at,
          endsAt: s.ends_at,
          allDay: s.all_day,
          category: 'Special event',
          location: s.location,
          description: s.description,
          href: `/members/events/${s.id}`,
          editableId: null,
          recurring: null,
          visibility: 'members',
        },
        range
      )
    )
  }

  for (const a of assignments ?? []) {
    const startsAt = assemblyStartsAt(a.service_date, a.service_slot as 'sunday-am' | 'sunday-pm' | 'wednesday')
    if (!startsAt) continue
    const name = (a.member_id ? people.get(a.member_id)?.fullName : null) ?? a.assignee_name ?? ''
    items.push({
      id: `service:${a.id}`,
      source: 'service',
      title: `${dutyLabel(a.duty)}: ${name}`,
      startsAt,
      endsAt: null,
      allDay: false,
      category: 'Worship',
      location: null,
      description: null,
      href: '/members/schedule',
      editableId: null,
      recurring: null,
      visibility: 'members',
    })
  }

  return sortItems(items)
}

export async function getCalendarBuckets(ctx: PortalContext, range: CalendarRange) {
  const items = await getCalendarItems(ctx, range)
  return { items, byDay: bucketByDay(items, range) }
}

/** The next few things on the calendar, for the members home. */
export async function getUpcoming(ctx: PortalContext, limit = 5): Promise<CalendarItem[]> {
  const today = getTodayKey()
  const items = await getCalendarItems(ctx, { start: today, end: addDays(today, 30) })
  const now = Date.now()
  return items.filter((i) => new Date(i.endsAt ?? i.startsAt).getTime() >= now && i.source !== 'service').slice(0, limit)
}

/** Occurrences helper re-exported for the public events fallback. */
export { upcomingOccurrences }

// ---------------------------------------------------------------------------
// Service schedule and communion
// ---------------------------------------------------------------------------

export async function getServiceAssignments(ctx: PortalContext, from: DateKey, to: DateKey): Promise<AssignmentInput[]> {
  const [{ data }, people] = await Promise.all([
    ctx.supabase.from('service_assignments').select('*').gte('service_date', from).lte('service_date', to).order('service_date'),
    getPeopleIndex(),
  ])
  return (data ?? []).map((a) => ({ ...a, member_name: a.member_id ? people.get(a.member_id)?.fullName ?? null : null }))
}

export async function getServiceMonth(ctx: PortalContext, year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-31`
  const [rows, { data: monthRow }] = await Promise.all([
    getServiceAssignments(ctx, from, to),
    ctx.supabase.from('service_schedule_months').select('*').eq('year', year).eq('month', month).maybeSingle(),
  ])
  return { rows, monthRow: monthRow ?? null }
}

export async function getCommunionYear(ctx: PortalContext, year: number) {
  const [{ data }, people] = await Promise.all([
    ctx.supabase.from('communion_signups').select('*').eq('signup_year', year).is('removed_at', null).order('signup_month'),
    getPeopleIndex(),
  ])
  return (data ?? []).map((s) => ({ ...s, member: people.get(s.member_id) ?? null }))
}

// ---------------------------------------------------------------------------
// Special events
// ---------------------------------------------------------------------------

export async function listSpecialEvents(ctx: PortalContext): Promise<Array<SpecialEventRow & { organizer: PersonSummary | null; unread: number }>> {
  const [{ data }, people, unread] = await Promise.all([
    ctx.supabase.from('special_events').select('*').is('archived_at', null).order('starts_at', { ascending: true, nullsFirst: false }),
    getPeopleIndex(),
    getChatUnread(ctx),
  ])
  return (data ?? []).map((e) => ({ ...e, organizer: people.get(e.created_by) ?? null, unread: e.chat_group_id ? unread.groups[e.chat_group_id] ?? 0 : 0 }))
}

export async function getSpecialEvent(ctx: PortalContext, id: string) {
  const { data: event } = await ctx.supabase.from('special_events').select('*').eq('id', id).maybeSingle()
  if (!event) return null
  const [{ data: canManage }, { data: items }, { data: rsvps }, people, { data: exclusions }] = await Promise.all([
    ctx.supabase.rpc('can_manage_special_event', { target_event_id: id }),
    ctx.supabase.from('special_event_signup_items').select('*').eq('event_id', id).order('display_order'),
    ctx.supabase.from('special_event_rsvps').select('*').eq('event_id', id),
    getPeopleIndex(),
    ctx.supabase.from('special_event_exclusions').select('member_id').eq('event_id', id),
  ])
  const itemIds = (items ?? []).map((i) => i.id)
  const { data: signups } = itemIds.length
    ? await ctx.supabase.from('special_event_signups').select('*').in('signup_item_id', itemIds)
    : { data: [] as Database['public']['Tables']['special_event_signups']['Row'][] }
  const invitees = canManage ? (await ctx.supabase.rpc('special_event_invitees', { target_event_id: id })).data ?? [] : []
  const gender = ctx.profile.gender as Gender | null
  const excluded = new Set((exclusions ?? []).map((x) => x.member_id))
  const participates =
    event.status === 'published' &&
    !event.archived_at &&
    !excluded.has(ctx.userId) &&
    (event.audience === 'everyone' || (event.audience === 'women' && gender === 'female') || (event.audience === 'men' && gender === 'male'))
  return {
    event,
    canManage: Boolean(canManage),
    participates,
    organizer: people.get(event.created_by) ?? null,
    items: (items ?? []).map((i) => ({
      ...i,
      signups: (signups ?? [])
        .filter((s) => s.signup_item_id === i.id)
        .map((s) => ({ ...s, person: people.get(s.member_id) ?? null })),
    })),
    myRsvp: (rsvps ?? []).find((r) => r.member_id === ctx.userId) ?? null,
    rsvps: (rsvps ?? []).map((r) => ({ ...r, person: people.get(r.member_id) ?? null })),
    invitees,
    excludedIds: Array.from(excluded),
    people,
  }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getUnreadNotificationCount(ctx: PortalContext): Promise<number> {
  if (!ctx.approved) return 0
  const { count } = await ctx.supabase.from('in_app_notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', ctx.userId).is('read_at', null)
  return count ?? 0
}

export async function getNotificationPreferences(ctx: PortalContext) {
  const { data } = await ctx.supabase.from('notification_preferences').select('*').eq('member_id', ctx.userId).maybeSingle()
  return (
    data ?? {
      member_id: ctx.userId,
      direct_messages: true,
      group_messages: true,
      announcements: true,
      calendar: true,
      special_events: true,
      admin_new_member: true,
      created_at: '',
      updated_at: '',
    }
  )
}

export async function getGroupNotificationPreferences(ctx: PortalContext): Promise<Map<string, boolean>> {
  const { data } = await ctx.supabase.from('group_notification_preferences').select('group_id, enabled').eq('member_id', ctx.userId)
  return new Map((data ?? []).map((r) => [r.group_id, r.enabled]))
}

export async function getInstalledApp(ctx: PortalContext) {
  const { data } = await ctx.supabase.from('installed_app_detections').select('*').eq('member_id', ctx.userId).maybeSingle()
  return data ?? null
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getAllProfiles(ctx: PortalContext): Promise<MemberProfileRow[]> {
  const { data } = await ctx.supabase.from('member_profiles').select('*').order('approved').order('created_at', { ascending: false })
  return data ?? []
}

export async function getAppReadiness(ctx: PortalContext) {
  const [profiles, { data: detections }, { data: families }] = await Promise.all([
    getAllProfiles(ctx),
    ctx.supabase.from('installed_app_detections').select('*'),
    ctx.supabase.from('families').select('id'),
  ])
  const detectionByMember = new Map((detections ?? []).map((d) => [d.member_id, d]))
  const approved = profiles.filter((p) => p.approved)
  const weekAgo = Date.now() - 7 * 86_400_000
  return {
    approved,
    pending: profiles.filter((p) => !p.approved && !p.rejected_at),
    rejected: profiles.filter((p) => !p.approved && p.rejected_at),
    familyCount: (families ?? []).length,
    installed: approved.filter((p) => detectionByMember.get(p.id)?.standalone_detected),
    notInstalled: approved.filter((p) => !detectionByMember.get(p.id)?.standalone_detected),
    activeThisWeek: approved.filter((p) => p.last_seen_at && new Date(p.last_seen_at).getTime() >= weekAgo),
    neverSignedIn: approved.filter((p) => !p.last_seen_at),
    incompleteProfiles: approved.filter((p) => !p.phone || !p.birthday || !p.gender),
    noPhoto: approved.filter((p) => !p.photo),
    noFamily: approved.filter((p) => !p.family_id),
    welcomeNotSent: approved.filter((p) => !p.welcome_email_sent_at),
    detectionByMember,
  }
}

export async function getGroupsAdmin(ctx: PortalContext) {
  const [{ data: groups }, { data: members }, people] = await Promise.all([
    ctx.supabase.from('groups').select('*').is('special_event_id', null).order('kind').order('name'),
    ctx.supabase.from('group_members').select('*'),
    getPeopleIndex(),
  ])
  return (groups ?? []).map((g) => ({
    ...g,
    members: (members ?? [])
      .filter((m) => m.group_id === g.id)
      .map((m) => people.get(m.member_id))
      .filter((p): p is PersonSummary => Boolean(p))
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
  }))
}
