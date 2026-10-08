# PillPlan PDF Report – Preview Test Path

Status: PREVIEW READY / NOT PRODUCTION

## Purpose
Isolated browser test of the medication report feature without changing `main` or the productive GitHub Pages path `/pillplan-next/`.

## Preview bundle
Path in this branch:
`/pillplan-preview-pdf/`

Files:
- index.html
- core-v5.js
- design-master-v4.css
- design-master.css

The preview uses its own IndexedDB `pillplan-preview-pdf-db` and separate language/time-zone localStorage keys. Service Worker registration is disabled. It does not modify production data, settings or cache.

The isolated preview starts empty. Use test medication data, or explicitly import a production backup via Settings. Existing production data remain in `pillplan-next-db`; no automatic migration or clearing occurs.

## Test focus
1. App starts without fatal error.
2. Existing medication data can be created in the preview IndexedDB.
3. Settings -> Medikamentenbericht -> Bericht erstellen -> Zeitraum -> Vorschau -> Drucken / PDF.
4. 7 / 14 / 21 / 30 day periods render.
5. Medication list, dose, times, doctor instructions and MHD display when present.
6. Green / Yellow / Red / backfilled / open states match the existing event model.
7. There is no separate Settings print path; report output is reached only through Drucken / PDF inside the report.
8. On iPhone, “Drucken / PDF” opens the print-optimised output and can be printed or converted/saved/shared as PDF.
9. Today / Plan / Add / Settings remain functional.
10. No automatic external data transfer occurs.

## Important
This preview is a browser test surface only. It is not the production release and must not be merged to `main` before STABLE 1 and STABLE 2 pass.


## Consolidation check
- Preview and print/PDF must use the same `buildMedicationReport()` data model.
- Preview and print/PDF must use the same `reportHTML()` renderer.
- No duplicate report calculations or separate status logic.
