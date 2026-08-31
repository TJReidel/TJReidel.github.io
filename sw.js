const CACHE="pillplan-v7";
const SHELL=["/index.html","/manifest.json","/adherence-v2.js","/adherence-v2-adapter.js","/icon.png","/icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  const url=new URL(req.url);

  if(req.mode==="navigate" || (url.origin===self.location.origin && (url.pathname==="/" || url.pathname==="/index.html"))){
    e.respondWith(
      fetch(req)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put("/index.html",copy));
          return res;
        })
        .catch(()=>caches.match("/index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      if(req.method==="GET" && url.origin===self.location.origin){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return res;
    }))
  );
});

self.addEventListener("push",e=>{
  const d=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(d.title||"💊 PillPlan",{
    body:d.body||"Zeit für Ihre Medikamente!",
    icon:"/icon.png",
    badge:"/icon.png",
    vibrate:[200,100,200],
    tag:"pillplan-reminder",
    renotify:true
  }));
});

self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window"}).then(c=>{
    if(c.length)c[0].focus();
    else self.clients.openWindow("/");
  }));
});
