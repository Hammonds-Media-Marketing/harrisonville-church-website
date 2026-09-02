'use server'

import { revalidatePath } from 'next/cache'
import { requireApprovedMember, getUnreadNotificationCount } from '@/lib/portal/data'
import { isUuid } from '@/lib/portal/chat'
import type { InAppNotification } from '@/lib/portal/types'

/** In-app notification bell actions. Reads and writes are scoped by RLS
 *  and the two definer RPCs to the caller's own rows. */

const PAGE = 30

export async function notificationCenterAction(offset = 0): Promise<{ notifications: InAppNotification[]; unreadCount: number; hasMore: boolean; error: string }> {
  const ctx = await requireApprovedMember()
  const from = Math.max(0, Math.floor(offset))
  const [{ data, error, count }, unreadCount] = await Promise.all([
    ctx.supabase
      .from('in_app_notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', ctx.userId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1),
    getUnreadNotificationCount(ctx),
  ])
  if (error) return { notifications: [], unreadCount, hasMore: false, error: 'Notifications could not be loaded.' }
  return { notifications: data ?? [], unreadCount, hasMore: from + (data?.length ?? 0) < (count ?? 0), error: '' }
}

export async function unreadNotificationCountAction(): Promise<number> {
  const ctx = await requireApprovedMember()
  return getUnreadNotificationCount(ctx)
}

export async function markNotificationReadAction(id: string): Promise<{ error: string }> {
  const ctx = await requireApprovedMember()
  if (!isUuid(id)) return { error: 'Invalid notification.' }
  const { error } = await ctx.supabase.rpc('mark_notification_read', { target_id: id })
  revalidatePath('/members', 'layout')
  return { error: error ? 'Could not mark as read.' : '' }
}

export async function markAllNotificationsReadAction(): Promise<{ error: string }> {
  const ctx = await requireApprovedMember()
  const { error } = await ctx.supabase.rpc('mark_all_notifications_read')
  revalidatePath('/members', 'layout')
  return { error: error ? 'Could not mark all as read.' : '' }
}
