# Cascade Academy — Design Spec

**Datum:** 2026-06-17
**Status:** Genehmigt (User-Freigabe „passt alles")

CSS-Lernplattform „by doing": kurze Lektionen, CSS-Editor mit Live-Vorschau,
automatischer Checker, leichte Gamification + statischer Live-Chat. Nachbau der
fünf Hi-Fi-Screens aus `design_handoff_cascade_academy/` (Single Source of Truth:
`Cascade Academy.dc.html` + README + Screenshots). UI-Sprache: **Deutsch**.

---

## 1. Tech & Architektur

- **Nuxt 4** (Pages-Routing, `app/`-Verzeichnis), **Tailwind v4** (`@theme`-Tokens),
  Google Fonts: Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono.
- **Directus-Zugriff ausschließlich serverseitig** über Nitro-Server-Routen
  (`server/api/...`). Admin-Token aus `.env` (`DIRECTUS_URL`, `DIRECTUS_TOKEN`)
  bleibt server-side; der Browser ruft nur eigene Endpunkte. Token als
  Runtime-Config (`runtimeConfig.directusToken`, NICHT public).
- **Session:** signiertes httpOnly-Cookie mit User-ID (`nuxt-session` o. eigenes
  Cookie via `setCookie`/`getCookie` + HMAC). Kein Directus-Auth.
- **Gast-Modus:** „Ohne Konto loslernen" → kein Cookie; Fortschritt in
  `localStorage`. Eingeloggte User → Fortschritt in `cascade_progress`.
- **Wichtig (Dev-Umgebung):** Direkte Netzwerk-Calls zu Directus funktionieren in
  der Bash-Sandbox NICHT (`curl` → 000). Für Schema-/Seed-Skripte und manuelle
  Tests **PowerShell** (`Invoke-RestMethod`) verwenden. Die laufende Nuxt-App
  spricht Directus serverseitig über `$fetch`/`ofetch` an (funktioniert zur
  Laufzeit normal).

## 2. Directus-Datenmodell (Prefix `cascade_`)

Bestehende Instanz enthält ein fremdes CMS — daher alles mit `cascade_` prefixen,
keine Systemcollections anfassen.

### `cascade_users`
| Feld | Typ | Notiz |
|---|---|---|
| `id` | uuid (PK) | |
| `username` | string | z.B. `testuser-1`, unique |
| `email` | string | z.B. `testuser-1@cascade.local`, unique |
| `display_name` | string | z.B. „Mara K." |
| `avatar_initials` | string | z.B. „MK" |
| `password` | string | Klartext (Test-Setup, nur serverseitig verglichen) |
| `streak` | integer | Tage-Streak (gespeichert) |
| `started_at` | date | „Lernt seit X Tagen" wird daraus berechnet |

### `cascade_courses`
`title`, `slug` (unique), `level` (Anfänger | Mittel | Fortgeschritten),
`description`, `status` (active | locked), `unlock_hint` (string, für locked),
`sort` (int).

### `cascade_chapters`
`course` (M2O → cascade_courses), `title`, `sort` (int).

### `cascade_lessons`
`chapter` (M2O), `course` (M2O), `title`, `type` (lesen | uebung),
`task` (text, darf inline-`code`-Markup enthalten), `html` (text, read-only Block),
`css_starter` (text), `solution` (text), `hint` (text),
`assertions` (json: `[{ selector, prop, expected }]`), `sort` (int).

### `cascade_progress`
`user` (M2O → cascade_users), `lesson` (M2O), `course` (M2O),
`status` (done), `completed_at` (timestamp). Unique pro (user, lesson).

**Abgeleitete Werte (nicht gespeichert):** erledigte Lektionen, Kurs-% =
done/total, abgeschlossene Kapitel, „x von y Lektionen". Streak gespeichert.

## 3. Seed-Daten

- **Users:** `testuser-1` (display „Mara K.", initials „MK"),
  `testuser-2` (display „Tom B.", initials „TB"). Passwort beider: `test1234`.
  `started_at` = vor 12 Tagen, `streak` = 5 (testuser-1).
- **Kurse:**
  - „CSS-Grundlagen" — slug `css-grundlagen`, level Anfänger, status active.
  - „Flexbox & Layout" — level Mittel, status locked, unlock_hint „Schließe
    CSS-Grundlagen ab".
  - „Animationen" — level Fortgeschritten, status locked.
- **Kapitel + 15 Lektionen** siehe §4.
- **Beispiel-Fortschritt:** für testuser-1 optional einige Lektionen als done
  setzen, damit das Design (Hero „Weiterlernen", %-Anzeige) lebendig wirkt.

## 4. Die 15 Lektionen — Kurs „CSS-Grundlagen"

Jede `uebung` hat: `task`, `html` (read-only), `css_starter`, `assertions`,
`hint`, `solution`. `lesen` hat nur Inhalt + „Weiter".

**Kapitel 1 · Selektoren & Grundlagen**
1. **Was ist ein Selektor?** (lesen) — kurze Erklärung, kein Check.
2. **Element-Selektoren** (uebung) — `p` blau färben → `{selector:'p',prop:'color',expected:'blue'}`.
3. **Klassen & IDs** (uebung) — `.box` Hintergrund setzen → `background-color`.
4. **Farben setzen** (uebung) — `color` + `background-color` an einem Element.

**Kapitel 2 · Text & Schrift**
5. **Farbe & Textausrichtung** (uebung) — *Design-Beispiel*: `h1` `color: teal` +
   `text-align: center`. Assertions: color teal, text-align center.
6. **Schriftgröße & -dicke** (uebung) — `font-size`, `font-weight`.
7. **Schriftart & Zeilenhöhe** (uebung) — `font-family`, `line-height`.
8. **Text dekorieren** (uebung) — `text-transform: uppercase`, `text-decoration`.

**Kapitel 3 · Box-Modell**
9. **Innenabstand (padding)** (uebung) — `padding`.
10. **Außenabstand (margin)** (uebung) — `margin`.
11. **Rahmen (border)** (uebung) — `border`.
12. **Ecken & Schatten** (uebung) — `border-radius`, `box-shadow`.

**Kapitel 4 · Hintergrund & Abschluss**
13. **Hintergrund & Verlauf** (uebung) — `background-color` / `background` (gradient).
14. **Größe & Anzeige** (uebung) — `width`, `display`.
15. **Mini-Projekt: Karte stylen** (uebung) — Kombination mehrerer Properties
    (padding + border-radius + box-shadow + background) mit mehreren Assertions.

## 5. Seiten & Routen

| Route | Screen | Quelle |
|---|---|---|
| `/login` | Login (Split-Layout, Nav versteckt) | 0-login |
| `/kurse` | Kursübersicht (Hero + 3-Spalten-Grid) | 1-kursuebersicht |
| `/kurse/[slug]` | Kursdetail (Kapitel + Lektions-Status) | 2-kursdetail |
| `/lektion/[id]` | Lektion-Editor (Kernscreen) | 3-lektion-* |
| `/profil` | Profil (Banner, Stat-Tiles, Chat) | 4-profil-* |

- **Layout:** Top-Nav (Logo, „Kurse", „Profil", Avatar). Auf `/login` versteckt.
  Aktiver Nav-Eintrag: `#DFF6F3`-Pill + `#0E7A70`-Text.
- **Navigation** exakt nach README §Interactions.

## 6. Lektion-Editor (Kern)

- **Top-Bar:** Zurück-Pfeil (→ Detail), Breadcrumb + Titel, Hell/Dunkel-Code-Switch
  (segmented pill), „Lektion n / 15" + Progressbar, ✕ (→ Detail).
- **Task-Strip:** `#DFF6F3`-Band, Eyebrow „DEINE AUFGABE", Task-Text (inline-`code`
  als Mono-Chip), „💡 Hinweis"-Button (toggelt `hint`).
- **Links (55%):** read-only HTML-Block (themed) + CSS-Editor (**CodeMirror 6**,
  CSS-Mode, Theme Hell/Dunkel — Default **Dunkel**). Gutter mit Zeilennummern.
- **Rechts (45%):** Live-Vorschau (sandboxed `<iframe srcdoc>` aus html+userCss) +
  Check-Panel („PRÜFUNG", „x / n erfüllt", pro Assertion Pass/Fail-Reihe),
  „Code prüfen"-Button.
- **Footer:** „← Zurück" (→ Detail) · „Lösung anzeigen" (füllt Editor mit
  `solution`) · „Weiter →" (aktiv wenn alle Assertions erfüllt; speichert
  Fortschritt + nächste Lektion).
- **Code-Theme-Switch** rethemed nur die zwei Code-Blöcke (CSS-Variablen-Subtree).

### Checker
Bei „Code prüfen": HTML+User-CSS in sandboxed iframe rendern, je Assertion
`getComputedStyle(el).getPropertyValue(prop)` lesen, normalisieren
(Farben über Canvas/temp-Element → `rgb(...)`, Whitespace/Case), mit `expected`
vergleichen. Pro-Assertion Pass/Fail + Gesamtzähler. Alle erfüllt → „Weiter →"
aktiv + POST Fortschritt.

## 7. Server-API (Nitro)

| Endpunkt | Zweck |
|---|---|
| `POST /api/auth/login` | username/email + password gegen `cascade_users`; Cookie setzen |
| `POST /api/auth/logout` | Cookie löschen |
| `GET /api/me` | aktueller User (oder null/Gast) |
| `GET /api/courses` | alle Kurse + abgeleiteter Fortschritt des Users |
| `GET /api/courses/[slug]` | Kurs + Kapitel + Lektionen + Status |
| `GET /api/lessons/[id]` | eine Lektion (inkl. assertions; `solution` ok) |
| `POST /api/progress` | Lektion als done markieren (eingeloggt → Directus) |

Gast-Fortschritt: rein clientseitig (`localStorage`), `/api/progress` no-op für Gäste.

## 8. Design-System

- `app/assets/css/main.css`: `@import "tailwindcss";` + `@theme` mit allen
  Tokens aus README (Farben, Radii, Schatten, Fonts). Google-Fonts-Link in
  `nuxt.config` (`app.head`).
- Wiederkehrendes Motiv „light circles": absolute, translucent-weiße Kreise, off-edge,
  als wiederverwendbare Komponente/Utility.
- Komponenten: `AppNav`, `LightCircles`, `CourseCard`, `LessonRow`, `ProgressBar`,
  `StatTile`, `CodeEditor` (CodeMirror-Wrapper), `LivePreview`, `CheckPanel`,
  `ChatPanel` (statisch), `BrandLogo` (Inline-SVG).

## 9. Live-Chat (statisch / Mock)

Profil-Chat sieht 1:1 wie Design aus, aber mit fest hinterlegten Mock-Daten:
Filter „Alle · 14" / „Mein Kurs · 5", Online-Liste (inkl. Mentor-Badge, „Du"-Row),
Thread mit eingehenden/eigenen/Mentor-Bubbles. Senden = optimistisch in lokalem
State, nicht persistiert. Kein Realtime.

## 10. Scope / YAGNI (jetzt NICHT)

- Kein echtes Directus-Auth, kein Passwort-Hashing (Test-Setup).
- Kein Realtime-Chat, keine Chat-Persistenz.
- Nur der Anfänger-Kurs hat Inhalte; die zwei anderen Kurse sind nur „locked"-Karten.
- Keine Illustrationen (Gradients + Light-Circles wie im Design).
- „vergessen?"/„Konto erstellen" sind sichtbar, aber nicht funktional verdrahtet
  (führen auf Login/Overview wie im Prototyp).
