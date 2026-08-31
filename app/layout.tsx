import type { Metadata } from 'next'
import Script from 'next/script'
import { Montserrat, Mulish, Dancing_Script } from 'next/font/google'
import './globals.css'
import { SkipLink } from '@/components/layout/SkipLink'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AttributionTracker } from '@/components/layout/AttributionTracker'
import { Analytics } from '@/components/layout/Analytics'
import { JsonLd, churchSchema, websiteSchema } from '@/lib/jsonld'
import { SITE_URL, site } from '@/lib/site'

// next/font handles loading + preconnect internally — no manual <link> or @import.
// Sans-serif system echoing the logo wordmark: Montserrat for display, Mulish for body.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})
const mulish = Mulish({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mulish',
  display: 'swap',
})
// Specialty script accent (echoes the logo's "on Outlook Drive" tagline).
// Loaded site-wide but applied sparingly — see the Style Guide usage note.
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-dancing',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} | Simple, Scripture-Based Worship in Harrisonville, MO`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_US',
    url: `${SITE_URL}/`,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/assets/logos/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${mulish.variable} ${dancingScript.variable}`}>
      <head>
        {/* CookieYes consent banner — beforeInteractive so it runs ahead of the
            afterInteractive analytics scripts and can gate their cookies on consent. */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/bedb021d9bdff7fce2ddba3b7da164d3/script.js"
          strategy="beforeInteractive"
        />
        {/* Site-wide structured data — server-rendered into the served HTML. */}
        <JsonLd data={[churchSchema(), websiteSchema()]} />
      </head>
      <body>
        <SkipLink />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <AttributionTracker />
        <Analytics />
      </body>
    </html>
  )
}
