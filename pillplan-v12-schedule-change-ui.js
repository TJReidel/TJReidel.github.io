(function(global){
  "use strict";

  function today(){ return new Date().toISOString().split("T")[0]; }
  function nextDay(ds){ var d=new Date(ds+"T00:00:00"); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; }
  function cloneTimes(times){ return (times||[]).slice(); }
  function sameTimes(a,b){ return JSON.stringify(a||[])===JSON.stringify(b||[]); }
  function intakeKey(mid,date,time){ return date+"_"+mid+"_"+time; }

  function currentTimesFromForm(){
    var times=[global.F.time1];
    if(global.F.time2) times.push(global.F.time2);
    if(global.F.time3) times.push(global.F.time3);
    if(global.F.time4) times.push(global.F.time4);
    return times;
  }

  function findMedication(id){
    if(!global.S||!Array.isArray(global.S.meds)) return null;
    for(var i=0;i<global.S.meds.length;i++) if(String(global.S.meds[i].id)===String(id)) return global.S.meds[i];
    return null;
  }

  function anyDocumentedToday(m,oldTimes){
    var ds=today();
    for(var i=0;i<oldTimes.length;i++){
      if(typeof global.isDone==="function" && global.isDone(m.id,ds,oldTimes[i])) return true;
      var entry=global.S&&global.S.taken&&global.S.taken[intakeKey(m.id,ds,oldTimes[i])];
      if(entry) return true;
    }
    return false;
  }

  function ensureHistory(m){
    if(global.PillPlanMedicationScheduleV1&&typeof global.PillPlanMedicationScheduleV1.ensureMedication==="function"){
      global.PillPlanMedicationScheduleV1.ensureMedication(m);
    }
    if(!m.startDate) m.startDate=today();
    if(!Array.isArray(m.scheduleHistory)||!m.scheduleHistory.length){
      m.scheduleHistory=[{from:m.startDate,times:cloneTimes(m.times)}];
    }
  }

  function applyChange(m,newTimes,from){
    ensureHistory(m);
    var h=m.scheduleHistory;
    if(h.length&&h[h.length-1].from===from) h[h.length-1].times=cloneTimes(newTimes);
    else h.push({from:from,times:cloneTimes(newTimes)});
    h.sort(function(a,b){return a.from.localeCompare(b.from);});

    m.name=global.F.name.trim();
    m.times=cloneTimes(newTimes);
    m.color=global.F.color;

    global.F={name:"",time1:"08:00",time2:"",time3:"",time4:"",color:"#2a7c74"};
    global.S.screen="today";
    if(typeof global.persist==="function") global.persist();
    if(typeof global.render==="function") global.render();
    if(typeof global.showToast==="function"){
      var de=global.S&&global.S.lang==="de";
      global.showToast(de?(from===today()?"Neue Einnahmezeit gilt ab heute ✓":"Neue Einnahmezeit gilt ab morgen ✓"):(from===today()?"New time applies from today ✓":"New time applies from tomorrow ✓"));
    }
  }

  function closeDialog(){ var el=document.getElementById("pp-schedule-change-dialog"); if(el) el.remove(); }

  function openDialog(m,newTimes){
    closeDialog();
    var de=global.S&&global.S.lang==="de";
    var wrap=document.createElement("div");
    wrap.id="pp-schedule-change-dialog";
    wrap.style.cssText="position:fixed;inset:0;background:rgba(26,22,18,.45);z-index:13000;display:flex;align-items:flex-end;justify-content:center;padding:18px";
    var sheet=document.createElement("div");
    sheet.style.cssText="width:min(430px,100%);background:var(--cream,#f7f4ef);border-radius:24px 24px 18px 18px;padding:20px;box-shadow:0 -10px 40px rgba(0,0,0,.2)";
    sheet.innerHTML='<div style="font-family:Fraunces,serif;font-size:22px;font-weight:700;margin-bottom:6px">'+(de?'Einnahmezeit ändern':'Change intake time')+'</div>'+
      '<div style="font-size:14px;color:var(--ink2,#4a4540);line-height:1.45;margin-bottom:16px">'+m.name+'<br>'+(de?'Bisher: ':'Current: ')+m.times.join(' · ')+' → '+newTimes.join(' · ')+'<br><br>'+(de?'Vergangene Tage bleiben unverändert. Ab wann soll die neue Zeit gelten?':'Past days remain unchanged. When should the new time apply?')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
      '<button data-schedule-from="today" style="min-height:50px;border-radius:14px;background:var(--teal,#2a7c74);color:#fff;font-weight:800">'+(de?'Ab heute':'From today')+'</button>'+
      '<button data-schedule-from="tomorrow" style="min-height:50px;border-radius:14px;background:var(--gold-bg,#fdf8f0);color:var(--ink,#1a1612);font-weight:800">'+(de?'Ab morgen':'From tomorrow')+'</button>'+
      '</div><button data-schedule-cancel="1" style="width:100%;min-height:48px;margin-top:10px;border-radius:14px;background:var(--cream2,#f0ebe2);color:var(--ink,#1a1612);font-weight:800">'+(de?'Abbrechen':'Cancel')+'</button>';
    wrap.appendChild(sheet); document.body.appendChild(wrap);

    wrap.addEventListener("click",function(e){
      var b=e.target.closest("[data-schedule-from]");
      if(b){ var from=b.dataset.scheduleFrom==="today"?today():nextDay(today()); closeDialog(); applyChange(m,newTimes,from); return; }
      if(e.target.closest("[data-schedule-cancel]")){ closeDialog(); }
    });
  }

  function intercept(e){
    var btn=e.target&&e.target.closest?e.target.closest("#save-btn"):null;
    if(!btn||!global.F||!global.F.editId) return;
    if(typeof global.syncF==="function") global.syncF();
    var m=findMedication(global.F.editId); if(!m) return;
    var newTimes=currentTimesFromForm(),oldTimes=cloneTimes(m.times);
    if(sameTimes(oldTimes,newTimes)) return;

    e.preventDefault(); e.stopImmediatePropagation();
    if(anyDocumentedToday(m,oldTimes)){
      var from=nextDay(today());
      applyChange(m,newTimes,from);
      if(typeof global.showToast==="function"&&global.S&&global.S.lang==="de") global.showToast("Heute bereits dokumentiert – Änderung gilt ab morgen ✓");
      return;
    }
    openDialog(m,newTimes);
  }

  global.addEventListener("click",intercept,true);
})(window);
