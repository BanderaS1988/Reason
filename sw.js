const CACHE = 'reason-v5';
const STATIC = ['/', '/index.html'];

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

  // Reklám domainek – elengedjük, SW nem kezeli
  if (url.hostname.includes('googlesyndication.com') ||
      url.hostname.includes('doubleclick.net') ||
      url.hostname.includes('google-analytics.com')) {
    return;
  }

  // Supabase + OpenWeather – mindig hálózatról, cache csak fallback
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
