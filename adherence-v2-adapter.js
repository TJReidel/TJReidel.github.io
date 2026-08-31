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
    if(summary.tier===api().TIER.RED) return {css:"tier-red",icon:"●",labelKey:"dayRed"};
    if(summary.tier===api().TIER.YELLOW) return {css:"tier-yellow",icon:"●",labelKey:"dayYellow"};
    if(summary.tier===api().TIER.GREEN) return {css:"done",icon:"✓",labelKey:"dayGreen"};
    return {css:"unrated",icon:"✓",labelKey:"dayUnrated"};
  }

  var PRODUCT_COPY_V12={
    de:{
      overdue:"Stark verspätet",total14:"Dokumentierte Einnahmen",shareTitle:"Meine dokumentierten Einnahmen",shareText:"Dokumentierte Einnahmen (PillPlan):",doses:"dokumentiert",allDoneMotivation:"Alles für heute dokumentiert.",allDoneSub:"Gut, dass Sie Ihre Einnahmen im Blick behalten.",time1:"Einnahmezeiten",mhdTitle:"Verfallsdatum",mhdText:"Bitte prüfen Sie regelmäßig das Verfallsdatum Ihrer Medikamente."
    },
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
    Object.keys(PRODUCT_COPY_V12).forEach(function(lang){
      if(!global.T[lang]) return;
      var patch=PRODUCT_COPY_V12[lang];
      Object.keys(patch).forEach(function(k){global.T[lang][k]=patch[k];});
    });
    return true;
  }

  var SETTINGS_COPY={
    de:{daily:"Tägliche Erinnerungen",undo:"Dieser Vorgang kann nicht rückgängig gemacht werden.",deleteBtn:"Daten löschen",documentation:"Dokumentation",punctuality:"Pünktlichkeit"},
    en:{daily:"Daily reminders",undo:"This action cannot be undone.",deleteBtn:"Delete data",documentation:"Documentation",punctuality:"Punctuality"},
    fr:{daily:"Rappels quotidiens",undo:"Cette action est irréversible.",deleteBtn:"Supprimer les données",documentation:"Documentation",punctuality:"Ponctualité"},
    es:{daily:"Recordatorios diarios",undo:"Esta acción no se puede deshacer.",deleteBtn:"Eliminar datos",documentation:"Documentación",punctuality:"Puntualidad"},
    it:{daily:"Promemoria giornalieri",undo:"Questa azione non può essere annullata.",deleteBtn:"Elimina dati",documentation:"Documentazione",punctuality:"Puntualità"},
    tr:{daily:"Günlük hatırlatmalar",undo:"Bu işlem geri alınamaz.",deleteBtn:"Verileri sil",documentation:"Belgeleme",punctuality:"Zamanında alma"},
    ar:{daily:"تذكيرات يومية",undo:"لا يمكن التراجع عن هذا الإجراء.",deleteBtn:"حذف البيانات",documentation:"التوثيق",punctuality:"الالتزام بالوقت"},
    ru:{daily:"Ежедневные напоминания",undo:"Это действие нельзя отменить.",deleteBtn:"Удалить данные",documentation:"Документирование",punctuality:"Своевременность"},
    pt:{daily:"Lembretes diários",undo:"Esta ação não pode ser desfeita.",deleteBtn:"Apagar dados",documentation:"Documentação",punctuality:"Pontualidade"}
  };

  function langCopy(){
    var lang=(global.S&&global.S.lang)||"de";
    return SETTINGS_COPY[lang]||SETTINGS_COPY.en;
  }

  function injectV12Styles(){
    if(document.getElementById("pillplan-v12-styles")) return;
    var style=document.createElement("style");
    style.id="pillplan-v12-styles";
    style.textContent=".pp-quality-line{font-size:12px;opacity:.92;margin-top:-7px;margin-bottom:10px;font-weight:600}.dose-icon.pp-documented{font-size:23px;font-weight:900;color:var(--ink2)}.dose-card.overdue .dose-icon.pp-documented{color:var(--red)}.dose-card.tier-yellow .dose-icon.pp-documented{color:#8a641d}.status-swatch.red,.status-swatch.yellow{font-size:15px}.pp-version-note{font-weight:600}";
    document.head.appendChild(style);
  }

  function todaysTimingStats(){
    var result={documented:0,total:0,onTime:0,rated:0};
    if(!global.S||!global.PillPlanAdherenceV2) return result;
    var date=new Date().toISOString().split("T")[0];
    for(var i=0;i<global.S.meds.length;i++){
      var med=global.S.meds[i];
      for(var j=0;j<med.times.length;j++){
        result.total++;
        var entry=getEntry(global.S.taken,date,med.id,med.times[j]);
        var n=api().normalizeEntry(entry);
        if(!n.taken) continue;
        result.documented++;
        if(n.tier===api().TIER.GREEN){result.onTime++;result.rated++;}
        else if(n.tier===api().TIER.YELLOW||n.tier===api().TIER.RED){result.rated++;}
      }
    }
    return result;
  }

  function polishRenderedUi(){
    injectV12Styles();
    document.title="PillPlan 1.2";
    var copy=langCopy();

    // 1) Separate documentation completeness from timing quality.
    var stats=todaysTimingStats();
    var title=document.querySelector(".progress-title");
    var sub=document.querySelector(".progress-sub");
    if(title) title.textContent=copy.documentation;
    if(sub){
      sub.textContent=stats.documented+" / "+stats.total+" "+((global.S&&global.S.lang)==="de"?"dokumentiert":"documented");
      var old=document.querySelector(".pp-quality-line"); if(old) old.remove();
      if(stats.documented>0){
        var quality=document.createElement("div");
        quality.className="pp-quality-line";
        var pct=stats.rated?Math.round(stats.onTime/stats.rated*100):null;
        quality.textContent=copy.punctuality+": "+(pct===null?"–":pct+"%");
        sub.insertAdjacentElement("afterend",quality);
      }
    }

    // 2) Check mark = documented; card color = timing quality.
    var cards=document.querySelectorAll(".dose-card");
    cards.forEach(function(card){
      var button=card.querySelector(".check-btn");
      var icon=card.querySelector(".dose-icon");
      if(button&&button.getAttribute("aria-pressed")==="true"&&icon){
        icon.textContent="✓";
        icon.classList.add("pp-documented");
      }
    });

    // 3) Plan view: no alarm-like double exclamation marks.
    document.querySelectorAll(".day-ico").forEach(function(el){ if(el.textContent.trim()==="!!") el.textContent="●"; });
    document.querySelectorAll(".status-swatch.red,.status-swatch.yellow").forEach(function(el){ if(el.textContent.trim()==="!") el.textContent="●"; });

    // 4) Localize residual settings copy and reduce duplicate destructive wording.
    document.querySelectorAll(".settings-row-sub").forEach(function(el){
      if(el.textContent.trim()==="Daily reminders") el.textContent=copy.daily;
      if(el.textContent.trim()==="Cannot be undone") el.textContent=copy.undo;
    });
    var reset=document.getElementById("reset-btn");
    if(reset) reset.textContent=copy.deleteBtn;

    // 5) Expiry-date reminder is not part of the daily core flow.
    document.querySelectorAll(".mhd-banner").forEach(function(el){
      var txt=el.textContent||"";
      if(txt.indexOf("Mindesthaltbarkeitsdatum")>=0||txt.indexOf("Verfallsdatum")>=0||txt.indexOf("expiry date")>=0||txt.indexOf("Expiry date")>=0) el.remove();
    });

    // Visible version marker.
    document.querySelectorAll("div").forEach(function(el){
      if(el.children.length===0&&el.textContent.trim()==="PillPlan v1.1"){
        el.textContent="PillPlan v1.2";
        el.classList.add("pp-version-note");
      }
    });
  }

  function installRuntimeGuards(){
    if(global.__pillplanRuntimeGuardsV12) return;
    global.__pillplanRuntimeGuardsV12=true;

    if(typeof global.buildSettings==="function"){
      var baseSettings=global.buildSettings;
      global.buildSettings=function(ov){
        var html=baseSettings(ov),copy=langCopy();
        return html.replace("Daily reminders",copy.daily).replace("Cannot be undone",copy.undo);
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
        var result=baseRender();
        polishRenderedUi();
        return result;
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

  global.PillPlanAdherenceAdapter={key:key,getEntry:getEntry,isDone:isDone,markTakenNow:markTakenNow,markRetroactive:markRetroactive,undo:undo,entryPresentation:entryPresentation,medicationDaySummary:medicationDaySummary,dayPresentation:dayPresentation,applyProductTerminology:applyProductTerminology,polishRenderedUi:polishRenderedUi};

  if(typeof document!=="undefined") document.addEventListener("DOMContentLoaded",function(){
    applyProductTerminology();
    loadMedicationScheduleV1();
  },{once:true});
})(typeof window!=="undefined"?window:globalThis);
