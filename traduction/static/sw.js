// Garde la page en cache pour pouvoir l'ouvrir sans Internet (la traduction, elle, demande Internet).
const V = "trad-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.add("/"))); });
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(u.pathname === "/" ? "/" : e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("/")))
  );
});
