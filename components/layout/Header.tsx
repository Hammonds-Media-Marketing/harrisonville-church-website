import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { SiteNav } from '@/components/layout/SiteNav'
import { ClockIcon, PhoneIcon } from '@/components/ui/icons'
import { PRIMARY_CTA, primaryNav, site } from '@/lib/site'

/** Global header. The shell is a Server Component; only the interactive nav is
 *  a client island. Service times sit in a utility strip so the most-searched
 *  detail is visible immediately. */
export function Header() {
  return (
    <header className="sticky top-0 z-header bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      {/* Utility strip */}
      <div className="bg-surface-deep text-on-deep">
        <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-2 px-5 py-1.5 text-sm">
          <p className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-secondary" />
            <span>Sundays 10:00 AM &amp; 2:00 PM &middot; Wednesdays 7:30 PM</span>
          </p>
          <a href={`tel:${site.phone}`} className="flex items-center gap-2 text-on-deep hover:text-secondary">
            <PhoneIcon className="h-4 w-4 text-secondary" />
            <span>{site.phoneDisplay}</span>
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border/50">
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="inline-flex items-center" aria-label={`${site.name} — home`}>
            <Logo className="h-12 w-auto md:h-14" />
          </Link>
          <SiteNav items={primaryNav} cta={PRIMARY_CTA} />
        </div>
      </div>
    </header>
  )
}
