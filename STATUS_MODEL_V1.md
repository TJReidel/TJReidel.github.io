# PillPlan Status Model v1

Stand: 31.08.2026

## Grundsatz
PillPlan darf nur Zustände behaupten, die aus der tatsächlichen Nutzerdokumentation ableitbar sind. Ein fehlender Eintrag ist kein Beweis dafür, dass ein Medikament nicht eingenommen wurde.

## Verbindliche Zustände pro Einnahme

### 1. Dokumentiert eingenommen – pünktlich
- Bedeutung: Einnahme wurde durch den Nutzer bestätigt und der gespeicherte Einnahmezeitpunkt liegt weniger als 30 Minuten nach der geplanten Uhrzeit.
- Darstellung: Grün.
- Zählt als dokumentierte Einnahme: Ja.
- Zeitbewertung möglich: Ja.

### 2. Dokumentiert eingenommen – verspätet
- Bedeutung: Einnahme wurde bestätigt und der gespeicherte Einnahmezeitpunkt liegt 30 bis 44 Minuten nach der geplanten Uhrzeit.
- Darstellung: Gelb.
- Zählt als dokumentierte Einnahme: Ja.
- Zeitbewertung möglich: Ja.

### 3. Dokumentiert eingenommen – stark verspätet
- Bedeutung: Einnahme wurde bestätigt und der gespeicherte Einnahmezeitpunkt liegt 45 Minuten oder mehr nach der geplanten Uhrzeit.
- Darstellung: Rot.
- Zählt als dokumentierte Einnahme: Ja.
- Zeitbewertung möglich: Ja.
- Sprachregel: Nicht als „ausgelassen“ bezeichnen.

### 4. Nachgetragen – Zeitpunkt unbekannt
- Bedeutung: Der Nutzer bestätigt rückwirkend, dass die Einnahme stattgefunden hat, ohne einen belastbaren tatsächlichen Einnahmezeitpunkt zu dokumentieren.
- Darstellung: Hellgrau.
- Zählt als dokumentierte Einnahme: Ja.
- Zeitbewertung möglich: Nein.

### 5. Nicht dokumentiert
- Bedeutung: Für die geplante Einnahme liegt keine Bestätigung vor.
- Darstellung: Weiß/offen.
- Zählt als dokumentierte Einnahme: Nein.
- Aussage „nicht eingenommen“ zulässig: Nein.

### 6. Ausgelassen
- Bedeutung: Der Nutzer bestätigt ausdrücklich, dass die Einnahme nicht stattgefunden hat.
- Status ist fachlich vorgesehen, aber in der aktuellen App noch nicht implementiert.
- Dieser Zustand darf nicht automatisch aus „nicht dokumentiert“ abgeleitet werden.

## Tagesaggregation
- Teilweise dokumentierter Tag hat Vorrang vor einer Farbwertung des gesamten Tages.
- Bei vollständig dokumentierten und zeitbewerteten Einnahmen gilt das schlechteste echte Signal: Rot vor Gelb vor Grün.
- Sobald mindestens eine vollständig dokumentierte Einnahme zeitlich unbewertet ist und keine gelbe/rote Einnahme vorliegt, darf der Tag nicht grün dargestellt werden; er bleibt unbewertet/hellgrau.
- Nicht dokumentierte Einnahmen dürfen nicht als ausgelassen interpretiert werden.

## Heute-Ansicht
- Offene Einnahme vor der Sollzeit: „Offen“ oder „Ausstehend“.
- 30–44 Minuten nach Sollzeit: „Verspätet“.
- ab 45 Minuten nach Sollzeit: „Stark verspätet“ oder „Überfällig“.
- Nach bestätigter Einnahme: „Eingenommen“, ergänzt um die tatsächliche Zeitbewertung.
- „Verpasst“ ist für eine noch offene oder nur verspätete Einnahme zu endgültig und soll nicht verwendet werden, solange „ausgelassen“ nicht ausdrücklich bestätigt wurde.

## Statistik
Die aktuelle Quote misst technisch den Anteil dokumentierter Einnahmen an allen geplanten Einnahmen im gewählten Zeitraum.

Daher ist die fachlich korrekte Bezeichnung:
- „Dokumentierte Einnahmen“ oder
- „Dokumentationsquote“

Der Begriff „Adhärenz/Compliance“ darf nicht allein auf dieser Quote beruhen, solange „nicht dokumentiert“ nicht von „ausgelassen“ unterschieden werden kann.

## Streak
V1-Regel:
- Ein Tag erhält Streak-Credit, wenn alle geplanten Einnahmen als eingenommen dokumentiert wurden.
- Grün, Gelb, Rot und nachgetragen/ungewertet zählen als dokumentiert eingenommen.
- Ein weißer/nicht dokumentierter Eintrag unterbricht die Streak nach Ablauf des Tages.
- Ein künftig ausdrücklich als „ausgelassen“ bestätigter Eintrag unterbricht die Streak.

Begründung: Die Streak soll die vollständige tägliche Dokumentation einer stattgefundenen Einnahme honorieren, nicht ausschließlich Pünktlichkeit.

## Produktgrenze
Die Ampelfarben sind eine Adhärenz-/Dokumentationsvisualisierung und keine medizinische Sicherheitsbewertung der Einnahmeabweichung. Die 30-/45-Minuten-Schwellen dürfen nicht als klinisch validierte Grenzwerte dargestellt werden.

## Bestehende Daten
Legacy-Boolean-Einträge bleiben als „genommen, Zeitpunkt unbekannt“ erhalten und dürfen nicht nachträglich künstlich grün, gelb oder rot klassifiziert werden.

## Noch offene Produktentscheidung
„Zu früh eingenommen“ ist noch nicht fachlich definiert. Bis zu einer bewussten Produktentscheidung wird keine zusätzliche Frühgrenze eingeführt.
