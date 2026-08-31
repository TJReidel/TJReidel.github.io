# PillPlan – Adhärenzmodell v2

Stand: 2026-08-31
Status: technische Umsetzungsvorgabe

## Ziel

PillPlan soll nicht nur speichern, ob eine Einnahme erfolgt ist, sondern wann sie bestätigt wurde und wie groß die Abweichung zur geplanten Einnahmezeit war. Diese Information wird dauerhaft gespeichert und in Heute- sowie Plan-/Kalenderansicht wiederverwendet.

## Verbindliche Ampellogik

- Grün: Abweichung < 30 Minuten
- Gelb: Abweichung 30–44 Minuten
- Rot: Abweichung >= 45 Minuten

Die Ampel ist eine Visualisierung der zeitlichen Adhärenz und keine medizinische Bewertung der Sicherheit einer verspäteten Einnahme.

## Datenmodell

Bisher:

```js
S.taken[key] = true
```

Neu:

```js
S.taken[key] = {
  taken: true,
  takenAt: "2026-08-31T08:37:00+02:00",
  tier: "yellow",
  source: "today"
}
```

`key` bleibt kompatibel zum bisherigen Format:

```text
YYYY-MM-DD_MEDIKAMENT-ID_SOLLZEIT
```

## Rückwärtskompatibilität

Bestehende Werte `true` bleiben gültig und gelten als `legacy` – Einnahme bestätigt, exakter Zeitpunkt unbekannt. Diese Altdaten dürfen nicht nachträglich künstlich als pünktlich/grün klassifiziert werden.

Leseregel:

- Objekt mit `taken === true` -> neue strukturierte Einnahme
- Boolean `true` -> bestätigte historische Einnahme ohne Ampelbewertung
- fehlender/falscher Wert -> nicht genommen

## Speicherung bei heutiger Einnahme

Beim Tippen auf "Eingenommen":

1. aktuellen lokalen Zeitstempel speichern,
2. Differenz zur Sollzeit berechnen,
3. Tier speichern,
4. UI anhand des gespeicherten Tierwerts darstellen,
5. beim Rückgängigmachen den Eintrag vollständig entfernen.

Wichtig: Nach dem Bestätigen darf der Status nicht mehr anhand der laufenden Uhrzeit neu berechnet werden. Der gespeicherte Einnahmezeitpunkt ist maßgeblich.

## Kalenderdarstellung

Für jeden Medikament-/Tageswert wird die schlechteste dokumentierte Abweichung des Tages verwendet, sofern alle vorgesehenen Einnahmen bestätigt sind:

- alle dokumentierten Einnahmen grün -> Tag grün
- mindestens eine gelb, keine rot -> Tag gelb
- mindestens eine rot -> Tag rot
- Legacy-/manuelle Nachtragung ohne Zeitstempel -> neutral/ungewertet
- nur teilweise bestätigt -> weiterhin Teilstatus, keine falsche Ampelvollbewertung

Die Farbe darf aus Gründen der Barrierefreiheit nicht die einzige Information sein; Symbol bzw. zugängliches Label muss den Zustand zusätzlich benennen.

## Rückwirkendes Nachtragen

Ein rückwirkender Tages-Klick kennt keine reale Einnahmezeit. Daher wird eine solche Nachtragung nicht automatisch grün bewertet.

Vorgabe für v2.0:

```js
{
  taken: true,
  takenAt: null,
  tier: "unknown",
  source: "manual-history"
}
```

Damit bleibt die Information "genommen" erhalten, ohne eine nicht belegte Pünktlichkeit zu behaupten.

## Migration ohne Datenverlust

Keine Änderung des LocalStorage-Schlüssels `pillplan_v4` in diesem Schritt. Das verhindert, dass bestehende Nutzerdaten durch eine neue Storage-Version scheinbar verschwinden.

Die Lese-Helfer werden tolerant gegenüber Boolean- und Objektwerten implementiert.

## Akzeptanztests

1. Soll 08:00, Bestätigung 08:20 -> grün und dauerhaft grün.
2. Soll 08:00, Bestätigung 08:30 -> gelb.
3. Soll 08:00, Bestätigung 08:44 -> gelb.
4. Soll 08:00, Bestätigung 08:45 -> rot.
5. Soll 08:00, Bestätigung 09:10 -> rot.
6. Nach Bestätigung darf ein späterer App-Aufruf den gespeicherten Tierwert nicht verändern.
7. Rückgängig entfernt Zeitpunkt und Tier vollständig.
8. Bestehende Boolean-`true`-Daten bleiben als genommen sichtbar.
9. Boolean-`true` wird nicht nachträglich automatisch grün.
10. Kalender zeigt gespeicherte Tierwerte über 7/14/21/30 Tage konsistent.
11. Rückwirkende manuelle Nachtragung wird als genommen, aber ungewertet dargestellt.
12. Reset entfernt alte und neue Einnahmedaten wie bisher vollständig.

## Nicht Bestandteil dieses Schritts

- klinisch medikamentenspezifische Zeitfenster
- Cloud-Synchronisierung
- Backend
- B2B-Dashboard
- Änderung des Reminder-Modells

## Release-Governance

Umsetzung ausschließlich über Feature-Branch -> Diff-Review -> manueller Funktionstest -> Merge in `main`. `main` wird nicht direkt editiert.
