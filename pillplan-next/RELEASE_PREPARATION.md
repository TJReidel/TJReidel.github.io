# PillPlan Release-Vorbereitung — HOLD

Stand 10.10.2026. Führender Release-Status: JSON/Markdown-Artefakt und Job Summary des bestehenden Workflows `PillPlan regression`. Keine zweite Statusliste. `release-gate.json` enthält dauerhafte Grenzen und historische Nutzerbestätigungen; CI ergänzt ausschließlich tatsächlich ausgeführte technische Ergebnisse.

## Schutz der persönlichen Version

Die ehemalige Testadresse `https://pillplan-iphone-test-16f3e292.thomasreidel.chatgpt.site` enthält laut Nutzer inzwischen echte Medikationsdaten. Sie ist eine geschützte persönliche Nutzungsversion. Site-ID: `appgprj_6aca5db52df48191adcb562e47c8e144`. Nicht neu bereitstellen, nicht im Testbrowser öffnen, keine IndexedDB-/LocalStorage-/Cache-Zugriffe. Ein statischer HTTP-Abgleich am 10.10.2026 bestätigte den Marker `6707ccd8d62b41b4d50186de7407f7aefa027e6d` und identischen Runtime-SHA256 `a7d9d35af686ce3a56fc9f5c3eadee43a1ae3768e9002f24aa6fa6c81acf183f`; dabei wurden keine Patientendaten gelesen.

Browser-Speicher ist an den Origin gebunden, IndexedDB nicht an einen URL-Pfad. Andere Testpfade auf der Produktionsdomain sind deshalb keine vollständige Isolation. Tests laufen in frischen Browserkontexten auf Loopback; künftige iPhone-Kandidaten benötigen einen eigenen Origin, ausschließlich fiktive Daten und dürfen die geschützte Site niemals überschreiben.

## Bestehender Automatismus, gezielt erweitert

Änderungen an `pillplan-next/**` oder dem bestehenden Workflow lösen Regression aus. Checkout und Release-Status referenzieren den PR-Head, nicht den automatisch erzeugten Merge-Commit. Abgebrochene, fehlgeschlagene oder übersprungene Checks erzeugen keinen PASS. PR-Head, Draft-Status und main-Baseline werden vor Statusbildung erneut gelesen. Ein geänderter main-Stand sperrt die technische Bereitschaft.

Der Browserjob führt die fünf bestehenden E2E-Tests sowie den zusätzlichen Update-/Rollback-Test aus. Der Statusjob speichert commitbezogene Nachweise. Der Workflow hat ausschließlich Leserechte am Repository und besitzt weder Merge- noch Pages-Deployment-Schritte. Keine Benachrichtigungen per Mail, Slack oder PR-Kommentar.

Ein PR-bezogener ChatGPT-Webhook-Wächter kann Commitänderungen aufgreifen, die terminalen CI-Ergebnisse lesen und nur neue Blocker oder erforderliche Entscheidungen in ChatGPT melden. GitHub-Workflow-Fertigstellung ist selbst kein unterstütztes Webhook-Ereignis; der Wächter muss laufende CI im Rahmen seiner Laufzeit abwarten. Kann er sie nicht abschließend lesen, bleibt der Status unbestätigt. Keine heimliche tägliche Polling-Automation. Automatische HTTPS-Testbereitstellung ist ein separater Sites-Schritt nach grüner CI; sie darf nur erfolgen, wenn eine neue Geräteprüfung erforderlich ist und ein getrennter Site-Origin sicher bereitgestellt werden kann. Ein registrierter Webhook ist noch kein nachgewiesener ausgeführter Bereitstellungslauf.

## Update- und Rückfallplan

Produktionsbaseline: `a4ad82dc21daa1d4848f0aa670b5fcc8f15a3f54`; ursprüngliche Quelle bleibt im Git-Verlauf erhalten. Vor Freigabe main und tatsächliche Produktionsdateien erneut abgleichen. Kein Produktiv-Browserzugriff in Cloud-Tests.

1. Vor einem später freigegebenen Update: Nutzer sichert ein aktuelles Backup außerhalb der App; echte Datei verbleibt beim Nutzer. Stand und Datum dokumentieren, ohne Patientendaten ins Repository zu übernehmen.
2. Ein bestimmter Commit darf erst nach vollständiger Freigabe und abgeschlossenem Recordati-Prozess nach main. Januar 2027 ist lediglich eine Planung, kein Trigger und keine Freigabe.
3. Update zuerst online vollständig laden; aktiven Service Worker und ausgelieferte Runtime prüfen. Offlinefähigkeit erst danach prüfen.
4. Bei einem Fehler Veröffentlichung stoppen. Nach gesonderter Freigabe bekannte statische Baseline wieder bereitstellen; Nutzer online neu öffnen lassen. Ein Code-Rollback stellt keine gelöschten Daten wieder her.
5. Datenwiederherstellung ausschließlich durch den Nutzer aus seinem gesicherten Backup. Gültiger Import ersetzt den lokalen Bestand; deshalb vorhandenen Bestand vorher ebenfalls exportieren. Keine ferngesteuerte Wiederherstellung und keine Cloud-Übernahme.
6. Der zusätzliche Browsertest weist Code-Rückfall mit fiktiven Daten nach. Er ersetzt weder Geräteprüfung noch einen echten Notfall-Wiederherstellungstest am persönlichen Gerät.

## Betreiber-Datenschutzhinweise — vorbereiteter Entwurf, nicht veröffentlichungsfähig

**Verantwortlicher:** [BESTÄTIGTER BETREIBERNAME / RECHTSFORM], [ÖFFENTLICHE POSTADRESSE], [ÖFFENTLICHE KONTAKT-E-MAIL]. Nicht aus Git-Commit-Metadaten oder persönlichen Erinnerungen ableiten. Datenschutzbeauftragter nur nennen, falls tatsächlich bestellt und anwendbar.

**Zweck:** PillPlan unterstützt Ihre persönliche Medikationsdokumentation. Es erfasst Ihre Eingaben; es gibt keine Einnahmeerinnerungen, Therapie- oder Dosierungsempfehlungen und keine medizinische Risikobewertung. Farben beschreiben Zeitabweichungen. Entscheidungen über Medikamente bleiben bei Ihnen und Ihrer behandelnden Fachperson.

**Lokale Angaben:** Medikamente, Dosis-/Stärkeangaben, Einnahmezeiten, Dokumentation, Korrekturen und Notizen werden in der IndexedDB Ihres Browser-Origins gespeichert. Sprache und Zeitzone liegen in LocalStorage; statische App-Dateien im Service-Worker-Cache. Im geprüften Funktionsablauf werden Medikationswerte nicht automatisch an den Betreiber oder einen App-Server gesendet. Keine automatische Synchronisierung, keine Wiederherstellung durch den Betreiber. Technische Browserprüfung ist auf den geprüften Ablauf begrenzt, keine Garantie für Betriebssystem-, Browser- oder Drittanbieterfunktionen.

**Hosting:** Beim Abruf oder Update statischer Dateien erhält das Hosting technische Verbindungsdaten. Für vorgesehenes GitHub Pages ist IP-Protokollierung zu Sicherheitszwecken belegt. Vor Veröffentlichung konkret ergänzen: eingesetzter Vertragspartner/Rolle, Verarbeitungskategorien, anwendbare Rechtsgrundlagen und Interessen, Empfänger, Aufbewahrungsfrist oder nachvollziehbare Kriterien, mögliche Drittlandübermittlungen und gültige Schutzmechanismen. GitHubs allgemeine Datenschutzerklärung ersetzt diese konkrete Einordnung nicht. Keine erfundene Löschfrist, kein pauschaler Auftragsverarbeitungsvertrag und keine pauschale Übernahme aller GitHub-Account-Verarbeitungen auf Pages-Besucher.

**Export und Teilen:** Backup ist eine von PillPlan nicht verschlüsselte JSON-Datei; Bericht/PDF wird lokal aus Ihren Eingaben erstellt. Sie wählen Drucker, Dateispeicher, Cloud-Speicher, Empfänger oder Teilen-App. Diese Ziele können sensible Angaben erhalten und eigene Verarbeitung durchführen. Ein gültiger Import ersetzt den lokalen Datenbestand. Eingaben für Support nicht mitsenden; nur erforderliche technische Fehlerbeschreibungen ohne Gesundheitsdaten verwenden.

**Diktat:** PillPlan hat keine app-eigene Spracherkennung und fordert keinen Mikrofonzugriff an. Betriebssystem-/Tastaturdiktat richtet sich nach den Einstellungen und Regeln des jeweiligen Anbieters.

**Speicherdauer und Löschen:** Lokale Daten verbleiben im Browser bis zur Löschung bzw. Entfernung durch Browser/OS; deren dauerhafter Erhalt ist nicht garantiert. Website-Daten löschen entfernt lokale App-Daten und Einstellungen. Exportierte Backups/PDFs müssen separat gelöscht werden. Vor Browserbereinigung benötigte Daten sichern. Hosting- und Kontaktverarbeitung müssen mit tatsächlichen Fristen/Kriterien ergänzt werden.

**Rechte und Kontakt:** Soweit die rechtlichen Voraussetzungen vorliegen, bestehen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie Widerruf einer tatsächlich erteilten Einwilligung mit Wirkung für die Zukunft. Für vom Betreiber verarbeitete Daten: [BESTÄTIGTER KONTAKT]. Für beim Hosting eigenverantwortlich verarbeitete Daten ist die Rollenverteilung zu erläutern. Sie können sich bei einer Datenschutzaufsichtsbehörde beschweren; [TATSÄCHLICH ZUSTÄNDIGE BEHÖRDE nach Betreibersitz] ergänzen. Nicht behaupten, der Betreiber könne lokale Medikationsdaten herausgeben oder löschen.

**Pflicht zur Bereitstellung / automatisierte Entscheidungen:** Erforderliche technische Verbindung ermöglicht die Auslieferung; Medikationsangaben wählen Sie selbst. In der geprüften App keine automatische Therapieentscheidung oder Profilingfunktion. Rechtliche Einordnung der Betreiberverarbeitung und Gesundheitsdaten abschließend prüfen; lokale Speicherung allein ist keine automatische Rechtsfreistellung.

## Quellenprüfung vom 10.10.2026 und offene rechtliche Einordnung

- DSGVO Art. 13: Name/Kontakt, Zwecke/Rechtsgrundlagen, Empfänger, gegebenenfalls Drittlandangaben; zusätzlich Fristen/Kriterien und Rechte. https://ao.bundesfinanzministerium.de/ao/2025/Datenschutz-Grundverordnung/inhalt.html sowie https://www.lda.bayern.de/de/thema_informationspflichten.html
- § 5 DDG betrifft geschäftsmäßige, in der Regel gegen Entgelt angebotene digitale Dienste: https://www.gesetze-im-internet.de/ddg/__5.html . Ohne bestätigten Angebotszweck kein pauschales Urteil zur Anwendbarkeit.
- § 18 MStV kann bei nicht ausschließlich persönlichen/familiären Telemedien Name und Anschrift verlangen, unabhängig von obiger DDG-Einordnung: https://www.gesetze-bayern.de/Content/Document/MStV-18 . Publikum und Angebotszweck bestätigen.
- Notwendige Browser-Speicherung und die Einordnung nach § 25 TDDDG vor Veröffentlichung prüfen; kein vorsorglicher Cookie-Banner ohne konkreten Bedarf. Noch keine abschließende Rechtsbewertung.
- GitHub Pages Sicherheits-IP-Logging: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub allgemeine Datenschutzerklärung, angegebenes Wirksamkeitsdatum 27.04.2026: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement . Konkrete Pages-Rollen/Verträge/Fristen sind damit nicht vollständig geklärt.

## Einmal gebündelt benötigte Angaben

Betreibername/Rechtsform, öffentliche Postadresse, öffentliche Kontakt-E-Mail, vorgesehenes Publikum (nur eigene Nutzung / begrenzter Testkreis / öffentlich), geschäftlicher oder kommerzieller Zweck sowie Bestätigung des Produktionshostings GitHub Pages. Danach konkrete Hosting-Unterlagen/Rollen prüfen und den Entwurf vervollständigen. Keine Veröffentlichung von Platzhaltern.

## Späteres Release-Gate

- [ ] Exakter Kandidat und main erneut verifiziert; sämtliche kritischen Tests PASS.
- [ ] Erforderliche Geräteprüfungen für den Kandidaten ausdrücklich bestätigt; frühere Nachweise bleiben ihrem Commit zugeordnet.
- [ ] Vollständige Datenschutz- und gegebenenfalls Anbieterinformationen integriert, offline erreichbar und erneut getestet.
- [ ] Hostingbedingungen und juristischer Prüfbedarf geklärt.
- [ ] Aktuelles persönliches Backup vom Nutzer gesichert, ohne Upload.
- [ ] Recordati-Prozess abgeschlossen und ausdrückliche Freigabe für exakt diesen Commit vorhanden.
- [ ] Nach freigegebenem Deployment: Produktionsdateien/Commit/Scope kontrolliert; persönliche Daten ausschließlich vom Nutzer geprüft.

Aktuell: Veröffentlichung HOLD. PR bleibt Draft. Keine Produktivänderung.
