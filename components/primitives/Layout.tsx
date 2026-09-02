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

/**
 * Eyebrow — a small uppercase sans label flanked by the logo's arrow-rule marks
 * (a short line tipped with an outward chevron), echoing the "CHURCH OF CHRIST"
 * lockup in the brand logo. The flanking rules are decorative (aria-hidden).
 */
export function Eyebrow({
  children,
  onDeep = false,
  center = false,
  marks = true,
}: {
  children: ReactNode
  onDeep?: boolean
  center?: boolean
  marks?: boolean
}) {
  const colorClass = onDeep ? 'text-secondary' : 'text-primary-strong'
  // m-0 cancels the global paragraph margin: the parent flex gap owns the
  // spacing, so the eyebrow hugs the heading it introduces.
  const typeClass = `m-0 font-display text-sm font-semibold uppercase tracking-[0.18em] ${colorClass}`

  // `marks={false}` drops the flanking prisms (used in the homepage hero).
  if (!marks) {
    return <p className={`${typeClass} ${center ? 'text-center' : ''}`}>{children}</p>
  }

  return (
    <p
      className={`flex items-center gap-2.5 ${typeClass} ${
        center ? 'mx-auto w-fit justify-center text-center' : ''
      }`}
    >
      <EyebrowRule />
      <span>{children}</span>
      <EyebrowRule className="rotate-180" />
    </p>
  )
}

/**
 * Decorative arrow-like prism that flanks an Eyebrow label. A solid, rounded
 * teardrop: the thick (bulbous) end sits toward the text and it tapers to a soft
 * point outward. Rendered once and mirrored (rotate-180) for the opposite side.
 */
function EyebrowRule({ className = '' }: { className?: string }) {
  return (
    <svg
      width="20"
      height="6"
      viewBox="0 0 26 8"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M26 4 C26 1.8 24 1 20.5 1.1 C12 1.4 5 2.4 0 4 C5 5.6 12 6.6 20.5 6.9 C24 7 26 6.2 26 4 Z"
        fill="currentColor"
      />
    </svg>
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
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  id?: string
  as?: ElementType
  align?: 'left' | 'center'
  onDeep?: boolean
}) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center max-w-prose' : 'max-w-prose'} mb-6 flex flex-col gap-3`}>
      {eyebrow ? <Eyebrow onDeep={onDeep} center={align === 'center'}>{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={`text-3xl md:text-4xl ${onDeep ? 'text-on-deep' : ''}`}>
        {title}
      </Tag>
      {lead ? (
        <p className={`text-lg ${onDeep ? 'text-on-deep-muted' : 'text-muted'}`}>{lead}</p>
      ) : null}
    </div>
  )
}
