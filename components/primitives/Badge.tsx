import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'primary' | 'accent' | 'gold' | 'sample'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-ink',
  primary: 'bg-primary-strong text-on-primary',
  accent: 'bg-accent-strong text-on-accent',
  gold: 'bg-secondary text-on-secondary',
  sample: 'bg-warning text-on-status',
}

/** Badge / tag / pill — small status and metadata marker. */
export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/** A consistent "sample content" marker used wherever placeholder data renders,
 *  so nothing ships looking like real, final content. */
export function SampleBadge({ className = '' }: { className?: string }) {
  return (
    <Badge tone="sample" className={className}>
      Sample content
    </Badge>
  )
}
