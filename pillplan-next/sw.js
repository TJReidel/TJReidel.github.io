const CACHE='pillplan-next-v1';
const ASSETS=['/pillplan-next/','/pillplan-next/index.html','/pillplan-next/app.js','/pillplan-next/manifest.json','/icon.png','/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.mode==='navigate'){
    e.respondWith(fetch(r,{cache:'no-store'}).catch(()=>caches.match('/pillplan-next/index.html')));
    return;
  }
  if(u.origin===self.location.origin){
    e.respondWith(caches.match(r).then(c=>c||fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(r,copy));return res;})));
  }
});
