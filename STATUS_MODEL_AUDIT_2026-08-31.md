# PillPlan Status Model Audit

Stand: 31.08.2026
Basis: aktueller main-Stand vor Statusmodell-Änderungen.

## Ergebnis

### Grün – bereits passend
1. Getätigte Einnahmen können einen tatsächlichen Einnahmezeitpunkt speichern.
2. 30-/45-Minuten-Ampellogik ist technisch vorhanden.
3. Rückwirkendes Nachtragen wird als eingenommen, aber zeitlich unbewertet gespeichert.
4. Legacy-Boolean-Einträge werden als zeitlich unbewertet behandelt.
5. Die Streak basiert auf vollständig dokumentierten Einnahmen; gelbe, rote und unbewertete bestätigte Einnahmen können die Streak erhalten.
6. Teilweise dokumentierte Tage werden nicht als vollständig grün dargestellt.

### Gelb – fachlich missverständlich
1. `todayStats()` und `overallStats()` berechnen `dokumentiert / geplant`, die Oberfläche bezeichnet Teile davon aber als Compliance/Adhärenz. Das ist stärker formuliert als die Datenbasis erlaubt.
2. `buildShareText()` berechnet pro Medikament den Anteil vollständig dokumentierter Tage und gibt ihn als Prozentwert aus, ohne klarzustellen, dass es eine Dokumentationsquote ist.
3. Eine offene Einnahme ab 45 Minuten wird sprachlich derzeit über den Übersetzungsschlüssel `overdue` dargestellt; in Deutsch wurde in der aktuellen Oberfläche „Verpasst“ beobachtet. Das ist zu endgültig, solange der Nutzer kein Auslassen bestätigt hat.

### Rot – fehlender fachlicher Zustand
1. Es existiert noch kein ausdrücklicher Zustand `ausgelassen/skipped`.
2. Deshalb kann PillPlan derzeit nicht unterscheiden zwischen:
   - nicht dokumentiert,
   - tatsächlich nicht eingenommen,
   - eingenommen, aber vergessen zu dokumentieren.
3. Aus diesem Grund darf ein weißes Feld fachlich nicht als Non-Adhärenz oder ausgelassene Einnahme gewertet werden.

## Konsequenzen für die nächste Codeänderung

Priorität 1 – Sprache korrigieren
- Deutsch: offene Einnahme >=45 Min. nicht mehr „Verpasst“, sondern „Stark verspätet“ oder „Überfällig“.
- Statistische Quote nicht mehr „Compliance/Adhärenz“ nennen, sondern „Dokumentierte Einnahmen“ oder „Dokumentationsquote“.
- Geteilte Übersicht entsprechend präzisieren.

Priorität 2 – expliziten Ausgelassen-Status konzipieren
- Keine automatische Ableitung.
- Muss durch bewusste Nutzeraktion bestätigt werden.
- Darf die einfache Ein-Tipp-Bedienung der normalen Einnahme nicht verschlechtern.
- UX-Entscheidung erforderlich, bevor implementiert wird.

Priorität 3 – Statistik v2
Sobald `ausgelassen` existiert, kann die Statistik getrennt zeigen:
- dokumentiert eingenommen,
- davon pünktlich/gelb/rot,
- nachgetragen/ungewertet,
- ausdrücklich ausgelassen,
- nicht dokumentiert.

## Empfehlung
Zuerst nur Priorität 1 implementieren. Danach den `Ausgelassen`-Workflow separat sparren und testen. Keine neue Schaltfläche in die Hauptansicht einbauen, bevor der Bedienweg für ältere Nutzer geklärt ist.
