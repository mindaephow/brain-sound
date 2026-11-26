// 설치형 앱: 항상 최신 파일을 먼저 받고, 인터넷이 안 될 때만 저장해 둔 파일을 씁니다.
const CACHE = 'brainsound-v2';
const CORE = ['/brainsound-pc.html', '/manifest.webmanifest', '/icons/app-192.png', '/icons/app-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return; // 서버 자료는 저장하지 않음
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(u.pathname, copy)); } return r; })
    .catch(() => caches.match(u.pathname).then(r => r || Response.error())));
});
