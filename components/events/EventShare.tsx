import { FacebookIcon, MailIcon, MessageIcon } from '@/components/ui/icons'
import { shareLinks } from '@/lib/event-details'

/**
 * Share an event by Facebook, email, or text message. Plain links, with no
 * script: Facebook opens its share dialog, and email and text open the
 * visitor's own mail or messages app with the event already written out.
 *
 * `compact` is the icon-only row for event cards; the full version (with
 * labels) sits on the event page.
 */
export function EventShare({
  title,
  summary,
  slug,
  when,
  compact = false,
}: {
  title: string
  summary: string
  slug: string
  /** Human-readable date line included in the message. */
  when: string
  compact?: boolean
}) {
  const links = shareLinks({ title, summary, slug, when })
  const items = [
    { key: 'facebook', label: 'Facebook', href: links.facebook, Icon: FacebookIcon, external: true },
    { key: 'email', label: 'Email', href: links.email, Icon: MailIcon, external: false },
    { key: 'sms', label: 'Text message', href: links.sms, Icon: MessageIcon, external: false },
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted">Share</span>
        <ul className="flex items-center gap-1.5">
          {items.map(({ key, label, href, Icon, external }) => (
            <li key={key}>
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={`Share ${title} by ${label.toLowerCase()}${external ? ' (opens in a new tab)' : ''}`}
                className="grid h-11 w-11 place-items-center rounded-full border border-border text-primary-strong transition-colors hover:border-primary-strong hover:bg-surface"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-body text-base font-semibold text-heading">Share this event</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map(({ key, label, href, Icon, external }) => (
          <li key={key}>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={external ? `${label} (opens in a new tab)` : undefined}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary-strong hover:bg-surface hover:text-ink"
            >
              <Icon className="h-4 w-4 text-primary-strong" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
