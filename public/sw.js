/* Ready72 service worker: the app must open with no connection, because that is when it matters. */
const CACHE = "ready72-v1";
const PAGES = ["/", "/dashboard", "/kit", "/shopping", "/plan", "/stress-test", "/guides", "/tools", "/drill", "/maintenance", "/cards", "/crisis", "/setup", "/settings", "/share"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(PAGES.map((p) => cache.add(p).catch(() => undefined)))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNav = req.mode === "navigate";
  const isRsc = req.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  const isStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/");

  if (isNav || isRsc) {
    // network first, fall back to whatever we saved last time
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/dashboard") || caches.match("/"))),
    );
    return;
  }

  if (isStatic) {
    // immutable assets: cache first
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
