(function(global){
  "use strict";

  function pad(n){ return String(n).padStart(2,"0"); }
  function localDateKey(d){
    d=d instanceof Date?d:new Date();
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  }
  function dateFromKey(ds){
    var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(ds||"");
    if(!m) return null;
    return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
  }
  function addDays(ds,n){
    var d=dateFromKey(ds); if(!d) return ds;
    d.setDate(d.getDate()+n);
    return localDateKey(d);
  }
  function today(){ return localDateKey(new Date()); }
  function getPastDays(n){
    var out=[],d=new Date();
    d.setHours(12,0,0,0);
    for(var i=0;i<n;i++){
      var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()-i,12,0,0,0);
      out.push(localDateKey(x));
    }
    return out;
  }
  function getPastDaysAsc(n){ return getPastDays(n).reverse(); }

  global.PillPlanLocalDateV1={today:today,localDateKey:localDateKey,addDays:addDays,getPastDays:getPastDays,getPastDaysAsc:getPastDaysAsc};

  // Replace UTC-derived calendar helpers with local wall-clock calendar dates.
  global.today=today;
  global.getPastDays=getPastDays;
  global.getPastDaysAsc=getPastDaysAsc;

  function todayStatsLocal(){
    if(!global.S||!Array.isArray(global.S.meds)) return {tot:0,dn:0,pct:0};
    var ds=today(),tot=0,dn=0;
    for(var i=0;i<global.S.meds.length;i++){
      var m=global.S.meds[i];
      var times=global.medicationTimesForDate?global.medicationTimesForDate(m,ds):(m.times||[]);
      tot+=times.length;
      for(var j=0;j<times.length;j++) if(typeof global.isDone==="function"&&global.isDone(m.id,ds,times[j])) dn++;
    }
    return {tot:tot,dn:dn,pct:tot?Math.round(dn/tot*100):0};
  }

  function calcStreakLocal(){
    if(!global.S||!global.S.meds||!global.S.meds.length) return 0;
    var streak=0,td=today(),cursor=new Date();
    cursor.setHours(12,0,0,0);
    for(var i=0;i<3650;i++){
      var ds=localDateKey(cursor),active=[];
      for(var m=0;m<global.S.meds.length;m++){
        var times=global.medicationTimesForDate?global.medicationTimesForDate(global.S.meds[m],ds):(global.S.meds[m].times||[]);
        if(times.length) active.push(global.S.meds[m]);
      }
      if(!active.length){
        if(ds!==td) break;
      }else{
        var done=true;
        for(var a=0;a<active.length;a++){
          if(typeof global.allDoneDay==="function"&&!global.allDoneDay(active[a],ds)){done=false;break;}
        }
        if(done) streak++; else if(ds!==td) break;
      }
      cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }

  global.todayStats=todayStatsLocal;
  global.calcStreak=calcStreakLocal;

  // If a new medication is created around local midnight, normalize its start date
  // after the legacy save handler has finished.
  global.addEventListener("click",function(e){
    var btn=e.target&&e.target.closest?e.target.closest("#save-btn"):null;
    if(!btn||!global.F||global.F.editId||!global.S||!Array.isArray(global.S.meds)) return;
    var before={};
    global.S.meds.forEach(function(m){before[String(m.id)]=true;});
    setTimeout(function(){
      if(!global.S||!Array.isArray(global.S.meds)) return;
      var ds=today(),changed=false;
      for(var i=0;i<global.S.meds.length;i++){
        var m=global.S.meds[i];
        if(before[String(m.id)]) continue;
        if(Math.abs(Date.now()-Number(m.id))>10000) continue;
        if(m.startDate!==ds){m.startDate=ds;changed=true;}
        if(Array.isArray(m.scheduleHistory)&&m.scheduleHistory.length&&m.scheduleHistory[0].from!==ds){m.scheduleHistory[0].from=ds;changed=true;}
      }
      if(changed){
        if(typeof global.persist==="function") global.persist();
        if(typeof global.render==="function") global.render();
      }
    },0);
  },true);

  var lastDay=today(),timer=null;
  function refreshIfDayChanged(){
    var now=today();
    if(now!==lastDay){
      lastDay=now;
      if(typeof global.render==="function") global.render();
    }
  }
  function scheduleMidnightRefresh(){
    if(timer) clearTimeout(timer);
    var now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,2,0);
    timer=setTimeout(function(){refreshIfDayChanged();scheduleMidnightRefresh();},Math.max(1000,next-now));
  }
  document.addEventListener("visibilitychange",function(){if(!document.hidden) refreshIfDayChanged();});
  scheduleMidnightRefresh();
})(window);
