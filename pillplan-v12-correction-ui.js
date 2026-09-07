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

  function normalizeStatusSymbols(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll(".day-cell.tier-yellow .day-ico,.day-cell.tier-red .day-ico").forEach(function(el){el.textContent="●";});
    scope.querySelectorAll(".status-swatch.yellow,.status-swatch.red").forEach(function(el){el.textContent="●";});
  }

  function isProtectedDayCell(cell){
    return cell.classList.contains("done")||cell.classList.contains("tier-yellow")||cell.classList.contains("tier-red")||cell.classList.contains("unrated")||cell.classList.contains("partial")||cell.classList.contains("pp-protected");
  }

  function openCorrection(medId,date){
    var adapter=window.PillPlanAdherenceAdapter;
    if(adapter&&typeof adapter.openCorrectionDialog==="function"){
      adapter.openCorrectionDialog(medId,date);
      return true;
    }
    return false;
  }

  // Safety gate runs on window capture, before the legacy document handlers.
  // A documented intake can therefore never be toggled away by a normal tap.
  function installSafetyGate(){
    if(window.__pillplanDocumentedTapGateV1) return;
    window.__pillplanDocumentedTapGateV1=true;
    window.addEventListener("click",function(e){
      var day=e.target&&e.target.closest?e.target.closest("[data-toggle-day]"):null;
      if(day&&isProtectedDayCell(day)){
        e.preventDefault();
        e.stopImmediatePropagation();
        openCorrection(day.dataset.toggleDay,day.dataset.date);
        return;
      }

      var dose=e.target&&e.target.closest?e.target.closest("[data-toggle]"):null;
      if(dose&&dose.getAttribute("aria-pressed")==="true"){
        e.preventDefault();
        e.stopImmediatePropagation();
        openCorrection(dose.dataset.toggle,dose.dataset.date);
      }
    },true);
  }

  var observer=new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node&&node.nodeType===1){
          if(node.id==="pp-correction-dialog") polishDialog(node);
          var nested=node.querySelector&&node.querySelector("#pp-correction-dialog");
          if(nested) polishDialog(nested);
          normalizeStatusSymbols(node);
        }
      });
    });
  });

  function start(){
    installSafetyGate();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    var existing=document.getElementById("pp-correction-dialog");
    if(existing) polishDialog(existing);
    normalizeStatusSymbols(document);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
