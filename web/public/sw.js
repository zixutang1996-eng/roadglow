// RoadGlow service worker: offline areas. Tiles/glyphs/sprites: cache-first (filled by "Download this area").
// App shell: network-first with cache fallback so the app opens offline after one online visit.
const TILES = 'rg-tiles-v1', SHELL = 'rg-shell-v4', VERSION = '0.9';
self.addEventListener('install', e => self.skipWaiting());
// v0.7: drop the old shell cache and any cached styles/sprites (keep downloaded offline tiles)
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('rg-shell-') && k !== SHELL) await caches.delete(k);
  const c = await caches.open(TILES); for (const r of await c.keys()) if (/\/(styles|sprites)\//.test(new URL(r.url).pathname)) await c.delete(r);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const tileish = u.hostname === 'tiles.openfreemap.org' || /\/(glyphs|sprites|styles)\//.test(u.pathname);
  if (tileish) {
    e.respondWith(caches.open(TILES).then(async c => (await c.match(e.request.url)) || fetch(e.request).then(r => { if (u.pathname.endsWith('/planet') && r.ok) c.put(e.request.url, r.clone()); return r; })));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cl = r.clone(); caches.open(SHELL).then(c => c.put(e.request, cl)); } return r; }).catch(async () => (await caches.match(e.request, { ignoreSearch: true })) || caches.match(new URL('./', self.registration.scope).href)));
  }
});
