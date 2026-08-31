# PillPlan Baseline Audit — 2026-08-31

## Scope
Read-only technical validation of the current production baseline before any feature change.

Checked areas:
- traffic-light timing logic
- medication status persistence
- calendar period logic
- PWA/service worker versioning
- reminder architecture

## Findings

### 1. Traffic-light thresholds — PASS
Current `doseTier(time)` implementation uses:
- `< 30 min` => green
- `30–44 min` => yellow
- `>= 45 min` => red

This matches the intended threshold model.

### 2. Historical adherence color — GAP / HIGH PRIORITY
Current `taken` storage is effectively boolean per medication/date/time key.

Consequence:
- once a dose is marked as taken, the UI treats it as `done` and displays green
- the actual confirmation time is not persisted
- therefore the system cannot later distinguish whether a completed dose was taken on time, 30+ minutes late, or 45+ minutes late
- the calendar can show done/partial/not done, but not a true historical green/yellow/red adherence trail

Required architectural change:
- persist an actual confirmation timestamp for each dose instead of only truthy state
- derive adherence tier from scheduled time vs. confirmation time
- keep backward compatibility for existing boolean entries

### 3. Calendar period selector — PASS WITH LIMITATION
Current periods are implemented as 7 / 14 / 21 / 30 days and are generated with `getPastDaysAsc(S.period)`.

This provides complete backward-looking 1/2/3-week and 1-month windows including the current day.

Limitation:
- calendar currently visualizes completion state only (`done`, `partial`, `past`)
- it does not yet visualize historical adherence tier green/yellow/red

### 4. Reminder architecture — KNOWN PWA LIMITATION
Notifications are scheduled through in-page JavaScript timers when the app renders.

Consequence:
- reliable background reminders cannot be guaranteed when the browser/PWA is suspended or closed
- service worker contains push notification handling, but there is no external push backend/scheduler in the current architecture

This matches the known product limitation and should remain explicitly documented until a native/background-capable implementation exists.

### 5. Service worker cache version — CLEANUP NEEDED
`sw.js` currently uses cache identifier `pillplan-v3` while the UI title reports PillPlan 1.1.

This is not an immediate functional defect, but version nomenclature is inconsistent and should be normalized with the next production release to avoid future cache/debug ambiguity.

## Priority Decision

P1 — Historical adherence persistence
Store confirmation timestamp and preserve green/yellow/red after the dose is taken.

P2 — Calendar visualization
Use persisted adherence tier to show the historical traffic-light trail in 7/14/21/30-day views.

P3 — Version/cache cleanup
Normalize app/release/cache version identifiers.

P4 — Reminder evolution
Keep current PWA behavior documented; address reliable background reminders only with a technically suitable architecture.

## Governance
No productive code was changed in this audit.
Any implementation must use a dedicated feature branch, diff review, and controlled merge into `main`.
