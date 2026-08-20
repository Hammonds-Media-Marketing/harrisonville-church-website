/**
 * Wave divider — the recurring "water" motif of the Coastal Beacon aesthetic.
 * Purely decorative (aria-hidden). `fill` should match the color of the section
 * the wave flows INTO so the bands blend. Place at the bottom of one section to
 * transition into the next.
 *
 * A second path in the logo's wave blue sits behind the main fill, cresting
 * above it in a band of varying thickness — the same layered-water overlap the
 * emblem uses, so every section transition quotes the logo directly.
 */
export function Wave({
  fill = 'var(--color-surface)',
  flip = false,
  className = '',
}: {
  fill?: string
  flip?: boolean
  className?: string
}) {
  return (
    <div className={`pointer-events-none w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''} ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-[40px] w-full md:h-[64px]"
        focusable="false"
      >
        <path
          d="M0 22 C 250 72, 490 -12, 730 12 C 970 36, 1210 74, 1440 24 L 1440 80 L 0 80 Z"
          fill="var(--brand-teal)"
        />
        <path
          d="M0 32 C 240 80, 480 0, 720 24 C 960 48, 1200 88, 1440 40 L 1440 80 L 0 80 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}
