// PillPlan Adherence History v2 - application adapter
// Integration helpers used by index.html.
// Product terminology is normalized once after DOMContentLoaded so the UI
// describes only what PillPlan can actually infer from documented data.

(function (global) {
  "use strict";

  function api() {
    if (!global.PillPlanAdherenceV2) throw new Error("PillPlanAdherenceV2 is required");
    return global.PillPlanAdherenceV2;
  }

  function key(date, medicationId, scheduledTime) {
    return date + "_" + medicationId + "_" + scheduledTime;
  }

  function getEntry(takenMap, date, medicationId, scheduledTime) {
    return (takenMap || {})[key(date, medicationId, scheduledTime)];
  }

  function isDone(takenMap, date, medicationId, scheduledTime) {
    return api().isTaken(getEntry(takenMap, date, medicationId, scheduledTime));
  }

  function markTakenNow(takenMap, date, medicationId, scheduledTime, now) {
    var map = takenMap || {};
    map[key(date, medicationId, scheduledTime)] = api().createTimedEntry(scheduledTime, now || new Date());
    return map[key(date, medicationId, scheduledTime)];
  }

  function markRetroactive(takenMap, date, medicationId, scheduledTime) {
    var map = takenMap || {};
    map[key(date, medicationId, scheduledTime)] = api().createRetroactiveEntry();
    return map[key(date, medicationId, scheduledTime)];
  }

  function undo(takenMap, date, medicationId, scheduledTime) {
    var map = takenMap || {};
    delete map[key(date, medicationId, scheduledTime)];
  }

  function entryPresentation(entry) {
    var n = api().normalizeEntry(entry);
    if (!n.taken) return { tier: null, css: "pending", icon: "○", labelKey: "pending" };

    if (n.tier === api().TIER.RED) return { tier: "red", css: "overdue", icon: "●", labelKey: "takenRed" };
    if (n.tier === api().TIER.YELLOW) return { tier: "yellow", css: "yellow", icon: "●", labelKey: "takenYellow" };
    if (n.tier === api().TIER.GREEN) return { tier: "green", css: "done", icon: "✓", labelKey: "takenGreen" };
    return { tier: "unrated", css: "unrated", icon: "✓", labelKey: "takenUnrated" };
  }

  function medicationDaySummary(takenMap, medication, date) {
    var entries = [];
    for (var i = 0; i < medication.times.length; i++) entries.push(getEntry(takenMap, date, medication.id, medication.times[i]));
    return api().daySummary(entries);
  }

  function dayPresentation(summary) {
    if (!summary || summary.status === "none") return { css: "", icon: "·", labelKey: "dayNone" };
    if (summary.status === "partial") return { css: "partial", icon: "◑", labelKey: "dayPartial" };
    if (summary.tier === api().TIER.RED) return { css: "tier-red", icon: "!", labelKey: "dayRed" };
    if (summary.tier === api().TIER.YELLOW) return { css: "tier-yellow", icon: "!", labelKey: "dayYellow" };
    if (summary.tier === api().TIER.GREEN) return { css: "done", icon: "✓", labelKey: "dayGreen" };
    return { css: "unrated", icon: "✓", labelKey: "dayUnrated" };
  }

  var PRODUCT_COPY_V1 = {
    de: {
      overdue:"Stark verspätet",
      total14:"Dokumentierte Einnahmen",
      shareTitle:"Meine dokumentierten Einnahmen",
      shareText:"Dokumentierte Einnahmen (PillPlan):",
      doses:"dokumentiert",
      allDoneMotivation:"Alles für heute dokumentiert.",
      allDoneSub:"Gut, dass Sie Ihre Einnahmen im Blick behalten."
    },
    en: { overdue:"Very late", total14:"Documented doses", shareTitle:"My documented doses", shareText:"Documented doses (PillPlan):" },
    fr: { overdue:"Très en retard", total14:"Prises documentées", shareTitle:"Mes prises documentées", shareText:"Prises documentées (PillPlan) :" },
    es: { overdue:"Muy atrasado", total14:"Tomas documentadas", shareTitle:"Mis tomas documentadas", shareText:"Tomas documentadas (PillPlan):" },
    it: { overdue:"Molto in ritardo", total14:"Assunzioni documentate", shareTitle:"Le mie assunzioni documentate", shareText:"Assunzioni documentate (PillPlan):" },
    tr: { overdue:"Çok gecikmiş", total14:"Belgelenen dozlar", shareTitle:"Belgelenen dozlarım", shareText:"Belgelenen dozlar (PillPlan):" },
    ar: { overdue:"متأخر جدًا", total14:"الجرعات الموثقة", shareTitle:"جرعاتي الموثقة", shareText:"الجرعات الموثقة (PillPlan):" },
    ru: { overdue:"Сильно задержано", total14:"Подтверждённые приёмы", shareTitle:"Мои подтверждённые приёмы", shareText:"Подтверждённые приёмы (PillPlan):" },
    pt: { overdue:"Muito atrasado", total14:"Doses documentadas", shareTitle:"Minhas doses documentadas", shareText:"Doses documentadas (PillPlan):" }
  };

  function applyProductTerminology() {
    if (!global.T) return false;
    var langs = Object.keys(PRODUCT_COPY_V1);
    for (var i = 0; i < langs.length; i++) {
      var lang = langs[i];
      if (!global.T[lang]) continue;
      var patch = PRODUCT_COPY_V1[lang];
      var keys = Object.keys(patch);
      for (var j = 0; j < keys.length; j++) global.T[lang][keys[j]] = patch[keys[j]];
    }
    return true;
  }

  function loadStatisticsV2() {
    if (global.PillPlanStatisticsV2 || document.querySelector('script[data-pillplan-stats-v2]')) return;
    var s = document.createElement("script");
    s.src = "statistics-v2.js";
    s.async = false;
    s.setAttribute("data-pillplan-stats-v2", "1");
    document.head.appendChild(s);
  }

  global.PillPlanAdherenceAdapter = {
    key:key, getEntry:getEntry, isDone:isDone, markTakenNow:markTakenNow,
    markRetroactive:markRetroactive, undo:undo, entryPresentation:entryPresentation,
    medicationDaySummary:medicationDaySummary, dayPresentation:dayPresentation,
    applyProductTerminology:applyProductTerminology
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      if (applyProductTerminology() && typeof global.render === "function") global.render();
      loadStatisticsV2();
    }, { once:true });
  }
})(typeof window !== "undefined" ? window : globalThis);
