// Service worker for ExpenseLy — handles push notifications and click actions.
// Runs independently of any open tab once registered.

self.addEventListener('install', (event) => {
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
    data = { title: 'ExpenseLy', body: event.data ? event.data.text() : 'You have a new notification' }
  }

  const title = data.title || 'ExpenseLy'
  const options = {
    body: data.body || "Don't forget to log today's expenses.",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'expensely-reminder',
    renotify: true,
    data: { url: data.url || '/add' }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
