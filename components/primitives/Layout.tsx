import type { ElementType, ReactNode } from 'react'

/** Container — centers content and caps width. `prose` narrows for reading. */
export function Container({
  children,
  className = '',
  prose = false,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  prose?: boolean
  as?: ElementType
}) {
  return (
    <Tag className={`mx-auto w-full px-5 ${prose ? 'max-w-prose' : 'max-w-container'} ${className}`}>
      {children}
    </Tag>
  )
}

type Tone = 'light' | 'surface' | 'deep' | 'deep-2'

const toneClass: Record<Tone, string> = {
  light: 'bg-bg text-ink',
  surface: 'bg-surface text-ink',
  deep: 'bg-surface-deep text-on-deep',
  'deep-2': 'bg-surface-deep-2 text-on-deep',
}

/** Section — a full-width band with vertical rhythm and a tone. */
export function Section({
  children,
  tone = 'light',
  className = '',
  id,
  as: Tag = 'section',
  ariaLabelledby,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  id?: string
  as?: ElementType
  ariaLabelledby?: string
}) {
  return (
    <Tag id={id} aria-labelledby={ariaLabelledby} className={`py-8 md:py-9 ${toneClass[tone]} ${className}`}>
      {children}
    </Tag>
  )
}

/** Eyebrow — a small uppercase label above a heading. */
export function Eyebrow({ children, onDeep = false }: { children: ReactNode; onDeep?: boolean }) {
  return (
    <p
      className={`font-body text-sm font-semibold uppercase tracking-[0.18em] ${
        onDeep ? 'text-secondary' : 'text-primary-strong'
      }`}
    >
      {children}
    </p>
  )
}

/** SectionHeading — eyebrow + heading + optional lead, with consistent spacing. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  as: Tag = 'h2',
  align = 'left',
  onDeep = false,
}: {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  id?: string
  as?: ElementType
  align?: 'left' | 'center'
  onDeep?: boolean
}) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center max-w-prose' : 'max-w-prose'} mb-6 flex flex-col gap-3`}>
      {eyebrow ? <Eyebrow onDeep={onDeep}>{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={`text-3xl md:text-4xl ${onDeep ? 'text-on-deep' : ''}`}>
        {title}
      </Tag>
      {lead ? (
        <p className={`text-lg ${onDeep ? 'text-on-deep-muted' : 'text-muted'}`}>{lead}</p>
      ) : null}
    </div>
  )
}
