import Link from 'next/link'
import { Wordmark } from '@/components/brand/Logo'
import { ClockIcon, FacebookIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/ui/icons'
import { footerNav, site } from '@/lib/site'

/** Global footer with NAP, hours, social, and site navigation. Server-rendered
 *  so every detail is in the served HTML for both readers and crawlers. */
export function Footer() {
  return (
    <footer className="bg-surface-deep text-on-deep">
      <div className="mx-auto max-w-container px-5 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand + NAP */}
          <div className="flex flex-col gap-4">
            <Wordmark onDeep />
            <p className="max-w-xs text-on-deep-muted">{site.description}</p>
            <address className="flex flex-col gap-2 not-italic text-on-deep">
              <a href={`https://maps.google.com/?q=${encodeURIComponent(`${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`)}`} className="flex items-start gap-2 text-on-deep hover:text-secondary" target="_blank" rel="noopener noreferrer">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <span>
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.region} {site.address.postalCode}
                </span>
              </a>
              <a href={`tel:${site.phone}`} className="flex items-center gap-2 text-on-deep hover:text-secondary">
                <PhoneIcon className="h-5 w-5 shrink-0 text-secondary" />
                {site.phoneDisplay}
              </a>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-on-deep hover:text-secondary">
                <MailIcon className="h-5 w-5 shrink-0 text-secondary" />
                {site.email}
              </a>
              <p className="flex items-start gap-2 text-on-deep-muted">
                <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <span>
                  Sundays 10:00 AM &amp; 2:00 PM
                  <br />
                  Wednesdays 7:30 PM
                </span>
              </p>
            </address>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-on-deep-muted/40 px-4 py-2 text-on-deep hover:border-secondary hover:text-secondary"
            >
              <FacebookIcon className="h-5 w-5" />
              <span>Follow on Facebook</span>
            </a>
          </div>

          {/* Nav columns */}
          {footerNav.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="mb-3 font-display text-lg text-on-deep">{col.heading}</h2>
              <ul className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-on-deep-muted hover:text-secondary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-on-deep-muted/20 pt-5 text-sm text-on-deep-muted md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. No creed but the Bible.
          </p>
          <p>
            Built with care for the Harrisonville and Cass County community.
          </p>
        </div>
      </div>
    </footer>
  )
}
