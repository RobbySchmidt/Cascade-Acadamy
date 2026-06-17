# Handoff: Cascade Academy — CSS-Lernplattform

## Overview
Cascade Academy is a browser-based platform for learning CSS "by doing": short
lessons, a code editor with live preview, automatic checking of each task, plus
light gamification (streak, stats) and a live chat. This package documents the
**high-fidelity** design for five screens: **Login, Course Overview (Kursübersicht),
Course Detail (Kursdetail), Lesson Editor (Lektion), and Profile (Profil)**.

The product is German-language (all UI copy is in German). Keep the copy as-is
unless localization is explicitly requested.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes
showing the intended look and behavior. They are **not production code to copy
directly**. The HTML files are authored as "Design Components" (a prototyping
format) and use inline styles + a small runtime; do **not** ship that runtime.

Your task is to **recreate these designs in the target codebase's environment**
using its established patterns, component library, and conventions. If no
codebase exists yet, React + a modern CSS approach (CSS Modules, Tailwind, or
styled-components) is a natural fit for this design — but choose whatever best
matches the project.

The single source of truth for the final design is **`Cascade Academy.dc.html`**
(all five hifi screens). The other files are earlier-stage references (see Files).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are all
specified below. Recreate the UI pixel-perfectly using the codebase's existing
libraries and patterns. The wireframe file (`Wireframes - LernCSS.dc.html`) is
**low-fidelity** and included only as a structural/flow reference.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| `--teal-600` (primary) | `#12B5A5` | Buttons, active states, progress fill, brand icon, primary accent |
| `--teal-700` (primary-dark) | `#0E7A70` | Gradients, hovers, headings on teal, "Academy" wordmark |
| `--teal-500` (gradient end) | `#3AC9B0` | Banner gradient highlight |
| `--teal-soft` | `#DFF6F3` | Soft accent background (task strip, chips, active nav pill) |
| `--teal-soft-border` | `#CDEDE8` | Borders on soft-teal surfaces |
| `--success` | `#2BB673` | Check marks, "done" state (independent of accent) |
| `--success-soft` | `#E5F6ED` | "abgeschlossen" badge background |
| `--bg` | `#F3FAF8` | App background (very light teal) |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-alt` | `#FBFDFC` | Input backgrounds, locked rows |
| `--border` | `#DCEBE7` | Default card/divider border |
| `--border-2` | `#E8F0EE` | Lighter border (locked course cards) |
| `--text` | `#1F2A28` | Primary text |
| `--text-muted` | `#6E807C` | Secondary text |
| `--text-faint` | `#8A9794` / `#A6B2AF` | Tertiary/disabled text |

**Secondary accents (Profile stat tiles only):**
| Color | Values |
|---|---|
| Orange | text `#C2640C`, label `#9C6232`, gradient `#FFF1E6→#FFE2CC`, border `#FBD3B4`, circle `rgba(194,100,12,0.12)` |
| Violet | text `#5B4BD0`, label `#5C548C`, gradient `#EEECFB→#E0DCF8`, border `#CFC9F0`, circle `rgba(91,75,208,0.12)` |
| Teal | text `#0E7A70`, label `#3C7A72`, gradient `#E7F8F4→#D2F2EB`, border `#BFEAE0`, circle `rgba(18,181,165,0.13)` |

### Code editor themes (Lesson screen — user-switchable Hell/Dunkel)
| Token | Light (Hell) | Dark (Dunkel) |
|---|---|---|
| code bg | `#FBFAF6` | `#1B1A2E` |
| code surface (HTML block) | `#F3F0E9` | `#16162A` |
| code edge/border | `#E6DED3` | `#2A2942` |
| gutter bg | `#F1EDE6` | `#161628` |
| gutter text | `#BBB2A7` | `#565273` |
| code text | `#3A332E` | `#E6E3F5` |
| code muted (readonly) | `#9A9189` | `#8E89A8` |
| syntax: selector/tag | `#1F2937` | `#FFCB6B` |
| syntax: property | `#2563EB` | `#82AAFF` |
| syntax: value | `#15803D` | `#C3E88D` |

Default code theme = **Dark**.

### Typography
- **Display / headings:** `Bricolage Grotesque` (weights 500/600/700/800), letter-spacing -0.3 to -0.5px on large sizes.
- **UI / body:** `Plus Jakarta Sans` (weights 400/500/600/700).
- **Code / mono:** `JetBrains Mono` (weights 400/500/700).

Type scale (approx, px): hero title 36 / 32 · screen title 30 / 27 / 26 · section
heading 18 · card title 20–22 · body 15–17 · label/meta 12.5–14 · uppercase
eyebrow 11.5–12 (letter-spacing 0.6–1.2px, `text-transform:uppercase`).

### Radii
Pills/chips `999px` · large cards/banners `18–22px` · cards `15–16px` · inputs &
inner blocks `10–13px` · small controls/icon buttons `9–11px` · brand icon `11px`.

### Shadows
- Card: `0 10px 24px -18px rgba(31,42,40,0.22)`
- Elevated card / lesson panel: `0 14px 36px -20px rgba(31,42,40,0.25)` / `0 18px 50px -22px rgba(31,42,40,0.22)`
- Teal banner: `0 20px 44px -22px rgba(14,122,112,0.7)`
- Primary button: `0 8px 18px -8px rgba(18,181,165,0.9)` (scale up to `20px -8px` on large CTAs)
- Focus ring (inputs): `0 0 0 3px rgba(18,181,165,0.15)` + border `#12B5A5`

### Spacing
Page max-width: **1180px** (overview/lesson), **920px** (detail/profile).
Page padding: ~28–32px horizontal. Card padding: 18–24px. Grid/flex gaps: 16–22px.

### Signature design element — "light circles"
A recurring motif: large translucent white circles (`rgba(255,255,255,0.06–0.12)`)
bleeding off the edges of teal gradient surfaces (hero, course header, login
panel, profile banner). Echoed on the profile stat tiles as a soft colored circle
(`rgba(accent, 0.12)`) in the bottom-right, plus a white `rgba(255,255,255,0.6)`
icon bubble top-right. Use `position:absolute` + `overflow:hidden` on the parent.

---

## Screens / Views

### 0 · Login
- **Purpose:** Sign in, or start without an account (progress stored locally).
- **Layout:** Full-height split. Left = flexible brand panel; right = fixed
  **480px** white form panel, form content capped at **340px**, vertically centered.
  The top app nav is **hidden** on this screen.
- **Left brand panel:** teal gradient `linear-gradient(150deg,#0E7A70,#12B5A5)`,
  48px padding, space-between column. Top: logo (icon + "Cascade Academy" all white).
  Middle: title "Schön, dass du wieder da bist." (Bricolage 32/800) + subtitle +
  3 feature rows, each a 24px rounded-square check chip `rgba(255,255,255,0.2)` +
  text. Bottom: testimonial line at `rgba(255,255,255,0.75)`. Two off-edge light circles.
- **Right form:** Title "Willkommen zurück" (27/700), subtitle. Fields: **E-Mail**
  (`du@beispiel.de`) and **Passwort** (`••••••••`), label 13/600, input
  border `#DCEBE7`, bg `#FBFDFC`, radius 11px, padding 12×14, focus ring as above.
  "vergessen?" link (teal) on the password row. Primary button **Anmelden**
  (teal, full width). "oder" divider. Secondary button **Ohne Konto loslernen**
  (teal text on `#DFF6F3`) + hint "Dein Fortschritt wird lokal im Browser
  gespeichert." Footer: "Neu hier? **Konto erstellen**".
- **Behavior:** Anmelden / Ohne Konto / Konto erstellen all navigate to Course Overview.

### 1 · Course Overview (Kursübersicht)
- **Purpose:** Hub — resume learning, browse courses.
- **Layout:** max-width 1180px. Hero banner, then "Deine Kurse" heading row, then
  a **3-column card grid** (gap 22px).
- **Hero:** teal gradient, radius 22px, 40×44 padding, two off-edge light circles.
  Pill "CSS lernen by doing" · title "Schreib echtes CSS, sieh es sofort." (36/800)
  · subtitle · white CTA "Weiterlernen →" (teal text) + "8 von 25 Lektionen geschafft".
- **Course card (active):** white, border `#DCEBE7`, radius 18px. Top: 120px teal
  gradient cover with `{ }` mono glyph top-left, off-edge circle, course title
  bottom-left (Bricolage 22/800 white). Body: two chips ("Anfänger", "25 Lektionen"),
  progress bar (track `#EAF2F0`, fill `#12B5A5`, 8px, radius 99px) + "32 % · 8 / 25
  Lektionen", then full-width teal button "Weiterlernen →" pinned to bottom.
  Hover: lift `translateY(-3px)` + stronger shadow. Click → Course Detail.
- **Course card (locked):** muted gray-teal cover with 🔒 centered, `opacity:0.85`,
  body shows a single "Mittel"/"Fortgeschritten" chip + unlock hint. Not clickable.
  Two locked examples: "Flexbox & Layout", "Animationen".

### 2 · Course Detail (Kursdetail)
- **Purpose:** See chapters/lessons and their status; enter the current lesson.
- **Layout:** max-width 920px. Back link "← Alle Kurse" → Overview. Course header
  banner, then chapter sections.
- **Header banner:** teal gradient, radius 20px, off-edge circle. Two chips
  ("Anfänger", "25 Lektionen · 5 Kapitel"), title "CSS-Grundlagen" (30/800),
  description, progress bar (track `rgba(255,255,255,0.25)`, fill white) + "32 % · 8 / 25".
- **Chapter block:** heading (Bricolage 18/700) + status badge — "abgeschlossen"
  (`#2BB673` on `#E5F6ED`) or "in Arbeit" (`#0E7A70` on `#DFF6F3`). Below, a column
  of lesson rows (gap 9px).
- **Lesson row states:**
  - *Done:* white card, 26px green circle with white ✓, title, right-aligned type chip ("Lesen"/"Übung").
  - *Current:* white card with **2px `#12B5A5` border** + teal glow shadow; 26px
    teal-outline circle with ▶; title + teal subtitle "Hier geht's weiter"; teal
    "Starten →" button. Click → Lesson Editor.
  - *Locked:* `#FBFDFC` bg, **dashed** border `#CFE0DC`, `opacity:0.75`, gray 🔒
    circle, muted title, "gesperrt" label. Not clickable.

### 3 · Lesson Editor (Lektion)  ← core screen
- **Purpose:** Read the task, write CSS, see live preview, get it checked.
- **Layout:** max-width 1180px, one white rounded panel (radius 18px) containing:
  top bar → task strip → **2-column body (55% / 45%)** → footer.
- **Top bar:** back arrow (→ Detail), breadcrumb "CSS-Grundlagen › Kapitel 2" +
  lesson title "Farben & Textausrichtung" (20/700). Right side: **Hell/Dunkel code
  switch** (segmented pill: "☀ Hell" / "☾ Dunkel"), "Lektion 12 / 25" + 130px
  progress bar (48% filled), and a ✕ close (→ Detail).
- **Task strip:** full-width `#DFF6F3` band, bottom border `#CDEDE8`. 30px teal
  rounded-square with ✦, uppercase eyebrow "DEINE AUFGABE" (teal), task text:
  *"Gib der Überschrift die Farbe **teal** und zentriere den Text mit `text-align`."*
  (`text-align` shown as an inline mono code chip). Right: "💡 Hinweis" button.
- **Left column (55%) — editor:**
  - "HTML" label + "vorgegeben" chip. Read-only code block themed by the active
    code theme (default dark `#16162A`), showing `<h1>Willkommen</h1>` / `<p>…</p>`.
  - "CSS" label + "dein Code" chip (teal). Editor block (theme bg, e.g. dark
    `#1B1A2E`) with a 42px gutter (line numbers 1–4) and syntax-highlighted CSS:
    `h1 { color: teal; text-align: center; }`. Tag/prop/value colors per theme table.
- **Right column (45%) — preview + check:**
  - "LIVE-VORSCHAU" label + green "● aktualisiert". White preview box rendering the
    result: "Willkommen" heading in **`#008080` (teal), centered**, plus two gray
    placeholder text bars. (In production this is an iframe rendering the user's CSS.)
  - Check panel: `#F3FAF8` bg, "PRÜFUNG" + "1 / 2 erfüllt". Two check rows (mono):
    *passed* = 19px green circle + ✓ ("h1 · color: teal"); *pending* = hollow
    circle outline ("h1 · text-align: center"). Teal "Code prüfen" button.
- **Footer:** "← Zurück" (→ Detail) on the left; "Lösung anzeigen" (text) + teal
  "Weiter →" on the right.
- **The code theme switch only re-themes the two code blocks** — the rest of the UI
  stays light. Implemented via CSS variables scoped to the editor subtree.

### 4 · Profile (Profil)
- **Purpose:** Show progress and connect with other learners (live chat).
- **Layout:** max-width 920px. Identity banner → 3 stat tiles → live chat.
- **Identity banner:** teal gradient (`125deg,#0E7A70→#12B5A5→#3AC9B0`), radius 22px,
  two off-edge light circles. 76px rounded avatar "MK" (translucent white,
  2px white border), name "Mara K." (26/800 white) + "Lernt seit 12 Tagen ·
  Fortschritt lokal gespeichert", and a streak chip (🔥 + "5 / Tage Streak") in a
  `rgba(255,255,255,0.16)` rounded box.
- **Stat tiles (3-col grid):** each radius 16px, colored gradient + matching border,
  a soft accent circle bottom-right (off-edge) and a white icon bubble top-right.
  1) 📘 "8 / Lektionen erledigt" (teal), 2) 🎯 "1 / Kapitel abgeschlossen" (orange),
  3) 📈 "32 % / CSS-Grundlagen" (violet). Numbers Bricolage 32/800.
- **Live chat:** heading "Live-Chat · wer ist online" + green "● 14 online".
  White panel, radius 18px, min-height 360px, split into a **262px left rail** +
  flexible thread.
  - *Left rail:* filter segmented control with two pills — **"Alle · 14"** and
    **"Mein Kurs · 5"** (active pill = teal bg, white text; inactive = muted text,
    transparent). Below, the online-user list for the active filter: each row is a
    30px colored initials avatar + name + right-aligned course tag; **mentors** get
    an orange "Mentor" badge (`#C2410C` on `#FCEAE0`). In "Mein Kurs", the current
    user "Du" row is highlighted (`#DFF6F3`, teal avatar) with an "ich" tag.
  - *Thread:* a "Heute" date divider, then message bubbles — incoming (left,
    `#F1F6F5`, radius 13/13/13/4), own (right, teal bg white text, radius 13/13/4/13),
    and a mentor message (`#FCEFE7` bg, `#F6DDCB` border). Code answers use mono font.
    Input row: placeholder "Nachricht schreiben…" + 42px teal send button "➤".

---

## Interactions & Behavior
- **Navigation** (single source, no real routing in the prototype):
  - Top nav: logo & "Kurse" → Overview; "Profil" → Profile; **avatar → Login**.
  - Overview hero CTA & active course card → Detail.
  - Detail current-lesson row / "Starten →" → Lesson Editor.
  - Lesson back-arrow / ✕ / "← Zurück" → Detail.
  - Login Anmelden / Ohne Konto / Konto erstellen → Overview.
  - Nav is hidden on Login; active nav item gets a `#DFF6F3` pill + `#0E7A70` text.
- **Code theme toggle (Lesson):** Hell/Dunkel switches only the code blocks' colors.
- **Chat filter toggle (Profile):** "Alle" ↔ "Mein Kurs" swaps the user list.
- **Hover:** active course card lifts; primary buttons darken
  (`#12B5A5`→`#0E9C8E`), secondary teal-soft (`#DFF6F3`→`#CDEDE8`); inputs show focus ring.
- **Not yet wired (prototype stubs to implement):** real auth, the CSS editor
  (use CodeMirror/Monaco), the live-preview iframe, the checker, and chat send.

### The checker (key functional spec)
Each lesson defines assertions like `{ selector:'h1', prop:'color', expected:'teal' }`.
On "Code prüfen": render the user's HTML+CSS in a sandboxed iframe, then read
`getComputedStyle(el).getPropertyValue(prop)` for each assertion and compare to the
expected value (normalize, e.g. `teal`/`#008080`/`rgb(0,128,128)` are equal). Show
per-assertion pass/fail and a "x / n erfüllt" count; all-pass enables "Weiter →".

## State Management
- `screen`: `'login' | 'overview' | 'detail' | 'editor' | 'profile'` (replace with
  real routes/URLs in production).
- `codeTheme`: `'light' | 'dark'` (default `'dark'`; persist per user).
- `chatFilter`: `'all' | 'course'`.
- Lesson runtime (production): `userCss` string, `checkResults[]`, `lessonProgress`.
- Course/lesson/chapter data and progress (per the concept: progress stored locally
  for guests; server-side once an account exists). Streak & stats derive from progress.
- Live chat: online-users list + messages (websocket/realtime in production).

## Assets
- **No external image assets.** All visuals are CSS (gradients, the off-edge light
  circles) and Unicode/emoji glyphs (🔥 📘 🎯 📈 🔒 ✓ ✦ ▶ ➤ 💡 ☀ ☾, `{ }`).
  Swap emoji for the codebase's icon set if one exists.
- **Logo:** the "cascade" mark is three descending rounded bars (18/13/8px wide,
  3px tall, decreasing opacity) in an 11px-radius teal rounded square — recreate as
  an inline SVG. Wordmark: "Cascade" (`#1F2A28`) + "Academy" (`#0E7A70`), Bricolage 800.
- **Fonts:** Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono (Google Fonts).
- **Illustrations:** not included — an illustration style was explored
  (`Illustrations-Stile.dc.html`) but not finalized. Hero/cover/empty-states
  currently use gradients + circles; illustrations can be added later.

## Screenshots
Rendered references in `screenshots/` (high-res, correct fonts):
- `0-login.png` — Login (split layout)
- `1-kursuebersicht.png` — Course Overview (hero + course grid)
- `2-kursdetail.png` — Course Detail (chapters & lesson states)
- `3-lektion-dunkel.png` — Lesson Editor, **dark** code theme (default)
- `3-lektion-hell.png` — Lesson Editor, **light** code theme
- `4-profil.png` — Profile (banner, colored stat tiles, chat — "Alle" filter)
- `4-profil-chat-meinkurs.png` — Profile chat with "Mein Kurs" filter active

## Files
- **`Cascade Academy.dc.html`** — ⭐ the complete hi-fi design, all five screens. Primary reference.
- `Lektion Hi-Fi.dc.html` — earlier hifi study of the Lesson screen with a 4-palette
  + light/dark color explorer (shows how the teal palette was chosen). Reference only.
- `Illustrations-Stile.dc.html` — four candidate illustration styles (undecided). Reference only.
- `Wireframes - LernCSS.dc.html` — original **low-fidelity** wireframes for all four
  core screens incl. the 3 lesson-layout variants (Variant A was chosen). Structure/flow reference.

> Note: `.dc.html` files include a small prototyping runtime and inline styles.
> Read them for layout/values; do not ship the runtime. Open any file in a browser
> to view it.
