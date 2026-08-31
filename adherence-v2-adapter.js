// PillPlan Adherence History v2 - application adapter
// Integration helpers used by index.html.
(function (global) {
  "use strict";

  function api() {
    if (!global.PillPlanAdherenceV2) throw new Error("PillPlanAdherenceV2 is required");
    return global.PillPlanAdherenceV2;
  }
  function key(date, medicationId, scheduledTime) { return date + "_" + medicationId + "_" + scheduledTime; }
  function getEntry(takenMap, date, medicationId, scheduledTime) { return (takenMap || {})[key(date, medicationId, scheduledTime)]; }
  function isDone(takenMap, date, medicationId, scheduledTime) { return api().isTaken(getEntry(takenMap, date, medicationId, scheduledTime)); }
  function markTakenNow(takenMap, date, medicationId, scheduledTime, now) {
    var map=takenMap||{}; map[key(date,medicationId,scheduledTime)]=api().createTimedEntry(scheduledTime,now||new Date()); return map[key(date,medicationId,scheduledTime)];
  }
  function markRetroactive(takenMap, date, medicationId, scheduledTime) {
    var map=takenMap||{}; map[key(date,medicationId,scheduledTime)]=api().createRetroactiveEntry(); return map[key(date,medicationId,scheduledTime)];
  }
  function undo(takenMap,date,medicationId,scheduledTime){ delete (takenMap||{})[key(date,medicationId,scheduledTime)]; }

  function entryPresentation(entry) {
    var n=api().normalizeEntry(entry);
    if(!n.taken) return {tier:null,css:"pending",icon:"○",labelKey:"pending"};
    if(n.tier===api().TIER.RED) return {tier:"red",css:"overdue",icon:"●",labelKey:"takenRed"};
    if(n.tier===api().TIER.YELLOW) return {tier:"yellow",css:"yellow",icon:"●",labelKey:"takenYellow"};
    if(n.tier===api().TIER.GREEN) return {tier:"green",css:"done",icon:"✓",labelKey:"takenGreen"};
    return {tier:"unrated",css:"unrated",icon:"✓",labelKey:"takenUnrated"};
  }
  function medicationDaySummary(takenMap,medication,date){
    var times=global.medicationTimesForDate?global.medicationTimesForDate(medication,date):medication.times,entries=[];
    for(var i=0;i<times.length;i++) entries.push(getEntry(takenMap,date,medication.id,times[i]));
    return api().daySummary(entries);
  }
  function dayPresentation(summary){
    if(!summary||summary.status==="none") return {css:"",icon:"·",labelKey:"dayNone"};
    if(summary.status==="partial") return {css:"partial",icon:"◑",labelKey:"dayPartial"};
    if(summary.tier===api().TIER.RED) return {css:"tier-red",icon:"!",labelKey:"dayRed"};
    if(summary.tier===api().TIER.YELLOW) return {css:"tier-yellow",icon:"!",labelKey:"dayYellow"};
    if(summary.tier===api().TIER.GREEN) return {css:"done",icon:"✓",labelKey:"dayGreen"};
    return {css:"unrated",icon:"✓",labelKey:"dayUnrated"};
  }

  var PRODUCT_COPY_V1={
    de:{overdue:"Stark verspätet",total14:"Dokumentierte Einnahmen",shareTitle:"Meine dokumentierten Einnahmen",shareText:"Dokumentierte Einnahmen (PillPlan):",doses:"dokumentiert",allDoneMotivation:"Alles für heute dokumentiert.",allDoneSub:"Gut, dass Sie Ihre Einnahmen im Blick behalten.",time1:"Einnahmezeiten"},
    en:{overdue:"Very late",total14:"Documented doses",shareTitle:"My documented doses",shareText:"Documented doses (PillPlan):"},
    fr:{overdue:"Très en retard",total14:"Prises documentées",shareTitle:"Mes prises documentées",shareText:"Prises documentées (PillPlan) :"},
    es:{overdue:"Muy atrasado",total14:"Tomas documentadas",shareTitle:"Mis tomas documentadas",shareText:"Tomas documentadas (PillPlan):"},
    it:{overdue:"Molto in ritardo",total14:"Assunzioni documentate",shareTitle:"Le mie assunzioni documentate",shareText:"Assunzioni documentate (PillPlan):"},
    tr:{overdue:"Çok gecikmiş",total14:"Belgelenen dozlar",shareTitle:"Belgelenen dozlarım",shareText:"Belgelenen dozlar (PillPlan):"},
    ar:{overdue:"متأخر جدًا",total14:"الجرعات الموثقة",shareTitle:"جرعاتي الموثقة",shareText:"الجرعات الموثقة (PillPlan):"},
    ru:{overdue:"Сильно задержано",total14:"Подтверждённые приёмы",shareTitle:"Мои подтверждённые приёмы",shareText:"Подтверждённые приёмы (PillPlan):"},
    pt:{overdue:"Muito atrasado",total14:"Doses documentadas",shareTitle:"Minhas doses documentadas",shareText:"Doses documentadas (PillPlan):"}
  };
  function applyProductTerminology(){
    if(!global.T) return false;
    Object.keys(PRODUCT_COPY_V1).forEach(function(lang){ if(!global.T[lang])return; var patch=PRODUCT_COPY_V1[lang]; Object.keys(patch).forEach(function(k){global.T[lang][k]=patch[k];}); });
    return true;
  }

  var SETTINGS_COPY={
    de:["Tägliche Erinnerungen","Kann nicht rückgängig gemacht werden"],en:["Daily reminders","Cannot be undone"],fr:["Rappels quotidiens","Action irréversible"],es:["Recordatorios diarios","No se puede deshacer"],it:["Promemoria giornalieri","Non può essere annullato"],tr:["Günlük hatırlatmalar","Geri alınamaz"],ar:["تذكيرات يومية","لا يمكن التراجع"],ru:["Ежедневные напоминания","Отменить нельзя"],pt:["Lembretes diários","Não pode ser desfeito"]
  };

  function installRuntimeGuards(){
    if(global.__pillplanRuntimeGuards) return;
    global.__pillplanRuntimeGuards=true;

    if(typeof global.buildSettings==="function"){
      var baseSettings=global.buildSettings;
      global.buildSettings=function(ov){
        var html=baseSettings(ov),copy=SETTINGS_COPY[(global.S&&global.S.lang)||"en"]||SETTINGS_COPY.en;
        return html.replace("Daily reminders",copy[0]).replace("Cannot be undone",copy[1]);
      };
    }

    if(typeof global.render==="function"){
      var baseRender=global.render;
      global.render=function(){
        if(global.S&&global.PillPlanMedicationScheduleV1){
          var ds=new Date().toISOString().split("T")[0];
          for(var i=0;i<global.S.meds.length;i++){
            var times=global.PillPlanMedicationScheduleV1.timesForDate(global.S.meds[i],ds);
            global.S.meds[i].times=times.slice();
          }
        }
        return baseRender();
      };
      global.render();
    }
  }

  function loadStatisticsV2(){
    if(global.PillPlanStatisticsV2||document.querySelector('script[data-pillplan-stats-v2]')) return;
    var s=document.createElement("script"); s.src="statistics-v2.js"; s.async=false; s.setAttribute("data-pillplan-stats-v2","1"); document.head.appendChild(s);
  }
  function loadMedicationScheduleV1(){
    if(global.PillPlanMedicationScheduleV1){installRuntimeGuards();loadStatisticsV2();return;}
    if(document.querySelector('script[data-pillplan-med-schedule-v1]')) return;
    var s=document.createElement("script"); s.src="medication-schedule-v1.js"; s.async=false; s.setAttribute("data-pillplan-med-schedule-v1","1");
    s.onload=function(){installRuntimeGuards();loadStatisticsV2();}; document.head.appendChild(s);
  }

  global.PillPlanAdherenceAdapter={key:key,getEntry:getEntry,isDone:isDone,markTakenNow:markTakenNow,markRetroactive:markRetroactive,undo:undo,entryPresentation:entryPresentation,medicationDaySummary:medicationDaySummary,dayPresentation:dayPresentation,applyProductTerminology:applyProductTerminology};

  if(typeof document!=="undefined") document.addEventListener("DOMContentLoaded",function(){ if(applyProductTerminology()&&typeof global.render==="function")global.render(); loadMedicationScheduleV1(); },{once:true});
})(typeof window!=="undefined"?window:globalThis);
