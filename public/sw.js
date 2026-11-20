// Minimal, safe PWA service worker: static assets cache-first; pages network-first with an offline fallback.
// Never caches API calls, checkout or account pages (always fresh, never stale prices or carts).
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const OFFLINE = "/offline.html";

self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(PAGES).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
	e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
	const req = e.request;
	const url = new URL(req.url);
	if (req.method !== "GET" || url.origin !== location.origin) return;
	if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
		e.respondWith(caches.open(STATIC).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })));
		return;
	}
	if (req.mode === "navigate" && !/^\/(checkout|account|cart)/.test(url.pathname)) {
		e.respondWith(fetch(req).then((r) => { if (r.ok) caches.open(PAGES).then((c) => c.put(req, r.clone())); return r; })
			.catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE))));
	}
});
