/// <reference lib="webworker" />
import { initNotificationHandlers } from 'react-use-notifications/sw';

declare const self: ServiceWorkerGlobalScope;

initNotificationHandlers({
  defaultUrl: import.meta.env.BASE_URL,
  onClick: (event) => {
    console.info('[sw] notificationclick', event.action, event.notification.tag);
  },
  onClose: (event) => {
    console.info('[sw] notificationclose', event.notification.tag);
  },
});

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
