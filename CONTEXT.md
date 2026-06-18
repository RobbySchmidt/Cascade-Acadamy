# Cascade Academy — Kontext & Handoff

> **Zweck dieser Datei:** Vollständiger Übergabe-Kontext, damit eine neue Claude-Instanz
> (oder ein:e Entwickler:in) sofort weiß, was dieses Projekt ist, was bereits gebaut wurde,
> wie es läuft und wo es weitergeht. Stand: **2026-06-18**.

---

## 1. Was ist das Projekt?

**Cascade Academy** ist eine deutschsprachige „CSS lernen by doing"-Lernplattform:
kurze Lektionen, ein CSS-Editor mit Live-Vorschau, ein automatischer Checker, leichte
Gamification (Streak, Stats) und ein (vorerst statischer) Live-Chat.

Gebaut wurde nach dem Design-Handoff in [`design_handoff_cascade_academy/`](design_handoff_cascade_academy/)
(5 Hi-Fi-Screens + `README.md` mit allen Design-Tokens + Screenshots in `screenshots/`).
Die Single Source of Truth des Designs ist `design_handoff_cascade_academy/Cascade Academy.dc.html`.

> **Design-Direction: DARK.** Der Handoff wurde am 2026-06-18 auf ein dunkles,
> teal-getöntes Theme überarbeitet und die gesamte UI darauf umgestellt (near-black
> `#0B1715`, Teal-Akzent `#12B5A5`, dunkler Text *auf* Teal `#06201C`). Dazu kamen:
> **Lucide-Icons** statt Unicode-Glyphen, eine **Page-Transition** (`app.pageTransition`
> in `nuxt.config.ts` + CSS in `main.css`) und der Logout-Button mit `LogOut`-Icon.

**UI-Sprache: durchgehend Deutsch.**

### Dokumente
- **Spec (Initial):** [`docs/superpowers/specs/2026-06-17-cascade-academy-design.md`](docs/superpowers/specs/2026-06-17-cascade-academy-design.md)
- **Spec (weitere Kurse):** [`docs/superpowers/specs/2026-06-18-weitere-kurse-design.md`](docs/superpowers/specs/2026-06-18-weitere-kurse-design.md)
- **Implementierungsplan:** [`docs/superpowers/plans/2026-06-17-cascade-academy.md`](docs/superpowers/plans/2026-06-17-cascade-academy.md)

---

## 2. Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | **Nuxt 4** (Pages-Routing, `app/`-Verzeichnis) |
| Styling | **Tailwind v4** (`@tailwindcss/vite`, Tokens via `@theme` in `app/assets/css/main.css`) |
| Backend/Daten | **Directus** (REST, nur serverseitig angesprochen) |
| Code-Editor | **CodeMirror 6** (`codemirror`, `@codemirror/lang-css`, …) |
| Icons | **lucide-vue-next** (pro Komponente importiert, nicht auto-importiert) |
| Tests | **Vitest** (+ happy-dom) |
| Paketmanager | **yarn** (yarn.lock) |
| Fonts | Bricolage Grotesque · Plus Jakarta Sans · JetBrains Mono (Google Fonts) |

---

## 3. Architektur (Kurzüberblick)

```
Browser  ──►  Nuxt Pages (app/pages)  ──►  eigene Nitro-API (server/api/*)  ──►  Directus
                                            (hält den Admin-Token serverseitig)
```

- **Directus-Token bleibt IMMER serverseitig.** Der Browser ruft nur die eigenen
  `/api/*`-Endpunkte. Token + URL liegen in `runtimeConfig` (nicht `public`).
- **Auth ohne Directus-Auth:** eigener Login gegen `cascade_users`, Vergleich serverseitig,
  Session über **signiertes httpOnly-Cookie** (`cascade_session`, HMAC).
- **Gast-Modus:** „Ohne Konto loslernen" setzt ein nicht-httpOnly-Cookie `cascade_guest=1`;
  Fortschritt liegt dann in `localStorage` (`useGuestProgress`).
- **Auth-Gating:** globale Middleware `app/middleware/auth.global.ts` schickt nicht-
  eingeloggte & nicht-Gast-User auf `/login`.

---

## 4. Verzeichnisstruktur (wichtigste Dateien)

```
.env                                  # DIRECTUS_URL, DIRECTUS_TOKEN, NUXT_SESSION_SECRET
nuxt.config.ts                        # runtimeConfig + Google-Fonts-Head
app/assets/css/main.css               # @theme Dark-Tokens + Page-Transition + cursor:pointer-Basisregel
app/app.vue · app/layouts/            # default (mit Nav) · blank (Login)
app/middleware/auth.global.ts         # Auth-Gating
app/composables/
  useAuth.ts                          # user-State, login/logout/fetchMe, isGuest
  useGuestProgress.ts                 # localStorage-Fortschritt für Gäste
app/utils/
  checker.ts                          # Farb-Normalisierung + Assertion-Auswertung (getestet)
  chatMock.ts                         # statische Chat-Daten
app/components/                       # BrandLogo, AppNav, LightCircles, ProgressBar,
                                      # CourseCard, LessonRow, StatTile, ChatPanel
app/components/lesson/                # CodeEditor, LivePreview, CheckPanel
app/pages/
  index.vue                           # → redirect /kurse
  login.vue · kurse/index.vue · kurse/[slug].vue · lektion/[id].vue · profil.vue
server/utils/                         # directus.ts, session.ts, currentUser.ts
server/api/                           # auth/login|logout, me, courses, courses/[slug],
                                      # lessons/[id], progress
scripts/                             # directus-schema.ps1, directus-seed.ps1 (generisch),
                                      # directus-add-courses.ps1 (nicht-destruktiv),
                                      # directus-sync-lessons.ps1, courses.json,
                                      # lessons.json (+ lessons-flexbox-layout / -css-grid / -animationen.json)
test/                                # session.test.ts, checker.test.ts (10 Tests, grün)
```

---

## 5. Directus-Datenmodell

Die Instanz hostet bereits ein **fremdes CMS** mit vielen Collections — deshalb ist alles
mit **`cascade_`** geprefixt. **Niemals** Nicht-`cascade_`- oder `directus_*`-Collections anfassen.

| Collection | Felder (wichtig) |
|---|---|
| `cascade_users` | username, email, display_name, avatar_initials, **password (Klartext, Test!)**, streak, started_at |
| `cascade_courses` | title, slug, level (Anfänger/Mittel/Fortgeschritten), description, status (active/locked), unlock_hint, sort |
| `cascade_chapters` | course (M2O), title, sort |
| `cascade_lessons` | chapter (M2O), course (M2O), title, type (lesen/uebung), task, html, css_starter, solution, hint, **assertions (JSON)**, sort |
| `cascade_progress` | user (M2O), lesson (M2O), course (M2O), status (done), completed_at |

> Alle PKs sind Auto-Increment-Integer.

### Seed-Daten (siehe `scripts/`)
- **Users:** `testuser-1` (Mara K. / „MK", streak 5) und `testuser-2` (Tom B. / „TB", streak 0).
  **Passwort beider: `test1234`.** Login per Benutzername **oder** E-Mail (`…@cascade.local`).
- **4 Kurse, alle `active`** (Quelle: `scripts/courses.json`):
  1. **CSS-Grundlagen** (Anfänger) → `lessons.json`
  2. **Flexbox** (Mittel, 1D) → `lessons-flexbox-layout.json`  (slug bleibt `flexbox-layout`)
  3. **CSS Grid** (Mittel, 2D) → `lessons-css-grid.json`
  4. **Animationen** (Fortgeschritten) → `lessons-animationen.json`
- Jeder Kurs: **4 Kapitel, 15 Lektionen** (3× `lesen` + 12× `uebung`), je mit Mini-Projekt am Ende.
- **Beispiel-Fortschritt:** testuser-1 hat CSS-Grundlagen-Lektionen 1–5 als „done".

### Lektions-Dateien & Schema
- Lektionen liegen **pro Kurs** in einer eigenen JSON; `courses.json` verknüpft slug → Datei.
- Kapitel werden aus der Reihenfolge der `chapter`-Felder in der Lektionsdatei abgeleitet
  (Seed + Add-Skript erzeugen sie automatisch).
- Jede `uebung` hat `assertions` (`[{selector, prop, expected}]`), `hint` (konzeptionell,
  **verrät nicht** den Code) und `solution`. `lesen`-Lektionen haben leere `assertions`.
- **Checker-Regel beim Aufgaben-Design:** Kein `expected` darf dem Element-Default
  entsprechen (sonst besteht leeres CSS sofort — war ein Bug in CSS-Lektion 6, dort
  `h1`→`p` geändert). `transform`/`:hover`/`fr`/`repeat()` sind nicht statisch prüfbar
  → bewusst als `lesen`-Lektionen umgesetzt.

---

## 6. Der Checker (Kern-Feature)

`app/utils/checker.ts` + Einsatz in `app/pages/lektion/[id].vue`:
1. `LivePreview.vue` rendert `<iframe sandbox="allow-same-origin" srcdoc>` mit `<style>{userCSS}</style>{html}`.
2. Auf „Code prüfen" liest `evalAssertions(iframeDoc, assertions)` je Assertion
   `getComputedStyle(el).getPropertyValue(prop)`.
3. **Farb-Normalisierung:** `teal` ≡ `#008080` ≡ `rgb(0,128,128)` (DOM-Resolve + Hex/Named-Fallback).
4. **Shorthand-Fallback (Cross-Browser):** `border-width`/`border-style`/`border-radius` etc.
   fallen auf Longhands (`border-top-width`, …) zurück, falls der Browser den Shorthand leer liefert.
5. Alle erfüllt → „Weiter →" aktiv → POST `/api/progress` → nächste Lektion. `lesen`-Lektionen
   haben keine Assertions und sind sofort „durch".

**Editor-UX (in `lektion/[id].vue`):**
- Bei `lesen`-Lektionen sind **PRÜFUNG-Panel und „Lösung anzeigen" ausgeblendet** (`hasCheck`/`canShowSolution`).
- Die PRÜFUNG-Liste zeigt **nur `selektor · prop`**; den `expected`-Wert erst, wenn das
  Kriterium erfüllt ist (sonst wäre der Check eine Lösungs-Anzeige).
- **„Lösung anzeigen" ist umkehrbar** (Toggle „Lösung verbergen", sichert den User-Code).
- Footer-„← Zurück" geht **eine Lektion zurück** (`prevLessonId` aus der API); Pfeil/✕ schließen zur Kursdetailseite.
- Hinweise & Aufgaben rendern Backtick-`code` als Mono-Chips (gleiche `splitOnBackticks`-Logik).
- Die **Live-Vorschau-Box** ist auf den hellen Editor-Ton `#F3FAF8` getönt (bleibt hell, egal ob Code-Theme hell/dunkel).

---

## 7. So läuft die App

```bash
yarn install          # falls nötig
yarn dev              # → http://localhost:3000   (Login: testuser-1 / test1234)
yarn build            # Produktionsbuild (kompiliert alles inkl. Server-Routen)
yarn test             # 10 Unit-Tests (Session + Checker)
```

**Directus-Daten pflegen (PowerShell!):**
```powershell
powershell -File scripts/directus-schema.ps1        # idempotent (legt cascade_* an)
powershell -File scripts/directus-seed.ps1          # WIPE + reseed ALLER cascade_*-Daten (alle 4 Kurse aus courses.json)
powershell -File scripts/directus-add-courses.ps1   # NICHT-destruktiv: nur Flexbox/Grid/Animationen anlegen/aktualisieren
powershell -File scripts/directus-sync-lessons.ps1  # NICHT-destruktiv: Lektions-Texte (CSS-Grundlagen) per sort patchen
```
> Die `add-courses`/`sync-lessons`-Skripte sind idempotent und lassen Fortschritt
> unangetastet — bevorzugt für gezielte Updates statt eines vollen Re-Seeds.

---

## 8. ⚠️ Umgebungs-Gotchas (WICHTIG für die nächste Session)

1. **Directus ist NICHT über das Bash-Tool erreichbar** (`curl` → 000, Sandbox-Netzwerk).
   Für manuelle Directus-Calls und die Seed-/Schema-Scripts **PowerShell** (`Invoke-RestMethod`) nutzen.
2. **Unvollständige TLS-Zertifikatskette** auf dem Directus-Host (`directuscon.axtlust.de`):
   Node bricht sonst mit `UNABLE_TO_VERIFY_LEAF_SIGNATURE` ab. Deshalb sind `dev`/`build`/
   `generate`/`preview` in `package.json` mit `cross-env NODE_OPTIONS=--use-system-ca` gewrappt.
   Jeder neue Run-Befehl, der Directus spricht, braucht dieses Flag (oder das Host-Cert wird repariert).
3. **`useCookie` parst `'1'` auf dem Server zu Zahl `1`** → Gast-Check nutzt darum `String(...) === '1'`.
4. Beim Dev kann ein **verwaister Nuxt-Dev-Server auf Port 3000** hängen bleiben — ggf. vorhandenen
   Server weiterverwenden oder Node-Prozess beenden.
5. **Checker prüft `getComputedStyle`** — entspricht ein `expected` dem Element-Default
   (z. B. `h1` ist von Haus aus `font-size:32px`/`font-weight:700`), besteht leeres CSS
   sofort. Beim Anlegen neuer Lektionen Default-Kollisionen vermeiden (siehe §5).
6. **`getComputedStyle` lässt sich hier nicht headless prüfen** (happy-dom rechnet Flex/Grid
   nicht aus, kein Browser im Sandbox). Neue Lektionen sind gegen das bekannte Chromium-
   Verhalten entworfen, aber **nicht** live geklickt → vor Release einmal durchklicken.

---

## 9. Was ist FERTIG ✅

- Alle 5 Screens im **dunklen Theme** (gegen die Dark-Screenshots im Handoff abgeglichen).
- **Lucide-Icons** durchgängig, **Page-Transition**, Pointer-Cursor auf allem Klickbaren.
- **4 Kurse** (CSS-Grundlagen, Flexbox, CSS Grid, Animationen), je 4 Kapitel / 15 Lektionen,
  alle aktiv — in Directus angelegt + als Seed-Quelle (`courses.json` + Lektionsdateien).
- Server-API (Auth, Kurse, Lektionen, Fortschritt inkl. `prevLessonId`) — getestet.
- Checker inkl. Farb-Normalisierung + Cross-Browser-Shorthand-Fallback; PRÜFUNG verrät die
  Lösung nicht mehr; Lösung-Toggle; `lesen`-Lektionen ohne Check/Lösung.
- Login/Logout/Gast + Auth-Gating; Fortschritt pro User bzw. lokal für Gäste.
- `yarn build` grün · `yarn test` 10/10 grün.

## 10. Was ist NOCH OFFEN / bewusst weggelassen (YAGNI)

- **Manueller Browser-Klicktest** steht weiterhin aus (kein Browser im Sandbox-Tooling).
  Besonders die **neuen 45 Lektionen** (Flexbox/Grid/Animationen) sind logisch/gegen
  Chromium-Defaults entworfen, aber nicht live geklickt — vor Release durchspielen
  (v. a. `gap` → `"16px"` und `grid-template-columns` → `"120px 120px 120px"` gegenprüfen).
- **Live-Chat ist statischer Mock** (keine Persistenz, kein Realtime). Senden hängt nur lokal an.
- **Kein Passwort-Hashing, kein echtes Directus-Auth** (bewusst, Test-Setup). Vor echtem Einsatz: hashen.
- Cookie `secure`-Flag ist nur in `production` aktiv. „vergessen?"/„Konto erstellen" sind nicht verdrahtet.
- **Kein stufenweises Freischalten** — alle Kurse sofort aktiv (bewusst). `unlock_hint`/`status:locked`
  sind im Schema noch vorhanden, falls Gating später gewünscht ist.
- Keine Illustrationen (nur Gradients + Teal-Glow + „Light-Circles" wie im Design).

### Sinnvolle nächste Schritte
1. Alle Kurse im echten Browser durchklicken & ggf. einzelne Assertions feinjustieren.
2. Optional: stufenweises Freischalten (Status serverseitig aus Fortschritt ableiten).
3. Optional: echtes Auth + Passwort-Hashing, Chat persistent/realtime, „Konto erstellen"-Flow.

---

## 11. Konventionen

- **Deutsche UI-Copy exakt** (ä/ö/ü/ß) — Dateien als UTF-8 speichern.
- Tailwind-Tokens als Utilities (`bg-teal-600`, `text-text-muted`, `font-display`, `shadow-card`,
  `rounded-pill`, …); exakte Hex-/Gradient-Werte bei Bedarf als Arbitrary-Values/Inline-Styles
  aus dem Design-README.
- Komponenten sind klein & fokussiert; Lektions-Subkomponenten liegen unter `app/components/lesson/`
  (Auto-Import-Name mit Prefix, z. B. `LessonCodeEditor`).
- **Git:** Repo initialisiert, Hauptarbeit auf Branch `development` (Default `main`). Der/die
  Nutzer:in committet selbst — nicht ungefragt committen/pushen.
- **Dark-Theme-Tokens** liegen als `@theme`-Variablen in `main.css`; Text *auf* Teal nutzt
  `text-on-teal` (`#06201C`), Teal-Text auf Dunkel `text-teal-700` (`#3FD9C9`). Lucide-Icons
  werden pro Komponente importiert (kein Auto-Import).
