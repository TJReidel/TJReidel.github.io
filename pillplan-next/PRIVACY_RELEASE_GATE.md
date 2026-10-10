# PillPlan: Datenschutz- und Zweckbestimmungsgate

Stand: 10.10.2026. Gilt ausschließlich für /pillplan-next/ mit core-v5.js.
Keine Freigabe für ältere Runtime-Dateien oder die historische Root-App.

## Zweckbestimmung

Patientengeführte persönliche Medikationsdokumentation, keine Erinnerung, Therapie-/Dosierungsentscheidung oder medizinische Risikobewertung. Keine automatische Weitergabe an Unternehmen oder Krankenkassen. Zeitfarben sind rein beschreibend. Medizinische Änderungen mit behandelnder Fachperson klären.

## Datenflüsse

| Vorgang | Daten / Ziel | Auslösung |
| --- | --- | --- |
| Eingabe, Dokumentation, Korrektur | Medikamente, Dosis, Vorgaben, Zeiten, Notizen und Historie in lokaler IndexedDB, Schema 1 | Patient |
| Einstellungen | Sprache und Zeitzone in LocalStorage | Patient / lokale Initialisierung |
| Offline-App | Statische Dateien im Service-Worker-Cache | Laden / Aktualisieren |
| Hosting | IP-Adresse und technische HTTP-Verbindungsdaten an Hosting; GitHub Pages protokolliert IP für Sicherheit | Seitenaufruf / Asset-Update |
| Testhosting | Separate ChatGPT-Sites-Origin; Anbieter erhält technische Verbindungsdaten; keine echten Patientendaten erlaubt | Testaufruf |
| Backup | Nicht von PillPlan verschlüsselte JSON-Datei an gewählten Speicher; Import ersetzt gültig den lokalen Bestand atomar | Patient |
| Bericht / PDF | Lokale Berichtsberechnung; Browser-Drucksystem, gewählter Drucker oder Speicher; dort ggf. Cloud-Verarbeitung | Patient |
| Teilen / Kopieren | Medikationszusammenfassung an ausgewählte Teilen-App oder Zwischenablage | Patient |
| Spracherkennung der App | Entfernt: kein SpeechRecognition-Aufruf, kein Mikrofonknopf | Keine |
| Betriebssystem-/Tastaturdiktat | Außerhalb der PillPlan-Spracherkennung; Anbieter-/Geräteeinstellungen maßgeblich | Freiwillige Gerätefunktion |

Keine App-Analytics, Trackingbibliothek, App-Cookies oder API zum Upload von Medikationsdaten in der geprüften Runtime. Laufzeitnachweis über isolierten Browser-Test ergänzt; Codeprüfung allein gilt nicht als PASS. Website-Daten können vom Nutzer gelöscht werden; separat exportierte Dateien müssen separat gelöscht werden. Browserbereinigung und Geräteschäden können Daten verlieren lassen. Kein Betreiberzugriff zur Wiederherstellung lokaler Daten.

## Spracherkennung: Ursache und Korrektur

Die bisherige Implementierung nutzte SpeechRecognition / webkitSpeechRecognition ohne Vorgabe ausschließlich lokaler Verarbeitung. Safari nutzt laut WebKit die Siri-Sprachengine; Chromium kann serverbasierte Erkennung nutzen. Damit war ein pauschales Versprechen „alle Daten nur lokal“ für Audiodaten nicht belegbar. Entfernung der App-Spracherkennung vermeidet diesen optionalen Übertragungspfad, ohne eine neue Engine oder Abhängigkeit einzuführen.

Quellen:
- https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
- https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679 (insbesondere Art. 13)

## Verbindlich offen vor öffentlicher Freigabe

Technische Datenhinweise sind in Einstellungen erreichbar, auch offline, aber noch KEINE vollständige Datenschutzerklärung.

1. Tatsächlichen verantwortlichen Betreiber (natürliche Person / Organisation) und öffentliche Kontaktadresse bestätigen. Repository-Inhaberschaft allein ist kein hinreichender Nachweis. Keine private Adresse oder E-Mail aus anderen Kontexten übernehmen.
2. Für das endgültige Produktionshosting die anwendbare Rollenverteilung und ggf. Vereinbarungen, Empfänger, Rechtsgrundlagen, Protokollspeicherung, Drittlandverarbeitung und Schutzmechanismen konkret klären. GitHub dokumentiert Sicherheits-IP-Logging, aber daraus wurde keine konkrete Löschfrist für diesen Betreiber abgeleitet.
3. Vollständige Betreiber-Datenschutzerklärung mit Betroffenenrechten, Beschwerdemöglichkeit und zutreffenden Angaben zur Verarbeitung ergänzen und prüfen. Keine unbestätigten Fristen oder Rechtsgrundlagen veröffentlichen.

Release: HOLD bis diese Informationen bestätigt sind UND ausdrückliche Nutzerfreigabe vorliegt. PR bleibt Draft, kein Merge, kein Produktionsdeployment.

## Geräteabnahme

Nutzerbestätigung am 10.10.2026: „Hat alles perfekt funktioniert“ nach der konkreten Checkliste für Bericht/PDF, Backup-Roundtrip und Offline-Dokumentation mit Neustart/Persistenz. Deshalb PASS für die isolierte iPhone-Version 91171aa18a8b6b932a28d367a72d91a2edd4b8f0. Die anschließende Datenschutzkorrektur verändert weder Berichtlogik noch Datenbank oder Backupformat. Keine erneute vollständige Geräteprüfung behauptet.
