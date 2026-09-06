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
    de:{overdue:"Stark verspätet",total14:"Dokumentierte Einnahmen",shareTitle:"Meine dokumentierten Einnahmen",shareText:"Dokumentierte Einnahmen (PillPlan):",doses:"dokumentiert",allDoneMotivation:"Alles für heute dokumentiert.",allDoneSub:"Gut, dass Sie Ihre Einnahmen im Blick behalten.",time1:"Einnahmezeiten",mhdTitle:"Verfallsdatum",mhdText:"Bitte prüfen Sie regelmäßig das Verfallsdatum Ihrer Medikamente."},
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
    Object.keys(PRODUCT_COPY_V12).forEach(function(lang){ if(!global.T[lang]) return; var patch=PRODUCT_COPY_V12[lang]; Object.keys(patch).forEach(function(k){global.T[lang][k]=patch[k];}); });
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
  function langCopy(){ var lang=(global.S&&global.S.lang)||"de"; return SETTINGS_COPY[lang]||SETTINGS_COPY.en; }

  function injectV12Styles(){
    if(document.getElementById("pillplan-v12-styles")) return;
    var style=document.createElement("style"); style.id="pillplan-v12-styles";
    style.textContent=".pp-quality-line{font-size:12px;opacity:.92;margin-top:-7px;margin-bottom:10px;font-weight:600}.dose-icon.pp-documented{font-size:23px;font-weight:900;color:var(--ink2)}.dose-card.overdue .dose-icon.pp-documented{color:var(--red)}.dose-card.tier-yellow .dose-icon.pp-documented{color:#8a641d}.status-swatch.red,.status-swatch.yellow{font-size:15px}.pp-version-note{font-weight:600}.pp-protected{cursor:default}.pp-correction-backdrop{position:fixed;inset:0;background:rgba(26,22,18,.45);z-index:12000;display:flex;align-items:flex-end;justify-content:center;padding:18px}.pp-correction-sheet{width:min(430px,100%);background:var(--cream);border-radius:24px 24px 18px 18px;padding:20px;box-shadow:0 -10px 40px rgba(0,0,0,.2);max-height:78vh;overflow:auto}.pp-correction-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin-bottom:5px}.pp-correction-sub{font-size:13px;color:var(--ink2);margin-bottom:16px}.pp-correction-dose{background:#fff;border:1.5px solid var(--cream2);border-radius:16px;padding:14px;margin-bottom:12px}.pp-correction-time{font-weight:800;margin-bottom:10px}.pp-correction-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pp-correction-btn{min-height:44px;border-radius:12px;padding:9px 10px;font-size:13px;font-weight:700}.pp-correction-green{background:var(--teal-bg);color:var(--teal)}.pp-correction-yellow{background:var(--gold-bg);color:#7a5a20}.pp-correction-red{background:var(--red-bg);color:var(--red)}.pp-correction-neutral{background:var(--cream2);color:var(--ink2)}.pp-correction-remove{background:#fff;color:var(--red);border:1.5px solid rgba(192,57,43,.25);grid-column:1/-1}.pp-correction-close{width:100%;min-height:48px;border-radius:14px;background:var(--ink);color:#fff;font-weight:800;margin-top:4px}";
    document.head.appendChild(style);
  }

  function todaysTimingStats(){
    var result={documented:0,total:0,onTime:0,rated:0};
    if(!global.S||!global.PillPlanAdherenceV2) return result;
    var date=new Date().toISOString().split("T")[0];
    for(var i=0;i<global.S.meds.length;i++){ var med=global.S.meds[i]; for(var j=0;j<med.times.length;j++){ result.total++; var entry=getEntry(global.S.taken,date,med.id,med.times[j]); var n=api().normalizeEntry(entry); if(!n.taken) continue; result.documented++; if(n.tier===api().TIER.GREEN){result.onTime++;result.rated++;} else if(n.tier===api().TIER.YELLOW||n.tier===api().TIER.RED){result.rated++;} } }
    return result;
  }

  function setCorrectedEntry(medId,date,time,tier){
    if(!global.S) return;
    global.S.taken[key(date,medId,time)]={taken:true,takenAt:null,tier:tier,legacy:false,corrected:true,correctedAt:new Date().toISOString()};
    if(typeof global.persist==="function") global.persist();
  }
  function removeCorrectedEntry(medId,date,time){
    if(!global.S) return;
    delete global.S.taken[key(date,medId,time)];
    if(typeof global.persist==="function") global.persist();
  }
  function findMedication(id){
    if(!global.S) return null;
    for(var i=0;i<global.S.meds.length;i++) if(String(global.S.meds[i].id)===String(id)) return global.S.meds[i];
    return null;
  }
  function openCorrectionDialog(medId,date){
    var med=findMedication(medId); if(!med) return;
    closeCorrectionDialog();
    var de=(global.S&&global.S.lang)==="de";
    var wrap=document.createElement("div"); wrap.className="pp-correction-backdrop"; wrap.id="pp-correction-dialog";
    var html='<div class="pp-correction-sheet" role="dialog" aria-modal="true" aria-label="'+(de?'Einnahme korrigieren':'Correct intake')+'">';
    html+='<div class="pp-correction-title">'+(de?'Einnahme korrigieren':'Correct intake')+'</div>';
    html+='<div class="pp-correction-sub">'+med.name+' · '+date+'<br>'+(de?'Bereits dokumentierte Einträge sind geschützt. Änderungen werden nur hier bewusst vorgenommen.':'Documented entries are protected. Changes are only made deliberately here.')+'</div>';
    for(var i=0;i<med.times.length;i++){
      var time=med.times[i]; var entry=getEntry(global.S.taken,date,med.id,time); var n=api().normalizeEntry(entry);
      html+='<div class="pp-correction-dose"><div class="pp-correction-time">'+time+(n.taken?' · '+(de?'dokumentiert':'documented'):'')+'</div><div class="pp-correction-actions">';
      html+='<button class="pp-correction-btn pp-correction-green" data-correct-tier="green" data-med="'+med.id+'" data-date="'+date+'" data-time="'+time+'">'+(de?'Pünktlich':'On time')+'</button>';
      html+='<button class="pp-correction-btn pp-correction-yellow" data-correct-tier="yellow" data-med="'+med.id+'" data-date="'+date+'" data-time="'+time+'">'+(de?'30–44 Min. verspätet':'30–44 min late')+'</button>';
      html+='<button class="pp-correction-btn pp-correction-red" data-correct-tier="red" data-med="'+med.id+'" data-date="'+date+'" data-time="'+time+'">'+(de?'45+ Min. verspätet':'45+ min late')+'</button>';
      html+='<button class="pp-correction-btn pp-correction-neutral" data-correct-tier="unrated" data-med="'+med.id+'" data-date="'+date+'" data-time="'+time+'">'+(de?'Nachgetragen · Zeit unbekannt':'Added later · time unknown')+'</button>';
      if(n.taken) html+='<button class="pp-correction-btn pp-correction-remove" data-correct-remove="1" data-med="'+med.id+'" data-date="'+date+'" data-time="'+time+'">'+(de?'Dokumentation entfernen':'Remove documentation')+'</button>';
      html+='</div></div>';
    }
    html+='<button class="pp-correction-close" data-correct-close="1">'+(de?'Abbrechen':'Cancel')+'</button></div>';
    wrap.innerHTML=html; document.body.appendChild(wrap);
  }
  function closeCorrectionDialog(){ var el=document.getElementById("pp-correction-dialog"); if(el) el.remove(); }

  function installProtectedHistoryHandler(){
    if(global.__pillplanProtectedHistoryV1) return; global.__pillplanProtectedHistoryV1=true;
    document.addEventListener("click",function(e){
      var tierBtn=e.target.closest("[data-correct-tier]");
      if(tierBtn){ e.preventDefault(); e.stopImmediatePropagation(); setCorrectedEntry(tierBtn.dataset.med,tierBtn.dataset.date,tierBtn.dataset.time,tierBtn.dataset.correctTier); closeCorrectionDialog(); if(typeof global.showToast==="function") global.showToast((global.S&&global.S.lang)==="de"?"Korrektur gespeichert ✓":"Correction saved ✓"); if(typeof global.render==="function") global.render(); return; }
      var rem=e.target.closest("[data-correct-remove]");
      if(rem){ e.preventDefault(); e.stopImmediatePropagation(); if(confirm((global.S&&global.S.lang)==="de"?"Dokumentation für diese Einnahme wirklich entfernen?":"Really remove this documentation?")){ removeCorrectedEntry(rem.dataset.med,rem.dataset.date,rem.dataset.time); closeCorrectionDialog(); if(typeof global.render==="function") global.render(); } return; }
      if(e.target.closest("[data-correct-close]")){ e.preventDefault(); e.stopImmediatePropagation(); closeCorrectionDialog(); return; }
      var cell=e.target.closest("[data-toggle-day]");
      if(!cell) return;
      var protectedCell=cell.classList.contains("done")||cell.classList.contains("tier-yellow")||cell.classList.contains("tier-red")||cell.classList.contains("unrated")||cell.classList.contains("partial");
      if(protectedCell){ e.preventDefault(); e.stopImmediatePropagation(); openCorrectionDialog(cell.dataset.toggleDay,cell.dataset.date); }
    },true);
  }

  function polishRenderedUi(){
    injectV12Styles(); document.title="PillPlan 1.2"; var copy=langCopy();
    var stats=todaysTimingStats(),title=document.querySelector(".progress-title"),sub=document.querySelector(".progress-sub");
    if(title) title.textContent=copy.documentation;
    if(sub){ sub.textContent=stats.documented+" / "+stats.total+" "+((global.S&&global.S.lang)==="de"?"dokumentiert":"documented"); var old=document.querySelector(".pp-quality-line"); if(old) old.remove(); if(stats.documented>0){ var quality=document.createElement("div"); quality.className="pp-quality-line"; var pct=stats.rated?Math.round(stats.onTime/stats.rated*100):null; quality.textContent=copy.punctuality+": "+(pct===null?"–":pct+"%"); sub.insertAdjacentElement("afterend",quality); } }
    document.querySelectorAll(".dose-card").forEach(function(card){ var button=card.querySelector(".check-btn"),icon=card.querySelector(".dose-icon"); if(button&&button.getAttribute("aria-pressed")==="true"&&icon){icon.textContent="✓";icon.classList.add("pp-documented");} });
    document.querySelectorAll(".day-ico").forEach(function(el){ if(el.textContent.trim()==="!!") el.textContent="●"; });
    document.querySelectorAll(".status-swatch.red,.status-swatch.yellow").forEach(function(el){ if(el.textContent.trim()==="!") el.textContent="●"; });
    document.querySelectorAll(".day-cell.done,.day-cell.tier-yellow,.day-cell.tier-red,.day-cell.unrated,.day-cell.partial").forEach(function(el){ el.classList.add("pp-protected"); el.setAttribute("title",(global.S&&global.S.lang)==="de"?"Dokumentiert – tippen zum bewussten Korrigieren":"Documented – tap to correct deliberately"); });
    document.querySelectorAll(".settings-row-sub").forEach(function(el){ if(el.textContent.trim()==="Daily reminders") el.textContent=copy.daily; if(el.textContent.trim()==="Cannot be undone") el.textContent=copy.undo; });
    var reset=document.getElementById("reset-btn"); if(reset) reset.textContent=copy.deleteBtn;
    document.querySelectorAll(".mhd-banner").forEach(function(el){ var txt=el.textContent||""; if(txt.indexOf("Mindesthaltbarkeitsdatum")>=0||txt.indexOf("Verfallsdatum")>=0||txt.indexOf("expiry date")>=0||txt.indexOf("Expiry date")>=0) el.remove(); });
    document.querySelectorAll("div").forEach(function(el){ if(el.children.length===0&&el.textContent.trim()==="PillPlan v1.1"){el.textContent="PillPlan v1.2";el.classList.add("pp-version-note");} });
  }

  function installRuntimeGuards(){
    if(global.__pillplanRuntimeGuardsV12) return; global.__pillplanRuntimeGuardsV12=true; installProtectedHistoryHandler();
    if(typeof global.buildSettings==="function"){ var baseSettings=global.buildSettings; global.buildSettings=function(ov){ var html=baseSettings(ov),copy=langCopy(); return html.replace("Daily reminders",copy.daily).replace("Cannot be undone",copy.undo); }; }
    if(typeof global.render==="function"){ var baseRender=global.render; global.render=function(){ if(global.S&&global.PillPlanMedicationScheduleV1){ var ds=new Date().toISOString().split("T")[0]; for(var i=0;i<global.S.meds.length;i++){ var times=global.PillPlanMedicationScheduleV1.timesForDate(global.S.meds[i],ds); global.S.meds[i].times=times.slice(); } } var result=baseRender(); polishRenderedUi(); return result; }; global.render(); }
  }

  function loadStatisticsV2(){ if(global.PillPlanStatisticsV2||document.querySelector('script[data-pillplan-stats-v2]')) return; var s=document.createElement("script"); s.src="statistics-v2.js"; s.async=false; s.setAttribute("data-pillplan-stats-v2","1"); document.head.appendChild(s); }
  function loadMedicationScheduleV1(){ if(global.PillPlanMedicationScheduleV1){installRuntimeGuards();loadStatisticsV2();return;} if(document.querySelector('script[data-pillplan-med-schedule-v1]')) return; var s=document.createElement("script"); s.src="medication-schedule-v1.js"; s.async=false; s.setAttribute("data-pillplan-med-schedule-v1","1"); s.onload=function(){installRuntimeGuards();loadStatisticsV2();}; document.head.appendChild(s); }

  global.PillPlanAdherenceAdapter={key:key,getEntry:getEntry,isDone:isDone,markTakenNow:markTakenNow,markRetroactive:markRetroactive,undo:undo,entryPresentation:entryPresentation,medicationDaySummary:medicationDaySummary,dayPresentation:dayPresentation,applyProductTerminology:applyProductTerminology,polishRenderedUi:polishRenderedUi,openCorrectionDialog:openCorrectionDialog};
  if(typeof document!=="undefined") document.addEventListener("DOMContentLoaded",function(){ applyProductTerminology(); loadMedicationScheduleV1(); },{once:true});
})(typeof window!=="undefined"?window:globalThis);
