(function(global){
  "use strict";

  function pad(n){ return String(n).padStart(2,"0"); }
  function localDate(d){ var x=d||new Date(); return x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate()); }
  function shiftDate(ds,days){ var p=ds.split("-"); var d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2])); d.setDate(d.getDate()+days); return localDate(d); }
  function today(){ return localDate(new Date()); }
  function tomorrow(){ return shiftDate(today(),1); }
  function previousDay(ds){ return shiftDate(ds,-1); }

  function findMedication(id){
    if(!global.S||!Array.isArray(global.S.meds)) return null;
    for(var i=0;i<global.S.meds.length;i++) if(String(global.S.meds[i].id)===String(id)) return global.S.meds[i];
    return null;
  }

  function currentTimes(m){
    if(global.PillPlanMedicationScheduleV1&&typeof global.PillPlanMedicationScheduleV1.timesForDate==="function"){
      return global.PillPlanMedicationScheduleV1.timesForDate(m,today()).slice();
    }
    return (m.times||[]).slice();
  }

  function anyDocumentedToday(m){
    var ds=today(),times=currentTimes(m);
    for(var i=0;i<times.length;i++){
      if(typeof global.isDone==="function"&&global.isDone(m.id,ds,times[i])) return true;
    }
    return false;
  }

  function ensureHistory(m){
    if(global.PillPlanMedicationScheduleV1&&typeof global.PillPlanMedicationScheduleV1.ensureMedication==="function") global.PillPlanMedicationScheduleV1.ensureMedication(m);
    if(!m.startDate) m.startDate=today();
    if(!Array.isArray(m.scheduleHistory)||!m.scheduleHistory.length) m.scheduleHistory=[{from:m.startDate,times:(m.times||[]).slice()}];
  }

  function endMedication(m,effectiveFrom){
    ensureHistory(m);
    var h=m.scheduleHistory;
    var replaced=false;
    for(var i=0;i<h.length;i++){
      if(h[i].from===effectiveFrom){ h[i].times=[]; replaced=true; break; }
    }
    if(!replaced) h.push({from:effectiveFrom,times:[]});
    h.sort(function(a,b){return a.from.localeCompare(b.from);});
    m.endDate=previousDay(effectiveFrom);
    m.endedAt=new Date().toISOString();
    if(typeof global.persist==="function") global.persist();
    if(typeof global.render==="function") global.render();
    if(typeof global.showToast==="function") global.showToast((global.S&&global.S.lang)==="de"?"Medikament beendet – Historie bleibt erhalten ✓":"Medication ended – history preserved ✓");
  }

  function closeDialog(){ var el=document.getElementById("pp-med-end-dialog"); if(el) el.remove(); }

  function openDialog(m){
    closeDialog();
    var de=global.S&&global.S.lang==="de";
    var documented=anyDocumentedToday(m);
    var wrap=document.createElement("div");
    wrap.id="pp-med-end-dialog";
    wrap.style.cssText="position:fixed;inset:0;background:rgba(26,22,18,.45);z-index:14000;display:flex;align-items:flex-end;justify-content:center;padding:18px";
    var sheet=document.createElement("div");
    sheet.style.cssText="width:min(430px,100%);background:var(--cream,#f7f4ef);border-radius:24px 24px 18px 18px;padding:20px;box-shadow:0 -10px 40px rgba(0,0,0,.2)";
    var info=de?"Das Medikament wird nicht gelöscht. Vergangene Einnahmen bleiben im Plan erhalten.":"The medication will not be deleted. Past intake history remains available.";
    var choices=documented
      ? '<button data-med-end="tomorrow" style="width:100%;min-height:52px;border-radius:14px;background:var(--teal,#2a7c74);color:#fff;font-weight:800">'+(de?'Nach heute beenden':'End after today')+'</button>'
      : '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button data-med-end="today" style="min-height:52px;border-radius:14px;background:var(--teal,#2a7c74);color:#fff;font-weight:800">'+(de?'Ab heute beenden':'End from today')+'</button><button data-med-end="tomorrow" style="min-height:52px;border-radius:14px;background:var(--gold-bg,#fdf8f0);color:var(--ink,#1a1612);font-weight:800">'+(de?'Nach heute beenden':'End after today')+'</button></div>';
    sheet.innerHTML='<div style="font-family:Fraunces,serif;font-size:22px;font-weight:700;margin-bottom:6px">'+(de?'Medikament beenden':'End medication')+'</div><div style="font-size:14px;color:var(--ink2,#4a4540);line-height:1.5;margin-bottom:16px"><strong>'+m.name+'</strong><br>'+info+(documented?'<br><br>'+(de?'Für heute ist bereits eine Einnahme dokumentiert. Deshalb bleibt der heutige Tag erhalten.':'An intake is already documented for today, so today will remain in the history.'):'')+'</div>'+choices+'<button data-med-end-cancel="1" style="width:100%;min-height:48px;margin-top:10px;border-radius:14px;background:var(--cream2,#f0ebe2);color:var(--ink,#1a1612);font-weight:800">'+(de?'Abbrechen':'Cancel')+'</button>';
    wrap.appendChild(sheet); document.body.appendChild(wrap);

    wrap.addEventListener("click",function(e){
      var b=e.target.closest("[data-med-end]");
      if(b){ var from=b.dataset.medEnd==="today"?today():tomorrow(); closeDialog(); endMedication(m,from); return; }
      if(e.target.closest("[data-med-end-cancel]")) closeDialog();
    });
  }

  function decorateEnded(){
    if(!global.S||!Array.isArray(global.S.meds)) return;
    var buttons=document.querySelectorAll("[data-remove]");
    buttons.forEach(function(btn){
      var m=findMedication(btn.dataset.remove); if(!m) return;
      if(m.endDate){
        btn.textContent=(global.S.lang==="de"?"Beendet":"Ended");
        btn.disabled=true;
        btn.style.opacity=".55";
        btn.style.cursor="default";
      }else if(global.S.lang==="de"){
        btn.textContent="Beenden";
      }
    });
  }

  function intercept(e){
    var btn=e.target&&e.target.closest?e.target.closest("[data-remove]"):null;
    if(!btn) return;
    var m=findMedication(btn.dataset.remove); if(!m||m.endDate) return;
    e.preventDefault(); e.stopImmediatePropagation();
    openDialog(m);
  }

  global.addEventListener("click",intercept,true);
  var observer=new MutationObserver(function(){ decorateEnded(); });
  function start(){ observer.observe(document.documentElement,{childList:true,subtree:true}); decorateEnded(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})(window);
