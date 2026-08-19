import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Button primitive — every action trigger on the site. Defined once with all
 * variants and states; consumed everywhere. Renders a <Link> when `href` is
 * set, otherwise a <button>. Focus state is inherited from the global
 * :focus-visible rule; contrast for every variant/state is verified by the
 * contrast gate.
 */

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-body font-semibold rounded-full transition-colors duration-base ease-out disabled:cursor-not-allowed select-none text-center'

/* Each variant restates its label color on hover/active: buttons render as
 * anchors when `href` is set, and the global `a:hover` color rule in
 * globals.css would otherwise repaint the label to the link-hover teal —
 * invisible against the teal button backgrounds. */
const variants: Record<Variant, string> = {
  // Primary CTA — beacon gold with deep-navy label, the dominant action color.
  primary:
    'bg-secondary text-on-secondary shadow-sm hover:bg-secondary-hover hover:text-on-secondary active:bg-secondary-active active:text-on-secondary disabled:bg-primary-disabled disabled:text-on-primary-disabled disabled:shadow-none',
  // Secondary — lighthouse teal with white label.
  secondary:
    'bg-primary-strong text-on-primary shadow-sm hover:bg-primary-hover hover:text-on-primary active:bg-primary-active active:text-on-primary disabled:bg-primary-disabled disabled:text-on-primary-disabled disabled:shadow-none',
  accent:
    'bg-accent-strong text-on-accent shadow-sm hover:bg-primary-active hover:text-on-accent active:bg-primary-active active:text-on-accent disabled:bg-primary-disabled disabled:text-on-primary-disabled disabled:shadow-none',
  ghost:
    'bg-transparent text-primary-strong border border-border-strong hover:bg-surface hover:text-primary-strong active:bg-surface-2 active:text-primary-strong disabled:text-muted disabled:border-border',
  link: 'bg-transparent text-link hover:text-link-hover underline underline-offset-4 rounded-sm px-0',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-md px-6 py-3',
  lg: 'text-lg px-8 py-4',
}

type CommonProps = {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
  className?: string
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', loading, children, className = '', ...rest } = props
  const cls = `${base} ${variants[variant]} ${variant === 'link' ? '' : sizes[size]} ${className}`

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    const external = /^https?:\/\//.test(href)
    if (external) {
      return (
        <a href={href} className={cls} rel="noopener noreferrer" target="_blank" {...anchorRest}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={cls} {...anchorRest}>
        {children}
      </Link>
    )
  }

  const { disabled, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonRest}>
      {loading ? <span aria-hidden="true">…</span> : null}
      {children}
    </button>
  )
}
