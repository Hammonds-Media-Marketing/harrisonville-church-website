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

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-strong text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled disabled:text-on-primary-disabled',
  secondary:
    'bg-secondary text-on-secondary hover:bg-secondary-hover active:bg-secondary-active disabled:bg-primary-disabled disabled:text-on-primary-disabled',
  accent:
    'bg-accent-strong text-on-accent hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled disabled:text-on-primary-disabled',
  ghost:
    'bg-transparent text-primary-strong border border-border-strong hover:bg-surface active:bg-surface-2 disabled:text-muted disabled:border-border',
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
