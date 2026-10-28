// 歴史マスプリテスト：オフラインでも開けるようにするサービスワーカー
const CACHE = 'rekishi-kuran-v7';
const SHELL = ['./rekishi-kuran.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // ページ本体：ネット優先（更新をすぐ反映）、つながらないときは保存分
  if(req.mode === 'navigate' || url.pathname.endsWith('.html')){
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./rekishi-kuran.html'))));
    return;
  }
  // そのほか（アイコン・フォントなど）：保存分を先に使い、裏で更新
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if(res && (res.ok || res.type === 'opaque')){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
