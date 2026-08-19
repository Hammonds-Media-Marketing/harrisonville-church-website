import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { SiteNav } from '@/components/layout/SiteNav'
import { PRIMARY_CTA, primaryNav, site } from '@/lib/site'

/** Decorative cloud-puff bottom edge for the desktop header — echoes the sky
 *  scene in the hero. Purely visual: hidden from assistive tech and mouse
 *  events, so the nav's function is untouched. Irregular arc widths and
 *  depths keep it reading as a cloud rather than a scalloped border. */
function CloudEdge() {
  const puffs =
    'M0 8 A65 10 0 0 0 130 8 A70 14 0 0 0 270 8 A60 9 0 0 0 390 8 A90 13 0 0 0 570 8 A60 8 0 0 0 690 8 A90 14 0 0 0 870 8 A60 9 0 0 0 990 8 A85 13 0 0 0 1160 8 A70 10 0 0 0 1300 8 A70 12 0 0 0 1440 8'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full hidden md:block">
      <svg viewBox="0 0 1440 26" preserveAspectRatio="none" focusable="false" className="block h-[24px] w-full">
        {/* -1px overlap up into the bar prevents a hairline seam */}
        <path d={`${puffs} V-1 H0 Z`} fill="var(--color-bg)" />
        <path
          d={puffs}
          fill="none"
          stroke="var(--color-border)"
          strokeOpacity="0.5"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

/** Global header. The shell is a Server Component; only the interactive nav is
 *  a client island. */
export function Header() {
  return (
    <header className="sticky top-0 z-header bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      {/* Main bar — flat border on mobile, cloud edge on desktop */}
      <div className="border-b border-border/50 md:border-b-0">
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="inline-flex items-center" aria-label={`${site.name} — home`}>
            <Logo className="h-12 w-auto md:h-14" />
          </Link>
          <SiteNav items={primaryNav} cta={PRIMARY_CTA} />
        </div>
      </div>
      <CloudEdge />
    </header>
  )
}
