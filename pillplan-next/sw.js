const CACHE='pillplan-next-v24-single-runtime';
const PREVIOUS_CACHE='pillplan-next-v23-stability-stage';
const SHELL='/pillplan-next/index.html';
const ASSETS=[
  '/pillplan-next/',
  SHELL,
  '/pillplan-next/core-v5.js',
  '/pillplan-next/design-master-v4.css',
  '/pillplan-next/design-master.css',
  '/pillplan-next/manifest.json',
  '/icon.png',
  '/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys
      .filter(k=>k.startsWith('pillplan-next-')&&k!==CACHE&&k!==PREVIOUS_CACHE)
      .map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch(_e){
    return (await cache.match(request)) ||
      (await caches.match(request)) ||
      (request.mode==='navigate' ? (await cache.match(SHELL)) || (await caches.match(SHELL)) : undefined);
  }
}

async function cacheFirstWithRefresh(request){
  const cached=await caches.match(request);
  const refresh=fetch(request,{cache:'no-store'}).then(async response=>{
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  }).catch(()=>null);
  return cached || (await refresh) || Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request));
    return;
  }

  if(url.pathname.startsWith('/pillplan-next/')){
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirstWithRefresh(request));
});
