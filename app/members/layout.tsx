import type { ReactNode } from 'react'
import Link from 'next/link'
import { Container } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { getAuthContext, isEditorRole } from '@/lib/supabase-server'
import { signOutAction } from '@/app/members/actions'

// Session cookies make every members page per-visitor; never prerender.
export const dynamic = 'force-dynamic'

/**
 * Members-area shell. Signed-in visitors get the members navigation bar;
 * the login and confirmation pages render bare. Authorization for what each
 * page shows stays with Row Level Security and the page-level guards.
 */
export default async function MembersLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getAuthContext()

  return (
    <>
      {user ? (
        <div className="border-b border-border bg-surface">
          <Container className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
            <nav aria-label="Members area" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/members" className="font-semibold text-heading hover:text-link-hover">
                Announcements
              </Link>
              <Link href="/members/directory" className="font-semibold text-heading hover:text-link-hover">
                Directory
              </Link>
              <Link href="/members/profile" className="font-semibold text-heading hover:text-link-hover">
                My profile
              </Link>
              {isEditorRole(profile) ? (
                <Link href="/members/admin" className="font-semibold text-primary-strong hover:text-link-hover">
                  Site admin
                </Link>
              ) : null}
            </nav>
            <form action={signOutAction} className="ml-auto">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </Container>
        </div>
      ) : null}
      {children}
    </>
  )
}
