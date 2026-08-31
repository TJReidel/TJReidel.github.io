// PillPlan Adherence History v2 - adapter smoke tests
(function () {
  "use strict";

  function assert(name, condition) {
    if (!condition) throw new Error("FAIL: " + name);
    if (typeof console !== "undefined") console.log("PASS:", name);
  }

  var A = globalThis.PillPlanAdherenceV2;
  var X = globalThis.PillPlanAdherenceAdapter;
  if (!A || !X) throw new Error("Load adherence-v2.js and adherence-v2-adapter.js first");

  var map = {};
  var date = "2026-08-31";
  var med = { id: 7, times: ["08:00", "20:00"] };

  X.markTakenNow(map, date, 7, "08:00", new Date("2026-08-31T08:29:00+02:00"));
  assert("29 min late is green", X.getEntry(map, date, 7, "08:00").tier === A.TIER.GREEN);

  X.markTakenNow(map, date, 7, "20:00", new Date("2026-08-31T20:30:00+02:00"));
  assert("30 min late is yellow", X.getEntry(map, date, 7, "20:00").tier === A.TIER.YELLOW);

  var summary = X.medicationDaySummary(map, med, date);
  assert("complete mixed green/yellow day uses yellow", summary.status === "complete" && summary.tier === A.TIER.YELLOW);
  assert("calendar presentation is yellow", X.dayPresentation(summary).css === "tier-yellow");

  X.undo(map, date, 7, "20:00");
  summary = X.medicationDaySummary(map, med, date);
  assert("incomplete day remains partial, never green", summary.status === "partial" && X.dayPresentation(summary).css === "partial");

  X.markRetroactive(map, date, 7, "20:00");
  summary = X.medicationDaySummary(map, med, date);
  assert("green plus unrated remains unrated", summary.status === "complete" && summary.tier === A.TIER.UNRATED);
  assert("calendar presentation remains unrated", X.dayPresentation(summary).css === "unrated");

  var legacy = {};
  legacy[X.key(date, 7, "08:00")] = true;
  assert("legacy boolean still counts as taken", X.isDone(legacy, date, 7, "08:00") === true);
  assert("legacy boolean presentation is unrated", X.entryPresentation(true).tier === "unrated");

  globalThis.T = {
    de: { overdue:"Verpasst", total14:"Compliance", shareTitle:"Mein Medikamentenplan", shareText:"Mein Medikamentenplan (PillPlan):" },
    en: { overdue:"Overdue", total14:"Compliance", shareTitle:"My medication plan", shareText:"My medication plan (PillPlan):" }
  };
  assert("product terminology patch applies", X.applyProductTerminology() === true);
  assert("German overdue wording becomes precise", globalThis.T.de.overdue === "Stark verspätet");
  assert("German stats wording becomes documentation-based", globalThis.T.de.total14 === "Dokumentierte Einnahmen");
  assert("German share title becomes documentation-based", globalThis.T.de.shareTitle === "Meine dokumentierten Einnahmen");
  assert("English stats wording becomes documentation-based", globalThis.T.en.total14 === "Documented doses");
})();
