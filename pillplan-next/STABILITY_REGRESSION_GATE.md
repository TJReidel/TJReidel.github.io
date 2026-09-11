# PillPlan Stability Regression Gate

Purpose: PillPlan exists to strengthen medication adherence. A release must never compromise medication plan visibility, intake documentation, or longitudinal history.

## Release gate — all must pass

1. App startup
   - Home-Screen PWA opens without network.
   - Safari opens the same medication data.
   - No reset or re-entry required after update.

2. Medication plan
   - Existing medications, dose, doctor instructions and scheduled times remain unchanged after update.
   - Multiple daily intake times remain intact.

3. Today documentation
   - Open intake can be marked taken.
   - Status colour matches timing tier.
   - Backfilled/unknown-time intake stays neutral, not green.

4. Undo / correction
   - Existing documented intake cannot disappear with an accidental second tap.
   - Undo/correction creates a new event; historical event is not hard-deleted.
   - Optional correction note is retained in the event record.

5. Historical plan
   - Past schedule remains based on scheduleHistory.
   - Editing today's/future schedule never rewrites previous days.

6. Therapy end
   - Ending a medication preserves all previous history.
   - Medication is no longer scheduled after the effective end date.

7. Backup / restore
   - Export contains meds, events, meta, language and confirmed plan time zone.
   - Import reproduces the same medication plan and history.
   - Older supported backups remain importable.

8. Language
   - Language switch does not change or delete data.
   - Arabic changes direction to RTL.
   - Core medication workflow remains usable even if a translation falls back.

9. Time zone
   - Device time-zone change is detected.
   - PillPlan does not automatically shift prescribed local intake times.
   - New events contain the device and/or confirmed plan time-zone context.

10. Optional browser capabilities
   - Voice unavailable: manual medication entry still works.
   - Share unavailable: core app still works.
   - Notifications unavailable/denied: core app still works.

11. Service-worker update
   - New release installs atomically only when all required assets are available.
   - Previous known-good cache remains available as rollback protection.
   - No application-data deletion is tied to cache activation.

12. Cross-version safety
   - OS/browser update must not be detected by version string as a functional dependency.
   - Capability detection is used for optional APIs.
   - IndexedDB schema changes require explicit migration and validation before production activation.

## Production rule

A new runtime may be staged and cached before release, but `index.html` must continue loading the last known-good runtime until every gate above has passed. No release may require clearing Safari history/site data or deleting the Home-Screen app as a normal migration step.

## Release record — v24 single runtime

- Active production runtime: `core-v5.js`
- Runtime count in `index.html`: 1
- IndexedDB database name/version unchanged: `pillplan-next-db`, schema version 1
- No medication/event migration is tied to this release
- Previous known-good cache retained: `pillplan-next-v23-stability-stage`
- New atomic cache: `pillplan-next-v24-single-runtime`
- Optional APIs remain capability-detected and non-blocking
- Time-zone logic, correction history, edit workflow and voice enhancement are consolidated into the active runtime
- Legacy runtime files remain in the repository for forensic rollback/reference but are not loaded by production

### Final device smoke check

After first launch of v24, verify on the actual iPhone/Home-Screen PWA: existing medications visible, one intake can be documented, Plan opens, Settings opens, and app relaunches with the same data. This is an empirical device check; it must not require deleting the app, clearing Safari data, or re-entering medication data.
