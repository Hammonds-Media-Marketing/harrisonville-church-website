/**
 * Shoreline — the logo's land-and-water baseline rendered as a page-level
 * divider. A green crest sits on the brand-blue wave, which settles into the
 * deep navy of the footer, so every page ends the way the emblem ends. Purely
 * decorative (aria-hidden); the area above the crest is transparent, letting
 * whatever section precedes the footer show through on any page.
 */
export function Shoreline({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none -mb-px w-full overflow-hidden leading-[0] ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="block h-[56px] w-full md:h-[84px]"
        focusable="false"
      >
        <path
          d="M0 52 C 300 10, 760 6, 1080 30 C 1240 42, 1360 52, 1440 58 L 1440 100 L 0 100 Z"
          fill="var(--brand-green)"
        />
        <path
          d="M0 68 C 300 28, 760 22, 1080 46 C 1240 58, 1360 66, 1440 72 L 1440 100 L 0 100 Z"
          fill="var(--brand-teal)"
        />
        <path
          d="M0 86 C 300 50, 760 42, 1080 64 C 1240 74, 1360 82, 1440 86 L 1440 100 L 0 100 Z"
          fill="var(--color-surface-deep)"
        />
      </svg>
    </div>
  )
}
