# PillPlan Status Model v1

Stand: 31.08.2026

## Grundsatz
PillPlan darf nur Zustände behaupten, die aus der tatsächlichen Nutzerdokumentation ableitbar sind. Ein fehlender Eintrag ist kein Beweis dafür, dass ein Medikament nicht eingenommen wurde.

Leitgedanke: **PillPlan unterstützt Sie – nicht kontrolliert Sie.**

Die App soll Selbstorganisation und Selbstkontrolle unterstützen. Sie bewertet keine Motive, unterstellt keine Ursache und erzeugt keine Fremdkontrolle. Fehlende Dokumentation bleibt deshalb neutral.

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
- Ursache wird von PillPlan nicht interpretiert. Sie kann z. B. Vergessen, Krankheit, bewusste Pause oder fehlende Dokumentation sein.

## Tagesaggregation
- Teilweise dokumentierter Tag hat Vorrang vor einer Farbwertung des gesamten Tages.
- Bei vollständig dokumentierten und zeitbewerteten Einnahmen gilt das schlechteste echte Signal: Rot vor Gelb vor Grün.
- Sobald mindestens eine vollständig dokumentierte Einnahme zeitlich unbewertet ist und keine gelbe/rote Einnahme vorliegt, darf der Tag nicht grün dargestellt werden; er bleibt unbewertet/hellgrau.
- Nicht dokumentierte Einnahmen bleiben neutral und werden nicht als „nicht eingenommen“ interpretiert.

## Heute-Ansicht
- Offene Einnahme vor der Sollzeit: „Offen“ oder „Ausstehend“.
- 30–44 Minuten nach Sollzeit: „Verspätet“.
- ab 45 Minuten nach Sollzeit: „Stark verspätet“ oder „Überfällig“.
- Nach bestätigter Einnahme: „Eingenommen“, ergänzt um die tatsächliche Zeitbewertung.
- Wertende oder endgültige Begriffe wie „Verpasst“ werden vermieden, solange lediglich keine Dokumentation vorliegt.

## Statistik
Die aktuelle Quote misst technisch den Anteil dokumentierter Einnahmen an allen geplanten Einnahmen im gewählten Zeitraum.

Daher ist die fachlich korrekte Bezeichnung:
- „Dokumentierte Einnahmen“ oder
- „Dokumentationsquote“

Der Begriff „Adhärenz/Compliance“ darf nicht allein auf dieser Quote beruhen, weil „nicht dokumentiert“ keine Aussage über die tatsächliche Einnahme erlaubt.

## Streak
V1-Regel:
- Ein Tag erhält Streak-Credit, wenn alle geplanten Einnahmen als eingenommen dokumentiert wurden.
- Grün, Gelb, Rot und nachgetragen/ungewertet zählen als dokumentiert eingenommen.
- Ein weißer/nicht dokumentierter Eintrag unterbricht die Streak nach Ablauf des Tages.

Begründung: Die Streak soll die vollständige tägliche Dokumentation einer stattgefundenen Einnahme honorieren, nicht ausschließlich Pünktlichkeit.

## Produktgrenze
Die Ampelfarben sind eine Adhärenz-/Dokumentationsvisualisierung und keine medizinische Sicherheitsbewertung der Einnahmeabweichung. Die 30-/45-Minuten-Schwellen dürfen nicht als klinisch validierte Grenzwerte dargestellt werden.

## Vertrauens- und Datenschutzprinzip
- PillPlan unterstützt den Patienten bei seiner eigenen Organisation.
- PillPlan interpretiert fehlende Einträge nicht als Fehlverhalten.
- PillPlan verwendet keine Sprache, die Überwachung, Kontrolle oder Bewertung durch Dritte suggeriert.
- Die Datenhoheit liegt beim Patienten.

## Bestehende Daten
Legacy-Boolean-Einträge bleiben als „genommen, Zeitpunkt unbekannt“ erhalten und dürfen nicht nachträglich künstlich grün, gelb oder rot klassifiziert werden.

## Noch offene Produktentscheidung
„Zu früh eingenommen“ ist noch nicht fachlich definiert. Bis zu einer bewussten Produktentscheidung wird keine zusätzliche Frühgrenze eingeführt.
