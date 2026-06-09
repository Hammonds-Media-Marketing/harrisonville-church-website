import type { SVGProps } from 'react'

/**
 * Icon set — inline SVG so icons ship in the served HTML and inherit `currentColor`.
 * Decorative by default (aria-hidden). Pass a `title` to give an icon an
 * accessible name when it carries meaning on its own.
 */
type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function Base({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export const MenuIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Base>
)
export const CloseIcon = (p: IconProps) => (
  <Base {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}><path d="M6 9l6 6 6-6" /></Base>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>
)
export const PhoneIcon = (p: IconProps) => (
  <Base {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></Base>
)
export const MailIcon = (p: IconProps) => (
  <Base {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></Base>
)
export const MapPinIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></Base>
)
export const ClockIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>
)
export const CheckIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>
)
export const PlayIcon = (p: IconProps) => (
  <Base {...p} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></Base>
)
export const SearchIcon = (p: IconProps) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Base>
)
export const QuoteIcon = (p: IconProps) => (
  <Base {...p} fill="currentColor" stroke="none"><path d="M7 7h4v4c0 2.2-1.8 4-4 4v-2a2 2 0 0 0 2-2H7zm8 0h4v4c0 2.2-1.8 4-4 4v-2a2 2 0 0 0 2-2h-2z" /></Base>
)
export const CalendarIcon = (p: IconProps) => (
  <Base {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Base>
)
export const BookIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5V21h15" /></Base>
)
export const PrayerIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 3v6M9 7l3 2 3-2M7 21c0-4 2-6 5-6s5 2 5 6" /><path d="M5 21h14" /></Base>
)
export const FacebookIcon = (p: IconProps) => (
  <Base {...p} fill="currentColor" stroke="none"><path d="M14 9h3V5h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1z" /></Base>
)
export const LinkedInIcon = (p: IconProps) => (
  <Base {...p} fill="currentColor" stroke="none"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.5 8.5h3V21h-3zM10 8.5h2.86v1.7h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6V21h-3v-5.2c0-1.24 0-2.84-1.73-2.84-1.74 0-2 1.36-2 2.76V21h-3z" /></Base>
)
export const ShareIcon = (p: IconProps) => (
  <Base {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></Base>
)
export const EyeIcon = (p: IconProps) => (
  <Base {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Base>
)
export const ExternalLinkIcon = (p: IconProps) => (
  <Base {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Base>
)
