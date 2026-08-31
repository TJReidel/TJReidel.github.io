// PillPlan Adherence History v2 - lightweight boundary tests
// Run after adherence-v2.js in a browser console or test page.
(function () {
  "use strict";

  var A = (typeof window !== "undefined" ? window : globalThis).PillPlanAdherenceV2;
  if (!A) throw new Error("PillPlanAdherenceV2 not loaded");

  function assertEqual(actual, expected, label) {
    if (actual !== expected) {
      throw new Error(label + ": expected " + expected + ", got " + actual);
    }
  }

  assertEqual(A.tierFromDelayMinutes(-10), "green", "early intake remains green");
  assertEqual(A.tierFromDelayMinutes(0), "green", "on-time intake");
  assertEqual(A.tierFromDelayMinutes(29), "green", "29 minutes");
  assertEqual(A.tierFromDelayMinutes(30), "yellow", "30 minute boundary");
  assertEqual(A.tierFromDelayMinutes(44), "yellow", "44 minutes");
  assertEqual(A.tierFromDelayMinutes(45), "red", "45 minute boundary");
  assertEqual(A.tierFromDelayMinutes(120), "red", "very late intake");

  var legacy = A.normalizeEntry(true);
  assertEqual(legacy.taken, true, "legacy taken state");
  assertEqual(legacy.tier, "unrated", "legacy entry is not invented as green");

  var retro = A.createRetroactiveEntry();
  assertEqual(retro.taken, true, "retroactive taken state");
  assertEqual(retro.tier, "unrated", "retroactive entry stays unrated");

  var summary = A.daySummary([
    {taken:true,tier:"green"},
    {taken:true,tier:"yellow"},
    {taken:true,tier:"red"}
  ]);
  assertEqual(summary.status, "complete", "complete day summary");
  assertEqual(summary.tier, "red", "worst completed tier wins for calendar summary");

  var partial = A.daySummary([
    {taken:true,tier:"green"},
    false
  ]);
  assertEqual(partial.status, "partial", "partial day summary");

  console.log("PillPlan Adherence v2 tests: OK");
})();
