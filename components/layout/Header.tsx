import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { SiteNav } from '@/components/layout/SiteNav'
import { PRIMARY_CTA, primaryNav, site } from '@/lib/site'

/** Global header. The shell is a Server Component; only the interactive nav is
 *  a client island. */
export function Header() {
  return (
    <header className="sticky top-0 z-header bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
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
