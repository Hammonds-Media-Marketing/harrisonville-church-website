import type { ReactNode } from 'react'
import { Container } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { getAuthContext, isEditorRole } from '@/lib/supabase-server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { signOutAction } from '@/app/members/actions'
import { MembersNav, type NavItem } from '@/components/portal/MembersNav'
import { NotificationBell } from '@/components/portal/NotificationBell'
import { InstalledAppReporter } from '@/components/portal/InstalledAppReporter'
import { normalizeUnreadSummary } from '@/lib/portal/chat'

// Session cookies make every members page per-visitor; never prerender.
export const dynamic = 'force-dynamic'

/**
 * Members-area shell. Signed-in visitors get the members navigation, the
 * notification bell, and (on phones) a bottom tab bar. The login and
 * confirmation pages render bare. Authorization for what each page shows
 * stays with Row Level Security and the page-level guards.
 */
export default async function MembersLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getAuthContext()
  const approved = Boolean(profile?.approved)

  let notificationUnread = 0
  let chatUnread = 0
  if (user && approved) {
    const supabase = await getSupabaseServer()
    if (supabase) {
      const [{ count }, { data: summary }] = await Promise.all([
        supabase.from('in_app_notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null),
        supabase.rpc('chat_unread_summary'),
      ])
      notificationUnread = count ?? 0
      chatUnread = normalizeUnreadSummary(summary).total
      // Presence, throttled to once an hour, for the readiness dashboard.
      const last = profile?.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0
      if (Date.now() - last > 60 * 60 * 1000) {
        await supabase.from('member_profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
      }
    }
  }

  const items: NavItem[] = approved
    ? [
        { href: '/members', label: 'Home', icon: 'home' },
        { href: '/members/directory', label: 'Directory', icon: 'directory' },
        { href: '/members/chat', label: 'Chat', icon: 'chat' },
        { href: '/members/calendar', label: 'Calendar', icon: 'calendar' },
        { href: '/members/events', label: 'Events', icon: 'events' },
        { href: '/members/profile', label: 'Profile', icon: 'profile' },
        ...(isEditorRole(profile) ? [{ href: '/members/admin', label: 'Admin', icon: 'admin' as const }] : []),
      ]
    : [
        { href: '/members', label: 'Home', icon: 'home' },
        { href: '/members/profile', label: 'Profile', icon: 'profile' },
      ]

  return (
    <>
      {user ? (
        <div className="members-shell-bar border-b border-border bg-surface">
          {/* Extra top padding on desktop keeps the links clear of the header's
              cloud-puff edge, which overhangs the bar by ~24px. */}
          <Container className="flex items-center gap-3 pb-2 pt-2 md:pt-8">
            <p className="m-0 mr-2 font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-strong md:hidden">Members</p>
            <MembersNav items={items} userId={user.id} initialChatUnread={chatUnread} approved={approved} />
            <div className="ml-auto flex items-center gap-1">
              {approved ? <NotificationBell userId={user.id} initialUnread={notificationUnread} /> : null}
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </Container>
          <InstalledAppReporter />
        </div>
      ) : null}
      <div className={user ? 'members-shell-content pb-24 md:pb-0' : ''}>{children}</div>
    </>
  )
}
