# PillPlan Status Model Audit

Stand: 31.08.2026
Basis: aktueller main-Stand nach Statusmodell-Bereinigung.

## Ergebnis

### Grün – bereits passend
1. Getätigte Einnahmen können einen tatsächlichen Einnahmezeitpunkt speichern.
2. 30-/45-Minuten-Ampellogik ist technisch vorhanden.
3. Rückwirkendes Nachtragen wird als eingenommen, aber zeitlich unbewertet gespeichert.
4. Legacy-Boolean-Einträge werden als zeitlich unbewertet behandelt.
5. Die Streak basiert auf vollständig dokumentierten Einnahmen; gelbe, rote und unbewertete bestätigte Einnahmen können die Streak erhalten.
6. Teilweise dokumentierte Tage werden nicht als vollständig grün dargestellt.
7. Nicht dokumentierte Einnahmen bleiben neutral; PillPlan interpretiert ihre Ursache nicht.

### Fachlich bereinigt
1. `todayStats()` und `overallStats()` berechnen `dokumentiert / geplant`. Die Oberfläche verwendet deshalb dokumentationsbezogene Begriffe statt Compliance/Adhärenz.
2. `buildShareText()` wird als Übersicht dokumentierter Einnahmen verstanden, nicht als medizinische Adhärenzbewertung.
3. Eine offene Einnahme ab 45 Minuten wird sprachlich als „Stark verspätet“ bzw. entsprechend neutral formuliert und nicht als „Verpasst“ bewertet.

## Verbindliches Statusmodell
PillPlan verwendet genau fünf Zustände:
- Grün: dokumentiert eingenommen, pünktlich.
- Gelb: dokumentiert eingenommen, 30–44 Minuten verspätet.
- Rot: dokumentiert eingenommen, 45 Minuten oder mehr verspätet.
- Hellgrau: dokumentiert/nachgetragen, tatsächlicher Zeitpunkt unbekannt.
- Weiß: nicht dokumentiert.

Ein zusätzlicher Status „ausgelassen“ ist nicht vorgesehen.

## Produktlogik
Ein weißes Feld bedeutet ausschließlich: Für diese geplante Einnahme liegt keine Dokumentation vor.

PillPlan leitet daraus nicht ab, ob das Medikament tatsächlich eingenommen wurde. Gründe können unterschiedlich sein, z. B. Vergessen, Krankheit, bewusste Pause oder lediglich fehlende Dokumentation. Die Einordnung bleibt beim Patienten.

## Leitgedanke
**PillPlan unterstützt Sie – nicht kontrolliert Sie.**

Daraus folgen für die Produktentwicklung:
- keine wertende Sprache bei fehlenden Einträgen,
- keine automatische Interpretation von Ursachen,
- keine zusätzliche Schaltfläche für „ausgelassen“,
- keine Sprache, die Überwachung oder Fremdkontrolle suggeriert,
- Datenhoheit beim Patienten.

## Statistik
Die Statistik soll getrennt und transparent zeigen, was tatsächlich dokumentiert wurde:
- dokumentierte Einnahmen insgesamt,
- davon pünktlich/gelb/rot,
- nachgetragen/ungewertet,
- nicht dokumentiert.

Nicht dokumentierte Einnahmen dürfen nicht automatisch als Non-Adhärenz bezeichnet werden.

## Empfehlung
Das Statusmodell ist mit fünf Zuständen ausreichend und soll nicht weiter aufgebläht werden. Der nächste Produktfokus kann auf einer verständlichen Statistik und vertrauensfördernder Sprache liegen, ohne zusätzliche Interaktionsschritte für den Patienten einzuführen.
