// PillPlan Adherence History v2 - application adapter
// This file contains the integration logic that index.html will call.
// It deliberately has no automatic DOM side effects.

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

    if (n.tier === api().TIER.RED) {
      return { tier: "red", css: "overdue", icon: "●", labelKey: "takenRed" };
    }
    if (n.tier === api().TIER.YELLOW) {
      return { tier: "yellow", css: "yellow", icon: "●", labelKey: "takenYellow" };
    }
    if (n.tier === api().TIER.GREEN) {
      return { tier: "green", css: "done", icon: "✓", labelKey: "takenGreen" };
    }
    return { tier: "unrated", css: "unrated", icon: "✓", labelKey: "takenUnrated" };
  }

  function medicationDaySummary(takenMap, medication, date) {
    var entries = [];
    for (var i = 0; i < medication.times.length; i++) {
      entries.push(getEntry(takenMap, date, medication.id, medication.times[i]));
    }
    return api().daySummary(entries);
  }

  function dayPresentation(summary) {
    if (!summary || summary.status === "none") {
      return { css: "", icon: "·", labelKey: "dayNone" };
    }
    if (summary.status === "partial") {
      // Completeness outranks color. A partially completed day must never appear green.
      return { css: "partial", icon: "◑", labelKey: "dayPartial" };
    }

    if (summary.tier === api().TIER.RED) {
      return { css: "tier-red", icon: "!", labelKey: "dayRed" };
    }
    if (summary.tier === api().TIER.YELLOW) {
      return { css: "tier-yellow", icon: "!", labelKey: "dayYellow" };
    }
    if (summary.tier === api().TIER.GREEN) {
      return { css: "done", icon: "✓", labelKey: "dayGreen" };
    }
    return { css: "unrated", icon: "✓", labelKey: "dayUnrated" };
  }

  global.PillPlanAdherenceAdapter = {
    key: key,
    getEntry: getEntry,
    isDone: isDone,
    markTakenNow: markTakenNow,
    markRetroactive: markRetroactive,
    undo: undo,
    entryPresentation: entryPresentation,
    medicationDaySummary: medicationDaySummary,
    dayPresentation: dayPresentation
  };
})(typeof window !== "undefined" ? window : globalThis);
