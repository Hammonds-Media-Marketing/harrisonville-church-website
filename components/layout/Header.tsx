import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { SiteNav } from '@/components/layout/SiteNav'
import { PRIMARY_CTA, primaryNav, site } from '@/lib/site'

/** Shared background for the header bar and the cloud edge: slightly
 *  translucent white, constant in every scroll state. */
const NAV_BG = 'bg-white/90'

/** Cloud-puff outline, shared by the mask (fill) and the outline (stroke).
 *  Irregular arc widths and depths keep it reading as a cloud rather than a
 *  scalloped border. */
const CLOUD_PUFFS =
  'M0 8 A65 10 0 0 0 130 8 A70 14 0 0 0 270 8 A60 9 0 0 0 390 8 A90 13 0 0 0 570 8 A60 8 0 0 0 690 8 A90 14 0 0 0 870 8 A60 9 0 0 0 990 8 A85 13 0 0 0 1160 8 A70 10 0 0 0 1300 8 A70 12 0 0 0 1440 8'

const CLOUD_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 26" preserveAspectRatio="none"><path d="${CLOUD_PUFFS} V0 H0 Z" fill="#000"/></svg>`
)}")`

/** Decorative cloud-puff bottom edge for the desktop header — echoes the sky
 *  scene in the hero. Purely visual: hidden from assistive tech and mouse
 *  events, so the nav's function is untouched. The fill matches the bar's
 *  background, shaped by a CSS mask; the faint outline rides on a separate
 *  unmasked SVG. */
function CloudEdge() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full hidden h-[24px] md:block">
      {/* Cloud-shaped fill. -mt-px tucks 1px under the bar so no hairline
          gap opens at the seam. */}
      <div
        className={`-mt-px h-full w-full ${NAV_BG}`}
        style={{
          maskImage: CLOUD_MASK,
          maskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskImage: CLOUD_MASK,
          WebkitMaskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
        }}
      />
      <svg
        viewBox="0 0 1440 26"
        preserveAspectRatio="none"
        focusable="false"
        className="absolute inset-0 block h-full w-full"
      >
        <path
          d={CLOUD_PUFFS}
          fill="none"
          stroke="var(--color-border)"
          strokeOpacity="0.22"
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
    <header className="sticky top-0 z-header">
      {/* Main bar — flat border on mobile, cloud edge on desktop */}
      <div className={`border-b border-border/50 md:border-b-0 ${NAV_BG}`}>
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
