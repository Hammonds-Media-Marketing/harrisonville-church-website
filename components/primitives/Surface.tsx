import type { ElementType, ReactNode } from 'react'

type SurfaceTone = 'card' | 'panel' | 'deep'

const tones: Record<SurfaceTone, string> = {
  card: 'bg-bg border border-border-strong/40 shadow-sm',
  panel: 'bg-surface border border-border/50',
  deep: 'bg-surface-deep-2 text-on-deep border border-on-deep-muted/20',
}

/**
 * Surface — the container primitive behind cards and panels. `interactive`
 * adds hover elevation for clickable cards (the whole card becomes a link at
 * the consumer with a stretched anchor).
 */
export function Surface({
  children,
  tone = 'card',
  interactive = false,
  className = '',
  id,
  as: Tag = 'div',
}: {
  children: ReactNode
  tone?: SurfaceTone
  interactive?: boolean
  className?: string
  id?: string
  as?: ElementType
}) {
  return (
    <Tag
      id={id}
      className={`relative rounded-lg p-6 ${tones[tone]} ${
        interactive ? 'transition-shadow duration-base ease-out hover:shadow-md focus-within:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  )
}
