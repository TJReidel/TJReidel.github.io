# PillPlan Statistik v2

Stand: 31.08.2026

## Ziel
Die Statistik soll Patienten in wenigen Sekunden zeigen, was sie selbst dokumentiert haben. Sie bewertet den Patienten nicht und interpretiert keine Ursachen.

Leitplanke: **PillPlan unterstützt Sie – nicht kontrolliert Sie.**

## Darstellung
Eine Hauptzahl plus wenige verständliche Zeilen. Keine Scores, Schulnoten, Warnstufen, Wettbewerbe oder unnötigen Diagramme.

### Hauptzahl
**Dokumentierte Einnahmen: XX %**

Berechnung: dokumentierte Einnahmen / geplante Einnahmen im gewählten Zeitraum.

### Ruhige Motivation
Direkt unter der Hauptzahl steht genau eine kurze, unterstützende Zeile. Sie soll ermutigen, aber nie bewerten oder Druck erzeugen.

V1-Tonalität:
- hohe Dokumentation: **„Gut im Blick – weiter so.“**
- mittlere Dokumentation: **„Schon einiges dokumentiert.“**
- niedrige Dokumentation: **„Jeder Eintrag hilft Ihnen, den Überblick zu behalten.“**

Keine Formulierungen wie „schlecht“, „unzureichend“, „Sie müssen“ oder „Ziel nicht erreicht“.

### Aufteilung
- Grün – pünktlich dokumentiert
- Gelb – 30–44 Minuten verspätet dokumentiert
- Rot – 45 Minuten oder mehr verspätet dokumentiert
- Hellgrau – nachgetragen, genaue Zeit unbekannt
- Weiß – nicht dokumentiert

Die Zeilen zeigen primär die Anzahl. Prozentwerte innerhalb der Unterkategorien sind optional und werden in v2 zunächst nicht benötigt, um die Ansicht ruhig zu halten.

## Sprachregeln
- „Nicht dokumentiert“ statt „vergessen“, „ausgelassen“ oder „nicht genommen“.
- „Stark verspätet“ statt „verpasst“.
- Keine Formulierungen wie „schlecht“, „kritisch“, „Sie müssen sich verbessern“ oder „Non-Compliance“.
- Keine automatische Erklärung für fehlende Dokumentation; Gründe können vielfältig sein.

## Streak
Die bestehende Streak bleibt vorerst unverändert. Statistik v2 verändert weder Streak-Logik noch Einnahme-/Ampellogik.

## Technische Zählregel
Für jede geplante Einnahme im gewählten Zeitraum gilt genau eine Kategorie:
1. green
2. yellow
3. red
4. unrated
5. undocumented

Legacy-Boolean-Einträge zählen als `unrated`.

## UX-Grenze
Die Statistik ist eine persönliche Rückschau, kein klinisches Dashboard. Ziel: ungefähr 10 Sekunden bis zum Verständnis.