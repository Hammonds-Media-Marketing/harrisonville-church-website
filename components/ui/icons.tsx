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

/* --- Member portal icons --- */
export const BellIcon = (p: IconProps) => (
  <Base {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Base>
)
export const UsersIcon = (p: IconProps) => (
  <Base {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></Base>
)
export const UserIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Base>
)
export const MessageIcon = (p: IconProps) => (
  <Base {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Base>
)
export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}><path d="m15 18-6-6 6-6" /></Base>
)
export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}><path d="m9 18 6-6-6-6" /></Base>
)
export const PlusIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
)
export const TrashIcon = (p: IconProps) => (
  <Base {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Base>
)
export const PencilIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Base>
)
export const ImageIcon = (p: IconProps) => (
  <Base {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></Base>
)
export const SendIcon = (p: IconProps) => (
  <Base {...p}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></Base>
)
export const HomeIcon = (p: IconProps) => (
  <Base {...p}><path d="m3 11 9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></Base>
)
export const HeartIcon = (p: IconProps) => (
  <Base {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></Base>
)
export const CakeIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01" /></Base>
)
export const PrinterIcon = (p: IconProps) => (
  <Base {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Base>
)
export const MegaphoneIcon = (p: IconProps) => (
  <Base {...p}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></Base>
)
export const CupIcon = (p: IconProps) => (
  <Base {...p}><path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" /><path d="M6 2v2M10 2v2M14 2v2" /></Base>
)
export const SmartphoneIcon = (p: IconProps) => (
  <Base {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></Base>
)
export const SettingsIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Base>
)
export const ClipboardIcon = (p: IconProps) => (
  <Base {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h6" /></Base>
)
export const SmileIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></Base>
)
export const InfoIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Base>
)
export const LogOutIcon = (p: IconProps) => (
  <Base {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Base>
)
export const MoreIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></Base>
)
