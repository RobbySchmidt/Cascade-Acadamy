# Cascade Academy — Kontext & Handoff

> **Zweck dieser Datei:** Vollständiger Übergabe-Kontext, damit eine neue Claude-Instanz
> (oder ein:e Entwickler:in) sofort weiß, was dieses Projekt ist, was bereits gebaut wurde,
> wie es läuft und wo es weitergeht. Stand: **2026-06-17**.

---

## 1. Was ist das Projekt?

**Cascade Academy** ist eine deutschsprachige „CSS lernen by doing"-Lernplattform:
kurze Lektionen, ein CSS-Editor mit Live-Vorschau, ein automatischer Checker, leichte
Gamification (Streak, Stats) und ein (vorerst statischer) Live-Chat.

Gebaut wurde **1:1 nach dem Design-Handoff** in [`design_handoff_cascade_academy/`](design_handoff_cascade_academy/)
(5 Hi-Fi-Screens + `README.md` mit allen Design-Tokens + Screenshots in `screenshots/`).
Die Single Source of Truth des Designs ist `design_handoff_cascade_academy/Cascade Academy.dc.html`.

**UI-Sprache: durchgehend Deutsch.**

### Dokumente
- **Spec:** [`docs/superpowers/specs/2026-06-17-cascade-academy-design.md`](docs/superpowers/specs/2026-06-17-cascade-academy-design.md)
- **Implementierungsplan:** [`docs/superpowers/plans/2026-06-17-cascade-academy.md`](docs/superpowers/plans/2026-06-17-cascade-academy.md)

---

## 2. Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | **Nuxt 4** (Pages-Routing, `app/`-Verzeichnis) |
| Styling | **Tailwind v4** (`@tailwindcss/vite`, Tokens via `@theme` in `app/assets/css/main.css`) |
| Backend/Daten | **Directus** (REST, nur serverseitig angesprochen) |
| Code-Editor | **CodeMirror 6** (`codemirror`, `@codemirror/lang-css`, …) |
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
app/assets/css/main.css               # @theme Design-Tokens
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
scripts/                             # directus-schema.ps1, directus-seed.ps1, lessons.json
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
- **Kurse:** „CSS-Grundlagen" (active) + „Flexbox & Layout" (locked) + „Animationen" (locked).
- **Beispiel-Fortschritt:** testuser-1 hat Lektionen 1–5 als „done" → Kurs ~33 %.

### Die 15 Lektionen (Kurs „CSS-Grundlagen", Quelle: `scripts/lessons.json`)
1. **Selektoren & Grundlagen:** Was ist ein Selektor? (lesen) · Element-Selektoren · Klassen & IDs · Farben setzen
2. **Text & Schrift:** Farbe & Textausrichtung · Schriftgröße & -dicke · Schriftart & Zeilenhöhe · Text dekorieren
3. **Box-Modell:** padding · margin · border · Ecken & Schatten
4. **Hintergrund & Abschluss:** Hintergrund & Verlauf · Größe & Anzeige · Mini-Projekt: Karte stylen

Jede `uebung` hat `assertions` (`[{selector, prop, expected}]`), `hint` und `solution`.
Die Lösungen erfüllen ihre Assertions (in Phase-1-Review geprüft).

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

---

## 7. So läuft die App

```bash
yarn install          # falls nötig
yarn dev              # → http://localhost:3000   (Login: testuser-1 / test1234)
yarn build            # Produktionsbuild (kompiliert alles inkl. Server-Routen)
yarn test             # 10 Unit-Tests (Session + Checker)
```

**Directus-Schema/Seed neu aufsetzen (PowerShell!):**
```powershell
powershell -File scripts/directus-schema.ps1   # idempotent (legt cascade_* an)
powershell -File scripts/directus-seed.ps1     # wipe + reseed der cascade_*-Daten
```

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

---

## 9. Was ist FERTIG ✅

- Alle 5 Screens, pixelnah am Design (gegen Screenshots abgeglichen).
- Directus-Collections + Seed (2 User, 3 Kurse, 4 Kapitel, 15 Lektionen, Beispiel-Fortschritt).
- Server-API (Auth, Kurse, Lektionen, Fortschritt) — getestet.
- Checker inkl. Farb-Normalisierung + Cross-Browser-Shorthand-Fallback.
- Login/Logout/Gast + Auth-Gating; Fortschritt pro User bzw. lokal für Gäste.
- `yarn build` grün · `yarn test` 10/10 grün · End-to-End-HTTP-Smoke aller Routen grün.

## 10. Was ist NOCH OFFEN / bewusst weggelassen (YAGNI)

- **Manueller Browser-Klicktest des Editors** steht noch aus: In der bisherigen Umgebung gab es
  kein Browser-Automation-Tool, daher wurde das *interaktive* Tippen im CodeMirror + „Code prüfen"
  nur per Code-Review/Logik verifiziert, nicht live geklickt. → **Einmal durch Lektion 5 klicken.**
- **Live-Chat ist statischer Mock** (keine Persistenz, kein Realtime). Senden hängt nur lokal an.
- **Nur der Anfänger-Kurs hat Inhalte.** „Flexbox & Layout" und „Animationen" sind gesperrte Platzhalter.
- **Kein Passwort-Hashing, kein echtes Directus-Auth** (bewusst, Test-Setup). Vor echtem Einsatz: hashen.
- Cookie `secure`-Flag ist nur in `production` aktiv. „vergessen?"/„Konto erstellen" sind nicht verdrahtet.
- Keine Illustrationen (nur Gradients + „Light-Circles" wie im Design).

### Sinnvolle nächste Schritte
1. Editor-Flow im echten Browser durchklicken & ggf. Feintuning.
2. Weitere Kurse (Flexbox, Animationen) mit Inhalten füllen (gleiches Lesson-Schema).
3. Optional: echtes Auth + Passwort-Hashing, Chat persistent/realtime, „Konto erstellen"-Flow.

---

## 11. Konventionen

- **Deutsche UI-Copy exakt** (ä/ö/ü/ß) — Dateien als UTF-8 speichern.
- Tailwind-Tokens als Utilities (`bg-teal-600`, `text-text-muted`, `font-display`, `shadow-card`,
  `rounded-pill`, …); exakte Hex-/Gradient-Werte bei Bedarf als Arbitrary-Values/Inline-Styles
  aus dem Design-README.
- Komponenten sind klein & fokussiert; Lektions-Subkomponenten liegen unter `app/components/lesson/`
  (Auto-Import-Name mit Prefix, z. B. `LessonCodeEditor`).
- **Kein Git** in diesem Projekt (kein Repo initialisiert).
