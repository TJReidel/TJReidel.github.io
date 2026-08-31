// PillPlan Adherence History v2
// Pure helper layer. No side effects on load.
// Designed to remain compatible with legacy boolean entries in S.taken.

(function (global) {
  "use strict";

  var TIER = {
    GREEN: "green",
    YELLOW: "yellow",
    RED: "red",
    UNRATED: "unrated"
  };

  function parseScheduledMinutes(time) {
    var parts = String(time || "").split(":");
    if (parts.length !== 2) return null;
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  function tierFromDelayMinutes(delayMinutes) {
    if (!Number.isFinite(delayMinutes)) return TIER.UNRATED;
    if (delayMinutes < 30) return TIER.GREEN;
    if (delayMinutes < 45) return TIER.YELLOW;
    return TIER.RED;
  }

  function tierForTakenAt(scheduledTime, takenAtIso) {
    if (!takenAtIso) return TIER.UNRATED;
    var sched = parseScheduledMinutes(scheduledTime);
    if (sched === null) return TIER.UNRATED;

    var taken = new Date(takenAtIso);
    if (Number.isNaN(taken.getTime())) return TIER.UNRATED;

    var takenMinutes = taken.getHours() * 60 + taken.getMinutes();
    return tierFromDelayMinutes(takenMinutes - sched);
  }

  function normalizeEntry(entry) {
    // Backward compatibility: historical boolean true means taken, but timing is unknown.
    if (entry === true) {
      return { taken: true, takenAt: null, tier: TIER.UNRATED, legacy: true };
    }
    if (!entry) {
      return { taken: false, takenAt: null, tier: null, legacy: false };
    }
    if (typeof entry === "object") {
      var tier = entry.tier;
      if ([TIER.GREEN, TIER.YELLOW, TIER.RED, TIER.UNRATED].indexOf(tier) === -1) {
        tier = entry.takenAt ? TIER.UNRATED : TIER.UNRATED;
      }
      return {
        taken: entry.taken !== false,
        takenAt: entry.takenAt || null,
        tier: tier,
        legacy: !!entry.legacy
      };
    }
    return { taken: !!entry, takenAt: null, tier: TIER.UNRATED, legacy: true };
  }

  function createTimedEntry(scheduledTime, now) {
    var taken = now instanceof Date ? now : new Date();
    var iso = taken.toISOString();
    return {
      taken: true,
      takenAt: iso,
      tier: tierForTakenAt(scheduledTime, iso),
      legacy: false
    };
  }

  function createRetroactiveEntry() {
    // A past date may be marked as taken, but without an actual intake timestamp
    // PillPlan must not invent a green/yellow/red classification.
    return {
      taken: true,
      takenAt: null,
      tier: TIER.UNRATED,
      legacy: false
    };
  }

  function isTaken(entry) {
    return normalizeEntry(entry).taken;
  }

  function entryTier(entry) {
    var n = normalizeEntry(entry);
    return n.taken ? n.tier : null;
  }

  function worstTier(tiers) {
    var rank = {};
    rank[TIER.UNRATED] = 0;
    rank[TIER.GREEN] = 1;
    rank[TIER.YELLOW] = 2;
    rank[TIER.RED] = 3;

    var worst = null;
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      if (!t) continue;
      if (worst === null || rank[t] > rank[worst]) worst = t;
    }
    return worst;
  }

  function daySummary(entries) {
    if (!entries || !entries.length) return { status: "none", tier: null, taken: 0, total: 0 };

    var taken = 0;
    var tiers = [];
    for (var i = 0; i < entries.length; i++) {
      var n = normalizeEntry(entries[i]);
      if (n.taken) {
        taken++;
        tiers.push(n.tier);
      }
    }

    var status = taken === 0 ? "none" : taken === entries.length ? "complete" : "partial";
    return {
      status: status,
      tier: taken ? worstTier(tiers) : null,
      taken: taken,
      total: entries.length
    };
  }

  global.PillPlanAdherenceV2 = {
    TIER: TIER,
    parseScheduledMinutes: parseScheduledMinutes,
    tierFromDelayMinutes: tierFromDelayMinutes,
    tierForTakenAt: tierForTakenAt,
    normalizeEntry: normalizeEntry,
    createTimedEntry: createTimedEntry,
    createRetroactiveEntry: createRetroactiveEntry,
    isTaken: isTaken,
    entryTier: entryTier,
    worstTier: worstTier,
    daySummary: daySummary
  };
})(typeof window !== "undefined" ? window : globalThis);
