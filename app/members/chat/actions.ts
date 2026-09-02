'use server'

import { revalidatePath } from 'next/cache'
import { requireApprovedMember, getMessagePage, getMessagesByIds, getChatUnread, type ConversationTarget } from '@/lib/portal/data'
import { CHAT_REACTIONS, canDeleteMessage, canEditMessage, isUuid, isValidCursor } from '@/lib/portal/chat'
import type { ChatCursor, ChatMessage, ChatPage } from '@/lib/portal/types'

/**
 * Chat server actions. Sends are plain inserts under Row Level Security;
 * the database trigger fans out notifications. Delivery to other members is
 * realtime, so there is no optimistic path to keep in sync.
 */

type SendState = { error: string; submissionId: string }

function targetFrom(groupId: string, recipientId: string): ConversationTarget | null {
  if (isUuid(groupId) && !recipientId) return { groupId }
  if (isUuid(recipientId) && !groupId) return { recipientId }
  return null
}

export async function sendMessageAction(_prev: SendState, formData: FormData): Promise<SendState> {
  const submissionId = String(formData.get('submission_id') ?? '')
  const ctx = await requireApprovedMember()
  const target = targetFrom(String(formData.get('group_id') ?? ''), String(formData.get('recipient_id') ?? ''))
  if (!target) return { error: 'Choose a conversation first.', submissionId }
  if (target.recipientId === ctx.userId) return { error: 'You cannot message yourself.', submissionId }

  const body = String(formData.get('body') ?? '').trim()
  const imagePath = String(formData.get('image_path') ?? '').trim()
  if (!body && !imagePath) return { error: 'Write a message or add a photo.', submissionId }
  if (body.length > 4000) return { error: 'Keep a message under 4,000 characters.', submissionId }
  // The upload policy only lets a member write under their own folder.
  if (imagePath && !imagePath.startsWith(`${ctx.userId}/`)) return { error: 'That photo could not be attached.', submissionId }

  const width = Number(formData.get('image_width'))
  const height = Number(formData.get('image_height'))
  const { error } = await ctx.supabase.from('messages').insert({
    sender_id: ctx.userId,
    group_id: target.groupId ?? null,
    recipient_id: target.recipientId ?? null,
    body,
    message_type: imagePath ? 'image' : 'text',
    image_path: imagePath || null,
    image_width: imagePath && Number.isFinite(width) && width > 0 ? Math.round(width) : null,
    image_height: imagePath && Number.isFinite(height) && height > 0 ? Math.round(height) : null,
  })
  if (error) {
    console.warn('[chat] send failed:', error.message)
    return { error: 'That message did not send. Check your connection and try again.', submissionId }
  }
  revalidatePath('/members/chat')
  return { error: '', submissionId }
}

export async function loadEarlierMessagesAction(input: { groupId?: string; recipientId?: string; cursor: ChatCursor }): Promise<{ page: ChatPage | null; error: string }> {
  const ctx = await requireApprovedMember()
  const target = targetFrom(input.groupId ?? '', input.recipientId ?? '')
  if (!target || !isValidCursor(input.cursor)) return { page: null, error: 'That request was not valid.' }
  return { page: await getMessagePage(ctx, target, input.cursor), error: '' }
}

export async function fetchMessagesAction(ids: string[]): Promise<ChatMessage[]> {
  const ctx = await requireApprovedMember()
  return getMessagesByIds(ctx, ids.filter(isUuid).slice(0, 100))
}

export async function fetchNewerMessagesAction(input: { groupId?: string; recipientId?: string; after: string }): Promise<ChatMessage[]> {
  const ctx = await requireApprovedMember()
  const target = targetFrom(input.groupId ?? '', input.recipientId ?? '')
  if (!target || !Number.isFinite(Date.parse(input.after))) return []
  let query = ctx.supabase
    .from('messages')
    .select('id')
    .gt('created_at', new Date(input.after).toISOString())
    .order('created_at', { ascending: true })
    .limit(50)
  query = target.groupId
    ? query.eq('group_id', target.groupId)
    : query.is('group_id', null).or(`and(sender_id.eq.${ctx.userId},recipient_id.eq.${target.recipientId}),and(sender_id.eq.${target.recipientId},recipient_id.eq.${ctx.userId})`)
  const { data } = await query
  return getMessagesByIds(ctx, (data ?? []).map((m) => m.id))
}

export async function markConversationReadAction(input: { groupId?: string; recipientId?: string }): Promise<{ error: string }> {
  const ctx = await requireApprovedMember()
  const target = targetFrom(input.groupId ?? '', input.recipientId ?? '')
  if (!target) return { error: 'Choose a conversation.' }
  const now = new Date().toISOString()
  const match = target.groupId ? { group_id: target.groupId } : { direct_member_id: target.recipientId }
  const existing = await ctx.supabase.from('chat_read_states').select('member_id').eq('member_id', ctx.userId).match(match).maybeSingle()
  const { error } = existing.data
    ? await ctx.supabase.from('chat_read_states').update({ last_read_at: now }).eq('member_id', ctx.userId).match(match)
    : await ctx.supabase.from('chat_read_states').insert({ member_id: ctx.userId, group_id: target.groupId ?? null, direct_member_id: target.recipientId ?? null, last_read_at: now })
  return { error: error ? 'Could not update read state.' : '' }
}

export async function chatUnreadTotalAction(): Promise<number> {
  const ctx = await requireApprovedMember()
  return (await getChatUnread(ctx)).total
}

export async function toggleReactionAction(messageId: string, emoji: string): Promise<{ error: string }> {
  const ctx = await requireApprovedMember()
  if (!isUuid(messageId) || !(CHAT_REACTIONS as readonly string[]).includes(emoji)) return { error: 'Choose a supported reaction.' }
  const { data: existing } = await ctx.supabase.from('chat_message_reactions').select('emoji').eq('message_id', messageId).eq('member_id', ctx.userId).maybeSingle()
  const { error } =
    existing?.emoji === emoji
      ? await ctx.supabase.from('chat_message_reactions').delete().eq('message_id', messageId).eq('member_id', ctx.userId)
      : await ctx.supabase.from('chat_message_reactions').upsert({ message_id: messageId, member_id: ctx.userId, emoji }, { onConflict: 'message_id,member_id' })
  return { error: error ? 'That reaction did not save.' : '' }
}

export async function editMessageAction(messageId: string, body: string): Promise<{ error: string }> {
  const ctx = await requireApprovedMember()
  const trimmed = body.trim()
  if (!trimmed) return { error: 'A message cannot be empty.' }
  const [message] = await getMessagesByIds(ctx, [messageId])
  if (!message || !canEditMessage(message, ctx.userId)) return { error: 'This message can no longer be edited.' }
  if (message.body === trimmed) return { error: '' }
  const { error } = await ctx.supabase.from('messages').update({ body: trimmed, edited_at: new Date().toISOString() }).eq('id', messageId).eq('sender_id', ctx.userId)
  return { error: error ? 'This message could not be edited.' : '' }
}

export async function deleteMessageAction(messageId: string): Promise<{ error: string }> {
  const ctx = await requireApprovedMember()
  const [message] = await getMessagesByIds(ctx, [messageId])
  if (!message || !canDeleteMessage(message, ctx.userId, ctx.isAdmin)) return { error: 'This message could not be removed.' }
  const { error } = await ctx.supabase
    .from('messages')
    .update({ body: '', image_path: null, image_width: null, image_height: null, deleted_at: new Date().toISOString() })
    .eq('id', messageId)
  return { error: error ? 'This message could not be removed.' : '' }
}
