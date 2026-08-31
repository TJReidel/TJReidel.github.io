// PillPlan Statistics v2 smoke tests
(function () {
  "use strict";
  function assert(name, condition) {
    if (!condition) throw new Error("FAIL: " + name);
    if (typeof console !== "undefined") console.log("PASS:", name);
  }

  var A = globalThis.PillPlanAdherenceV2;
  var S2 = globalThis.PillPlanStatisticsV2;
  if (!A || !S2) throw new Error("Load adherence-v2.js and statistics-v2.js first");

  var date = "2026-08-31";
  var meds = [{id:1,times:["08:00","20:00"]},{id:2,times:["09:00"]}];
  var map = {};
  map[date + "_1_08:00"] = {taken:true,takenAt:"2026-08-31T06:10:00.000Z",tier:"green",legacy:false};
  map[date + "_1_20:00"] = {taken:true,takenAt:"2026-08-31T18:35:00.000Z",tier:"yellow",legacy:false};
  // third planned dose remains undocumented

  var x = S2.breakdown(map, meds, [date]);
  assert("counts total planned doses", x.total === 3);
  assert("counts documented doses", x.documented === 2);
  assert("counts green", x.green === 1);
  assert("counts yellow", x.yellow === 1);
  assert("counts undocumented", x.undocumented === 1);
  assert("documented percentage is rounded", x.pct === 67);
  assert("partial documentation uses supportive text", S2.motivation(x,"de") === "Gut, dass Sie Ihre Einnahmen dokumentieren.");

  var legacy = {};
  legacy[date + "_1_08:00"] = true;
  var y = S2.breakdown(legacy,[{id:1,times:["08:00"]}],[date]);
  assert("legacy entry is unrated", y.unrated === 1 && y.documented === 1);

  var empty = S2.breakdown({},[{id:1,times:["08:00"]}],[date]);
  assert("empty documentation gets neutral encouragement", S2.motivation(empty,"de") === "Jeder Eintrag hilft Ihnen, den Überblick zu behalten.");
})();