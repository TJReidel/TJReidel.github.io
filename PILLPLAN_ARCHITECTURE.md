# PillPlan – Technical Architecture & Governance

Stand: 2026-08-31

## System of Record

- GitHub repository `TJReidel/TJReidel.github.io` is the single source of truth for productive PillPlan code.
- `main` is the production branch and must remain deployable.
- Google Drive contains product strategy, roadmap and documentation; it is not the source of truth for application code.
- ChatGPT is the leading working system for analysis, implementation and review.
- Claude is historical only and is not part of the active delivery workflow.

## Current production baseline

Baseline commit on `main` at transition start:
`4031b9a7a8ceee3753f4cad8ce4b3f2592b8c0cb`

Core production files:
- `index.html` – PillPlan application UI and logic
- `PillPlan_Feedback.html` – feedback form
- `manifest.json` – PWA manifest
- `sw.js` – service worker / caching / notification handling
- `icon.png`, `icon-512.png` – application icons

## Branching and change workflow

1. Never delete and re-upload `index.html` as the normal release process.
2. Every material change starts from the current `main` branch.
3. Changes are implemented on a dedicated branch, e.g.:
   - `feature/...` for product features
   - `fix/...` for bug fixes
   - `chore/...` for governance, documentation and maintenance
4. Review the diff before merge.
5. Merge into `main` only after the change is internally consistent and the existing behavior that should remain unchanged has been checked.
6. After merge, verify the production app on GitHub Pages.
7. If a regression occurs, revert to the last known-good commit rather than replacing the whole application file manually.

## Product architecture principles

- B2C-first product; the patient is the customer.
- Patient data sovereignty is a core product principle.
- No institutional dependency is part of the active business model.
- B2B / clinic / pharma white-label / DiGA paths are not active product architecture assumptions.
- Existing functionality is extended before introducing new structures.
- No duplicate implementation paths.

## Core UX logic

### Intake traffic-light system

The medication status must be recognizable without reading every row:
- Green: on-time intake
- Yellow: at least 30 minutes late
- Red: 45 minutes or more late

This traffic-light logic is a core PillPlan feature and should be reflected consistently in the Today view and historical plan/calendar views.

### Plan / calendar

The plan must support a meaningful historical overview rather than only the current day. The intended user views are:
- 1 week
- 2 weeks
- 3 weeks
- 1 month

Historical intake state should remain visible to support self-control and adherence understanding.

## Release governance

Before any production merge, check at minimum:
- existing medication data handling still works
- Today view renders correctly
- traffic-light thresholds behave as specified
- calendar history remains visible
- adding/editing medication still works
- language handling still works
- service worker / cache version is coherent with the deployed release
- no accidental deletion of feedback form, manifest, service worker or icons

## Next technical actions

1. Validate the exact implementation of the 30/45-minute traffic-light thresholds in the current code.
2. Validate whether the calendar persists and visualizes historical traffic-light state correctly.
3. Standardize release/version naming across `index.html`, `manifest.json` and `sw.js` cache identifiers.
4. Replace full-file delete/re-upload deployments with branch + diff + merge workflow.
