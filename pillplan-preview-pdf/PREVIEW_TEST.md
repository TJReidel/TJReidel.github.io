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

The preview copy intentionally disables Service Worker registration so it cannot interfere with the productive `/pillplan-next/` cache or scope.

## Test focus
1. App starts without fatal error.
2. Existing medication data can be created in the preview IndexedDB.
3. Settings -> Medikamentenbericht -> Bericht erstellen.
4. 7 / 14 / 21 / 30 day periods render.
5. Medication list, dose, times, doctor instructions and MHD display when present.
6. Green / Yellow / Red / backfilled / open states match the existing event model.
7. Print opens the browser/system print dialog.
8. On iPhone, “Drucken” can be converted/saved as PDF.
9. Today / Plan / Add / Settings remain functional.
10. No automatic external data transfer occurs.

## Important
This preview is a browser test surface only. It is not the production release and must not be merged to `main` before STABLE 1 and STABLE 2 pass.
