import Image from 'next/image'
import { site } from '@/lib/site'

/** Brand logo lockup (raster — pending a vector version). Eager-loaded in the
 *  header since it sits above the fold. */
export function Logo({ className = '', priority = true }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/assets/logos/logo.png"
      alt={`${site.name} logo — a lighthouse on Outlook Drive`}
      width={260}
      height={100}
      priority={priority}
      className={className}
    />
  )
}

/** Text wordmark — used on the deep navy footer where the raster logo would not
 *  sit cleanly. Styled from type tokens. */
export function Wordmark({ onDeep = false }: { onDeep?: boolean }) {
  return (
    <span className="inline-flex flex-col leading-none">
      <span className={`font-display text-xl font-semibold ${onDeep ? 'text-on-deep' : 'text-heading'}`}>
        Harrisonville
      </span>
      <span
        className={`font-body text-xs font-semibold uppercase tracking-[0.22em] ${
          onDeep ? 'text-on-deep-muted' : 'text-muted'
        }`}
      >
        Church of Christ
      </span>
    </span>
  )
}
