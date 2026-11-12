const CACHE = "project-hub-v6";
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon-32.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter((key) => key !== CACHE);
      await Promise.all(keys.map((key) => caches.delete(key)));
      const cache = await caches.open(CACHE);
      await cache.addAll(APP_SHELL).catch(() => undefined);
      await self.clients.claim();
      if (!stale.length) return;
      const windows = await self.clients.matchAll({ type: "window" });
      await Promise.all(windows.map((client) => client.navigate(client.url)));
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;

  if (isDocument(request)) {
    event.respondWith(networkOrOffline(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

function isDocument(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

async function networkOrOffline(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match("/offline.html");
    if (cached) return cached;
    throw new Error("offline");
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}
