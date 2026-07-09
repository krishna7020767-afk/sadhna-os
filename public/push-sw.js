/* Custom Web Push handlers, imported into the Workbox-generated service worker.
   Handles pushes delivered while the app is closed / backgrounded / phone locked. */

self.addEventListener('push', (event) => {
  let payload = {};
  try { if (event.data) payload = event.data.json(); } catch { /* keep default {} */ }
  const title = payload.title || 'Sadhna OS 🙏';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/p1.jpg',
    badge: '/p1.jpg',
    tag: payload.tag || 'sadhna-reminder',
    data: { url: payload.url || '/' },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
