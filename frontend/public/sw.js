// BaseRPS Service Worker for Push Notifications

const CACHE_NAME = 'baserps-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a new notification',
    icon: '/rps-icon.png',
    badge: '/rps-badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'view', title: 'View Match' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  let notificationData = { title: 'BaseRPS', ...options };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'BaseRPS',
        body: data.body || options.body,
        icon: data.icon || options.icon,
        badge: options.badge,
        vibrate: options.vibrate,
        data: {
          ...options.data,
          url: data.url || '/',
          matchId: data.matchId,
          type: data.type,
        },
        actions: options.actions,
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus existing window
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exist
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, matchId, notificationType } = event.data;

    self.registration.showNotification(title, {
      body,
      icon: '/rps-icon.png',
      badge: '/rps-badge.png',
      vibrate: [100, 50, 100],
      tag: matchId ? `match-${matchId}` : 'general',
      renotify: true,
      data: {
        url: url || '/',
        matchId,
        type: notificationType,
      },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Dismiss' },
      ],
    });
  }
});
