const CACHE="pillplan-v12-restore3";
const SHELL=["/index.html","/manifest.json","/adherence-v2.js","/adherence-v2-adapter.js","/pillplan-production-guard-v1.js","/pillplan-v12-correction-ui.js","/pillplan-local-date-v1.js","/pillplan-v12-schedule-change-ui.js","/pillplan-v12-medication-end-ui.js","/medication-schedule-v1.js","/statistics-v2.js","/icon.png","/icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

async function injectUiScripts(response){
  try{
    let text=await response.text();
    if(!text.includes("pillplan-production-guard-v1.js")){
      text=text.replace("</body>",'<script src="/pillplan-production-guard-v1.js"></script></body>');
    }
    if(!text.includes("pillplan-v12-correction-ui.js")){
      text=text.replace("</body>",'<script src="/pillplan-v12-correction-ui.js"></script></body>');
    }
    if(!text.includes("pillplan-local-date-v1.js")){
      text=text.replace("</body>",'<script src="/pillplan-local-date-v1.js"></script></body>');
    }
    if(!text.includes("pillplan-v12-schedule-change-ui.js")){
      text=text.replace("</body>",'<script src="/pillplan-v12-schedule-change-ui.js"></script></body>');
    }
    if(!text.includes("pillplan-v12-medication-end-ui.js")){
      text=text.replace("</body>",'<script src="/pillplan-v12-medication-end-ui.js"></script></body>');
    }
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    return new Response(text,{status:response.status,statusText:response.statusText,headers:headers});
  }catch(err){
    return response;
  }
}

self.addEventListener("fetch",e=>{
  const req=e.request;
  const url=new URL(req.url);

  if(url.origin===self.location.origin && (url.pathname==="/pillplan-recovery.html" || url.pathname==="/pillplan-restore.html")){
    e.respondWith(fetch(req,{cache:"no-store"}));
    return;
  }

  if(req.mode==="navigate" || (url.origin===self.location.origin && (url.pathname==="/" || url.pathname==="/index.html"))){
    e.respondWith(
      fetch(req)
        .then(async res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put("/index.html",copy));
          return injectUiScripts(res);
        })
        .catch(async()=>{
          const cached=await caches.match("/index.html");
          return cached?injectUiScripts(cached):cached;
        })
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
