# PillPlan – Feature PDF-/Arztbericht

Stand: 2026-10-05  
Status: READY FOR DEVELOPMENT  
Basis: main@a4ad82dc21daa1d4848f0aa670b5fcc8f15a3f54

## Ziel
Lokaler, einfach lesbarer Medikamenten- und Einnahmebericht für Patient, Arzt, Apotheke oder Pflege. Keine medizinische Bewertung.

## Scope
- Zeitraum 7 / 14 / 21 / 30 Tage
- aktuelle/relevante Medikamente
- Dosis/Stärke, geplante Einnahmezeiten, ärztliche Vorgabe falls vorhanden
- dokumentiert/offen
- bestehende Ampelstatus-Logik
- Summen + Dokumentationsquote
- Browser-Druck/PDF
- optional Share Sheet nach expliziter Nutzeraktion
- Disclaimer

## Architekturregeln
- vorhandene IndexedDB-Daten verwenden
- keine neue Cloud / kein Backend
- bestehende meds/events/meta-Struktur wiederverwenden
- bestehende timesForDate-/Historienlogik wiederverwenden
- keine parallele Adhärenzberechnung
- keine Schema-Migration, sofern vermeidbar
- keine Änderung an main vor Release-Gate

## MUST-Akzeptanzkriterien
1. Bericht funktioniert für 7/14/21/30 Tage.
2. Relevante Medikamente und Daten werden korrekt angezeigt.
3. Ampelstatus und dokumentiert/offen entsprechen der bestehenden Ereignislogik.
4. Summen/Quote sind mathematisch korrekt.
5. Historische Planänderungen werden korrekt berücksichtigt.
6. Beendete Medikamente erzeugen nach Enddatum keine Soll-Einnahmen.
7. iPhone kann über Systemdruck ein PDF erzeugen.
8. Keine automatische externe Übertragung.
9. Disclaimer sichtbar.
10. Keine Regression in Heute, Plan, Hinzufügen, Einstellungen, Backup/Restore und Zeitzonenlogik.

## SHOULD
- Share Sheet
- sinnvoller Dateiname
- A4-Lesbarkeit
- Status auch ohne Farbe verständlich

## Nicht im Scope
- Wechselwirkungen
- Diagnose-/Risikobewertung
- Therapieempfehlungen
- automatische Arzt-/Cloud-Übermittlung
- TI/KIM
- bundeseinheitlicher Medikationsplan

## Testfälle
- 100 % pünktlich
- gemischt Grün/Gelb/Rot/Offen
- nachgetragene Einnahme
- Zeitplanänderung innerhalb Zeitraum
- beendetes Medikament
- 7/14/21/30 Tage
- iPhone PDF
- Share Sheet
- Offline
- Regression Kernfunktionen

## Release-Gate
Implementierung auf diesem Branch -> technischer Test -> realer iPhone-Test -> STABLE 1 -> zeitversetzter STABLE 2 -> Merge nach main -> Deployment.
