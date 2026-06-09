import type { Metadata } from 'next'
import { Cormorant_Garamond, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { SkipLink } from '@/components/layout/SkipLink'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AttributionTracker } from '@/components/layout/AttributionTracker'
import { Analytics } from '@/components/layout/Analytics'
import { JsonLd, churchSchema, websiteSchema } from '@/lib/jsonld'
import { SITE_URL, site } from '@/lib/site'

// next/font handles loading + preconnect internally — no manual <link> or @import.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-source-serif',
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
    apple: '/assets/logos/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${sourceSerif.variable}`}>
      <head>
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
