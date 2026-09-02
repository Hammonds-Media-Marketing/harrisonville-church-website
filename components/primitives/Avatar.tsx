/* eslint-disable @next/next/no-img-element */

/**
 * Avatar primitive: a member, family, or child photo with initials painted
 * underneath, so a missing or slow photo never leaves a blank circle. The
 * photo's focal point comes from the stored `object-position` string set by
 * the photo position editor.
 */

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<Size, string> = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-32 w-32 text-4xl',
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}

export function Avatar({
  name,
  photo,
  photoPosition = '50% 50%',
  size = 'md',
  shape = 'circle',
  priority = false,
  className = '',
}: {
  name: string
  photo?: string | null
  photoPosition?: string
  size?: Size
  shape?: 'circle' | 'square'
  priority?: boolean
  className?: string
}) {
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
  return (
    <span
      className={`avatar relative inline-grid shrink-0 place-items-center overflow-hidden bg-primary-strong font-display font-semibold text-on-primary ${radius} ${sizes[size]} ${className}`}
      aria-hidden={photo ? undefined : true}
    >
      <span aria-hidden="true">{initialsFor(name)}</span>
      {photo ? (
        <img
          src={photo}
          alt={name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: photoPosition }}
        />
      ) : null}
    </span>
  )
}

/** Overlapping cluster of avatars with a "+N" tail, for family cards. */
export function AvatarStack({ people, max = 4 }: { people: Array<{ id: string; name: string; photo: string | null; photoPosition: string }>; max?: number }) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <ul className="avatar-stack flex list-none items-center p-0 -space-x-2" aria-label={`${people.length} people`}>
      {shown.map((p) => (
        <li key={p.id} className="rounded-full ring-2 ring-bg">
          <Avatar name={p.name} photo={p.photo} photoPosition={p.photoPosition} size="sm" />
        </li>
      ))}
      {rest > 0 ? (
        <li className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink ring-2 ring-bg">+{rest}</li>
      ) : null}
    </ul>
  )
}
