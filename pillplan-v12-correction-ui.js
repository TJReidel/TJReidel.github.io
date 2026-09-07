(function(){
  "use strict";

  function formatDateDE(iso){
    var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||"");
    if(!m) return iso;
    var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    try{return d.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});}
    catch(e){return iso;}
  }

  function polishDialog(dialog){
    if(!dialog||dialog.dataset.ppPolished==="1") return;
    dialog.dataset.ppPolished="1";

    var sub=dialog.querySelector(".pp-correction-sub");
    if(sub){
      var html=sub.innerHTML;
      html=html.replace(/(\d{4}-\d{2}-\d{2})/,function(_,iso){return formatDateDE(iso);});
      sub.innerHTML=html;
    }

    var neutral=dialog.querySelector('.pp-correction-neutral[data-correct-tier="unrated"]');
    if(neutral){
      neutral.innerHTML='<span style="display:block;font-weight:800">Nachträglich dokumentiert</span><span style="display:block;font-size:11px;font-weight:600;opacity:.8;margin-top:2px">genaue Einnahmezeit unbekannt</span>';
      neutral.setAttribute("aria-label","Nachträglich dokumentiert – genaue Einnahmezeit unbekannt");
    }
  }

  function normalizePlanIcons(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('.day-cell.tier-yellow .day-ico,.day-cell.tier-red .day-ico').forEach(function(el){
      el.textContent='●';
    });
  }

  var observer=new MutationObserver(function(mutations){
    var needsIconRefresh=false;
    mutations.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node&&node.nodeType===1){
          if(node.id==="pp-correction-dialog") polishDialog(node);
          var nested=node.querySelector&&node.querySelector("#pp-correction-dialog");
          if(nested) polishDialog(nested);
          needsIconRefresh=true;
        }
      });
    });
    if(needsIconRefresh) normalizePlanIcons(document);
  });

  function start(){
    observer.observe(document.documentElement,{childList:true,subtree:true});
    var existing=document.getElementById("pp-correction-dialog");
    if(existing) polishDialog(existing);
    normalizePlanIcons(document);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
