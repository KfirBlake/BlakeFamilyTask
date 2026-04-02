importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// Adding a fetch event listener is required by Chrome to recognize it as a PWA
self.addEventListener("fetch", (e) => {
  // Pass through all requests
  return;
});

// Prevent Next.js Turbopack from throwing "[WM] No SW registration for postMessage"
self.addEventListener("message", (e) => {
  if (e.data && e.data.action === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
