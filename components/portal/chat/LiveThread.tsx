'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { mergeMessages } from '@/lib/portal/chat'
import type { ChatCursor, ChatMessage } from '@/lib/portal/types'
import {
  deleteMessageAction,
  editMessageAction,
  fetchMessagesAction,
  fetchNewerMessagesAction,
  loadEarlierMessagesAction,
  markConversationReadAction,
  toggleReactionAction,
} from '@/app/members/chat/actions'
import { MessageList } from '@/components/portal/chat/MessageList'
import { EmptyState } from '@/components/primitives/Feedback'
import { MessageIcon } from '@/components/ui/icons'

/**
 * Keeps one conversation live. New rows arrive over Supabase realtime and
 * are refetched by id through the server (so names, reactions, and signed
 * photo URLs come back complete). When the tab returns to the foreground or
 * the socket reconnects, a catch-up query fills any gap. There is no polling.
 */
export function LiveThread({
  initialMessages,
  initialCursor,
  initialHasMore,
  userId,
  isAdmin,
  groupId,
  recipientId,
}: {
  initialMessages: ChatMessage[]
  initialCursor: ChatCursor | null
  initialHasMore: boolean
  userId: string
  isAdmin: boolean
  groupId?: string
  recipientId?: string
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const loadingRef = useRef(false)
  const latestRef = useRef(initialMessages[initialMessages.length - 1]?.createdAt ?? new Date(0).toISOString())
  const target = groupId ? { groupId } : { recipientId: recipientId as string }
  const conversationKey = groupId ? `group:${groupId}` : `direct:${recipientId}`
  const newestId = messages[messages.length - 1]?.id

  useEffect(() => {
    setMessages(initialMessages)
    setCursor(initialCursor)
    setHasMore(initialHasMore)
  }, [initialMessages, initialCursor, initialHasMore])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.createdAt > latestRef.current) latestRef.current = last.createdAt
  }, [messages])

  // Mark read on open and whenever the newest message changes; loading
  // older pages does not touch the marker.
  useEffect(() => {
    void markConversationReadAction(target).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, recipientId, newestId])

  const mergeById = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    const rows = await fetchMessagesAction(ids)
    if (rows.length) setMessages((current) => mergeMessages(current, rows, { replace: true }))
  }, [])

  const catchUp = useCallback(async () => {
    const rows = await fetchNewerMessagesAction({ ...target, after: latestRef.current })
    if (rows.length) setMessages((current) => mergeMessages(current, rows, { replace: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, recipientId])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const isRelevant = (row: Record<string, unknown> | null) => {
      if (!row) return false
      if (groupId) return row.group_id === groupId
      const s = row.sender_id
      const r = row.recipient_id
      return (s === userId && r === recipientId) || (s === recipientId && r === userId)
    }
    let firstSubscribe = true
    const channel = supabase
      .channel(`thread:${conversationKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', ...(groupId ? { filter: `group_id=eq.${groupId}` } : {}) },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | null
          if (!isRelevant(row)) return
          const id = row?.id
          if (typeof id === 'string') void mergeById([id])
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        const row = (payload.new ?? payload.old) as Record<string, unknown> | null
        const id = row?.message_id
        if (typeof id === 'string') {
          setMessages((current) => {
            if (current.some((m) => m.id === id)) void mergeById([id])
            return current
          })
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!firstSubscribe) void catchUp()
          firstSubscribe = false
        }
      })

    const onVisible = () => {
      if (document.visibilityState === 'visible') void catchUp()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      void supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
    }
  }, [conversationKey, groupId, recipientId, userId, mergeById, catchUp])

  // Group access can be removed while the thread is open; leave politely.
  useEffect(() => {
    if (!groupId) return
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const channel = supabase
      .channel(`thread-membership:${groupId}:${userId}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_members' }, async () => {
        const { data } = await supabase.rpc('can_access_group', { target_group_id: groupId })
        if (data === false) router.replace('/members/chat')
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [groupId, userId, router])

  const loadEarlier = useCallback(async () => {
    if (loadingRef.current || !hasMore || !cursor) return false
    loadingRef.current = true
    setLoadingEarlier(true)
    try {
      const result = await loadEarlierMessagesAction({ ...target, cursor })
      if (!result.page) return false
      setMessages((current) => mergeMessages(current, result.page!.messages))
      setCursor(result.page.nextCursor)
      setHasMore(result.page.hasMore)
      return true
    } catch {
      return false
    } finally {
      loadingRef.current = false
      setLoadingEarlier(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, cursor, groupId, recipientId])

  if (!messages.length) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState icon={<MessageIcon className="h-6 w-6" />} title="No messages yet" className="w-full max-w-md">
            <p>Start the conversation below.</p>
          </EmptyState>
        </div>
      </div>
    )
  }

  return (
    <MessageList
      messages={messages}
      currentUserId={userId}
      isAdmin={isAdmin}
      isGroup={Boolean(groupId)}
      conversationKey={conversationKey}
      hasMore={hasMore}
      loadingEarlier={loadingEarlier}
      onLoadEarlier={loadEarlier}
      onReact={async (id, emoji) => {
        await toggleReactionAction(id, emoji)
        await mergeById([id])
      }}
      onEdit={async (id, body) => {
        const r = await editMessageAction(id, body)
        if (!r.error) await mergeById([id])
        return r.error
      }}
      onDelete={async (id) => {
        const r = await deleteMessageAction(id)
        if (!r.error) await mergeById([id])
        return r.error
      }}
    />
  )
}
