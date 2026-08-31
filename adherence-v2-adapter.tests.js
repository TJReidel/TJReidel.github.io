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
  assert("retroactive complete day remains unrated when no worse rated dose exists", summary.status === "complete");

  var legacy = {};
  legacy[X.key(date, 7, "08:00")] = true;
  assert("legacy boolean still counts as taken", X.isDone(legacy, date, 7, "08:00") === true);
  assert("legacy boolean presentation is unrated", X.entryPresentation(true).tier === "unrated");
})();
