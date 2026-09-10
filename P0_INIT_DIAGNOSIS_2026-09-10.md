# PillPlan P0 – Initialisierung / iOS 26

Stand: 2026-09-10

## Befund

1. `pillplan_v4` wurde erfolgreich gesichert und in Firefox wiederhergestellt.
2. Die produktive `index.html` lädt nur `adherence-v2.js` und `adherence-v2-adapter.js` deterministisch.
3. Weitere produktive Module (`medication-schedule-v1.js`, `statistics-v2.js`, `pillplan-local-date-v1.js`, `pillplan-v12-correction-ui.js`, `pillplan-v12-schedule-change-ui.js`, `pillplan-v12-medication-end-ui.js`) werden teilweise ausschließlich durch Service-Worker-HTML-Injektion ergänzt oder nur gecacht.
4. Dadurch hängt das finale Verhalten vom Service-Worker-Zustand und der Reihenfolge nachgeladener Patches ab. Das ist für iOS/PWA-Starts zu fragil.
5. Home-Screen-Web-Apps auf iOS verwenden einen von Safari getrennten Website-Datenspeicher. Ein Safari-Backup ist daher nicht automatisch identisch mit dem Datenbestand der installierten Home-Screen-Web-App.

## P0-Ziel

- deterministische Modulreihenfolge ohne HTML-Rewrite durch den Service Worker
- keine App-Logik als Nebenwirkung des Cache-Layers
- klarer, stabiler Startpfad vor weiteren Features
- bestehende `pillplan_v4`-Daten unverändert lassen

## Release-Regel

Die Änderung wird auf eigenem Fix-Branch umgesetzt, per Diff geprüft und erst danach in `main` gemerged.
