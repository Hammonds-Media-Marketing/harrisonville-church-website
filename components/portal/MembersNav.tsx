'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { chatUnreadTotalAction } from '@/app/members/chat/actions'
import { CountBadge } from '@/components/primitives/Feedback'
import { CalendarIcon, HomeIcon, MessageIcon, UserIcon, UsersIcon } from '@/components/ui/icons'

/**
 * Members-area navigation. On desktop it is a horizontal bar under the site
 * header; on phones it becomes a fixed bottom tab bar with the five most
 * used destinations, so the portal feels like an app when installed.
 */

export type NavItem = { href: string; label: string; icon: 'home' | 'directory' | 'chat' | 'calendar' | 'profile' | 'events' | 'admin' }

const icons: Record<NavItem['icon'], ReactNode> = {
  home: <HomeIcon className="h-5 w-5" />,
  directory: <UsersIcon className="h-5 w-5" />,
  chat: <MessageIcon className="h-5 w-5" />,
  calendar: <CalendarIcon className="h-5 w-5" />,
  profile: <UserIcon className="h-5 w-5" />,
  events: <CalendarIcon className="h-5 w-5" />,
  admin: <UserIcon className="h-5 w-5" />,
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/members') return pathname === '/members'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MembersNav({ items, userId, initialChatUnread, approved }: { items: NavItem[]; userId: string; initialChatUnread: number; approved: boolean }) {
  const pathname = usePathname()
  const [chatUnread, setChatUnread] = useState(initialChatUnread)
  const inThread = /^\/members\/chat\/(direct|group)\//.test(pathname)

  const refresh = useCallback(() => {
    if (!approved) return
    chatUnreadTotalAction()
      .then(setChatUnread)
      .catch(() => {})
  }, [approved])

  useEffect(() => setChatUnread(initialChatUnread), [initialChatUnread])

  useEffect(() => {
    if (!approved) return
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const messages = supabase.channel('nav-chat-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh).subscribe()
    const reads = supabase
      .channel('nav-chat-reads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_read_states', filter: `member_id=eq.${userId}` }, refresh)
      .subscribe()
    return () => {
      void supabase.removeChannel(messages)
      void supabase.removeChannel(reads)
    }
  }, [approved, userId, refresh])

  const mobileItems = items.filter((i) => ['home', 'directory', 'chat', 'calendar', 'profile'].includes(i.icon)).slice(0, 5)

  return (
    <>
      <nav aria-label="Members area" className="members-nav-desktop hidden flex-wrap items-center gap-1 md:flex">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold no-underline transition-colors ${
                active ? 'bg-primary-strong text-on-primary hover:text-on-primary' : 'text-heading hover:bg-surface-2 hover:text-heading'
              }`}
            >
              {item.label}
              {item.icon === 'chat' ? <CountBadge count={chatUnread} label={`${chatUnread} unread chat messages`} /> : null}
            </Link>
          )
        })}
      </nav>

      {!inThread ? (
        <nav
          aria-label="Members area"
          className="members-nav-mobile fixed inset-x-0 bottom-0 z-sticky border-t border-border/60 bg-bg/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 backdrop-blur md:hidden"
        >
          <ul className="m-0 grid list-none gap-1 p-0" style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}>
            {mobileItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-semibold no-underline transition-colors ${
                      active ? 'bg-surface text-primary-strong hover:text-primary-strong' : 'text-muted hover:bg-surface hover:text-heading'
                    }`}
                  >
                    <span className="relative">
                      {icons[item.icon]}
                      {item.icon === 'chat' && chatUnread > 0 ? (
                        <CountBadge count={chatUnread} label={`${chatUnread} unread chat messages`} className="absolute -right-3 -top-2 ring-2 ring-bg" />
                      ) : null}
                    </span>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
    </>
  )
}
