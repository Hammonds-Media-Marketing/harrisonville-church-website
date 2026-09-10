import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

/** Lets members add the members area to a phone home screen as an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} Members`,
    short_name: 'HCoC Members',
    description: 'Announcements, directory, chat, calendar, and sign-ups for members of the Harrisonville Church of Christ.',
    start_url: '/members',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b2538',
    icons: [
      { src: '/assets/logos/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/logos/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/logos/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
