const CACHE="pillplan-v14-preboot1";
const SHELL=["/index.html","/manifest.json","/adherence-v2.js","/adherence-v2-adapter.js","/pillplan-v12-correction-ui.js","/pillplan-local-date-v1.js","/pillplan-v12-schedule-change-ui.js","/pillplan-v12-medication-end-ui.js","/medication-schedule-v1.js","/statistics-v2.js","/icon.png","/icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

function preBootSanitizer(){
  return '<script>(function(){try{var k="pillplan_v4",raw=localStorage.getItem(k),lang=((navigator.language||"de").slice(0,2)||"de"),blank={lang:lang,meds:[],taken:{},screen:"today",notif:false,period:7};if(!raw){localStorage.setItem(k,JSON.stringify(blank));return;}var s=JSON.parse(raw),m=Array.isArray(s.meds)?s.meds:[],n=m.map(function(x){return String((x&&x.name)||"");}).sort().join("|");if(m.length===2&&n==="Lisinopril 10 mg|Metformin 500 mg"){blank.lang=s.lang||blank.lang;blank.period=s.period||7;localStorage.setItem(k,JSON.stringify(blank));}}catch(e){}})();</script>';
}

function hardenCoreHtml(text){
  // Run before the application code. This is critical for iOS standalone PWAs,
  // whose localStorage is separate from normal Safari storage.
  if(!text.includes("pp-preboot-sanitizer")){
    text=text.replace("<head>","<head>\n<!-- pp-preboot-sanitizer -->\n"+preBootSanitizer());
  }

  // Production source must never default to historical demo medicines.
  text=text.replace(
    '  meds: [\n    {id:1, name:"Metformin 500 mg", times:["08:00","20:00"], color:"#2a7c74"},\n    {id:2, name:"Lisinopril 10 mg", times:["08:00"],         color:"#c0392b"}\n  ],',
    '  meds: [],'
  );

  // Empty installs get a direct restore path.
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
    if(!text.includes("pillplan-v12-correction-ui.js")) text=text.replace("</body>",'<script src="/pillplan-v12-correction-ui.js"></script></body>');
    if(!text.includes("pillplan-local-date-v1.js")) text=text.replace("</body>",'<script src="/pillplan-local-date-v1.js"></script></body>');
    if(!text.includes("pillplan-v12-schedule-change-ui.js")) text=text.replace("</body>",'<script src="/pillplan-v12-schedule-change-ui.js"></script></body>');
    if(!text.includes("pillplan-v12-medication-end-ui.js")) text=text.replace("</body>",'<script src="/pillplan-v12-medication-end-ui.js"></script></body>');
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control","no-store");
    return new Response(text,{status:response.status,statusText:response.statusText,headers});
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

  e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
    if(req.method==="GET" && url.origin===self.location.origin){
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
    }
    return res;
  })));
});

self.addEventListener("push",e=>{
  const d=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(d.title||"💊 PillPlan",{
    body:d.body||"Zeit für Ihre Medikamente!",icon:"/icon.png",badge:"/icon.png",vibrate:[200,100,200],tag:"pillplan-reminder",renotify:true
  }));
});

self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window"}).then(c=>{if(c.length)c[0].focus();else self.clients.openWindow("/");}));
});
