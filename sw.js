const CACHE="pillplan-v13-core1";
const SHELL=["/index.html","/manifest.json","/adherence-v2.js","/adherence-v2-adapter.js","/pillplan-v12-correction-ui.js","/pillplan-local-date-v1.js","/pillplan-v12-schedule-change-ui.js","/pillplan-v12-medication-end-ui.js","/medication-schedule-v1.js","/statistics-v2.js","/icon.png","/icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

function hardenCoreHtml(text){
  // 1) A production install must never boot with the historical demo medicines.
  text=text.replace(
    '  meds: [\n    {id:1, name:"Metformin 500 mg", times:["08:00","20:00"], color:"#2a7c74"},\n    {id:2, name:"Lisinopril 10 mg", times:["08:00"],         color:"#c0392b"}\n  ],',
    '  meds: [],'
  );

  // 2) Clean the exact untouched legacy demo dataset if iOS preserved it in the
  // standalone Home-Screen storage container. Real medication datasets are kept.
  text=text.replace(
    '    var saved = JSON.parse(raw);\n    S.lang   = saved.lang   || S.lang;',
    '    var saved = JSON.parse(raw);\n    try {\n      var _ppNames = Array.isArray(saved.meds) ? saved.meds.map(function(m){ return String((m&&m.name)||""); }).sort().join("|") : "";\n      var _ppTakenCount = saved.taken && typeof saved.taken === "object" ? Object.keys(saved.taken).length : 0;\n      if (_ppNames === "Lisinopril 10 mg|Metformin 500 mg" && _ppTakenCount === 0) {\n        localStorage.removeItem(KEY);\n        saved = {};\n      }\n    } catch(_ppDemoCleanupErr) {}\n    S.lang   = saved.lang   || S.lang;'
  );

  // 3) Empty installs get a direct restore path without an extra runtime guard.
  text=text.replace(
    'return \'<div class="empty anim-up"><div class="empty-icon" aria-hidden="true">💊</div><div class="empty-text">\' + tr("noMeds") + \'</div><div class="empty-sub">\' + tr("noMedsSub") + \'</div><button class="btn-primary" style="width:auto;padding:14px 32px" data-nav="add">\' + tr("addFirst") + \'</button></div>\';',
    'return \'<div class="empty anim-up"><div class="empty-icon" aria-hidden="true">💊</div><div class="empty-text">\' + tr("noMeds") + \'</div><div class="empty-sub">\' + tr("noMedsSub") + \'</div><button class="btn-primary" style="width:auto;padding:14px 32px" data-nav="add">\' + tr("addFirst") + \'</button><a href="/pillplan-restore.html" style="display:block;margin:16px auto 0;max-width:300px;padding:14px 18px;border-radius:14px;background:#e8f4f3;color:#2a7c74;text-decoration:none;font-weight:800">Sicherung wiederherstellen</a></div>\';'
  );
  return text;
}

async function injectUiScripts(response){
  try{
    let text=await response.text();
    text=hardenCoreHtml(text);
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
    headers.set("cache-control","no-store");
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
      fetch(req,{cache:"no-store"})
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
