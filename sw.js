/* Service worker: la app funciona sin conexión. Las llamadas a Gemini nunca se cachean. */
const CACHE='calorias-mwc45wib';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url); if(u.origin!==location.origin||u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(r).then(res=>{const copy=res.clone(); caches.open(CACHE).then(c=>c.put(r,copy)); return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
