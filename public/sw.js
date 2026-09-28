/*
 * Service worker for the members area: phone and desktop notifications
 * (web push) only. There is deliberately no offline caching; every page
 * still comes from the network.
 *
 * The send-push Edge Function delivers a JSON payload:
 *   { title, body, url, tag }
 * `url` is a site path such as /members/chat/direct/<id>. `tag` collapses
 * repeats (a busy group chat replaces its earlier notification instead of
 * stacking up).
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Harrisonville Church of Christ'
  const url = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/members'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/assets/logos/icon-192.png',
      badge: '/assets/logos/icon-192.png',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = (event.notification.data && event.notification.data.url) || '/members'
  const target = new URL(path, self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            try {
              await client.navigate(target)
            } catch (e) {
              // Some browsers refuse navigate() on uncontrolled clients; open instead.
              await self.clients.openWindow(target)
            }
          }
          return
        }
      }
      await self.clients.openWindow(target)
    })()
  )
})
