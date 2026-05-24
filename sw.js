const CACHE = 'reason-v6';  // ← NÖVELD MEG (v5 → v6), ez törli a régi cache-t!
const STATIC = [];          // ← főoldalt NE cache-elje, mindig hálózatról jöjjön

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
function safeFetch(request) {
  return fetch(request.clone()).then(r => {
    if (!r || r.status !== 200 || r.type === 'opaque' || r.type === 'error') {
      return r;
    }
    const clone = r.clone();
    caches.open(CACHE).then(c => {
      try { c.put(request, clone); } catch (err) {}
    });
    return r;
  });
}
function fallback() {
  return new Response('', { status: 503, statusText: 'Offline' });
}
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Reklám domainek – elengedjük
  if (url.hostname.includes('googlesyndication.com') ||
      url.hostname.includes('doubleclick.net') ||
      url.hostname.includes('google-analytics.com')) {
    return;
  }

  // Főoldal – MINDIG hálózatról, soha ne cache-ből!
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(fetch(e.request.clone()).catch(fallback));
    return;
  }

  // Supabase + OpenWeather – mindig hálózatról
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('openweathermap.org')) {
    e.respondWith(
      safeFetch(e.request).catch(() =>
        caches.match(e.request).then(c => c || fallback())
      )
    );
    return;
  }

  // Google Fonts – cache-first
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || safeFetch(e.request).catch(fallback))
    );
    return;
  }

  // Saját domain – network-first
  if (url.hostname === self.location.hostname) {
    e.respondWith(
      safeFetch(e.request).catch(() =>
        caches.match(e.request).then(c => c || fallback())
      )
    );
    return;
  }

  // Minden más
  e.respondWith(
    fetch(e.request.clone()).catch(() =>
      caches.match(e.request).then(c => c || fallback())
    )
  );
});
