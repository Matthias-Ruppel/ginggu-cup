# Ginggu Cup - Arbeitsnotizen fuer Codex

## Projekt
- Repo: `Matthias-Ruppel/ginggu-cup`
- Lokaler Pfad: `C:\Users\zinma\Documents\HW-SW-Projekte\TCG Sachen\ginggu-cup`
- GitHub: `https://github.com/Matthias-Ruppel/ginggu-cup`
- `main` ist der stabile Stand. Fuer inhaltliche oder funktionale Aenderungen
  bevorzugt einen kurzen Feature-Branch verwenden, ausser der Nutzer verlangt
  ausdruecklich direkte Arbeit auf `main`.
- Das Projekt ist eine statische Web-App. Wichtige Einstiege:
  - `index.html`
  - `screen.html`
  - `app.js`
  - `screen.js`
  - `style.css`
  - `data/interclub.json`

## Arbeitsweise
- Vor Aenderungen kurz die betroffenen Dateien lesen und bestehende Struktur respektieren.
- Keine unrelated Refactorings oder Formatierungsaktionen.
- Keine bestehenden Inhalte/Assets loeschen, ausser der Nutzer verlangt es ausdruecklich.
- Bei UI-Aenderungen immer Desktop- und Screen-/Anzeige-Nutzung mitdenken.
- Display-Texte in Deutsch halten, sofern der bestehende Kontext nichts anderes vorgibt.

## Versionierung
- Die Projektversion steht in `VERSION`.
- Bei jeder abgeschlossenen inhaltlichen, visuellen oder funktionalen Aenderung
  die Version erhoehen.
- Wenn auf einer Frontseite oder Startfolie ein Datum wie `Aktualisiert` steht,
  muss es direkt vor Commit/Push auf das Datum des tatsaechlichen GitHub-Pushes
  aktualisiert werden.
- Kleine Aenderungen: Patch/Dezimal erhoehen, z.B. `0.1` -> `0.2`.
- Groessere stabile Releases: auf die naechste ganze Version erhoehen, z.B.
  `0.7` -> `1.0`.
- Wenn eine Version sichtbar in der Web-App eingebaut wird, muss sie mit
  `VERSION` uebereinstimmen.
- Bei stabilen Releases ein Git-Tag passend zur Version verwenden, z.B. `v1.0`.

## Lokales Testen
- Da es statische HTML-Dateien sind, kann meist direkt im Browser getestet werden.
- Falls ein lokaler Server noetig ist:

```powershell
cd "C:\Users\zinma\Documents\HW-SW-Projekte\TCG Sachen\ginggu-cup"
python -m http.server 8080
```

- Danach im Browser:
  - `http://localhost:8080/`
  - `http://localhost:8080/screen.html`

## Infoscreen / Kiosk-Layout
- Infoscreen- und Raspberry-Pi-Kiosk-Seiten muessen fuer 16:9 optimiert sein.
- Primaeres Zielformat: 1920 x 1080 px.
- Die gesamte Ansicht muss ohne Scrollen funktionieren.
- Wichtige Inhalte duerfen nicht abgeschnitten werden.
- Footer, Eventleiste und Statusbereiche muessen vollstaendig sichtbar sein.
- Vertikale Abstaende sind bewusst knapp und ruhig zu waehlen.
- Keine grossen Leerflaechen zwischen Hauptinhalt und Footer.
- Bei CSS Grid/Flex sind `min-height: 0` und saubere Reihenhoehen Pflicht.
- Vor jedem Push nach Screen-Layout-Aenderungen einen Screenshot bei
  1920 x 1080 pruefen.
- Zusaetzlich 1366 x 768 pruefen, sofern die Seite auf kleineren Bildschirmen
  laufen kann.

## Git
- Vor groesseren Aenderungen `git status --short --branch` pruefen.
- Lokale Nutzer-Aenderungen nie ungefragt zuruecksetzen.
- Commits, Pushes, Tags, Releases und Pull Requests nur machen, wenn der Nutzer
  es ausdruecklich verlangt oder nach der Test-Zusammenfassung freigibt.
- Nach jeder abgeschlossenen Aenderung vor GitHub-Aktionen kurz zusammenfassen:
  - Version vorher und Version jetzt.
  - Was geaendert wurde.
  - Wie getestet wurde.
  - Worauf der Nutzer beim Anschauen achten soll.
- Danach explizit fragen, ob die Aenderungen nach GitHub committed/gepusht,
  getaggt oder als Release/PR veroeffentlicht werden sollen.
- Direkter Push auf `main` nur nach ausdruecklicher Zustimmung. Bei riskanten
  Aenderungen einen Feature-Branch und optional Pull Request nach `main` nutzen.
