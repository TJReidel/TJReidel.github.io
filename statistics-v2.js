// PillPlan Statistics v2
// Patient-facing retrospective: informative, supportive, never judgmental.
(function (global) {
  "use strict";

  function api() {
    if (!global.PillPlanAdherenceV2) throw new Error("PillPlanAdherenceV2 is required");
    return global.PillPlanAdherenceV2;
  }
  function intakeKey(date, medicationId, scheduledTime) { return date + "_" + medicationId + "_" + scheduledTime; }
  function timesForDate(med, date) { return global.medicationTimesForDate ? global.medicationTimesForDate(med, date) : med.times; }

  function breakdown(takenMap, medications, days) {
    var out={total:0,documented:0,pct:0,green:0,yellow:0,red:0,unrated:0,undocumented:0};
    var map=takenMap||{},meds=medications||[],ds=days||[];
    for(var m=0;m<meds.length;m++){
      var med=meds[m];
      for(var d=0;d<ds.length;d++){
        var times=timesForDate(med,ds[d]);
        for(var t=0;t<times.length;t++){
          out.total++;
          var n=api().normalizeEntry(map[intakeKey(ds[d],med.id,times[t])]);
          if(!n.taken){out.undocumented++;continue;}
          out.documented++;
          if(n.tier===api().TIER.GREEN)out.green++; else if(n.tier===api().TIER.YELLOW)out.yellow++; else if(n.tier===api().TIER.RED)out.red++; else out.unrated++;
        }
      }
    }
    out.pct=out.total?Math.round(out.documented/out.total*100):0;
    return out;
  }

  function motivation(stats,lang){
    var de=lang==="de";
    if(!stats||stats.total===0||stats.documented===0) return de?"Jeder Eintrag hilft Ihnen, den Überblick zu behalten.":"Every entry helps you keep an overview.";
    if(stats.documented===stats.total) return de?"Alles dokumentiert – gut im Blick.":"Everything documented – well in view.";
    return de?"Gut, dass Sie Ihre Einnahmen dokumentieren.":"Good that you are documenting your doses.";
  }

  var LABELS={
    de:{green:"Pünktlich",yellow:"30–44 Min. verspätet",red:"Stark verspätet",unrated:"Nachgetragen",undocumented:"Nicht dokumentiert"},
    en:{green:"On time",yellow:"30–44 min late",red:"Very late",unrated:"Added later",undocumented:"Not documented"},
    fr:{green:"À l’heure",yellow:"30–44 min de retard",red:"Très en retard",unrated:"Ajouté après",undocumented:"Non documenté"},
    es:{green:"A tiempo",yellow:"30–44 min tarde",red:"Muy atrasado",unrated:"Añadido después",undocumented:"No documentado"},
    it:{green:"Puntuale",yellow:"30–44 min in ritardo",red:"Molto in ritardo",unrated:"Aggiunto dopo",undocumented:"Non documentato"},
    tr:{green:"Zamanında",yellow:"30–44 dk gecikmiş",red:"Çok gecikmiş",unrated:"Sonradan eklendi",undocumented:"Belgelenmedi"},
    ar:{green:"في الوقت",yellow:"متأخر 30–44 دقيقة",red:"متأخر جدًا",unrated:"أضيف لاحقًا",undocumented:"غير موثق"},
    ru:{green:"Вовремя",yellow:"Опоздание 30–44 мин",red:"Сильно задержано",unrated:"Добавлено позже",undocumented:"Не документировано"},
    pt:{green:"No horário",yellow:"30–44 min atrasado",red:"Muito atrasado",unrated:"Adicionado depois",undocumented:"Não documentado"}
  };

  function swatch(kind){
    var styles={green:"background:var(--teal);color:#fff",yellow:"background:#d7b46a;color:var(--ink)",red:"background:#c94a3b;color:#fff",unrated:"background:#ece9e4;color:#2f2c29;border:1px solid #8a847d",undocumented:"background:#fff;color:var(--ink2);border:1px solid var(--cream2)"};
    var icon=kind==="green"||kind==="unrated"?"✓":kind==="undocumented"?"○":"!";
    return '<span aria-hidden="true" style="width:24px;height:24px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0;'+styles[kind]+'">'+icon+'</span>';
  }

  function enhance(){
    if(!global.S||!global.getPastDays)return;
    var titleText=typeof global.tr==="function"?global.tr("statsTitle"):null,sections=document.querySelectorAll(".settings-section"),section=null;
    for(var i=0;i<sections.length;i++){var title=sections[i].querySelector(".settings-title");if(title&&(!titleText||title.textContent.trim()===titleText)){section=sections[i];break;}}
    if(!section||section.dataset.statsV2==="1")return;
    var card=section.querySelector(".settings-card");if(!card)return;
    var stats=breakdown(global.S.taken,global.S.meds,global.getPastDays(global.S.period)),labels=LABELS[global.S.lang]||LABELS.en;
    var rows=[["green",labels.green,stats.green],["yellow",labels.yellow,stats.yellow],["red",labels.red,stats.red],["unrated",labels.unrated,stats.unrated],["undocumented",labels.undocumented,stats.undocumented]];
    var block=document.createElement("div");block.setAttribute("data-statistics-v2","1");
    block.innerHTML='<div style="padding:13px 16px;border-top:1px solid var(--cream2);font-size:14px;line-height:1.45;color:var(--ink2)">'+motivation(stats,global.S.lang)+'</div>';
    for(var r=0;r<rows.length;r++) block.innerHTML+='<div class="settings-row" style="min-height:50px"><div style="display:flex;align-items:center;gap:10px">'+swatch(rows[r][0])+'<div class="settings-row-label" style="font-size:14px">'+rows[r][1]+'</div></div><div style="font-size:18px;font-weight:800;color:var(--ink2)">'+rows[r][2]+'</div></div>';
    var firstRow=card.querySelector(".settings-row");if(firstRow&&firstRow.nextSibling)card.insertBefore(block,firstRow.nextSibling);else card.appendChild(block);section.dataset.statsV2="1";
  }

  function init(){
    enhance();
    var app=document.getElementById("app");
    if(app&&typeof MutationObserver!=="undefined") new MutationObserver(function(){enhance();}).observe(app,{childList:true,subtree:true});
  }

  global.PillPlanStatisticsV2={breakdown:breakdown,motivation:motivation,enhance:enhance};
  if(typeof document!=="undefined"){
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
    else init();
  }
})(typeof window!=="undefined"?window:globalThis);
