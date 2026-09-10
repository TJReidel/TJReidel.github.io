// PillPlan deterministic post-core bootstrap v1
// Loads production extension modules in a fixed order and performs one final render.
(function(global){
  "use strict";
  if(global.__pillplanBootstrapV1) return;
  global.__pillplanBootstrapV1=true;

  var modules=[
    "/medication-schedule-v1.js",
    "/statistics-v2.js",
    "/pillplan-v12-correction-ui.js",
    "/pillplan-local-date-v1.js",
    "/pillplan-v12-schedule-change-ui.js",
    "/pillplan-v12-medication-end-ui.js"
  ];

  function showInitError(src){
    try{
      var box=document.createElement("div");
      box.id="pillplan-init-error";
      box.style.cssText="position:fixed;left:12px;right:12px;bottom:88px;z-index:20000;background:#fff3f1;color:#8f2f25;border:1px solid #d7a39d;border-radius:14px;padding:12px 14px;font:600 13px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.15)";
      box.textContent="PillPlan konnte ein Modul nicht laden: "+src.split("/").pop()+". Daten wurden nicht verändert.";
      document.body.appendChild(box);
    }catch(e){}
  }

  function loadAt(i){
    if(i>=modules.length){
      global.__pillplanInitReady=true;
      try{ if(typeof global.render==="function") global.render(); }catch(e){ showInitError("final-render"); }
      return;
    }
    var src=modules[i];
    var existing=document.querySelector('script[src="'+src+'"],script[src="'+src.slice(1)+'"]');
    if(existing){ loadAt(i+1); return; }
    var s=document.createElement("script");
    s.src=src;
    s.async=false;
    s.onload=function(){ loadAt(i+1); };
    s.onerror=function(){ showInitError(src); };
    document.body.appendChild(s);
  }

  loadAt(0);
})(window);
