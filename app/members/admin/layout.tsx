import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Container } from '@/components/primitives/Layout'
import { getAuthContext, isEditorRole } from '@/lib/supabase-server'

/**
 * Admin shell. Editors and admins only — everyone else is sent back to the
 * members dashboard. Row Level Security enforces the same boundary on every
 * query, so this guard is presentation, not the security layer.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getAuthContext()
  if (!user) redirect('/members/login')
  if (!isEditorRole(profile)) redirect('/members')

  const links = [
    { href: '/members/admin', label: 'Overview' },
    { href: '/members/admin/pages', label: 'Pages' },
    { href: '/members/admin/events', label: 'Events' },
    { href: '/members/admin/sermons', label: 'Sermons' },
    { href: '/members/admin/articles', label: 'Articles' },
    { href: '/members/admin/announcements', label: 'Announcements' },
    ...(profile?.role === 'admin' ? [{ href: '/members/admin/members', label: 'Members' }] : []),
  ]

  return (
    <>
      <div className="border-b border-border bg-bg">
        <Container>
          <nav aria-label="Site admin" className="flex flex-wrap gap-x-5 gap-y-2 py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-semibold uppercase tracking-wide text-muted hover:text-link-hover">
                {l.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      {children}
    </>
  )
}
