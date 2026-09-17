(function(global){
  "use strict";

  var VERSION = "1.2";

  function replaceExact(selector, from, to){
    var nodes=document.querySelectorAll(selector);
    for(var i=0;i<nodes.length;i++){
      if((nodes[i].textContent||"").trim()===from) nodes[i].textContent=to;
    }
  }

  function applyReleaseGateFixes(){
    var title="PillPlan v"+VERSION;
    if(document.title!==title) document.title=title;

    replaceExact("#main-content div", "PillPlan v1.1", "PillPlan v"+VERSION);
    replaceExact("#main-content div", "PillPlan v1.2", "PillPlan v"+VERSION);

    if(!global.S || global.S.lang!=="en") return;

    replaceExact(".time-optional", "1. Einnahme *", "1st dose *");
    replaceExact(".time-optional", "2. Einnahme (optional)", "2nd dose (optional)");
    replaceExact(".time-optional", "3. Einnahme (optional)", "3rd dose (optional)");
    replaceExact(".time-optional", "4. Einnahme (optional)", "4th dose (optional)");

    var restore=document.querySelector('.empty a[href="/pillplan-restore.html"]');
    if(restore && restore.textContent.trim()==="Sicherung wiederherstellen"){
      restore.textContent="Restore backup";
    }
  }

  var observer=new MutationObserver(function(){ applyReleaseGateFixes(); });

  function start(){
    applyReleaseGateFixes();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window);
