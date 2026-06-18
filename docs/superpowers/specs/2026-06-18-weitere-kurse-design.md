# Spec: Weitere Kurse (Flexbox, CSS Grid, Animationen)

> Stand: 2026-06-18. Erweitert die Plattform von einem aktiven Kurs (CSS-Grundlagen)
> auf **vier** vollständige Kurse. Vermittelt im selben „by doing"-Format wie
> CSS-Grundlagen: Aufgabe + Editor + Live-Vorschau + automatischer Checker.

## Ziel
Die bisher gesperrten Platzhalter-Kurse mit echten Lektionen füllen und einen
neuen Grid-Kurs ergänzen. Danach sind alle Kurse sofort spielbar.

## Kursstruktur (4 Kurse, Reihenfolge = sort)
| sort | slug | Titel | Level | Status |
|---|---|---|---|---|
| 1 | css-grundlagen | CSS-Grundlagen | Anfänger | active (bestehend) |
| 2 | flexbox-layout | **Flexbox** | Mittel | active |
| 3 | css-grid | **CSS Grid** | Mittel | active |
| 4 | animationen | **Animationen** | Fortgeschritten | active |

Der bestehende Kurs `flexbox-layout` wird von „Flexbox & Layout" in **„Flexbox"**
umbenannt (Intro: 1D-Layouts), damit die Rollenteilung zu Grid (2D) klar ist.

## Leitprinzip: Checker-Kompatibilität
Der Checker liest `getComputedStyle(el).getPropertyValue(prop)` und vergleicht
exakt (Farben normalisiert). Daraus zwei verbindliche Regeln:

1. **Kein Soll-Wert darf dem Element-Default entsprechen.** (Sonst erfüllt leeres
   CSS die Prüfung — der zuvor in Lektion 6 behobene Bug.)
2. **Nicht statisch prüfbares wird „lesen"-Lektion** (mit Live-Vorschau, ohne
   Prüfung/Lösung): `transform` (→ `matrix(…)`), `:hover`-Zustände, sowie
   `fr`/`repeat()` in Grid (→ lösen sich zu px auf).

„lesen"-Lektionen haben `type: "lesen"`, leere `assertions`, kein `solution`/`hint`.
Übungen geben den `css_starter` mit Selektor-Gerüst vor; Hinweise sind konzeptionell
formuliert (nennen die Eigenschaft + Wirkung, nicht den fertigen Code).

---

## Kurs 2 — Flexbox (slug `flexbox-layout`)
Beschreibung: „1D-Layouts mit Flexbox: Elemente entlang einer Achse anordnen,
ausrichten und verteilen — ideal für Navigationen, Toolbars und Karten."

| # | Kapitel | Lektion | Typ | geprüft |
|--|--|--|--|--|
|1|Flexbox-Grundlagen|Was ist Flexbox?|lesen|–|
|2| |Container aktivieren|übung|`display: flex`|
|3| |Richtung bestimmen|übung|`flex-direction: column`|
|4| |Abstände mit gap|übung|`gap: 16px`|
|5|Ausrichtung|Haupt- & Querachse|lesen|–|
|6| |Horizontal verteilen|übung|`justify-content: center`|
|7| |Vertikal ausrichten|übung|`align-items: center`|
|8| |Platz dazwischen|übung|`justify-content: space-between`|
|9|Flex-Items steuern|Wie Items sich verteilen|lesen|–|
|10| |Wachsen mit flex-grow|übung|`flex-grow: 1`|
|11| |Grundbreite flex-basis|übung|`flex-basis: 200px`|
|12| |Einzeln ausrichten|übung|`align-self: flex-end`|
|13| |Reihenfolge mit order|übung|`order: 2`|
|14|Umbruch & Abschluss|Umbruch mit flex-wrap|übung|`flex-wrap: wrap`|
|15| |Mini-Projekt: Navigationsleiste|übung|`display:flex` + `justify-content:space-between` + `align-items:center`|

## Kurs 3 — CSS Grid (slug `css-grid`)
Beschreibung: „2D-Layouts mit CSS Grid: Seiten in Zeilen und Spalten aufbauen,
Bereiche platzieren und ausrichten."

| # | Kapitel | Lektion | Typ | geprüft |
|--|--|--|--|--|
|1|Grid-Grundlagen|Was ist CSS Grid?|lesen|–|
|2| |Grid aktivieren|übung|`display: grid`|
|3| |Spalten definieren|übung|`grid-template-columns: 120px 120px 120px`|
|4| |Abstände mit gap|übung|`gap: 16px`|
|5|Zeilen & flexible Spalten|fr & repeat()|lesen|–|
|6| |Zeilen definieren|übung|`grid-template-rows: 80px 80px`|
|7| |Items horizontal ausrichten|übung|`justify-items: center`|
|8| |Items vertikal ausrichten|übung|`align-items: center`|
|9|Items platzieren|Das Liniensystem|lesen|–|
|10| |Spalte überspannen|übung|`grid-column-start: 1` + `grid-column-end: 3`|
|11| |Zeile überspannen|übung|`grid-row-start: 1` + `grid-row-end: 3`|
|12| |Fluss ändern|übung|`grid-auto-flow: column`|
|13|Ausrichten & Abschluss|Das ganze Grid ausrichten|übung|`justify-content: center`|
|14| |Einzelnes Item ausrichten|übung|`justify-self: end`|
|15| |Mini-Projekt: Galerie-Layout|übung|`display:grid` + `grid-template-columns` + `gap`|

## Kurs 4 — Animationen (slug `animationen`)
Beschreibung: „Bewegung und Übergänge mit CSS: Transitions, Keyframe-Animationen
und Transforms."

| # | Kapitel | Lektion | Typ | geprüft |
|--|--|--|--|--|
|1|Übergänge (Transitions)|Was sind Transitions?|lesen|–|
|2| |Übergangsdauer|übung|`transition-duration: 0.3s`|
|3| |Tempo-Kurve|übung|`transition-timing-function: ease-in-out`|
|4| |Was animiert wird|übung|`transition-property: background-color`|
|5|Sichtbarkeit & Cursor|Durchsichtigkeit|übung|`opacity: 0.5`|
|6| |Mauszeiger|übung|`cursor: pointer`|
|7| |Transforms (verschieben/skalieren/drehen)|lesen|– (live in Vorschau)|
|8|Keyframe-Animationen|Was sind @keyframes?|lesen|–|
|9| |Animation benennen|übung|`animation-name: float`|
|10| |Dauer festlegen|übung|`animation-duration: 2s`|
|11| |Endlos wiederholen|übung|`animation-iteration-count: infinite`|
|12| |Hin & zurück|übung|`animation-direction: alternate`|
|13|Abschluss|Verzögerung|übung|`animation-delay: 1s`|
|14| |Kurzform animation|übung|`animation-duration: 2s` + `animation-iteration-count: infinite`|
|15| |Mini-Projekt: Pulsierender Button|übung|`cursor:pointer` + `transition-duration:0.3s` + `animation-iteration-count:infinite`|

Bei Keyframe-Lektionen (9–12, 15) liefert der `css_starter` die `@keyframes`-Regel
vorab; die Lernenden ergänzen die `animation-*`-Eigenschaften. Ab Lektion 11 läuft
die Animation echt in der Live-Vorschau (das iframe rendert sie).

---

## Datenmodell & Umsetzung
- **Lektionsdaten** je Kurs als eigene JSON-Datei im selben Schema wie `lessons.json`:
  `scripts/lessons-flexbox-layout.json`, `scripts/lessons-css-grid.json`,
  `scripts/lessons-animationen.json`. (CSS-Grundlagen bleibt `lessons.json`.)
- **Kurs-Metadaten** in `scripts/courses.json` (slug, title, level, status, sort,
  description, ggf. unlock_hint, chapters-Reihenfolge) — Single Source für Seed.
- **Seed-Skript** (`directus-seed.ps1`) wird generisch: erzeugt alle Kurse aus
  `courses.json`, je Kurs die Kapitel und die Lektionen aus der zugehörigen Datei.
  Alle drei neuen Kurse erhalten `status: active`.
- **Nicht-destruktives Live-Update** (`directus-add-courses.ps1`): setzt die drei
  Kurse auf `active` und legt für Flexbox/Grid/Animationen Kapitel + Lektionen an
  (scoped wipe nur dieser Kurse, dann insert — CSS-Grundlagen und vorhandener
  Fortschritt bleiben unangetastet, kein Full-Reseed).

## Out of scope (YAGNI)
- Kein stufenweises Freischalten (alle Kurse sofort aktiv).
- Keine Checker-Erweiterung für `transform`/`fr` — bewusst als „lesen"-Lektionen.
- Keine Änderung an Auth, Fortschritts-Logik oder bestehenden CSS-Lektionen.
