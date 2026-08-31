// PillPlan Medication Schedule v1
// Preserves medication start dates and historical intake times without adding UI complexity.
(function(global){
  "use strict";

  function today(){ return new Date().toISOString().split("T")[0]; }
  function nextDay(ds){ var d=new Date(ds+"T00:00:00"); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; }
  function cloneTimes(times){ return (times||[]).slice(); }
  function sameTimes(a,b){ return JSON.stringify(a||[])===JSON.stringify(b||[]); }

  function inferStartDate(m){
    var earliest=null, marker="_"+m.id+"_", keys=Object.keys((global.S&&global.S.taken)||{});
    for(var i=0;i<keys.length;i++){
      if(keys[i].indexOf(marker)>0){ var ds=keys[i].slice(0,10); if(!earliest||ds<earliest) earliest=ds; }
    }
    return earliest||today();
  }

  function ensureMedication(m){
    if(!m.startDate) m.startDate=inferStartDate(m);
    if(!Array.isArray(m.scheduleHistory)||!m.scheduleHistory.length){
      m.scheduleHistory=[{from:m.startDate,times:cloneTimes(m.times)}];
    }
    m.scheduleHistory.sort(function(a,b){ return a.from.localeCompare(b.from); });
    return m;
  }

  function migrate(){
    if(!global.S||!Array.isArray(global.S.meds)) return false;
    var changed=false;
    for(var i=0;i<global.S.meds.length;i++){
      var m=global.S.meds[i], hadStart=!!m.startDate, hadHistory=Array.isArray(m.scheduleHistory)&&m.scheduleHistory.length;
      ensureMedication(m);
      if(!hadStart||!hadHistory) changed=true;
    }
    if(changed&&typeof global.persist==="function") global.persist();
    return changed;
  }

  function isActive(m,ds){ ensureMedication(m); return ds>=m.startDate; }
  function timesForDate(m,ds){
    ensureMedication(m);
    if(ds<m.startDate) return [];
    var times=[];
    for(var i=0;i<m.scheduleHistory.length;i++){
      if(m.scheduleHistory[i].from<=ds) times=cloneTimes(m.scheduleHistory[i].times); else break;
    }
    return times;
  }

  function anyDocumented(m,ds,times){
    for(var i=0;i<times.length;i++) if(global.isDone(m.id,ds,times[i])) return true;
    return false;
  }

  function allDoneDay(m,ds){
    var times=timesForDate(m,ds);
    if(!times.length) return false;
    for(var i=0;i<times.length;i++) if(!global.isDone(m.id,ds,times[i])) return false;
    return true;
  }

  function todayStats(){
    var ds=today(),tot=0,dn=0;
    for(var i=0;i<global.S.meds.length;i++){
      var m=global.S.meds[i],times=timesForDate(m,ds);
      tot+=times.length;
      for(var j=0;j<times.length;j++) if(global.isDone(m.id,ds,times[j])) dn++;
    }
    return {tot:tot,dn:dn,pct:tot?Math.round(dn/tot*100):0};
  }

  function overallStats(){
    var days=global.getPastDays(global.S.period),tot=0,dn=0;
    for(var i=0;i<global.S.meds.length;i++){
      var m=global.S.meds[i];
      for(var d=0;d<days.length;d++){
        var times=timesForDate(m,days[d]);
        tot+=times.length;
        for(var t=0;t<times.length;t++) if(global.isDone(m.id,days[d],times[t])) dn++;
      }
    }
    return {tot:tot,dn:dn,pct:tot?Math.round(dn/tot*100):0};
  }

  function calcStreak(){
    if(!global.S.meds.length) return 0;
    var streak=0,td=today(),cursor=new Date();
    for(var i=0;i<3650;i++){
      var ds=cursor.toISOString().split("T")[0],active=[];
      for(var m=0;m<global.S.meds.length;m++) if(timesForDate(global.S.meds[m],ds).length) active.push(global.S.meds[m]);
      if(!active.length){ if(ds!==td) break; }
      else {
        var done=true;
        for(var a=0;a<active.length;a++) if(!allDoneDay(active[a],ds)){ done=false; break; }
        if(done) streak++; else if(ds!==td) break;
      }
      cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }

  function buildPlan(days,td){
    if(!global.S.meds.length) return '<div class="empty"><div class="empty-icon" aria-hidden="true">📅</div><div class="empty-text">'+global.tr("noMeds")+'</div><button class="btn-primary" style="width:auto;padding:14px 32px;margin:0 auto;display:block" data-nav="add">'+global.tr("addFirst")+'</button></div>';
    var html=global.buildStatusLegend();
    for(var mi=0;mi<global.S.meds.length;mi++){
      var m=global.S.meds[mi]; ensureMedication(m);
      html+='<div class="plan-med anim-up" style="animation-delay:'+(mi*60)+'ms"><div class="plan-med-header"><div>';
      html+='<div class="plan-med-name"><div class="color-dot" style="background:'+m.color+'" aria-hidden="true"></div>'+m.name+'</div>';
      html+='<div class="plan-med-time">'+m.times.join(" · ")+'</div></div><div style="display:flex;gap:6px">';
      html+='<button class="edit-btn" data-edit="'+m.id+'">✏️ '+(global.S.lang==="de"?"Bearbeiten":"Edit")+'</button>';
      html+='<button style="background:var(--red-bg);color:var(--red);border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit" data-remove="'+m.id+'">'+global.tr("remove")+'</button></div></div><div class="day-grid">';
      for(var di=0;di<days.length;di++){
        var ds=days[di],times=timesForDate(m,ds);
        if(!times.length){
          html+='<div class="day-cell" style="background:transparent;border-color:transparent;color:var(--ink3);cursor:default" aria-label="'+m.name+' '+ds+' – '+(global.S.lang==="de"?"vor Beginn":"before start")+'"><span class="day-wd">'+global.fmtDayShort(ds)+'</span><span class="day-num">'+new Date(ds+'T00:00:00').getDate()+'</span><span class="day-ico">–</span></div>';
          continue;
        }
        var done=allDoneDay(m,ds),any=false,tiers=[];
        for(var k=0;k<times.length;k++) if(global.isDone(m.id,ds,times[k])){ any=true; tiers.push(global.storedTier(m.id,ds,times[k])); }
        var partial=!done&&any,dayTier=null;
        if(done&&global.PillPlanAdherenceV2){
          if(tiers.indexOf("red")>=0) dayTier="red";
          else if(tiers.indexOf("yellow")>=0) dayTier="yellow";
          else if(tiers.indexOf("unrated")>=0||tiers.indexOf(null)>=0) dayTier="unrated";
          else dayTier="green";
        }
        var cls="day-cell",isT=ds===td,isPast=ds<td;
        if(partial) cls+=" partial"; else if(done&&dayTier==="red") cls+=" tier-red"; else if(done&&dayTier==="yellow") cls+=" tier-yellow"; else if(done&&dayTier==="unrated") cls+=" unrated"; else if(done) cls+=" done"; else if(isPast) cls+=" past"; if(isT) cls+=" today";
        var icon=partial?"◑":done&&dayTier==="red"?"!!":done&&dayTier==="yellow"?"!":done?"✓":"·";
        html+='<button class="'+cls+'" data-toggle-day="'+m.id+'" data-date="'+ds+'"><span class="day-wd">'+global.fmtDayShort(ds)+'</span><span class="day-num">'+new Date(ds+'T00:00:00').getDate()+'</span><span class="day-ico">'+icon+'</span></button>';
      }
      html+='</div></div>'; if(mi<global.S.meds.length-1) html+='<div class="plan-divider"></div>';
    }
    return html;
  }

  function buildShareText(){
    var td=today(),days=global.getPastDays(global.S.period).reverse().filter(function(d){return d<=td;}),lines=["💊 "+global.tr("shareTitle"),"📅 "+new Date().toLocaleDateString(),""];
    for(var i=0;i<global.S.meds.length;i++){
      var m=global.S.meds[i],eligible=0,done=0;
      for(var j=0;j<days.length;j++) if(timesForDate(m,days[j]).length){ eligible++; if(allDoneDay(m,days[j])) done++; }
      var pct=eligible?Math.round(done/eligible*100):0;
      lines.push("• "+m.name+": "+pct+"% ("+done+"/"+eligible+")");
      lines.push("  "+m.times.join(" · ")+" Uhr");
    }
    lines.push(""); lines.push("— PillPlan"); return lines.join("\n");
  }

  function saveMedication(e){
    var btn=e.target&&e.target.closest?e.target.closest("#save-btn"):null;
    if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    global.syncF();
    if(!global.F.name.trim()){ global.showToast(global.tr("nameRequired")); return; }
    var times=[global.F.time1]; if(global.F.time2)times.push(global.F.time2); if(global.F.time3)times.push(global.F.time3); if(global.F.time4)times.push(global.F.time4);
    if(global.F.editId){
      var m=null; for(var i=0;i<global.S.meds.length;i++) if(global.S.meds[i].id===global.F.editId){m=global.S.meds[i];break;}
      if(m){
        ensureMedication(m);
        var old=cloneTimes(m.times);
        if(!sameTimes(old,times)){
          var from=anyDocumented(m,today(),old)?nextDay(today()):today();
          var h=m.scheduleHistory;
          if(h.length&&h[h.length-1].from===from) h[h.length-1].times=cloneTimes(times); else h.push({from:from,times:cloneTimes(times)});
          h.sort(function(a,b){return a.from.localeCompare(b.from);});
        }
        m.name=global.F.name.trim(); m.times=cloneTimes(times); m.color=global.F.color;
      }
    } else {
      var ds=today();
      global.S.meds.push({id:Date.now(),name:global.F.name.trim(),times:cloneTimes(times),color:global.F.color,startDate:ds,scheduleHistory:[{from:ds,times:cloneTimes(times)}]});
    }
    global.F={name:"",time1:"08:00",time2:"",time3:"",time4:"",color:"#2a7c74"};
    global.S.screen="today"; global.persist(); global.render(); global.showToast(global.tr("saved"));
  }

  function toggleHistoricalDay(e){
    var btn=e.target&&e.target.closest?e.target.closest("[data-toggle-day]"):null;
    if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    var mid=parseInt(btn.dataset.toggleDay),ds=btn.dataset.date,m=null;
    for(var i=0;i<global.S.meds.length;i++) if(global.S.meds[i].id===mid){m=global.S.meds[i];break;}
    if(!m) return;
    var times=timesForDate(m,ds); if(!times.length) return;
    var done=allDoneDay(m,ds);
    for(var j=0;j<times.length;j++){
      var key=global.intakeKey(mid,ds,times[j]);
      if(done) delete global.S.taken[key];
      else if(global.PillPlanAdherenceV2) global.S.taken[key]=global.PillPlanAdherenceV2.createRetroactiveEntry(); else global.S.taken[key]=true;
    }
    if(!done) global.showToast(global.tr("taken"));
    global.persist(); global.render();
  }

  migrate();
  global.PillPlanMedicationScheduleV1={ensureMedication:ensureMedication,isActive:isActive,timesForDate:timesForDate};
  global.medicationTimesForDate=timesForDate;
  global.medicationActiveOnDate=isActive;
  global.allDoneDay=allDoneDay;
  global.todayStats=todayStats;
  global.overallStats=overallStats;
  global.calcStreak=calcStreak;
  global.buildPlan=buildPlan;
  global.buildShareText=buildShareText;
  document.addEventListener("click",saveMedication,true);
  document.addEventListener("click",toggleHistoricalDay,true);
  if(typeof global.render==="function") global.render();
})(window);
