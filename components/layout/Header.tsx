import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { SiteNav } from '@/components/layout/SiteNav'
import { PRIMARY_CTA, primaryNav, site } from '@/lib/site'

/** Cloud-puff bottom edge: irregular arc widths and depths keep it reading as
 *  a cloud rather than a scalloped border. Each entry is [rx, ry, endX]; every
 *  arc starts and ends on the same baseline. */
const PUFF_ARCS: Array<[number, number, number]> = [
  [65, 10, 130],
  [70, 14, 270],
  [60, 9, 390],
  [90, 13, 570],
  [60, 8, 690],
  [90, 14, 870],
  [60, 9, 990],
  [85, 13, 1160],
  [70, 10, 1300],
  [70, 12, 1440],
]

function puffPath(baseY: number): string {
  return `M0 ${baseY}` + PUFF_ARCS.map(([rx, ry, x]) => ` A${rx} ${ry} 0 0 0 ${x} ${baseY}`).join('')
}

/** Geometry for the combined bar + cloud background. The desktop bar is 80px
 *  (py-3 + the h-14 logo) and the cloud strip renders 24px tall, so the puff
 *  band's 26 viewBox units map to 24px when the bar occupies 86.67 units.
 *  If the bar height ever shifts, the puffs stretch a hair — the silhouette
 *  stays seamless either way, because it is a single filled path. */
const PUFF_BAND_UNITS = 26
const BAR_UNITS = (80 * PUFF_BAND_UNITS) / 24
const VIEW_H = BAR_UNITS + PUFF_BAND_UNITS
const PUFF_BASE_Y = BAR_UNITS + 8

/** Global header. The shell is a Server Component; only the interactive nav is
 *  a client island. The background is slightly translucent white, constant in
 *  every scroll state. On desktop the bar and its cloud-puff bottom edge are
 *  painted as ONE filled SVG path — a single translucent paint pass, so no
 *  seam can appear where two stacked elements would meet. */
export function Header() {
  return (
    <header className="sticky top-0 z-header">
      <div className="relative">
        {/* Mobile background — flat bar with a plain bottom border */}
        <div aria-hidden="true" className="absolute inset-0 border-b border-border/50 bg-white/90 md:hidden" />

        {/* Desktop background — bar and cloud edge as one shape, extending
            24px below the header, with a faint outline along the puffs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-6 top-0 hidden md:block"
        >
          <svg
            viewBox={`0 0 1440 ${VIEW_H}`}
            preserveAspectRatio="none"
            focusable="false"
            className="block h-full w-full"
          >
            <path d={`${puffPath(PUFF_BASE_Y)} L1440 0 L0 0 Z`} fill="#ffffff" fillOpacity="0.9" />
            <path
              d={puffPath(PUFF_BASE_Y)}
              fill="none"
              stroke="var(--color-border)"
              strokeOpacity="0.22"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Main bar content, above the background layers */}
        <div className="relative mx-auto flex max-w-container items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="inline-flex items-center" aria-label={`${site.name} — home`}>
            <Logo className="h-12 w-auto md:h-14" />
          </Link>
          <SiteNav items={primaryNav} cta={PRIMARY_CTA} />
        </div>
      </div>
    </header>
  )
}
