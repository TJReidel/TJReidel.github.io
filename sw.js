const CACHE="pillplan-v3";
const SHELL=["/","/index.html","/manifest.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
self.addEventListener("push",e=>{const d=e.data?e.data.json():{};e.waitUntil(self.registration.showNotification(d.title||"💊 PillPlan",{body:d.body||"Zeit für Ihre Medikamente!",icon:"/icon.png",badge:"/icon.png",vibrate:[200,100,200],tag:"pillplan-reminder",renotify:true}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window"}).then(c=>{if(c.length)c[0].focus();else self.clients.openWindow("/")}))});
